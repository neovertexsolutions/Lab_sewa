from django.db import models, transaction
from django.contrib.auth.models import User
from django.conf import settings
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator


# ============================================================
# COMMON
# ============================================================

class TimeStampedModel(models.Model):
    """
    Common created / updated timestamps.
    """

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


# ============================================================
# USER PROFILE
# ============================================================

class UserProfile(models.Model):

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="profile"
    )

    phone = models.CharField(
        max_length=20,
        blank=True,
        null=True
    )

    role = models.CharField(
        max_length=50,
        default="Staff"
    )

    def __str__(self):
        return self.user.username


# ============================================================
# DOCTORS
# ============================================================

class Doctor(models.Model):

    name = models.CharField(
        max_length=100
    )

    role = models.CharField(
        max_length=100
    )

    status = models.CharField(
        max_length=50,
        default="online"
    )

    image_url = models.URLField(
        max_length=500,
        blank=True,
        null=True
    )

    def __str__(self):
        return self.name


# ============================================================
# PATIENT
# ============================================================

class Patient(models.Model):

    GENDER_CHOICES = [
        ("male", "Male"),
        ("female", "Female"),
        ("other", "Other"),
    ]

    STATUS_CHOICES = [
        ("active", "Active"),
        ("pending", "Pending"),
        ("completed", "Completed"),
    ]

    patient_id = models.CharField(
        max_length=30,
        unique=True,
        editable=False
    )

    first_name = models.CharField(
        max_length=100
    )

    last_name = models.CharField(
        max_length=100,
        blank=True
    )

    gender = models.CharField(
        max_length=10,
        choices=GENDER_CHOICES,
        default="other"
    )

    age = models.PositiveIntegerField(
        default=0
    )

    phone = models.CharField(
        max_length=20
    )

    email = models.EmailField(
        blank=True,
        null=True
    )

    address = models.TextField(
        blank=True,
        null=True
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending"
    )

    last_visit = models.DateField(
        default=timezone.localdate,
        db_index=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def save(self, *args, **kwargs):

        if not self.patient_id:

            with transaction.atomic():

                last_patient = (
                    Patient.objects
                    .select_for_update()
                    .order_by("-id")
                    .first()
                )

                number = 1001

                if last_patient and last_patient.patient_id:

                    try:
                        number = (
                            int(
                                last_patient.patient_id
                                .split("-")[-1]
                            )
                            + 1
                        )

                    except (ValueError, IndexError):

                        number = last_patient.id + 1001

                self.patient_id = f"SPL-2026-{number}"

                super().save(*args, **kwargs)

            return

        super().save(*args, **kwargs)

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def __str__(self):
        return f"{self.patient_id} - {self.full_name}"


# ============================================================
# APPOINTMENTS
# ============================================================

class Appointment(models.Model):

    STATUS_CHOICES = [
        ("scheduled", "Scheduled"),
        ("confirmed", "Confirmed"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    ]

    patient = models.ForeignKey(
        Patient,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="appointments"
    )

    patient_name = models.CharField(
        max_length=150
    )

    date = models.DateField(
        db_index=True
    )

    time = models.TimeField()

    test_type = models.CharField(
        max_length=150
    )

    doctor = models.ForeignKey(
        Doctor,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="appointments"
    )

    status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default="scheduled",
        db_index=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return f"{self.patient_name} - {self.date} {self.time}"


# ============================================================
# BILLING / INVOICE
# ============================================================

class Invoice(models.Model):

    PAYMENT_METHOD_CHOICES = [
        ("cash", "Cash"),
        ("upi", "UPI"),
        ("card", "Card"),
        ("due", "Due"),
    ]

    patient = models.ForeignKey(
        Patient,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="invoices"
    )

    patient_name = models.CharField(
        max_length=255
    )

    phone = models.CharField(
        max_length=20,
        blank=True,
        null=True
    )

    doctor_name = models.CharField(
        max_length=255,
        blank=True,
        null=True
    )

    subtotal = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    discount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    payment_method = models.CharField(
        max_length=20,
        choices=PAYMENT_METHOD_CHOICES,
        default="cash",
        db_index=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return (
            f"Invoice #{self.id} - "
            f"{self.patient_name} "
            f"(Rs.{self.total})"
        )


class InvoiceItem(models.Model):

    invoice = models.ForeignKey(
        Invoice,
        related_name="items",
        on_delete=models.CASCADE
    )

    test_name = models.CharField(
        max_length=255
    )

    price = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    quantity = models.PositiveIntegerField(
        default=1
    )

    def __str__(self):
        return f"{self.test_name} - Rs.{self.price}"


# ============================================================
# DASHBOARD
# ============================================================

class DashboardStats(models.Model):

    total_patients = models.PositiveIntegerField(
        default=0
    )

    patients_trend = models.CharField(
        max_length=20,
        default="0%"
    )

    todays_patients = models.PositiveIntegerField(
        default=0
    )

    revenue_mtd = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    pending_reports = models.PositiveIntegerField(
        default=0
    )

    appointments_count = models.PositiveIntegerField(
        default=0
    )

    completed_reports = models.PositiveIntegerField(
        default=0
    )

    inventory_alerts = models.PositiveIntegerField(
        default=0
    )

    staff_online = models.CharField(
        max_length=20,
        default="0/0"
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return f"Dashboard Stats #{self.pk}"


# ============================================================
# ACTIVITY
# ============================================================

class Activity(models.Model):

    ACTIVITY_TYPES = [
        ("success", "Success"),
        ("info", "Info"),
        ("warning", "Warning"),
        ("danger", "Danger"),
    ]

    title = models.CharField(
        max_length=200
    )

    description = models.CharField(
        max_length=300
    )

    activity_type = models.CharField(
        max_length=50,
        choices=ACTIVITY_TYPES,
        default="info"
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True
    )

    @property
    def time_ago_display(self):

        now = timezone.now()

        difference = now - self.created_at

        seconds = int(
            difference.total_seconds()
        )

        if seconds < 60:
            return "Just now"

        minutes = seconds // 60

        if minutes < 60:
            return f"{minutes} min ago"

        hours = minutes // 60

        if hours < 24:
            return (
                f"{hours} hour ago"
                if hours == 1
                else f"{hours} hours ago"
            )

        days = hours // 24

        if days == 1:
            return "Yesterday"

        return f"{days} days ago"

    def __str__(self):
        return self.title


# ============================================================
# SCHEDULE
# ============================================================

class Schedule(models.Model):

    patient = models.ForeignKey(
        Patient,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="schedules"
    )

    patient_name = models.CharField(
        max_length=150
    )

    schedule_date = models.DateField(
        default=timezone.localdate,
        db_index=True
    )

    time_slot = models.CharField(
        max_length=50
    )

    badge_type = models.CharField(
        max_length=50,
        default="blue"
    )

    tests_summary = models.CharField(
        max_length=250
    )

    is_completed = models.BooleanField(
        default=False,
        db_index=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.patient_name} at {self.time_slot}"


# ============================================================
# INVENTORY
# ============================================================

class InventoryItem(models.Model):

    name = models.CharField(
        max_length=255
    )

    category = models.CharField(
        max_length=100
    )

    stock = models.IntegerField(
        default=0,
        db_index=True
    )

    unit = models.CharField(
        max_length=50
    )

    supplier = models.CharField(
        max_length=255
    )

    expiry = models.DateField(
        blank=True,
        null=True
    )

    icon = models.CharField(
        max_length=50,
        default="science"
    )

    icon_class = models.CharField(
        max_length=50,
        default="reagents"
    )

    category_class = models.CharField(
        max_length=50,
        default="reagents"
    )

    alert = models.CharField(
        max_length=50,
        blank=True,
        null=True
    )

    alert_text = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return f"{self.name} ({self.stock} {self.unit})"


# ============================================================
# PURCHASE ORDER
# ============================================================

class PurchaseOrder(models.Model):

    STATUS_CHOICES = [
        ("processing", "Processing"),
        ("in-transit", "In Transit"),
        ("delivered", "Delivered"),
        ("cancelled", "Cancelled"),
    ]

    order_id = models.CharField(
        max_length=50,
        unique=True
    )

    supplier = models.CharField(
        max_length=255
    )

    status = models.CharField(
        max_length=50,
        choices=STATUS_CHOICES,
        default="processing"
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return f"{self.order_id} - {self.supplier}"


# ============================================================
# REPORT METRIC
# ============================================================

class ReportMetric(models.Model):

    STATUS_CHOICES = [
        ("Pending", "Pending"),
        ("Processing", "Processing"),
        ("Completed", "Completed"),
        ("Cancelled", "Cancelled"),
    ]

    report_title = models.CharField(
        max_length=150
    )

    department = models.CharField(
        max_length=100,
        default="All Departments"
    )

    total_revenue = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    patient_count = models.PositiveIntegerField(
        default=0
    )

    status = models.CharField(
        max_length=50,
        choices=STATUS_CHOICES,
        default="Completed",
        db_index=True
    )

    generated_date = models.DateTimeField(
        auto_now_add=True,
        db_index=True
    )

    def __str__(self):
        return f"{self.report_title} - {self.department}"


# ============================================================
# LABORATORY SETTINGS
# ============================================================

class LaboratorySettings(TimeStampedModel):

    lab_name = models.CharField(
        max_length=255,
        default="Sita Path Lab Enterprise"
    )

    legal_name = models.CharField(
        max_length=255,
        blank=True,
        default=""
    )

    registration_number = models.CharField(
        max_length=100,
        blank=True,
        default=""
    )

    license_number = models.CharField(
        max_length=100,
        blank=True,
        default=""
    )

    tax_number = models.CharField(
        max_length=100,
        blank=True,
        default=""
    )

    contact_number = models.CharField(
        max_length=30,
        blank=True,
        default=""
    )

    alternate_contact = models.CharField(
        max_length=30,
        blank=True,
        default=""
    )

    email = models.EmailField(
        blank=True,
        default=""
    )

    website = models.URLField(
        blank=True,
        default=""
    )

    address = models.TextField(
        blank=True,
        default=""
    )

    city = models.CharField(
        max_length=100,
        blank=True,
        default=""
    )

    state = models.CharField(
        max_length=100,
        blank=True,
        default=""
    )

    country = models.CharField(
        max_length=100,
        default="India"
    )

    postal_code = models.CharField(
        max_length=20,
        blank=True,
        default=""
    )

    timezone = models.CharField(
        max_length=100,
        default="Asia/Kolkata"
    )

    currency = models.CharField(
        max_length=10,
        default="INR"
    )

    date_format = models.CharField(
        max_length=50,
        default="DD/MM/YYYY"
    )

    invoice_prefix = models.CharField(
        max_length=20,
        default="INV"
    )

    patient_id_prefix = models.CharField(
        max_length=20,
        default="PAT"
    )

    report_prefix = models.CharField(
        max_length=20,
        default="RPT"
    )

    is_active = models.BooleanField(
        default=True
    )

    # Old field retained for database compatibility.
    primary_color = models.CharField(
        max_length=50,
        default="#004AC6"
    )

    system_theme = models.CharField(
        max_length=20,
        default="light"
    )

    smtp_host = models.CharField(
        max_length=255,
        blank=True,
        null=True
    )

    smtp_port = models.PositiveIntegerField(
        default=587
    )

    smtp_email = models.EmailField(
        blank=True,
        null=True
    )

    backup_frequency = models.CharField(
        max_length=50,
        default="Daily at Midnight"
    )

    class Meta:
        verbose_name = "Laboratory Settings"
        verbose_name_plural = "Laboratory Settings"

    def __str__(self):
        return self.lab_name


# ============================================================
# BRANDING SETTINGS
# ============================================================

class BrandingSettings(TimeStampedModel):

    THEME_LIGHT = "light"
    THEME_DARK = "dark"
    THEME_SYSTEM = "system"

    THEME_CHOICES = [
        (THEME_LIGHT, "Light"),
        (THEME_DARK, "Dark"),
        (THEME_SYSTEM, "System"),
    ]

    laboratory = models.OneToOneField(
        LaboratorySettings,
        on_delete=models.CASCADE,
        related_name="branding"
    )

    logo = models.ImageField(
        upload_to="settings/logos/",
        blank=True,
        null=True
    )

    favicon = models.ImageField(
        upload_to="settings/favicons/",
        blank=True,
        null=True
    )

    primary_color = models.CharField(
        max_length=20,
        default="#004AC6"
    )

    secondary_color = models.CharField(
        max_length=20,
        default="#7C3AED"
    )

    accent_color = models.CharField(
        max_length=20,
        default="#16A34A"
    )

    theme = models.CharField(
        max_length=20,
        choices=THEME_CHOICES,
        default=THEME_LIGHT
    )

    font_family = models.CharField(
        max_length=100,
        default="Inter"
    )

    border_radius = models.PositiveSmallIntegerField(
        default=12,
        validators=[
            MinValueValidator(0),
            MaxValueValidator(50),
        ]
    )

    custom_css = models.TextField(
        blank=True,
        default=""
    )

    show_branding = models.BooleanField(
        default=True
    )

    class Meta:
        verbose_name = "Branding Settings"
        verbose_name_plural = "Branding Settings"

    def __str__(self):
        return f"Branding - {self.laboratory.lab_name}"


# ============================================================
# EMAIL SETTINGS
# ============================================================

class EmailSettings(TimeStampedModel):

    SECURITY_NONE = "none"
    SECURITY_SSL = "ssl"
    SECURITY_TLS = "tls"

    SECURITY_CHOICES = [
        (SECURITY_NONE, "None"),
        (SECURITY_SSL, "SSL"),
        (SECURITY_TLS, "TLS"),
    ]

    laboratory = models.OneToOneField(
        LaboratorySettings,
        on_delete=models.CASCADE,
        related_name="email_settings"
    )

    enabled = models.BooleanField(
        default=False
    )

    host = models.CharField(
        max_length=255,
        blank=True,
        default=""
    )

    port = models.PositiveIntegerField(
        default=587
    )

    username = models.CharField(
        max_length=255,
        blank=True,
        default=""
    )

    password = models.TextField(
        blank=True,
        default=""
    )

    security = models.CharField(
        max_length=10,
        choices=SECURITY_CHOICES,
        default=SECURITY_TLS
    )

    from_name = models.CharField(
        max_length=255,
        blank=True,
        default=""
    )

    from_email = models.EmailField(
        blank=True,
        default=""
    )

    reply_to = models.EmailField(
        blank=True,
        default=""
    )

    test_email = models.EmailField(
        blank=True,
        default=""
    )

    last_tested_at = models.DateTimeField(
        blank=True,
        null=True
    )

    last_test_success = models.BooleanField(
        default=False
    )

    class Meta:
        verbose_name = "Email Settings"
        verbose_name_plural = "Email Settings"

    def __str__(self):
        return f"Email - {self.laboratory.lab_name}"


# ============================================================
# MESSAGING SETTINGS
# ============================================================

class MessagingSettings(TimeStampedModel):

    PROVIDER_META = "meta"
    PROVIDER_TWILIO = "twilio"
    PROVIDER_MSG91 = "msg91"
    PROVIDER_CUSTOM = "custom"

    PROVIDER_CHOICES = [
        (PROVIDER_META, "Meta WhatsApp"),
        (PROVIDER_TWILIO, "Twilio"),
        (PROVIDER_MSG91, "MSG91"),
        (PROVIDER_CUSTOM, "Custom Provider"),
    ]

    laboratory = models.OneToOneField(
        LaboratorySettings,
        on_delete=models.CASCADE,
        related_name="messaging_settings"
    )

    whatsapp_enabled = models.BooleanField(
        default=False
    )

    sms_enabled = models.BooleanField(
        default=False
    )

    provider = models.CharField(
        max_length=30,
        choices=PROVIDER_CHOICES,
        default=PROVIDER_CUSTOM
    )

    api_url = models.URLField(
        blank=True,
        default=""
    )

    api_key = models.TextField(
        blank=True,
        default=""
    )

    api_secret = models.TextField(
        blank=True,
        default=""
    )

    account_id = models.CharField(
        max_length=255,
        blank=True,
        default=""
    )

    sender_id = models.CharField(
        max_length=100,
        blank=True,
        default=""
    )

    whatsapp_business_id = models.CharField(
        max_length=255,
        blank=True,
        default=""
    )

    whatsapp_phone_number_id = models.CharField(
        max_length=255,
        blank=True,
        default=""
    )

    webhook_url = models.URLField(
        blank=True,
        default=""
    )

    webhook_verify_token = models.TextField(
        blank=True,
        default=""
    )

    test_phone_number = models.CharField(
        max_length=30,
        blank=True,
        default=""
    )

    last_tested_at = models.DateTimeField(
        blank=True,
        null=True
    )

    last_test_success = models.BooleanField(
        default=False
    )

    class Meta:
        verbose_name = "Messaging Settings"
        verbose_name_plural = "Messaging Settings"

    def __str__(self):
        return f"Messaging - {self.laboratory.lab_name}"


# ============================================================
# NOTIFICATION SETTINGS
# ============================================================

class NotificationSettings(TimeStampedModel):

    laboratory = models.OneToOneField(
        LaboratorySettings,
        on_delete=models.CASCADE,
        related_name="notification_settings"
    )

    email_notifications = models.BooleanField(
        default=True
    )

    sms_notifications = models.BooleanField(
        default=True
    )

    whatsapp_notifications = models.BooleanField(
        default=False
    )

    report_ready_notification = models.BooleanField(
        default=True
    )

    appointment_notification = models.BooleanField(
        default=True
    )

    payment_notification = models.BooleanField(
        default=True
    )

    invoice_notification = models.BooleanField(
        default=True
    )

    low_stock_notification = models.BooleanField(
        default=True
    )

    backup_notification = models.BooleanField(
        default=True
    )

    failed_login_notification = models.BooleanField(
        default=True
    )

    class Meta:
        verbose_name = "Notification Settings"
        verbose_name_plural = "Notification Settings"

    def __str__(self):
        return f"Notifications - {self.laboratory.lab_name}"


# ============================================================
# ACCESS ROLES
# ============================================================

class AccessRole(TimeStampedModel):

    name = models.CharField(
        max_length=100,
        unique=True
    )

    # Nullable initially so existing database rows can migrate.
    code = models.SlugField(
        max_length=100,
        unique=True,
        blank=True,
        null=True
    )

    description = models.TextField(
        blank=True,
        default=""
    )

    is_system_role = models.BooleanField(
        default=False
    )

    is_active = models.BooleanField(
        default=True
    )

    # Old field retained intentionally for compatibility.
    # Do NOT remove until existing data is migrated.
    locked = models.BooleanField(
        default=True
    )

    priority = models.PositiveIntegerField(
        default=100
    )

    class Meta:
        ordering = ["priority", "name"]
        verbose_name = "Access Role"
        verbose_name_plural = "Access Roles"

    def save(self, *args, **kwargs):

        if not self.code:

            base_code = (
                self.name.lower()
                .strip()
                .replace(" ", "-")
            )

            code = base_code
            counter = 1

            while (
                AccessRole.objects
                .filter(code=code)
                .exclude(pk=self.pk)
                .exists()
            ):
                counter += 1
                code = f"{base_code}-{counter}"

            self.code = code

        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


# ============================================================
# PERMISSIONS
# ============================================================

class Permission(TimeStampedModel):

    ACTION_VIEW = "view"
    ACTION_CREATE = "create"
    ACTION_UPDATE = "update"
    ACTION_DELETE = "delete"
    ACTION_EXPORT = "export"
    ACTION_APPROVE = "approve"
    ACTION_MANAGE = "manage"

    ACTION_CHOICES = [
        (ACTION_VIEW, "View"),
        (ACTION_CREATE, "Create"),
        (ACTION_UPDATE, "Update"),
        (ACTION_DELETE, "Delete"),
        (ACTION_EXPORT, "Export"),
        (ACTION_APPROVE, "Approve"),
        (ACTION_MANAGE, "Manage"),
    ]

    module = models.CharField(
        max_length=100
    )

    action = models.CharField(
        max_length=30,
        choices=ACTION_CHOICES
    )

    name = models.CharField(
        max_length=150
    )

    description = models.TextField(
        blank=True,
        default=""
    )

    is_active = models.BooleanField(
        default=True
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["module", "action"],
                name="unique_module_action_permission"
            )
        ]

        ordering = ["module", "action"]

    def __str__(self):
        return f"{self.module}.{self.action}"


# ============================================================
# ROLE PERMISSIONS
# ============================================================

class RolePermission(TimeStampedModel):

    role = models.ForeignKey(
        AccessRole,
        on_delete=models.CASCADE,
        related_name="role_permissions"
    )

    permission = models.ForeignKey(
        Permission,
        on_delete=models.CASCADE,
        related_name="role_permissions"
    )

    allowed = models.BooleanField(
        default=True
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["role", "permission"],
                name="role_permission"
            )
        ]

    def __str__(self):
        return f"{self.role.name} - {self.permission}"


# ============================================================
# BACKUP SETTINGS
# ============================================================

class BackupSettings(TimeStampedModel):

    FREQUENCY_MANUAL = "manual"
    FREQUENCY_HOURLY = "hourly"
    FREQUENCY_DAILY = "daily"
    FREQUENCY_WEEKLY = "weekly"
    FREQUENCY_MONTHLY = "monthly"

    FREQUENCY_CHOICES = [
        (FREQUENCY_MANUAL, "Manual"),
        (FREQUENCY_HOURLY, "Hourly"),
        (FREQUENCY_DAILY, "Daily"),
        (FREQUENCY_WEEKLY, "Weekly"),
        (FREQUENCY_MONTHLY, "Monthly"),
    ]

    STORAGE_LOCAL = "local"
    STORAGE_S3 = "s3"
    STORAGE_CUSTOM = "custom"

    STORAGE_CHOICES = [
        (STORAGE_LOCAL, "Local Storage"),
        (STORAGE_S3, "Amazon S3"),
        (STORAGE_CUSTOM, "Custom Storage"),
    ]

    laboratory = models.OneToOneField(
        LaboratorySettings,
        on_delete=models.CASCADE,
        related_name="backup_settings"
    )

    enabled = models.BooleanField(
        default=True
    )

    frequency = models.CharField(
        max_length=20,
        choices=FREQUENCY_CHOICES,
        default=FREQUENCY_DAILY
    )

    backup_time = models.TimeField(
        default="00:00"
    )

    day_of_week = models.PositiveSmallIntegerField(
        default=1,
        validators=[
            MinValueValidator(1),
            MaxValueValidator(7),
        ]
    )

    retention_days = models.PositiveIntegerField(
        default=30
    )

    retention_count = models.PositiveIntegerField(
        default=30
    )

    storage_backend = models.CharField(
        max_length=20,
        choices=STORAGE_CHOICES,
        default=STORAGE_LOCAL
    )

    storage_path = models.CharField(
        max_length=500,
        blank=True,
        default=""
    )

    bucket_name = models.CharField(
        max_length=255,
        blank=True,
        default=""
    )

    region = models.CharField(
        max_length=100,
        blank=True,
        default=""
    )

    encrypted = models.BooleanField(
        default=True
    )

    compression_enabled = models.BooleanField(
        default=True
    )

    verify_after_backup = models.BooleanField(
        default=True
    )

    class Meta:
        verbose_name = "Backup Settings"
        verbose_name_plural = "Backup Settings"

    def __str__(self):
        return f"Backup - {self.laboratory.lab_name}"


# ============================================================
# BACKUP RECORD
# ============================================================

class BackupRecord(TimeStampedModel):

    STATUS_RUNNING = "running"
    STATUS_SUCCESS = "success"
    STATUS_FAILED = "failed"
    STATUS_RESTORED = "restored"

    STATUS_CHOICES = [
        (STATUS_RUNNING, "Running"),
        (STATUS_SUCCESS, "Success"),
        (STATUS_FAILED, "Failed"),
        (STATUS_RESTORED, "Restored"),
    ]

    TYPE_MANUAL = "manual"
    TYPE_AUTOMATIC = "automatic"

    TYPE_CHOICES = [
        (TYPE_MANUAL, "Manual"),
        (TYPE_AUTOMATIC, "Automatic"),
    ]

    laboratory = models.ForeignKey(
        LaboratorySettings,
        on_delete=models.CASCADE,
        related_name="backups"
    )

    backup_type = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        default=TYPE_MANUAL
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_RUNNING
    )

    file_name = models.CharField(
        max_length=500,
        blank=True,
        default=""
    )

    file_path = models.TextField(
        blank=True,
        default=""
    )

    file_size = models.BigIntegerField(
        default=0
    )

    checksum = models.CharField(
        max_length=128,
        blank=True,
        default=""
    )

    database_name = models.CharField(
        max_length=255,
        blank=True,
        default=""
    )

    started_at = models.DateTimeField(
        default=timezone.now
    )

    completed_at = models.DateTimeField(
        blank=True,
        null=True
    )

    verified = models.BooleanField(
        default=False
    )

    error_message = models.TextField(
        blank=True,
        default=""
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_lab_backups"
    )

    class Meta:
        ordering = ["-created_at"]

        indexes = [
            models.Index(
                fields=["laboratory", "-created_at"]
            ),
            models.Index(
                fields=["status"]
            ),
        ]

    def __str__(self):
        return self.file_name or f"Backup #{self.pk}"


# ============================================================
# RESTORE HISTORY
# ============================================================

class RestoreRecord(TimeStampedModel):

    STATUS_PENDING = "pending"
    STATUS_RUNNING = "running"
    STATUS_SUCCESS = "success"
    STATUS_FAILED = "failed"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_RUNNING, "Running"),
        (STATUS_SUCCESS, "Success"),
        (STATUS_FAILED, "Failed"),
    ]

    laboratory = models.ForeignKey(
        LaboratorySettings,
        on_delete=models.CASCADE,
        related_name="restore_records"
    )

    backup = models.ForeignKey(
        BackupRecord,
        on_delete=models.PROTECT,
        related_name="restore_records"
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING
    )

    started_at = models.DateTimeField(
        blank=True,
        null=True
    )

    completed_at = models.DateTimeField(
        blank=True,
        null=True
    )

    error_message = models.TextField(
        blank=True,
        default=""
    )

    restored_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="restore_operations"
    )

    ip_address = models.GenericIPAddressField(
        blank=True,
        null=True
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Restore #{self.pk} - {self.status}"


# ============================================================
# SETTINGS AUDIT LOG
# ============================================================

class SettingsAuditLog(TimeStampedModel):

    ACTION_CREATE = "create"
    ACTION_UPDATE = "update"
    ACTION_DELETE = "delete"
    ACTION_LOGIN = "login"
    ACTION_LOGOUT = "logout"
    ACTION_BACKUP = "backup"
    ACTION_RESTORE = "restore"
    ACTION_PERMISSION = "permission"
    ACTION_INTEGRATION = "integration"

    ACTION_CHOICES = [
        (ACTION_CREATE, "Create"),
        (ACTION_UPDATE, "Update"),
        (ACTION_DELETE, "Delete"),
        (ACTION_LOGIN, "Login"),
        (ACTION_LOGOUT, "Logout"),
        (ACTION_BACKUP, "Backup"),
        (ACTION_RESTORE, "Restore"),
        (ACTION_PERMISSION, "Permission Change"),
        (ACTION_INTEGRATION, "Integration Change"),
    ]

    laboratory = models.ForeignKey(
        LaboratorySettings,
        on_delete=models.CASCADE,
        related_name="audit_logs"
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="settings_audit_logs"
    )

    action = models.CharField(
        max_length=30,
        choices=ACTION_CHOICES
    )

    module = models.CharField(
        max_length=100
    )

    description = models.TextField(
        blank=True,
        default=""
    )

    old_values = models.JSONField(
        default=dict,
        blank=True
    )

    new_values = models.JSONField(
        default=dict,
        blank=True
    )

    ip_address = models.GenericIPAddressField(
        blank=True,
        null=True
    )

    user_agent = models.TextField(
        blank=True,
        default=""
    )

    class Meta:
        ordering = ["-created_at"]

        indexes = [
            models.Index(
                fields=["laboratory", "-created_at"]
            ),
            models.Index(
                fields=["user", "-created_at"]
            ),
            models.Index(
                fields=["module", "-created_at"]
            ),
        ]

    def __str__(self):
        return f"{self.module} - {self.action}"


# ============================================================
# SECURITY SETTINGS
# ============================================================

class SecuritySettings(TimeStampedModel):

    laboratory = models.OneToOneField(
        LaboratorySettings,
        on_delete=models.CASCADE,
        related_name="security_settings"
    )

    session_timeout_minutes = models.PositiveIntegerField(
        default=60
    )

    max_login_attempts = models.PositiveSmallIntegerField(
        default=5
    )

    lockout_minutes = models.PositiveIntegerField(
        default=15
    )

    require_strong_password = models.BooleanField(
        default=True
    )

    require_2fa = models.BooleanField(
        default=False
    )

    allow_multiple_sessions = models.BooleanField(
        default=True
    )

    audit_enabled = models.BooleanField(
        default=True
    )

    export_requires_permission = models.BooleanField(
        default=True
    )

    restore_requires_admin = models.BooleanField(
        default=True
    )

    class Meta:
        verbose_name = "Security Settings"
        verbose_name_plural = "Security Settings"

    def __str__(self):
        return f"Security - {self.laboratory.lab_name}"


# ============================================================
# SYSTEM SETTINGS
# ============================================================

class SystemSettings(TimeStampedModel):

    laboratory = models.OneToOneField(
        LaboratorySettings,
        on_delete=models.CASCADE,
        related_name="system_settings"
    )

    maintenance_mode = models.BooleanField(
        default=False
    )

    allow_patient_registration = models.BooleanField(
        default=True
    )

    allow_online_reports = models.BooleanField(
        default=True
    )

    allow_online_payments = models.BooleanField(
        default=True
    )

    enable_inventory = models.BooleanField(
        default=True
    )

    enable_billing = models.BooleanField(
        default=True
    )

    enable_notifications = models.BooleanField(
        default=True
    )

    enable_audit_logs = models.BooleanField(
        default=True
    )

    records_per_page = models.PositiveIntegerField(
        default=25
    )

    class Meta:
        verbose_name = "System Settings"
        verbose_name_plural = "System Settings"

    def __str__(self):
        return f"System - {self.laboratory.lab_name}"


# ============================================================
# STAFF
# ============================================================

class StaffMember(models.Model):

    STATUS_CHOICES = [
        ("active", "Active"),
        ("leave", "On Leave"),
        ("inactive", "Inactive"),
    ]

    name = models.CharField(
        max_length=255
    )

    role = models.CharField(
        max_length=150
    )

    department = models.CharField(
        max_length=150
    )

    email = models.EmailField(
        unique=True
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="active",
        db_index=True
    )

    rating = models.PositiveIntegerField(
        default=5
    )

    cert = models.CharField(
        max_length=100,
        blank=True
    )

    avatar = models.URLField(
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return f"{self.name} - {self.role}"


# ============================================================
# LAB TEST
# ============================================================

class LabTest(models.Model):

    STATUS_CHOICES = [
        ("active", "Active"),
        ("inactive", "Inactive"),
    ]

    name = models.CharField(
        max_length=150
    )

    category = models.CharField(
        max_length=100
    )

    sample = models.CharField(
        max_length=100,
        default="Blood"
    )

    department = models.CharField(
        max_length=100,
        default="Core Lab"
    )

    range_val = models.CharField(
        max_length=100,
        default="Variable"
    )

    price = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="active"
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return f"{self.name} ({self.category})"


# ============================================================
# TEST PACKAGE
# ============================================================

class TestPackage(models.Model):

    name = models.CharField(
        max_length=150
    )

    price = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    tests_included = models.JSONField(
        default=list
    )

    tag = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    tag_icon = models.CharField(
        max_length=50,
        blank=True,
        null=True
    )

    tag_color = models.CharField(
        max_length=50,
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return self.name
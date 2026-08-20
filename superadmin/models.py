# ============================================================
# SITA PATH LAB
# MULTI-TENANT SAAS PLATFORM
# SUPER ADMIN + VENDOR MANAGEMENT
# PRODUCTION-GRADE DATABASE MODELS
# ============================================================

import hashlib
import secrets
import uuid

from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import (
    MinValueValidator,
    MaxValueValidator,
)
from django.db import models
from django.db.models import Q
from django.utils import timezone
from django.utils.text import slugify


# ============================================================
# COMMON BASE MODEL
# ============================================================

class TimeStampedModel(models.Model):
    """
    Common timestamp fields for all models.
    """

    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        abstract = True


# ============================================================
# SOFT DELETE BASE
# ============================================================

class SoftDeleteModel(TimeStampedModel):
    """
    Soft delete support.
    """

    is_deleted = models.BooleanField(
        default=False,
        db_index=True,
    )

    deleted_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    class Meta:
        abstract = True

    def soft_delete(self):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(
            update_fields=[
                "is_deleted",
                "deleted_at",
                "updated_at",
            ]
        )

    def restore(self):
        self.is_deleted = False
        self.deleted_at = None
        self.save(
            update_fields=[
                "is_deleted",
                "deleted_at",
                "updated_at",
            ]
        )


# ============================================================
# 1. SUBSCRIPTION PLAN
# ============================================================

class SubscriptionPlan(TimeStampedModel):

    BILLING_MONTHLY = "monthly"
    BILLING_YEARLY = "yearly"
    BILLING_CUSTOM = "custom"

    BILLING_CHOICES = [
        (BILLING_MONTHLY, "Monthly"),
        (BILLING_YEARLY, "Yearly"),
        (BILLING_CUSTOM, "Custom"),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    name = models.CharField(
        max_length=100,
        unique=True,
    )

    slug = models.SlugField(
        max_length=120,
        unique=True,
        blank=True,
    )

    description = models.TextField(
        blank=True,
        default="",
    )

    price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[
            MinValueValidator(Decimal("0.00")),
        ],
    )

    setup_fee = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[
            MinValueValidator(Decimal("0.00")),
        ],
    )

    billing_cycle = models.CharField(
        max_length=20,
        choices=BILLING_CHOICES,
        default=BILLING_MONTHLY,
    )

    duration_days = models.PositiveIntegerField(
        default=30,
        validators=[
            MinValueValidator(1),
        ],
    )

    grace_period_days = models.PositiveIntegerField(
        default=0,
    )

    # --------------------------------------------------------
    # LIMITS
    # --------------------------------------------------------

    max_users = models.PositiveIntegerField(
        default=5,
    )

    max_patients = models.PositiveIntegerField(
        default=1000,
    )

    max_doctors = models.PositiveIntegerField(
        default=10,
    )

    max_storage_mb = models.PositiveIntegerField(
        default=1024,
    )

    max_monthly_reports = models.PositiveIntegerField(
        default=1000,
    )

    max_appointments = models.PositiveIntegerField(
        default=1000,
    )

    max_invoices = models.PositiveIntegerField(
        default=1000,
    )

    max_api_requests = models.PositiveIntegerField(
        default=10000,
    )

    max_api_keys = models.PositiveIntegerField(
        default=5,
    )

    # --------------------------------------------------------
    # MODULE FEATURES
    # --------------------------------------------------------

    dashboard_enabled = models.BooleanField(default=True)
    patients_enabled = models.BooleanField(default=True)
    appointments_enabled = models.BooleanField(default=True)
    billing_enabled = models.BooleanField(default=True)
    inventory_enabled = models.BooleanField(default=True)
    reports_enabled = models.BooleanField(default=True)
    staff_management_enabled = models.BooleanField(default=True)
    analytics_enabled = models.BooleanField(default=True)

    whatsapp_enabled = models.BooleanField(default=False)
    sms_enabled = models.BooleanField(default=False)
    email_enabled = models.BooleanField(default=True)

    api_access_enabled = models.BooleanField(default=False)
    backup_enabled = models.BooleanField(default=True)
    export_enabled = models.BooleanField(default=True)
    custom_branding_enabled = models.BooleanField(default=False)

    priority_support = models.BooleanField(default=False)

    # --------------------------------------------------------
    # STATUS
    # --------------------------------------------------------

    is_active = models.BooleanField(
        default=True,
        db_index=True,
    )

    is_public = models.BooleanField(
        default=True,
    )

    is_featured = models.BooleanField(
        default=False,
    )

    sort_order = models.PositiveIntegerField(
        default=0,
    )

    class Meta:
        ordering = [
            "sort_order",
            "price",
            "name",
        ]

        indexes = [
            models.Index(
                fields=["is_active", "is_public"]
            ),
        ]

    def save(self, *args, **kwargs):

        if not self.slug:
            self.slug = slugify(self.name)

        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


# ============================================================
# 2. VENDOR / TENANT
# ============================================================

class Vendor(TimeStampedModel):

    STATUS_ACTIVE = "active"
    STATUS_SUSPENDED = "suspended"
    STATUS_TRIAL = "trial"
    STATUS_EXPIRED = "expired"
    STATUS_BLOCKED = "blocked"
    STATUS_PENDING = "pending"

    STATUS_CHOICES = [
        (STATUS_ACTIVE, "Active"),
        (STATUS_SUSPENDED, "Suspended"),
        (STATUS_TRIAL, "Trial"),
        (STATUS_EXPIRED, "Expired"),
        (STATUS_BLOCKED, "Blocked"),
        (STATUS_PENDING, "Pending"),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    # --------------------------------------------------------
    # BASIC
    # --------------------------------------------------------

    business_name = models.CharField(
        max_length=255,
    )

    slug = models.SlugField(
        max_length=150,
        unique=True,
        blank=True,
    )

    legal_name = models.CharField(
        max_length=255,
        blank=True,
        default="",
    )

    registration_number = models.CharField(
        max_length=150,
        blank=True,
        default="",
    )

    license_number = models.CharField(
        max_length=150,
        blank=True,
        default="",
    )

    tax_number = models.CharField(
        max_length=150,
        blank=True,
        default="",
    )

    # --------------------------------------------------------
    # OWNER
    # --------------------------------------------------------

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="owned_vendors",
    )

    # --------------------------------------------------------
    # CONTACT
    # --------------------------------------------------------

    email = models.EmailField(
        db_index=True,
    )

    phone = models.CharField(
        max_length=30,
        blank=True,
        default="",
    )

    alternate_phone = models.CharField(
        max_length=30,
        blank=True,
        default="",
    )

    website = models.URLField(
        blank=True,
        default="",
    )

    # --------------------------------------------------------
    # ADDRESS
    # --------------------------------------------------------

    address = models.TextField(
        blank=True,
        default="",
    )

    city = models.CharField(
        max_length=100,
        blank=True,
        default="",
    )

    state = models.CharField(
        max_length=100,
        blank=True,
        default="",
    )

    country = models.CharField(
        max_length=100,
        default="India",
    )

    postal_code = models.CharField(
        max_length=20,
        blank=True,
        default="",
    )

    # --------------------------------------------------------
    # BRANDING
    # --------------------------------------------------------

    logo = models.ImageField(
        upload_to="vendors/logos/",
        blank=True,
        null=True,
    )

    favicon = models.ImageField(
        upload_to="vendors/favicons/",
        blank=True,
        null=True,
    )

    primary_color = models.CharField(
        max_length=20,
        default="#004AC6",
    )

    secondary_color = models.CharField(
        max_length=20,
        default="#7C3AED",
    )

    # --------------------------------------------------------
    # STATUS
    # --------------------------------------------------------

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
        db_index=True,
    )

    is_active = models.BooleanField(
        default=True,
        db_index=True,
    )

    is_verified = models.BooleanField(
        default=False,
        db_index=True,
    )

    # --------------------------------------------------------
    # LOGIN CONTROL
    # --------------------------------------------------------

    login_enabled = models.BooleanField(
        default=True,
        db_index=True,
    )

    force_password_change = models.BooleanField(
        default=True,
    )

    allow_multiple_sessions = models.BooleanField(
        default=True,
    )

    # --------------------------------------------------------
    # TRIAL
    # --------------------------------------------------------

    trial_started_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    trial_ends_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    # --------------------------------------------------------
    # ACCESS
    # --------------------------------------------------------

    last_login_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    suspended_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    suspended_reason = models.TextField(
        blank=True,
        default="",
    )

    # --------------------------------------------------------
    # SETTINGS
    # --------------------------------------------------------

    timezone = models.CharField(
        max_length=100,
        default="Asia/Kolkata",
    )

    currency = models.CharField(
        max_length=10,
        default="INR",
    )

    language = models.CharField(
        max_length=20,
        default="en",
    )

    # --------------------------------------------------------
    # ONBOARDING
    # --------------------------------------------------------

    onboarding_completed = models.BooleanField(
        default=False,
    )

    onboarding_completed_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    # --------------------------------------------------------
    # NOTES
    # --------------------------------------------------------

    admin_notes = models.TextField(
        blank=True,
        default="",
    )

    class Meta:
        ordering = ["-created_at"]

        indexes = [
            models.Index(
                fields=["status", "is_active"]
            ),
            models.Index(
                fields=["email"]
            ),
            models.Index(
                fields=["business_name"]
            ),
        ]

    def save(self, *args, **kwargs):

        if not self.slug:
            self.slug = slugify(self.business_name)

        super().save(*args, **kwargs)

    @property
    def owner_username(self):

        if self.owner:
            return self.owner.username

        return ""

    @property
    def owner_email(self):

        if self.owner:
            return self.owner.email

        return self.email

    @property
    def owner_name(self):

        if not self.owner:
            return ""

        full_name = self.owner.get_full_name().strip()

        return full_name or self.owner.username

    @property
    def active_subscription(self):

        return self.subscriptions.filter(
            status__in=[
                VendorSubscription.STATUS_ACTIVE,
                VendorSubscription.STATUS_TRIAL,
            ]
        ).order_by(
            "-current_period_end"
        ).first()

    @property
    def is_access_allowed(self):

        if not self.is_active:
            return False

        if not self.login_enabled:
            return False

        if self.status in [
            self.STATUS_SUSPENDED,
            self.STATUS_BLOCKED,
            self.STATUS_EXPIRED,
        ]:
            return False

        subscription = self.active_subscription

        if not subscription:
            return False

        return subscription.is_current

    def __str__(self):
        return self.business_name


# ============================================================
# 3. VENDOR USER
# ============================================================

class VendorUser(TimeStampedModel):

    ROLE_OWNER = "owner"
    ROLE_ADMIN = "admin"
    ROLE_MANAGER = "manager"
    ROLE_STAFF = "staff"
    ROLE_ACCOUNTANT = "accountant"
    ROLE_RECEPTIONIST = "receptionist"
    ROLE_CUSTOM = "custom"

    ROLE_CHOICES = [
        (ROLE_OWNER, "Owner"),
        (ROLE_ADMIN, "Administrator"),
        (ROLE_MANAGER, "Manager"),
        (ROLE_STAFF, "Staff"),
        (ROLE_ACCOUNTANT, "Accountant"),
        (ROLE_RECEPTIONIST, "Receptionist"),
        (ROLE_CUSTOM, "Custom"),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.CASCADE,
        related_name="users",
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="vendor_accounts",
    )

    role = models.CharField(
        max_length=30,
        choices=ROLE_CHOICES,
        default=ROLE_STAFF,
    )

    custom_role = models.ForeignKey(
        "VendorRole",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_users",
    )

    is_active = models.BooleanField(
        default=True,
        db_index=True,
    )

    is_primary = models.BooleanField(
        default=False,
    )

    can_login = models.BooleanField(
        default=True,
    )

    last_login_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    last_password_change_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    class Meta:
        ordering = ["-created_at"]

        constraints = [
            models.UniqueConstraint(
                fields=["vendor", "user"],
                name="unique_vendor_user",
            )
        ]

        indexes = [
            models.Index(
                fields=["vendor", "is_active"]
            ),
            models.Index(
                fields=["vendor", "role"]
            ),
        ]

    @property
    def username(self):

        return self.user.username if self.user else ""

    @property
    def email(self):

        return self.user.email if self.user else ""

    @property
    def full_name(self):

        if not self.user:
            return ""

        name = self.user.get_full_name().strip()

        return name or self.user.username

    @property
    def login_allowed(self):

        if not self.is_active:
            return False

        if not self.can_login:
            return False

        if not self.vendor.is_access_allowed:
            return False

        if self.user and not self.user.is_active:
            return False

        return True

    def __str__(self):

        return (
            f"{self.username} - "
            f"{self.vendor.business_name}"
        )


# ============================================================
# 4. VENDOR ROLE
# ============================================================

class VendorRole(TimeStampedModel):

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.CASCADE,
        related_name="roles",
    )

    name = models.CharField(
        max_length=100,
    )

    slug = models.SlugField(
        max_length=120,
        blank=True,
    )

    description = models.TextField(
        blank=True,
        default="",
    )

    is_system_role = models.BooleanField(
        default=False,
    )

    is_active = models.BooleanField(
        default=True,
    )

    class Meta:

        constraints = [
            models.UniqueConstraint(
                fields=["vendor", "name"],
                name="unique_vendor_role_name",
            )
        ]

        indexes = [
            models.Index(
                fields=["vendor", "is_active"]
            ),
        ]

    def save(self, *args, **kwargs):

        if not self.slug:
            self.slug = slugify(self.name)

        super().save(*args, **kwargs)

    def __str__(self):

        return (
            f"{self.vendor.business_name} - "
            f"{self.name}"
        )


# ============================================================
# 5. PERMISSION
# ============================================================

class VendorPermission(TimeStampedModel):

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

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    module = models.CharField(
        max_length=100,
    )

    action = models.CharField(
        max_length=30,
        choices=ACTION_CHOICES,
    )

    code = models.CharField(
        max_length=150,
        unique=True,
    )

    description = models.TextField(
        blank=True,
        default="",
    )

    is_active = models.BooleanField(
        default=True,
    )

    class Meta:

        indexes = [
            models.Index(
                fields=["module", "action"]
            ),
        ]

    def __str__(self):
        return self.code


# ============================================================
# 6. ROLE PERMISSION
# ============================================================

class RolePermission(TimeStampedModel):

    role = models.ForeignKey(
        VendorRole,
        on_delete=models.CASCADE,
        related_name="permissions",
    )

    permission = models.ForeignKey(
        VendorPermission,
        on_delete=models.CASCADE,
        related_name="roles",
    )

    class Meta:

        constraints = [
            models.UniqueConstraint(
                fields=["role", "permission"],
                name="unique_role_permission",
            )
        ]

    def __str__(self):

        return (
            f"{self.role} - "
            f"{self.permission}"
        )


# ============================================================
# 7. VENDOR INVITATION
# ============================================================

class VendorInvitation(TimeStampedModel):

    STATUS_PENDING = "pending"
    STATUS_ACCEPTED = "accepted"
    STATUS_EXPIRED = "expired"
    STATUS_CANCELLED = "cancelled"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_ACCEPTED, "Accepted"),
        (STATUS_EXPIRED, "Expired"),
        (STATUS_CANCELLED, "Cancelled"),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.CASCADE,
        related_name="invitations",
    )

    email = models.EmailField()

    token_hash = models.CharField(
        max_length=255,
        unique=True,
    )

    role = models.CharField(
        max_length=30,
        choices=VendorUser.ROLE_CHOICES,
        default=VendorUser.ROLE_OWNER,
    )

    expires_at = models.DateTimeField()

    accepted_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    invited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="vendor_invitations_sent",
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
        db_index=True,
    )

    @staticmethod
    def generate_token():

        return secrets.token_urlsafe(48)

    @staticmethod
    def hash_token(raw_token):

        return hashlib.sha256(
            raw_token.encode("utf-8")
        ).hexdigest()

    @property
    def is_valid(self):

        return (
            self.status == self.STATUS_PENDING
            and self.expires_at > timezone.now()
        )

    def __str__(self):

        return (
            f"{self.email} - "
            f"{self.vendor.business_name}"
        )


# ============================================================
# 8. VENDOR SUBSCRIPTION
# ============================================================

class VendorSubscription(TimeStampedModel):

    STATUS_ACTIVE = "active"
    STATUS_TRIAL = "trial"
    STATUS_EXPIRED = "expired"
    STATUS_CANCELLED = "cancelled"
    STATUS_SUSPENDED = "suspended"
    STATUS_PENDING = "pending"

    STATUS_CHOICES = [
        (STATUS_ACTIVE, "Active"),
        (STATUS_TRIAL, "Trial"),
        (STATUS_EXPIRED, "Expired"),
        (STATUS_CANCELLED, "Cancelled"),
        (STATUS_SUSPENDED, "Suspended"),
        (STATUS_PENDING, "Pending"),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.CASCADE,
        related_name="subscriptions",
    )

    plan = models.ForeignKey(
        SubscriptionPlan,
        on_delete=models.PROTECT,
        related_name="vendor_subscriptions",
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
        db_index=True,
    )

    started_at = models.DateTimeField(
        default=timezone.now,
    )

    current_period_start = models.DateTimeField(
        default=timezone.now,
    )

    current_period_end = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
    )

    cancelled_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    auto_renew = models.BooleanField(
        default=True,
    )

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    currency = models.CharField(
        max_length=10,
        default="INR",
    )

    custom_max_users = models.PositiveIntegerField(
        null=True,
        blank=True,
    )

    custom_max_patients = models.PositiveIntegerField(
        null=True,
        blank=True,
    )

    custom_max_doctors = models.PositiveIntegerField(
        null=True,
        blank=True,
    )

    notes = models.TextField(
        blank=True,
        default="",
    )

    renewal_count = models.PositiveIntegerField(
        default=0,
    )

    last_renewed_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    class Meta:

        ordering = ["-created_at"]

        indexes = [
            models.Index(
                fields=["vendor", "status"]
            ),
            models.Index(
                fields=["current_period_end"]
            ),
        ]

    @property
    def is_current(self):

        now = timezone.now()

        if self.status not in [
            self.STATUS_ACTIVE,
            self.STATUS_TRIAL,
        ]:
            return False

        if (
            self.current_period_end
            and self.current_period_end < now
        ):
            return False

        return True

    @property
    def days_remaining(self):

        if not self.current_period_end:
            return 0

        delta = (
            self.current_period_end
            - timezone.now()
        )

        return max(delta.days, 0)

    def __str__(self):

        return (
            f"{self.vendor.business_name} - "
            f"{self.plan.name}"
        )


# ============================================================
# 9. SUBSCRIPTION HISTORY
# ============================================================

class SubscriptionHistory(TimeStampedModel):

    ACTION_CREATED = "created"
    ACTION_RENEWED = "renewed"
    ACTION_UPGRADED = "upgraded"
    ACTION_DOWNGRADED = "downgraded"
    ACTION_CANCELLED = "cancelled"
    ACTION_SUSPENDED = "suspended"
    ACTION_REACTIVATED = "reactivated"
    ACTION_EXPIRED = "expired"

    ACTION_CHOICES = [
        (ACTION_CREATED, "Created"),
        (ACTION_RENEWED, "Renewed"),
        (ACTION_UPGRADED, "Upgraded"),
        (ACTION_DOWNGRADED, "Downgraded"),
        (ACTION_CANCELLED, "Cancelled"),
        (ACTION_SUSPENDED, "Suspended"),
        (ACTION_REACTIVATED, "Reactivated"),
        (ACTION_EXPIRED, "Expired"),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    subscription = models.ForeignKey(
        VendorSubscription,
        on_delete=models.CASCADE,
        related_name="history",
    )

    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.CASCADE,
        related_name="subscription_history",
    )

    action = models.CharField(
        max_length=30,
        choices=ACTION_CHOICES,
    )

    old_plan = models.ForeignKey(
        SubscriptionPlan,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="old_subscription_history",
    )

    new_plan = models.ForeignKey(
        SubscriptionPlan,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="new_subscription_history",
    )

    old_status = models.CharField(
        max_length=30,
        blank=True,
        default="",
    )

    new_status = models.CharField(
        max_length=30,
        blank=True,
        default="",
    )

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    performed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="subscription_actions",
    )

    reason = models.TextField(
        blank=True,
        default="",
    )

    metadata = models.JSONField(
        default=dict,
        blank=True,
    )

    class Meta:

        ordering = ["-created_at"]


# ============================================================
# 10. LICENSE
# ============================================================

class VendorLicense(TimeStampedModel):

    STATUS_ACTIVE = "active"
    STATUS_EXPIRED = "expired"
    STATUS_REVOKED = "revoked"
    STATUS_SUSPENDED = "suspended"
    STATUS_PENDING = "pending"

    STATUS_CHOICES = [
        (STATUS_ACTIVE, "Active"),
        (STATUS_EXPIRED, "Expired"),
        (STATUS_REVOKED, "Revoked"),
        (STATUS_SUSPENDED, "Suspended"),
        (STATUS_PENDING, "Pending"),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.CASCADE,
        related_name="licenses",
    )

    subscription = models.OneToOneField(
        VendorSubscription,
        on_delete=models.CASCADE,
        related_name="license",
        null=True,
        blank=True,
    )

    name = models.CharField(
        max_length=150,
        default="Primary License",
    )

    key_prefix = models.CharField(
        max_length=30,
        db_index=True,
    )

    key_hash = models.CharField(
        max_length=255,
        unique=True,
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
        db_index=True,
    )

    issued_at = models.DateTimeField(
        default=timezone.now,
    )

    starts_at = models.DateTimeField(
        default=timezone.now,
    )

    expires_at = models.DateTimeField(
        db_index=True,
    )

    revoked_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    revoked_reason = models.TextField(
        blank=True,
        default="",
    )

    last_validated_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    validation_count = models.PositiveIntegerField(
        default=0,
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_vendor_licenses",
    )

    @staticmethod
    def generate_key():

        random_part = secrets.token_hex(
            16
        ).upper()

        return (
            f"SPL-{random_part[:8]}-"
            f"{random_part[8:16]}-"
            f"{random_part[16:24]}-"
            f"{random_part[24:]}"
        )

    @staticmethod
    def hash_key(raw_key):

        return hashlib.sha256(
            raw_key.encode("utf-8")
        ).hexdigest()

    @property
    def is_valid(self):

        now = timezone.now()

        return (
            self.status == self.STATUS_ACTIVE
            and self.starts_at <= now
            and self.expires_at > now
            and self.vendor.is_access_allowed
        )

    def __str__(self):

        return (
            f"{self.key_prefix} - "
            f"{self.vendor.business_name}"
        )


# ============================================================
# 11. LICENSE VALIDATION LOG
# ============================================================

class LicenseValidationLog(TimeStampedModel):

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    license = models.ForeignKey(
        VendorLicense,
        on_delete=models.CASCADE,
        related_name="validation_logs",
    )

    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.CASCADE,
        related_name="license_validation_logs",
    )

    is_valid = models.BooleanField()

    failure_reason = models.CharField(
        max_length=255,
        blank=True,
        default="",
    )

    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
    )

    user_agent = models.TextField(
        blank=True,
        default="",
    )

    request_id = models.CharField(
        max_length=100,
        blank=True,
        default="",
    )

    class Meta:

        ordering = ["-created_at"]

        indexes = [
            models.Index(
                fields=["license", "-created_at"]
            ),
        ]


# ============================================================
# 12. VENDOR FEATURE OVERRIDE
# ============================================================

class VendorFeature(TimeStampedModel):

    vendor = models.OneToOneField(
        Vendor,
        on_delete=models.CASCADE,
        related_name="feature_control",
    )

    dashboard_enabled = models.BooleanField(default=True)
    patients_enabled = models.BooleanField(default=True)
    appointments_enabled = models.BooleanField(default=True)
    billing_enabled = models.BooleanField(default=True)
    inventory_enabled = models.BooleanField(default=True)
    reports_enabled = models.BooleanField(default=True)
    staff_enabled = models.BooleanField(default=True)
    analytics_enabled = models.BooleanField(default=True)

    whatsapp_enabled = models.BooleanField(default=False)
    sms_enabled = models.BooleanField(default=False)
    email_enabled = models.BooleanField(default=True)

    api_enabled = models.BooleanField(default=False)
    backup_enabled = models.BooleanField(default=True)
    export_enabled = models.BooleanField(default=True)

    custom_branding_enabled = models.BooleanField(default=False)

    def __str__(self):

        return (
            f"Features - "
            f"{self.vendor.business_name}"
        )


# ============================================================
# 13. VENDOR LIMIT OVERRIDE
# ============================================================

class VendorLimit(TimeStampedModel):

    vendor = models.OneToOneField(
        Vendor,
        on_delete=models.CASCADE,
        related_name="limits",
    )

    max_users = models.PositiveIntegerField(
        default=5,
    )

    max_patients = models.PositiveIntegerField(
        default=1000,
    )

    max_doctors = models.PositiveIntegerField(
        default=10,
    )

    max_storage_mb = models.PositiveIntegerField(
        default=1024,
    )

    max_monthly_reports = models.PositiveIntegerField(
        default=1000,
    )

    max_appointments = models.PositiveIntegerField(
        default=1000,
    )

    max_invoices = models.PositiveIntegerField(
        default=1000,
    )

    max_api_requests = models.PositiveIntegerField(
        default=10000,
    )

    max_api_keys = models.PositiveIntegerField(
        default=5,
    )

    def __str__(self):

        return (
            f"Limits - "
            f"{self.vendor.business_name}"
        )


# ============================================================
# 14. VENDOR USAGE
# ============================================================

class VendorUsage(TimeStampedModel):

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.CASCADE,
        related_name="usage_records",
    )

    period_start = models.DateField(
        db_index=True,
    )

    period_end = models.DateField(
        db_index=True,
    )

    users_count = models.PositiveIntegerField(
        default=0,
    )

    patients_count = models.PositiveIntegerField(
        default=0,
    )

    doctors_count = models.PositiveIntegerField(
        default=0,
    )

    appointments_count = models.PositiveIntegerField(
        default=0,
    )

    reports_count = models.PositiveIntegerField(
        default=0,
    )

    invoices_count = models.PositiveIntegerField(
        default=0,
    )

    storage_mb = models.PositiveIntegerField(
        default=0,
    )

    api_requests = models.PositiveBigIntegerField(
        default=0,
    )

    class Meta:

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "vendor",
                    "period_start",
                    "period_end",
                ],
                name="unique_vendor_usage_period",
            )
        ]

        indexes = [
            models.Index(
                fields=[
                    "vendor",
                    "period_start",
                ]
            ),
        ]


# ============================================================
# 15. API KEY
# ============================================================

class VendorAPIKey(TimeStampedModel):

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.CASCADE,
        related_name="api_keys",
    )

    name = models.CharField(
        max_length=150,
    )

    key_prefix = models.CharField(
        max_length=30,
    )

    secret_hash = models.CharField(
        max_length=255,
        unique=True,
    )

    is_active = models.BooleanField(
        default=True,
        db_index=True,
    )

    last_used_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    expires_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_vendor_api_keys",
    )

    def __str__(self):

        return (
            f"{self.name} - "
            f"{self.vendor.business_name}"
        )


# ============================================================
# 16. PAYMENT
# ============================================================

class VendorPayment(TimeStampedModel):

    STATUS_PENDING = "pending"
    STATUS_SUCCESS = "success"
    STATUS_FAILED = "failed"
    STATUS_REFUNDED = "refunded"
    STATUS_PARTIAL_REFUND = "partial_refund"
    STATUS_CANCELLED = "cancelled"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_SUCCESS, "Success"),
        (STATUS_FAILED, "Failed"),
        (STATUS_REFUNDED, "Refunded"),
        (STATUS_PARTIAL_REFUND, "Partially Refunded"),
        (STATUS_CANCELLED, "Cancelled"),
    ]

    METHOD_CASH = "cash"
    METHOD_UPI = "upi"
    METHOD_CARD = "card"
    METHOD_BANK = "bank"
    METHOD_GATEWAY = "gateway"

    METHOD_CHOICES = [
        (METHOD_CASH, "Cash"),
        (METHOD_UPI, "UPI"),
        (METHOD_CARD, "Card"),
        (METHOD_BANK, "Bank Transfer"),
        (METHOD_GATEWAY, "Payment Gateway"),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.PROTECT,
        related_name="payments",
    )

    subscription = models.ForeignKey(
        VendorSubscription,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="payments",
    )

    transaction_id = models.CharField(
        max_length=255,
        unique=True,
    )

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[
            MinValueValidator(
                Decimal("0.00")
            )
        ],
    )

    currency = models.CharField(
        max_length=10,
        default="INR",
    )

    payment_method = models.CharField(
        max_length=30,
        choices=METHOD_CHOICES,
        default=METHOD_GATEWAY,
    )

    status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
        db_index=True,
    )

    payment_date = models.DateTimeField(
        default=timezone.now,
    )

    gateway = models.CharField(
        max_length=100,
        blank=True,
        default="",
    )

    gateway_payment_id = models.CharField(
        max_length=255,
        blank=True,
        default="",
    )

    gateway_order_id = models.CharField(
        max_length=255,
        blank=True,
        default="",
    )

    gateway_signature = models.CharField(
        max_length=500,
        blank=True,
        default="",
    )

    invoice_number = models.CharField(
        max_length=100,
        blank=True,
        default="",
    )

    description = models.TextField(
        blank=True,
        default="",
    )

    refund_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    refunded_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    class Meta:

        ordering = ["-payment_date"]

        indexes = [
            models.Index(
                fields=["vendor", "status"]
            ),
            models.Index(
                fields=["payment_date"]
            ),
            models.Index(
                fields=["gateway_payment_id"]
            ),
        ]

    def __str__(self):

        return (
            f"{self.transaction_id} - "
            f"{self.vendor.business_name}"
        )


# ============================================================
# 17. PAYMENT REFUND
# ============================================================

class PaymentRefund(TimeStampedModel):

    STATUS_PENDING = "pending"
    STATUS_SUCCESS = "success"
    STATUS_FAILED = "failed"
    STATUS_CANCELLED = "cancelled"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_SUCCESS, "Success"),
        (STATUS_FAILED, "Failed"),
        (STATUS_CANCELLED, "Cancelled"),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    payment = models.ForeignKey(
        VendorPayment,
        on_delete=models.PROTECT,
        related_name="refunds",
    )

    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.PROTECT,
        related_name="payment_refunds",
    )

    refund_id = models.CharField(
        max_length=255,
        unique=True,
    )

    gateway_refund_id = models.CharField(
        max_length=255,
        blank=True,
        default="",
    )

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[
            MinValueValidator(
                Decimal("0.01")
            )
        ],
    )

    currency = models.CharField(
        max_length=10,
        default="INR",
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
        db_index=True,
    )

    reason = models.TextField(
        blank=True,
        default="",
    )

    processed_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_payment_refunds",
    )

    class Meta:

        ordering = ["-created_at"]


# ============================================================
# 18. PAYMENT GATEWAY ORDER
# ============================================================

class PaymentGatewayOrder(TimeStampedModel):

    STATUS_CREATED = "created"
    STATUS_ATTEMPTED = "attempted"
    STATUS_PAID = "paid"
    STATUS_FAILED = "failed"
    STATUS_CANCELLED = "cancelled"

    STATUS_CHOICES = [
        (STATUS_CREATED, "Created"),
        (STATUS_ATTEMPTED, "Attempted"),
        (STATUS_PAID, "Paid"),
        (STATUS_FAILED, "Failed"),
        (STATUS_CANCELLED, "Cancelled"),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.PROTECT,
        related_name="gateway_orders",
    )

    subscription = models.ForeignKey(
        VendorSubscription,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="gateway_orders",
    )

    gateway = models.CharField(
        max_length=100,
    )

    gateway_order_id = models.CharField(
        max_length=255,
        unique=True,
    )

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    currency = models.CharField(
        max_length=10,
        default="INR",
    )

    status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default=STATUS_CREATED,
        db_index=True,
    )

    metadata = models.JSONField(
        default=dict,
        blank=True,
    )

    expires_at = models.DateTimeField(
        null=True,
        blank=True,
    )


# ============================================================
# 19. PAYMENT WEBHOOK EVENT
# ============================================================

class PaymentWebhookEvent(TimeStampedModel):

    STATUS_RECEIVED = "received"
    STATUS_PROCESSED = "processed"
    STATUS_FAILED = "failed"
    STATUS_IGNORED = "ignored"

    STATUS_CHOICES = [
        (STATUS_RECEIVED, "Received"),
        (STATUS_PROCESSED, "Processed"),
        (STATUS_FAILED, "Failed"),
        (STATUS_IGNORED, "Ignored"),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    gateway = models.CharField(
        max_length=100,
    )

    event_id = models.CharField(
        max_length=255,
        unique=True,
    )

    event_type = models.CharField(
        max_length=255,
    )

    signature_verified = models.BooleanField(
        default=False,
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_RECEIVED,
        db_index=True,
    )

    payload = models.JSONField(
        default=dict,
        blank=True,
    )

    error_message = models.TextField(
        blank=True,
        default="",
    )

    processed_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    class Meta:

        ordering = ["-created_at"]


# ============================================================
# 20. INVOICE
# ============================================================

class VendorInvoice(TimeStampedModel):

    STATUS_DRAFT = "draft"
    STATUS_ISSUED = "issued"
    STATUS_PARTIAL = "partial"
    STATUS_PAID = "paid"
    STATUS_OVERDUE = "overdue"
    STATUS_CANCELLED = "cancelled"
    STATUS_REFUNDED = "refunded"

    STATUS_CHOICES = [
        (STATUS_DRAFT, "Draft"),
        (STATUS_ISSUED, "Issued"),
        (STATUS_PARTIAL, "Partially Paid"),
        (STATUS_PAID, "Paid"),
        (STATUS_OVERDUE, "Overdue"),
        (STATUS_CANCELLED, "Cancelled"),
        (STATUS_REFUNDED, "Refunded"),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    invoice_number = models.CharField(
        max_length=100,
        unique=True,
    )

    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.PROTECT,
        related_name="invoices",
    )

    subscription = models.ForeignKey(
        VendorSubscription,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="invoices",
    )

    issue_date = models.DateField(
        default=timezone.localdate,
    )

    due_date = models.DateField(
        null=True,
        blank=True,
    )

    subtotal = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    tax_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    discount_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    paid_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    currency = models.CharField(
        max_length=10,
        default="INR",
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_DRAFT,
        db_index=True,
    )

    notes = models.TextField(
        blank=True,
        default="",
    )

    billing_name = models.CharField(
        max_length=255,
        blank=True,
        default="",
    )

    billing_email = models.EmailField(
        blank=True,
        default="",
    )

    billing_address = models.TextField(
        blank=True,
        default="",
    )

    tax_number = models.CharField(
        max_length=100,
        blank=True,
        default="",
    )

    pdf_file = models.FileField(
        upload_to="invoices/",
        blank=True,
        null=True,
    )

    class Meta:

        ordering = [
            "-issue_date",
            "-created_at",
        ]

        indexes = [
            models.Index(
                fields=["vendor", "status"]
            ),
        ]

    def __str__(self):
        return self.invoice_number


# ============================================================
# 21. INVOICE ITEM
# ============================================================

class InvoiceItem(TimeStampedModel):

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    invoice = models.ForeignKey(
        VendorInvoice,
        on_delete=models.CASCADE,
        related_name="items",
    )

    description = models.CharField(
        max_length=500,
    )

    quantity = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("1.00"),
        validators=[
            MinValueValidator(Decimal("0.01"))
        ],
    )

    unit_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    tax_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[
            MinValueValidator(Decimal("0.00")),
            MaxValueValidator(Decimal("100.00")),
        ],
    )

    discount_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    line_total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    class Meta:

        ordering = ["created_at"]


# ============================================================
# 22. TRANSACTION
# ============================================================

class VendorTransaction(TimeStampedModel):

    TYPE_PAYMENT = "payment"
    TYPE_REFUND = "refund"
    TYPE_CREDIT = "credit"
    TYPE_ADJUSTMENT = "adjustment"
    TYPE_CHARGE = "charge"

    TYPE_CHOICES = [
        (TYPE_PAYMENT, "Payment"),
        (TYPE_REFUND, "Refund"),
        (TYPE_CREDIT, "Credit"),
        (TYPE_ADJUSTMENT, "Adjustment"),
        (TYPE_CHARGE, "Charge"),
    ]

    STATUS_SUCCESS = "success"
    STATUS_PENDING = "pending"
    STATUS_FAILED = "failed"

    STATUS_CHOICES = [
        (STATUS_SUCCESS, "Success"),
        (STATUS_PENDING, "Pending"),
        (STATUS_FAILED, "Failed"),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    transaction_number = models.CharField(
        max_length=100,
        unique=True,
    )

    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.PROTECT,
        related_name="transactions",
    )

    payment = models.ForeignKey(
        VendorPayment,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="transactions",
    )

    invoice = models.ForeignKey(
        VendorInvoice,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="transactions",
    )

    transaction_type = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
    )

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[
            MinValueValidator(
                Decimal("0.00")
            )
        ],
    )

    currency = models.CharField(
        max_length=10,
        default="INR",
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
        db_index=True,
    )

    description = models.TextField(
        blank=True,
        default="",
    )

    transaction_date = models.DateTimeField(
        default=timezone.now,
    )

    metadata = models.JSONField(
        default=dict,
        blank=True,
    )

    def __str__(self):
        return self.transaction_number


# ============================================================
# 23. CREDIT / ACCOUNT BALANCE
# ============================================================

class VendorCredit(TimeStampedModel):

    TYPE_CREDIT = "credit"
    TYPE_DEBIT = "debit"
    TYPE_ADJUSTMENT = "adjustment"

    TYPE_CHOICES = [
        (TYPE_CREDIT, "Credit"),
        (TYPE_DEBIT, "Debit"),
        (TYPE_ADJUSTMENT, "Adjustment"),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.PROTECT,
        related_name="credits",
    )

    transaction = models.ForeignKey(
        VendorTransaction,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="credit_entries",
    )

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    credit_type = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
    )

    description = models.TextField(
        blank=True,
        default="",
    )

    balance_after = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )


# ============================================================
# 24. SUPPORT TICKET
# ============================================================

class SupportTicket(TimeStampedModel):

    STATUS_OPEN = "open"
    STATUS_IN_PROGRESS = "in_progress"
    STATUS_WAITING = "waiting"
    STATUS_RESOLVED = "resolved"
    STATUS_CLOSED = "closed"

    STATUS_CHOICES = [
        (STATUS_OPEN, "Open"),
        (STATUS_IN_PROGRESS, "In Progress"),
        (STATUS_WAITING, "Waiting"),
        (STATUS_RESOLVED, "Resolved"),
        (STATUS_CLOSED, "Closed"),
    ]

    PRIORITY_LOW = "low"
    PRIORITY_NORMAL = "normal"
    PRIORITY_HIGH = "high"
    PRIORITY_URGENT = "urgent"

    PRIORITY_CHOICES = [
        (PRIORITY_LOW, "Low"),
        (PRIORITY_NORMAL, "Normal"),
        (PRIORITY_HIGH, "High"),
        (PRIORITY_URGENT, "Urgent"),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    ticket_number = models.CharField(
        max_length=50,
        unique=True,
        editable=False,
    )

    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.CASCADE,
        related_name="support_tickets",
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_support_tickets",
    )

    subject = models.CharField(
        max_length=255,
    )

    description = models.TextField()

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_OPEN,
        db_index=True,
    )

    priority = models.CharField(
        max_length=20,
        choices=PRIORITY_CHOICES,
        default=PRIORITY_NORMAL,
        db_index=True,
    )

    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_support_tickets",
    )

    category = models.CharField(
        max_length=100,
        blank=True,
        default="",
    )

    resolved_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    closed_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    def save(self, *args, **kwargs):

        if not self.ticket_number:

            self.ticket_number = (
                f"TKT-{uuid.uuid4().hex[:8].upper()}"
            )

        super().save(*args, **kwargs)

    def __str__(self):

        return (
            f"{self.ticket_number} - "
            f"{self.subject}"
        )


# ============================================================
# 25. SUPPORT TICKET MESSAGE
# ============================================================

class SupportTicketMessage(TimeStampedModel):

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    ticket = models.ForeignKey(
        SupportTicket,
        on_delete=models.CASCADE,
        related_name="messages",
    )

    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    message = models.TextField()

    is_internal_note = models.BooleanField(
        default=False,
    )

    class Meta:

        ordering = ["created_at"]


# ============================================================
# 26. SUPPORT ATTACHMENT
# ============================================================

class SupportTicketAttachment(TimeStampedModel):

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    message = models.ForeignKey(
        SupportTicketMessage,
        on_delete=models.CASCADE,
        related_name="attachments",
    )

    file = models.FileField(
        upload_to="support/attachments/",
    )

    original_name = models.CharField(
        max_length=255,
        blank=True,
        default="",
    )

    file_size = models.PositiveBigIntegerField(
        default=0,
    )

    mime_type = models.CharField(
        max_length=150,
        blank=True,
        default="",
    )


# ============================================================
# 27. NOTIFICATION
# ============================================================

class PlatformNotification(TimeStampedModel):

    TYPE_INFO = "info"
    TYPE_SUCCESS = "success"
    TYPE_WARNING = "warning"
    TYPE_DANGER = "danger"

    TYPE_CHOICES = [
        (TYPE_INFO, "Information"),
        (TYPE_SUCCESS, "Success"),
        (TYPE_WARNING, "Warning"),
        (TYPE_DANGER, "Danger"),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="notifications",
    )

    title = models.CharField(
        max_length=255,
    )

    message = models.TextField()

    notification_type = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        default=TYPE_INFO,
    )

    action_url = models.CharField(
        max_length=500,
        blank=True,
        default="",
    )

    expires_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_platform_notifications",
    )

    class Meta:

        ordering = ["-created_at"]


# ============================================================
# 28. NOTIFICATION RECIPIENT
# ============================================================

class NotificationRecipient(TimeStampedModel):

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    notification = models.ForeignKey(
        PlatformNotification,
        on_delete=models.CASCADE,
        related_name="recipients",
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications_received",
    )

    is_read = models.BooleanField(
        default=False,
        db_index=True,
    )

    read_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    class Meta:

        constraints = [
            models.UniqueConstraint(
                fields=["notification", "user"],
                name="unique_notification_recipient",
            )
        ]


# ============================================================
# 29. PLATFORM ANNOUNCEMENT
# ============================================================

class PlatformAnnouncement(TimeStampedModel):

    TYPE_INFO = "info"
    TYPE_SUCCESS = "success"
    TYPE_WARNING = "warning"
    TYPE_DANGER = "danger"

    TYPE_CHOICES = [
        (TYPE_INFO, "Information"),
        (TYPE_SUCCESS, "Success"),
        (TYPE_WARNING, "Warning"),
        (TYPE_DANGER, "Danger"),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    title = models.CharField(
        max_length=255,
    )

    message = models.TextField()

    announcement_type = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        default=TYPE_INFO,
    )

    is_active = models.BooleanField(
        default=True,
        db_index=True,
    )

    show_to_all_vendors = models.BooleanField(
        default=True,
    )

    start_at = models.DateTimeField(
        default=timezone.now,
    )

    end_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="platform_announcements",
    )

    target_vendors = models.ManyToManyField(
        Vendor,
        blank=True,
        related_name="targeted_announcements",
    )

    def __str__(self):
        return self.title


# ============================================================
# 30. VENDOR LOGIN SESSION
# ============================================================

class VendorLoginSession(TimeStampedModel):

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.CASCADE,
        related_name="login_sessions",
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="vendor_login_sessions",
    )

    session_key = models.CharField(
        max_length=255,
        unique=True,
    )

    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
    )

    user_agent = models.TextField(
        blank=True,
        default="",
    )

    device_name = models.CharField(
        max_length=255,
        blank=True,
        default="",
    )

    last_activity_at = models.DateTimeField(
        default=timezone.now,
    )

    expires_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    is_active = models.BooleanField(
        default=True,
        db_index=True,
    )

    revoked_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    revoked_reason = models.CharField(
        max_length=255,
        blank=True,
        default="",
    )

    def __str__(self):

        return (
            f"{self.user.username} - "
            f"{self.vendor.business_name}"
        )


# ============================================================
# 31. VENDOR DOMAIN
# ============================================================

class VendorDomain(TimeStampedModel):

    TYPE_SUBDOMAIN = "subdomain"
    TYPE_CUSTOM = "custom"

    TYPE_CHOICES = [
        (TYPE_SUBDOMAIN, "Subdomain"),
        (TYPE_CUSTOM, "Custom Domain"),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.CASCADE,
        related_name="domains",
    )

    domain = models.CharField(
        max_length=255,
        unique=True,
    )

    domain_type = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        default=TYPE_SUBDOMAIN,
    )

    is_primary = models.BooleanField(
        default=False,
    )

    is_verified = models.BooleanField(
        default=False,
    )

    verification_token_hash = models.CharField(
        max_length=255,
        blank=True,
        default="",
    )

    verified_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    ssl_enabled = models.BooleanField(
        default=False,
    )

    is_active = models.BooleanField(
        default=True,
    )

    class Meta:

        indexes = [
            models.Index(
                fields=["vendor", "is_active"]
            ),
        ]

    def __str__(self):
        return self.domain


# ============================================================
# 32. ADMIN IMPERSONATION
# ============================================================

class AdminImpersonationSession(TimeStampedModel):

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    admin_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="impersonation_sessions",
    )

    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.CASCADE,
        related_name="impersonation_sessions",
    )

    target_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="targeted_impersonation_sessions",
    )

    started_at = models.DateTimeField(
        default=timezone.now,
    )

    ended_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    expires_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    reason = models.TextField()

    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
    )

    is_active = models.BooleanField(
        default=True,
    )

    class Meta:

        indexes = [
            models.Index(
                fields=["admin_user", "is_active"]
            ),
            models.Index(
                fields=["vendor", "is_active"]
            ),
        ]

    def __str__(self):

        return (
            f"{self.admin_user.username} → "
            f"{self.vendor.business_name}"
        )


# ============================================================
# 33. AUDIT / ACTIVITY LOG
# ============================================================

class SuperAdminActivityLog(TimeStampedModel):

    ACTION_CREATE = "create"
    ACTION_UPDATE = "update"
    ACTION_DELETE = "delete"
    ACTION_LOGIN = "login"
    ACTION_LOGOUT = "logout"
    ACTION_SUSPEND = "suspend"
    ACTION_ACTIVATE = "activate"
    ACTION_PAYMENT = "payment"
    ACTION_SUBSCRIPTION = "subscription"
    ACTION_LICENSE = "license"
    ACTION_FEATURE = "feature"
    ACTION_PASSWORD = "password"
    ACTION_SETTINGS = "settings"
    ACTION_IMPERSONATE = "impersonate"
    ACTION_EXPORT = "export"
    ACTION_REFUND = "refund"
    ACTION_SECURITY = "security"
    ACTION_SUPPORT = "support"

    ACTION_CHOICES = [
        (ACTION_CREATE, "Create"),
        (ACTION_UPDATE, "Update"),
        (ACTION_DELETE, "Delete"),
        (ACTION_LOGIN, "Login"),
        (ACTION_LOGOUT, "Logout"),
        (ACTION_SUSPEND, "Suspend"),
        (ACTION_ACTIVATE, "Activate"),
        (ACTION_PAYMENT, "Payment"),
        (ACTION_SUBSCRIPTION, "Subscription"),
        (ACTION_LICENSE, "License"),
        (ACTION_FEATURE, "Feature"),
        (ACTION_PASSWORD, "Password"),
        (ACTION_SETTINGS, "Settings"),
        (ACTION_IMPERSONATE, "Impersonate"),
        (ACTION_EXPORT, "Export"),
        (ACTION_REFUND, "Refund"),
        (ACTION_SECURITY, "Security"),
        (ACTION_SUPPORT, "Support"),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="superadmin_activity_logs",
    )

    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="activity_logs",
    )

    action = models.CharField(
        max_length=30,
        choices=ACTION_CHOICES,
        db_index=True,
    )

    module = models.CharField(
        max_length=100,
        db_index=True,
    )

    title = models.CharField(
        max_length=255,
    )

    description = models.TextField(
        blank=True,
        default="",
    )

    old_values = models.JSONField(
        default=dict,
        blank=True,
    )

    new_values = models.JSONField(
        default=dict,
        blank=True,
    )

    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
    )

    user_agent = models.TextField(
        blank=True,
        default="",
    )

    request_id = models.CharField(
        max_length=100,
        blank=True,
        default="",
    )

    class Meta:

        ordering = ["-created_at"]

        indexes = [
            models.Index(
                fields=["vendor", "-created_at"]
            ),
            models.Index(
                fields=["actor", "-created_at"]
            ),
            models.Index(
                fields=["action", "-created_at"]
            ),
            models.Index(
                fields=["module", "-created_at"]
            ),
        ]

    def __str__(self):
        return self.title


# ============================================================
# 34. SECURITY EVENT
# ============================================================

class SecurityEvent(TimeStampedModel):

    EVENT_LOGIN_SUCCESS = "login_success"
    EVENT_LOGIN_FAILED = "login_failed"
    EVENT_ACCOUNT_LOCKED = "account_locked"
    EVENT_PASSWORD_CHANGED = "password_changed"
    EVENT_PASSWORD_RESET = "password_reset"
    EVENT_2FA_ENABLED = "2fa_enabled"
    EVENT_2FA_DISABLED = "2fa_disabled"
    EVENT_SUSPICIOUS = "suspicious"
    EVENT_SESSION_REVOKED = "session_revoked"

    EVENT_CHOICES = [
        (EVENT_LOGIN_SUCCESS, "Login Success"),
        (EVENT_LOGIN_FAILED, "Login Failed"),
        (EVENT_ACCOUNT_LOCKED, "Account Locked"),
        (EVENT_PASSWORD_CHANGED, "Password Changed"),
        (EVENT_PASSWORD_RESET, "Password Reset"),
        (EVENT_2FA_ENABLED, "2FA Enabled"),
        (EVENT_2FA_DISABLED, "2FA Disabled"),
        (EVENT_SUSPICIOUS, "Suspicious Activity"),
        (EVENT_SESSION_REVOKED, "Session Revoked"),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="security_events",
    )

    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="security_events",
    )

    event_type = models.CharField(
        max_length=50,
        choices=EVENT_CHOICES,
        db_index=True,
    )

    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
    )

    user_agent = models.TextField(
        blank=True,
        default="",
    )

    location = models.CharField(
        max_length=255,
        blank=True,
        default="",
    )

    metadata = models.JSONField(
        default=dict,
        blank=True,
    )

    class Meta:

        ordering = ["-created_at"]


# ============================================================
# 35. LOGIN ATTEMPT
# ============================================================

class LoginAttempt(TimeStampedModel):

    RESULT_SUCCESS = "success"
    RESULT_FAILED = "failed"
    RESULT_BLOCKED = "blocked"
    RESULT_LOCKED = "locked"

    RESULT_CHOICES = [
        (RESULT_SUCCESS, "Success"),
        (RESULT_FAILED, "Failed"),
        (RESULT_BLOCKED, "Blocked"),
        (RESULT_LOCKED, "Locked"),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    username = models.CharField(
        max_length=255,
        db_index=True,
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="login_attempts",
    )

    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="login_attempts",
    )

    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
    )

    user_agent = models.TextField(
        blank=True,
        default="",
    )

    result = models.CharField(
        max_length=20,
        choices=RESULT_CHOICES,
        db_index=True,
    )

    failure_reason = models.CharField(
        max_length=255,
        blank=True,
        default="",
    )

    class Meta:

        ordering = ["-created_at"]

        indexes = [
            models.Index(
                fields=["username", "-created_at"]
            ),
            models.Index(
                fields=["ip_address", "-created_at"]
            ),
        ]


# ============================================================
# 36. EXPORT JOB
# ============================================================

class DataExportJob(TimeStampedModel):

    TYPE_VENDORS = "vendors"
    TYPE_USERS = "users"
    TYPE_PAYMENTS = "payments"
    TYPE_TRANSACTIONS = "transactions"
    TYPE_INVOICES = "invoices"
    TYPE_SUBSCRIPTIONS = "subscriptions"
    TYPE_AUDIT_LOGS = "audit_logs"

    TYPE_CHOICES = [
        (TYPE_VENDORS, "Vendors"),
        (TYPE_USERS, "Users"),
        (TYPE_PAYMENTS, "Payments"),
        (TYPE_TRANSACTIONS, "Transactions"),
        (TYPE_INVOICES, "Invoices"),
        (TYPE_SUBSCRIPTIONS, "Subscriptions"),
        (TYPE_AUDIT_LOGS, "Audit Logs"),
    ]

    STATUS_PENDING = "pending"
    STATUS_PROCESSING = "processing"
    STATUS_COMPLETED = "completed"
    STATUS_FAILED = "failed"
    STATUS_EXPIRED = "expired"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_PROCESSING, "Processing"),
        (STATUS_COMPLETED, "Completed"),
        (STATUS_FAILED, "Failed"),
        (STATUS_EXPIRED, "Expired"),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    export_type = models.CharField(
        max_length=50,
        choices=TYPE_CHOICES,
    )

    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="export_jobs",
    )

    status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
        db_index=True,
    )

    file = models.FileField(
        upload_to="exports/",
        null=True,
        blank=True,
    )

    filters = models.JSONField(
        default=dict,
        blank=True,
    )

    error_message = models.TextField(
        blank=True,
        default="",
    )

    started_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    completed_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    expires_at = models.DateTimeField(
        null=True,
        blank=True,
    )


# ============================================================
# 37. BACKUP RECORD
# ============================================================

class BackupRecord(TimeStampedModel):

    STATUS_RUNNING = "running"
    STATUS_COMPLETED = "completed"
    STATUS_FAILED = "failed"
    STATUS_DELETED = "deleted"

    STATUS_CHOICES = [
        (STATUS_RUNNING, "Running"),
        (STATUS_COMPLETED, "Completed"),
        (STATUS_FAILED, "Failed"),
        (STATUS_DELETED, "Deleted"),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="backups",
    )

    backup_type = models.CharField(
        max_length=50,
        default="database",
    )

    file = models.FileField(
        upload_to="backups/",
        null=True,
        blank=True,
    )

    size_bytes = models.PositiveBigIntegerField(
        default=0,
    )

    status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default=STATUS_RUNNING,
    )

    checksum = models.CharField(
        max_length=255,
        blank=True,
        default="",
    )

    started_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    completed_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    error_message = models.TextField(
        blank=True,
        default="",
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )


# ============================================================
# 38. SUPER ADMIN PROFILE
# ============================================================

class SuperAdminProfile(TimeStampedModel):

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="superadmin_profile",
    )

    avatar = models.ImageField(
        upload_to="superadmin/avatars/",
        null=True,
        blank=True,
    )

    phone = models.CharField(
        max_length=30,
        blank=True,
        default="",
    )

    job_title = models.CharField(
        max_length=150,
        blank=True,
        default="",
    )

    timezone = models.CharField(
        max_length=100,
        default="Asia/Kolkata",
    )

    language = models.CharField(
        max_length=20,
        default="en",
    )

    two_factor_enabled = models.BooleanField(
        default=False,
    )

    last_password_change_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    def __str__(self):

        return self.user.username


# ============================================================
# 39. SYSTEM SETTINGS
# ============================================================

class SuperAdminSystemSettings(TimeStampedModel):

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    platform_name = models.CharField(
        max_length=255,
        default="Sita Path Lab",
    )

    platform_logo = models.ImageField(
        upload_to="platform/logo/",
        null=True,
        blank=True,
    )

    support_email = models.EmailField(
        blank=True,
        default="",
    )

    support_phone = models.CharField(
        max_length=30,
        blank=True,
        default="",
    )

    maintenance_mode = models.BooleanField(
        default=False,
    )

    allow_new_vendors = models.BooleanField(
        default=True,
    )

    allow_vendor_registration = models.BooleanField(
        default=False,
    )

    default_trial_days = models.PositiveIntegerField(
        default=14,
    )

    session_timeout_minutes = models.PositiveIntegerField(
        default=60,
    )

    max_login_attempts = models.PositiveSmallIntegerField(
        default=5,
    )

    lockout_minutes = models.PositiveIntegerField(
        default=15,
    )

    require_strong_password = models.BooleanField(
        default=True,
    )

    require_2fa = models.BooleanField(
        default=False,
    )

    enable_audit_logs = models.BooleanField(
        default=True,
    )

    enable_email_notifications = models.BooleanField(
        default=True,
    )

    enable_sms_notifications = models.BooleanField(
        default=True,
    )

    enable_whatsapp_notifications = models.BooleanField(
        default=False,
    )

    enforce_license_validation = models.BooleanField(
        default=True,
    )

    block_expired_vendors = models.BooleanField(
        default=True,
    )

    max_active_sessions_per_user = models.PositiveIntegerField(
        default=5,
    )

    class Meta:

        verbose_name = (
            "Super Admin System Settings"
        )

        verbose_name_plural = (
            "Super Admin System Settings"
        )

    def __str__(self):
        return self.platform_name


# ============================================================
# 40. EMAIL SETTINGS
# ============================================================

class SuperAdminEmailSettings(TimeStampedModel):

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    provider = models.CharField(
        max_length=100,
        default="smtp",
    )

    host = models.CharField(
        max_length=255,
        blank=True,
        default="",
    )

    port = models.PositiveIntegerField(
        default=587,
    )

    username = models.CharField(
        max_length=255,
        blank=True,
        default="",
    )

    # IMPORTANT:
    # Store this encrypted at service/application layer.
    password = models.TextField(
        blank=True,
        default="",
    )

    use_tls = models.BooleanField(
        default=True,
    )

    use_ssl = models.BooleanField(
        default=False,
    )

    from_email = models.EmailField(
        blank=True,
        default="",
    )

    is_active = models.BooleanField(
        default=True,
    )

    def __str__(self):
        return self.provider


# ============================================================
# 41. PAYMENT SETTINGS
# ============================================================

class SuperAdminPaymentSettings(TimeStampedModel):

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    currency = models.CharField(
        max_length=10,
        default="INR",
    )

    razorpay_enabled = models.BooleanField(
        default=False,
    )

    razorpay_key_id = models.CharField(
        max_length=255,
        blank=True,
        default="",
    )

    # Encrypt before storing.
    razorpay_key_secret = models.TextField(
        blank=True,
        default="",
    )

    stripe_enabled = models.BooleanField(
        default=False,
    )

    stripe_public_key = models.CharField(
        max_length=255,
        blank=True,
        default="",
    )

    # Encrypt before storing.
    stripe_secret_key = models.TextField(
        blank=True,
        default="",
    )

    test_mode = models.BooleanField(
        default=True,
    )

    auto_generate_invoice = models.BooleanField(
        default=True,
    )

    payment_due_days = models.PositiveIntegerField(
        default=7,
    )

    webhook_secret = models.TextField(
        blank=True,
        default="",
    )

    def __str__(self):
        return "Payment Settings"


# ============================================================
# 42. SECURITY SETTINGS
# ============================================================

class SuperAdminSecuritySettings(TimeStampedModel):

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    require_2fa_for_admin = models.BooleanField(
        default=False,
    )

    require_2fa_for_vendor = models.BooleanField(
        default=False,
    )

    password_expiry_days = models.PositiveIntegerField(
        default=90,
    )

    max_login_attempts = models.PositiveIntegerField(
        default=5,
    )

    lockout_duration_minutes = models.PositiveIntegerField(
        default=15,
    )

    session_timeout_minutes = models.PositiveIntegerField(
        default=60,
    )

    allow_multiple_sessions = models.BooleanField(
        default=True,
    )

    track_ip_address = models.BooleanField(
        default=True,
    )

    track_device = models.BooleanField(
        default=True,
    )

    enable_login_alerts = models.BooleanField(
        default=True,
    )

    enable_suspicious_activity_detection = models.BooleanField(
        default=True,
    )

    force_password_change_on_first_login = models.BooleanField(
        default=True,
    )

    def __str__(self):
        return "Security Settings"


# ============================================================
# 43. INTEGRATION SETTINGS
# ============================================================

class SuperAdminIntegrationSettings(TimeStampedModel):

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    whatsapp_enabled = models.BooleanField(
        default=False,
    )

    whatsapp_provider = models.CharField(
        max_length=100,
        blank=True,
        default="",
    )

    whatsapp_api_url = models.URLField(
        blank=True,
        default="",
    )

    whatsapp_api_key = models.TextField(
        blank=True,
        default="",
    )

    sms_enabled = models.BooleanField(
        default=False,
    )

    sms_provider = models.CharField(
        max_length=100,
        blank=True,
        default="",
    )

    sms_api_url = models.URLField(
        blank=True,
        default="",
    )

    sms_api_key = models.TextField(
        blank=True,
        default="",
    )

    google_maps_enabled = models.BooleanField(
        default=False,
    )

    google_maps_api_key = models.TextField(
        blank=True,
        default="",
    )

    class Meta:

        verbose_name = (
            "Super Admin Integration Settings"
        )

        verbose_name_plural = (
            "Super Admin Integration Settings"
        )

    def __str__(self):
        return "Integration Settings"


# ============================================================
# 44. WEBHOOK ENDPOINT
# ============================================================

class VendorWebhookEndpoint(TimeStampedModel):

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.CASCADE,
        related_name="webhook_endpoints",
    )

    name = models.CharField(
        max_length=150,
    )

    url = models.URLField()

    secret_hash = models.CharField(
        max_length=255,
        blank=True,
        default="",
    )

    events = models.JSONField(
        default=list,
        blank=True,
    )

    is_active = models.BooleanField(
        default=True,
    )

    last_success_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    last_failure_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    failure_count = models.PositiveIntegerField(
        default=0,
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )


# ============================================================
# 45. WEBHOOK DELIVERY LOG
# ============================================================

class WebhookDeliveryLog(TimeStampedModel):

    STATUS_PENDING = "pending"
    STATUS_SUCCESS = "success"
    STATUS_FAILED = "failed"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_SUCCESS, "Success"),
        (STATUS_FAILED, "Failed"),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    endpoint = models.ForeignKey(
        VendorWebhookEndpoint,
        on_delete=models.CASCADE,
        related_name="deliveries",
    )

    event_type = models.CharField(
        max_length=150,
    )

    payload = models.JSONField(
        default=dict,
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
    )

    response_status = models.PositiveIntegerField(
        null=True,
        blank=True,
    )

    response_body = models.TextField(
        blank=True,
        default="",
    )

    attempts = models.PositiveIntegerField(
        default=0,
    )

    delivered_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    next_retry_at = models.DateTimeField(
        null=True,
        blank=True,
    )


# ============================================================
# 46. PLATFORM EMAIL LOG
# ============================================================

class EmailDeliveryLog(TimeStampedModel):

    STATUS_QUEUED = "queued"
    STATUS_SENT = "sent"
    STATUS_FAILED = "failed"

    STATUS_CHOICES = [
        (STATUS_QUEUED, "Queued"),
        (STATUS_SENT, "Sent"),
        (STATUS_FAILED, "Failed"),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    recipient = models.EmailField()

    subject = models.CharField(
        max_length=255,
    )

    template_name = models.CharField(
        max_length=255,
        blank=True,
        default="",
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_QUEUED,
    )

    provider_message_id = models.CharField(
        max_length=255,
        blank=True,
        default="",
    )

    error_message = models.TextField(
        blank=True,
        default="",
    )

    sent_at = models.DateTimeField(
        null=True,
        blank=True,
    )


# ============================================================
# 47. SYSTEM CONFIGURATION VERSION
# ============================================================

class SettingsChangeLog(TimeStampedModel):

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    setting_group = models.CharField(
        max_length=100,
    )

    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    old_values = models.JSONField(
        default=dict,
        blank=True,
    )

    new_values = models.JSONField(
        default=dict,
        blank=True,
    )

    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
    )

    class Meta:

        ordering = ["-created_at"]


# ============================================================
# 48. PLAN CHANGE REQUEST
# ============================================================

class SubscriptionChangeRequest(TimeStampedModel):

    STATUS_PENDING = "pending"
    STATUS_APPROVED = "approved"
    STATUS_REJECTED = "rejected"
    STATUS_CANCELLED = "cancelled"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_APPROVED, "Approved"),
        (STATUS_REJECTED, "Rejected"),
        (STATUS_CANCELLED, "Cancelled"),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.CASCADE,
        related_name="subscription_change_requests",
    )

    current_subscription = models.ForeignKey(
        VendorSubscription,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="change_requests",
    )

    requested_plan = models.ForeignKey(
        SubscriptionPlan,
        on_delete=models.PROTECT,
        related_name="change_requests",
    )

    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
    )

    reason = models.TextField(
        blank=True,
        default="",
    )

    processed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="processed_subscription_changes",
    )

    processed_at = models.DateTimeField(
        null=True,
        blank=True,
    )


# ============================================================
# 49. PLATFORM METRIC SNAPSHOT
# ============================================================

class PlatformMetricSnapshot(TimeStampedModel):

    snapshot_date = models.DateField(
        unique=True,
    )

    total_vendors = models.PositiveIntegerField(
        default=0,
    )

    active_vendors = models.PositiveIntegerField(
        default=0,
    )

    trial_vendors = models.PositiveIntegerField(
        default=0,
    )

    expired_vendors = models.PositiveIntegerField(
        default=0,
    )

    suspended_vendors = models.PositiveIntegerField(
        default=0,
    )

    total_users = models.PositiveIntegerField(
        default=0,
    )

    total_patients = models.PositiveBigIntegerField(
        default=0,
    )

    total_revenue = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    total_refunds = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    successful_payments = models.PositiveIntegerField(
        default=0,
    )

    failed_payments = models.PositiveIntegerField(
        default=0,
    )

    open_support_tickets = models.PositiveIntegerField(
        default=0,
    )

    class Meta:

        ordering = ["-snapshot_date"]


# ============================================================
# 50. ADMIN ACTION APPROVAL
# ============================================================

class AdminApprovalRequest(TimeStampedModel):

    ACTION_REFUND = "refund"
    ACTION_DELETE_VENDOR = "delete_vendor"
    ACTION_SUSPEND_VENDOR = "suspend_vendor"
    ACTION_CHANGE_PLAN = "change_plan"
    ACTION_IMPERSONATE = "impersonate"
    ACTION_SYSTEM_SETTING = "system_setting"

    ACTION_CHOICES = [
        (ACTION_REFUND, "Refund"),
        (ACTION_DELETE_VENDOR, "Delete Vendor"),
        (ACTION_SUSPEND_VENDOR, "Suspend Vendor"),
        (ACTION_CHANGE_PLAN, "Change Plan"),
        (ACTION_IMPERSONATE, "Impersonate"),
        (ACTION_SYSTEM_SETTING, "System Setting"),
    ]

    STATUS_PENDING = "pending"
    STATUS_APPROVED = "approved"
    STATUS_REJECTED = "rejected"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_APPROVED, "Approved"),
        (STATUS_REJECTED, "Rejected"),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    action_type = models.CharField(
        max_length=50,
        choices=ACTION_CHOICES,
    )

    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approval_requests",
    )

    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_requests",
    )

    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approval_requests",
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
        db_index=True,
    )

    reason = models.TextField()

    metadata = models.JSONField(
        default=dict,
        blank=True,
    )

    approved_at = models.DateTimeField(
        null=True,
        blank=True,
    )


# ============================================================
# END OF SITA PATH LAB SUPER ADMIN MODELS
# ============================================================
# ============================================================
# SITA PATH LAB
# SUPER ADMIN - FORMS
# ============================================================

from __future__ import annotations

from decimal import Decimal, InvalidOperation

from django import forms
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError


# ============================================================
# MODEL IMPORTS
# ============================================================

from .models import (
    Vendor,
    SubscriptionPlan,
    VendorSubscription,
    VendorPayment,
    VendorInvoice,
    VendorFeature,
    VendorLimit,
)


# Backward-compatible aliases for older views/imports.
Plan = SubscriptionPlan
Subscription = VendorSubscription
Payment = VendorPayment


# ============================================================
# COMMON FORM MIXIN
# ============================================================

class SuperAdminFormMixin:
    """Common styling and behavior for Super Admin forms."""

    input_class = "form-control"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        for name, field in self.fields.items():
            widget = field.widget

            if isinstance(widget, forms.CheckboxInput):
                widget.attrs.update({"class": "form-check-input"})
            elif isinstance(widget, forms.Select):
                widget.attrs.update({"class": "form-select"})
            elif isinstance(widget, forms.Textarea):
                widget.attrs.update({
                    "class": self.input_class,
                    "rows": 4,
                })
            else:
                widget.attrs.update({"class": self.input_class})

            if field.label:
                field.label = field.label.replace("_", " ").title()

    def add_placeholder(self, field_name: str, placeholder: str):
        if field_name in self.fields:
            self.fields[field_name].widget.attrs["placeholder"] = placeholder


# ============================================================
# LOGIN
# ============================================================

class SuperAdminLoginForm(forms.Form):
    username = forms.CharField(
        label="Username",
        max_length=150,
        required=True,
        widget=forms.TextInput(attrs={
            "class": "form-control",
            "placeholder": "Enter username",
            "autocomplete": "username",
        }),
    )

    password = forms.CharField(
        label="Password",
        required=True,
        widget=forms.PasswordInput(attrs={
            "class": "form-control",
            "placeholder": "Enter password",
            "autocomplete": "current-password",
        }),
    )

    remember_me = forms.BooleanField(
        label="Remember me",
        required=False,
        widget=forms.CheckboxInput(attrs={
            "class": "form-check-input",
        }),
    )

    def __init__(self, request=None, *args, **kwargs):
        self.request = request
        super().__init__(*args, **kwargs)

    def clean(self):
        cleaned_data = super().clean()
        username = cleaned_data.get("username")
        password = cleaned_data.get("password")

        if not username or not password:
            return cleaned_data

        user = authenticate(
            self.request,
            username=username,
            password=password,
        )

        if user is None:
            raise ValidationError("Invalid username or password.")

        if not user.is_active:
            raise ValidationError("This account is disabled.")

        if not user.is_superuser:
            raise ValidationError(
                "This account is not authorized as Super Admin."
            )

        self.user = user
        return cleaned_data

    def get_user(self):
        return getattr(self, "user", None)


# ============================================================
# VENDOR
# ============================================================

class VendorForm(SuperAdminFormMixin, forms.ModelForm):
    """
    Vendor create/update form.

    Vendor login credentials are NOT Vendor fields.
    Username/password/first_name/last_name belong to Django User.
    """

    class Meta:
        model = Vendor
        fields = "__all__"

    def clean_business_name(self):
        name = self.cleaned_data.get("business_name")

        if not name:
            raise ValidationError("Vendor business name is required.")

        name = name.strip()

        if len(name) < 2:
            raise ValidationError(
                "Vendor business name must contain at least 2 characters."
            )

        return name

    def clean_email(self):
        email = self.cleaned_data.get("email")

        if not email:
            return email

        email = email.strip().lower()

        queryset = Vendor.objects.filter(email__iexact=email)

        if self.instance and self.instance.pk:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise ValidationError(
                "A vendor with this email already exists."
            )

        return email


# ============================================================
# VENDOR SEARCH / FILTER
# ============================================================

class VendorFilterForm(forms.Form):
    q = forms.CharField(
        label="Search",
        required=False,
        max_length=150,
        widget=forms.TextInput(attrs={
            "class": "form-control",
            "placeholder": "Search vendor name, email or code...",
        }),
    )

    status = forms.ChoiceField(
        label="Status",
        required=False,
        choices=[
            ("", "All Status"),
            ("active", "Active"),
            ("trial", "Trial"),
            ("pending", "Pending"),
            ("suspended", "Suspended"),
            ("expired", "Expired"),
            ("blocked", "Blocked"),
        ],
        widget=forms.Select(attrs={
            "class": "form-select",
        }),
    )


# ============================================================
# SUBSCRIPTION PLAN
# ============================================================

class PlanForm(SuperAdminFormMixin, forms.ModelForm):
    class Meta:
        model = SubscriptionPlan
        fields = "__all__"

    def clean_name(self):
        name = self.cleaned_data.get("name")

        if not name:
            raise ValidationError("Plan name is required.")

        return name.strip()

    def clean_price(self):
        price = self.cleaned_data.get("price")

        if price is None:
            return price

        try:
            price = Decimal(str(price))
        except (InvalidOperation, TypeError, ValueError):
            raise ValidationError("Enter a valid price.")

        if price < 0:
            raise ValidationError("Price cannot be negative.")

        return price

    def clean_duration_days(self):
        value = self.cleaned_data.get("duration_days")

        if value is not None and value < 1:
            raise ValidationError("Duration must be at least 1 day.")

        return value


# ============================================================
# PLAN FILTER
# ============================================================

class PlanFilterForm(forms.Form):
    q = forms.CharField(
        label="Search",
        required=False,
        max_length=150,
        widget=forms.TextInput(attrs={
            "class": "form-control",
            "placeholder": "Search plans...",
        }),
    )

    active = forms.ChoiceField(
        label="Status",
        required=False,
        choices=[
            ("", "All"),
            ("1", "Active"),
            ("0", "Inactive"),
        ],
        widget=forms.Select(attrs={
            "class": "form-select",
        }),
    )


# ============================================================
# VENDOR SUBSCRIPTION
# ============================================================

class SubscriptionForm(SuperAdminFormMixin, forms.ModelForm):
    class Meta:
        model = VendorSubscription
        fields = "__all__"

    def clean(self):
        cleaned_data = super().clean()

        start = cleaned_data.get("current_period_start")
        end = cleaned_data.get("current_period_end")

        if start and end and end < start:
            raise ValidationError(
                "Subscription end date cannot be before start date."
            )

        amount = cleaned_data.get("amount")

        if amount is not None and amount < 0:
            self.add_error("amount", "Amount cannot be negative.")

        return cleaned_data


# ============================================================
# SUBSCRIPTION STATUS
# ============================================================

class SubscriptionStatusForm(forms.Form):
    status = forms.ChoiceField(
        label="Subscription Status",
        choices=[
            ("active", "Active"),
            ("trial", "Trial"),
            ("pending", "Pending"),
            ("suspended", "Suspended"),
            ("expired", "Expired"),
            ("cancelled", "Cancelled"),
        ],
        widget=forms.Select(attrs={
            "class": "form-select",
        }),
    )


# ============================================================
# PAYMENT
# ============================================================

class PaymentForm(SuperAdminFormMixin, forms.ModelForm):
    class Meta:
        model = VendorPayment
        fields = "__all__"

    def clean_amount(self):
        amount = self.cleaned_data.get("amount")

        if amount is None:
            return amount

        try:
            amount = Decimal(str(amount))
        except (InvalidOperation, TypeError, ValueError):
            raise ValidationError("Enter a valid payment amount.")

        if amount < 0:
            raise ValidationError(
                "Payment amount cannot be negative."
            )

        return amount


# ============================================================
# PAYMENT FILTER
# ============================================================

class PaymentFilterForm(forms.Form):
    q = forms.CharField(
        label="Search",
        required=False,
        max_length=150,
        widget=forms.TextInput(attrs={
            "class": "form-control",
            "placeholder": "Search payment...",
        }),
    )

    status = forms.ChoiceField(
        label="Status",
        required=False,
        choices=[
            ("", "All Status"),
            ("pending", "Pending"),
            ("success", "Success"),
            ("failed", "Failed"),
            ("refunded", "Refunded"),
            ("cancelled", "Cancelled"),
        ],
        widget=forms.Select(attrs={
            "class": "form-select",
        }),
    )

    date_from = forms.DateField(
        required=False,
        widget=forms.DateInput(attrs={
            "class": "form-control",
            "type": "date",
        }),
    )

    date_to = forms.DateField(
        required=False,
        widget=forms.DateInput(attrs={
            "class": "form-control",
            "type": "date",
        }),
    )

    def clean(self):
        cleaned_data = super().clean()

        date_from = cleaned_data.get("date_from")
        date_to = cleaned_data.get("date_to")

        if date_from and date_to and date_from > date_to:
            raise ValidationError("Invalid date range.")

        return cleaned_data


# ============================================================
# INVOICE
# ============================================================

class InvoiceForm(SuperAdminFormMixin, forms.ModelForm):
    class Meta:
        model = VendorInvoice
        fields = "__all__"

    def clean(self):
        cleaned_data = super().clean()

        issue_date = cleaned_data.get("issue_date")
        due_date = cleaned_data.get("due_date")

        if issue_date and due_date and due_date < issue_date:
            raise ValidationError(
                "Due date cannot be before issue date."
            )

        return cleaned_data


# ============================================================
# USER UPDATE
# ============================================================

class SuperAdminUserForm(
    SuperAdminFormMixin,
    forms.ModelForm,
):
    class Meta:
        model = User
        fields = [
            "username",
            "first_name",
            "last_name",
            "email",
            "is_active",
            "is_staff",
        ]

    def clean_username(self):
        username = self.cleaned_data.get("username")

        if not username:
            raise ValidationError("Username is required.")

        username = username.strip()

        queryset = User.objects.filter(
            username__iexact=username
        )

        if self.instance and self.instance.pk:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise ValidationError(
                "This username is already in use."
            )

        return username

    def clean_email(self):
        email = self.cleaned_data.get("email")

        if not email:
            return ""

        return email.strip().lower()


# ============================================================
# USER CREATE
# ============================================================

class SuperAdminUserCreateForm(
    SuperAdminFormMixin,
    forms.ModelForm,
):
    password = forms.CharField(
        label="Password",
        required=True,
        widget=forms.PasswordInput(attrs={
            "class": "form-control",
            "placeholder": "Enter password",
            "autocomplete": "new-password",
        }),
    )

    password_confirm = forms.CharField(
        label="Confirm Password",
        required=True,
        widget=forms.PasswordInput(attrs={
            "class": "form-control",
            "placeholder": "Confirm password",
            "autocomplete": "new-password",
        }),
    )

    class Meta:
        model = User
        fields = [
            "username",
            "first_name",
            "last_name",
            "email",
            "is_active",
            "is_staff",
            "is_superuser",
        ]

    def clean_username(self):
        username = self.cleaned_data.get("username")

        if not username:
            raise ValidationError("Username is required.")

        username = username.strip()

        if User.objects.filter(username__iexact=username).exists():
            raise ValidationError(
                "This username already exists."
            )

        return username

    def clean_email(self):
        email = self.cleaned_data.get("email")

        if not email:
            return ""

        return email.strip().lower()

    def clean(self):
        cleaned_data = super().clean()

        password = cleaned_data.get("password")
        password_confirm = cleaned_data.get("password_confirm")

        if (
            password
            and password_confirm
            and password != password_confirm
        ):
            self.add_error(
                "password_confirm",
                "Passwords do not match.",
            )

        if password and len(password) < 8:
            self.add_error(
                "password",
                "Password must contain at least 8 characters.",
            )

        return cleaned_data

    def save(self, commit=True):
        user = super().save(commit=False)

        password = self.cleaned_data.get("password")

        if password:
            user.set_password(password)

        if commit:
            user.save()

        return user


# ============================================================
# PASSWORD CHANGE
# ============================================================

class SuperAdminPasswordForm(forms.Form):
    current_password = forms.CharField(
        label="Current Password",
        widget=forms.PasswordInput(attrs={
            "class": "form-control",
            "autocomplete": "current-password",
        }),
    )

    new_password = forms.CharField(
        label="New Password",
        min_length=8,
        widget=forms.PasswordInput(attrs={
            "class": "form-control",
            "autocomplete": "new-password",
        }),
    )

    confirm_password = forms.CharField(
        label="Confirm Password",
        widget=forms.PasswordInput(attrs={
            "class": "form-control",
            "autocomplete": "new-password",
        }),
    )

    def __init__(self, user=None, *args, **kwargs):
        self.user = user
        super().__init__(*args, **kwargs)

    def clean_current_password(self):
        password = self.cleaned_data.get("current_password")

        if self.user and not self.user.check_password(password):
            raise ValidationError(
                "Current password is incorrect."
            )

        return password

    def clean(self):
        cleaned_data = super().clean()

        new_password = cleaned_data.get("new_password")
        confirm_password = cleaned_data.get("confirm_password")

        if (
            new_password
            and confirm_password
            and new_password != confirm_password
        ):
            raise ValidationError(
                "New passwords do not match."
            )

        return cleaned_data


# ============================================================
# VENDOR FEATURE FORM
# ============================================================

class VendorFeatureForm(
    SuperAdminFormMixin,
    forms.ModelForm,
):
    """
    Feature controls mapped to the actual VendorFeature model.
    """

    class Meta:
        model = VendorFeature
        exclude = ["vendor", "created_at", "updated_at"]

    def __init__(self, *args, vendor=None, **kwargs):
        self.vendor = vendor
        super().__init__(*args, **kwargs)

        if vendor and not self.instance.pk:
            try:
                feature_control = vendor.feature_control
                self.instance = feature_control
            except VendorFeature.DoesNotExist:
                pass


# ============================================================
# VENDOR LIMIT FORM
# ============================================================

class VendorLimitForm(
    SuperAdminFormMixin,
    forms.ModelForm,
):
    class Meta:
        model = VendorLimit
        exclude = ["vendor", "created_at", "updated_at"]

    def clean(self):
        cleaned_data = super().clean()

        for field_name in (
            "max_users",
            "max_patients",
            "max_doctors",
            "max_storage_mb",
            "max_monthly_reports",
            "max_appointments",
            "max_invoices",
        ):
            value = cleaned_data.get(field_name)

            if value is not None and value < 0:
                self.add_error(
                    field_name,
                    "Value cannot be negative.",
                )

        return cleaned_data


# ============================================================
# SYSTEM SETTINGS
# ============================================================

class SystemSettingsForm(forms.Form):
    site_name = forms.CharField(
        label="Site Name",
        max_length=200,
        required=False,
        widget=forms.TextInput(attrs={
            "class": "form-control",
            "placeholder": "Sita Path Lab",
        }),
    )

    support_email = forms.EmailField(
        label="Support Email",
        required=False,
        widget=forms.EmailInput(attrs={
            "class": "form-control",
            "placeholder": "support@example.com",
        }),
    )

    support_phone = forms.CharField(
        label="Support Phone",
        max_length=30,
        required=False,
        widget=forms.TextInput(attrs={
            "class": "form-control",
            "placeholder": "+91 XXXXX XXXXX",
        }),
    )

    maintenance_mode = forms.BooleanField(
        label="Maintenance Mode",
        required=False,
        widget=forms.CheckboxInput(attrs={
            "class": "form-check-input",
        }),
    )

    email_notifications = forms.BooleanField(
        label="Email Notifications",
        required=False,
        initial=True,
        widget=forms.CheckboxInput(attrs={
            "class": "form-check-input",
        }),
    )

    sms_notifications = forms.BooleanField(
        label="SMS Notifications",
        required=False,
        initial=True,
        widget=forms.CheckboxInput(attrs={
            "class": "form-check-input",
        }),
    )

    allow_new_vendors = forms.BooleanField(
        label="Allow New Vendors",
        required=False,
        initial=True,
        widget=forms.CheckboxInput(attrs={
            "class": "form-check-input",
        }),
    )


# ============================================================
# VENDOR STATUS
# ============================================================

class VendorStatusForm(forms.Form):
    status = forms.ChoiceField(
        label="Vendor Status",
        choices=[
            ("active", "Active"),
            ("trial", "Trial"),
            ("pending", "Pending"),
            ("suspended", "Suspended"),
            ("expired", "Expired"),
            ("blocked", "Blocked"),
        ],
        widget=forms.Select(attrs={
            "class": "form-select",
        }),
    )


# ============================================================
# BACKUP
# ============================================================

class BackupForm(forms.Form):
    backup_type = forms.ChoiceField(
        label="Backup Type",
        choices=[
            ("manual", "Manual"),
            ("full", "Full Backup"),
            ("database", "Database"),
            ("media", "Media Files"),
        ],
        initial="manual",
        widget=forms.Select(attrs={
            "class": "form-select",
        }),
    )

    description = forms.CharField(
        label="Description",
        required=False,
        max_length=500,
        widget=forms.Textarea(attrs={
            "class": "form-control",
            "rows": 3,
            "placeholder": "Optional backup description...",
        }),
    )


# ============================================================
# AUDIT LOG FILTER
# ============================================================

class AuditLogFilterForm(forms.Form):
    q = forms.CharField(
        label="Search",
        required=False,
        max_length=200,
        widget=forms.TextInput(attrs={
            "class": "form-control",
            "placeholder": "Search audit logs...",
        }),
    )

    action = forms.CharField(
        label="Action",
        required=False,
        max_length=100,
        widget=forms.TextInput(attrs={
            "class": "form-control",
            "placeholder": "create, update, delete...",
        }),
    )

    module = forms.CharField(
        label="Module",
        required=False,
        max_length=100,
        widget=forms.TextInput(attrs={
            "class": "form-control",
            "placeholder": "vendors, users, billing...",
        }),
    )

    date_from = forms.DateField(
        label="From",
        required=False,
        widget=forms.DateInput(attrs={
            "class": "form-control",
            "type": "date",
        }),
    )

    date_to = forms.DateField(
        label="To",
        required=False,
        widget=forms.DateInput(attrs={
            "class": "form-control",
            "type": "date",
        }),
    )

    def clean(self):
        cleaned_data = super().clean()

        date_from = cleaned_data.get("date_from")
        date_to = cleaned_data.get("date_to")

        if date_from and date_to and date_from > date_to:
            raise ValidationError(
                "Start date cannot be after end date."
            )

        return cleaned_data


# ============================================================
# DELETE / IMPERSONATION
# ============================================================

class DeleteConfirmationForm(forms.Form):
    confirm = forms.BooleanField(
        label="I understand that this action cannot be undone.",
        required=True,
        widget=forms.CheckboxInput(attrs={
            "class": "form-check-input",
        }),
    )


class ImpersonationConfirmationForm(forms.Form):
    confirm = forms.BooleanField(
        label=(
            "I understand that I am entering this vendor's environment."
        ),
        required=True,
        widget=forms.CheckboxInput(attrs={
            "class": "form-check-input",
        }),
    )


# ============================================================
# HELPER
# ============================================================

def get_form_errors(form: forms.Form) -> list[str]:
    """Return all form errors as a simple list for AJAX/API responses."""
    errors: list[str] = []

    for field_errors in form.errors.values():
        for error in field_errors:
            errors.append(str(error))

    return errors


# ============================================================
# END OF FORMS
# ============================================================
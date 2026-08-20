# ============================================================
# SITA PATH LAB
# SUPER ADMIN / MULTI-TENANT SAAS
# BUSINESS SERVICE LAYER
# ============================================================

import hashlib
import secrets
import uuid
from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from django.utils.text import slugify

from .models import (
    SubscriptionPlan,
    Vendor,
    VendorUser,
    VendorSubscription,
    VendorLicense,
    VendorPayment,
    VendorInvoice,
    VendorTransaction,
    VendorFeature,
    VendorLimit,
    VendorAPIKey,
    VendorRole,
    VendorPermission,
    RolePermission,
    SuperAdminActivityLog,
    SupportTicket,
    PlatformNotification,
    PlatformAnnouncement,
    VendorLoginSession,
    VendorDomain,
    AdminImpersonationSession,
    SuperAdminSystemSettings,
    SuperAdminEmailSettings,
    SuperAdminPaymentSettings,
    SuperAdminSecuritySettings,
)


User = get_user_model()


# ============================================================
# EXCEPTIONS
# ============================================================

class ServiceError(Exception):
    """Base service exception."""
    pass


class ValidationServiceError(ServiceError):
    """Invalid business data."""
    pass


class PermissionServiceError(ServiceError):
    """User is not authorized."""
    pass


class VendorAccessError(ServiceError):
    """Vendor access denied."""
    pass


class SubscriptionError(ServiceError):
    """Subscription operation failed."""
    pass


class PaymentServiceError(ServiceError):
    """Payment operation failed."""
    pass


class LicenseServiceError(ServiceError):
    """License operation failed."""
    pass


class ImpersonationError(ServiceError):
    """Impersonation operation failed."""
    pass


# ============================================================
# COMMON HELPERS
# ============================================================

def _generate_unique_username(email=None, prefix="vendor"):
    """
    Generate a unique username.
    """

    base = ""

    if email:
        base = email.split("@")[0]

    base = slugify(base) or prefix
    base = base.replace("-", "_")[:100]

    username = base

    counter = 1

    while User.objects.filter(username=username).exists():
        username = f"{base}_{counter}"
        counter += 1

    return username


def _generate_temporary_password(length=16):
    """
    Generate strong temporary password.

    Production recommendation:
    Send this only through secure invite/reset flow.
    Never store it in audit logs.
    """

    alphabet = (
        "ABCDEFGHJKLMNPQRSTUVWXYZ"
        "abcdefghijkmnopqrstuvwxyz"
        "23456789"
        "!@#$%^&*"
    )

    return "".join(
        secrets.choice(alphabet)
        for _ in range(length)
    )


def _generate_transaction_number(prefix="TXN"):
    return (
        f"{prefix}-"
        f"{timezone.now().strftime('%Y%m%d%H%M%S')}-"
        f"{uuid.uuid4().hex[:8].upper()}"
    )


def _generate_invoice_number():
    return (
        f"INV-"
        f"{timezone.now().strftime('%Y%m%d')}-"
        f"{uuid.uuid4().hex[:10].upper()}"
    )


def _get_client_ip(request):
    """
    Get client IP safely.
    """

    if not request:
        return None

    forwarded = request.META.get("HTTP_X_FORWARDED_FOR")

    if forwarded:
        return forwarded.split(",")[0].strip()

    return request.META.get("REMOTE_ADDR")


def _get_user_agent(request):
    if not request:
        return ""

    return request.META.get(
        "HTTP_USER_AGENT",
        ""
    )[:5000]


def _serialize_model_instance(instance):
    """
    Safe audit representation.
    """

    data = {}

    for field in instance._meta.fields:

        name = field.name

        if name in {
            "password",
            "secret_hash",
            "key_hash",
            "razorpay_key_secret",
            "stripe_secret_key",
            "password_hash",
        }:
            continue

        try:
            value = getattr(instance, name)

            if hasattr(value, "isoformat"):
                value = value.isoformat()

            elif hasattr(value, "pk"):
                value = str(value.pk)

            elif isinstance(value, Decimal):
                value = str(value)

            elif isinstance(value, uuid.UUID):
                value = str(value)

            data[name] = value

        except Exception:
            continue

    return data


# ============================================================
# AUDIT LOG
# ============================================================

def create_audit_log(
    *,
    actor=None,
    vendor=None,
    action,
    module,
    title,
    description="",
    old_values=None,
    new_values=None,
    request=None,
):
    """
    Centralized audit logging.
    """

    system_settings = (
        SuperAdminSystemSettings.objects.first()
    )

    if (
        system_settings
        and not system_settings.enable_audit_logs
    ):
        return None

    return SuperAdminActivityLog.objects.create(
        actor=actor,
        vendor=vendor,
        action=action,
        module=module,
        title=title,
        description=description,
        old_values=old_values or {},
        new_values=new_values or {},
        ip_address=_get_client_ip(request),
        user_agent=_get_user_agent(request),
        request_id=(
            request.headers.get("X-Request-ID", "")
            if request
            else ""
        ),
    )


# ============================================================
# SYSTEM SETTINGS
# ============================================================

@transaction.atomic
def get_or_create_system_settings():
    settings_obj = (
        SuperAdminSystemSettings.objects.select_for_update()
        .first()
    )

    if not settings_obj:
        settings_obj = (
            SuperAdminSystemSettings.objects.create()
        )

    return settings_obj


@transaction.atomic
def update_system_settings(
    *,
    actor,
    data,
    request=None,
):
    settings_obj = (
        SuperAdminSystemSettings.objects
        .select_for_update()
        .first()
    )

    if not settings_obj:
        settings_obj = (
            SuperAdminSystemSettings.objects.create()
        )

    old_values = _serialize_model_instance(
        settings_obj
    )

    allowed_fields = {
        field.name
        for field in settings_obj._meta.fields
        if field.name not in {
            "id",
            "created_at",
            "updated_at",
        }
    }

    for field, value in data.items():

        if field in allowed_fields:
            setattr(settings_obj, field, value)

    settings_obj.save()

    new_values = _serialize_model_instance(
        settings_obj
    )

    create_audit_log(
        actor=actor,
        action=SuperAdminActivityLog.ACTION_SETTINGS,
        module="system_settings",
        title="System settings updated",
        old_values=old_values,
        new_values=new_values,
        request=request,
    )

    return settings_obj


# ============================================================
# SUBSCRIPTION PLAN SERVICES
# ============================================================

@transaction.atomic
def create_subscription_plan(
    *,
    actor,
    data,
    request=None,
):
    name = data.get("name")

    if not name:
        raise ValidationServiceError(
            "Plan name is required."
        )

    if SubscriptionPlan.objects.filter(
        name__iexact=name
    ).exists():
        raise ValidationServiceError(
            "Subscription plan already exists."
        )

    plan = SubscriptionPlan.objects.create(
        name=name,
        slug=data.get("slug") or slugify(name),
        description=data.get(
            "description",
            ""
        ),
        price=data.get(
            "price",
            Decimal("0.00")
        ),
        billing_cycle=data.get(
            "billing_cycle",
            SubscriptionPlan.BILLING_MONTHLY
        ),
        duration_days=data.get(
            "duration_days",
            30
        ),
        max_users=data.get("max_users", 5),
        max_patients=data.get(
            "max_patients",
            1000
        ),
        max_doctors=data.get(
            "max_doctors",
            10
        ),
        max_storage_mb=data.get(
            "max_storage_mb",
            1024
        ),
        max_monthly_reports=data.get(
            "max_monthly_reports",
            1000
        ),
        max_appointments=data.get(
            "max_appointments",
            1000
        ),
        max_invoices=data.get(
            "max_invoices",
            1000
        ),
        dashboard_enabled=data.get(
            "dashboard_enabled",
            True
        ),
        patients_enabled=data.get(
            "patients_enabled",
            True
        ),
        appointments_enabled=data.get(
            "appointments_enabled",
            True
        ),
        billing_enabled=data.get(
            "billing_enabled",
            True
        ),
        inventory_enabled=data.get(
            "inventory_enabled",
            True
        ),
        reports_enabled=data.get(
            "reports_enabled",
            True
        ),
        staff_management_enabled=data.get(
            "staff_management_enabled",
            True
        ),
        analytics_enabled=data.get(
            "analytics_enabled",
            True
        ),
        whatsapp_enabled=data.get(
            "whatsapp_enabled",
            False
        ),
        sms_enabled=data.get(
            "sms_enabled",
            False
        ),
        email_enabled=data.get(
            "email_enabled",
            True
        ),
        api_access_enabled=data.get(
            "api_access_enabled",
            False
        ),
        backup_enabled=data.get(
            "backup_enabled",
            True
        ),
        export_enabled=data.get(
            "export_enabled",
            True
        ),
        custom_branding_enabled=data.get(
            "custom_branding_enabled",
            False
        ),
        priority_support=data.get(
            "priority_support",
            False
        ),
        is_active=data.get(
            "is_active",
            True
        ),
        is_public=data.get(
            "is_public",
            True
        ),
        is_featured=data.get(
            "is_featured",
            False
        ),
        sort_order=data.get(
            "sort_order",
            0
        ),
    )

    create_audit_log(
        actor=actor,
        action=SuperAdminActivityLog.ACTION_CREATE,
        module="subscription_plans",
        title=f"Subscription plan created: {plan.name}",
        new_values=_serialize_model_instance(plan),
        request=request,
    )

    return plan


@transaction.atomic
def update_subscription_plan(
    *,
    actor,
    plan_id,
    data,
    request=None,
):
    plan = (
        SubscriptionPlan.objects
        .select_for_update()
        .get(pk=plan_id)
    )

    old_values = _serialize_model_instance(plan)

    protected_fields = {
        "id",
        "created_at",
        "updated_at",
    }

    for field, value in data.items():

        if field in protected_fields:
            continue

        if hasattr(plan, field):
            setattr(plan, field, value)

    plan.save()

    create_audit_log(
        actor=actor,
        action=SuperAdminActivityLog.ACTION_UPDATE,
        module="subscription_plans",
        title=f"Subscription plan updated: {plan.name}",
        old_values=old_values,
        new_values=_serialize_model_instance(plan),
        request=request,
    )

    return plan


# ============================================================
# VENDOR OWNER USER
# ============================================================

@transaction.atomic
def create_vendor_owner(
    *,
    email,
    password=None,
    first_name="",
    last_name="",
    username=None,
):
    """
    Creates Django authentication user.

    Returns:
        user,
        temporary_password
    """

    if not email:
        raise ValidationServiceError(
            "Owner email is required."
        )

    email = email.strip().lower()

    if User.objects.filter(
        email__iexact=email
    ).exists():
        raise ValidationServiceError(
            "A user with this email already exists."
        )

    temporary_password = None

    if not password:
        temporary_password = (
            _generate_temporary_password()
        )
        password = temporary_password

    username = (
        username
        or _generate_unique_username(email)
    )

    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
    )

    return user, temporary_password


# ============================================================
# VENDOR CREATION / ONBOARDING
# ============================================================

@transaction.atomic
def create_vendor(
    *,
    actor,
    vendor_data,
    owner_data,
    plan_id=None,
    request=None,
):
    """
    Complete vendor onboarding.

    Creates:

    1. Django User
    2. Vendor
    3. VendorUser
    4. VendorFeature
    5. VendorLimit
    6. Subscription
    7. License
    8. Default roles
    """

    business_name = vendor_data.get(
        "business_name"
    )

    email = (
        owner_data.get("email")
        or vendor_data.get("email")
    )

    if not business_name:
        raise ValidationServiceError(
            "Business name is required."
        )

    if not email:
        raise ValidationServiceError(
            "Vendor owner email is required."
        )

    if Vendor.objects.filter(
        business_name__iexact=business_name
    ).exists():
        raise ValidationServiceError(
            "Vendor with this business name already exists."
        )

    owner, temporary_password = create_vendor_owner(
        email=email,
        password=owner_data.get("password"),
        first_name=owner_data.get(
            "first_name",
            ""
        ),
        last_name=owner_data.get(
            "last_name",
            ""
        ),
        username=owner_data.get("username"),
    )

    vendor = Vendor.objects.create(
        business_name=business_name,
        legal_name=vendor_data.get(
            "legal_name",
            ""
        ),
        registration_number=vendor_data.get(
            "registration_number",
            ""
        ),
        license_number=vendor_data.get(
            "license_number",
            ""
        ),
        tax_number=vendor_data.get(
            "tax_number",
            ""
        ),
        owner=owner,
        email=vendor_data.get(
            "email",
            email
        ),
        phone=vendor_data.get(
            "phone",
            ""
        ),
        alternate_phone=vendor_data.get(
            "alternate_phone",
            ""
        ),
        website=vendor_data.get(
            "website",
            ""
        ),
        address=vendor_data.get(
            "address",
            ""
        ),
        city=vendor_data.get(
            "city",
            ""
        ),
        state=vendor_data.get(
            "state",
            ""
        ),
        country=vendor_data.get(
            "country",
            "India"
        ),
        postal_code=vendor_data.get(
            "postal_code",
            ""
        ),
        primary_color=vendor_data.get(
            "primary_color",
            "#004AC6"
        ),
        secondary_color=vendor_data.get(
            "secondary_color",
            "#7C3AED"
        ),
        status=vendor_data.get(
            "status",
            Vendor.STATUS_PENDING
        ),
        is_active=vendor_data.get(
            "is_active",
            True
        ),
        is_verified=vendor_data.get(
            "is_verified",
            False
        ),
        login_enabled=vendor_data.get(
            "login_enabled",
            True
        ),
        force_password_change=True,
        allow_multiple_sessions=vendor_data.get(
            "allow_multiple_sessions",
            True
        ),
        timezone=vendor_data.get(
            "timezone",
            "Asia/Kolkata"
        ),
        currency=vendor_data.get(
            "currency",
            "INR"
        ),
    )

    vendor_user = VendorUser.objects.create(
        vendor=vendor,
        user=owner,
        role=VendorUser.ROLE_OWNER,
        is_active=True,
        is_primary=True,
        can_login=True,
    )

    # --------------------------------------------------------
    # FEATURES
    # --------------------------------------------------------

    feature = VendorFeature.objects.create(
        vendor=vendor
    )

    # --------------------------------------------------------
    # LIMITS
    # --------------------------------------------------------

    limit = VendorLimit.objects.create(
        vendor=vendor
    )

    # --------------------------------------------------------
    # SUBSCRIPTION
    # --------------------------------------------------------

    subscription = None

    if plan_id:

        plan = (
            SubscriptionPlan.objects
            .select_for_update()
            .get(pk=plan_id)
        )

        subscription = create_subscription(
            actor=actor,
            vendor=vendor,
            plan=plan,
            status=VendorSubscription.STATUS_ACTIVE,
            start_date=timezone.now(),
            request=request,
        )

        # Copy plan limits/features
        apply_plan_to_vendor(
            vendor=vendor,
            plan=plan,
        )

    # --------------------------------------------------------
    # DEFAULT ROLES
    # --------------------------------------------------------

    create_default_vendor_roles(
        vendor=vendor
    )

    # --------------------------------------------------------
    # AUDIT
    # --------------------------------------------------------

    create_audit_log(
        actor=actor,
        vendor=vendor,
        action=SuperAdminActivityLog.ACTION_CREATE,
        module="vendors",
        title=f"Vendor created: {vendor.business_name}",
        description="Vendor onboarding completed.",
        new_values={
            "vendor_id": str(vendor.id),
            "owner_user_id": str(owner.id),
            "subscription_id": (
                str(subscription.id)
                if subscription
                else None
            ),
        },
        request=request,
    )

    return {
        "vendor": vendor,
        "owner": owner,
        "vendor_user": vendor_user,
        "feature": feature,
        "limit": limit,
        "subscription": subscription,
        "temporary_password": temporary_password,
    }


# ============================================================
# PLAN -> VENDOR FEATURES/LIMITS
# ============================================================

@transaction.atomic
def apply_plan_to_vendor(
    *,
    vendor,
    plan,
):
    """
    Apply plan limits/features to vendor.
    """

    feature, _ = (
        VendorFeature.objects
        .select_for_update()
        .get_or_create(vendor=vendor)
    )

    limit, _ = (
        VendorLimit.objects
        .select_for_update()
        .get_or_create(vendor=vendor)
    )

    feature.dashboard_enabled = (
        plan.dashboard_enabled
    )
    feature.patients_enabled = (
        plan.patients_enabled
    )
    feature.appointments_enabled = (
        plan.appointments_enabled
    )
    feature.billing_enabled = (
        plan.billing_enabled
    )
    feature.inventory_enabled = (
        plan.inventory_enabled
    )
    feature.reports_enabled = (
        plan.reports_enabled
    )
    feature.staff_enabled = (
        plan.staff_management_enabled
    )
    feature.analytics_enabled = (
        plan.analytics_enabled
    )
    feature.whatsapp_enabled = (
        plan.whatsapp_enabled
    )
    feature.sms_enabled = (
        plan.sms_enabled
    )
    feature.email_enabled = (
        plan.email_enabled
    )
    feature.api_enabled = (
        plan.api_access_enabled
    )
    feature.backup_enabled = (
        plan.backup_enabled
    )
    feature.export_enabled = (
        plan.export_enabled
    )
    feature.custom_branding_enabled = (
        plan.custom_branding_enabled
    )

    feature.save()

    limit.max_users = plan.max_users
    limit.max_patients = plan.max_patients
    limit.max_doctors = plan.max_doctors
    limit.max_storage_mb = plan.max_storage_mb
    limit.max_monthly_reports = (
        plan.max_monthly_reports
    )
    limit.max_appointments = (
        plan.max_appointments
    )
    limit.max_invoices = plan.max_invoices

    limit.save()

    return feature, limit


# ============================================================
# SUBSCRIPTION
# ============================================================

def _calculate_subscription_end(
    *,
    start_date,
    duration_days,
):
    return start_date + timedelta(
        days=duration_days
    )


@transaction.atomic
def create_subscription(
    *,
    actor,
    vendor,
    plan,
    status=VendorSubscription.STATUS_ACTIVE,
    start_date=None,
    custom_amount=None,
    custom_max_users=None,
    custom_max_patients=None,
    notes="",
    request=None,
):
    start_date = (
        start_date
        or timezone.now()
    )

    amount = (
        custom_amount
        if custom_amount is not None
        else plan.price
    )

    period_end = _calculate_subscription_end(
        start_date=start_date,
        duration_days=plan.duration_days,
    )

    subscription = (
        VendorSubscription.objects.create(
            vendor=vendor,
            plan=plan,
            status=status,
            started_at=start_date,
            current_period_start=start_date,
            current_period_end=period_end,
            amount=amount,
            currency=vendor.currency,
            custom_max_users=custom_max_users,
            custom_max_patients=custom_max_patients,
            notes=notes,
        )
    )

    # Apply plan controls.
    apply_plan_to_vendor(
        vendor=vendor,
        plan=plan
    )

    # --------------------------------------------------------
    # LICENSE
    # --------------------------------------------------------

    license_obj, raw_key = create_license(
        actor=actor,
        vendor=vendor,
        subscription=subscription,
        starts_at=start_date,
        expires_at=period_end,
        request=request,
    )

    # --------------------------------------------------------
    # VENDOR STATUS
    # --------------------------------------------------------

    vendor.status = Vendor.STATUS_ACTIVE
    vendor.is_active = True
    vendor.login_enabled = True
    vendor.save(
        update_fields=[
            "status",
            "is_active",
            "login_enabled",
            "updated_at",
        ]
    )

    create_audit_log(
        actor=actor,
        vendor=vendor,
        action=SuperAdminActivityLog.ACTION_SUBSCRIPTION,
        module="subscriptions",
        title="Subscription created",
        description=(
            f"Subscription created for "
            f"{vendor.business_name}."
        ),
        new_values={
            "subscription_id": str(
                subscription.id
            ),
            "plan": plan.name,
            "status": status,
            "amount": str(amount),
            "period_end": period_end.isoformat(),
        },
        request=request,
    )

    return {
        "subscription": subscription,
        "license": license_obj,
        "license_key": raw_key,
    }


# ============================================================
# SUBSCRIPTION RENEWAL
# ============================================================

@transaction.atomic
def renew_subscription(
    *,
    actor,
    subscription_id,
    duration_days=None,
    amount=None,
    request=None,
):
    subscription = (
        VendorSubscription.objects
        .select_for_update()
        .select_related(
            "vendor",
            "plan",
        )
        .get(pk=subscription_id)
    )

    now = timezone.now()

    start = subscription.current_period_end

    if not start or start < now:
        start = now

    days = (
        duration_days
        or subscription.plan.duration_days
    )

    new_end = start + timedelta(
        days=days
    )

    old_values = _serialize_model_instance(
        subscription
    )

    subscription.current_period_start = start
    subscription.current_period_end = new_end
    subscription.status = (
        VendorSubscription.STATUS_ACTIVE
    )
    subscription.auto_renew = True
    subscription.renewal_count += 1
    subscription.last_renewed_at = now

    if amount is not None:
        subscription.amount = amount

    subscription.save()

    vendor = subscription.vendor

    vendor.status = Vendor.STATUS_ACTIVE
    vendor.is_active = True
    vendor.login_enabled = True
    vendor.save(
        update_fields=[
            "status",
            "is_active",
            "login_enabled",
            "updated_at",
        ]
    )

    # Renew/create license.
    license_obj = (
        VendorLicense.objects
        .select_for_update()
        .filter(
            subscription=subscription
        )
        .first()
    )

    if license_obj:

        license_obj.status = (
            VendorLicense.STATUS_ACTIVE
        )
        license_obj.starts_at = start
        license_obj.expires_at = new_end
        license_obj.revoked_at = None
        license_obj.revoked_reason = ""
        license_obj.save()

        raw_license_key = None

    else:

        license_obj, raw_license_key = create_license(
            actor=actor,
            vendor=vendor,
            subscription=subscription,
            starts_at=start,
            expires_at=new_end,
            request=request,
        )

    create_audit_log(
        actor=actor,
        vendor=vendor,
        action=SuperAdminActivityLog.ACTION_SUBSCRIPTION,
        module="subscriptions",
        title="Subscription renewed",
        old_values=old_values,
        new_values=_serialize_model_instance(
            subscription
        ),
        request=request,
    )

    return {
        "subscription": subscription,
        "license": license_obj,
        "license_key": raw_license_key,
    }


# ============================================================
# SUBSCRIPTION EXPIRATION
# ============================================================

@transaction.atomic
def expire_subscription(
    *,
    subscription,
    actor=None,
    request=None,
):
    subscription = (
        VendorSubscription.objects
        .select_for_update()
        .select_related("vendor")
        .get(pk=subscription.pk)
    )

    subscription.status = (
        VendorSubscription.STATUS_EXPIRED
    )
    subscription.save(
        update_fields=[
            "status",
            "updated_at",
        ]
    )

    vendor = subscription.vendor

    vendor.status = Vendor.STATUS_EXPIRED
    vendor.login_enabled = False
    vendor.is_active = False
    vendor.save(
        update_fields=[
            "status",
            "login_enabled",
            "is_active",
            "updated_at",
        ]
    )

    license_obj = (
        VendorLicense.objects
        .filter(subscription=subscription)
        .first()
    )

    if license_obj:

        license_obj.status = (
            VendorLicense.STATUS_EXPIRED
        )

        license_obj.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )

    create_audit_log(
        actor=actor,
        vendor=vendor,
        action=SuperAdminActivityLog.ACTION_SUSPEND,
        module="subscriptions",
        title="Subscription expired",
        description=(
            f"Subscription expired for "
            f"{vendor.business_name}."
        ),
        request=request,
    )

    return subscription


# ============================================================
# LICENSE
# ============================================================

@transaction.atomic
def create_license(
    *,
    actor,
    vendor,
    subscription,
    starts_at,
    expires_at,
    request=None,
):
    raw_key = VendorLicense.generate_key()

    key_hash = VendorLicense.hash_key(
        raw_key
    )

    key_prefix = raw_key.split("-")[0]

    license_obj = VendorLicense.objects.create(
        vendor=vendor,
        subscription=subscription,
        name="Primary License",
        key_prefix=key_prefix,
        key_hash=key_hash,
        status=VendorLicense.STATUS_ACTIVE,
        issued_at=timezone.now(),
        starts_at=starts_at,
        expires_at=expires_at,
        created_by=actor,
    )

    create_audit_log(
        actor=actor,
        vendor=vendor,
        action=SuperAdminActivityLog.ACTION_LICENSE,
        module="licenses",
        title="Vendor license created",
        new_values={
            "license_id": str(
                license_obj.id
            ),
            "key_prefix": key_prefix,
            "expires_at": expires_at.isoformat(),
        },
        request=request,
    )

    # IMPORTANT:
    # Raw license key is returned ONLY at creation time.
    return license_obj, raw_key


def validate_license(
    *,
    raw_key,
):
    if not raw_key:
        return None

    key_hash = VendorLicense.hash_key(
        raw_key
    )

    license_obj = (
        VendorLicense.objects
        .select_related(
            "vendor",
            "subscription",
        )
        .filter(
            key_hash=key_hash
        )
        .first()
    )

    if not license_obj:
        return None

    now = timezone.now()

    if (
        license_obj.status
        != VendorLicense.STATUS_ACTIVE
    ):
        return None

    if license_obj.starts_at > now:
        return None

    if license_obj.expires_at <= now:
        license_obj.status = (
            VendorLicense.STATUS_EXPIRED
        )
        license_obj.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )
        return None

    if not license_obj.vendor.is_access_allowed:
        return None

    license_obj.last_validated_at = now
    license_obj.validation_count += 1

    license_obj.save(
        update_fields=[
            "last_validated_at",
            "validation_count",
            "updated_at",
        ]
    )

    return license_obj


@transaction.atomic
def revoke_license(
    *,
    actor,
    license_id,
    reason="",
    request=None,
):
    license_obj = (
        VendorLicense.objects
        .select_for_update()
        .select_related("vendor")
        .get(pk=license_id)
    )

    license_obj.status = (
        VendorLicense.STATUS_REVOKED
    )
    license_obj.revoked_at = timezone.now()
    license_obj.revoked_reason = reason

    license_obj.save()

    create_audit_log(
        actor=actor,
        vendor=license_obj.vendor,
        action=SuperAdminActivityLog.ACTION_LICENSE,
        module="licenses",
        title="Vendor license revoked",
        description=reason,
        request=request,
    )

    return license_obj


# ============================================================
# VENDOR SUSPENSION
# ============================================================

@transaction.atomic
def suspend_vendor(
    *,
    actor,
    vendor_id,
    reason,
    request=None,
):
    vendor = (
        Vendor.objects
        .select_for_update()
        .get(pk=vendor_id)
    )

    if not reason:
        raise ValidationServiceError(
            "Suspension reason is required."
        )

    vendor.status = Vendor.STATUS_SUSPENDED
    vendor.login_enabled = False
    vendor.is_active = False
    vendor.suspended_at = timezone.now()
    vendor.suspended_reason = reason

    vendor.save()

    VendorUser.objects.filter(
        vendor=vendor
    ).update(
        can_login=False
    )

    VendorLoginSession.objects.filter(
        vendor=vendor,
        is_active=True
    ).update(
        is_active=False
    )

    create_audit_log(
        actor=actor,
        vendor=vendor,
        action=SuperAdminActivityLog.ACTION_SUSPEND,
        module="vendors",
        title="Vendor suspended",
        description=reason,
        request=request,
    )

    return vendor


@transaction.atomic
def activate_vendor(
    *,
    actor,
    vendor_id,
    request=None,
):
    vendor = (
        Vendor.objects
        .select_for_update()
        .get(pk=vendor_id)
    )

    if not vendor.is_access_allowed:
        raise VendorAccessError(
            "Vendor has no valid subscription."
        )

    vendor.status = Vendor.STATUS_ACTIVE
    vendor.is_active = True
    vendor.login_enabled = True
    vendor.suspended_at = None
    vendor.suspended_reason = ""

    vendor.save()

    VendorUser.objects.filter(
        vendor=vendor
    ).update(
        can_login=True
    )

    create_audit_log(
        actor=actor,
        vendor=vendor,
        action=SuperAdminActivityLog.ACTION_ACTIVATE,
        module="vendors",
        title="Vendor activated",
        request=request,
    )

    return vendor


# ============================================================
# VENDOR FEATURE CONTROL
# ============================================================

@transaction.atomic
def update_vendor_features(
    *,
    actor,
    vendor_id,
    data,
    request=None,
):
    vendor = Vendor.objects.get(
        pk=vendor_id
    )

    feature, _ = (
        VendorFeature.objects
        .select_for_update()
        .get_or_create(vendor=vendor)
    )

    old_values = _serialize_model_instance(
        feature
    )

    allowed = {
        field.name
        for field in feature._meta.fields
        if field.name not in {
            "id",
            "vendor",
            "created_at",
            "updated_at",
        }
    }

    for field, value in data.items():

        if field in allowed:
            setattr(feature, field, value)

    feature.save()

    create_audit_log(
        actor=actor,
        vendor=vendor,
        action=SuperAdminActivityLog.ACTION_FEATURE,
        module="features",
        title="Vendor features updated",
        old_values=old_values,
        new_values=_serialize_model_instance(
            feature
        ),
        request=request,
    )

    return feature


# ============================================================
# VENDOR LIMIT CONTROL
# ============================================================

@transaction.atomic
def update_vendor_limits(
    *,
    actor,
    vendor_id,
    data,
    request=None,
):
    vendor = Vendor.objects.get(
        pk=vendor_id
    )

    limit, _ = (
        VendorLimit.objects
        .select_for_update()
        .get_or_create(vendor=vendor)
    )

    old_values = _serialize_model_instance(
        limit
    )

    allowed = {
        field.name
        for field in limit._meta.fields
        if field.name not in {
            "id",
            "vendor",
            "created_at",
            "updated_at",
        }
    }

    for field, value in data.items():

        if field in allowed:
            setattr(limit, field, value)

    limit.save()

    create_audit_log(
        actor=actor,
        vendor=vendor,
        action=SuperAdminActivityLog.ACTION_FEATURE,
        module="vendor_limits",
        title="Vendor limits updated",
        old_values=old_values,
        new_values=_serialize_model_instance(
            limit
        ),
        request=request,
    )

    return limit


# ============================================================
# PAYMENT
# ============================================================

@transaction.atomic
def record_payment(
    *,
    actor,
    vendor,
    amount,
    payment_method,
    status=VendorPayment.STATUS_SUCCESS,
    subscription=None,
    gateway="",
    gateway_payment_id="",
    gateway_order_id="",
    invoice_number="",
    description="",
    transaction_id=None,
    request=None,
):
    amount = Decimal(str(amount))

    if amount < Decimal("0.00"):
        raise PaymentServiceError(
            "Payment amount cannot be negative."
        )

    transaction_id = (
        transaction_id
        or _generate_transaction_number(
            prefix="PAY"
        )
    )

    if VendorPayment.objects.filter(
        transaction_id=transaction_id
    ).exists():
        raise PaymentServiceError(
            "Duplicate transaction ID."
        )

    payment = VendorPayment.objects.create(
        vendor=vendor,
        subscription=subscription,
        transaction_id=transaction_id,
        amount=amount,
        currency=vendor.currency,
        payment_method=payment_method,
        status=status,
        payment_date=timezone.now(),
        gateway=gateway,
        gateway_payment_id=gateway_payment_id,
        gateway_order_id=gateway_order_id,
        invoice_number=invoice_number,
        description=description,
    )

    # --------------------------------------------------------
    # TRANSACTION LEDGER
    # --------------------------------------------------------

    transaction_obj = (
        VendorTransaction.objects.create(
            transaction_number=(
                _generate_transaction_number(
                    prefix="TRX"
                )
            ),
            vendor=vendor,
            payment=payment,
            transaction_type=(
                VendorTransaction.TYPE_PAYMENT
            ),
            amount=amount,
            currency=vendor.currency,
            status=(
                VendorTransaction.STATUS_SUCCESS
                if status == VendorPayment.STATUS_SUCCESS
                else VendorTransaction.STATUS_PENDING
            ),
            description=description,
            transaction_date=timezone.now(),
        )
    )

    create_audit_log(
        actor=actor,
        vendor=vendor,
        action=SuperAdminActivityLog.ACTION_PAYMENT,
        module="payments",
        title="Payment recorded",
        new_values={
            "payment_id": str(
                payment.id
            ),
            "transaction_id": transaction_id,
            "amount": str(amount),
            "status": status,
        },
        request=request,
    )

    return payment, transaction_obj


# ============================================================
# REFUND
# ============================================================

@transaction.atomic
def refund_payment(
    *,
    actor,
    payment_id,
    refund_amount=None,
    reason="",
    request=None,
):
    payment = (
        VendorPayment.objects
        .select_for_update()
        .select_related("vendor")
        .get(pk=payment_id)
    )

    if payment.status != (
        VendorPayment.STATUS_SUCCESS
    ):
        raise PaymentServiceError(
            "Only successful payments can be refunded."
        )

    original_amount = payment.amount

    if refund_amount is None:
        refund_amount = original_amount

    refund_amount = Decimal(
        str(refund_amount)
    )

    if refund_amount <= Decimal("0.00"):
        raise PaymentServiceError(
            "Refund amount must be greater than zero."
        )

    available_refund = (
        original_amount
        - payment.refund_amount
    )

    if refund_amount > available_refund:
        raise PaymentServiceError(
            "Refund amount exceeds available amount."
        )

    payment.refund_amount += refund_amount
    payment.refunded_at = timezone.now()

    if payment.refund_amount >= original_amount:
        payment.status = (
            VendorPayment.STATUS_REFUNDED
        )

    payment.save()

    refund_transaction = (
        VendorTransaction.objects.create(
            transaction_number=(
                _generate_transaction_number(
                    prefix="REF"
                )
            ),
            vendor=payment.vendor,
            payment=payment,
            transaction_type=(
                VendorTransaction.TYPE_REFUND
            ),
            amount=refund_amount,
            currency=payment.currency,
            status=(
                VendorTransaction.STATUS_SUCCESS
            ),
            description=reason,
            transaction_date=timezone.now(),
        )
    )

    create_audit_log(
        actor=actor,
        vendor=payment.vendor,
        action=SuperAdminActivityLog.ACTION_REFUND,
        module="payments",
        title="Payment refunded",
        description=reason,
        new_values={
            "payment_id": str(
                payment.id
            ),
            "refund_amount": str(
                refund_amount
            ),
        },
        request=request,
    )

    return payment, refund_transaction


# ============================================================
# INVOICE
# ============================================================

@transaction.atomic
def create_invoice(
    *,
    actor,
    vendor,
    subtotal,
    tax_amount=Decimal("0.00"),
    discount_amount=Decimal("0.00"),
    due_date=None,
    subscription=None,
    notes="",
    status=VendorInvoice.STATUS_ISSUED,
    request=None,
):
    subtotal = Decimal(str(subtotal))
    tax_amount = Decimal(str(tax_amount))
    discount_amount = Decimal(
        str(discount_amount)
    )

    total = (
        subtotal
        + tax_amount
        - discount_amount
    )

    if total < Decimal("0.00"):
        raise ValidationServiceError(
            "Invoice total cannot be negative."
        )

    invoice = VendorInvoice.objects.create(
        invoice_number=_generate_invoice_number(),
        vendor=vendor,
        subscription=subscription,
        issue_date=timezone.localdate(),
        due_date=due_date,
        subtotal=subtotal,
        tax_amount=tax_amount,
        discount_amount=discount_amount,
        total_amount=total,
        paid_amount=Decimal("0.00"),
        currency=vendor.currency,
        status=status,
        notes=notes,
    )

    create_audit_log(
        actor=actor,
        vendor=vendor,
        action=SuperAdminActivityLog.ACTION_CREATE,
        module="invoices",
        title=(
            f"Invoice created: "
            f"{invoice.invoice_number}"
        ),
        new_values=_serialize_model_instance(
            invoice
        ),
        request=request,
    )

    return invoice


@transaction.atomic
def mark_invoice_paid(
    *,
    actor,
    invoice_id,
    paid_amount=None,
    request=None,
):
    invoice = (
        VendorInvoice.objects
        .select_for_update()
        .get(pk=invoice_id)
    )

    amount = (
        invoice.total_amount
        if paid_amount is None
        else Decimal(str(paid_amount))
    )

    if amount < Decimal("0.00"):
        raise ValidationServiceError(
            "Paid amount cannot be negative."
        )

    invoice.paid_amount += amount

    if invoice.paid_amount >= invoice.total_amount:
        invoice.paid_amount = (
            invoice.total_amount
        )
        invoice.status = (
            VendorInvoice.STATUS_PAID
        )

    invoice.save()

    create_audit_log(
        actor=actor,
        vendor=invoice.vendor,
        action=SuperAdminActivityLog.ACTION_PAYMENT,
        module="invoices",
        title=(
            f"Invoice marked paid: "
            f"{invoice.invoice_number}"
        ),
        new_values={
            "paid_amount": str(
                invoice.paid_amount
            ),
            "status": invoice.status,
        },
        request=request,
    )

    return invoice


# ============================================================
# DEFAULT VENDOR ROLES
# ============================================================

def create_default_vendor_roles(
    *,
    vendor,
):
    """
    Creates default roles.

    Actual permissions are attached separately
    because permissions are platform-level.
    """

    default_roles = [
        (
            "Owner",
            "owner",
            True,
        ),
        (
            "Administrator",
            "administrator",
            True,
        ),
        (
            "Manager",
            "manager",
            False,
        ),
        (
            "Staff",
            "staff",
            False,
        ),
        (
            "Accountant",
            "accountant",
            False,
        ),
        (
            "Receptionist",
            "receptionist",
            False,
        ),
    ]

    created = []

    for name, role_slug, system_role in default_roles:

        role, _ = (
            VendorRole.objects.get_or_create(
                vendor=vendor,
                name=name,
                defaults={
                    "slug": role_slug,
                    "is_system_role": system_role,
                    "is_active": True,
                },
            )
        )

        created.append(role)

    return created


# ============================================================
# PERMISSIONS
# ============================================================

@transaction.atomic
def assign_permission_to_role(
    *,
    actor,
    role_id,
    permission_id,
    request=None,
):
    role = VendorRole.objects.get(
        pk=role_id
    )

    permission = VendorPermission.objects.get(
        pk=permission_id
    )

    role_permission, created = (
        RolePermission.objects.get_or_create(
            role=role,
            permission=permission,
        )
    )

    if created:

        create_audit_log(
            actor=actor,
            vendor=role.vendor,
            action=SuperAdminActivityLog.ACTION_UPDATE,
            module="permissions",
            title="Permission assigned to role",
            new_values={
                "role": role.name,
                "permission": permission.code,
            },
            request=request,
        )

    return role_permission


@transaction.atomic
def remove_permission_from_role(
    *,
    actor,
    role_id,
    permission_id,
    request=None,
):
    role_permission = (
        RolePermission.objects
        .select_related(
            "role",
            "permission",
        )
        .filter(
            role_id=role_id,
            permission_id=permission_id,
        )
        .first()
    )

    if not role_permission:
        return False

    vendor = role_permission.role.vendor

    role_permission.delete()

    create_audit_log(
        actor=actor,
        vendor=vendor,
        action=SuperAdminActivityLog.ACTION_UPDATE,
        module="permissions",
        title="Permission removed from role",
        new_values={
            "role_id": str(role_id),
            "permission_id": str(
                permission_id
            ),
        },
        request=request,
    )

    return True


def user_has_permission(
    *,
    user,
    vendor,
    permission_code,
):
    """
    Check VendorRole based permission.

    VendorUser.role is still supported for basic
    built-in roles.
    """

    vendor_user = (
        VendorUser.objects
        .select_related(
            "vendor",
            "user",
        )
        .filter(
            vendor=vendor,
            user=user,
            is_active=True,
            can_login=True,
        )
        .first()
    )

    if not vendor_user:
        return False

    if not vendor_user.login_allowed:
        return False

    if vendor_user.role in {
        VendorUser.ROLE_OWNER,
        VendorUser.ROLE_ADMIN,
    }:
        return True

    role = (
        VendorRole.objects
        .filter(
            vendor=vendor,
            slug=vendor_user.role,
            is_active=True,
        )
        .first()
    )

    if not role:
        return False

    return RolePermission.objects.filter(
        role=role,
        permission__code=permission_code,
        permission__is_active=True,
    ).exists()


# ============================================================
# API KEY
# ============================================================

@transaction.atomic
def create_vendor_api_key(
    *,
    actor,
    vendor,
    name,
    expires_at=None,
    request=None,
):
    if not name:
        raise ValidationServiceError(
            "API key name is required."
        )

    # Public prefix
    prefix = (
        f"spl_{secrets.token_hex(4)}"
    )

    secret = secrets.token_urlsafe(32)

    raw_key = (
        f"{prefix}_{secret}"
    )

    secret_hash = hashlib.sha256(
        raw_key.encode("utf-8")
    ).hexdigest()

    api_key = VendorAPIKey.objects.create(
        vendor=vendor,
        name=name,
        key_prefix=prefix,
        secret_hash=secret_hash,
        is_active=True,
        expires_at=expires_at,
        created_by=actor,
    )

    create_audit_log(
        actor=actor,
        vendor=vendor,
        action=SuperAdminActivityLog.ACTION_CREATE,
        module="api_keys",
        title="Vendor API key created",
        new_values={
            "api_key_id": str(
                api_key.id
            ),
            "key_prefix": prefix,
        },
        request=request,
    )

    # Raw API key returned only once.
    return api_key, raw_key


def validate_vendor_api_key(
    *,
    raw_key,
):
    if not raw_key:
        return None

    secret_hash = hashlib.sha256(
        raw_key.encode("utf-8")
    ).hexdigest()

    api_key = (
        VendorAPIKey.objects
        .select_related("vendor")
        .filter(
            secret_hash=secret_hash,
            is_active=True,
        )
        .first()
    )

    if not api_key:
        return None

    now = timezone.now()

    if (
        api_key.expires_at
        and api_key.expires_at <= now
    ):
        api_key.is_active = False
        api_key.save(
            update_fields=[
                "is_active",
                "updated_at",
            ]
        )
        return None

    if not api_key.vendor.is_access_allowed:
        return None

    api_key.last_used_at = now

    api_key.save(
        update_fields=[
            "last_used_at",
            "updated_at",
        ]
    )

    return api_key


@transaction.atomic
def revoke_vendor_api_key(
    *,
    actor,
    api_key_id,
    request=None,
):
    api_key = (
        VendorAPIKey.objects
        .select_for_update()
        .select_related("vendor")
        .get(pk=api_key_id)
    )

    api_key.is_active = False
    api_key.save(
        update_fields=[
            "is_active",
            "updated_at",
        ]
    )

    create_audit_log(
        actor=actor,
        vendor=api_key.vendor,
        action=SuperAdminActivityLog.ACTION_DELETE,
        module="api_keys",
        title="Vendor API key revoked",
        request=request,
    )

    return api_key


# ============================================================
# SUPPORT TICKETS
# ============================================================

@transaction.atomic
def create_support_ticket(
    *,
    actor,
    vendor,
    subject,
    description,
    priority=SupportTicket.PRIORITY_NORMAL,
    request=None,
):
    if not subject:
        raise ValidationServiceError(
            "Ticket subject is required."
        )

    if not description:
        raise ValidationServiceError(
            "Ticket description is required."
        )

    ticket = SupportTicket.objects.create(
        vendor=vendor,
        created_by=actor,
        subject=subject,
        description=description,
        priority=priority,
        status=SupportTicket.STATUS_OPEN,
    )

    create_audit_log(
        actor=actor,
        vendor=vendor,
        action=SuperAdminActivityLog.ACTION_CREATE,
        module="support",
        title=(
            f"Support ticket created: "
            f"{ticket.ticket_number}"
        ),
        request=request,
    )

    return ticket


@transaction.atomic
def update_support_ticket(
    *,
    actor,
    ticket_id,
    status=None,
    priority=None,
    assigned_to=None,
    request=None,
):
    ticket = (
        SupportTicket.objects
        .select_for_update()
        .select_related("vendor")
        .get(pk=ticket_id)
    )

    if status is not None:
        ticket.status = status

        if status == SupportTicket.STATUS_RESOLVED:
            ticket.resolved_at = timezone.now()

        if status == SupportTicket.STATUS_CLOSED:
            ticket.closed_at = timezone.now()

    if priority is not None:
        ticket.priority = priority

    if assigned_to is not None:
        ticket.assigned_to = assigned_to

    ticket.save()

    create_audit_log(
        actor=actor,
        vendor=ticket.vendor,
        action=SuperAdminActivityLog.ACTION_UPDATE,
        module="support",
        title=(
            f"Support ticket updated: "
            f"{ticket.ticket_number}"
        ),
        new_values={
            "status": ticket.status,
            "priority": ticket.priority,
            "assigned_to": (
                str(ticket.assigned_to_id)
                if ticket.assigned_to_id
                else None
            ),
        },
        request=request,
    )

    return ticket


# ============================================================
# NOTIFICATIONS
# ============================================================

def create_notification(
    *,
    title,
    message,
    notification_type=PlatformNotification.TYPE_INFO,
    vendor=None,
    user=None,
    action_url="",
    expires_at=None,
):
    return PlatformNotification.objects.create(
        vendor=vendor,
        user=user,
        title=title,
        message=message,
        notification_type=notification_type,
        action_url=action_url,
        expires_at=expires_at,
    )


@transaction.atomic
def mark_notification_read(
    *,
    user,
    notification_id,
):
    notification = (
        PlatformNotification.objects
        .select_for_update()
        .filter(
            pk=notification_id,
            user=user,
        )
        .first()
    )

    if not notification:
        raise ValidationServiceError(
            "Notification not found."
        )

    notification.is_read = True
    notification.read_at = timezone.now()

    notification.save(
        update_fields=[
            "is_read",
            "read_at",
            "updated_at",
        ]
    )

    return notification


# ============================================================
# ANNOUNCEMENT
# ============================================================

@transaction.atomic
def create_announcement(
    *,
    actor,
    title,
    message,
    announcement_type=(
        PlatformAnnouncement.TYPE_INFO
    ),
    show_to_all_vendors=True,
    start_at=None,
    end_at=None,
):
    announcement = (
        PlatformAnnouncement.objects.create(
            title=title,
            message=message,
            announcement_type=announcement_type,
            show_to_all_vendors=(
                show_to_all_vendors
            ),
            start_at=(
                start_at
                or timezone.now()
            ),
            end_at=end_at,
            created_by=actor,
        )
    )

    create_audit_log(
        actor=actor,
        action=SuperAdminActivityLog.ACTION_CREATE,
        module="announcements",
        title="Platform announcement created",
        new_values=_serialize_model_instance(
            announcement
        ),
    )

    return announcement


# ============================================================
# DOMAIN
# ============================================================

@transaction.atomic
def create_vendor_domain(
    *,
    actor,
    vendor,
    domain,
    domain_type=VendorDomain.TYPE_SUBDOMAIN,
    is_primary=False,
    request=None,
):
    domain = domain.strip().lower()

    if VendorDomain.objects.filter(
        domain=domain
    ).exists():
        raise ValidationServiceError(
            "Domain already exists."
        )

    if is_primary:

        VendorDomain.objects.filter(
            vendor=vendor,
            is_primary=True,
        ).update(
            is_primary=False
        )

    verification_token = secrets.token_urlsafe(
        32
    )

    domain_obj = VendorDomain.objects.create(
        vendor=vendor,
        domain=domain,
        domain_type=domain_type,
        is_primary=is_primary,
        is_verified=False,
        verification_token=verification_token,
        ssl_enabled=False,
        is_active=True,
    )

    create_audit_log(
        actor=actor,
        vendor=vendor,
        action=SuperAdminActivityLog.ACTION_CREATE,
        module="domains",
        title="Vendor domain created",
        new_values={
            "domain": domain,
            "domain_type": domain_type,
            "is_primary": is_primary,
        },
        request=request,
    )

    return domain_obj


@transaction.atomic
def verify_vendor_domain(
    *,
    actor,
    domain_id,
    request=None,
):
    domain_obj = (
        VendorDomain.objects
        .select_for_update()
        .select_related("vendor")
        .get(pk=domain_id)
    )

    domain_obj.is_verified = True
    domain_obj.ssl_enabled = True

    domain_obj.save(
        update_fields=[
            "is_verified",
            "ssl_enabled",
            "updated_at",
        ]
    )

    create_audit_log(
        actor=actor,
        vendor=domain_obj.vendor,
        action=SuperAdminActivityLog.ACTION_UPDATE,
        module="domains",
        title="Vendor domain verified",
        new_values={
            "domain": domain_obj.domain,
            "is_verified": True,
            "ssl_enabled": True,
        },
        request=request,
    )

    return domain_obj


# ============================================================
# VENDOR LOGIN ACCESS
# ============================================================

def check_vendor_login_access(
    *,
    user,
    vendor,
):
    """
    Central login authorization.

    Use this during vendor login.
    """

    if not user or not user.is_active:
        return False

    if not vendor.is_active:
        return False

    if not vendor.login_enabled:
        return False

    if not vendor.is_access_allowed:
        return False

    vendor_user = (
        VendorUser.objects
        .filter(
            vendor=vendor,
            user=user,
            is_active=True,
            can_login=True,
        )
        .first()
    )

    if not vendor_user:
        return False

    return vendor_user.login_allowed


# ============================================================
# LOGIN SESSION
# ============================================================

@transaction.atomic
def create_vendor_login_session(
    *,
    vendor,
    user,
    session_key,
    request=None,
    expires_at=None,
    device_name="",
):
    if not check_vendor_login_access(
        user=user,
        vendor=vendor,
    ):
        raise VendorAccessError(
            "Vendor login access denied."
        )

    session = (
        VendorLoginSession.objects.create(
            vendor=vendor,
            user=user,
            session_key=session_key,
            ip_address=_get_client_ip(request),
            user_agent=_get_user_agent(request),
            device_name=device_name,
            last_activity_at=timezone.now(),
            expires_at=expires_at,
            is_active=True,
        )
    )

    vendor.last_login_at = timezone.now()
    vendor.save(
        update_fields=[
            "last_login_at",
            "updated_at",
        ]
    )

    VendorUser.objects.filter(
        vendor=vendor,
        user=user,
    ).update(
        last_login_at=timezone.now()
    )

    return session


@transaction.atomic
def revoke_vendor_session(
    *,
    session_id,
):
    session = (
        VendorLoginSession.objects
        .select_for_update()
        .get(pk=session_id)
    )

    session.is_active = False

    session.save(
        update_fields=[
            "is_active",
            "updated_at",
        ]
    )

    return session


@transaction.atomic
def revoke_all_vendor_sessions(
    *,
    vendor,
    except_session_key=None,
):
    queryset = VendorLoginSession.objects.filter(
        vendor=vendor,
        is_active=True,
    )

    if except_session_key:
        queryset = queryset.exclude(
            session_key=except_session_key
        )

    return queryset.update(
        is_active=False
    )


# ============================================================
# IMPERSONATION
# ============================================================

@transaction.atomic
def start_impersonation(
    *,
    admin_user,
    vendor,
    target_user,
    reason,
    request=None,
    duration_minutes=30,
):
    if not admin_user.is_staff:
        raise ImpersonationError(
            "Only staff/admin users can impersonate."
        )

    if not reason:
        raise ImpersonationError(
            "Impersonation reason is required."
        )

    if not check_vendor_login_access(
        user=target_user,
        vendor=vendor,
    ):
        raise ImpersonationError(
            "Target user does not have vendor access."
        )

    # End existing active impersonation
    AdminImpersonationSession.objects.filter(
        admin_user=admin_user,
        is_active=True,
    ).update(
        is_active=False,
        ended_at=timezone.now(),
    )

    now = timezone.now()

    session = (
        AdminImpersonationSession.objects.create(
            admin_user=admin_user,
            vendor=vendor,
            target_user=target_user,
            started_at=now,
            expires_at=(
                now
                + timedelta(
                    minutes=duration_minutes
                )
            ),
            reason=reason,
            ip_address=_get_client_ip(request),
            is_active=True,
        )
    )

    create_audit_log(
        actor=admin_user,
        vendor=vendor,
        action=(
            SuperAdminActivityLog.ACTION_IMPERSONATE
        ),
        module="impersonation",
        title="Vendor impersonation started",
        description=reason,
        new_values={
            "session_id": str(
                session.id
            ),
            "target_user": str(
                target_user.id
            ),
        },
        request=request,
    )

    return session


@transaction.atomic
def end_impersonation(
    *,
    admin_user,
    session_id,
    request=None,
):
    session = (
        AdminImpersonationSession.objects
        .select_for_update()
        .select_related("vendor")
        .get(
            pk=session_id,
            admin_user=admin_user,
            is_active=True,
        )
    )

    session.is_active = False
    session.ended_at = timezone.now()

    session.save(
        update_fields=[
            "is_active",
            "ended_at",
            "updated_at",
        ]
    )

    create_audit_log(
        actor=admin_user,
        vendor=session.vendor,
        action=(
            SuperAdminActivityLog.ACTION_IMPERSONATE
        ),
        module="impersonation",
        title="Vendor impersonation ended",
        request=request,
    )

    return session


# ============================================================
# DASHBOARD STATISTICS
# ============================================================

def get_superadmin_dashboard_stats():
    """
    Dashboard statistics.

    Designed for API/dashboard endpoint.
    """

    now = timezone.now()

    total_vendors = Vendor.objects.count()

    active_vendors = Vendor.objects.filter(
        status=Vendor.STATUS_ACTIVE,
        is_active=True,
    ).count()

    trial_vendors = Vendor.objects.filter(
        status=Vendor.STATUS_TRIAL,
        is_active=True,
    ).count()

    suspended_vendors = Vendor.objects.filter(
        status=Vendor.STATUS_SUSPENDED
    ).count()

    expired_vendors = Vendor.objects.filter(
        status=Vendor.STATUS_EXPIRED
    ).count()

    total_users = VendorUser.objects.count()

    active_users = VendorUser.objects.filter(
        is_active=True,
        can_login=True,
    ).count()

    active_subscriptions = (
        VendorSubscription.objects.filter(
            status__in=[
                VendorSubscription.STATUS_ACTIVE,
                VendorSubscription.STATUS_TRIAL,
            ],
            current_period_end__gt=now,
        ).count()
    )

    successful_payments = (
        VendorPayment.objects.filter(
            status=VendorPayment.STATUS_SUCCESS
        )
    )

    revenue = (
        successful_payments
        .values_list("amount", flat=True)
    )

    total_revenue = sum(
        revenue,
        Decimal("0.00")
    )

    pending_tickets = (
        SupportTicket.objects.filter(
            status__in=[
                SupportTicket.STATUS_OPEN,
                SupportTicket.STATUS_IN_PROGRESS,
                SupportTicket.STATUS_WAITING,
            ]
        ).count()
    )

    expiring_licenses = (
        VendorLicense.objects.filter(
            status=VendorLicense.STATUS_ACTIVE,
            expires_at__gt=now,
            expires_at__lte=(
                now + timedelta(days=7)
            ),
        ).count()
    )

    return {
        "vendors": {
            "total": total_vendors,
            "active": active_vendors,
            "trial": trial_vendors,
            "suspended": suspended_vendors,
            "expired": expired_vendors,
        },
        "users": {
            "total": total_users,
            "active": active_users,
        },
        "subscriptions": {
            "active": active_subscriptions,
        },
        "revenue": {
            "total": total_revenue,
            "currency": "INR",
        },
        "support": {
            "pending": pending_tickets,
        },
        "licenses": {
            "expiring_next_7_days": expiring_licenses,
        },
    }


# ============================================================
# AUTOMATIC EXPIRATION JOB
# ============================================================

@transaction.atomic
def process_expired_subscriptions():
    """
    Run periodically using Celery/Cron.

    Example:
        Every 10-15 minutes.
    """

    now = timezone.now()

    subscriptions = (
        VendorSubscription.objects
        .select_for_update()
        .filter(
            status__in=[
                VendorSubscription.STATUS_ACTIVE,
                VendorSubscription.STATUS_TRIAL,
            ],
            current_period_end__lte=now,
        )
    )

    processed = 0

    for subscription in subscriptions:

        expire_subscription(
            subscription=subscription
        )

        processed += 1

    return processed


# ============================================================
# AUTOMATIC LICENSE EXPIRATION
# ============================================================

@transaction.atomic
def process_expired_licenses():
    now = timezone.now()

    updated = (
        VendorLicense.objects
        .filter(
            status=VendorLicense.STATUS_ACTIVE,
            expires_at__lte=now,
        )
        .update(
            status=VendorLicense.STATUS_EXPIRED,
            updated_at=now,
        )
    )

    return updated


# ============================================================
# AUTOMATIC INVOICE OVERDUE
# ============================================================

@transaction.atomic
def process_overdue_invoices():
    today = timezone.localdate()

    updated = (
        VendorInvoice.objects
        .filter(
            status=VendorInvoice.STATUS_ISSUED,
            due_date__lt=today,
        )
        .update(
            status=VendorInvoice.STATUS_OVERDUE,
            updated_at=timezone.now(),
        )
    )

    return updated


# ============================================================
# VENDOR SEARCH
# ============================================================

def search_vendors(
    *,
    query="",
    status=None,
    is_active=None,
    page_size=25,
):
    queryset = Vendor.objects.all()

    if query:
        queryset = queryset.filter(
            Q(business_name__icontains=query)
            | Q(email__icontains=query)
            | Q(phone__icontains=query)
            | Q(registration_number__icontains=query)
        )

    if status:
        queryset = queryset.filter(
            status=status
        )

    if is_active is not None:
        queryset = queryset.filter(
            is_active=is_active
        )

    return queryset.order_by(
        "-created_at"
    )[:page_size]


# ============================================================
# VENDOR DETAIL
# ============================================================

def get_vendor_detail(
    *,
    vendor_id,
):
    return (
        Vendor.objects
        .select_related("owner")
        .prefetch_related(
            "users",
            "subscriptions__plan",
            "licenses",
            "payments",
            "invoices",
            "support_tickets",
            "domains",
        )
        .get(pk=vendor_id)
    )


# ============================================================
# USER MANAGEMENT
# ============================================================

@transaction.atomic
def create_vendor_user(
    *,
    actor,
    vendor,
    email,
    role=VendorUser.ROLE_STAFF,
    password=None,
    first_name="",
    last_name="",
    username=None,
    request=None,
):
    if not email:
        raise ValidationServiceError(
            "Email is required."
        )

    if User.objects.filter(
        email__iexact=email
    ).exists():
        raise ValidationServiceError(
            "Email is already registered."
        )

    user, temporary_password = create_vendor_owner(
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
        username=username,
    )

    vendor_user = VendorUser.objects.create(
        vendor=vendor,
        user=user,
        role=role,
        is_active=True,
        is_primary=False,
        can_login=True,
    )

    create_audit_log(
        actor=actor,
        vendor=vendor,
        action=SuperAdminActivityLog.ACTION_CREATE,
        module="users",
        title="Vendor user created",
        new_values={
            "user_id": str(
                user.id
            ),
            "vendor_user_id": str(
                vendor_user.id
            ),
            "role": role,
        },
        request=request,
    )

    return {
        "user": user,
        "vendor_user": vendor_user,
        "temporary_password": temporary_password,
    }


@transaction.atomic
def deactivate_vendor_user(
    *,
    actor,
    vendor_user_id,
    request=None,
):
    vendor_user = (
        VendorUser.objects
        .select_for_update()
        .select_related(
            "vendor",
            "user",
        )
        .get(pk=vendor_user_id)
    )

    if vendor_user.is_primary:
        raise ValidationServiceError(
            "Primary vendor owner cannot be deactivated."
        )

    vendor_user.is_active = False
    vendor_user.can_login = False
    vendor_user.save()

    vendor_user.user.is_active = False
    vendor_user.user.save(
        update_fields=[
            "is_active",
        ]
    )

    create_audit_log(
        actor=actor,
        vendor=vendor_user.vendor,
        action=SuperAdminActivityLog.ACTION_UPDATE,
        module="users",
        title="Vendor user deactivated",
        new_values={
            "user_id": str(
                vendor_user.user.id
            ),
            "vendor_user_id": str(
                vendor_user.id
            ),
        },
        request=request,
    )

    return vendor_user


# ============================================================
# SECURITY SETTINGS
# ============================================================

@transaction.atomic
def update_security_settings(
    *,
    actor,
    data,
    request=None,
):
    obj = (
        SuperAdminSecuritySettings.objects
        .select_for_update()
        .first()
    )

    if not obj:
        obj = (
            SuperAdminSecuritySettings.objects.create()
        )

    old_values = _serialize_model_instance(obj)

    allowed = {
        field.name
        for field in obj._meta.fields
        if field.name not in {
            "id",
            "created_at",
            "updated_at",
        }
    }

    for field, value in data.items():

        if field in allowed:
            setattr(obj, field, value)

    obj.save()

    create_audit_log(
        actor=actor,
        action=SuperAdminActivityLog.ACTION_SETTINGS,
        module="security",
        title="Security settings updated",
        old_values=old_values,
        new_values=_serialize_model_instance(obj),
        request=request,
    )

    return obj


# ============================================================
# EMAIL SETTINGS
# ============================================================

@transaction.atomic
def update_email_settings(
    *,
    actor,
    data,
    request=None,
):
    obj = (
        SuperAdminEmailSettings.objects
        .select_for_update()
        .first()
    )

    if not obj:
        obj = (
            SuperAdminEmailSettings.objects.create()
        )

    old_values = _serialize_model_instance(obj)

    allowed = {
        field.name
        for field in obj._meta.fields
        if field.name not in {
            "id",
            "created_at",
            "updated_at",
        }
    }

    for field, value in data.items():

        if field in allowed:
            setattr(obj, field, value)

    obj.save()

    create_audit_log(
        actor=actor,
        action=SuperAdminActivityLog.ACTION_SETTINGS,
        module="email_settings",
        title="Email settings updated",
        old_values=old_values,
        new_values=_serialize_model_instance(obj),
        request=request,
    )

    return obj


# ============================================================
# PAYMENT SETTINGS
# ============================================================

@transaction.atomic
def update_payment_settings(
    *,
    actor,
    data,
    request=None,
):
    obj = (
        SuperAdminPaymentSettings.objects
        .select_for_update()
        .first()
    )

    if not obj:
        obj = (
            SuperAdminPaymentSettings.objects.create()
        )

    old_values = _serialize_model_instance(obj)

    allowed = {
        field.name
        for field in obj._meta.fields
        if field.name not in {
            "id",
            "created_at",
            "updated_at",
        }
    }

    for field, value in data.items():

        if field in allowed:
            setattr(obj, field, value)

    obj.save()

    create_audit_log(
        actor=actor,
        action=SuperAdminActivityLog.ACTION_SETTINGS,
        module="payment_settings",
        title="Payment settings updated",
        old_values=old_values,
        new_values=_serialize_model_instance(obj),
        request=request,
    )

    return obj


# ============================================================
# END OF SERVICES
# ============================================================
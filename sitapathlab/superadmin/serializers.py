# ============================================================
# SITA PATH LAB
# SUPER ADMIN / MULTI-TENANT SAAS
# PRODUCTION DRF SERIALIZERS
# ============================================================

from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone

from rest_framework import serializers

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
# COMMON USER SERIALIZER
# ============================================================

class UserBasicSerializer(serializers.ModelSerializer):
    """
    Safe representation of Django User.
    Password is NEVER exposed.
    """

    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "is_active",
            "is_staff",
            "date_joined",
            "last_login",
        ]
        read_only_fields = [
            "id",
            "date_joined",
            "last_login",
        ]

    def get_full_name(self, obj):
        return obj.get_full_name().strip() or obj.username


# ============================================================
# SUBSCRIPTION PLAN
# ============================================================

class SubscriptionPlanSerializer(serializers.ModelSerializer):

    class Meta:
        model = SubscriptionPlan

        fields = [
            "id",
            "name",
            "slug",
            "description",
            "price",
            "billing_cycle",
            "duration_days",

            "max_users",
            "max_patients",
            "max_doctors",
            "max_storage_mb",
            "max_monthly_reports",
            "max_appointments",
            "max_invoices",

            "dashboard_enabled",
            "patients_enabled",
            "appointments_enabled",
            "billing_enabled",
            "inventory_enabled",
            "reports_enabled",
            "staff_management_enabled",
            "analytics_enabled",

            "whatsapp_enabled",
            "sms_enabled",
            "email_enabled",

            "api_access_enabled",
            "backup_enabled",
            "export_enabled",
            "custom_branding_enabled",

            "priority_support",

            "is_active",
            "is_public",
            "is_featured",
            "sort_order",

            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "slug",
            "created_at",
            "updated_at",
        ]

    def validate_price(self, value):
        if value < Decimal("0.00"):
            raise serializers.ValidationError(
                "Price cannot be negative."
            )
        return value

    def validate_duration_days(self, value):
        if value < 1:
            raise serializers.ValidationError(
                "Duration must be at least 1 day."
            )
        return value


# ============================================================
# VENDOR
# ============================================================

class VendorSerializer(serializers.ModelSerializer):

    owner_details = UserBasicSerializer(
        source="owner",
        read_only=True,
    )

    owner_username = serializers.ReadOnlyField()
    owner_email = serializers.ReadOnlyField()
    owner_name = serializers.ReadOnlyField()

    is_access_allowed = serializers.ReadOnlyField()

    class Meta:
        model = Vendor

        fields = [
            "id",

            "business_name",
            "slug",
            "legal_name",
            "registration_number",
            "license_number",
            "tax_number",

            "owner",
            "owner_details",
            "owner_username",
            "owner_email",
            "owner_name",

            "email",
            "phone",
            "alternate_phone",
            "website",

            "address",
            "city",
            "state",
            "country",
            "postal_code",

            "logo",
            "primary_color",
            "secondary_color",

            "status",
            "is_active",
            "is_verified",

            "login_enabled",
            "force_password_change",
            "allow_multiple_sessions",

            "trial_started_at",
            "trial_ends_at",

            "last_login_at",
            "suspended_at",
            "suspended_reason",

            "admin_notes",

            "timezone",
            "currency",

            "onboarding_completed",
            "onboarding_completed_at",

            "is_access_allowed",

            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "slug",
            "last_login_at",
            "suspended_at",
            "onboarding_completed_at",
            "is_access_allowed",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):

        email = attrs.get("email")

        if email:
            email = email.lower().strip()
            attrs["email"] = email

        return attrs


# ============================================================
# VENDOR CREATE SERIALIZER
# ============================================================

class VendorCreateSerializer(serializers.ModelSerializer):

    owner_username = serializers.CharField(
        write_only=True,
        required=True,
    )

    owner_password = serializers.CharField(
        write_only=True,
        required=True,
        min_length=8,
        style={
            "input_type": "password"
        },
    )

    owner_first_name = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
    )

    owner_last_name = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
    )

    owner_email = serializers.EmailField(
        write_only=True,
        required=True,
    )

    class Meta:
        model = Vendor

        fields = [
            "id",

            "business_name",
            "legal_name",
            "registration_number",
            "license_number",
            "tax_number",

            "email",
            "phone",
            "alternate_phone",
            "website",

            "address",
            "city",
            "state",
            "country",
            "postal_code",

            "logo",
            "primary_color",
            "secondary_color",

            "status",
            "is_active",
            "is_verified",
            "login_enabled",
            "force_password_change",
            "allow_multiple_sessions",

            "trial_started_at",
            "trial_ends_at",

            "admin_notes",
            "timezone",
            "currency",

            "owner_username",
            "owner_password",
            "owner_first_name",
            "owner_last_name",
            "owner_email",
        ]

        read_only_fields = [
            "id",
        ]

    def validate_owner_username(self, value):

        value = value.strip()

        if User.objects.filter(
            username__iexact=value
        ).exists():
            raise serializers.ValidationError(
                "Username already exists."
            )

        return value

    def validate_owner_email(self, value):

        value = value.lower().strip()

        if User.objects.filter(
            email__iexact=value
        ).exists():
            raise serializers.ValidationError(
                "Email already exists."
            )

        return value

    @transaction.atomic
    def create(self, validated_data):

        username = validated_data.pop(
            "owner_username"
        )

        password = validated_data.pop(
            "owner_password"
        )

        first_name = validated_data.pop(
            "owner_first_name",
            "",
        )

        last_name = validated_data.pop(
            "owner_last_name",
            "",
        )

        email = validated_data.pop(
            "owner_email"
        )

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
        )

        vendor = Vendor.objects.create(
            owner=user,
            **validated_data,
        )

        VendorUser.objects.create(
            vendor=vendor,
            user=user,
            role=VendorUser.ROLE_OWNER,
            is_active=True,
            is_primary=True,
            can_login=True,
        )

        VendorFeature.objects.get_or_create(
            vendor=vendor
        )

        VendorLimit.objects.get_or_create(
            vendor=vendor
        )

        return vendor


# ============================================================
# VENDOR USER
# ============================================================

class VendorUserSerializer(serializers.ModelSerializer):

    user_details = UserBasicSerializer(
        source="user",
        read_only=True,
    )

    username = serializers.ReadOnlyField()
    email = serializers.ReadOnlyField()
    full_name = serializers.ReadOnlyField()
    login_allowed = serializers.ReadOnlyField()

    class Meta:
        model = VendorUser

        fields = [
            "id",
            "vendor",
            "user",
            "user_details",

            "username",
            "email",
            "full_name",

            "role",

            "is_active",
            "is_primary",
            "can_login",

            "last_login_at",
            "login_allowed",

            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "username",
            "email",
            "full_name",
            "last_login_at",
            "login_allowed",
            "created_at",
            "updated_at",
        ]


# ============================================================
# VENDOR SUBSCRIPTION
# ============================================================

class VendorSubscriptionSerializer(
    serializers.ModelSerializer
):

    plan_details = SubscriptionPlanSerializer(
        source="plan",
        read_only=True,
    )

    vendor_name = serializers.CharField(
        source="vendor.business_name",
        read_only=True,
    )

    is_current = serializers.ReadOnlyField()
    days_remaining = serializers.ReadOnlyField()

    class Meta:
        model = VendorSubscription

        fields = [
            "id",

            "vendor",
            "vendor_name",

            "plan",
            "plan_details",

            "status",

            "started_at",
            "current_period_start",
            "current_period_end",

            "cancelled_at",
            "auto_renew",

            "amount",
            "currency",

            "custom_max_users",
            "custom_max_patients",

            "notes",
            "renewal_count",
            "last_renewed_at",

            "is_current",
            "days_remaining",

            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "is_current",
            "days_remaining",
            "renewal_count",
            "last_renewed_at",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):

        start = attrs.get(
            "current_period_start"
        )

        end = attrs.get(
            "current_period_end"
        )

        if start and end and end <= start:
            raise serializers.ValidationError({
                "current_period_end":
                    "End date must be after start date."
            })

        return attrs


# ============================================================
# LICENSE
# ============================================================

class VendorLicenseSerializer(
    serializers.ModelSerializer
):

    vendor_name = serializers.CharField(
        source="vendor.business_name",
        read_only=True,
    )

    is_valid = serializers.ReadOnlyField()

    class Meta:
        model = VendorLicense

        fields = [
            "id",

            "vendor",
            "vendor_name",

            "subscription",

            "name",

            "key_prefix",

            "status",

            "issued_at",
            "starts_at",
            "expires_at",

            "revoked_at",
            "revoked_reason",

            "last_validated_at",
            "validation_count",

            "created_by",

            "is_valid",

            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "key_prefix",
            "issued_at",
            "revoked_at",
            "last_validated_at",
            "validation_count",
            "created_by",
            "is_valid",
            "created_at",
            "updated_at",
        ]


# ============================================================
# PAYMENT
# ============================================================

class VendorPaymentSerializer(
    serializers.ModelSerializer
):

    vendor_name = serializers.CharField(
        source="vendor.business_name",
        read_only=True,
    )

    class Meta:
        model = VendorPayment

        fields = [
            "id",

            "vendor",
            "vendor_name",

            "subscription",

            "transaction_id",

            "amount",
            "currency",

            "payment_method",
            "status",
            "payment_date",

            "gateway",

            "gateway_payment_id",
            "gateway_order_id",

            "invoice_number",
            "description",

            "refund_amount",
            "refunded_at",

            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):

        amount = attrs.get("amount")

        refund = attrs.get(
            "refund_amount",
            Decimal("0.00"),
        )

        if amount is not None and amount < 0:
            raise serializers.ValidationError({
                "amount":
                    "Amount cannot be negative."
            })

        if refund < 0:
            raise serializers.ValidationError({
                "refund_amount":
                    "Refund amount cannot be negative."
            })

        if (
            amount is not None
            and refund > amount
        ):
            raise serializers.ValidationError({
                "refund_amount":
                    "Refund cannot exceed payment amount."
            })

        return attrs


# ============================================================
# INVOICE
# ============================================================

class VendorInvoiceSerializer(
    serializers.ModelSerializer
):

    vendor_name = serializers.CharField(
        source="vendor.business_name",
        read_only=True,
    )

    balance_due = serializers.SerializerMethodField()

    class Meta:
        model = VendorInvoice

        fields = [
            "id",

            "invoice_number",

            "vendor",
            "vendor_name",

            "subscription",

            "issue_date",
            "due_date",

            "subtotal",
            "tax_amount",
            "discount_amount",
            "total_amount",
            "paid_amount",

            "balance_due",

            "currency",
            "status",
            "notes",

            "pdf_file",

            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "balance_due",
            "created_at",
            "updated_at",
        ]

    def get_balance_due(self, obj):

        balance = (
            obj.total_amount -
            obj.paid_amount
        )

        return max(
            balance,
            Decimal("0.00")
        )

    def validate(self, attrs):

        subtotal = attrs.get(
            "subtotal",
            Decimal("0.00"),
        )

        tax = attrs.get(
            "tax_amount",
            Decimal("0.00"),
        )

        discount = attrs.get(
            "discount_amount",
            Decimal("0.00"),
        )

        total = attrs.get(
            "total_amount"
        )

        if (
            subtotal < 0
            or tax < 0
            or discount < 0
        ):
            raise serializers.ValidationError(
                "Invoice amounts cannot be negative."
            )

        if total is not None and total < 0:
            raise serializers.ValidationError({
                "total_amount":
                    "Total amount cannot be negative."
            })

        return attrs


# ============================================================
# TRANSACTION
# ============================================================

class VendorTransactionSerializer(
    serializers.ModelSerializer
):

    vendor_name = serializers.CharField(
        source="vendor.business_name",
        read_only=True,
    )

    class Meta:
        model = VendorTransaction

        fields = [
            "id",

            "transaction_number",

            "vendor",
            "vendor_name",

            "payment",
            "invoice",

            "transaction_type",

            "amount",
            "currency",

            "status",
            "description",
            "transaction_date",

            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

    def validate_amount(self, value):

        if value < Decimal("0.00"):
            raise serializers.ValidationError(
                "Amount cannot be negative."
            )

        return value


# ============================================================
# VENDOR FEATURE
# ============================================================

class VendorFeatureSerializer(
    serializers.ModelSerializer
):

    vendor_name = serializers.CharField(
        source="vendor.business_name",
        read_only=True,
    )

    class Meta:
        model = VendorFeature

        fields = [
            "vendor",
            "vendor_name",

            "dashboard_enabled",
            "patients_enabled",
            "appointments_enabled",
            "billing_enabled",
            "inventory_enabled",
            "reports_enabled",
            "staff_enabled",
            "analytics_enabled",

            "whatsapp_enabled",
            "sms_enabled",
            "email_enabled",

            "api_enabled",
            "backup_enabled",
            "export_enabled",

            "custom_branding_enabled",

            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "created_at",
            "updated_at",
        ]


# ============================================================
# VENDOR LIMIT
# ============================================================

class VendorLimitSerializer(
    serializers.ModelSerializer
):

    vendor_name = serializers.CharField(
        source="vendor.business_name",
        read_only=True,
    )

    class Meta:
        model = VendorLimit

        fields = [
            "vendor",
            "vendor_name",

            "max_users",
            "max_patients",
            "max_doctors",
            "max_storage_mb",
            "max_monthly_reports",
            "max_appointments",
            "max_invoices",

            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "created_at",
            "updated_at",
        ]


# ============================================================
# API KEY
# ============================================================

class VendorAPIKeySerializer(
    serializers.ModelSerializer
):

    vendor_name = serializers.CharField(
        source="vendor.business_name",
        read_only=True,
    )

    class Meta:
        model = VendorAPIKey

        fields = [
            "id",

            "vendor",
            "vendor_name",

            "name",
            "key_prefix",

            "is_active",
            "last_used_at",
            "expires_at",

            "created_by",

            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "key_prefix",
            "last_used_at",
            "created_by",
            "created_at",
            "updated_at",
        ]

        # secret_hash deliberately excluded.


# ============================================================
# ROLE
# ============================================================

class VendorRoleSerializer(
    serializers.ModelSerializer
):

    vendor_name = serializers.CharField(
        source="vendor.business_name",
        read_only=True,
    )

    permission_count = serializers.SerializerMethodField()

    class Meta:
        model = VendorRole

        fields = [
            "id",

            "vendor",
            "vendor_name",

            "name",
            "slug",
            "description",

            "is_system_role",
            "is_active",

            "permission_count",

            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "slug",
            "permission_count",
            "created_at",
            "updated_at",
        ]

    def get_permission_count(self, obj):
        return obj.permissions.count()


# ============================================================
# PERMISSION
# ============================================================

class VendorPermissionSerializer(
    serializers.ModelSerializer
):

    class Meta:
        model = VendorPermission

        fields = [
            "id",
            "module",
            "action",
            "code",
            "description",
            "is_active",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]


# ============================================================
# ROLE PERMISSION
# ============================================================

class RolePermissionSerializer(
    serializers.ModelSerializer
):

    role_name = serializers.CharField(
        source="role.name",
        read_only=True,
    )

    permission_details = VendorPermissionSerializer(
        source="permission",
        read_only=True,
    )

    class Meta:
        model = RolePermission

        fields = [
            "id",
            "role",
            "role_name",
            "permission",
            "permission_details",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]


# ============================================================
# ACTIVITY LOG
# ============================================================

class SuperAdminActivityLogSerializer(
    serializers.ModelSerializer
):

    actor_details = UserBasicSerializer(
        source="actor",
        read_only=True,
    )

    vendor_name = serializers.CharField(
        source="vendor.business_name",
        read_only=True,
        allow_null=True,
    )

    class Meta:
        model = SuperAdminActivityLog

        fields = [
            "id",

            "actor",
            "actor_details",

            "vendor",
            "vendor_name",

            "action",
            "module",

            "title",
            "description",

            "old_values",
            "new_values",

            "ip_address",
            "user_agent",
            "request_id",

            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]


# ============================================================
# SUPPORT TICKET
# ============================================================

class SupportTicketSerializer(
    serializers.ModelSerializer
):

    vendor_name = serializers.CharField(
        source="vendor.business_name",
        read_only=True,
    )

    created_by_details = UserBasicSerializer(
        source="created_by",
        read_only=True,
    )

    assigned_to_details = UserBasicSerializer(
        source="assigned_to",
        read_only=True,
    )

    class Meta:
        model = SupportTicket

        fields = [
            "id",

            "ticket_number",

            "vendor",
            "vendor_name",

            "created_by",
            "created_by_details",

            "subject",
            "description",

            "status",
            "priority",

            "assigned_to",
            "assigned_to_details",

            "resolved_at",
            "closed_at",

            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "ticket_number",
            "resolved_at",
            "closed_at",
            "created_at",
            "updated_at",
        ]


# ============================================================
# NOTIFICATION
# ============================================================

class PlatformNotificationSerializer(
    serializers.ModelSerializer
):

    vendor_name = serializers.CharField(
        source="vendor.business_name",
        read_only=True,
        allow_null=True,
    )

    class Meta:
        model = PlatformNotification

        fields = [
            "id",

            "vendor",
            "vendor_name",

            "user",

            "title",
            "message",

            "notification_type",

            "is_read",
            "read_at",

            "action_url",
            "expires_at",

            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "read_at",
            "created_at",
            "updated_at",
        ]


# ============================================================
# PLATFORM ANNOUNCEMENT
# ============================================================

class PlatformAnnouncementSerializer(
    serializers.ModelSerializer
):

    created_by_details = UserBasicSerializer(
        source="created_by",
        read_only=True,
    )

    class Meta:
        model = PlatformAnnouncement

        fields = [
            "id",

            "title",
            "message",
            "announcement_type",

            "is_active",
            "show_to_all_vendors",

            "start_at",
            "end_at",

            "created_by",
            "created_by_details",

            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_by",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):

        start = attrs.get("start_at")
        end = attrs.get("end_at")

        if (
            start
            and end
            and end <= start
        ):
            raise serializers.ValidationError({
                "end_at":
                    "End time must be after start time."
            })

        return attrs


# ============================================================
# VENDOR LOGIN SESSION
# ============================================================

class VendorLoginSessionSerializer(
    serializers.ModelSerializer
):

    vendor_name = serializers.CharField(
        source="vendor.business_name",
        read_only=True,
    )

    user_details = UserBasicSerializer(
        source="user",
        read_only=True,
    )

    class Meta:
        model = VendorLoginSession

        fields = [
            "id",

            "vendor",
            "vendor_name",

            "user",
            "user_details",

            "session_key",

            "ip_address",
            "user_agent",
            "device_name",

            "last_activity_at",
            "expires_at",

            "is_active",

            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "session_key",
            "last_activity_at",
            "created_at",
            "updated_at",
        ]


# ============================================================
# VENDOR DOMAIN
# ============================================================

class VendorDomainSerializer(
    serializers.ModelSerializer
):

    vendor_name = serializers.CharField(
        source="vendor.business_name",
        read_only=True,
    )

    class Meta:
        model = VendorDomain

        fields = [
            "id",

            "vendor",
            "vendor_name",

            "domain",
            "domain_type",

            "is_primary",
            "is_verified",

            "verification_token",

            "ssl_enabled",
            "is_active",

            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "is_verified",
            "ssl_enabled",
            "created_at",
            "updated_at",
        ]

    def validate_domain(self, value):

        value = value.strip().lower()

        if "://" in value:
            raise serializers.ValidationError(
                "Enter domain without http:// or https://."
            )

        return value


# ============================================================
# IMPERSONATION SESSION
# ============================================================

class AdminImpersonationSessionSerializer(
    serializers.ModelSerializer
):

    admin_details = UserBasicSerializer(
        source="admin_user",
        read_only=True,
    )

    target_details = UserBasicSerializer(
        source="target_user",
        read_only=True,
    )

    vendor_name = serializers.CharField(
        source="vendor.business_name",
        read_only=True,
    )

    class Meta:
        model = AdminImpersonationSession

        fields = [
            "id",

            "admin_user",
            "admin_details",

            "vendor",
            "vendor_name",

            "target_user",
            "target_details",

            "started_at",
            "ended_at",
            "expires_at",

            "reason",

            "ip_address",

            "is_active",

            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "started_at",
            "ended_at",
            "created_at",
            "updated_at",
        ]


# ============================================================
# SYSTEM SETTINGS
# ============================================================

class SuperAdminSystemSettingsSerializer(
    serializers.ModelSerializer
):

    class Meta:
        model = SuperAdminSystemSettings

        fields = [
            "id",

            "platform_name",

            "support_email",
            "support_phone",

            "maintenance_mode",

            "allow_new_vendors",
            "allow_vendor_registration",

            "default_trial_days",

            "session_timeout_minutes",

            "max_login_attempts",
            "lockout_minutes",

            "require_strong_password",
            "require_2fa",

            "enable_audit_logs",
            "enable_email_notifications",
            "enable_sms_notifications",
            "enable_whatsapp_notifications",

            "enforce_license_validation",
            "block_expired_vendors",

            "max_active_sessions_per_user",

            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]


# ============================================================
# EMAIL SETTINGS
# ============================================================

class SuperAdminEmailSettingsSerializer(
    serializers.ModelSerializer
):

    class Meta:
        model = SuperAdminEmailSettings

        fields = [
            "id",

            "provider",
            "host",
            "port",
            "username",

            # password deliberately excluded

            "use_tls",
            "use_ssl",

            "from_email",

            "is_active",

            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]


# ============================================================
# PAYMENT SETTINGS
# ============================================================

class SuperAdminPaymentSettingsSerializer(
    serializers.ModelSerializer
):

    class Meta:
        model = SuperAdminPaymentSettings

        fields = [
            "id",

            "currency",

            "razorpay_enabled",
            "razorpay_key_id",

            # razorpay_key_secret excluded

            "stripe_enabled",
            "stripe_public_key",

            # stripe_secret_key excluded

            "test_mode",

            "auto_generate_invoice",
            "payment_due_days",

            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]


# ============================================================
# SECURITY SETTINGS
# ============================================================

class SuperAdminSecuritySettingsSerializer(
    serializers.ModelSerializer
):

    class Meta:
        model = SuperAdminSecuritySettings

        fields = [
            "id",

            "require_2fa_for_admin",
            "require_2fa_for_vendor",

            "password_expiry_days",

            "max_login_attempts",
            "lockout_duration_minutes",

            "session_timeout_minutes",

            "allow_multiple_sessions",

            "track_ip_address",
            "track_device",

            "enable_login_alerts",
            "enable_suspicious_activity_detection",

            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]


# ============================================================
# DASHBOARD SERIALIZERS
# ============================================================

class DashboardVendorSerializer(
    serializers.ModelSerializer
):

    subscription_status = serializers.SerializerMethodField()
    plan_name = serializers.SerializerMethodField()
    days_remaining = serializers.SerializerMethodField()

    class Meta:
        model = Vendor

        fields = [
            "id",
            "business_name",
            "email",
            "phone",
            "status",
            "is_active",
            "is_verified",
            "created_at",

            "subscription_status",
            "plan_name",
            "days_remaining",
        ]

    def get_subscription(
        self,
        obj
    ):

        return (
            obj.subscriptions
            .filter(
                status__in=[
                    VendorSubscription.STATUS_ACTIVE,
                    VendorSubscription.STATUS_TRIAL,
                ]
            )
            .order_by(
                "-current_period_end"
            )
            .first()
        )

    def get_subscription_status(
        self,
        obj
    ):

        subscription = self.get_subscription(obj)

        if not subscription:
            return None

        return subscription.status

    def get_plan_name(
        self,
        obj
    ):

        subscription = self.get_subscription(obj)

        if not subscription:
            return None

        return subscription.plan.name

    def get_days_remaining(
        self,
        obj
    ):

        subscription = self.get_subscription(obj)

        if not subscription:
            return 0

        return subscription.days_remaining


# ============================================================
# BULK / STATUS ACTION SERIALIZERS
# ============================================================

class VendorStatusSerializer(
    serializers.Serializer
):

    status = serializers.ChoiceField(
        choices=Vendor.STATUS_CHOICES
    )

    reason = serializers.CharField(
        required=False,
        allow_blank=True,
    )


class VendorSubscriptionActionSerializer(
    serializers.Serializer
):

    action = serializers.ChoiceField(
        choices=[
            "activate",
            "suspend",
            "cancel",
            "renew",
            "expire",
        ]
    )

    reason = serializers.CharField(
        required=False,
        allow_blank=True,
    )


class VendorLicenseActionSerializer(
    serializers.Serializer
):

    action = serializers.ChoiceField(
        choices=[
            "activate",
            "suspend",
            "revoke",
            "renew",
        ]
    )

    reason = serializers.CharField(
        required=False,
        allow_blank=True,
    )


# ============================================================
# PAYMENT REFUND
# ============================================================

class PaymentRefundSerializer(
    serializers.Serializer
):

    amount = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        min_value=Decimal("0.01"),
    )

    reason = serializers.CharField(
        required=True,
        allow_blank=False,
        max_length=1000,
    )


# ============================================================
# TICKET STATUS UPDATE
# ============================================================

class SupportTicketStatusSerializer(
    serializers.Serializer
):

    status = serializers.ChoiceField(
        choices=SupportTicket.STATUS_CHOICES
    )

    assigned_to = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(
            is_active=True
        ),
        required=False,
        allow_null=True,
    )

    note = serializers.CharField(
        required=False,
        allow_blank=True,
    )


# ============================================================
# MARK NOTIFICATION READ
# ============================================================

class NotificationReadSerializer(
    serializers.Serializer
):

    is_read = serializers.BooleanField(
        default=True
    )


# ============================================================
# CREATE API KEY
# ============================================================

class VendorAPIKeyCreateSerializer(
    serializers.Serializer
):

    name = serializers.CharField(
        max_length=150
    )

    expires_at = serializers.DateTimeField(
        required=False,
        allow_null=True,
    )

    def validate_expires_at(self, value):

        if (
            value
            and value <= timezone.now()
        ):
            raise serializers.ValidationError(
                "Expiration date must be in the future."
            )

        return value


# ============================================================
# CREATE LICENSE
# ============================================================

class VendorLicenseCreateSerializer(
    serializers.Serializer
):

    vendor = serializers.PrimaryKeyRelatedField(
        queryset=Vendor.objects.all()
    )

    subscription = serializers.PrimaryKeyRelatedField(
        queryset=VendorSubscription.objects.all(),
        required=False,
        allow_null=True,
    )

    name = serializers.CharField(
        max_length=150,
        default="Primary License",
    )

    starts_at = serializers.DateTimeField(
        required=False
    )

    expires_at = serializers.DateTimeField()

    def validate(self, attrs):

        starts = attrs.get(
            "starts_at"
        )

        expires = attrs.get(
            "expires_at"
        )

        if starts and expires:

            if expires <= starts:
                raise serializers.ValidationError({
                    "expires_at":
                        "Expiration must be after start."
                })

        return attrs


# ============================================================
# CREATE SUBSCRIPTION
# ============================================================

class VendorSubscriptionCreateSerializer(
    serializers.ModelSerializer
):

    class Meta:
        model = VendorSubscription

        fields = [
            "vendor",
            "plan",

            "status",

            "started_at",
            "current_period_start",
            "current_period_end",

            "auto_renew",

            "amount",
            "currency",

            "custom_max_users",
            "custom_max_patients",

            "notes",
        ]

    def validate(self, attrs):

        start = attrs.get(
            "current_period_start"
        )

        end = attrs.get(
            "current_period_end"
        )

        if (
            start
            and end
            and end <= start
        ):
            raise serializers.ValidationError({
                "current_period_end":
                    "End must be after start."
            })

        return attrs


# ============================================================
# PASSWORD CHANGE
# ============================================================

class PasswordChangeSerializer(
    serializers.Serializer
):

    old_password = serializers.CharField(
        write_only=True
    )

    new_password = serializers.CharField(
        write_only=True,
        min_length=8
    )

    confirm_password = serializers.CharField(
        write_only=True,
        min_length=8
    )

    def validate(self, attrs):

        if (
            attrs["new_password"]
            != attrs["confirm_password"]
        ):
            raise serializers.ValidationError({
                "confirm_password":
                    "Passwords do not match."
            })

        return attrs


# ============================================================
# LOGIN SERIALIZER
# ============================================================

class AdminLoginSerializer(
    serializers.Serializer
):

    username = serializers.CharField()

    password = serializers.CharField(
        write_only=True
    )

    def validate(self, attrs):

        from django.contrib.auth import authenticate

        username = attrs.get(
            "username"
        )

        password = attrs.get(
            "password"
        )

        user = authenticate(
            username=username,
            password=password,
        )

        if not user:
            raise serializers.ValidationError(
                "Invalid username or password."
            )

        if not user.is_active:
            raise serializers.ValidationError(
                "User account is inactive."
            )

        attrs["user"] = user

        return attrs


# ============================================================
# PAGINATION RESPONSE HELPERS
# ============================================================

class IDSerializer(
    serializers.Serializer
):

    id = serializers.UUIDField()


# ============================================================
# END OF SERIALIZERS
# ============================================================
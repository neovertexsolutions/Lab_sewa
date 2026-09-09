# ============================================================
# SITA PATH LAB
# SUPER ADMIN - PRODUCTION DJANGO ADMIN
# ============================================================

from django.contrib import admin
from django.apps import apps
from django.db import models
from django.utils import timezone

from .models import (
    SubscriptionPlan,
    Vendor,
    VendorUser,
    VendorSubscription,
    VendorPayment,
    VendorFeature,
    VendorLimit,
    VendorAPIKey,
    SuperAdminActivityLog,
    SupportTicket,
    SuperAdminSystemSettings,
    PlatformAnnouncement,
    VendorLoginSession,
    VendorDomain,
    AdminImpersonationSession,
)


# ============================================================
# ADMIN SITE
# ============================================================

admin.site.site_header = "Sita Path Lab — Super Admin"
admin.site.site_title = "Sita Path Lab Super Admin"
admin.site.index_title = "Super Administration Panel"


# ============================================================
# COMMON BASE ADMIN
# ============================================================

class ProductionAdmin(admin.ModelAdmin):

    list_per_page = 25
    save_on_top = True
    save_as = False

    actions_on_top = True
    actions_on_bottom = True

    empty_value_display = "—"

    def get_search_fields(self, request):
        fields = []

        for field in self.model._meta.fields:

            if isinstance(
                field,
                (
                    models.CharField,
                    models.TextField,
                    models.EmailField,
                    models.SlugField,
                ),
            ):
                fields.append(field.name)

        return tuple(fields[:15])

    def get_list_filter(self, request):

        filters = []

        for field in self.model._meta.fields:

            if isinstance(
                field,
                (
                    models.BooleanField,
                    models.DateField,
                    models.DateTimeField,
                ),
            ):
                filters.append(field.name)

            elif getattr(field, "choices", None):
                filters.append(field.name)

        return tuple(filters[:10])

    def get_date_hierarchy(self, request):

        field_names = {
            field.name
            for field in self.model._meta.fields
        }

        if "created_at" in field_names:
            return "created_at"

        if "updated_at" in field_names:
            return "updated_at"

        return None

    def get_readonly_fields(self, request, obj=None):

        readonly = []

        for field in self.model._meta.fields:

            if field.name == "id":
                readonly.append(field.name)

            if getattr(field, "auto_now_add", False):
                readonly.append(field.name)

            if getattr(field, "auto_now", False):
                readonly.append(field.name)

        return tuple(readonly)

    def get_ordering(self, request):

        field_names = {
            field.name
            for field in self.model._meta.fields
        }

        if "created_at" in field_names:
            return ("-created_at",)

        if "updated_at" in field_names:
            return ("-updated_at",)

        return ("-id",)

    def get_list_select_related(self, request):

        related_fields = []

        for field in self.model._meta.fields:

            if isinstance(
                field,
                (
                    models.ForeignKey,
                    models.OneToOneField,
                ),
            ):
                related_fields.append(field.name)

        return tuple(related_fields) if related_fields else False


# ============================================================
# 1. SUBSCRIPTION PLAN
# ============================================================

@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(ProductionAdmin):

    list_display = (
        "name",
        "price",
        "billing_cycle",
        "max_users",
        "max_patients",
        "is_active",
        "is_public",
        "is_featured",
        "created_at",
    )

    list_filter = (
        "billing_cycle",
        "is_active",
        "is_public",
        "is_featured",
    )

    search_fields = (
        "name",
        "slug",
        "description",
    )

    readonly_fields = (
        "id",
        "slug",
        "created_at",
        "updated_at",
    )

    fieldsets = (

        (
            "Plan Information",
            {
                "fields": (
                    "name",
                    "slug",
                    "description",
                )
            },
        ),

        (
            "Pricing",
            {
                "fields": (
                    "price",
                    "billing_cycle",
                )
            },
        ),

        (
            "Resource Limits",
            {
                "fields": (
                    "max_users",
                    "max_patients",
                    "max_doctors",
                    "max_storage_mb",
                    "max_monthly_reports",
                )
            },
        ),

        (
            "Feature Access",
            {
                "fields": (
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
                )
            },
        ),

        (
            "Visibility & Status",
            {
                "fields": (
                    "is_active",
                    "is_public",
                    "is_featured",
                    "sort_order",
                )
            },
        ),

        (
            "System Information",
            {
                "fields": (
                    "id",
                    "created_at",
                    "updated_at",
                ),
                "classes": ("collapse",),
            },
        ),
    )


# ============================================================
# 2. VENDOR INLINE - USERS
# ============================================================

class VendorUserInline(admin.TabularInline):

    model = VendorUser

    extra = 0

    fields = (
        "user",
        "role",
        "is_active",
        "is_primary",
        "last_login_at",
    )

    readonly_fields = (
        "last_login_at",
    )


# ============================================================
# VENDOR INLINE - SUBSCRIPTIONS
# ============================================================

class VendorSubscriptionInline(admin.TabularInline):

    model = VendorSubscription

    extra = 0

    fields = (
        "plan",
        "status",
        "started_at",
        "current_period_start",
        "current_period_end",
        "amount",
        "auto_renew",
    )

    readonly_fields = (
        "started_at",
        "current_period_start",
        "current_period_end",
    )


# ============================================================
# VENDOR INLINE - DOMAINS
# ============================================================

class VendorDomainInline(admin.TabularInline):

    model = VendorDomain

    extra = 0

    fields = (
        "domain",
        "domain_type",
        "is_primary",
        "is_verified",
        "ssl_enabled",
        "is_active",
    )


# ============================================================
# 3. VENDOR
# ============================================================

@admin.register(Vendor)
class VendorAdmin(ProductionAdmin):

    list_display = (
        "business_name",
        "email",
        "phone",
        "status",
        "is_active",
        "is_verified",
        "login_enabled",
        "subscription_status",
        "subscription_expiry",
        "created_at",
    )

    list_filter = (
        "status",
        "is_active",
        "is_verified",
        "login_enabled",
        "force_password_change",
        "allow_multiple_sessions",
    )

    search_fields = (
        "business_name",
        "legal_name",
        "email",
        "phone",
        "registration_number",
        "license_number",
        "tax_number",
        "slug",
    )

    readonly_fields = (
        "id",
        "slug",
        "last_login_at",
        "suspended_at",
        "created_at",
        "updated_at",
    )

    inlines = (
        VendorUserInline,
        VendorSubscriptionInline,
        VendorDomainInline,
    )

    fieldsets = (

        (
            "Vendor Information",
            {
                "fields": (
                    "business_name",
                    "legal_name",
                    "slug",
                    "registration_number",
                    "license_number",
                    "tax_number",
                )
            },
        ),

        (
            "Owner",
            {
                "fields": (
                    "owner",
                )
            },
        ),

        (
            "Contact Information",
            {
                "fields": (
                    "email",
                    "phone",
                    "alternate_phone",
                    "website",
                )
            },
        ),

        (
            "Address",
            {
                "fields": (
                    "address",
                    "city",
                    "state",
                    "country",
                    "postal_code",
                )
            },
        ),

        (
            "Branding",
            {
                "fields": (
                    "logo",
                    "primary_color",
                    "secondary_color",
                )
            },
        ),

        (
            "Access Control",
            {
                "fields": (
                    "status",
                    "is_active",
                    "is_verified",
                    "login_enabled",
                    "force_password_change",
                    "allow_multiple_sessions",
                )
            },
        ),

        (
            "Trial & Access",
            {
                "fields": (
                    "trial_started_at",
                    "trial_ends_at",
                    "last_login_at",
                    "suspended_at",
                    "suspended_reason",
                )
            },
        ),

        (
            "Regional Settings",
            {
                "fields": (
                    "timezone",
                    "currency",
                )
            },
        ),

        (
            "Internal Notes",
            {
                "fields": (
                    "admin_notes",
                )
            },
        ),

        (
            "System Information",
            {
                "fields": (
                    "id",
                    "created_at",
                    "updated_at",
                ),
                "classes": ("collapse",),
            },
        ),
    )

    @admin.display(
        description="Subscription",
        ordering="subscriptions__status",
    )
    def subscription_status(self, obj):

        subscription = (
            obj.subscriptions
            .filter(
                status__in=[
                    VendorSubscription.STATUS_ACTIVE,
                    VendorSubscription.STATUS_TRIAL,
                ]
            )
            .order_by("-current_period_end")
            .first()
        )

        if not subscription:
            return "No Active Plan"

        return subscription.status.title()

    @admin.display(description="Expiry")
    def subscription_expiry(self, obj):

        subscription = (
            obj.subscriptions
            .filter(
                status__in=[
                    VendorSubscription.STATUS_ACTIVE,
                    VendorSubscription.STATUS_TRIAL,
                ]
            )
            .order_by("-current_period_end")
            .first()
        )

        if not subscription:
            return "—"

        if not subscription.current_period_end:
            return "No Expiry"

        return subscription.current_period_end


# ============================================================
# 4. VENDOR USER
# ============================================================

@admin.register(VendorUser)
class VendorUserAdmin(ProductionAdmin):

    list_display = (
        "user",
        "vendor",
        "role",
        "is_active",
        "is_primary",
        "last_login_at",
        "created_at",
    )

    list_filter = (
        "role",
        "is_active",
        "is_primary",
    )

    search_fields = (
        "user__username",
        "user__email",
        "vendor__business_name",
    )

    autocomplete_fields = (
        "vendor",
        "user",
    )

    readonly_fields = (
        "id",
        "last_login_at",
        "created_at",
        "updated_at",
    )


# ============================================================
# 5. VENDOR SUBSCRIPTION
# ============================================================

@admin.register(VendorSubscription)
class VendorSubscriptionAdmin(ProductionAdmin):

    list_display = (
        "vendor",
        "plan",
        "status",
        "amount",
        "currency",
        "current_period_start",
        "current_period_end",
        "auto_renew",
        "is_current_status",
    )

    list_filter = (
        "status",
        "auto_renew",
        "currency",
        "plan",
    )

    search_fields = (
        "vendor__business_name",
        "vendor__email",
        "plan__name",
    )

    autocomplete_fields = (
        "vendor",
        "plan",
    )

    readonly_fields = (
        "id",
        "created_at",
        "updated_at",
    )

    @admin.display(description="Current")
    def is_current_status(self, obj):

        if obj.is_current:
            return "ACTIVE"

        return "EXPIRED / INACTIVE"


# ============================================================
# 6. PAYMENT
# ============================================================

@admin.register(VendorPayment)
class VendorPaymentAdmin(ProductionAdmin):

    list_display = (
        "transaction_id",
        "vendor",
        "amount",
        "currency",
        "payment_method",
        "status",
        "payment_date",
        "invoice_number",
    )

    list_filter = (
        "status",
        "payment_method",
        "currency",
        "payment_date",
    )

    search_fields = (
        "transaction_id",
        "vendor__business_name",
        "vendor__email",
        "gateway_payment_id",
        "invoice_number",
    )

    autocomplete_fields = (
        "vendor",
        "subscription",
    )

    readonly_fields = (
        "id",
        "transaction_id",
        "created_at",
        "updated_at",
    )


# ============================================================
# 7. VENDOR FEATURE
# ============================================================

@admin.register(VendorFeature)
class VendorFeatureAdmin(ProductionAdmin):

    list_display = (
        "vendor",
        "dashboard_enabled",
        "patients_enabled",
        "billing_enabled",
        "analytics_enabled",
        "whatsapp_enabled",
        "api_enabled",
        "custom_branding_enabled",
    )

    list_filter = (
        "dashboard_enabled",
        "patients_enabled",
        "billing_enabled",
        "analytics_enabled",
        "whatsapp_enabled",
        "sms_enabled",
        "api_enabled",
        "custom_branding_enabled",
    )

    search_fields = (
        "vendor__business_name",
        "vendor__email",
    )

    autocomplete_fields = (
        "vendor",
    )


# ============================================================
# 8. VENDOR LIMIT
# ============================================================

@admin.register(VendorLimit)
class VendorLimitAdmin(ProductionAdmin):

    list_display = (
        "vendor",
        "max_users",
        "max_patients",
        "max_doctors",
        "max_storage_mb",
        "max_monthly_reports",
    )

    search_fields = (
        "vendor__business_name",
        "vendor__email",
    )

    autocomplete_fields = (
        "vendor",
    )


# ============================================================
# 9. API KEY
# ============================================================

@admin.register(VendorAPIKey)
class VendorAPIKeyAdmin(ProductionAdmin):

    list_display = (
        "name",
        "vendor",
        "key_prefix",
        "is_active",
        "last_used_at",
        "expires_at",
        "created_at",
    )

    list_filter = (
        "is_active",
        "expires_at",
    )

    search_fields = (
        "name",
        "key_prefix",
        "vendor__business_name",
        "vendor__email",
    )

    autocomplete_fields = (
        "vendor",
        "created_by",
    )

    readonly_fields = (
        "id",
        "key_prefix",
        "secret_hash",
        "last_used_at",
        "created_at",
        "updated_at",
    )


# ============================================================
# 10. ACTIVITY / AUDIT LOG
# ============================================================

@admin.register(SuperAdminActivityLog)
class SuperAdminActivityLogAdmin(ProductionAdmin):

    list_display = (
        "created_at",
        "action",
        "module",
        "title",
        "actor",
        "vendor",
        "ip_address",
    )

    list_filter = (
        "action",
        "module",
        "created_at",
    )

    search_fields = (
        "title",
        "description",
        "module",
        "actor__username",
        "vendor__business_name",
        "ip_address",
    )

    autocomplete_fields = (
        "actor",
        "vendor",
    )

    readonly_fields = (
        "id",
        "actor",
        "vendor",
        "action",
        "module",
        "title",
        "description",
        "old_values",
        "new_values",
        "ip_address",
        "user_agent",
        "created_at",
        "updated_at",
    )

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser


# ============================================================
# 11. SUPPORT TICKET
# ============================================================

@admin.register(SupportTicket)
class SupportTicketAdmin(ProductionAdmin):

    list_display = (
        "ticket_number",
        "vendor",
        "subject",
        "status",
        "priority",
        "assigned_to",
        "created_at",
        "resolved_at",
    )

    list_filter = (
        "status",
        "priority",
        "created_at",
    )

    search_fields = (
        "ticket_number",
        "subject",
        "description",
        "vendor__business_name",
        "vendor__email",
    )

    autocomplete_fields = (
        "vendor",
        "assigned_to",
    )

    readonly_fields = (
        "id",
        "ticket_number",
        "created_at",
        "updated_at",
    )


# ============================================================
# 12. SYSTEM SETTINGS
# ============================================================

@admin.register(SuperAdminSystemSettings)
class SuperAdminSystemSettingsAdmin(ProductionAdmin):

    list_display = (
        "platform_name",
        "maintenance_mode",
        "allow_new_vendors",
        "default_trial_days",
        "require_strong_password",
        "require_2fa",
        "updated_at",
    )

    list_filter = (
        "maintenance_mode",
        "allow_new_vendors",
        "allow_vendor_registration",
        "require_strong_password",
        "require_2fa",
        "enable_audit_logs",
    )

    readonly_fields = (
        "id",
        "created_at",
        "updated_at",
    )

    fieldsets = (

        (
            "Platform",
            {
                "fields": (
                    "platform_name",
                    "support_email",
                    "support_phone",
                )
            },
        ),

        (
            "Vendor Registration",
            {
                "fields": (
                    "allow_new_vendors",
                    "allow_vendor_registration",
                    "default_trial_days",
                )
            },
        ),

        (
            "Security",
            {
                "fields": (
                    "session_timeout_minutes",
                    "max_login_attempts",
                    "lockout_minutes",
                    "require_strong_password",
                    "require_2fa",
                )
            },
        ),

        (
            "Notifications",
            {
                "fields": (
                    "enable_email_notifications",
                    "enable_sms_notifications",
                    "enable_whatsapp_notifications",
                )
            },
        ),

        (
            "System",
            {
                "fields": (
                    "maintenance_mode",
                    "enable_audit_logs",
                )
            },
        ),

        (
            "System Information",
            {
                "fields": (
                    "id",
                    "created_at",
                    "updated_at",
                ),
                "classes": ("collapse",),
            },
        ),
    )


# ============================================================
# 13. ANNOUNCEMENTS
# ============================================================

@admin.register(PlatformAnnouncement)
class PlatformAnnouncementAdmin(ProductionAdmin):

    list_display = (
        "title",
        "announcement_type",
        "is_active",
        "show_to_all_vendors",
        "start_at",
        "end_at",
        "created_by",
    )

    list_filter = (
        "announcement_type",
        "is_active",
        "show_to_all_vendors",
        "start_at",
        "end_at",
    )

    search_fields = (
        "title",
        "message",
    )

    autocomplete_fields = (
        "created_by",
    )

    readonly_fields = (
        "id",
        "created_at",
        "updated_at",
    )


# ============================================================
# 14. VENDOR LOGIN SESSION
# ============================================================

@admin.register(VendorLoginSession)
class VendorLoginSessionAdmin(ProductionAdmin):

    list_display = (
        "user",
        "vendor",
        "device_name",
        "ip_address",
        "last_activity_at",
        "expires_at",
        "is_active",
    )

    list_filter = (
        "is_active",
        "last_activity_at",
        "expires_at",
    )

    search_fields = (
        "user__username",
        "user__email",
        "vendor__business_name",
        "ip_address",
        "device_name",
    )

    autocomplete_fields = (
        "vendor",
        "user",
    )

    readonly_fields = (
        "id",
        "session_key",
        "ip_address",
        "user_agent",
        "last_activity_at",
        "expires_at",
        "created_at",
        "updated_at",
    )


# ============================================================
# 15. VENDOR DOMAIN
# ============================================================

@admin.register(VendorDomain)
class VendorDomainAdmin(ProductionAdmin):

    list_display = (
        "domain",
        "vendor",
        "domain_type",
        "is_primary",
        "is_verified",
        "ssl_enabled",
        "is_active",
        "created_at",
    )

    list_filter = (
        "domain_type",
        "is_primary",
        "is_verified",
        "ssl_enabled",
        "is_active",
    )

    search_fields = (
        "domain",
        "vendor__business_name",
        "vendor__email",
    )

    autocomplete_fields = (
        "vendor",
    )

    readonly_fields = (
        "id",
      
        "created_at",
        "updated_at",
    )


# ============================================================
# 16. ADMIN IMPERSONATION
# ============================================================

@admin.register(AdminImpersonationSession)
class AdminImpersonationSessionAdmin(ProductionAdmin):

    list_display = (
        "admin_user",
        "vendor",
        "target_user",
        "started_at",
        "ended_at",
        "is_active",
        "reason",
    )

    list_filter = (
        "is_active",
        "started_at",
        "ended_at",
    )

    search_fields = (
        "admin_user__username",
        "vendor__business_name",
        "target_user__username",
        "reason",
        "ip_address",
    )

    autocomplete_fields = (
        "admin_user",
        "vendor",
        "target_user",
    )

    readonly_fields = (
        "id",
        "admin_user",
        "vendor",
        "target_user",
        "started_at",
        "ended_at",
        "reason",
        "ip_address",
        "created_at",
        "updated_at",
    )

    def has_add_permission(self, request):
        return False


# ============================================================
# ADMIN ACTIONS
# ============================================================

@admin.action(description="Activate selected vendors")
def activate_vendors(modeladmin, request, queryset):

    updated = queryset.update(
        is_active=True,
        status=Vendor.STATUS_ACTIVE,
    )

    modeladmin.message_user(
        request,
        f"{updated} vendor(s) activated successfully.",
    )


@admin.action(description="Suspend selected vendors")
def suspend_vendors(modeladmin, request, queryset):

    updated = queryset.update(
        is_active=False,
        status=Vendor.STATUS_SUSPENDED,
        suspended_at=timezone.now(),
    )

    modeladmin.message_user(
        request,
        f"{updated} vendor(s) suspended successfully.",
    )


VendorAdmin.actions = [
    activate_vendors,
    suspend_vendors,
]


# ============================================================
# OPTIONAL SAFETY CHECK
# ============================================================

# This makes sure that if a future model is added to the
# superadmin app and is not explicitly registered above,
# Django admin will still expose it using ProductionAdmin.
#
# Existing explicitly registered models are skipped.

def register_remaining_superadmin_models():

    try:
        app_config = apps.get_app_config("superadmin")
    except LookupError:
        return

    for model in app_config.get_models():

        if model._meta.abstract:
            continue

        if model._meta.proxy:
            continue

        if model in admin.site._registry:
            continue

        admin.site.register(
            model,
            ProductionAdmin,
        )


register_remaining_superadmin_models()


# ============================================================
# END OF ADMIN CONFIGURATION
# ============================================================
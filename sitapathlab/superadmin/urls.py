# ============================================================
# SITA PATH LAB
# SUPER ADMIN PORTAL
# URL CONFIGURATION
# ============================================================

from django.urls import path

from . import views


app_name = "superadmin"


urlpatterns = [

    # ========================================================
    # AUTHENTICATION
    # ========================================================

    path(
        "login/",
        views.login_view,
        name="login",
    ),

    path(
        "logout/",
        views.logout_view,
        name="logout",
    ),

    path(
        "password-reset/",
        views.password_reset,
        name="password_reset",
    ),


    # ========================================================
    # DASHBOARD
    # ========================================================

    path(
        "",
        views.dashboard,
        name="dashboard",
    ),

    path(
        "dashboard/",
        views.dashboard,
        name="dashboard_home",
    ),

    path(
        "api/dashboard/",
        views.dashboard_api,
        name="dashboard_api",
    ),


    # ========================================================
    # PROFILE
    # ========================================================

    path(
        "profile/",
        views.profile,
        name="profile",
    ),

    path(
        "profile/update/",
        views.profile_update,
        name="profile_update",
    ),

    path(
        "profile/change-password/",
        views.change_password,
        name="change_password",
    ),


    # ========================================================
    # VENDORS
    # ========================================================

    path(
        "vendors/",
        views.vendor_list,
        name="vendors",
    ),

    path(
        "vendors/create/",
        views.vendor_create,
        name="vendor_create",
    ),

    path(
        "vendors/<uuid:vendor_id>/",
        views.vendor_detail,
        name="vendor_detail",
    ),

    path(
        "vendors/<uuid:vendor_id>/edit/",
        views.vendor_update,
        name="vendor_update",
    ),

    path(
        "vendors/<uuid:vendor_id>/delete/",
        views.vendor_delete,
        name="vendor_delete",
    ),

    path(
        "vendors/<uuid:vendor_id>/activate/",
        views.vendor_activate,
        name="vendor_activate",
    ),

    path(
        "vendors/<uuid:vendor_id>/suspend/",
        views.vendor_suspend,
        name="vendor_suspend",
    ),

    path(
        "vendors/<uuid:vendor_id>/block/",
        views.vendor_block,
        name="vendor_block",
    ),

    path(
        "vendors/<uuid:vendor_id>/dashboard/",
        views.vendor_dashboard,
        name="vendor_dashboard",
    ),

    path(
        "vendors/<uuid:vendor_id>/features/",
        views.vendor_features,
        name="vendor_features",
    ),

    path(
        "vendors/<uuid:vendor_id>/features/update/",
        views.update_vendor_features,
        name="update_vendor_features",
    ),

    path(
        "vendors/<uuid:vendor_id>/impersonate/",
        views.impersonate_vendor,
        name="impersonate_vendor",
    ),

    path(
        "vendors/stop-impersonation/",
        views.stop_impersonation,
        name="stop_impersonation",
    ),
path(
    "vendors/<uuid:vendor_id>/edit/",
    views.vendor_edit,
    name="vendor_edit",
),

    # ========================================================
    # VENDOR APIs
    # ========================================================

    path(
        "api/vendors/",
        views.vendors_api,
        name="vendors_api",
    ),

    path(
        "api/vendors/<uuid:vendor_id>/",
        views.vendor_api,
        name="vendor_api",
    ),

    # Vendor detail actions / AJAX APIs
    path(
        "api/vendors/<uuid:vendor_id>/status/",
        views.vendor_status_api,
        name="vendor_status_api",
    ),

    path(
        "api/vendors/<uuid:vendor_id>/reset-password/",
        views.vendor_reset_password_api,
        name="vendor_reset_password_api",
    ),

    path(
        "api/vendors/<uuid:vendor_id>/subscription/extend/",
        views.vendor_subscription_extend_api,
        name="vendor_subscription_extend_api",
    ),

    path(
        "api/vendors/<uuid:vendor_id>/subscription/plan/",
        views.vendor_subscription_plan_api,
        name="vendor_subscription_plan_api",
    ),

    path(
        "api/vendors/<uuid:vendor_id>/usage/",
        views.vendor_usage_api,
        name="vendor_usage_api",
    ),

    path(
        "api/vendors/<uuid:vendor_id>/activity/",
        views.vendor_activity_api,
        name="vendor_activity_api",
    ),

    path(
        "api/vendors/<uuid:vendor_id>/license/regenerate/",
        views.vendor_license_regenerate_api,
        name="vendor_license_regenerate_api",
    ),

    path(
        "api/vendors/<uuid:vendor_id>/license/revoke/",
        views.vendor_license_revoke_api,
        name="vendor_license_revoke_api",
    ),


    # ============================================================
# USERS
# ============================================================

path(
    "users/",
    views.user_list,
    name="users",
),

# ------------------------------------------------------------
# USERS API
# ------------------------------------------------------------

path(
    "users/api/",
    views.users_api,
    name="users_api",
),

# ------------------------------------------------------------
# USER DETAIL PAGE
# ------------------------------------------------------------

path(
    "users/<int:user_id>/",
    views.user_detail,
    name="user_detail",
),

# ------------------------------------------------------------
# ACTIVATE USER
# ------------------------------------------------------------

path(
    "users/<int:user_id>/activate/",
    views.user_activate,
    name="user_activate",
),

# ------------------------------------------------------------
# DEACTIVATE / SUSPEND USER
# ------------------------------------------------------------

path(
    "users/<int:user_id>/deactivate/",
    views.user_deactivate,
    name="user_deactivate",
),


# ========================================================
    # ROLES & PERMISSIONS
    # ========================================================

    path(
        "roles/",
        views.role_list,
        name="roles",
    ),

    path(
        "roles/create/",
        views.role_create,
        name="role_create",
    ),

    path(
        "roles/<int:role_id>/edit/",
        views.role_update,
        name="role_update",
    ),

    path(
        "roles/<int:role_id>/delete/",
        views.role_delete,
        name="role_delete",
    ),

    path(
        "roles/permissions/",
        views.user_permissions,
        name="user_permissions",
    ),

    path(
        "roles-permissions/",
        views.user_permissions,
        name="roles_permissions",
    ),
    path(
        "roles/permissions/update/<int:user_id>/",
        views.update_user_permissions,
        name="update_user_permissions",
    ),
    # ========================================================
    # PLANS
    # ========================================================

    path(
        "plans/",
        views.plan_list,
        name="plans",
    ),

    path(
        "plans/create/",
        views.plan_create,
        name="plan_create",
    ),

    path(
        "plans/<uuid:plan_id>/",
        views.plan_detail,
        name="plan_detail",
    ),

    path(
        "plans/<uuid:plan_id>/edit/",
        views.plan_update,
        name="plan_update",
    ),

    path(
        "plans/<uuid:plan_id>/delete/",
        views.plan_delete,
        name="plan_delete",
    ),

    path(
        "plans/<uuid:plan_id>/activate/",
        views.plan_activate,
        name="plan_activate",
    ),

    path(
        "plans/<uuid:plan_id>/suspend/",
        views.plan_suspend,
        name="plan_suspend",
    ),

    path(
        "plans/<uuid:plan_id>/deactivate/",
        views.plan_deactivate,
        name="plan_deactivate",
    ),


    # ========================================================
    # SUBSCRIPTIONS
    # ========================================================

    path(
        "subscriptions/",
        views.subscription_list,
        name="subscriptions",
    ),

    path(
        "subscriptions/<uuid:subscription_id>/",
        views.subscription_detail,
        name="subscription_detail",
    ),

    path(
        "subscriptions/<uuid:subscription_id>/activate/",
        views.subscription_activate,
        name="subscription_activate",
    ),

    path(
        "subscriptions/<uuid:subscription_id>/suspend/",
        views.subscription_suspend,
        name="subscription_suspend",
    ),

    path(
        "subscriptions/<uuid:subscription_id>/cancel/",
        views.subscription_cancel,
        name="subscription_cancel",
    ),


    # ========================================================
    # LICENSES
    # ========================================================

    path(
        "licenses/",
        views.license_list,
        name="licenses",
    ),

    path(
        "licenses/create/",
        views.license_create,
        name="license_create",
    ),

    path(
        "licenses/<uuid:license_id>/",
        views.license_detail,
        name="license_detail",
    ),

    path(
        "licenses/<uuid:license_id>/activate/",
        views.license_activate,
        name="license_activate",
    ),

    path(
        "licenses/<uuid:license_id>/suspend/",
        views.license_suspend,
        name="license_suspend",
    ),

    path(
        "licenses/<uuid:license_id>/revoke/",
        views.license_revoke,
        name="license_revoke",
    ),


    # ========================================================
    # PAYMENTS
    # ========================================================

    path(
        "payments/",
        views.payment_list,
        name="payments",
    ),

    path(
        "payments/<int:payment_id>/",
        views.payment_detail,
        name="payment_detail",
    ),

    path(
        "payments/<int:payment_id>/refund/",
        views.payments_refund_api,
        name="payment_refund",
    ),


    # ========================================================
    # PAYMENT APIs
    # ========================================================

    path(
        "api/payments/",
        views.payments_api,
        name="payments_api",
    ),

    path(
        "api/payments/create/",
        views.payments_create_api,
        name="payments_create_api",
    ),

    path(
        "api/payments/<int:payment_id>/update/",
        views.payments_update_api,
        name="payments_update_api",
    ),

    path(
        "api/payments/<int:payment_id>/delete/",
        views.payments_delete_api,
        name="payments_delete_api",
    ),

    path(
        "api/payments/<int:payment_id>/refund/",
        views.payments_refund_api,
        name="payments_refund_api",
    ),


    # ========================================================
    # INVOICES
    # ========================================================

    path(
        "invoices/",
        views.invoice_list,
        name="invoices",
    ),

    path(
        "invoices/<uuid:invoice_id>/",
        views.invoice_detail,
        name="invoice_detail",
    ),

    path(
        "invoices/<uuid:invoice_id>/download/",
        views.invoice_download,
        name="invoice_download",
    ),


    # ========================================================
    # TRANSACTIONS
    # ========================================================

    path(
        "transactions/",
        views.transaction_list,
        name="transactions",
    ),

    path(
        "transactions/<uuid:transaction_id>/",
        views.transaction_detail,
        name="transaction_detail",
    ),


    # ========================================================
    # ANALYTICS
    # ========================================================

    path(
        "analytics/",
        views.analytics,
        name="analytics",
    ),

    path(
        "analytics/data/",
        views.analytics_api,
        name="analytics_data",
    ),


    # ========================================================
    # ACTIVITY LOGS
    # ========================================================

    path(
        "activity-logs/",
        views.activity_logs,
        name="activity_logs",
    ),

    path(
        "activity-logs/<int:log_id>/",
        views.activity_log_detail,
        name="activity_log_detail",
    ),

    path(
        "api/activity/",
        views.activity_api,
        name="activity_api",
    ),


    # ========================================================
    # AUDIT LOGS
    # ========================================================

    path(
        "audit-logs/",
        views.audit_logs,
        name="audit_logs",
    ),

    path(
        "audit-logs/<int:log_id>/",
        views.audit_log_detail,
        name="audit_log_detail",
    ),


    # ========================================================
    # NOTIFICATIONS
    # ========================================================

    path(
        "notifications/",
        views.notifications,
        name="notifications",
    ),

    path(
        "notifications/<uuid:notification_id>/",
        views.notification_detail,
        name="notification_detail",
    ),

    path(
        "notifications/<uuid:notification_id>/read/",
        views.notification_mark_read,
        name="notification_mark_read",
    ),

    path(
        "notifications/mark-all-read/",
        views.notifications_mark_all_read,
        name="notifications_mark_all_read",
    ),

    path(
        "api/notifications/",
        views.notifications_api,
        name="notifications_api",
    ),


    # ========================================================
    # SECURITY
    # ========================================================

    path(
        "security/",
        views.security,
        name="security",
    ),

    path(
        "security/sessions/",
        views.security_sessions,
        name="security_sessions",
    ),

    path(
        "security/sessions/<str:session_key>/revoke/",
        views.revoke_session,
        name="revoke_session",
    ),

    path(
        "security/2fa/",
        views.security_2fa,
        name="security_2fa",
    ),


    # ========================================================
    # SYSTEM SETTINGS
    # ========================================================

    path(
        "system-settings/",
        views.system_settings,
        name="system_settings",
    ),

    path(
        "system-settings/update/",
        views.update_system_settings,
        name="update_system_settings",
    ),


    # ========================================================
    # PAYMENT SETTINGS
    # ========================================================

    path(
        "payment-settings/",
        views.payment_settings,
        name="payment_settings",
    ),

    path(
        "payment-settings/update/",
        views.update_payment_settings,
        name="update_payment_settings",
    ),


    # ========================================================
    # SYSTEM
    # ========================================================

    path(
        "system/health/",
        views.system_health,
        name="system_health",
    ),

    path(
        "system/activity/",
        views.system_activity,
        name="system_activity",
    ),

    path(
        "system/errors/",
        views.system_errors,
        name="system_errors",
    ),

    path(
        "api/system-health/",
        views.system_health_api,
        name="system_health_api",
    ),


    # ========================================================
    # BACKUPS
    # ========================================================

    path(
        "backups/",
        views.backup_list,
        name="backups",
    ),

    path(
        "backups/create/",
        views.create_backup,
        name="create_backup",
    ),

    path(
        "backups/<uuid:backup_id>/restore/",
        views.restore_backup,
        name="restore_backup",
    ),


    # ========================================================
    # SUPPORT
    # ========================================================

    path(
        "support/",
        views.support,
        name="support",
    ),


    # ========================================================
    # SETTINGS
    # ========================================================

    path(
        "settings/",
        views.settings_view,
        name="settings",
    ),

]
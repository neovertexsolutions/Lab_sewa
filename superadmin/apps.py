# ============================================================
# SITA PATH LAB
# SUPER ADMIN - APP CONFIGURATION
# ============================================================

from django.apps import AppConfig


class SuperadminConfig(AppConfig):
    """
    Sita Path Lab - Super Admin SaaS Management Application.

    Responsibilities:
        - Super Admin Dashboard
        - Vendor / Tenant Management
        - Vendor Users
        - Subscription Plans
        - Vendor Subscriptions
        - License / API Key Management
        - Payments & Billing
        - Invoices & Transactions
        - Feature & Resource Controls
        - Activity / Audit Logs
        - Support Tickets
        - Notifications / Announcements
        - System Configuration
        - Security Management
        - Vendor Sessions
        - Vendor Domains
        - Admin Impersonation
    """

    # --------------------------------------------------------
    # DJANGO DEFAULT PRIMARY KEY
    # --------------------------------------------------------

    default_auto_field = "django.db.models.BigAutoField"

    # --------------------------------------------------------
    # APPLICATION IDENTITY
    # --------------------------------------------------------

    name = "superadmin"

    label = "superadmin"

    verbose_name = "Sita Path Lab Super Admin"

    # --------------------------------------------------------
    # APPLICATION INITIALIZATION
    # --------------------------------------------------------

    def ready(self):
        """
        Application initialization.

        Keep this method lightweight.

        Signals are imported here so that:
            - audit logging
            - vendor provisioning
            - subscription lifecycle handling
            - license lifecycle handling
            - security events

        can be connected without importing them globally.

        IMPORTANT:
        Avoid database queries inside ready().
        """

        # ----------------------------------------------------
        # LOAD SIGNALS
        # ----------------------------------------------------

        try:
            from . import signals  # noqa: F401
        except ImportError:
            # Signals file may not exist yet.
            # This allows the application to start normally.
            pass
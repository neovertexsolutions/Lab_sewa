# ============================================================
# SITA PATH LAB
# SUPER ADMIN / MULTI-TENANT SAAS
# PRODUCTION LEVEL PERMISSIONS
# ============================================================

from rest_framework.permissions import BasePermission


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def is_authenticated(user):
    """
    Check whether user is authenticated.
    """
    return bool(
        user
        and user.is_authenticated
    )


def is_super_admin(user):
    """
    Check whether user is a Django superuser.
    """

    if not is_authenticated(user):
        return False

    return bool(
        user.is_superuser
        or getattr(user, "is_super_admin", False)
    )


def get_vendor_user(user, vendor=None):
    """
    Return VendorUser mapping for the requested vendor.

    If vendor is provided, ensure that the user belongs
    to that vendor.
    """

    if not is_authenticated(user):
        return None

    vendor_accounts = getattr(
        user,
        "vendor_accounts",
        None,
    )

    if vendor_accounts is None:
        return None

    queryset = vendor_accounts.filter(
        is_active=True,
        can_login=True,
    )

    if vendor is not None:
        queryset = queryset.filter(
            vendor=vendor,
        )

    return queryset.select_related(
        "vendor",
        "user",
    ).first()


def user_belongs_to_vendor(user, vendor):
    """
    Check whether user belongs to vendor.
    """

    if not vendor:
        return False

    return get_vendor_user(
        user,
        vendor,
    ) is not None


def get_vendor_role(user, vendor):
    """
    Get custom VendorRole for the user.

    VendorUser currently contains a built-in role string.
    Custom VendorRole support can be attached later through
    a user-role mapping model.
    """

    vendor_user = get_vendor_user(
        user,
        vendor,
    )

    if not vendor_user:
        return None

    return getattr(
        vendor_user,
        "custom_role",
        None,
    )


def has_vendor_permission(
    user,
    vendor,
    permission_code,
):
    """
    Check a custom permission assigned to a VendorRole.

    This supports permissions such as:

        patients.view
        patients.create
        patients.update
        patients.delete
        reports.export
        billing.approve
    """

    if not is_authenticated(user):
        return False

    # Super Admin bypass
    if is_super_admin(user):
        return True

    vendor_user = get_vendor_user(
        user,
        vendor,
    )

    if not vendor_user:
        return False

    # Owner has full access inside own vendor
    if vendor_user.role == "owner":
        return True

    # Administrator has full vendor-level access
    if vendor_user.role == "admin":
        return True

    role = get_vendor_role(
        user,
        vendor,
    )

    if not role:
        return False

    permissions = role.permissions.filter(
        permission__code=permission_code,
        permission__is_active=True,
    )

    return permissions.exists()


# ============================================================
# BASE AUTHENTICATION PERMISSION
# ============================================================

class IsAuthenticatedUser(BasePermission):
    """
    User must be authenticated.
    """

    message = (
        "Authentication credentials were not provided "
        "or the account is inactive."
    )

    def has_permission(
        self,
        request,
        view,
    ):
        return is_authenticated(
            request.user
        )


# ============================================================
# SUPER ADMIN
# ============================================================

class IsSuperAdmin(BasePermission):
    """
    Only Super Admin can access the endpoint.
    """

    message = (
        "Super Admin privileges are required."
    )

    def has_permission(
        self,
        request,
        view,
    ):
        return is_super_admin(
            request.user
        )


class IsSuperAdminOrReadOnly(BasePermission):
    """
    Super Admin can perform all operations.

    Other authenticated users can only perform
    safe/read operations.
    """

    message = (
        "You do not have permission to perform "
        "this operation."
    )

    def has_permission(
        self,
        request,
        view,
    ):

        if is_super_admin(
            request.user
        ):
            return True

        if not is_authenticated(
            request.user
        ):
            return False

        return request.method in (
            "GET",
            "HEAD",
            "OPTIONS",
        )


# ============================================================
# VENDOR MEMBERSHIP
# ============================================================

class IsVendorMember(BasePermission):
    """
    User must belong to the vendor.
    """

    message = (
        "You do not belong to this vendor."
    )

    def has_permission(
        self,
        request,
        view,
    ):

        if is_super_admin(
            request.user
        ):
            return True

        vendor = getattr(
            view,
            "vendor",
            None,
        )

        if vendor is None:
            vendor = getattr(
                request,
                "vendor",
                None,
            )

        if vendor is None:
            vendor_id = (
                request.data.get("vendor")
                or request.query_params.get(
                    "vendor"
                )
            )

            if vendor_id:
                try:
                    from .models import Vendor

                    vendor = Vendor.objects.filter(
                        id=vendor_id
                    ).first()

                except Exception:
                    return False

        if vendor is None:
            return False

        return user_belongs_to_vendor(
            request.user,
            vendor,
        )


# ============================================================
# VENDOR ACTIVE
# ============================================================

class IsActiveVendorUser(BasePermission):
    """
    User must have an active vendor account
    and vendor subscription.
    """

    message = (
        "Your vendor account does not currently "
        "have access to the platform."
    )

    def has_permission(
        self,
        request,
        view,
    ):

        if is_super_admin(
            request.user
        ):
            return True

        vendor = getattr(
            request,
            "vendor",
            None,
        )

        if vendor is None:
            vendor = getattr(
                view,
                "vendor",
                None,
            )

        if vendor is None:
            return False

        vendor_user = get_vendor_user(
            request.user,
            vendor,
        )

        if not vendor_user:
            return False

        return vendor_user.login_allowed


# ============================================================
# VENDOR OWNER
# ============================================================

class IsVendorOwner(BasePermission):
    """
    Only Vendor Owner or Super Admin.
    """

    message = (
        "Vendor Owner privileges are required."
    )

    def has_permission(
        self,
        request,
        view,
    ):

        if is_super_admin(
            request.user
        ):
            return True

        vendor = getattr(
            request,
            "vendor",
            None,
        )

        if vendor is None:
            vendor = getattr(
                view,
                "vendor",
                None,
            )

        if vendor is None:
            return False

        vendor_user = get_vendor_user(
            request.user,
            vendor,
        )

        if not vendor_user:
            return False

        return vendor_user.role == "owner"


# ============================================================
# VENDOR ADMIN
# ============================================================

class IsVendorAdmin(BasePermission):
    """
    Vendor Owner or Administrator.
    """

    message = (
        "Vendor administrator privileges are required."
    )

    def has_permission(
        self,
        request,
        view,
    ):

        if is_super_admin(
            request.user
        ):
            return True

        vendor = getattr(
            request,
            "vendor",
            None,
        )

        if vendor is None:
            vendor = getattr(
                view,
                "vendor",
                None,
            )

        if vendor is None:
            return False

        vendor_user = get_vendor_user(
            request.user,
            vendor,
        )

        if not vendor_user:
            return False

        return vendor_user.role in (
            "owner",
            "admin",
        )


# ============================================================
# VENDOR MANAGEMENT
# ============================================================

class CanManageVendors(BasePermission):
    """
    Only Super Admin can create/update/delete vendors.
    """

    message = (
        "Only Super Admin can manage vendors."
    )

    def has_permission(
        self,
        request,
        view,
    ):
        return is_super_admin(
            request.user
        )


# ============================================================
# USER MANAGEMENT
# ============================================================

class CanManageUsers(BasePermission):
    """
    Permission for vendor user management.
    """

    message = (
        "You do not have permission to manage users."
    )

    def has_permission(
        self,
        request,
        view,
    ):

        if is_super_admin(
            request.user
        ):
            return True

        vendor = getattr(
            request,
            "vendor",
            None,
        )

        if vendor is None:
            vendor = getattr(
                view,
                "vendor",
                None,
            )

        if vendor is None:
            return False

        vendor_user = get_vendor_user(
            request.user,
            vendor,
        )

        if not vendor_user:
            return False

        return vendor_user.role in (
            "owner",
            "admin",
            "manager",
        )


# ============================================================
# BILLING
# ============================================================

class CanManageBilling(BasePermission):
    """
    Billing access.

    Super Admin:
        Full access.

    Vendor:
        Owner/Admin/Accountant.
    """

    message = (
        "You do not have billing permission."
    )

    def has_permission(
        self,
        request,
        view,
    ):

        if is_super_admin(
            request.user
        ):
            return True

        vendor = getattr(
            request,
            "vendor",
            None,
        )

        if vendor is None:
            vendor = getattr(
                view,
                "vendor",
                None,
            )

        if vendor is None:
            return False

        vendor_user = get_vendor_user(
            request.user,
            vendor,
        )

        if not vendor_user:
            return False

        return vendor_user.role in (
            "owner",
            "admin",
            "accountant",
        )


# ============================================================
# SUPPORT
# ============================================================

class CanManageSupportTickets(BasePermission):
    """
    Super Admin:
        Full support access.

    Vendor:
        Owner/Admin/Manager can manage tickets.
    """

    message = (
        "You do not have permission to manage "
        "support tickets."
    )

    def has_permission(
        self,
        request,
        view,
    ):

        if is_super_admin(
            request.user
        ):
            return True

        vendor = getattr(
            request,
            "vendor",
            None,
        )

        if vendor is None:
            vendor = getattr(
                view,
                "vendor",
                None,
            )

        if vendor is None:
            return False

        vendor_user = get_vendor_user(
            request.user,
            vendor,
        )

        if not vendor_user:
            return False

        return vendor_user.role in (
            "owner",
            "admin",
            "manager",
        )


# ============================================================
# ANALYTICS
# ============================================================

class CanViewAnalytics(BasePermission):
    """
    Analytics access.
    """

    message = (
        "You do not have permission to view analytics."
    )

    def has_permission(
        self,
        request,
        view,
    ):

        if is_super_admin(
            request.user
        ):
            return True

        vendor = getattr(
            request,
            "vendor",
            None,
        )

        if vendor is None:
            vendor = getattr(
                view,
                "vendor",
                None,
            )

        if vendor is None:
            return False

        vendor_user = get_vendor_user(
            request.user,
            vendor,
        )

        if not vendor_user:
            return False

        return vendor_user.role in (
            "owner",
            "admin",
            "manager",
        )


# ============================================================
# SETTINGS
# ============================================================

class CanManageSettings(BasePermission):
    """
    Settings access.
    """

    message = (
        "You do not have permission to manage settings."
    )

    def has_permission(
        self,
        request,
        view,
    ):

        if is_super_admin(
            request.user
        ):
            return True

        vendor = getattr(
            request,
            "vendor",
            None,
        )

        if vendor is None:
            vendor = getattr(
                view,
                "vendor",
                None,
            )

        if vendor is None:
            return False

        vendor_user = get_vendor_user(
            request.user,
            vendor,
        )

        if not vendor_user:
            return False

        return vendor_user.role in (
            "owner",
            "admin",
        )


# ============================================================
# ACTIVITY LOGS
# ============================================================

class CanViewActivityLogs(BasePermission):
    """
    Activity log access.
    """

    message = (
        "You do not have permission to view activity logs."
    )

    def has_permission(
        self,
        request,
        view,
    ):

        if is_super_admin(
            request.user
        ):
            return True

        vendor = getattr(
            request,
            "vendor",
            None,
        )

        if vendor is None:
            vendor = getattr(
                view,
                "vendor",
                None,
            )

        if vendor is None:
            return False

        vendor_user = get_vendor_user(
            request.user,
            vendor,
        )

        if not vendor_user:
            return False

        return vendor_user.role in (
            "owner",
            "admin",
        )


# ============================================================
# ROLE / PERMISSION MANAGEMENT
# ============================================================

class CanManageRoles(BasePermission):
    """
    Vendor roles and permissions.
    """

    message = (
        "You do not have permission to manage roles."
    )

    def has_permission(
        self,
        request,
        view,
    ):

        if is_super_admin(
            request.user
        ):
            return True

        vendor = getattr(
            request,
            "vendor",
            None,
        )

        if vendor is None:
            vendor = getattr(
                view,
                "vendor",
                None,
            )

        if vendor is None:
            return False

        vendor_user = get_vendor_user(
            request.user,
            vendor,
        )

        if not vendor_user:
            return False

        return vendor_user.role in (
            "owner",
            "admin",
        )


# ============================================================
# NOTIFICATIONS
# ============================================================

class CanManageNotifications(BasePermission):
    """
    Notification management.
    """

    message = (
        "You do not have permission to manage notifications."
    )

    def has_permission(
        self,
        request,
        view,
    ):

        if is_super_admin(
            request.user
        ):
            return True

        vendor = getattr(
            request,
            "vendor",
            None,
        )

        if vendor is None:
            vendor = getattr(
                view,
                "vendor",
                None,
            )

        if vendor is None:
            return False

        vendor_user = get_vendor_user(
            request.user,
            vendor,
        )

        if not vendor_user:
            return False

        return vendor_user.role in (
            "owner",
            "admin",
        )


# ============================================================
# API ACCESS
# ============================================================

class CanUseVendorAPI(BasePermission):
    """
    Vendor API access.

    Requires:
        - active vendor
        - API feature enabled
        - authenticated user
    """

    message = (
        "Vendor API access is not enabled."
    )

    def has_permission(
        self,
        request,
        view,
    ):

        if is_super_admin(
            request.user
        ):
            return True

        vendor = getattr(
            request,
            "vendor",
            None,
        )

        if vendor is None:
            return False

        vendor_user = get_vendor_user(
            request.user,
            vendor,
        )

        if not vendor_user:
            return False

        if not vendor_user.login_allowed:
            return False

        # Feature override
        feature_control = getattr(
            vendor,
            "feature_control",
            None,
        )

        if feature_control:
            return feature_control.api_enabled

        # Subscription plan
        subscription = (
            vendor.subscriptions
            .filter(
                status__in=[
                    "active",
                    "trial",
                ]
            )
            .order_by(
                "-current_period_end"
            )
            .first()
        )

        if not subscription:
            return False

        return subscription.plan.api_access_enabled


# ============================================================
# LICENSE MANAGEMENT
# ============================================================

class CanManageLicenses(BasePermission):
    """
    License management is a Super Admin operation.
    """

    message = (
        "Only Super Admin can manage licenses."
    )

    def has_permission(
        self,
        request,
        view,
    ):
        return is_super_admin(
            request.user
        )


# ============================================================
# SUBSCRIPTION MANAGEMENT
# ============================================================

class CanManageSubscriptions(BasePermission):
    """
    Subscription management.

    Super Admin has complete access.
    Vendor Owner/Admin can view their own subscription.
    """

    message = (
        "You do not have permission to manage subscriptions."
    )

    def has_permission(
        self,
        request,
        view,
    ):

        if is_super_admin(
            request.user
        ):
            return True

        if request.method in (
            "GET",
            "HEAD",
            "OPTIONS",
        ):
            return True

        return False


# ============================================================
# PLAN MANAGEMENT
# ============================================================

class CanManagePlans(BasePermission):
    """
    Subscription plans are platform-level resources.
    """

    message = (
        "Only Super Admin can manage subscription plans."
    )

    def has_permission(
        self,
        request,
        view,
    ):
        return is_super_admin(
            request.user
        )


# ============================================================
# PAYMENT SETTINGS
# ============================================================

class CanManagePaymentSettings(BasePermission):
    """
    Payment gateway configuration.
    """

    message = (
        "Only Super Admin can manage payment settings."
    )

    def has_permission(
        self,
        request,
        view,
    ):
        return is_super_admin(
            request.user
        )


# ============================================================
# SYSTEM SETTINGS
# ============================================================

class CanManageSystemSettings(BasePermission):
    """
    Platform system settings.
    """

    message = (
        "Only Super Admin can manage system settings."
    )

    def has_permission(
        self,
        request,
        view,
    ):
        return is_super_admin(
            request.user
        )


# ============================================================
# SECURITY SETTINGS
# ============================================================

class CanManageSecuritySettings(BasePermission):
    """
    Security settings.
    """

    message = (
        "Only Super Admin can manage security settings."
    )

    def has_permission(
        self,
        request,
        view,
    ):
        return is_super_admin(
            request.user
        )


# ============================================================
# EMAIL SETTINGS
# ============================================================

class CanManageEmailSettings(BasePermission):
    """
    Email/SMPP settings.
    """

    message = (
        "Only Super Admin can manage email settings."
    )

    def has_permission(
        self,
        request,
        view,
    ):
        return is_super_admin(
            request.user
        )


# ============================================================
# IMPERSONATION
# ============================================================

class CanImpersonateVendor(BasePermission):
    """
    Vendor impersonation.

    Extremely sensitive operation.
    Only Super Admin is allowed.
    """

    message = (
        "Only Super Admin can impersonate vendors."
    )

    def has_permission(
        self,
        request,
        view,
    ):

        if not is_super_admin(
            request.user
        ):
            return False

        # Never allow anonymous impersonation
        return request.user.is_active


# ============================================================
# EXPORT
# ============================================================

class CanExportData(BasePermission):
    """
    Export permission.

    Super Admin:
        Full access.

    Vendor:
        Owner/Admin/Manager.
    """

    message = (
        "You do not have permission to export data."
    )

    def has_permission(
        self,
        request,
        view,
    ):

        if is_super_admin(
            request.user
        ):
            return True

        vendor = getattr(
            request,
            "vendor",
            None,
        )

        if vendor is None:
            vendor = getattr(
                view,
                "vendor",
                None,
            )

        if vendor is None:
            return False

        return has_vendor_permission(
            request.user,
            vendor,
            "data.export",
        )


# ============================================================
# OBJECT LEVEL VENDOR ISOLATION
# ============================================================

class IsSameVendorObject(BasePermission):
    """
    Prevent cross-tenant object access.

    Any object containing:

        object.vendor

    must belong to the authenticated user's vendor.
    """

    message = (
        "You cannot access data belonging to another vendor."
    )

    def has_object_permission(
        self,
        request,
        view,
        obj,
    ):

        # Super Admin can access everything
        if is_super_admin(
            request.user
        ):
            return True

        vendor = getattr(
            obj,
            "vendor",
            None,
        )

        if vendor is None:
            return False

        return user_belongs_to_vendor(
            request.user,
            vendor,
        )


# ============================================================
# READ ONLY
# ============================================================

class ReadOnly(BasePermission):
    """
    Allow only safe HTTP methods.
    """

    def has_permission(
        self,
        request,
        view,
    ):
        return request.method in (
            "GET",
            "HEAD",
            "OPTIONS",
        )


# ============================================================
# SAFE OR SUPER ADMIN
# ============================================================

class IsSuperAdminOrReadOnly(BasePermission):
    """
    Super Admin:
        full access

    Everyone else:
        read only
    """

    message = (
        "You do not have permission to perform "
        "this operation."
    )

    def has_permission(
        self,
        request,
        view,
    ):

        if is_super_admin(
            request.user
        ):
            return True

        if not is_authenticated(
            request.user
        ):
            return False

        return request.method in (
            "GET",
            "HEAD",
            "OPTIONS",
        )


# ============================================================
# ACTION BASED PERMISSION
# ============================================================

class VendorActionPermission(BasePermission):
    """
    Generic action-based permission.

    Example:

        permission_classes = [
            VendorActionPermission
        ]

    View can define:

        permission_code = "patients.view"

    or:

        permission_code = "patients.create"
    """

    message = (
        "You do not have the required permission."
    )

    def has_permission(
        self,
        request,
        view,
    ):

        if is_super_admin(
            request.user
        ):
            return True

        if not is_authenticated(
            request.user
        ):
            return False

        vendor = getattr(
            request,
            "vendor",
            None,
        )

        if vendor is None:
            vendor = getattr(
                view,
                "vendor",
                None,
            )

        if vendor is None:
            return False

        permission_code = getattr(
            view,
            "permission_code",
            None,
        )

        if not permission_code:
            return False

        return has_vendor_permission(
            request.user,
            vendor,
            permission_code,
        )


# ============================================================
# ACTION MAPPING PERMISSION
# ============================================================

class ActionBasedVendorPermission(BasePermission):
    """
    Automatically converts DRF ViewSet actions
    into permission codes.

    Example:

        list       -> patients.view
        retrieve   -> patients.view
        create     -> patients.create
        update     -> patients.update
        partial_update -> patients.update
        destroy    -> patients.delete

    ViewSet must define:

        permission_module = "patients"
    """

    message = (
        "You do not have permission to perform "
        "this operation."
    )

    ACTION_MAP = {
        "list": "view",
        "retrieve": "view",
        "create": "create",
        "update": "update",
        "partial_update": "update",
        "destroy": "delete",
    }

    def has_permission(
        self,
        request,
        view,
    ):

        if is_super_admin(
            request.user
        ):
            return True

        if not is_authenticated(
            request.user
        ):
            return False

        vendor = getattr(
            request,
            "vendor",
            None,
        )

        if vendor is None:
            vendor = getattr(
                view,
                "vendor",
                None,
            )

        if vendor is None:
            return False

        module = getattr(
            view,
            "permission_module",
            None,
        )

        if not module:
            return False

        action = getattr(
            view,
            "action",
            None,
        )

        permission_action = self.ACTION_MAP.get(
            action
        )

        if not permission_action:

            if request.method == "GET":
                permission_action = "view"

            elif request.method == "POST":
                permission_action = "create"

            elif request.method in (
                "PUT",
                "PATCH",
            ):
                permission_action = "update"

            elif request.method == "DELETE":
                permission_action = "delete"

            else:
                return False

        permission_code = (
            f"{module}.{permission_action}"
        )

        return has_vendor_permission(
            request.user,
            vendor,
            permission_code,
        )


# ============================================================
# COMBINED VENDOR PERMISSION
# ============================================================

class ActiveVendorActionPermission(BasePermission):
    """
    Combined production-level check:

    1. Authentication
    2. Vendor membership
    3. Vendor active
    4. Subscription valid
    5. Permission
    """

    message = (
        "Your account does not have access "
        "to perform this operation."
    )

    ACTION_MAP = {
        "list": "view",
        "retrieve": "view",
        "create": "create",
        "update": "update",
        "partial_update": "update",
        "destroy": "delete",
    }

    def has_permission(
        self,
        request,
        view,
    ):

        # Super Admin bypass
        if is_super_admin(
            request.user
        ):
            return True

        if not is_authenticated(
            request.user
        ):
            return False

        vendor = getattr(
            request,
            "vendor",
            None,
        )

        if vendor is None:
            vendor = getattr(
                view,
                "vendor",
                None,
            )

        if vendor is None:
            return False

        vendor_user = get_vendor_user(
            request.user,
            vendor,
        )

        if not vendor_user:
            return False

        # Vendor subscription/access validation
        if not vendor_user.login_allowed:
            return False

        module = getattr(
            view,
            "permission_module",
            None,
        )

        if not module:
            return False

        action = getattr(
            view,
            "action",
            None,
        )

        permission_action = self.ACTION_MAP.get(
            action
        )

        if not permission_action:

            if request.method == "GET":
                permission_action = "view"

            elif request.method == "POST":
                permission_action = "create"

            elif request.method in (
                "PUT",
                "PATCH",
            ):
                permission_action = "update"

            elif request.method == "DELETE":
                permission_action = "delete"

            else:
                return False

        permission_code = (
            f"{module}.{permission_action}"
        )

        return has_vendor_permission(
            request.user,
            vendor,
            permission_code,
        )

    def has_object_permission(
        self,
        request,
        view,
        obj,
    ):

        if is_super_admin(
            request.user
        ):
            return True

        vendor = getattr(
            obj,
            "vendor",
            None,
        )

        if vendor is None:
            return False

        if not user_belongs_to_vendor(
            request.user,
            vendor,
        ):
            return False

        return self.has_permission(
            request,
            view,
        )


# ============================================================
# SUPER ADMIN OBJECT PERMISSION
# ============================================================

class SuperAdminObjectPermission(BasePermission):
    """
    Super Admin-only object-level permission.
    """

    message = (
        "Only Super Admin can access this resource."
    )

    def has_permission(
        self,
        request,
        view,
    ):
        return is_super_admin(
            request.user
        )

    def has_object_permission(
        self,
        request,
        view,
        obj,
    ):
        return is_super_admin(
            request.user
        )


# ============================================================
# FINAL PERMISSION EXPORTS
# ============================================================

__all__ = [
    "IsAuthenticatedUser",
    "IsSuperAdmin",
    "IsSuperAdminOrReadOnly",
    "IsVendorMember",
    "IsActiveVendorUser",
    "IsVendorOwner",
    "IsVendorAdmin",
    "CanManageVendors",
    "CanManageUsers",
    "CanManageBilling",
    "CanManageSupportTickets",
    "CanViewAnalytics",
    "CanManageSettings",
    "CanViewActivityLogs",
    "CanManageRoles",
    "CanManageNotifications",
    "CanUseVendorAPI",
    "CanManageLicenses",
    "CanManageSubscriptions",
    "CanManagePlans",
    "CanManagePaymentSettings",
    "CanManageSystemSettings",
    "CanManageSecuritySettings",
    "CanManageEmailSettings",
    "CanImpersonateVendor",
    "CanExportData",
    "IsSameVendorObject",
    "ReadOnly",
    "VendorActionPermission",
    "ActionBasedVendorPermission",
    "ActiveVendorActionPermission",
    "SuperAdminObjectPermission",
]
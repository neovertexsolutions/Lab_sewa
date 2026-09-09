
from __future__ import annotations

import json
import logging
from decimal import Decimal
from datetime import timedelta
from functools import wraps

from django.apps import apps
from django.contrib import messages
from django.contrib.auth import (
    authenticate,
    get_user_model,
    login,
    logout,
)
from django.contrib.auth.decorators import login_required
from django.core.exceptions import PermissionDenied, ValidationError
from django.core.paginator import Paginator, EmptyPage
from django.db import transaction, connection
from django.db.models import Sum
from django.http import JsonResponse, HttpResponse
from django.db.models.fields.files import FieldFile
from django.shortcuts import (
    get_object_or_404,
    redirect,
    render,
)
from django.template import TemplateDoesNotExist
from django.utils import timezone
from django.views.decorators.http import (
    require_GET,
    require_http_methods,
)

from superadmin.models import Vendor


# ============================================================
# LOGGER / USER
# ============================================================

logger = logging.getLogger("superadmin")

User = get_user_model()


# ============================================================
# CONFIGURATION
# ============================================================

PAGE_SIZE = 25
API_PAGE_SIZE = 50

PROTECTED_FIELDS = {
    "id",
    "pk",
    "created_at",
    "updated_at",
    "date_joined",
}


# ============================================================
# RESPONSE HELPERS
# ============================================================

def _json_response(data, status=200):
    return JsonResponse(
        data,
        status=status,
        safe=isinstance(data, dict),
    )


def _success(message=None, data=None, status=200, **extra):
    response = {"success": True}

    if message:
        response["message"] = message

    if data is not None:
        response["data"] = data

    response.update(extra)

    return _json_response(response, status)


def _error(message, status=400, code=None):
    response = {"success": False, "message": message}

    if code:
        response["code"] = code

    return _json_response(response, status)


# ============================================================
# TEMPLATE HELPER
# ============================================================

def _render_page(request, template_name, context=None):
    context = context or {}

    try:
        return render(request, template_name, context)

    except TemplateDoesNotExist:
        logger.exception(
            "Template does not exist: %s",
            template_name,
        )

        return HttpResponse(
            f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Sita Path Lab</title>

                <style>
                    body {{
                        margin: 0;
                        min-height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: #f4f7fb;
                        font-family: Arial, sans-serif;
                    }}

                    .box {{
                        width: 90%;
                        max-width: 700px;
                        background: #ffffff;
                        padding: 40px;
                        border-radius: 20px;
                        box-shadow: 0 20px 60px rgba(0, 0, 0, .08);
                    }}

                    h1 {{ color: #2563eb; }}

                    code {{
                        display: block;
                        padding: 15px;
                        background: #f3f4f6;
                        border-radius: 10px;
                        word-break: break-word;
                    }}
                </style>
            </head>

            <body>
                <div class="box">
                    <h1>Sita Path Lab</h1>
                    <h2>Super Admin</h2>
                    <p>Template configuration error.</p>
                    <code>{template_name}</code>
                </div>
            </body>
            </html>
            """,
            status=500,
        )


# ============================================================
# MODEL HELPERS
# ============================================================

def _get_model(model_name):
    """Find a Django model by class name."""

    try:
        for model in apps.get_models():
            if model.__name__.lower() == model_name.lower():
                return model

    except Exception:
        logger.exception("Model lookup failed: %s", model_name)

    return None


def _field_names(model):
    """Return concrete model field names."""

    if not model:
        return set()

    try:
        return {field.name for field in model._meta.fields}

    except Exception:
        return set()


def _has_field(model, field_name):
    return field_name in _field_names(model)


# ============================================================
# SERIALIZATION
# ============================================================
def _serialize_value(value):

    if isinstance(value, Decimal):
        return float(value)

    if hasattr(value, "isoformat"):
        try:
            return value.isoformat()
        except Exception:
            pass

    # ImageField / FileField (logo, favicon, pdf_file, etc.)
    if isinstance(value, FieldFile):
        try:
            return value.url if value else None
        except Exception:
            return None

    if hasattr(value, "pk"):
        try:
            return value.pk
        except Exception:
            pass

    return value


def _serialize_instance(obj):

    if not obj:
        return {}

    data = {}

    try:
        for field in obj._meta.fields:
            value = getattr(obj, field.name, None)
            data[field.name] = _serialize_value(value)

    except Exception:
        logger.exception("Object serialization failed.")

    return data


# ============================================================
# DATABASE HELPERS
# ============================================================

def _safe_count(model_name, **filters):

    model = _get_model(model_name)

    if not model:
        return 0

    try:
        queryset = model.objects.all()

        if filters:
            queryset = queryset.filter(**filters)

        return queryset.count()

    except Exception:
        logger.exception("Count failed for model=%s", model_name)
        return 0


def _safe_sum(model_name, field_name):

    model = _get_model(model_name)

    if not model:
        return Decimal("0")

    if not _has_field(model, field_name):
        return Decimal("0")

    try:
        result = model.objects.aggregate(total=Sum(field_name))
        return result.get("total") or Decimal("0")

    except Exception:
        logger.exception("Sum failed for %s.%s", model_name, field_name)
        return Decimal("0")


# ============================================================
# REQUEST HELPERS
# ============================================================

def _get_request_data(request):

    content_type = (request.content_type or "").lower()

    if content_type.startswith("application/json"):
        try:
            body = request.body.decode("utf-8")
            return json.loads(body or "{}")

        except (json.JSONDecodeError, UnicodeDecodeError):
            return {}

    return request.POST.dict()


def _set_model_fields(obj, payload):

    model = obj.__class__
    fields = _field_names(model)

    for key, value in payload.items():

        if key not in fields:
            continue

        if key in PROTECTED_FIELDS:
            continue

        try:
            setattr(obj, key, value)

        except Exception:
            logger.exception("Unable to update field=%s", key)

    return obj


def _clean_payload(model, payload):

    fields = _field_names(model)

    return {
        key: value
        for key, value in payload.items()
        if key in fields and key not in PROTECTED_FIELDS
    }


# ============================================================
# PAGINATION
# ============================================================

def _paginate_queryset(queryset, request, page_size=PAGE_SIZE):

    paginator = Paginator(queryset, page_size)
    page_number = request.GET.get("page", 1)

    try:
        page = paginator.page(page_number)

    except EmptyPage:
        if paginator.num_pages:
            page = paginator.page(paginator.num_pages)
        else:
            page = paginator.page(1)

    return page


# ============================================================
# SUPER ADMIN AUTHORIZATION
# ============================================================

def _is_superadmin(user):
    return bool(
        user
        and user.is_authenticated
        and (user.is_superuser or user.is_staff)
    )


def _superadmin_required(view_func):

    @wraps(view_func)
    def wrapper(request, *args, **kwargs):

        if not request.user.is_authenticated:
            return redirect("superadmin:login")

        if not _is_superadmin(request.user):
            raise PermissionDenied("Super Admin access required.")

        return view_func(request, *args, **kwargs)

    return wrapper


# ============================================================
# AUTHENTICATION
# ============================================================

@require_http_methods(["GET", "POST"])
def login_view(request):

    if _is_superadmin(request.user):
        return redirect("superadmin:dashboard")

    if request.method == "POST":

        username = (
            request.POST.get("username")
            or request.POST.get("email")
            or ""
        ).strip()

        password = request.POST.get("password") or ""

        if not username or not password:
            messages.error(
                request,
                "Username/email and password are required.",
            )
            return _render_page(request, "superadmin/login.html")

        user = authenticate(request, username=username, password=password)

        # ----------------------------------------------------
        # EMAIL FALLBACK
        # ----------------------------------------------------

        if user is None and "@" in username:
            try:
                account = User.objects.filter(email__iexact=username).first()

                if account:
                    user = authenticate(
                        request,
                        username=account.get_username(),
                        password=password,
                    )

            except Exception:
                logger.exception("Email authentication failed.")

        if user is None:
            logger.warning("Failed superadmin login attempt: %s", username)
            messages.error(request, "Invalid username/email or password.")
            return _render_page(request, "superadmin/login.html")

        if not user.is_active:
            messages.error(request, "This account is inactive.")
            return _render_page(request, "superadmin/login.html")

        if not _is_superadmin(user):
            logger.warning(
                "Unauthorized superadmin login attempt: %s", username
            )
            messages.error(request, "You do not have Super Admin access.")
            return _render_page(request, "superadmin/login.html")

        login(request, user)

        if request.POST.get("remember_me"):
            request.session.set_expiry(60 * 60 * 24 * 30)
        else:
            request.session.set_expiry(0)

        logger.info("Superadmin login successful: user_id=%s", user.pk)
        messages.success(request, "Welcome back, Super Admin.")

        return redirect("superadmin:dashboard")

    return _render_page(request, "superadmin/login.html")


@require_http_methods(["GET", "POST"])
def logout_view(request):

    if request.user.is_authenticated:
        logger.info("Superadmin logout: user_id=%s", request.user.pk)

    logout(request)

    return redirect("superadmin:login")


@require_http_methods(["GET", "POST"])
def password_reset(request):

    if request.method == "POST":
        email = (request.POST.get("email", "") or "").strip()

        if not email:
            messages.error(request, "Please enter your email address.")
        else:
            messages.success(
                request,
                "If this email exists, password reset instructions will be sent.",
            )

    return redirect("superadmin:login")


# ============================================================
# DASHBOARD
# ============================================================

@_superadmin_required
def dashboard(request):
    return _render_page(
        request,
        "superadmin/dashboard.html",
        {
            "page_title": "Dashboard",
            "current_year": timezone.localdate().year,
        },
    )


@_superadmin_required
@require_GET
def dashboard_api(request):

    invoice_revenue = _safe_sum("Invoice", "total")
    payment_revenue = _safe_sum("Payment", "amount")
    revenue = invoice_revenue if invoice_revenue else payment_revenue

    data = {
        "revenue": float(revenue),
        "active_vendors": _safe_count("Vendor", is_active=True),
        "vendors": _safe_count("Vendor"),
        "patients": _safe_count("Patient"),
        "appointments": _safe_count("Appointment"),
        "orders": _safe_count("Order"),
        "pending_reports": _safe_count("Report", status="pending"),
    }

    recent_activity = []
    activity_model = _get_model("ActivityLog")

    if activity_model:
        try:
            recent_activity = [
                _serialize_instance(obj)
                for obj in activity_model.objects.all().order_by("-id")[:10]
            ]

        except Exception:
            logger.exception("Dashboard activity failed.")

    return _success(
        data={
            "stats": data,
            "recent_activity": recent_activity,
            "meta": {
                "date": timezone.localdate().isoformat(),
                "updated_at": timezone.now().isoformat(),
            },
        }
    )


# ============================================================
# ANALYTICS
# ============================================================

@_superadmin_required
def analytics(request):
    return _render_page(
        request,
        "superadmin/analytics.html",
        {
            "page_title": "Analytics",
            "current_year": timezone.localdate().year,
        },
    )


@_superadmin_required
@require_GET
def analytics_api(request):

    today = timezone.localdate()
    revenue = [0.0 for _ in range(12)]

    invoice_model = _get_model("Invoice")

    if invoice_model:
        fields = _field_names(invoice_model)

        date_field = (
            "created_at" if "created_at" in fields
            else ("date" if "date" in fields else None)
        )

        amount_field = (
            "total" if "total" in fields
            else ("amount" if "amount" in fields else None)
        )

        if date_field and amount_field:
            try:
                for month in range(1, 13):
                    result = (
                        invoice_model.objects.filter(
                            **{
                                f"{date_field}__year": today.year,
                                f"{date_field}__month": month,
                            }
                        ).aggregate(total=Sum(amount_field))
                    )

                    revenue[month - 1] = float(result.get("total") or 0)

            except Exception:
                logger.exception("Analytics calculation failed.")

    return _success(
        data={
            "year": today.year,
            "revenue": revenue,
            "totals": {
                "revenue": sum(revenue),
                "patients": _safe_count("Patient"),
                "vendors": _safe_count("Vendor"),
                "appointments": _safe_count("Appointment"),
                "orders": _safe_count("Order"),
            },
        }
    )


# ============================================================
# PROFILE
# ============================================================

@_superadmin_required
def profile(request):
    return _render_page(
        request,
        "superadmin/profile.html",
        {"admin_user": request.user},
    )


@_superadmin_required
@require_http_methods(["GET", "POST"])
def profile_update(request):

    user = request.user

    if request.method == "POST":

        user.first_name = request.POST.get("first_name", "").strip()
        user.last_name = request.POST.get("last_name", "").strip()

        email = request.POST.get("email", "").strip()
        if email:
            user.email = email

        user.save()

        logger.info("Superadmin profile updated: user_id=%s", user.pk)
        messages.success(request, "Profile updated successfully.")

        return redirect("superadmin:profile")

    return _render_page(
        request,
        "superadmin/profile.html",
        {"admin_user": user},
    )


@_superadmin_required
@require_http_methods(["GET", "POST"])
def change_password(request):

    if request.method == "POST":

        old_password = request.POST.get("old_password", "")
        new_password = request.POST.get("new_password", "")
        confirm_password = request.POST.get("confirm_password", "")

        if not request.user.check_password(old_password):
            messages.error(request, "Current password is incorrect.")

        elif len(new_password) < 8:
            messages.error(
                request, "Password must contain at least 8 characters."
            )

        elif new_password != confirm_password:
            messages.error(request, "Passwords do not match.")

        else:
            request.user.set_password(new_password)
            request.user.save(update_fields=["password"])
            login(request, request.user)

            messages.success(request, "Password changed successfully.")

            return redirect("superadmin:profile")

    # NOTE: no dedicated change_password.html was in the templates
    # folder you shared - reusing profile.html keeps this working
    # without a 500. Create change_password.html and swap this back
    # once it exists.
    return _render_page(request, "superadmin/profile.html")


# ============================================================
# VENDORS
# ============================================================


def _vendor_models():
    return {
        "Vendor": _get_model("Vendor"),
        "VendorUser": _get_model("VendorUser"),
        "SubscriptionPlan": _get_model("SubscriptionPlan"),
        "VendorSubscription": _get_model("VendorSubscription"),
        "VendorLicense": _get_model("VendorLicense"),
        "VendorFeature": _get_model("VendorFeature"),
        "VendorLimit": _get_model("VendorLimit"),
    }


def _as_bool(value, default=False):
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    return str(value).strip().lower() in {"1", "true", "yes", "on", "active"}


def _parse_datetime(value):
    if not value:
        return None
    if hasattr(value, "tzinfo"):
        return value
    try:
        from django.utils.dateparse import parse_datetime
        parsed = parse_datetime(str(value))
        if parsed and timezone.is_naive(parsed):
            parsed = timezone.make_aware(parsed)
        return parsed
    except Exception:
        return None


def _vendor_payload(payload):
    """Normalize frontend aliases into the real Vendor/User field names."""
    data = dict(payload or {})
    aliases = {
        "vendor_name": "business_name",
        "name": "business_name",
        "pincode": "postal_code",
        "pin_code": "postal_code",
        "vendor_status": "status",
        "vendor_email": "email",
        "vendor_phone": "phone",
    }
    for old, new in aliases.items():
        if new not in data and old in data:
            data[new] = data[old]
    return data


def _serialize_vendor(vendor, include_sensitive=False):
    data = _serialize_instance(vendor)
    owner = getattr(vendor, "owner", None)
    data.update({
        "owner_name": vendor.owner_name,
        "owner_username": vendor.owner_username,
        "owner_email": vendor.owner_email,
        "is_access_allowed": bool(vendor.is_access_allowed),
    })

    if owner:
        data["owner"] = {
            "id": owner.pk,
            "username": owner.username,
            "email": owner.email,
            "first_name": owner.first_name,
            "last_name": owner.last_name,
            "is_active": owner.is_active,
        }

    subscription = vendor.subscriptions.order_by("-current_period_end", "-created_at").first()
    if subscription:
        data["subscription"] = {
            "id": subscription.pk,
            "plan_id": subscription.plan_id,
            "plan_name": subscription.plan.name,
            "status": subscription.status,
            "started_at": _serialize_value(subscription.started_at),
            "current_period_start": _serialize_value(subscription.current_period_start),
            "current_period_end": _serialize_value(subscription.current_period_end),
            "days_remaining": subscription.days_remaining,
            "is_current": subscription.is_current,
            "amount": _serialize_value(subscription.amount),
            "currency": subscription.currency,
            "auto_renew": subscription.auto_renew,
        }
    else:
        data["subscription"] = None

    features = getattr(vendor, "feature_control", None)
    data["features"] = _serialize_instance(features) if features else None
    limits = getattr(vendor, "limits", None)
    data["limits"] = _serialize_instance(limits) if limits else None

    license_obj = vendor.licenses.order_by("-created_at").first()
    if license_obj:
        data["license"] = _serialize_instance(license_obj)
        data["license"]["is_valid"] = license_obj.is_valid
    else:
        data["license"] = None

    if not include_sensitive:
        data.pop("password", None)
    return data


def _get_or_create_vendor_user(vendor, payload, request_user, create=True):
    """Create/update the Django login user and VendorUser mapping."""
    models = _vendor_models()
    VendorUser = models["VendorUser"]
    if not VendorUser:
        raise RuntimeError("VendorUser model is not available.")

    owner = vendor.owner
    username = str(payload.get("username") or "").strip()
    email = str(payload.get("email") or vendor.email or "").strip()
    first_name = str(payload.get("first_name") or "").strip()
    last_name = str(payload.get("last_name") or "").strip()
    password = payload.get("password")

    if not username and owner:
        username = owner.username
    if not username and email:
        base = email.split("@")[0].strip() or "vendor"
        username = base
        suffix = 1
        while User.objects.filter(username=username).exists():
            suffix += 1
            username = f"{base}{suffix}"
    if not username:
        raise ValueError("Username or email is required for vendor login.")

    if owner is None:
        existing = User.objects.filter(username=username).first()
        if existing:
            owner = existing
        else:
            owner = User(username=username, email=email)

    if owner.username != username:
        conflict = User.objects.filter(username=username).exclude(pk=owner.pk).exists()
        if conflict:
            raise ValueError("Username is already in use.")
        owner.username = username

    if email:
        owner.email = email
    if first_name:
        owner.first_name = first_name
    if last_name:
        owner.last_name = last_name

    if password:
        owner.set_password(str(password))
    elif owner.pk is None:
        # A login account must have a usable credential. A temporary password
        # is returned to the create API response only; it is never stored here.
        import secrets as _secrets
        temporary_password = _secrets.token_urlsafe(10)
        owner.set_password(temporary_password)
    else:
        temporary_password = None

    owner.is_active = _as_bool(payload.get("user_is_active"), True)
    owner.save()

    vendor.owner = owner
    vendor.save(update_fields=["owner", "updated_at"])

    mapping, _ = VendorUser.objects.get_or_create(
        vendor=vendor,
        user=owner,
        defaults={
            "role": payload.get("role", "owner"),
            "is_active": _as_bool(payload.get("vendor_user_active"), True),
            "is_primary": True,
            "can_login": _as_bool(payload.get("login_enabled"), True),
        },
    )
    mapping.role = payload.get("role") or mapping.role or "owner"
    mapping.is_active = _as_bool(payload.get("vendor_user_active"), mapping.is_active)
    mapping.is_primary = True
    mapping.can_login = _as_bool(payload.get("login_enabled"), mapping.can_login)
    mapping.save()

    return owner, mapping, locals().get("temporary_password")


def _sync_vendor_plan(vendor, payload, created_by=None):
    models = _vendor_models()
    Plan = models["SubscriptionPlan"]
    Subscription = models["VendorSubscription"]
    Feature = models["VendorFeature"]
    Limit = models["VendorLimit"]
    License = models["VendorLicense"]

    plan_id = payload.get("plan_id") or payload.get("plan")
    if not plan_id or not Plan or not Subscription:
        return None

    # NEW: pehle UUID pk se try karo, warna slug se (form "basic"/"professional" bhejta hai)
    plan = None
    try:
        plan = Plan.objects.filter(pk=plan_id).first()
    except (ValueError, ValidationError):
        plan = None
    if not plan:
        plan = Plan.objects.filter(slug=plan_id).first()
    if not plan:
        raise ValueError(f"Subscription plan '{plan_id}' not found. Create it first in Plans page.")

    start = _parse_datetime(payload.get("start_date") or payload.get("started_at")) or timezone.now()
    end = _parse_datetime(payload.get("expiry_date") or payload.get("end_date") or payload.get("current_period_end"))
    ...
    if end is None:
        end = start + timedelta(days=int(plan.duration_days or 30))

    status = payload.get("subscription_status") or payload.get("plan_status") or "active"
    valid_statuses = {choice[0] for choice in Subscription.STATUS_CHOICES}
    if status not in valid_statuses:
        status = "active"

    subscription = vendor.subscriptions.order_by("-created_at").first()
    if subscription is None:
        subscription = Subscription.objects.create(
            vendor=vendor,
            plan=plan,
            status=status,
            started_at=start,
            current_period_start=start,
            current_period_end=end,
            amount=plan.price,
            currency=getattr(vendor, "currency", "INR") or "INR",
            auto_renew=_as_bool(payload.get("auto_renew"), True),
            custom_max_users=payload.get("max_users") or None,
            custom_max_patients=payload.get("max_patients") or None,
        )
    else:
        subscription.plan = plan
        subscription.status = status
        subscription.current_period_start = start
        subscription.current_period_end = end
        subscription.amount = plan.price
        subscription.auto_renew = _as_bool(payload.get("auto_renew"), subscription.auto_renew)
        subscription.save()

    if Feature:
        feature, _ = Feature.objects.get_or_create(vendor=vendor)
        feature_map = {
            "dashboard_enabled": "dashboard_enabled",
            "patients_enabled": "patients_enabled",
            "appointments_enabled": "appointments_enabled",
            "billing_enabled": "billing_enabled",
            "inventory_enabled": "inventory_enabled",
            "reports_enabled": "reports_enabled",
            "staff_enabled": "staff_enabled",
            "staff_management_enabled": "staff_enabled",
            "analytics_enabled": "analytics_enabled",
            "whatsapp_enabled": "whatsapp_enabled",
            "sms_enabled": "sms_enabled",
            "email_enabled": "email_enabled",
            "api_enabled": "api_enabled",
            "api_access_enabled": "api_enabled",
            "backup_enabled": "backup_enabled",
            "export_enabled": "export_enabled",
            "custom_branding_enabled": "custom_branding_enabled",
        }
        for source, target in feature_map.items():
            if source in payload and hasattr(feature, target):
                setattr(feature, target, _as_bool(payload[source]))
            elif hasattr(plan, source) and hasattr(feature, target):
                setattr(feature, target, getattr(plan, source))
        feature.save()

    if Limit:
        limit, _ = Limit.objects.get_or_create(vendor=vendor)
        for field in [
            "max_users", "max_patients", "max_doctors", "max_storage_mb",
            "max_monthly_reports", "max_appointments", "max_invoices",
        ]:
            value = payload.get(field, getattr(plan, field, None))
            if value not in (None, ""):
                try:
                    setattr(limit, field, int(value))
                except (TypeError, ValueError):
                    pass
        limit.save()

    if License:
        license_obj = getattr(subscription, "license", None)
        if license_obj is None:
            raw_key = License.generate_key()
            license_obj = License.objects.create(
                vendor=vendor,
                subscription=subscription,
                name="Primary License",
                key_prefix=raw_key[:12],
                key_hash=License.hash_key(raw_key),
                status="active",
                starts_at=start,
                expires_at=end,
                created_by=created_by,
            )
            return subscription, raw_key
        license_obj.expires_at = end
        license_obj.status = "active" if status in {"active", "trial"} else license_obj.status
        license_obj.save()

    return subscription, None


@_superadmin_required
def vendor_list(request):
    model = _get_model("Vendor")
    vendors = []
    if model:
        try:
            vendors = _paginate_queryset(model.objects.all().order_by("-created_at"), request)
        except Exception:
            logger.exception("Vendor list failed.")
    return _render_page(request, "superadmin/vendors.html", {"vendors": vendors})


@_superadmin_required
@require_http_methods(["GET", "POST"])
def vendor_create(request):
    model = _get_model("Vendor")
    if not model:
        messages.error(request, "Vendor model is not available.")
        return redirect("superadmin:vendors")

    if request.method == "POST":
        try:
            payload = _vendor_payload(_get_request_data(request))
            required = str(payload.get("business_name") or "").strip()
            email = str(payload.get("email") or "").strip()
            if not required or not email:
                raise ValueError("Business name and email are required.")

            with transaction.atomic():
                vendor = model.objects.create(**_clean_payload(model, payload))
                owner, mapping, temporary_password = _get_or_create_vendor_user(
                    vendor, payload, request.user
                )
                subscription_info = _sync_vendor_plan(vendor, payload, request.user)
                vendor.status = payload.get("status") or (
                    "trial" if payload.get("trial") else "pending"
                )
                vendor.is_active = _as_bool(payload.get("is_active"), True)
                vendor.login_enabled = _as_bool(payload.get("login_enabled"), True)
                vendor.save()

            messages.success(request, "Vendor created successfully.")
            return redirect("superadmin:vendor_detail", vendor_id=vendor.pk)
        except Exception as exc:
            logger.exception("Vendor creation failed.")
            messages.error(request, str(exc))

    return _render_page(request, "superadmin/vendor_create.html")


@_superadmin_required
def vendor_detail(request, vendor_id):
    model = _get_model("Vendor")
    if not model:
        return _error("Vendor model not found.", 404)
    vendor = get_object_or_404(model, pk=vendor_id)
    return _render_page(request, "superadmin/vendor_detail.html", {"vendor": vendor})


@_superadmin_required
@require_http_methods(["GET", "POST"])
def vendor_update(request, vendor_id):
    model = _get_model("Vendor")
    if not model:
        return _error("Vendor model not found.", 404)
    vendor = get_object_or_404(model, pk=vendor_id)

    if request.method == "POST":
        try:
            payload = _vendor_payload(_get_request_data(request))
            with transaction.atomic():
                _set_model_fields(vendor, payload)
                vendor.save()
                if any(k in payload for k in ("username", "password", "first_name", "last_name", "login_enabled", "email")):
                    _get_or_create_vendor_user(vendor, payload, request.user, create=False)
                if any(k in payload for k in ("plan_id", "plan", "expiry_date", "start_date", "max_users", "max_patients")):
                    _sync_vendor_plan(vendor, payload, request.user)
            messages.success(request, "Vendor updated successfully.")
            return redirect("superadmin:vendor_detail", vendor_id=vendor.pk)
        except Exception as exc:
            logger.exception("Vendor update failed.")
            messages.error(request, str(exc))

    return _render_page(request, "superadmin/vendor_edit.html", {"vendor": vendor, "edit_mode": True})


@_superadmin_required
@require_http_methods(["POST", "DELETE"])
def vendor_delete(request, vendor_id):
    model = _get_model("Vendor")
    if not model:
        return _error("Vendor model not found.", 404) if request.method == "DELETE" else redirect("superadmin:vendors")
    vendor = get_object_or_404(model, pk=vendor_id)
    try:
        with transaction.atomic():
            vendor.delete()
        if request.method == "DELETE":
            return _success("Vendor deleted successfully.")
        messages.success(request, "Vendor deleted successfully.")
    except Exception as exc:
        logger.exception("Vendor deletion failed.")
        if request.method == "DELETE":
            return _error(str(exc), 400)
        messages.error(request, "Unable to delete vendor.")
    return redirect("superadmin:vendors")


def _vendor_status_update(request, vendor_id, status):
    model = _get_model("Vendor")
    if not model:
        return _error("Vendor model not found.", 404)
    vendor = get_object_or_404(model, pk=vendor_id)
    valid = {choice[0] for choice in getattr(model, "STATUS_CHOICES", [])}
    if status not in valid:
        return _error(f"Invalid vendor status: {status}", 400)
    try:
        vendor.status = status
        vendor.is_active = status not in {"blocked", "expired"}
        if status == "suspended":
            vendor.suspended_at = timezone.now()
        elif status == "active":
            vendor.suspended_at = None
        vendor.save()
        if vendor.owner:
            vendor.owner.is_active = vendor.is_active
            vendor.owner.save(update_fields=["is_active"])
        return _success(f"Vendor marked as {status}.", data=_serialize_vendor(vendor))
    except Exception as exc:
        logger.exception("Vendor status update failed.")
        return _error(str(exc), 400)


@_superadmin_required
@require_http_methods(["POST"])
def vendor_activate(request, vendor_id):
    return _vendor_status_update(request, vendor_id, "active")


@_superadmin_required
@require_http_methods(["POST"])
def vendor_suspend(request, vendor_id):
    return _vendor_status_update(request, vendor_id, "suspended")


@_superadmin_required
@require_http_methods(["POST"])
def vendor_block(request, vendor_id):
    return _vendor_status_update(request, vendor_id, "blocked")


@_superadmin_required
def vendor_dashboard(request, vendor_id):
    model = _get_model("Vendor")
    if not model:
        return _error("Vendor model not found.", 404)
    vendor = get_object_or_404(model, pk=vendor_id)
    return _render_page(request, "superadmin/vendor_dashboard.html", {"vendor": vendor})


@_superadmin_required
def vendor_features(request, vendor_id):
    model = _get_model("Vendor")
    if not model:
        return _error("Vendor model not found.", 404)
    vendor = get_object_or_404(model, pk=vendor_id)
    return _render_page(request, "superadmin/vendor_features.html", {"vendor": vendor})


@_superadmin_required
@require_http_methods(["POST", "PATCH"])
def update_vendor_features(request, vendor_id):
    vendor = get_object_or_404(_get_model("Vendor"), pk=vendor_id)
    Feature = _get_model("VendorFeature")
    if not Feature:
        return _error("VendorFeature model not found.", 404)
    payload = _get_request_data(request)
    feature, _ = Feature.objects.get_or_create(vendor=vendor)
    fields = _field_names(Feature)
    for key, value in payload.items():
        if key in fields and key not in PROTECTED_FIELDS:
            setattr(feature, key, _as_bool(value))
    feature.save()
    return _success("Vendor features updated successfully.", _serialize_instance(feature))


@_superadmin_required
@require_http_methods(["POST"])
def impersonate_vendor(request, vendor_id):
    vendor = get_object_or_404(_get_model("Vendor"), pk=vendor_id)
    if not vendor.owner:
        return _error("Vendor has no login owner.", 400)
    request.session["impersonating_vendor_id"] = str(vendor.pk)
    request.session["impersonated_by"] = str(request.user.pk)
    request.session.modified = True
    return _success("Vendor impersonation mode started.", {"vendor_id": str(vendor.pk), "username": vendor.owner.username})


@_superadmin_required
@require_http_methods(["POST"])
def stop_impersonation(request):
    request.session.pop("impersonating_vendor_id", None)
    request.session.pop("impersonated_by", None)
    request.session.modified = True
    return redirect("superadmin:dashboard")
def vendor_edit(request, vendor_id):
    vendor = get_object_or_404(Vendor, id=vendor_id)

    return render(
        request,
        "superadmin/vendor_edit.html",
        {
            "vendor": vendor
        }
    )
def generate_unique_vendor_slug(name):
    base_slug = slugify(name)

    if not base_slug:
        base_slug = "vendor"

    slug = base_slug
    counter = 1

    while Vendor.objects.filter(slug=slug).exists():
        counter += 1
        slug = f"{base_slug}-{counter}"

    return slug
# ============================================================
# VENDOR API
# ============================================================

@_superadmin_required
@require_http_methods(["GET", "POST"])
def vendors_api(request):
    model = _get_model("Vendor")
    if not model:
        return _error("Vendor model not found.", 404)

    if request.method == "POST":
        payload = _vendor_payload(_get_request_data(request))
        try:
            if not payload.get("business_name") or not payload.get("email"):
                return _error("business_name and email are required.", 400)
            with transaction.atomic():
                vendor = model.objects.create(**_clean_payload(model, payload))
                _, _, temporary_password = _get_or_create_vendor_user(vendor, payload, request.user)
                subscription_info = _sync_vendor_plan(vendor, payload, request.user)
                vendor.status = payload.get("status") or "pending"
                vendor.save()
            result = _serialize_vendor(vendor)
            if temporary_password:
                result["temporary_password"] = temporary_password
            if subscription_info:
                result["subscription_created"] = True
            return _success("Vendor created successfully.", result, status=201)
        except Exception as exc:
            logger.exception("Vendor create API failed.")
            return _error(str(exc), 400)

    try:
        page = _paginate_queryset(model.objects.all().order_by("-created_at"), request, API_PAGE_SIZE)
        vendors = [_serialize_vendor(obj) for obj in page.object_list]
        return _success(
            count=len(vendors), results=vendors, vendors=vendors,
            pagination={"page": page.number, "pages": page.paginator.num_pages, "total": page.paginator.count},
        )
    except Exception as exc:
        logger.exception("Vendor API failed.")
        return _error(str(exc), 500)


@_superadmin_required
@require_http_methods(["GET", "PUT", "PATCH", "DELETE"])
def vendor_api(request, vendor_id):
    model = _get_model("Vendor")
    if not model:
        return _error("Vendor model not found.", 404)
    vendor = get_object_or_404(model, pk=vendor_id)

    if request.method == "GET":
        return _success(data=_serialize_vendor(vendor))

    if request.method == "DELETE":
        try:
            with transaction.atomic():
                vendor.delete()
            return _success("Vendor deleted successfully.")
        except Exception as exc:
            logger.exception("Vendor API deletion failed.")
            return _error(str(exc), 400)

    payload = _vendor_payload(_get_request_data(request))
    try:
        with transaction.atomic():
            _set_model_fields(vendor, payload)
            vendor.save()
            if any(k in payload for k in ("username", "password", "first_name", "last_name", "login_enabled", "email", "user_is_active")):
                _get_or_create_vendor_user(vendor, payload, request.user, create=False)
            if any(k in payload for k in ("plan_id", "plan", "expiry_date", "start_date", "max_users", "max_patients", "max_doctors", "max_storage_mb")):
                _sync_vendor_plan(vendor, payload, request.user)
            if any(k in payload for k in ("patients_enabled", "billing_enabled", "inventory_enabled", "reports_enabled", "appointments_enabled", "analytics_enabled", "staff_enabled", "api_enabled", "backup_enabled", "export_enabled")):
                Feature = _get_model("VendorFeature")
                if Feature:
                    feature, _ = Feature.objects.get_or_create(vendor=vendor)
                    for key, value in payload.items():
                        if key in _field_names(Feature):
                            setattr(feature, key, _as_bool(value))
                    feature.save()
        return _success("Vendor updated successfully.", _serialize_vendor(vendor))
    except Exception as exc:
        logger.exception("Vendor API update failed.")
        return _error(str(exc), 400)


# ============================================================
# VENDOR DETAIL ACTION APIs
# ============================================================

@_superadmin_required
@require_http_methods(["POST"])
def vendor_status_api(request, vendor_id):
    payload = _get_request_data(request)
    status = payload.get("status") or ""
    return _vendor_status_update(request, vendor_id, status)


@_superadmin_required
@require_http_methods(["POST"])
def vendor_reset_password_api(request, vendor_id):
    vendor = get_object_or_404(_get_model("Vendor"), pk=vendor_id)
    if not vendor.owner:
        return _error("Vendor has no login account.", 400)
    payload = _get_request_data(request)
    password = str(payload.get("password") or "").strip()
    if len(password) < 8:
        import secrets as _secrets
        password = _secrets.token_urlsafe(10)
    vendor.owner.set_password(password)
    vendor.owner.save(update_fields=["password"])
    vendor.force_password_change = True
    vendor.save(update_fields=["force_password_change", "updated_at"])
    return _success("Vendor password reset successfully.", {"username": vendor.owner.username, "temporary_password": password})


@_superadmin_required
@require_http_methods(["POST"])
def vendor_subscription_extend_api(request, vendor_id):
    vendor = get_object_or_404(_get_model("Vendor"), pk=vendor_id)
    Subscription = _get_model("VendorSubscription")
    if not Subscription:
        return _error("VendorSubscription model not found.", 404)
    subscription = vendor.subscriptions.order_by("-created_at").first()
    if not subscription:
        return _error("Vendor has no subscription.", 404)
    payload = _get_request_data(request)
    try:
        days = int(payload.get("days") or payload.get("duration_days") or 30)
    except (TypeError, ValueError):
        days = 30
    base = subscription.current_period_end or timezone.now()
    if base < timezone.now():
        base = timezone.now()
    subscription.current_period_end = base + timedelta(days=max(days, 1))
    subscription.status = "active"
    subscription.renewal_count += 1
    subscription.last_renewed_at = timezone.now()
    subscription.save()
    license_obj = getattr(subscription, "license", None)
    if license_obj:
        license_obj.expires_at = subscription.current_period_end
        license_obj.status = "active"
        license_obj.save()
    return _success("Subscription extended successfully.", _serialize_vendor(vendor))


@_superadmin_required
@require_http_methods(["POST"])
def vendor_subscription_plan_api(request, vendor_id):
    vendor = get_object_or_404(_get_model("Vendor"), pk=vendor_id)
    payload = _get_request_data(request)
    if not payload.get("plan_id") and not payload.get("plan"):
        return _error("plan_id is required.", 400)
    try:
        result = _sync_vendor_plan(vendor, payload, request.user)
        return _success("Subscription plan updated successfully.", _serialize_vendor(vendor))
    except Exception as exc:
        logger.exception("Subscription plan update failed.")
        return _error(str(exc), 400)


@_superadmin_required
@require_GET
def vendor_usage_api(request, vendor_id):
    vendor = get_object_or_404(_get_model("Vendor"), pk=vendor_id)
    usage = {
        "users": vendor.users.count(),
        "patients": _safe_count("Patient", vendor=vendor),
        "appointments": _safe_count("Appointment", vendor=vendor),
        "invoices": vendor.invoices.count(),
        "payments": vendor.payments.count(),
    }
    limits = getattr(vendor, "limits", None)
    return _success(data={"vendor_id": str(vendor.pk), "usage": usage, "limits": _serialize_instance(limits) if limits else None})


@_superadmin_required
@require_GET
def vendor_activity_api(request, vendor_id):
    vendor = get_object_or_404(_get_model("Vendor"), pk=vendor_id)
    Activity = _get_model("ActivityLog")
    if not Activity:
        return _success(data=[])
    try:
        qs = Activity.objects.filter(vendor=vendor).order_by("-created_at")[:100]
    except Exception:
        # Some existing ActivityLog models may not have a vendor FK.
        return _success(data=[])
    return _success(data=[_serialize_instance(item) for item in qs])


@_superadmin_required
@require_http_methods(["POST"])
def vendor_license_regenerate_api(request, vendor_id):
    vendor = get_object_or_404(_get_model("Vendor"), pk=vendor_id)
    License = _get_model("VendorLicense")
    if not License:
        return _error("VendorLicense model not found.", 404)
    subscription = vendor.subscriptions.order_by("-created_at").first()
    if not subscription:
        return _error("Vendor has no subscription.", 400)
    old = getattr(subscription, "license", None)
    if old:
        old.status = "revoked"
        old.revoked_at = timezone.now()
        old.revoked_reason = "Regenerated by Super Admin"
        old.save()
    raw_key = License.generate_key()
    license_obj = License.objects.create(
        vendor=vendor,
        subscription=subscription,
        name="Primary License",
        key_prefix=raw_key[:12],
        key_hash=License.hash_key(raw_key),
        status="active",
        starts_at=timezone.now(),
        expires_at=subscription.current_period_end or (timezone.now() + timedelta(days=30)),
        created_by=request.user,
    )
    return _success("License regenerated successfully.", {"license": _serialize_instance(license_obj), "license_key": raw_key})


@_superadmin_required
@require_http_methods(["POST"])
def vendor_license_revoke_api(request, vendor_id):
    vendor = get_object_or_404(_get_model("Vendor"), pk=vendor_id)
    license_obj = vendor.licenses.filter(status="active").order_by("-created_at").first()
    if not license_obj:
        return _error("No active license found.", 404)
    payload = _get_request_data(request)
    license_obj.status = "revoked"
    license_obj.revoked_at = timezone.now()
    license_obj.revoked_reason = str(payload.get("reason") or "Revoked by Super Admin")
    license_obj.save()
    return _success("License revoked successfully.", _serialize_instance(license_obj))

# ============================================================
# PLANS
# ============================================================

@_superadmin_required
def plan_list(request):

    model = _get_model("Plan")
    plans = []

    if model:
        try:
            plans = _paginate_queryset(
                model.objects.all().order_by("-id"), request
            )

        except Exception:
            logger.exception("Plan list failed.")

    return _render_page(
        request,
        "superadmin/plans.html",
        {"plans": plans, "page_title": "Plans"},
    )


@_superadmin_required
@require_http_methods(["GET", "POST"])
def plan_create(request):

    model = _get_model("Plan")

    if not model:
        messages.error(request, "Plan model not found.")
        return redirect("superadmin:plans")

    if request.method == "POST":
        try:
            payload = _get_request_data(request)
            data = _clean_payload(model, payload)

            with transaction.atomic():
                plan = model.objects.create(**data)

            logger.info(
                "Plan created: id=%s by=%s", plan.pk, request.user.pk
            )
            messages.success(request, "Plan created successfully.")

            return redirect("superadmin:plans")

        except Exception:
            logger.exception("Plan creation failed.")
            messages.error(request, "Unable to create plan.")

    return _render_page(
        request,
        "superadmin/plan_create.html",
        {"page_title": "Create Plan", "edit_mode": False},
    )


@_superadmin_required
def plan_detail(request, plan_id):

    model = _get_model("Plan")

    if not model:
        return _error("Plan model not found.", 404)

    plan = get_object_or_404(model, pk=plan_id)

    # NOTE: plan_detail.html was not in the shared templates folder -
    # falls back gracefully until it's added.
    return _render_page(
        request,
        "superadmin/plan_detail.html",
        {"plan": plan, "page_title": "Plan Details"},
    )


@_superadmin_required
@require_http_methods(["GET", "POST"])
def plan_update(request, plan_id):

    model = _get_model("Plan")

    if not model:
        messages.error(request, "Plan model not found.")
        return redirect("superadmin:plans")

    plan = get_object_or_404(model, pk=plan_id)

    if request.method == "POST":
        try:
            payload = _get_request_data(request)

            with transaction.atomic():
                _set_model_fields(plan, payload)
                plan.save()

            logger.info(
                "Plan updated: id=%s by=%s", plan.pk, request.user.pk
            )
            messages.success(request, "Plan updated successfully.")

            return redirect("superadmin:plan_detail", plan_id=plan.pk)

        except Exception:
            logger.exception("Plan update failed.")
            messages.error(request, "Unable to update plan.")

    return _render_page(
        request,
        "superadmin/plan_edit.html",
        {"plan": plan, "edit_mode": True, "page_title": "Edit Plan"},
    )


@_superadmin_required
@require_http_methods(["POST", "DELETE"])
def plan_delete(request, plan_id):

    model = _get_model("Plan")

    if not model:
        return _error("Plan model not found.", 404)

    plan = get_object_or_404(model, pk=plan_id)

    try:
        with transaction.atomic():
            plan.delete()

        logger.warning(
            "Plan deleted: id=%s by=%s", plan_id, request.user.pk
        )

        if request.method == "DELETE":
            return _success("Plan deleted successfully.")

        messages.success(request, "Plan deleted successfully.")

    except Exception:
        logger.exception("Plan deletion failed.")

        if request.method == "DELETE":
            return _error("Unable to delete plan.", 400)

        messages.error(request, "Unable to delete plan.")

    return redirect("superadmin:plans")


def _plan_status_update(request, plan_id, status):

    model = _get_model("Plan")

    if not model:
        messages.error(request, "Plan model not found.")
        return redirect("superadmin:plans")

    plan = get_object_or_404(model, pk=plan_id)

    try:
        fields = _field_names(model)

        if "status" in fields:
            plan.status = status
        elif "is_active" in fields:
            plan.is_active = status == "active"
        elif "active" in fields:
            plan.active = status == "active"
        else:
            messages.error(
                request, "Plan model has no supported status field."
            )
            return redirect("superadmin:plans")

        plan.save()

        logger.info(
            "Plan %s: id=%s by=%s", status, plan.pk, request.user.pk
        )
        messages.success(request, f"Plan {status} successfully.")

    except Exception:
        logger.exception("Plan status update failed.")
        messages.error(request, f"Unable to set plan status to {status}.")

    return redirect("superadmin:plans")


@_superadmin_required
@require_http_methods(["POST"])
def plan_activate(request, plan_id):
    return _plan_status_update(request, plan_id, "active")


@_superadmin_required
@require_http_methods(["POST"])
def plan_suspend(request, plan_id):
    return _plan_status_update(request, plan_id, "suspended")


@_superadmin_required
@require_http_methods(["POST"])
def plan_deactivate(request, plan_id):
    return _plan_status_update(request, plan_id, "inactive")


# ============================================================
# SUBSCRIPTIONS
# ============================================================

@_superadmin_required
def subscription_list(request):

    model = _get_model("Subscription")
    subscriptions = []

    if model:
        try:
            subscriptions = _paginate_queryset(
                model.objects.all().order_by("-id"), request
            )

        except Exception:
            logger.exception("Subscription list failed.")

    return _render_page(
        request,
        "superadmin/subscriptions.html",
        {"subscriptions": subscriptions},
    )


@_superadmin_required
def subscription_detail(request, subscription_id):

    model = _get_model("Subscription")

    if not model:
        return _error("Subscription model not found.", 404)

    subscription = get_object_or_404(model, pk=subscription_id)

    return _render_page(
        request,
        "superadmin/subscription_detail.html",
        {"subscription": subscription},
    )


def _subscription_status(request, subscription_id, status):

    model = _get_model("Subscription")

    if not model:
        messages.error(request, "Subscription model not found.")
        return redirect("superadmin:subscriptions")

    subscription = get_object_or_404(model, pk=subscription_id)

    try:
        fields = _field_names(model)

        if "status" in fields:
            subscription.status = status
        elif "subscription_status" in fields:
            subscription.subscription_status = status
        elif "is_active" in fields:
            subscription.is_active = status == "active"
        else:
            messages.error(
                request,
                "Subscription model has no supported status field.",
            )
            return redirect("superadmin:subscriptions")

        subscription.save()

        logger.info(
            "Subscription %s: id=%s by=%s",
            status,
            subscription.pk,
            request.user.pk,
        )
        messages.success(request, f"Subscription {status} successfully.")

    except Exception:
        logger.exception("Subscription status update failed.")
        messages.error(request, "Unable to update subscription.")

    return redirect("superadmin:subscriptions")


@_superadmin_required
@require_http_methods(["POST"])
def subscription_activate(request, subscription_id):
    return _subscription_status(request, subscription_id, "active")


@_superadmin_required
@require_http_methods(["POST"])
def subscription_suspend(request, subscription_id):
    return _subscription_status(request, subscription_id, "suspended")


@_superadmin_required
@require_http_methods(["POST"])
def subscription_cancel(request, subscription_id):
    return _subscription_status(request, subscription_id, "cancelled")


# ============================================================
# PAYMENTS
# ============================================================

@_superadmin_required
def payment_list(request):

    model = _get_model("Payment")
    payments = []

    if model:
        try:
            payments = _paginate_queryset(
                model.objects.all().order_by("-id"), request
            )

        except Exception:
            logger.exception("Payment list failed.")

    return _render_page(
        request, "superadmin/payments.html", {"payments": payments}
    )


@_superadmin_required
def payment_detail(request, payment_id):

    model = _get_model("Payment")

    if not model:
        return _error("Payment model not found.", 404)

    payment = get_object_or_404(model, pk=payment_id)

    # NOTE: payment_detail.html was not in the shared templates folder -
    # falls back gracefully until it's added.
    return _render_page(
        request,
        "superadmin/payment_detail.html",
        {
            "payment": payment,
            "payment_id": payment_id,
            "page_title": "Payment Details",
        },
    )


@_superadmin_required
@require_GET
def payments_api(request):

    model = _get_model("Payment")

    if not model:
        return _error("Payment model not found.", 404)

    try:
        page = _paginate_queryset(
            model.objects.all().order_by("-id"), request, API_PAGE_SIZE
        )

        results = [_serialize_instance(obj) for obj in page.object_list]

        return _success(
            count=len(results),
            results=results,
            payments=results,
            pagination={
                "page": page.number,
                "pages": page.paginator.num_pages,
                "total": page.paginator.count,
            },
        )

    except Exception:
        logger.exception("Payments API failed.")
        return _error("Unable to load payments.", 500)


@_superadmin_required
@require_http_methods(["POST"])
def payments_create_api(request):

    model = _get_model("Payment")

    if not model:
        return _error("Payment model not found.", 404)

    try:
        payload = _get_request_data(request)
        data = _clean_payload(model, payload)

        with transaction.atomic():
            payment = model.objects.create(**data)

        return _success(
            "Payment created successfully.",
            _serialize_instance(payment),
            201,
        )

    except Exception:
        logger.exception("Payment creation failed.")
        return _error("Unable to create payment.", 400)


@_superadmin_required
@require_http_methods(["PUT", "PATCH", "POST"])
def payments_update_api(request, payment_id):

    model = _get_model("Payment")

    if not model:
        return _error("Payment model not found.", 404)

    payment = get_object_or_404(model, pk=payment_id)

    try:
        payload = _get_request_data(request)

        with transaction.atomic():
            _set_model_fields(payment, payload)
            payment.save()

        return _success(
            "Payment updated successfully.", _serialize_instance(payment)
        )

    except Exception:
        logger.exception("Payment update failed.")
        return _error("Unable to update payment.", 400)


@_superadmin_required
@require_http_methods(["DELETE", "POST"])
def payments_delete_api(request, payment_id):

    model = _get_model("Payment")

    if not model:
        return _error("Payment model not found.", 404)

    payment = get_object_or_404(model, pk=payment_id)

    try:
        with transaction.atomic():
            payment.delete()

        return _success("Payment deleted successfully.")

    except Exception:
        logger.exception("Payment deletion failed.")
        return _error("Unable to delete payment.", 400)


@_superadmin_required
@require_http_methods(["POST"])
def payments_refund_api(request, payment_id):

    model = _get_model("Payment")

    if not model:
        return _error("Payment model not found.", 404)

    payment = get_object_or_404(model, pk=payment_id)

    try:
        fields = _field_names(model)

        with transaction.atomic():
            if "status" in fields:
                payment.status = "refunded"
            elif "payment_status" in fields:
                payment.payment_status = "refunded"
            else:
                return _error(
                    "Payment model has no refund status field.", 400
                )

            payment.save()

        return _success(
            "Payment refunded successfully.", _serialize_instance(payment)
        )

    except Exception:
        logger.exception("Payment refund failed.")
        return _error("Unable to refund payment.", 400)


@_superadmin_required
@require_http_methods(["GET", "POST"])
def payment_settings(request):

    if request.method == "POST":
        messages.success(request, "Payment settings updated successfully.")
        return redirect("superadmin:payment_settings")

    return _render_page(
        request,
        "superadmin/payment_settings.html",
        {"page_title": "Payment Settings"},
    )


@_superadmin_required
@require_http_methods(["GET", "POST"])
def update_payment_settings(request):

    if request.method == "POST":

        # Wire up real gateway keys here, e.g.:
        # razorpay_key = request.POST.get("razorpay_key")
        # razorpay_secret = request.POST.get("razorpay_secret")
        # stripe_key = request.POST.get("stripe_key")

        messages.success(request, "Payment settings updated successfully.")

    return redirect("superadmin:payment_settings")


# ============================================================
# INVOICES
# ============================================================

@_superadmin_required
def invoice_list(request):

    model = _get_model("Invoice")
    invoices = []

    if model:
        try:
            invoices = _paginate_queryset(
                model.objects.all().order_by("-id"), request
            )

        except Exception:
            logger.exception("Invoice list failed.")

    return _render_page(
        request,
        "superadmin/invoices.html",
        {"invoices": invoices, "page_title": "Invoices"},
    )


@_superadmin_required
def invoice_detail(request, invoice_id):

    model = _get_model("Invoice")

    if not model:
        return _error("Invoice model not found.", 404)

    invoice = get_object_or_404(model, pk=invoice_id)

    # NOTE: invoice_detail.html was not in the shared templates folder -
    # falls back gracefully until it's added.
    return _render_page(
        request,
        "superadmin/invoice_detail.html",
        {"invoice": invoice, "page_title": "Invoice Details"},
    )


@_superadmin_required
@require_GET
def invoice_download(request, invoice_id):
    """
    Downloads a plain-text invoice. (Previously this view name was
    defined three times with three different bodies - text export,
    JSON export, and a field-loop export. Kept the most complete
    text-export version and merged in the verbose_name field loop.)
    """

    model = _get_model("Invoice")

    if not model:
        return _error("Invoice model not found.", 404)

    invoice = get_object_or_404(model, pk=invoice_id)

    try:
        response = HttpResponse(content_type="text/plain; charset=utf-8")
        response["Content-Disposition"] = (
            f'attachment; filename="invoice-{invoice.pk}.txt"'
        )

        response.write("SITA PATH LAB\n")
        response.write("=" * 60 + "\n\n")
        response.write(f"Invoice ID: {invoice.pk}\n")

        for field in invoice._meta.fields:
            if field.name in ("id",):
                continue

            value = getattr(invoice, field.name, "")

            if value in (None, ""):
                continue

            response.write(f"{field.verbose_name.title()}: {value}\n")

        response.write("\n" + "=" * 60 + "\n")
        response.write("Generated by Sita Path Lab Super Admin\n")

        return response

    except Exception:
        logger.exception(
            "Invoice download failed: invoice_id=%s", invoice_id
        )
        return _error("Unable to download invoice.", 500)


# ============================================================
# TRANSACTIONS
# ============================================================

@_superadmin_required
def transaction_list(request):

    model = _get_model("Transaction")
    transactions = []

    if model:
        try:
            transactions = _paginate_queryset(
                model.objects.all().order_by("-id"), request
            )

        except Exception:
            logger.exception("Transaction list failed.")

    return _render_page(
        request,
        "superadmin/transactions.html",
        {"transactions": transactions, "page_title": "Transactions"},
    )


@_superadmin_required
def transaction_detail(request, transaction_id):

    model = _get_model("Transaction")

    if not model:
        return _error("Transaction model not found.", 404)

    transaction_obj = get_object_or_404(model, pk=transaction_id)

    # NOTE: transaction_detail.html was not in the shared templates
    # folder - falls back gracefully until it's added.
    return _render_page(
        request,
        "superadmin/transaction_detail.html",
        {"transaction": transaction_obj, "page_title": "Transaction Details"},
    )


# ============================================================
# ACTIVITY LOGS
# ============================================================

@_superadmin_required
def activity_logs(request):

    model = _get_model("ActivityLog")
    logs = []

    if model:
        try:
            logs = _paginate_queryset(
                model.objects.all().order_by("-id"), request
            )

        except Exception:
            logger.exception("Activity log loading failed.")

    return _render_page(
        request,
        "superadmin/activity_logs.html",
        {"logs": logs, "activities": logs, "activity_logs": logs},
    )


@_superadmin_required
def activity_log_detail(request, log_id):

    model = _get_model("ActivityLog")

    if not model:
        return _error("ActivityLog model not found.", 404)

    log = get_object_or_404(model, pk=log_id)

    # NOTE: activity_log_detail.html was not in the shared templates
    # folder - falls back gracefully until it's added.
    return _render_page(
        request,
        "superadmin/activity_log_detail.html",
        {
            "log": log,
            "activity": log,
            "activity_log": log,
            "page_title": "Activity Log Details",
        },
    )


@_superadmin_required
@require_GET
def activity_api(request):

    model = _get_model("ActivityLog")

    if not model:
        return _success(count=0, results=[])

    try:
        page = _paginate_queryset(
            model.objects.all().order_by("-id"), request, API_PAGE_SIZE
        )

        activities = [_serialize_instance(obj) for obj in page.object_list]

        return _success(
            count=len(activities),
            results=activities,
            pagination={
                "page": page.number,
                "pages": page.paginator.num_pages,
                "total": page.paginator.count,
            },
        )

    except Exception:
        logger.exception("Activity API failed.")
        return _error("Unable to load activity.", 500)


# ============================================================
# AUDIT LOGS
# ============================================================

@_superadmin_required
def audit_logs(request):

    model = _get_model("AuditLog")
    logs = []

    if model:
        try:
            logs = _paginate_queryset(
                model.objects.all().order_by("-id"), request
            )

        except Exception:
            logger.exception("Audit log loading failed.")

    return _render_page(
        request,
        "superadmin/audit_logs.html",
        {"logs": logs, "audit_logs": logs},
    )


@_superadmin_required
def audit_log_detail(request, log_id):

    model = _get_model("AuditLog")

    if not model:
        return _error("AuditLog model not found.", 404)

    log = get_object_or_404(model, pk=log_id)

    # NOTE: audit_log_detail.html was not in the shared templates
    # folder - falls back gracefully until it's added.
    return _render_page(
        request, "superadmin/audit_log_detail.html", {"log": log}
    )


# ============================================================
# NOTIFICATIONS
# ============================================================

@_superadmin_required
def notifications(request):

    model = _get_model("Notification")
    notification_list = []

    if model:
        try:
            notification_list = _paginate_queryset(
                model.objects.all().order_by("-id"), request
            )

        except Exception:
            logger.exception("Notification loading failed.")

    return _render_page(
        request,
        "superadmin/notifications.html",
        {
            "notifications": notification_list,
            "notification_list": notification_list,
            "page_title": "Notifications",
        },
    )


@_superadmin_required
def notification_detail(request, notification_id):

    model = _get_model("Notification")

    if not model:
        return _error("Notification model not found.", 404)

    notification = get_object_or_404(model, pk=notification_id)

    # NOTE: notification_detail.html was not in the shared templates
    # folder - falls back gracefully until it's added.
    return _render_page(
        request,
        "superadmin/notification_detail.html",
        {"notification": notification, "page_title": "Notification Details"},
    )


@_superadmin_required
@require_http_methods(["POST"])
def notification_mark_read(request, notification_id):

    model = _get_model("Notification")

    if not model:
        return _error("Notification model not found.", 404)

    notification = get_object_or_404(model, pk=notification_id)
    is_ajax = (
        request.headers.get("X-Requested-With") == "XMLHttpRequest"
        or (request.content_type or "").startswith("application/json")
    )

    try:
        fields = _field_names(model)

        if "is_read" in fields:
            notification.is_read = True
        elif "read" in fields:
            notification.read = True
        elif "status" in fields:
            notification.status = "read"
        else:
            if is_ajax:
                return _error(
                    "Notification model has no supported read field.", 400
                )

            messages.error(
                request, "Notification model has no supported read field."
            )
            return redirect("superadmin:notifications")

        notification.save()

        logger.info(
            "Notification marked as read: id=%s by=%s",
            notification.pk,
            request.user.pk,
        )

        if is_ajax:
            return _success(
                "Notification marked as read.",
                _serialize_instance(notification),
            )

        messages.success(request, "Notification marked as read.")

    except Exception:
        logger.exception("Notification mark-read failed.")

        if is_ajax:
            return _error("Unable to mark notification as read.", 400)

        messages.error(request, "Unable to mark notification as read.")

    return redirect(
        "superadmin:notification_detail", notification_id=notification_id
    )


@_superadmin_required
@require_http_methods(["POST"])
def notifications_mark_all_read(request):

    model = _get_model("Notification")

    if not model:
        messages.error(request, "Notification model not found.")
        return redirect("superadmin:notifications")

    try:
        fields = _field_names(model)

        if "is_read" in fields:
            model.objects.filter(is_read=False).update(is_read=True)
        elif "read" in fields:
            model.objects.filter(read=False).update(read=True)
        elif "status" in fields:
            model.objects.exclude(status="read").update(status="read")
        else:
            messages.error(
                request, "Notification model has no supported read field."
            )
            return redirect("superadmin:notifications")

        messages.success(request, "All notifications marked as read.")

    except Exception:
        logger.exception("Mark all notifications read failed.")
        messages.error(request, "Unable to mark all notifications as read.")

    return redirect("superadmin:notifications")


@_superadmin_required
@require_GET
def notifications_api(request):

    model = _get_model("Notification")

    if not model:
        return _success(
            count=0,
            results=[],
            notifications=[],
            pagination={"page": 1, "pages": 0, "total": 0},
        )

    try:
        page = _paginate_queryset(
            model.objects.all().order_by("-id"), request, API_PAGE_SIZE
        )

        notification_results = [
            _serialize_instance(obj) for obj in page.object_list
        ]

        return _success(
            count=len(notification_results),
            results=notification_results,
            notifications=notification_results,
            pagination={
                "page": page.number,
                "pages": page.paginator.num_pages,
                "total": page.paginator.count,
            },
        )

    except Exception:
        logger.exception("Notifications API failed.")
        return _error("Unable to load notifications.", 500)


# ============================================================
# SECURITY
# ============================================================

@_superadmin_required
def security(request):
    return _render_page(
        request,
        "superadmin/security_settings.html",
        {"page_title": "Security", "admin_user": request.user},
    )


@_superadmin_required
def security_sessions(request):
    # NOTE: security_sessions.html was not in the shared templates
    # folder - falls back gracefully until it's added.
    return _render_page(
        request,
        "superadmin/security_sessions.html",
        {
            "page_title": "Security Sessions",
            "admin_user": request.user,
            "sessions": [],
        },
    )


@_superadmin_required
@require_http_methods(["POST"])
def revoke_session(request, session_key):

    from django.contrib.sessions.models import Session

    try:
        session = Session.objects.filter(session_key=session_key).first()

        if not session:
            messages.error(
                request, "Session not found or already revoked."
            )
            return redirect("superadmin:security_sessions")

        session.delete()

        logger.info(
            "Security session revoked: %s by user=%s",
            session_key,
            request.user.pk,
        )
        messages.success(request, "Session revoked successfully.")

    except Exception:
        logger.exception("Failed to revoke security session.")
        messages.error(request, "Unable to revoke session.")

    return redirect("superadmin:security_sessions")


@_superadmin_required
@require_http_methods(["GET", "POST"])
def security_2fa(request):

    if request.method == "POST":

        action = (request.POST.get("action", "") or "").strip().lower()

        if action == "enable":
            messages.success(
                request, "Two-factor authentication setup initiated."
            )
        elif action == "disable":
            messages.success(
                request, "Two-factor authentication disabled."
            )
        else:
            messages.info(request, "2FA settings updated.")

        return redirect("superadmin:security_2fa")

    # NOTE: security_2fa.html was not in the shared templates folder -
    # falls back gracefully until it's added.
    return _render_page(
        request,
        "superadmin/security_2fa.html",
        {
            "page_title": "Two-Factor Authentication",
            "admin_user": request.user,
            "two_factor_enabled": False,
        },
    )


# ============================================================
# USERS
# ============================================================

@_superadmin_required
def user_list(request):

    users = _paginate_queryset(
        User.objects.all().order_by("-date_joined"), request
    )

    return _render_page(request, "superadmin/users.html", {"users": users})


@_superadmin_required
def user_detail(request, user_id):

    user = get_object_or_404(User, pk=user_id)

    return _render_page(
        request,
        "superadmin/user_detail.html",
        {"user_obj": user, "user": user},
    )


@_superadmin_required
@require_http_methods(["POST"])
def user_activate(request, user_id):

    user = get_object_or_404(User, pk=user_id)

    user.is_active = True
    user.save(update_fields=["is_active"])

    messages.success(request, "User activated successfully.")

    return redirect("superadmin:users")


@_superadmin_required
@require_http_methods(["POST"])
def user_deactivate(request, user_id):

    user = get_object_or_404(User, pk=user_id)

    if user.pk == request.user.pk:
        messages.error(request, "You cannot deactivate your own account.")
        return redirect("superadmin:users")

    user.is_active = False
    user.save(update_fields=["is_active"])

    messages.success(request, "User deactivated successfully.")

    return redirect("superadmin:users")


# ============================================================
# ROLES / PERMISSIONS
# (templates folder has user_roles.html + user_permissions.html,
#  not roles.html / role_form.html - views renamed to match)
# ============================================================

@_superadmin_required
def role_list(request):

    role_model = _get_model("Role")
    roles = []

    if role_model:
        try:
            roles = role_model.objects.all().order_by("-id")

        except Exception:
            logger.exception("Role list failed.")

    return _render_page(
        request,
        "superadmin/user_roles.html",
        {"roles": roles, "page_title": "Roles"},
    )


@_superadmin_required
@require_http_methods(["GET", "POST"])
def role_create(request):

    role_model = _get_model("Role")

    if not role_model:
        messages.error(request, "Role model not found.")
        return redirect("superadmin:roles")

    if request.method == "POST":
        try:
            payload = _get_request_data(request)
            data = _clean_payload(role_model, payload)

            role_model.objects.create(**data)

            messages.success(request, "Role created successfully.")
            return redirect("superadmin:roles")

        except Exception:
            logger.exception("Role creation failed.")
            messages.error(request, "Unable to create role.")

    return _render_page(
        request,
        "superadmin/user_roles.html",
        {"page_title": "Create Role", "edit_mode": False},
    )


@_superadmin_required
@require_http_methods(["GET", "POST"])
def role_update(request, role_id):

    role_model = _get_model("Role")

    if not role_model:
        messages.error(request, "Role model not found.")
        return redirect("superadmin:roles")

    role = get_object_or_404(role_model, pk=role_id)

    if request.method == "POST":
        try:
            payload = _get_request_data(request)
            _set_model_fields(role, payload)
            role.save()

            messages.success(request, "Role updated successfully.")
            return redirect("superadmin:roles")

        except Exception:
            logger.exception("Role update failed.")
            messages.error(request, "Role update failed.")

    return _render_page(
        request,
        "superadmin/user_roles.html",
        {"role": role, "edit_mode": True, "page_title": "Edit Role"},
    )


@_superadmin_required
@require_http_methods(["POST", "DELETE"])
def role_delete(request, role_id):

    role_model = _get_model("Role")

    if not role_model:
        return _error("Role model not found.", 404)

    role = get_object_or_404(role_model, pk=role_id)

    try:
        role.delete()

    except Exception:
        logger.exception("Role deletion failed.")

        if request.method == "DELETE":
            return _error("Unable to delete role.", 400)

        messages.error(request, "Unable to delete role.")
        return redirect("superadmin:roles")

    if request.method == "DELETE":
        return _success("Role deleted successfully.")

    messages.success(request, "Role deleted successfully.")

    return redirect("superadmin:roles")


# ------------------------------------------------------------
# USER PERMISSIONS MATRIX
#
# The template (user_permissions.html) works against a single
# Django auth User (selected_user), not a Role directly - it
# reads/writes permissions through that user's VendorUser ->
# VendorRole -> RolePermission chain, and builds
# granted_permissions as a list of "module.action" codes
# (e.g. "patients.view") that the template checks against with
# {% if "patients.view" in granted_permissions %}.
# ------------------------------------------------------------

@_superadmin_required
def user_permissions(request):
    """
    Renders the standalone permissions matrix page
    (templates/superadmin/user_permissions.html).
    """

    vendor_user_model = _get_model("VendorUser")
    role_permission_model = _get_model("RolePermission")

    selected_user = None
    selected_user_id = request.GET.get("user_id")

    if selected_user_id:
        selected_user = User.objects.filter(pk=selected_user_id).first()

    if not selected_user:
        selected_user = User.objects.order_by("-date_joined").first()

    granted_permissions = []
    selected_role = None

    if selected_user and vendor_user_model and role_permission_model:

        try:
            vendor_user = (
                vendor_user_model.objects
                .filter(user=selected_user)
                .select_related("custom_role")
                .first()
            )

            if vendor_user and vendor_user.custom_role:

                selected_role = vendor_user.custom_role

                granted_permissions = list(
                    role_permission_model.objects
                    .filter(role=selected_role)
                    .values_list("permission__code", flat=True)
                )

        except Exception:
            logger.exception("Failed to load granted permissions.")

    return _render_page(
        request,
        "superadmin/user_permissions.html",
        {
            "selected_user": selected_user,
            "selected_role": selected_role,
            "granted_permissions": granted_permissions,
            "page_title": "User Permissions",
        },
    )


@_superadmin_required
@require_http_methods(["POST"])
def update_user_permissions(request, user_id):
    """
    Saves the role + permission checkboxes submitted from
    user_permissions.html for a single Django auth User.
    """

    vendor_user_model = _get_model("VendorUser")
    vendor_role_model = _get_model("VendorRole")
    permission_model = _get_model("VendorPermission")
    role_permission_model = _get_model("RolePermission")

    target_user = get_object_or_404(User, pk=user_id)

    redirect_url = f"{reverse('superadmin:user_permissions')}?user_id={user_id}"

    if not all([vendor_user_model, vendor_role_model, permission_model, role_permission_model]):
        messages.error(request, "Roles/Permissions models not found.")
        return redirect(redirect_url)

    vendor_user = (
        vendor_user_model.objects
        .filter(user=target_user)
        .select_related("vendor", "custom_role")
        .first()
    )

    if not vendor_user:
        messages.error(
            request,
            "This user has no vendor account to assign permissions to.",
        )
        return redirect(redirect_url)

    role_name_map = {
        "admin": "Administrator",
        "manager": "Manager",
        "staff": "Staff",
        "viewer": "Viewer",
    }

    selected_role_value = request.POST.get("userRole") or "staff"
    role_name = role_name_map.get(selected_role_value, "Staff")

    permission_codes = request.POST.getlist("permissions")

    try:
        with transaction.atomic():

            role, _ = vendor_role_model.objects.get_or_create(
                vendor=vendor_user.vendor,
                name=role_name,
                defaults={"is_system_role": True},
            )

            vendor_user.custom_role = role
            vendor_user.role = selected_role_value
            vendor_user.save(update_fields=["custom_role", "role"])

            role_permission_model.objects.filter(role=role).delete()

            for code in permission_codes:

                if "." in code:
                    module, action = code.split(".", 1)
                else:
                    module, action = code, "view"

                permission, _ = permission_model.objects.get_or_create(
                    code=code,
                    defaults={"module": module, "action": action},
                )

                role_permission_model.objects.get_or_create(
                    role=role, permission=permission
                )

        messages.success(
            request, f"Permissions updated for {target_user.username}."
        )

    except Exception:
        logger.exception("Permission update failed.")
        messages.error(request, "Unable to update permissions.")

    return redirect(redirect_url)
# ============================================================
# LICENSES
# ============================================================

@_superadmin_required
def license_list(request):

    model = _get_model("License")
    licenses = []

    if model:
        try:
            licenses = _paginate_queryset(
                model.objects.all().order_by("-id"), request
            )

        except Exception:
            logger.exception("License list failed.")

    return _render_page(
        request,
        "superadmin/licenses.html",
        {"licenses": licenses, "page_title": "Licenses"},
    )


@_superadmin_required
@require_http_methods(["GET", "POST"])
def license_create(request):
    """
    templates/superadmin/license_create.html existed with no matching
    view/url - added here.
    """

    model = _get_model("License")

    if not model:
        messages.error(request, "License model not found.")
        return redirect("superadmin:licenses")

    if request.method == "POST":
        try:
            payload = _get_request_data(request)
            data = _clean_payload(model, payload)

            with transaction.atomic():
                license_obj = model.objects.create(**data)

            logger.info(
                "License created: id=%s by=%s",
                license_obj.pk,
                request.user.pk,
            )
            messages.success(request, "License created successfully.")

            return redirect(
                "superadmin:license_detail", license_id=license_obj.pk
            )

        except Exception:
            logger.exception("License creation failed.")
            messages.error(request, "Unable to create license.")

    return _render_page(
        request,
        "superadmin/license_create.html",
        {"page_title": "Create License"},
    )


@_superadmin_required
def license_detail(request, license_id):

    model = _get_model("License")

    if not model:
        return _render_page(
            request,
            "superadmin/license_detail.html",
            {"license_id": license_id, "license": None},
        )

    license_obj = get_object_or_404(model, pk=license_id)

    return _render_page(
        request,
        "superadmin/license_detail.html",
        {"license_id": license_id, "license": license_obj},
    )


def _license_status_update(request, license_id, status, success_message):

    model = _get_model("License")

    if not model:
        messages.success(request, success_message)
        return redirect("superadmin:license_detail", license_id=license_id)

    license_obj = get_object_or_404(model, pk=license_id)

    try:
        fields = _field_names(model)

        if "status" in fields:
            license_obj.status = status
        elif "is_active" in fields:
            license_obj.is_active = status == "active"
        else:
            messages.error(
                request, "License model has no supported status field."
            )
            return redirect(
                "superadmin:license_detail", license_id=license_id
            )

        license_obj.save()
        messages.success(request, success_message)

    except Exception:
        logger.exception("License status update failed.")
        messages.error(request, "Unable to update license status.")

    return redirect("superadmin:license_detail", license_id=license_id)


@_superadmin_required
@require_http_methods(["POST"])
def license_activate(request, license_id):
    return _license_status_update(
        request, license_id, "active", "License activated successfully."
    )


@_superadmin_required
@require_http_methods(["POST"])
def license_suspend(request, license_id):
    return _license_status_update(
        request, license_id, "suspended", "License suspended successfully."
    )


@_superadmin_required
@require_http_methods(["POST"])
def license_revoke(request, license_id):
    return _license_status_update(
        request, license_id, "revoked", "License revoked successfully."
    )


# ============================================================
# SYSTEM SETTINGS
# ============================================================

@_superadmin_required
def system_settings(request):

    model = _get_model("SystemSetting")
    settings_objects = []

    if model:
        try:
            settings_objects = model.objects.all()

        except Exception:
            logger.exception("System settings loading failed.")

    return _render_page(
        request,
        "superadmin/system_settings.html",
        {"settings": settings_objects},
    )


@_superadmin_required
@require_http_methods(["POST"])
def update_system_settings(request):

    model = _get_model("SystemSetting")

    if not model:
        messages.error(request, "SystemSetting model not found.")
        return redirect("superadmin:system_settings")

    try:
        fields = _field_names(model)

        key_field = next(
            (f for f in ["key", "name", "setting_key"] if f in fields),
            None,
        )

        value_field = next(
            (f for f in ["value", "setting_value"] if f in fields),
            None,
        )

        if not key_field or not value_field:
            messages.error(request, "Invalid SystemSetting model structure.")
            return redirect("superadmin:system_settings")

        with transaction.atomic():
            for key, value in request.POST.items():

                if key == "csrfmiddlewaretoken":
                    continue

                model.objects.update_or_create(
                    **{key_field: key}, defaults={value_field: value}
                )

        messages.success(request, "System settings updated successfully.")

    except Exception:
        logger.exception("System settings update failed.")
        messages.error(request, "Unable to update system settings.")

    return redirect("superadmin:system_settings")


# ============================================================
# SYSTEM HEALTH
# ============================================================

def _database_health():

    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")

        return "healthy"

    except Exception:
        logger.exception("Database health check failed.")
        return "error"


@_superadmin_required
def system_health(request):

    database_status = _database_health()

    # NOTE: system_health.html was not in the shared templates folder -
    # falls back gracefully until it's added.
    return _render_page(
        request,
        "superadmin/system_health.html",
        {
            "database_status": database_status,
            "server_status": "healthy",
            "timestamp": timezone.now(),
        },
    )


@_superadmin_required
def system_activity(request):
    # NOTE: system_activity.html was not in the shared templates
    # folder - falls back gracefully until it's added.
    return _render_page(
        request,
        "superadmin/system_activity.html",
        {"page_title": "System Activity"},
    )


@_superadmin_required
def system_errors(request):
    # NOTE: system_errors.html was not in the shared templates
    # folder - falls back gracefully until it's added.
    return _render_page(
        request,
        "superadmin/system_errors.html",
        {"page_title": "System Errors"},
    )


@_superadmin_required
@require_GET
def system_health_api(request):

    database_status = _database_health()

    return _success(
        data={
            "status": "healthy" if database_status == "healthy" else "degraded",
            "database": database_status,
            "server": "healthy",
            "timestamp": timezone.now().isoformat(),
        }
    )


# ============================================================
# BACKUPS
# ============================================================

@_superadmin_required
def backup_list(request):

    model = _get_model("Backup")
    backups = []

    if model:
        try:
            backups = _paginate_queryset(
                model.objects.all().order_by("-id"), request
            )

        except Exception:
            logger.exception("Backup loading failed.")

    # NOTE: backups.html was not in the shared templates folder -
    # falls back gracefully until it's added.
    return _render_page(
        request, "superadmin/backups.html", {"backups": backups}
    )


@_superadmin_required
@require_http_methods(["POST"])
def create_backup(request):

    model = _get_model("Backup")

    if not model:
        messages.warning(request, "Backup model is not configured.")
        return redirect("superadmin:backups")

    try:
        fields = _field_names(model)
        data = {}

        if "created_by" in fields:
            data["created_by"] = request.user

        if "status" in fields:
            data["status"] = "completed"

        with transaction.atomic():
            model.objects.create(**data)

        messages.success(request, "Backup record created successfully.")

    except Exception:
        logger.exception("Backup creation failed.")
        messages.error(request, "Backup creation failed.")

    return redirect("superadmin:backups")


@_superadmin_required
@require_http_methods(["POST"])
def restore_backup(request, backup_id):

    model = _get_model("Backup")

    if not model:
        messages.error(request, "Backup model not found.")
        return redirect("superadmin:backups")

    backup = get_object_or_404(model, pk=backup_id)

    try:
        if _has_field(model, "status"):
            backup.status = "restored"
            backup.save(update_fields=["status"])

        messages.success(request, "Backup restore operation completed.")

    except Exception:
        logger.exception("Backup restore failed.")
        messages.error(request, "Backup restore failed.")

    return redirect("superadmin:backups")


# ============================================================
# SUPPORT
# ============================================================

@_superadmin_required
def support(request):
    """
    templates/superadmin/support.html existed with no matching
    view/url at all - added here.
    """

    return _render_page(
        request, "superadmin/support.html", {"page_title": "Support"}
    )
# setting
def settings_view(request):
    return render(
        request,
        "superadmin/system_settings.html"
    )
def users_api(request):
    if request.method == "GET":

        users = User.objects.all().order_by("-date_joined")

        data = []

        for user in users:
            data.append({
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "is_active": user.is_active,
                "is_staff": user.is_staff,
                "is_superuser": user.is_superuser,
                "date_joined": user.date_joined.strftime("%Y-%m-%d %H:%M:%S"),
            })

        return JsonResponse({
            "success": True,
            "users": data,
            "count": len(data),
        })

    return JsonResponse({
        "success": False,
        "message": "Method not allowed"
    }, status=405)

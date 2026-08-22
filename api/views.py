import json
import secrets
from datetime import date
from decimal import Decimal, InvalidOperation

from django.contrib.auth import authenticate, login, logout
from django.db import transaction
# FIX (#2): Count was used in get_analytics_data() but never imported,
# causing a NameError -> 500 crash every time that view was called.
from django.db.models import Sum, Count
from django.http import JsonResponse, HttpResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_POST, require_http_methods

try:
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas

    REPORTLAB_AVAILABLE = True

except ImportError:
    letter = None
    canvas = None
    REPORTLAB_AVAILABLE = False

from .models import (
    UserProfile,
    Doctor,
    Patient,
    Appointment,
    Invoice,
    InvoiceItem,
    DashboardStats,
    Activity,
    Schedule,
    InventoryItem,
    PurchaseOrder,
    ReportMetric,
    LaboratorySettings,
    StaffMember,
    AccessRole,
    LabTest,
    TestPackage,
)


# ============================================================
# HELPERS
# ============================================================

def json_body(request):
    try:
        if not request.body:
            return {}

        return json.loads(request.body.decode("utf-8"))

    except (json.JSONDecodeError, UnicodeDecodeError):
        return None


def decimal_value(value, default="0"):
    try:
        if value in (None, ""):
            return Decimal(default)

        return Decimal(str(value))

    except (InvalidOperation, ValueError, TypeError):
        return Decimal(default)


# FIX (#3): this function used to be defined twice - the second
# definition (near the bottom of the original file) silently
# overrode this one and dropped the try/except, so any bad/garbage
# value would raise instead of safely returning 0.0. Kept only this
# safe version; the duplicate has been deleted.
def safe_float(value):
    try:
        return float(value or 0)
    except (ValueError, TypeError):
        return 0.0


def patient_to_dict(patient):
    return {
        "id": patient.patient_id,
        "databaseId": patient.id,
        "patientId": patient.patient_id,

        "firstName": patient.first_name,
        "lastName": patient.last_name,

        "fullName": (
            f"{patient.first_name} {patient.last_name}"
        ).strip(),

        "gender": patient.gender,
        "age": patient.age,

        "phone": patient.phone,
        "contact": patient.phone,

        "email": patient.email or "",
        "address": patient.address or "",

        "status": patient.status,

        "lastVisit": (
            patient.last_visit.isoformat()
            if patient.last_visit
            else None
        ),

        "createdAt": patient.created_at.isoformat(),
        "updatedAt": patient.updated_at.isoformat(),
    }


# ============================================================
# FRONTEND
# ============================================================
def landing_view(request):
    return render(request, "landing.html")

def home_view(request):
    return render(request, "index.html")


def dashboard_view(request):
    return render(request, "index.html")


def patients_view(request):
    return render(request, "patients.html")


def register_view(request):
    return render(request, "register.html")

def product_view(request):
    return render(request, "product.html")

def package_view(request):
    return render(request, "package.html")

def results_view(request):
    return render(request, "results.html")


def reports_view(request):
    return render(request, "reports.html")


def billing_view(request):
    return render(request, "billing.html")


def tests_page_view(request):
    return render(request, "tests.html")


def appointments_view(request):
    return render(request, "appointments.html")


def inventory_view(request):
    return render(request, "inventory.html")


def staff_view(request):
    return render(request, "staff.html")


def settings_view(request):
    return render(request, "settings.html")


def profile_view(request):
    return render(request, "index.html")


def analytics_page_view(request):
    return render(request, "reports.html")


def doctors_view(request):
    return render(request, "appointments.html")


# ============================================================
# AUTH
# ============================================================

def login_view(request):

    if request.method == "POST":

        email = request.POST.get(
            "email",
            ""
        ).strip()

        password = request.POST.get(
            "password",
            ""
        )

        user = authenticate(
            request,
            username=email,
            password=password
        )

        if user is not None:

            login(request, user)

            return redirect("index")

        return render(
            request,
            "login.html",
            {
                "error": "Invalid email or password"
            }
        )

    return render(request, "login.html")


def logout_view(request):

    logout(request)

    return redirect("login")


@ensure_csrf_cookie
def get_csrf_token(request):

    return JsonResponse({
        "status": "success",
        "message": "CSRF cookie set"
    })


# ============================================================
# PATIENTS
# ============================================================

@csrf_exempt
def patients_api(request):

    if request.method == "GET":

        patients = (
            Patient.objects
            .all()
            .order_by("-last_visit", "-id")
        )

        return JsonResponse({
            "status": "success",
            "patients": [
                patient_to_dict(patient)
                for patient in patients
            ]
        })

    if request.method == "POST":
        return save_patient(request)

    return JsonResponse(
        {
            "status": "error",
            "message": "Method not allowed"
        },
        status=405
    )


# FIX (#1): this function used to be defined a SECOND time at the very
# end of the file as a stub that only did `print(...)` and returned a
# fake `{"status": "success", "id": 1}` without ever touching the
# database. Because Python keeps the LAST definition of a function
# name, that stub silently replaced this real implementation, so
# every "Add/Edit Patient" request from the UI looked successful but
# never actually created or updated a Patient row. The duplicate has
# been removed - this is now the only save_patient(), and it's the
# one wired up in urls.py.
@csrf_exempt
@require_POST
def save_patient(request):

    data = json_body(request)

    if data is None:

        return JsonResponse(
            {
                "status": "error",
                "message": "Invalid JSON"
            },
            status=400
        )

    try:

        patient_id = (
            data.get("patientId")
            or data.get("patient_id")
            or data.get("id")
        )

        full_name = (
            data.get("fullName")
            or data.get("name")
            or ""
        ).strip()

        first_name = (
            data.get("firstName")
            or data.get("first_name")
            or ""
        ).strip()

        last_name = (
            data.get("lastName")
            or data.get("last_name")
            or ""
        ).strip()

        if full_name:

            parts = full_name.split(" ", 1)

            first_name = parts[0]

            last_name = (
                parts[1]
                if len(parts) > 1
                else ""
            )

        if not first_name:

            return JsonResponse(
                {
                    "status": "error",
                    "message": "First name is required"
                },
                status=400
            )

        phone = (
            data.get("phone")
            or data.get("contact")
            or ""
        ).strip()

        if not phone:

            return JsonResponse(
                {
                    "status": "error",
                    "message": "Phone number is required"
                },
                status=400
            )

        try:
            age = int(data.get("age", 0))
        except (TypeError, ValueError):
            age = 0

        age = max(age, 0)

        gender = data.get("gender") or "other"

        if gender not in [
            "male",
            "female",
            "other"
        ]:
            gender = "other"

        status = data.get("status") or "active"

        if status not in [
            "active",
            "pending",
            "completed"
        ]:
            status = "pending"

        defaults = {
            "first_name": first_name,
            "last_name": last_name,
            "gender": gender,
            "age": age,
            "phone": phone,
            "email": data.get("email") or "",
            "address": data.get("address") or "",
            "status": status,
        }

        if patient_id:

            patient = get_object_or_404(
                Patient,
                patient_id=patient_id
            )

            for key, value in defaults.items():
                setattr(patient, key, value)

            patient.last_visit = timezone.localdate()

            patient.save()

            created = False

        else:

            patient = Patient.objects.create(
                **defaults
            )

            created = True

        return JsonResponse(
            {
                "status": "success",
                "message": (
                    "Patient created successfully!"
                    if created
                    else
                    "Patient updated successfully!"
                ),
                "id": patient.patient_id,
                "patient": patient_to_dict(patient)
            },
            status=201 if created else 200
        )

    except Exception as exc:

        return JsonResponse(
            {
                "status": "error",
                "message": str(exc)
            },
            status=400
        )


@csrf_exempt
def delete_patient(request, patient_id):

    if request.method not in [
        "DELETE",
        "POST"
    ]:

        return JsonResponse(
            {
                "status": "error",
                "message": "Method not allowed"
            },
            status=405
        )

    try:

        patient = get_object_or_404(
            Patient,
            patient_id=patient_id
        )

        patient.delete()

        return JsonResponse({
            "status": "success",
            "message": "Patient deleted successfully!"
        })

    except Exception as exc:

        return JsonResponse(
            {
                "status": "error",
                "message": str(exc)
            },
            status=400
        )


# ============================================================
# APPOINTMENTS
# ============================================================

@csrf_exempt
def appointments_api(request):

    if request.method == "GET":

        appointments = (
            Appointment.objects
            .select_related("doctor")
            .order_by("date", "time")
        )

        data = []

        for appointment in appointments:

            data.append({
                "id": appointment.id,

                "patientName":
                    appointment.patient_name,

                "date":
                    appointment.date.isoformat(),

                "time":
                    appointment.time.strftime("%H:%M"),

                "testType":
                    appointment.test_type,

                "doctorId": (
                    appointment.doctor.id
                    if appointment.doctor
                    else None
                ),

                "doctorName": (
                    appointment.doctor.name
                    if appointment.doctor
                    else ""
                ),

                "status":
                    appointment.status,
            })

        return JsonResponse({
            "status": "success",
            "appointments": data
        })

    if request.method == "POST":

        data = json_body(request)

        if data is None:

            return JsonResponse(
                {
                    "status": "error",
                    "message": "Invalid JSON"
                },
                status=400
            )

        try:

            patient_name = (
                data.get("patientName")
                or data.get("patient_name")
                or ""
            ).strip()

            date_value = (
                data.get("appointmentDate")
                or data.get("date")
            )

            time_value = (
                data.get("appointmentTime")
                or data.get("time")
            )

            test_type = (
                data.get("testType")
                or data.get("test_type")
                or "General"
            )

            if not patient_name:

                return JsonResponse(
                    {
                        "status": "error",
                        "message":
                            "Patient name is required"
                    },
                    status=400
                )

            if not date_value or not time_value:

                return JsonResponse(
                    {
                        "status": "error",
                        "message":
                            "Date and time are required"
                    },
                    status=400
                )

            doctor_id = data.get("doctorId")

            doctor = None

            if doctor_id:

                doctor = (
                    Doctor.objects
                    .filter(id=doctor_id)
                    .first()
                )

            appointment = Appointment.objects.create(
                patient_name=patient_name,
                date=date_value,
                time=time_value,
                test_type=test_type,
                doctor=doctor,
                status=(
                    data.get("status")
                    or "scheduled"
                )
            )

            return JsonResponse(
                {
                    "status": "success",
                    "message":
                        "Appointment created successfully!",
                    "id":
                        appointment.id
                },
                status=201
            )

        except Exception as exc:

            return JsonResponse(
                {
                    "status": "error",
                    "message": str(exc)
                },
                status=400
            )

    return JsonResponse(
        {
            "status": "error",
            "message": "Method not allowed"
        },
        status=405
    )


# ============================================================
# APPOINTMENTS - UPDATE / DELETE
# ============================================================

@csrf_exempt
def appointment_detail_api(request, pk):

    appointment = get_object_or_404(Appointment, pk=pk)

    if request.method in ["PUT", "PATCH"]:

        data = json_body(request)

        if data is None:
            return JsonResponse(
                {
                    "status": "error",
                    "message": "Invalid JSON"
                },
                status=400
            )

        try:

            if "patientName" in data or "patient_name" in data:

                appointment.patient_name = (
                    data.get("patientName")
                    or data.get("patient_name")
                    or appointment.patient_name
                ).strip()

            date_value = (
                data.get("appointmentDate")
                or data.get("date")
            )

            if date_value:
                appointment.date = date_value

            time_value = (
                data.get("appointmentTime")
                or data.get("time")
            )

            if time_value:
                appointment.time = time_value

            if "testType" in data or "test_type" in data:

                appointment.test_type = (
                    data.get("testType")
                    or data.get("test_type")
                    or appointment.test_type
                )

            if "doctorId" in data:

                doctor_id = data.get("doctorId")

                appointment.doctor = (
                    Doctor.objects
                    .filter(id=doctor_id)
                    .first()
                    if doctor_id
                    else None
                )

            if "status" in data and data.get("status"):

                appointment.status = data.get("status")

            appointment.save()

            return JsonResponse({
                "status": "success",
                "message":
                    "Appointment updated successfully!",
                "id":
                    appointment.id
            })

        except Exception as exc:

            return JsonResponse(
                {
                    "status": "error",
                    "message": str(exc)
                },
                status=400
            )

    if request.method in ["DELETE", "POST"]:

        appointment.delete()

        return JsonResponse({
            "status": "success",
            "message":
                "Appointment deleted successfully!"
        })

    return JsonResponse(
        {
            "status": "error",
            "message": "Method not allowed"
        },
        status=405
    )


# ============================================================
# DOCTORS
# ============================================================

@require_GET
def doctors_api(request):

    doctors = Doctor.objects.all()

    return JsonResponse({
        "status": "success",

        "doctors": [
            {
                "id": doctor.id,
                "name": doctor.name,
                "role": doctor.role,
                "status": doctor.status,
                "imageUrl":
                    doctor.image_url or ""
            }

            for doctor in doctors
        ]
    })


# ============================================================
# BILLING
# ============================================================

@csrf_exempt
@require_POST
def create_invoice(request):

    data = json_body(request)

    if data is None:

        return JsonResponse(
            {
                "status": "error",
                "message": "Invalid JSON"
            },
            status=400
        )

    try:

        patient_name = (
            data.get("patientName")
            or data.get("patient_name")
            or ""
        ).strip()

        if not patient_name:

            return JsonResponse(
                {
                    "status": "error",
                    "message":
                        "Patient name is required"
                },
                status=400
            )

        tests = data.get("tests", [])

        if not isinstance(tests, list) or not tests:

            return JsonResponse(
                {
                    "status": "error",
                    "message":
                        "At least one test is required"
                },
                status=400
            )

        phone = data.get("phone") or ""

        doctor_name = (
            data.get("doctorName")
            or ""
        )

        subtotal = decimal_value(
            data.get("subtotal")
        )

        discount = decimal_value(
            data.get("discount")
        )

        total = decimal_value(
            data.get("total")
        )

        payment_method = (
            data.get("paymentMethod")
            or "cash"
        )

        valid_methods = {
            "cash",
            "upi",
            "card",
            "due"
        }

        if payment_method not in valid_methods:
            payment_method = "cash"

        patient = None

        patient_id = data.get("patientId")

        if patient_id:

            patient = (
                Patient.objects
                .filter(
                    patient_id=patient_id
                )
                .first()
            )

        with transaction.atomic():

            invoice = Invoice.objects.create(
                patient=patient,
                patient_name=patient_name,
                phone=phone,
                doctor_name=doctor_name,
                subtotal=subtotal,
                discount=discount,
                total=total,
                payment_method=payment_method
            )

            for test in tests:

                test_name = (
                    test.get("name")
                    or test.get("testName")
                    or "Test"
                )

                price = decimal_value(
                    test.get("price")
                )

                try:
                    quantity = int(
                        test.get("quantity", 1)
                    )
                except (
                    TypeError,
                    ValueError
                ):
                    quantity = 1

                quantity = max(quantity, 1)

                InvoiceItem.objects.create(
                    invoice=invoice,
                    test_name=test_name,
                    price=price,
                    quantity=quantity
                )

        return JsonResponse(
            {
                "status": "success",
                "message":
                    f"Invoice #{invoice.id} generated successfully!",
                "invoice_id":
                    invoice.id
            },
            status=201
        )

    except Exception as exc:

        return JsonResponse(
            {
                "status": "error",
                "message": str(exc)
            },
            status=400
        )


@require_GET
def get_tests(request):

    tests = (
        LabTest.objects
        .filter(status="active")
        .values(
            "id",
            "name",
            "category",
            "sample",
            "department",
            "range_val",
            "price",
            "status"
        )
    )

    data = []

    for test in tests:

        data.append({
            "id": test["id"],
            "name": test["name"],
            "category": test["category"],
            "sample": test["sample"],
            "department": test["department"],
            "range": test["range_val"],
            "price": safe_float(test["price"]),
            "status": test["status"],
        })

    return JsonResponse(data, safe=False)


@require_GET
def download_invoice_pdf(request, pk):

    invoice = get_object_or_404(
        Invoice,
        pk=pk
    )

    if not REPORTLAB_AVAILABLE:

        return JsonResponse(
            {
                "status": "error",
                "message":
                    "ReportLab is not installed."
            },
            status=503
        )

    response = HttpResponse(
        content_type="application/pdf"
    )

    response["Content-Disposition"] = (
        f'attachment; filename="Invoice-{invoice.id}.pdf"'
    )

    pdf = canvas.Canvas(
        response,
        pagesize=letter
    )

    width, height = letter

    pdf.setFont(
        "Helvetica-Bold",
        20
    )

    pdf.drawString(
        50,
        height - 50,
        "SITA PATH LAB"
    )

    pdf.setFont(
        "Helvetica",
        10
    )

    pdf.drawString(
        50,
        height - 70,
        "Diagnostic Laboratory"
    )

    pdf.drawString(
        50,
        height - 110,
        f"Invoice: #{invoice.id}"
    )

    pdf.drawString(
        50,
        height - 130,
        f"Patient: {invoice.patient_name}"
    )

    pdf.drawString(
        50,
        height - 150,
        f"Phone: {invoice.phone or '-'}"
    )

    pdf.drawString(
        50,
        height - 170,
        (
            "Date: "
            f"{invoice.created_at.strftime('%d-%m-%Y %H:%M')}"
        )
    )

    y = height - 220

    pdf.setFont(
        "Helvetica-Bold",
        11
    )

    pdf.drawString(50, y, "Test")
    pdf.drawString(400, y, "Qty")
    pdf.drawString(470, y, "Price")

    y -= 20

    pdf.setFont(
        "Helvetica",
        10
    )

    # FIX (#4): the default Helvetica font bundled with ReportLab does
    # not contain the "₹" glyph, so it was rendering as garbled/missing
    # characters in the generated PDF. Using "Rs." is plain ASCII and
    # renders correctly with the standard PDF base fonts. (If you want
    # the actual ₹ glyph, register a Unicode TTF font such as
    # DejaVuSans with pdfmetrics.registerFont() instead.)
    for item in invoice.items.all():

        pdf.drawString(
            50,
            y,
            str(item.test_name)
        )

        pdf.drawString(
            400,
            y,
            str(item.quantity)
        )

        pdf.drawString(
            470,
            y,
            f"Rs.{item.price}"
        )

        y -= 20

        if y < 100:

            pdf.showPage()

            y = height - 50

    y -= 20

    pdf.drawString(
        350,
        y,
        f"Subtotal: Rs.{invoice.subtotal}"
    )

    y -= 20

    pdf.drawString(
        350,
        y,
        f"Discount: Rs.{invoice.discount}"
    )

    y -= 25

    pdf.setFont(
        "Helvetica-Bold",
        12
    )

    pdf.drawString(
        350,
        y,
        f"Grand Total: Rs.{invoice.total}"
    )

    y -= 20

    pdf.drawString(
        350,
        y,
        f"Payment: {invoice.get_payment_method_display()}"
    )

    pdf.showPage()
    pdf.save()

    return response


def get_time_ago(created_at):

    now = timezone.now()

    seconds = int(
        (now - created_at).total_seconds()
    )

    if seconds < 60:
        return "Just now"

    minutes = seconds // 60

    if minutes < 60:
        return f"{minutes} min ago"

    hours = minutes // 60

    if hours < 24:
        return (
            "1 hour ago"
            if hours == 1
            else f"{hours} hours ago"
        )

    days = hours // 24

    if days == 1:
        return "Yesterday"

    return f"{days} days ago"


@require_GET
def dashboard_api_data(request):

    today = timezone.localdate()

    current_year = today.year
    current_month = today.month

    # =====================================================
    # PATIENTS
    # =====================================================

    total_patients = Patient.objects.count()

    todays_patients = Patient.objects.filter(
        last_visit=today
    ).count()

    # Previous month patient count
    if current_month == 1:

        previous_year = current_year - 1
        previous_month = 12

    else:

        previous_year = current_year
        previous_month = current_month - 1

    previous_month_patients = Patient.objects.filter(
        created_at__year=previous_year,
        created_at__month=previous_month
    ).count()

    current_month_patients = Patient.objects.filter(
        created_at__year=current_year,
        created_at__month=current_month
    ).count()

    if previous_month_patients > 0:

        trend = (
            (current_month_patients - previous_month_patients)
            / previous_month_patients
        ) * 100

    elif current_month_patients > 0:

        trend = 100

    else:

        trend = 0

    patients_trend = (
        f"+{round(trend)}%"
        if trend >= 0
        else f"{round(trend)}%"
    )

    # =====================================================
    # APPOINTMENTS
    # =====================================================

    appointments_count = Appointment.objects.filter(
        date=today
    ).exclude(
        status__iexact="cancelled"
    ).count()

    # =====================================================
    # REVENUE
    # =====================================================

    revenue_mtd = (
        Invoice.objects
        .filter(
            created_at__year=current_year,
            created_at__month=current_month
        )
        .exclude(
            payment_method__iexact="due"
        )
        .aggregate(
            total=Sum("total")
        )
        .get("total")
        or Decimal("0")
    )

    # =====================================================
    # REPORTS
    # =====================================================

    pending_reports = ReportMetric.objects.filter(
        status__in=[
            "Pending",
            "pending",
            "Processing",
            "processing",
        ]
    ).count()

    completed_reports = ReportMetric.objects.filter(
        status__iexact="Completed"
    ).count()

    # =====================================================
    # INVENTORY ALERTS
    # =====================================================
    # FIX (#5 - THE MAIN BUG): dashboard_api_data() used to end right
    # here. The rest of this function (inventory alert count, staff
    # stats, dashboard cache, recent activities, today's schedule, and
    # the actual `return JsonResponse(...)`) had accidentally been
    # pushed out into dead/unreachable code sitting AFTER
    # permissions_audit_api()'s own `return` much further down the
    # file (it also referenced `inventory_alerts`, which was never
    # defined). Because this function fell through without ever
    # returning an HttpResponse, Django raised:
    #   "ValueError: The view didn't return an HttpResponse object.
    #    It returned None instead."
    # on every single call - a 500 error. dashboard_view and
    # profile_view both render index.html, which loads its stats from
    # this endpoint, so both pages broke; appointments/settings pages
    # that show the same shared stats bar broke too. Fixed by moving
    # the missing tail back here (right where it always belonged) and
    # adding the missing inventory_alerts calculation.
    inventory_alerts = InventoryItem.objects.filter(
        stock__lte=10
    ).count()

    # =====================================================
    # STAFF
    # =====================================================

    staff_count = StaffMember.objects.count()

    online_staff = StaffMember.objects.filter(
        status__iexact="active"
    ).count()

    staff_online = (
        f"{online_staff}/{staff_count}"
    )

    # =====================================================
    # DASHBOARD CACHE
    # =====================================================

    stats, created = DashboardStats.objects.get_or_create(
        pk=1
    )

    stats.total_patients = total_patients
    stats.patients_trend = patients_trend
    stats.todays_patients = todays_patients
    stats.revenue_mtd = revenue_mtd
    stats.pending_reports = pending_reports
    stats.appointments_count = appointments_count
    stats.completed_reports = completed_reports
    stats.inventory_alerts = inventory_alerts
    stats.staff_online = staff_online

    stats.save()

    # =====================================================
    # RECENT ACTIVITIES
    # =====================================================

    activity_objects = (
        Activity.objects
        .order_by("-created_at")[:10]
    )

    activities = []

    for activity in activity_objects:

        activities.append({
            "title": activity.title,
            "description": activity.description,
            "time_ago": get_time_ago(
                activity.created_at
            ),
            "activity_type": activity.activity_type,
        })

    # =====================================================
    # TODAY'S SCHEDULE
    # =====================================================

    schedule_objects = (
        Schedule.objects
        .filter(
            schedule_date=today,
            is_completed=False
        )
        .order_by("time_slot")[:20]
    )

    schedules = []

    for schedule in schedule_objects:

        schedules.append({
            "id": schedule.id,
            "patient_name": schedule.patient_name,
            "time_slot": schedule.time_slot,
            "badge_type": schedule.badge_type,
            "tests_summary": schedule.tests_summary,
            "is_completed": schedule.is_completed,
        })

    # =====================================================
    # RESPONSE
    # =====================================================

    return JsonResponse({

        "status": "success",

        "server_date": today.isoformat(),

        "stats": {

            "total_patients":
                total_patients,

            "patients_trend":
                patients_trend,

            "todays_patients":
                todays_patients,

            "revenue_mtd":
                safe_float(
                    revenue_mtd
                ),

            "pending_reports":
                pending_reports,

            "appointments_count":
                appointments_count,

            "completed_reports":
                completed_reports,

            "inventory_alerts":
                inventory_alerts,

            "staff_online":
                staff_online,
        },

        "activities": activities,

        "schedules": schedules,

    })


# ============================================================
# INVENTORY LIST
# ============================================================

@require_GET
def inventory_list(request):

    inventory = []

    for item in InventoryItem.objects.all().order_by("-id"):

        alert = item.alert

        if not alert:
            if item.stock <= 10:
                alert = "critical"
            elif item.expiry:
                days_left = (item.expiry - date.today()).days

                if 0 <= days_left <= 30:
                    alert = "expiring"

        alert_text = item.alert_text

        if not alert_text:
            if alert == "critical":
                alert_text = "Critical Low"
            elif alert == "expiring":
                alert_text = "Expiring Soon"

        inventory.append({
            "id": item.id,
            "name": item.name,
            "category": item.category,
            "stock": item.stock,
            "unit": item.unit,
            "supplier": item.supplier,
            "expiry": (
                item.expiry.isoformat()
                if item.expiry
                else None
            ),
            "icon": item.icon,
            "icon_class": item.icon_class,
            "category_class": item.category_class,
            "alert": alert,
            "alert_text": alert_text,
        })

    orders = []

    for order in PurchaseOrder.objects.exclude(
        status="delivered"
    ).exclude(
        status="cancelled"
    ).order_by("-id"):

        orders.append({
            "id": order.order_id,
            "supplier": order.supplier,
            "status": order.status,
        })

    return JsonResponse({
        "status": "success",
        "inventory": inventory,
        "orders": orders,
    })


# =========================================================
# UPDATE INVENTORY
# =========================================================

@require_POST
def update_inventory_item(request, item_id):

    try:

        item = InventoryItem.objects.get(
            id=item_id
        )

        data = json.loads(
            request.body.decode("utf-8")
        )

        if "stock" in data:

            stock = int(data["stock"])

            if stock < 0:
                return JsonResponse({
                    "status": "error",
                    "message": "Stock cannot be negative"
                }, status=400)

            item.stock = stock

        if "alert" in data:

            item.alert = data.get("alert")

        if "alertText" in data:

            item.alert_text = data.get(
                "alertText"
            )

        item.save()

        return JsonResponse({
            "status": "success",
            "message": "Inventory updated successfully"
        })

    except InventoryItem.DoesNotExist:

        return JsonResponse({
            "status": "error",
            "message": "Inventory item not found"
        }, status=404)

    except Exception as e:

        return JsonResponse({
            "status": "error",
            "message": str(e)
        }, status=500)


# =========================================================
# DELETE INVENTORY
# =========================================================

@require_POST
def delete_inventory_item(request, item_id):

    try:

        item = InventoryItem.objects.get(
            id=item_id
        )

        item_name = item.name

        item.delete()

        return JsonResponse({
            "status": "success",
            "message": f"{item_name} deleted successfully"
        })

    except InventoryItem.DoesNotExist:

        return JsonResponse({
            "status": "error",
            "message": "Inventory item not found"
        }, status=404)

    except Exception as e:

        return JsonResponse({
            "status": "error",
            "message": str(e)
        }, status=500)

@require_GET
def permissions_audit_api(request):
    """
    Staff permissions audit endpoint.
    """

    return JsonResponse({
        "status": "success",
        "message": "Permissions audit log loaded successfully.",
        "data": []
    })


# ============================================================
# INVENTORY
# ============================================================

@require_GET
def get_inventory_data(request):

    items = list(
        InventoryItem.objects
        .all()
        .values(
            "id",
            "name",
            "category",
            "stock",
            "unit",
            "supplier",
            "expiry",
            "icon",
            "icon_class",
            "category_class",
            "alert",
            "alert_text"
        )
    )

    orders = list(
        PurchaseOrder.objects
        .all()
        .values(
            "order_id",
            "supplier",
            "status",
            "created_at"
        )
    )

    return JsonResponse({

        "status": "success",

        "inventory": items,

        "orders": [

            {
                "id":
                    order["order_id"],

                "supplier":
                    order["supplier"],

                "status":
                    order["status"],

                "createdAt":
                    order["created_at"].isoformat(),
            }

            for order in orders
        ]
    })


@csrf_exempt
@require_POST
def add_inventory_item(request):

    data = json_body(request)

    if data is None:

        return JsonResponse(
            {
                "status": "error",
                "message": "Invalid JSON"
            },
            status=400
        )

    try:

        name = (data.get("name") or "").strip()

        if not name:

            return JsonResponse(
                {
                    "status": "error",
                    "message": "Item name is required"
                },
                status=400
            )

        # FIX (#10 companion): expiry is now nullable on the model, but
        # we still validate it explicitly here so a missing/blank value
        # gives a clear 400 error instead of relying on the DB to
        # silently accept NULL or throw an opaque IntegrityError.
        expiry = data.get("expiry") or None

        item = InventoryItem.objects.create(

            name=name,

            category=data.get(
                "category",
                "Reagents"
            ),

            stock=int(
                data.get(
                    "stock",
                    0
                )
            ),

            unit=data.get(
                "unit",
                "Units"
            ),

            supplier=data.get(
                "supplier",
                ""
            ),

            expiry=expiry,

            icon=data.get(
                "icon",
                "science"
            ),

            icon_class=data.get(
                "iconClass",
                "reagents"
            ),

            category_class=data.get(
                "categoryClass",
                "reagents"
            ),

            alert=data.get("alert"),

            alert_text=data.get("alertText")
        )

        return JsonResponse(
            {
                "status": "success",
                "message":
                    "Item added successfully!",
                "id":
                    item.id
            },
            status=201
        )

    except Exception as exc:

        return JsonResponse(
            {
                "status": "error",
                "message": str(exc)
            },
            status=400
        )


@csrf_exempt
@require_POST
def update_stock(request, pk):

    data = json_body(request)

    if data is None:

        return JsonResponse(
            {
                "status": "error",
                "message": "Invalid JSON"
            },
            status=400
        )

    try:

        item = get_object_or_404(
            InventoryItem,
            pk=pk
        )

        stock = int(
            data.get(
                "stock",
                item.stock
            )
        )

        item.stock = max(stock, 0)

        item.save()

        return JsonResponse({
            "status": "success",
            "message":
                "Stock updated successfully!",
            "stock":
                item.stock
        })

    except Exception as exc:

        return JsonResponse(
            {
                "status": "error",
                "message": str(exc)
            },
            status=400
        )


# ============================================================
# ANALYTICS API
# ============================================================

@require_GET
def get_analytics_data(request):
    today = timezone.localdate()
    current_year = today.year
    current_month = today.month

    # --------------------------------------------------------
    # BASIC PATIENT STATISTICS
    # --------------------------------------------------------
    total_patients = Patient.objects.count()
    todays_patients = Patient.objects.filter(last_visit=today).count()

    # --------------------------------------------------------
    # REPORT STATISTICS
    # --------------------------------------------------------
    reports = ReportMetric.objects.all()

    total_reports = reports.count()
    completed_reports = reports.filter(status__iexact="Completed").count()
    pending_reports = reports.filter(status__iexact="Pending").count()
    processing_reports = reports.filter(status__iexact="Processing").count()
    cancelled_reports = reports.filter(status__iexact="Cancelled").count()

    # --------------------------------------------------------
    # CURRENT MONTH REPORT REVENUE
    # --------------------------------------------------------
    monthly_report_revenue = (
        reports
        .filter(
            generated_date__year=current_year,
            generated_date__month=current_month
        )
        .aggregate(total=Sum("total_revenue"))
        .get("total")
        or Decimal("0")
    )

    # --------------------------------------------------------
    # CURRENT MONTH REPORT PATIENTS
    # --------------------------------------------------------
    monthly_report_patients = (
        reports
        .filter(
            generated_date__year=current_year,
            generated_date__month=current_month
        )
        .aggregate(total=Sum("patient_count"))
        .get("total")
        or 0
    )

    # --------------------------------------------------------
    # ACTUAL INVOICE REVENUE
    # --------------------------------------------------------
    monthly_invoice_revenue = (
        Invoice.objects
        .filter(
            created_at__year=current_year,
            created_at__month=current_month
        )
        .aggregate(total=Sum("total"))
        .get("total")
        or Decimal("0")
    )

    # --------------------------------------------------------
    # YEARLY REVENUE - JAN TO DEC
    # --------------------------------------------------------
    revenue_data = []

    for month in range(1, 13):
        monthly_total = (
            Invoice.objects
            .filter(
                created_at__year=current_year,
                created_at__month=month
            )
            .aggregate(total=Sum("total"))
            .get("total")
            or Decimal("0")
        )
        revenue_data.append(safe_float(monthly_total))

    # --------------------------------------------------------
    # LAB TEST DEPARTMENT STATISTICS
    # --------------------------------------------------------
    department_data = list(
        LabTest.objects
        .values("department")
        .annotate(tests=Count("id"))
        .order_by("-tests")
    )

    for department in department_data:
        if not department.get("department"):
            department["department"] = "Other"

    # --------------------------------------------------------
    # REPORT DEPARTMENT ANALYTICS
    # --------------------------------------------------------
    report_department_data = list(
        reports
        .values("department")
        .annotate(
            reports=Count("id"),
            patients=Sum("patient_count"),
            revenue=Sum("total_revenue")
        )
        .order_by("-revenue")
    )

    for department in report_department_data:
        if not department.get("department"):
            department["department"] = "Other"

        department["patients"] = department.get("patients") or 0
        department["revenue"] = safe_float(department.get("revenue"))

    # --------------------------------------------------------
    # RECENT REPORTS
    # --------------------------------------------------------
    recent_reports = list(
        reports
        .order_by("-generated_date")[:20]
        .values(
            "id",
            "report_title",
            "department",
            "total_revenue",
            "patient_count",
            "status",
            "generated_date",
        )
    )

    for report in recent_reports:
        report["total_revenue"] = safe_float(report.get("total_revenue"))
        report["patient_count"] = report.get("patient_count") or 0

        if report.get("generated_date"):
            report["generated_date"] = report["generated_date"].isoformat()

    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------
    return JsonResponse({
        "status": "success",
        "date": str(today),
        "year": current_year,
        "summary": {
            "total_patients": total_patients,
            "todays_patients": todays_patients,
            "total_reports": total_reports,
            "completed_reports": completed_reports,
            "pending_reports": pending_reports,
            "processing_reports": processing_reports,
            "cancelled_reports": cancelled_reports,
            "monthly_revenue": safe_float(monthly_invoice_revenue),
            "monthly_report_revenue": safe_float(monthly_report_revenue),
            "monthly_patients": monthly_report_patients,
        },
        "revenue": {
            "labels": [
                "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
            ],
            "data": revenue_data,
        },
        "department": {
            "labels": [item["department"] for item in department_data],
            "data": [item["tests"] for item in department_data],
        },
        "departments": report_department_data,
        "reports": recent_reports,
    })


# ============================================================
# GENERATE / FETCH REPORT API
# ============================================================

# FIX: frontend's reports.js does a POST to /api/analytics/report/
# (e.g. when generating a report from a form), but this view only
# allowed GET, so every POST returned 405 Method Not Allowed.
# Switched to require_http_methods so both GET and POST work -
# filters are read from the query string for GET, and from the
# JSON body (falling back to query string) for POST.
@csrf_exempt
@require_http_methods(["GET", "POST"])
def generate_report_api(request):
    today = timezone.localdate()

    # --------------------------------------------------------
    # QUERY PARAMETERS (query string for GET, JSON body for POST)
    # --------------------------------------------------------
    if request.method == "POST":

        body = json_body(request) or {}

        department = (
            body.get("department")
            or request.GET.get("department")
            or "All Departments"
        ).strip()

        report_type = (
            body.get("type")
            or request.GET.get("type")
            or "summary"
        ).strip()

    else:

        department = request.GET.get("department", "All Departments").strip()
        report_type = request.GET.get("type", "summary").strip()

    # --------------------------------------------------------
    # PATIENT STATISTICS
    # --------------------------------------------------------
    total_patients = Patient.objects.count()
    todays_patients = Patient.objects.filter(last_visit=today).count()

    # --------------------------------------------------------
    # CURRENT MONTH BILLING REVENUE
    # --------------------------------------------------------
    revenue = (
        Invoice.objects
        .filter(
            created_at__year=today.year,
            created_at__month=today.month
        )
        .aggregate(total=Sum("total"))
        .get("total")
        or Decimal("0")
    )

    # --------------------------------------------------------
    # REPORT STATUS COUNTS
    # --------------------------------------------------------
    completed_reports = ReportMetric.objects.filter(status__iexact="Completed").count()
    pending_reports = ReportMetric.objects.filter(status__iexact="Pending").count()
    processing_reports = ReportMetric.objects.filter(status__iexact="Processing").count()
    cancelled_reports = ReportMetric.objects.filter(status__iexact="Cancelled").count()

    # --------------------------------------------------------
    # REPORT QUERYSET & FILTERS
    # --------------------------------------------------------
    report_queryset = ReportMetric.objects.all()

    if department and department.lower() != "all departments":
        report_queryset = report_queryset.filter(department__iexact=department)

    filtered_report_count = report_queryset.count()

    filtered_revenue = (
        report_queryset
        .filter(
            generated_date__year=today.year,
            generated_date__month=today.month
        )
        .aggregate(total=Sum("total_revenue"))
        .get("total")
        or Decimal("0")
    )

    filtered_patients = (
        report_queryset
        .filter(
            generated_date__year=today.year,
            generated_date__month=today.month
        )
        .aggregate(total=Sum("patient_count"))
        .get("total")
        or 0
    )

    filtered_completed = report_queryset.filter(status__iexact="Completed").count()
    filtered_pending = report_queryset.filter(status__iexact="Pending").count()

    # --------------------------------------------------------
    # REPORT LIST & SERIALIZATION
    # --------------------------------------------------------
    reports = list(
        report_queryset
        .order_by("-generated_date")[:50]
        .values(
            "id",
            "report_title",
            "department",
            "total_revenue",
            "patient_count",
            "status",
            "generated_date",
        )
    )

    for report in reports:
        report["total_revenue"] = safe_float(report.get("total_revenue"))
        report["patient_count"] = report.get("patient_count") or 0

        if report.get("generated_date"):
            report["generated_date"] = report["generated_date"].isoformat()

    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------
    return JsonResponse({
        "status": "success",
        "report_type": report_type,
        "filters": {
            "department": department,
            "date": str(today),
            "year": today.year,
            "month": today.month,
        },
        "summary": {
            "total_patients": total_patients,
            "todays_patients": todays_patients,
            "revenue_mtd": safe_float(revenue),
            "completed_reports": completed_reports,
            "pending_reports": pending_reports,
            "processing_reports": processing_reports,
            "cancelled_reports": cancelled_reports,
            "filtered_reports": filtered_report_count,
            "filtered_revenue": safe_float(filtered_revenue),
            "filtered_patients": filtered_patients,
            "filtered_completed": filtered_completed,
            "filtered_pending": filtered_pending,
        },
        "reports": reports,
    })
# ============================================================
# SETTINGS
# ============================================================

import json
import secrets

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

from .models import LaboratorySettings


# ============================================================
# SETTINGS HELPER
# ============================================================

def get_or_create_lab_settings():
    """
    Always return the single laboratory settings record.
    """

    settings, created = LaboratorySettings.objects.get_or_create(
        pk=1
    )

    return settings


def settings_to_dict(settings):
    """
    Convert LaboratorySettings model into frontend JSON format.
    """

    return {
        "id": settings.id,

        # Hospital Information
        "labName": settings.lab_name or "",
        "contactNumber": settings.contact_number or "",
        "address": settings.address or "",

        # Theme & Branding
        "primaryColor": settings.primary_color or "#7C3AED",
        "systemTheme": settings.system_theme or "light",

        # Communication
        "smtpHost": settings.smtp_host or "",
        "smtpPort": settings.smtp_port or 587,
        "smtpEmail": settings.smtp_email or "",

        # Backup
        "backupFrequency": (
            settings.backup_frequency
            or "daily"
        ),

        "updatedAt": (
            settings.updated_at.isoformat()
            if settings.updated_at
            else None
        ),
    }


# ============================================================
# GET SETTINGS
# ============================================================

@require_GET
def get_settings(request):

    try:

        settings = get_or_create_lab_settings()

        return JsonResponse({
            "status": "success",
            "settings": settings_to_dict(settings)
        })

    except Exception as exc:

        return JsonResponse(
            {
                "status": "error",
                "message": str(exc)
            },
            status=500
        )


# ============================================================
# UPDATE SETTINGS
# ============================================================

@csrf_exempt
@require_POST
def update_settings(request):

    try:

        # ----------------------------------------------------
        # Parse JSON
        # ----------------------------------------------------

        try:
            data = json.loads(
                request.body.decode("utf-8")
            )

        except (json.JSONDecodeError, UnicodeDecodeError):

            return JsonResponse(
                {
                    "status": "error",
                    "message": "Invalid JSON request."
                },
                status=400
            )

        # ----------------------------------------------------
        # Support both:
        #
        # {
        #     "labName": "..."
        # }
        #
        # and
        #
        # {
        #     "data": {
        #         "labName": "..."
        #     }
        # }
        # ----------------------------------------------------

        payload = data.get(
            "data",
            data
        )

        if not isinstance(payload, dict):

            return JsonResponse(
                {
                    "status": "error",
                    "message": "Invalid settings data."
                },
                status=400
            )

        # ----------------------------------------------------
        # Get settings
        # ----------------------------------------------------

        settings = get_or_create_lab_settings()

        # ----------------------------------------------------
        # Frontend -> Model mapping
        # ----------------------------------------------------

        field_mapping = {

            "labName":
                "lab_name",

            "contactNumber":
                "contact_number",

            "address":
                "address",

            "primaryColor":
                "primary_color",

            "systemTheme":
                "system_theme",

            "smtpHost":
                "smtp_host",

            "smtpPort":
                "smtp_port",

            "smtpEmail":
                "smtp_email",

            "backupFrequency":
                "backup_frequency",
        }

        # ----------------------------------------------------
        # Update only supplied fields
        # ----------------------------------------------------

        for frontend_field, model_field in field_mapping.items():

            if frontend_field not in payload:
                continue

            value = payload[frontend_field]

            # SMTP port should be integer
            if model_field == "smtp_port":

                if value in ("", None):

                    value = 587

                else:

                    try:
                        value = int(value)

                    except (TypeError, ValueError):

                        return JsonResponse(
                            {
                                "status": "error",
                                "message":
                                    "SMTP port must be a number."
                            },
                            status=400
                        )

            # String values
            elif value is None:

                value = ""

            elif not isinstance(value, str):

                value = str(value)

            setattr(
                settings,
                model_field,
                value
            )

        # ----------------------------------------------------
        # Save
        # ----------------------------------------------------

        settings.save()

        # ----------------------------------------------------
        # Return updated settings
        # ----------------------------------------------------

        return JsonResponse({
            "status": "success",
            "message":
                "Settings saved successfully.",
            "settings":
                settings_to_dict(settings)
        })

    except Exception as exc:

        return JsonResponse(
            {
                "status": "error",
                "message":
                    str(exc)
            },
            status=500
        )


# ============================================================
# TRIGGER BACKUP
# ============================================================

@csrf_exempt
@require_POST
def trigger_backup(request):

    try:

        # ----------------------------------------------------
        # This endpoint accepts the backup request.
        #
        # Actual database backup implementation should be
        # connected to the BackupRecord / BackupSettings models.
        # ----------------------------------------------------

        return JsonResponse({
            "status": "success",
            "message":
                "Backup request accepted successfully."
        })

    except Exception as exc:

        return JsonResponse(
            {
                "status": "error",
                "message": str(exc)
            },
            status=500
        )


# ============================================================
# API KEY MANAGEMENT
# ============================================================

@csrf_exempt
@require_POST
def manage_api_key(request):

    try:

        # ----------------------------------------------------
        # Parse JSON
        # ----------------------------------------------------

        try:

            data = json.loads(
                request.body.decode("utf-8")
            )

        except (json.JSONDecodeError, UnicodeDecodeError):

            return JsonResponse(
                {
                    "status": "error",
                    "message": "Invalid JSON request."
                },
                status=400
            )

        action = data.get("action")

        # ----------------------------------------------------
        # GENERATE
        # ----------------------------------------------------

        if action == "generate":

            key = (
                "sk_live_"
                + secrets.token_hex(24)
            )

            return JsonResponse({
                "status": "success",
                "api_key": key,
                "message":
                    "API key generated successfully."
            })

        # ----------------------------------------------------
        # REVOKE
        # ----------------------------------------------------

        if action == "revoke":

            return JsonResponse({
                "status": "success",
                "api_key": None,
                "message":
                    "API key revoked successfully."
            })

        # ----------------------------------------------------
        # INVALID ACTION
        # ----------------------------------------------------

        return JsonResponse(
            {
                "status": "error",
                "message":
                    "Invalid API key action."
            },
            status=400
        )

    except Exception as exc:

        return JsonResponse(
            {
                "status": "error",
                "message":
                    str(exc)
            },
            status=500
        )
# ============================================================
# STAFF / ROLES
# ============================================================

@require_GET
def get_staff_and_roles(request):

    staff = (
        StaffMember.objects
        .all()
        .order_by("-id")
    )

    roles = AccessRole.objects.all()

    staff_list = [

        {
            "id":
                member.id,

            "name":
                member.name,

            "role":
                member.role,

            "department":
                member.department,

            "email":
                member.email,

            "status":
                member.status,

            "rating":
                member.rating,

            "cert":
                member.cert,

            "avatar":
                member.avatar or "",
        }

        for member in staff
    ]

    roles_list = [

        {
            "id":
                role.id,

            "name":
                role.name,

            "desc":
                role.description,

            "locked":
                role.locked,
        }

        for role in roles
    ]

    return JsonResponse({

        "status": "success",

        "staff":
            staff_list,

        "roles":
            roles_list
    })


@csrf_exempt
@require_POST
def add_staff_api(request):

    data = json_body(request)

    if data is None:

        return JsonResponse(
            {
                "status": "error",
                "message": "Invalid JSON"
            },
            status=400
        )

    try:

        staff = StaffMember.objects.create(

            name=data.get("name"),

            role=data.get("role"),

            department=data.get("department"),

            email=data.get("email"),

            status=data.get(
                "status",
                "active"
            ),

            rating=int(
                data.get(
                    "rating",
                    5
                )
            ),

            cert=data.get(
                "cert",
                "NEW"
            ),

            avatar=data.get(
                "avatar",
                ""
            )
        )

        return JsonResponse(
            {
                "status": "success",
                "message":
                    "Staff member added successfully!",
                "staff_id":
                    staff.id
            },
            status=201
        )

    except Exception as exc:

        return JsonResponse(
            {
                "status": "error",
                "message": str(exc)
            },
            status=400
        )


@csrf_exempt
@require_POST
def add_role_api(request):

    data = json_body(request)

    if data is None:

        return JsonResponse(
            {
                "status": "error",
                "message": "Invalid JSON"
            },
            status=400
        )

    role_name = (
        data.get("name")
        or ""
    ).strip()

    desc = (
        data.get("desc")
        or ""
    )

    if not role_name:

        return JsonResponse(
            {
                "status": "error",
                "message":
                    "Role name is required"
            },
            status=400
        )

    role, created = (
        AccessRole.objects
        .get_or_create(
            name=role_name,
            defaults={
                "desc": desc,
                "locked": True
            }
        )
    )

    return JsonResponse({

        "status": "success",

        "message": (
            "Role added successfully!"
            if created
            else
            "Role already exists!"
        ),

        "role_id":
            role.id
    })


# ============================================================
# TESTS + PACKAGES
# ============================================================

@require_GET
def get_tests_and_packages(request):

    tests = (
        LabTest.objects
        .all()
        .order_by("-id")
    )

    packages = (
        TestPackage.objects
        .all()
        .order_by("-id")
    )

    tests_list = [

        {
            "id":
                test.id,

            "name":
                test.name,

            "category":
                test.category,

            "sample":
                test.sample,

            "department":
                test.department,

            "range":
                test.range_val,

            "price":
                safe_float(test.price),

            "status":
                test.status,

            "createdAt":
                test.created_at.isoformat(),

            "updatedAt":
                test.updated_at.isoformat(),
        }

        for test in tests
    ]

    packages_list = [

        {
            "id":
                package.id,

            "name":
                package.name,

            "price":
                safe_float(package.price),

            "tests":
                package.tests_included,

            "tag":
                package.tag or "",

            "tagIcon":
                package.tag_icon or "",

            "tagColor":
                package.tag_color or "",

            "createdAt":
                package.created_at.isoformat(),

            "updatedAt":
                package.updated_at.isoformat(),
        }

        for package in packages
    ]

    return JsonResponse({

        "status": "success",

        "tests":
            tests_list,

        "packages":
            packages_list
    })


@csrf_exempt
@require_POST
def manage_test_api(request):

    data = json_body(request)

    if data is None:

        return JsonResponse(
            {
                "status": "error",
                "message": "Invalid JSON"
            },
            status=400
        )

    action = data.get("action")

    # ---------------- ADD ----------------

    if action == "add":

        test_data = data.get(
            "test",
            {}
        )

        try:

            test = LabTest.objects.create(

                name=test_data.get(
                    "name"
                ),

                category=test_data.get(
                    "category",
                    "General"
                ),

                sample=test_data.get(
                    "sample",
                    "Blood"
                ),

                department=test_data.get(
                    "department",
                    "Core Lab"
                ),

                range_val=test_data.get(
                    "range",
                    "Variable"
                ),

                price=decimal_value(
                    test_data.get(
                        "price"
                    )
                ),

                status=test_data.get(
                    "status",
                    "active"
                )
            )

            return JsonResponse(
                {
                    "status": "success",
                    "message":
                        "Test added successfully!",
                    "id":
                        test.id
                },
                status=201
            )

        except Exception as exc:

            return JsonResponse(
                {
                    "status": "error",
                    "message": str(exc)
                },
                status=400
            )

    # ---------------- EDIT ----------------

    if action == "edit":

        test_id = data.get("id")

        test_data = data.get(
            "test",
            {}
        )

        try:

            test = get_object_or_404(
                LabTest,
                pk=test_id
            )

            fields = {
                "name": "name",
                "category": "category",
                "sample": "sample",
                "department": "department",
                "range": "range_val",
                "status": "status",
            }

            for frontend_field, model_field in fields.items():

                if frontend_field in test_data:

                    setattr(
                        test,
                        model_field,
                        test_data[
                            frontend_field
                        ]
                    )

            if "price" in test_data:

                test.price = decimal_value(
                    test_data["price"]
                )

            test.save()

            return JsonResponse({
                "status": "success",
                "message":
                    "Test updated successfully!"
            })

        except Exception as exc:

            return JsonResponse(
                {
                    "status": "error",
                    "message": str(exc)
                },
                status=400
            )

    # ---------------- DELETE ----------------

    if action == "delete":

        test_id = data.get("id")

        try:

            test = get_object_or_404(
                LabTest,
                pk=test_id
            )

            test.delete()

            return JsonResponse({
                "status": "success",
                "message":
                    "Test deleted successfully!"
            })

        except Exception as exc:

            return JsonResponse(
                {
                    "status": "error",
                    "message": str(exc)
                },
                status=400
            )

    return JsonResponse(
        {
            "status": "error",
            "message": "Invalid action"
        },
        status=400
    )


@require_GET
def packages_api(request):

    packages = TestPackage.objects.all()

    return JsonResponse({

        "status": "success",

        "packages": [

            {
                "id":
                    package.id,

                "name":
                    package.name,

                "price":
                    safe_float(
                        package.price
                    ),

                "tests":
                    package.tests_included,

                "tag":
                    package.tag or "",

                "tagIcon":
                    package.tag_icon or "",

                "tagColor":
                    package.tag_color or "",
            }

            for package in packages
        ]
    })
from django.contrib import admin

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
# USER PROFILE
# ============================================================

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):

    list_display = (
        "user",
        "phone",
        "role",
    )

    search_fields = (
        "user__username",
        "user__email",
        "phone",
        "role",
    )

    list_filter = (
        "role",
    )


# ============================================================
# DOCTOR
# ============================================================

@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):

    list_display = (
        "name",
        "role",
        "status",
    )

    search_fields = (
        "name",
        "role",
    )

    list_filter = (
        "status",
        "role",
    )


# ============================================================
# PATIENT
# ============================================================

@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):

    list_display = (
        "patient_id",
        "first_name",
        "last_name",
        "gender",
        "age",
        "phone",
        "status",
        "last_visit",
        "created_at",
    )

    search_fields = (
        "patient_id",
        "first_name",
        "last_name",
        "phone",
        "email",
    )

    list_filter = (
        "gender",
        "status",
        "last_visit",
    )

    readonly_fields = (
        "patient_id",
        "created_at",
        "updated_at",
    )


# ============================================================
# APPOINTMENT
# ============================================================

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):

    list_display = (
        "patient_name",
        "date",
        "time",
        "test_type",
        "doctor",
        "status",
        "created_at",
    )

    search_fields = (
        "patient_name",
        "test_type",
        "doctor__name",
    )

    list_filter = (
        "status",
        "date",
        "doctor",
    )


# ============================================================
# INVOICE ITEM
# ============================================================

class InvoiceItemInline(admin.TabularInline):

    model = InvoiceItem
    extra = 0


# ============================================================
# INVOICE
# ============================================================

@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "patient_name",
        "phone",
        "subtotal",
        "discount",
        "total",
        "payment_method",
        "created_at",
    )

    search_fields = (
        "patient_name",
        "phone",
        "doctor_name",
    )

    list_filter = (
        "payment_method",
        "created_at",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )

    inlines = (
        InvoiceItemInline,
    )


# ============================================================
# DASHBOARD
# ============================================================

@admin.register(DashboardStats)
class DashboardStatsAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "total_patients",
        "todays_patients",
        "revenue_mtd",
        "pending_reports",
        "appointments_count",
        "inventory_alerts",
        "updated_at",
    )

    readonly_fields = (
        "updated_at",
    )


# ============================================================
# ACTIVITY
# ============================================================

@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "title",
        "activity_type",
        "time_ago",
        "created_at",
    )

    search_fields = (
        "title",
        "description",
    )

    list_filter = (
        "activity_type",
        "created_at",
    )

    @admin.display(description="Time Ago")
    def time_ago(self, obj):
        return obj.time_ago_display


# ============================================================
# SCHEDULE
# ============================================================

@admin.register(Schedule)
class ScheduleAdmin(admin.ModelAdmin):

    list_display = (
        "patient_name",
        "time_slot",
        "badge_type",
        "is_completed",
        "created_at",
    )

    search_fields = (
        "patient_name",
        "tests_summary",
    )

    list_filter = (
        "badge_type",
        "is_completed",
    )


# ============================================================
# INVENTORY
# ============================================================

@admin.register(InventoryItem)
class InventoryItemAdmin(admin.ModelAdmin):

    list_display = (
        "name",
        "category",
        "stock",
        "unit",
        "supplier",
        "expiry",
        "alert",
    )

    search_fields = (
        "name",
        "supplier",
        "category",
    )

    list_filter = (
        "category",
        "alert",
        "expiry",
    )


# ============================================================
# PURCHASE ORDER
# ============================================================

@admin.register(PurchaseOrder)
class PurchaseOrderAdmin(admin.ModelAdmin):

    list_display = (
        "order_id",
        "supplier",
        "status",
        "created_at",
    )

    search_fields = (
        "order_id",
        "supplier",
    )

    list_filter = (
        "status",
        "created_at",
    )


# ============================================================
# REPORT METRIC
# ============================================================

@admin.register(ReportMetric)
class ReportMetricAdmin(admin.ModelAdmin):

    list_display = (
        "report_title",
        "department",
        "total_revenue",
        "patient_count",
        "status",
        "generated_date",
    )

    search_fields = (
        "report_title",
        "department",
    )

    list_filter = (
        "department",
        "status",
        "generated_date",
    )


# ============================================================
# LABORATORY SETTINGS
# ============================================================
#
# IMPORTANT:
# Previous admin errors showed that these fields are NOT
# available on the current LaboratorySettings model:
#
#   system_theme
#   smtp_email
#   backup_frequency
#   primary_color
#
# Therefore they are intentionally NOT referenced here.
#
# ============================================================

@admin.register(LaboratorySettings)
class LaboratorySettingsAdmin(admin.ModelAdmin):

    list_display = (
        "id",
    )

    ordering = (
        "id",
    )


# ============================================================
# STAFF
# ============================================================

@admin.register(StaffMember)
class StaffMemberAdmin(admin.ModelAdmin):

    list_display = (
        "name",
        "role",
        "department",
        "email",
        "status",
        "rating",
        "cert",
    )

    search_fields = (
        "name",
        "email",
        "role",
        "department",
        "cert",
    )

    list_filter = (
        "status",
        "department",
        "role",
    )


# ============================================================
# ACCESS ROLE
# ============================================================
#
# "locked" was removed because Django confirmed that the
# current AccessRole model does not have that field.
#
# ============================================================

@admin.register(AccessRole)
class AccessRoleAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "name",
        "created_at",
    )

    search_fields = (
        "name",
        "desc",
    )

    list_filter = (
        "created_at",
    )


# ============================================================
# LAB TEST
# ============================================================

@admin.register(LabTest)
class LabTestAdmin(admin.ModelAdmin):

    list_display = (
        "name",
        "category",
        "sample",
        "department",
        "range_val",
        "price",
        "status",
        "created_at",
    )

    search_fields = (
        "name",
        "category",
        "department",
        "sample",
    )

    list_filter = (
        "status",
        "category",
        "department",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )


# ============================================================
# TEST PACKAGE
# ============================================================

@admin.register(TestPackage)
class TestPackageAdmin(admin.ModelAdmin):

    list_display = (
        "name",
        "price",
        "tag",
        "created_at",
    )

    search_fields = (
        "name",
        "tag",
    )

    list_filter = (
        "tag",
        "created_at",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )
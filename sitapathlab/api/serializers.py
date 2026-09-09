from rest_framework import serializers

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


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = "__all__"


class DoctorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Doctor
        fields = "__all__"


class PatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = [
            "id",
            "patient_id",
            "first_name",
            "last_name",
            "gender",
            "age",
            "phone",
            "email",
            "address",
            "status",
            "last_visit",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "patient_id",
            "created_at",
            "updated_at",
        ]


class AppointmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = "__all__"

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]


class InvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceItem
        fields = "__all__"

        read_only_fields = [
            "id",
        ]


class InvoiceSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(
        many=True,
        read_only=True
    )

    class Meta:
        model = Invoice
        fields = [
            "id",
            "patient",
            "patient_name",
            "phone",
            "doctor_name",
            "subtotal",
            "discount",
            "total",
            "payment_method",
            "created_at",
            "updated_at",
            "items",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]


class DashboardStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = DashboardStats
        fields = "__all__"


class ActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Activity
        fields = "__all__"


class ScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Schedule
        fields = "__all__"


class InventoryItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryItem
        fields = "__all__"

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]


class PurchaseOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseOrder
        fields = "__all__"

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]


class ReportMetricSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportMetric
        fields = "__all__"


class LaboratorySettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = LaboratorySettings
        fields = "__all__"

        read_only_fields = [
            "id",
            "updated_at",
        ]


class StaffMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = StaffMember
        fields = "__all__"

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]


class AccessRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = AccessRole
        fields = "__all__"

        read_only_fields = [
            "id",
            "created_at",
        ]


class LabTestSerializer(serializers.ModelSerializer):
    range = serializers.CharField(
        source="range_val"
    )

    class Meta:
        model = LabTest

        fields = [
            "id",
            "name",
            "category",
            "sample",
            "department",
            "range",
            "price",
            "status",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]


class TestPackageSerializer(serializers.ModelSerializer):
    tests = serializers.JSONField(
        source="tests_included"
    )

    class Meta:
        model = TestPackage

        fields = [
            "id",
            "name",
            "price",
            "tests",
            "tag",
            "tag_icon",
            "tag_color",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]
from django.urls import path
from . import views


urlpatterns = [

    # =========================================================
    # FRONTEND / PAGES
    # =========================================================
    path(
        "",
        views.landing_view,
        name="landing"
    ),
     path(
            "product/",
            views.product_view,
            name="product"
        ),
    path("/",
        views.home_view,
         name="index"
        ),
    path(
        "dashboard/",
        views.home_view,
        name="home"
    ),

    path(
        "index/",
        views.home_view,
        name="index"
    ),

    path(
        "dashboard/",
        views.dashboard_view,
        name="dashboard"
    ),

    path(
        "dashboard/ui/",
        views.dashboard_view,
        name="dashboard_ui"
    ),

    path(
        "patients/",
        views.patients_view,
        name="patients"
    ),

    path(
        "patients-ui/",
        views.patients_view,
        name="patients_ui"
    ),

    path(
        "register/",
        views.register_view,
        name="register"
    ),

    path(
        "results/",
        views.results_view,
        name="results"
    ),

    path(
        "results-ui/",
        views.results_view,
        name="results_ui"
    ),

    path(
        "reports/",
        views.reports_view,
        name="reports"
    ),

    path(
        "reports-ui/",
        views.reports_view,
        name="reports_ui"
    ),

    path(
        "billing/",
        views.billing_view,
        name="billing"
    ),

    path(
        "billing-ui/",
        views.billing_view,
        name="billing_ui"
    ),

    path(
        "tests/",
        views.tests_page_view,
        name="tests"
    ),

    path(
        "tests-ui/",
        views.tests_page_view,
        name="tests_ui"
    ),

    path(
        "appointments/",
        views.appointments_view,
        name="appointments"
    ),

    path(
        "appointments-ui/",
        views.appointments_view,
        name="appointments_ui"
    ),

    path(
        "inventory/",
        views.inventory_view,
        name="inventory"
    ),

    path(
        "inventory-ui/",
        views.inventory_view,
        name="inventory_ui"
    ),

    path(
        "staff/",
        views.staff_view,
        name="staff"
    ),

    path(
        "staff-ui/",
        views.staff_view,
        name="staff_ui"
    ),

    path(
        "settings/",
        views.settings_view,
        name="settings"
    ),

    path(
        "settings-ui/",
        views.settings_view,
        name="settings_ui"
    ),

    path(
        "profile/",
        views.profile_view,
        name="profile"
    ),

    path(
        "login/",
        views.login_view,
        name="login"
    ),

    path(
        "logout/",
        views.logout_view,
        name="logout"
    ),

    path(
        "analytics/",
        views.analytics_page_view,
        name="analytics"
    ),

    path(
        "doctors/",
        views.doctors_view,
        name="doctors"
    ),


    # =========================================================
    # AUTH / COMMON API
    # =========================================================

    path(
        "api/csrf/",
        views.get_csrf_token,
        name="csrf_token"
    ),


    # =========================================================
    # PATIENT API
    # =========================================================

    path(
        "api/patients/",
        views.patients_api,
        name="patients_api"
    ),

    path(
        "api/patients/save/",
        views.save_patient,
        name="save_patient"
    ),

    path(
        "api/patients/<str:patient_id>/delete/",
        views.delete_patient,
        name="delete_patient"
    ),


    # =========================================================
    # APPOINTMENT API
    # =========================================================

    path(
        "api/appointments/",
        views.appointments_api,
        name="appointments_api"
    ),

    path(
        "api/appointments/list/",
        views.appointments_api,
        name="appointments_list"
    ),

    path(
        "api/appointments/<int:pk>/",
        views.appointment_detail_api,
        name="appointment_detail_api"
    ),


    # =========================================================
    # DOCTOR API
    # =========================================================

    path(
        "api/doctors/",
        views.doctors_api,
        name="doctors_api"
    ),


    # =========================================================
    # BILLING / INVOICE API
    # =========================================================

    path(
        "api/invoices/create/",
        views.create_invoice,
        name="create_invoice"
    ),

    path(
        "api/invoices/<int:pk>/pdf/",
        views.download_invoice_pdf,
        name="download_invoice_pdf"
    ),


    # =========================================================
    # TEST API
    # =========================================================

    path(
        "api/tests/",
        views.get_tests,
        name="get_tests"
    ),

    path(
        "api/tests/data/",
        views.get_tests_and_packages,
        name="tests_data"
    ),

    path(
        "api/tests/list/",
        views.get_tests_and_packages,
        name="get_tests_and_packages"
    ),

    path(
        "api/tests/manage/",
        views.manage_test_api,
        name="manage_test_api"
    ),


    # =========================================================
    # PACKAGE API
    # =========================================================

    path(
        "api/packages/",
        views.packages_api,
        name="packages_api"
    ),


    # =========================================================
    # DASHBOARD API
    # =========================================================

    path(
        "api/dashboard-data/",
        views.dashboard_api_data,
        name="dashboard_data"
    ),

    path(
        "api/dashboard/stats/",
        views.dashboard_api_data,
        name="dashboard_stats"
    ),


    # =========================================================
    # INVENTORY API
    # =========================================================

    path(
        "api/inventory/",
        views.get_inventory_data,
        name="get_inventory_data"
    ),

    path(
        "api/inventory/list/",
        views.get_inventory_data,
        name="get_inventory_data_list"
    ),

    path(
        "api/inventory/add/",
        views.add_inventory_item,
        name="add_inventory_item"
    ),

    path(
        "api/inventory/<int:pk>/update-stock/",
        views.update_stock,
        name="update_stock"
    ),

    path(
        "api/inventory/update/<int:item_id>/",
        views.update_inventory_item,
        name="update_inventory_item"
    ),

    path(
        "api/inventory/delete/<int:item_id>/",
        views.delete_inventory_item,
        name="delete_inventory_item"
    ),


    # =========================================================
    # ANALYTICS API
    # =========================================================

    path(
        "api/analytics/",
        views.get_analytics_data,
        name="get_analytics_data"
    ),

    path(
        "api/analytics/data/",
        views.get_analytics_data,
        name="analytics_data"
    ),

    path(
        "api/reports/generate/",
        views.generate_report_api,
        name="generate_report_api"
    ),

    path(
        "api/analytics/report/",
        views.generate_report_api,
        name="analytics_report_api"
    ),


    # =========================================================
    # SETTINGS API
    # =========================================================

    # GET
    # Fetch laboratory settings
    path(
        "api/settings/",
        views.get_settings,
        name="get_settings"
    ),

    # POST
    # Update laboratory settings
    path(
        "api/settings/update/",
        views.update_settings,
        name="update_settings"
    ),

    # POST
    # Trigger database backup
    path(
        "api/settings/backup/",
        views.trigger_backup,
        name="trigger_backup"
    ),

    # POST
    # Generate / revoke API key
    path(
        "api/settings/api-key/",
        views.manage_api_key,
        name="manage_api_key"
    ),


    # =========================================================
    # STAFF / ROLE API
    # =========================================================

    path(
        "api/staff/data/",
        views.get_staff_and_roles,
        name="staff_data"
    ),

    path(
        "api/staff/list/",
        views.get_staff_and_roles,
        name="get_staff_and_roles"
    ),

    path(
        "api/staff/add/",
        views.add_staff_api,
        name="add_staff_api"
    ),

    path(
        "api/roles/add/",
        views.add_role_api,
        name="add_role_api"
    ),

    path(
        "api/permissions/audit/",
        views.permissions_audit_api,
        name="permissions_audit_api"
    ),

]
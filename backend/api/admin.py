from django.contrib import admin
from .models import (
    Organization, OrganizationMember,
    Department, Employee,
    LeaveType, LeaveRequest,
    Attendance, Document, Payroll,
    ScreenCaptureSchedule, ScreenshotCapture
)


# ==================== ORGANIZATION ====================

@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'plan', 'max_employees', 'is_active', 'created_at')
    list_filter = ('plan', 'is_active', 'created_at')
    search_fields = ('name', 'slug', 'email')
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Informations de base', {
            'fields': ('name', 'slug', 'description')
        }),
        ('Branding', {
            'fields': ('logo', 'primary_color')
        }),
        ('Abonnement', {
            'fields': ('plan', 'max_employees')
        }),
        ('Contact', {
            'fields': ('email', 'phone', 'address', 'website')
        }),
        ('Paramètres', {
            'fields': ('timezone', 'date_format', 'currency')
        }),
        ('Statut', {
            'fields': ('is_active', 'created_at', 'updated_at')
        }),
    )


@admin.register(OrganizationMember)
class OrganizationMemberAdmin(admin.ModelAdmin):
    list_display = ('user', 'organization', 'role', 'is_active', 'joined_at')
    list_filter = ('role', 'is_active', 'organization')
    search_fields = ('user__username', 'user__email', 'organization__name')
    readonly_fields = ('joined_at',)


# ==================== DEPARTMENT ====================

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'organization', 'manager', 'is_active', 'created_at')
    list_filter = ('organization', 'is_active', 'created_at')
    search_fields = ('name', 'code', 'description')
    readonly_fields = ('created_at', 'updated_at')
    autocomplete_fields = ('manager', 'parent')


# ==================== EMPLOYEE ====================

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = (
        'employee_id', 'full_name', 'email', 'position',
        'department', 'status', 'hire_date'
    )
    list_filter = ('organization', 'department', 'status', 'employment_type', 'is_active')
    search_fields = ('employee_id', 'first_name', 'last_name', 'email', 'position')
    readonly_fields = ('created_at', 'updated_at')
    autocomplete_fields = ('department', 'manager', 'user')
    
    fieldsets = (
        ('Organisation', {
            'fields': ('organization', 'user')
        }),
        ('Informations personnelles', {
            'fields': (
                'employee_id', 'first_name', 'last_name', 'email', 'phone',
                'date_of_birth', 'gender'
            )
        }),
        ('Adresse', {
            'fields': (
                'address_line1', 'address_line2', 'city', 'state',
                'postal_code', 'country'
            ),
            'classes': ('collapse',)
        }),
        ('Informations professionnelles', {
            'fields': (
                'position', 'employment_type', 'department', 'manager',
                'hire_date', 'termination_date'
            )
        }),
        ('Salaire', {
            'fields': ('salary', 'salary_currency'),
            'classes': ('collapse',)
        }),
        ('Documents', {
            'fields': ('profile_photo', 'resume'),
            'classes': ('collapse',)
        }),
        ('Congés', {
            'fields': ('annual_leave_days', 'sick_leave_days')
        }),
        ('Statut', {
            'fields': ('status', 'is_active', 'created_at', 'updated_at')
        }),
    )


# ==================== LEAVE ====================

@admin.register(LeaveType)
class LeaveTypeAdmin(admin.ModelAdmin):
    list_display = (
        'name', 'code', 'organization', 'is_paid',
        'requires_approval', 'max_days_per_year', 'is_active'
    )
    list_filter = ('organization', 'is_paid', 'requires_approval', 'is_active')
    search_fields = ('name', 'code', 'description')


@admin.register(LeaveRequest)
class LeaveRequestAdmin(admin.ModelAdmin):
    list_display = (
        'employee', 'leave_type', 'start_date', 'end_date',
        'total_days', 'status', 'created_at'
    )
    list_filter = ('organization', 'status', 'leave_type', 'start_date')
    search_fields = ('employee__first_name', 'employee__last_name', 'reason')
    readonly_fields = ('total_days', 'created_at', 'updated_at', 'approved_at')
    autocomplete_fields = ('employee', 'approved_by')
    
    fieldsets = (
        ('Demande', {
            'fields': ('organization', 'employee', 'leave_type')
        }),
        ('Dates', {
            'fields': ('start_date', 'end_date', 'total_days')
        }),
        ('Détails', {
            'fields': ('reason', 'attachment')
        }),
        ('Workflow', {
            'fields': (
                'status', 'approved_by', 'approved_at', 'rejection_reason'
            )
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


# ==================== ATTENDANCE ====================

@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = (
        'employee', 'date', 'check_in', 'check_out',
        'hours_worked', 'status'
    )
    list_filter = ('organization', 'status', 'date')
    search_fields = ('employee__first_name', 'employee__last_name')
    readonly_fields = ('created_at', 'updated_at')
    autocomplete_fields = ('employee',)
    date_hierarchy = 'date'


# ==================== DOCUMENT ====================

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = (
        'title', 'employee', 'category', 'uploaded_by', 'uploaded_at'
    )
    list_filter = ('organization', 'category', 'uploaded_at')
    search_fields = ('title', 'employee__first_name', 'employee__last_name', 'description')
    readonly_fields = ('uploaded_at',)
    autocomplete_fields = ('employee', 'uploaded_by')


# ==================== PAYROLL ====================

@admin.register(Payroll)
class PayrollAdmin(admin.ModelAdmin):
    list_display = (
        'employee', 'month', 'year', 'net_salary',
        'status', 'payment_date'
    )
    list_filter = ('organization', 'status', 'year', 'month')
    search_fields = ('employee__first_name', 'employee__last_name')
    readonly_fields = ('created_at', 'updated_at')
    autocomplete_fields = ('employee',)
    
    fieldsets = (
        ('Employé', {
            'fields': ('organization', 'employee', 'month', 'year')
        }),
        ('Montants', {
            'fields': ('base_salary', 'bonuses', 'deductions', 'net_salary')
        }),
        ('Statut', {
            'fields': ('status', 'payment_date', 'notes')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


# ==================== SCREEN MONITORING ====================

@admin.register(ScreenCaptureSchedule)
class ScreenCaptureScheduleAdmin(admin.ModelAdmin):
    list_display = ('organization', 'is_enabled', 'work_start', 'work_end', 'captures_per_day', 'retention_days')
    list_filter = ('is_enabled', 'organization')
    search_fields = ('organization__name',)
    readonly_fields = ('created_at', 'updated_at')


@admin.register(ScreenshotCapture)
class ScreenshotCaptureAdmin(admin.ModelAdmin):
    list_display = ('employee', 'organization', 'session_date', 'captured_at', 'is_flagged')
    list_filter = ('organization', 'is_flagged', 'session_date')
    search_fields = ('employee__first_name', 'employee__last_name', 'employee__employee_id', 'flag_reason')
    readonly_fields = ('captured_at', 'created_at')
    autocomplete_fields = ('employee', 'organization')

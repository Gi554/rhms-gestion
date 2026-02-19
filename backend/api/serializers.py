from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Organization, OrganizationMember,
    Department, Employee,
    LeaveType, LeaveRequest,
    Attendance, Document, Payroll,
    Project, Event, Notification
)


# ==================== USER & AUTH ====================

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff', 'is_superuser']
        read_only_fields = ['id']

class UserProfileSerializer(serializers.ModelSerializer):
    employee_profile = serializers.SerializerMethodField()
    organizations = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff', 'is_superuser', 'employee_profile', 'organizations']
        
    def get_employee_profile(self, obj):
        if hasattr(obj, 'employee_profile'):
            employee = obj.employee_profile
            return {
                'id': employee.id,
                'employee_id': employee.employee_id,
                'position': employee.position,
                'organization_id': employee.organization.id,
                'profile_photo': employee.profile_photo.url if employee.profile_photo else None
            }
        return None
        
    def get_organizations(self, obj):
        memberships = obj.organization_memberships.filter(is_active=True)
        return [{
            'id': m.organization.id,
            'name': m.organization.name,
            'role': m.role
        } for m in memberships]


# ==================== ORGANIZATION ====================

class OrganizationSerializer(serializers.ModelSerializer):
    employee_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Organization
        fields = [
            'id', 'name', 'slug', 'description', 'logo', 'digital_stamp',
            'primary_color', 'plan', 'max_employees', 'employee_count',
            'email', 'phone', 'address', 'website', 'siret',
            'timezone', 'date_format', 'currency',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'employee_count']
    
    def get_employee_count(self, obj):
        return obj.employees.filter(is_active=True).count()


class OrganizationMemberSerializer(serializers.ModelSerializer):
    user_detail = UserSerializer(source='user', read_only=True)
    organization_detail = OrganizationSerializer(source='organization', read_only=True)
    
    class Meta:
        model = OrganizationMember
        fields = [
            'id', 'organization', 'organization_detail',
            'user', 'user_detail', 'role',
            'is_active', 'joined_at'
        ]
        read_only_fields = ['id', 'joined_at']


# ==================== DEPARTMENT ====================

class DepartmentSerializer(serializers.ModelSerializer):
    manager_detail = serializers.SerializerMethodField()
    employee_count = serializers.SerializerMethodField()
    parent_detail = serializers.SerializerMethodField()
    
    class Meta:
        model = Department
        fields = [
            'id', 'organization', 'name', 'code', 'description',
            'parent', 'parent_detail', 'manager', 'manager_detail',
            'employee_count', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_manager_detail(self, obj):
        if obj.manager:
            return {
                'id': obj.manager.id,
                'full_name': obj.manager.full_name,
                'employee_id': obj.manager.employee_id
            }
        return None
    
    def get_employee_count(self, obj):
        return obj.employees.filter(is_active=True).count()
    
    def get_parent_detail(self, obj):
        if obj.parent:
            return {
                'id': obj.parent.id,
                'name': obj.parent.name
            }
        return None


# ==================== EMPLOYEE ====================

class EmployeeListSerializer(serializers.ModelSerializer):
    """Serializer léger pour les listes"""
    department_detail = serializers.SerializerMethodField()
    manager_detail = serializers.SerializerMethodField()
    
    class Meta:
        model = Employee
        fields = [
            'id', 'employee_id', 'first_name', 'last_name', 'full_name',
            'email', 'phone', 'position', 'employment_type',
            'department', 'department_detail', 'manager', 'manager_detail',
            'hire_date', 'status', 'profile_photo'
        ]
    
    def get_department_detail(self, obj):
        if obj.department:
            return {
                'id': obj.department.id,
                'name': obj.department.name
            }
        return None
    
    def get_manager_detail(self, obj):
        if obj.manager:
            return {
                'id': obj.manager.id,
                'full_name': obj.manager.full_name
            }
        return None


class EmployeeDetailSerializer(serializers.ModelSerializer):
    """Serializer complet pour les détails"""
    department_detail = DepartmentSerializer(source='department', read_only=True)
    manager_detail = EmployeeListSerializer(source='manager', read_only=True)
    user_detail = UserSerializer(source='user', read_only=True)
    subordinates_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Employee
        fields = [
            'id', 'organization', 'user', 'user_detail',
            'employee_id', 'first_name', 'last_name', 'full_name',
            'email', 'phone', 'date_of_birth', 'gender',
            'address_line1', 'address_line2', 'city', 'state',
            'postal_code', 'country',
            'position', 'employment_type', 'hire_date', 'termination_date',
            'department', 'department_detail', 'manager', 'manager_detail',
            'subordinates_count',
            'salary', 'salary_currency',
            'profile_photo', 'resume',
            'annual_leave_days', 'sick_leave_days',
            'status', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'employee_id', 'full_name', 'created_at', 'updated_at']
    
    def get_subordinates_count(self, obj):
        return obj.subordinates.filter(is_active=True).count()


# ==================== LEAVE ====================

class LeaveTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveType
        fields = [
            'id', 'organization', 'name', 'code', 'description',
            'is_paid', 'requires_approval', 'max_days_per_year',
            'color', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class LeaveRequestListSerializer(serializers.ModelSerializer):
    """Serializer pour les listes de congés"""
    employee_detail = serializers.SerializerMethodField()
    leave_type_detail = LeaveTypeSerializer(source='leave_type', read_only=True)
    approved_by_detail = serializers.SerializerMethodField()
    
    class Meta:
        model = LeaveRequest
        fields = [
            'id', 'organization', 'employee', 'employee_detail',
            'leave_type', 'leave_type_detail',
            'start_date', 'end_date', 'total_days',
            'reason', 'status', 'approved_by', 'approved_by_detail',
            'rejection_reason', 'created_at'
        ]
        read_only_fields = ['id', 'total_days', 'created_at']
        extra_kwargs = {
            'employee': {'required': False},
            'organization': {'required': False}
        }
    
    def get_employee_detail(self, obj):
        return {
            'id': obj.employee.id,
            'full_name': obj.employee.full_name,
            'employee_id': obj.employee.employee_id,
            'profile_photo': obj.employee.profile_photo.url if obj.employee.profile_photo else None
        }

    def get_approved_by_detail(self, obj):
        if obj.approved_by:
            return {
                'id': obj.approved_by.id,
                'full_name': obj.approved_by.full_name
            }
        return None


class LeaveRequestDetailSerializer(serializers.ModelSerializer):
    """Serializer complet pour les détails"""
    employee_detail = EmployeeListSerializer(source='employee', read_only=True)
    leave_type_detail = LeaveTypeSerializer(source='leave_type', read_only=True)
    approved_by_detail = serializers.SerializerMethodField()
    
    class Meta:
        model = LeaveRequest
        fields = [
            'id', 'organization', 'employee', 'employee_detail',
            'leave_type', 'leave_type_detail',
            'start_date', 'end_date', 'total_days',
            'reason', 'attachment',
            'status', 'approved_by', 'approved_by_detail',
            'approved_at', 'rejection_reason',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'total_days', 'created_at', 'updated_at']
        extra_kwargs = {
            'employee': {'required': False},
            'organization': {'required': False}
        }
    
    def get_approved_by_detail(self, obj):
        if obj.approved_by:
            return {
                'id': obj.approved_by.id,
                'full_name': obj.approved_by.full_name
            }
        return None

    def validate(self, data):
        """Validation des dates"""
        if data.get('start_date') and data.get('end_date'):
            if data['end_date'] < data['start_date']:
                raise serializers.ValidationError({
                    "non_field_errors": "La date de fin ne peut pas être antérieure à la date de début."
                })
        return data


# ==================== ATTENDANCE ====================

class AttendanceSerializer(serializers.ModelSerializer):
    employee_detail = serializers.SerializerMethodField()
    
    class Meta:
        model = Attendance
        fields = [
            'id', 'organization', 'employee', 'employee_detail',
            'date', 'check_in', 'check_out',
            'status', 'hours_worked', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_employee_detail(self, obj):
        return {
            'id': obj.employee.id,
            'full_name': obj.employee.full_name,
            'employee_id': obj.employee.employee_id
        }


# ==================== DOCUMENT ====================

class DocumentSerializer(serializers.ModelSerializer):
    employee_detail = serializers.SerializerMethodField()
    uploaded_by_detail = UserSerializer(source='uploaded_by', read_only=True)
    file_size = serializers.SerializerMethodField()
    
    class Meta:
        model = Document
        fields = [
            'id', 'organization', 'employee', 'employee_detail',
            'title', 'category', 'file', 'file_size', 'description',
            'uploaded_by', 'uploaded_by_detail', 'uploaded_at'
        ]
        read_only_fields = ['id', 'uploaded_at']
    
    def get_employee_detail(self, obj):
        return {
            'id': obj.employee.id,
            'full_name': obj.employee.full_name
        }
    
    def get_file_size(self, obj):
        if obj.file:
            return obj.file.size
        return 0


# ==================== PAYROLL ====================

class PayrollSerializer(serializers.ModelSerializer):
    employee_detail = EmployeeListSerializer(source='employee', read_only=True)
    
    class Meta:
        model = Payroll
        fields = [
            'id', 'organization', 'employee', 'employee_detail',
            'month', 'year',
            'base_salary', 'bonuses', 'deductions', 'net_salary',
            'status', 'payment_date', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


# ==================== WIDGETS ====================

class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = '__all__'


class NotificationSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.get_full_name', read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id', 'recipient', 'sender', 'sender_name', 'type', 
            'title', 'message', 'link', 'is_read', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = [
            'id', 'organization', 'name', 'description',
            'due_date', 'status', 'icon_emoji', 'color', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

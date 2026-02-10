from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count
from django.utils import timezone
import datetime

from .models import (
    Organization, OrganizationMember,
    Department, Employee,
    LeaveType, LeaveRequest,
    Attendance, Document, Payroll,
    Project, Event
)
from .serializers import (
    OrganizationSerializer, OrganizationMemberSerializer,
    DepartmentSerializer,
    EmployeeListSerializer, EmployeeDetailSerializer,
    LeaveTypeSerializer, LeaveRequestListSerializer, LeaveRequestDetailSerializer,
    AttendanceSerializer, DocumentSerializer, PayrollSerializer,
    ProjectSerializer, EventSerializer
)
from .permissions import (
    IsOrganizationMember, IsOrganizationAdmin,
    IsManagerOrAdmin, IsOwnerOrReadOnly
)


# ==================== MIXINS ====================

class OrganizationFilterMixin:
    """Mixin pour filtrer automatiquement par organisation de l'utilisateur"""
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # Superuser voit tout
        if user.is_superuser:
            return queryset
        
        # Filtrer par organisations de l'utilisateur
        user_orgs = user.organization_memberships.filter(
            is_active=True
        ).values_list('organization_id', flat=True)
        
        return queryset.filter(organization_id__in=user_orgs)


# ==================== ORGANIZATION ====================

class OrganizationViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les organisations
    """
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'slug', 'email']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    
    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Organization.objects.all()
        
        # Utilisateur voit uniquement ses organisations
        return Organization.objects.filter(
            members__user=user,
            members__is_active=True
        ).distinct()
    
    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """Statistiques de l'organisation"""
        org = self.get_object()
        
        stats = {
            'total_employees': org.employees.filter(is_active=True).count(),
            'total_departments': org.departments.filter(is_active=True).count(),
            'pending_leaves': org.leave_requests.filter(status='pending').count(),
            'active_members': org.members.filter(is_active=True).count(),
        }
        
        return Response(stats)
    
    @action(detail=True, methods=['get'])
    def activity_chart(self, request, pk=None):
        """Statistiques d'activité (Présences sur les 7 derniers jours)"""
        org = self.get_object()
        today = timezone.now().date()
        last_7_days = [today - datetime.timedelta(days=i) for i in range(6, -1, -1)]
        
        data = []
        labels = [] # L, M, M, J, V, S, D
        
        days_map = {
            0: 'L', 1: 'M', 2: 'M', 3: 'J', 4: 'V', 5: 'S', 6: 'D'
        }
        
        for day in last_7_days:
            count = Attendance.objects.filter(
                organization=org,
                date=day,
                status=Attendance.STATUS_PRESENT
            ).count()
            
            data.append(count)
            labels.append(days_map[day.weekday()])
            
        return Response({
            'labels': labels,
            'data': data
        })


class OrganizationMemberViewSet(OrganizationFilterMixin, viewsets.ModelViewSet):
    """
    ViewSet pour gérer les membres d'organisation
    """
    queryset = OrganizationMember.objects.all()
    serializer_class = OrganizationMemberSerializer
    permission_classes = [IsAuthenticated, IsOrganizationAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['organization', 'role', 'is_active']
    search_fields = ['user__username', 'user__email', 'user__first_name', 'user__last_name']


# ==================== DEPARTMENT ====================

class DepartmentViewSet(OrganizationFilterMixin, viewsets.ModelViewSet):
    """
    ViewSet pour gérer les départements
    """
    queryset = Department.objects.select_related('organization', 'manager', 'parent').all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated, IsOrganizationMember]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['organization', 'is_active', 'parent']
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    
    @action(detail=True, methods=['get'])
    def employees(self, request, pk=None):
        """Liste des employés du département"""
        department = self.get_object()
        employees = department.employees.filter(is_active=True)
        serializer = EmployeeListSerializer(employees, many=True)
        return Response(serializer.data)


# ==================== EMPLOYEE ====================

class EmployeeViewSet(OrganizationFilterMixin, viewsets.ModelViewSet):
    """
    ViewSet pour gérer les employés
    """
    queryset = Employee.objects.select_related(
        'organization', 'department', 'manager', 'user'
    ).all()
    permission_classes = [IsAuthenticated, IsOrganizationMember]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['organization', 'department', 'status', 'employment_type', 'is_active']
    search_fields = ['first_name', 'last_name', 'email', 'employee_id', 'position']
    ordering_fields = ['last_name', 'first_name', 'hire_date', 'created_at']
    ordering = ['last_name', 'first_name']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return EmployeeListSerializer
        return EmployeeDetailSerializer
    
    @action(detail=True, methods=['get'])
    def subordinates(self, request, pk=None):
        """Liste des subordonnés"""
        employee = self.get_object()
        subordinates = employee.subordinates.filter(is_active=True)
        serializer = EmployeeListSerializer(subordinates, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def leave_balance(self, request, pk=None):
        """Solde de congés de l'employé"""
        employee = self.get_object()
        
        # Calculer les congés utilisés cette année
        current_year = timezone.now().year
        
        used_leaves = employee.leave_requests.filter(
            start_date__year=current_year,
            status='approved'
        ).aggregate(total=models.Sum('total_days'))['total'] or 0
        
        balance = {
            'annual_leave_total': employee.annual_leave_days,
            'annual_leave_used': used_leaves,
            'annual_leave_remaining': employee.annual_leave_days - used_leaves,
            'sick_leave_total': employee.sick_leave_days,
        }
        
        return Response(balance)


# ==================== LEAVE ====================

class LeaveTypeViewSet(OrganizationFilterMixin, viewsets.ModelViewSet):
    """
    ViewSet pour gérer les types de congés
    """
    queryset = LeaveType.objects.all()
    serializer_class = LeaveTypeSerializer
    permission_classes = [IsAuthenticated, IsOrganizationMember]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['organization', 'is_active', 'is_paid', 'requires_approval']
    search_fields = ['name', 'code']
    ordering = ['name']


class LeaveRequestViewSet(OrganizationFilterMixin, viewsets.ModelViewSet):
    """
    ViewSet pour gérer les demandes de congés
    """
    queryset = LeaveRequest.objects.select_related(
        'organization', 'employee', 'leave_type', 'approved_by'
    ).all()
    permission_classes = [IsAuthenticated, IsOrganizationMember]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['organization', 'employee', 'leave_type', 'status']
    search_fields = ['employee__first_name', 'employee__last_name', 'reason']
    ordering_fields = ['start_date', 'created_at']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return LeaveRequestListSerializer
        return LeaveRequestDetailSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # Filtrer selon le rôle
        role = self.request.query_params.get('role', None)
        
        if role == 'my_requests':
            # Mes propres demandes
            if hasattr(user, 'employee_profile'):
                queryset = queryset.filter(employee=user.employee_profile)
        elif role == 'to_approve':
            # Demandes à approuver (si je suis manager)
            if hasattr(user, 'employee_profile'):
                # Demandes des subordonnés
                queryset = queryset.filter(
                    employee__manager=user.employee_profile,
                    status='pending'
                )
        
        return queryset
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsManagerOrAdmin])
    def approve(self, request, pk=None):
        """Approuver une demande de congé"""
        leave_request = self.get_object()
        
        if leave_request.status != 'pending':
            return Response(
                {'error': 'Cette demande a déjà été traitée'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        leave_request.status = 'approved'
        if hasattr(request.user, 'employee_profile'):
            leave_request.approved_by = request.user.employee_profile
        leave_request.approved_at = timezone.now()
        leave_request.save()
        
        serializer = self.get_serializer(leave_request)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsManagerOrAdmin])
    def reject(self, request, pk=None):
        """Rejeter une demande de congé"""
        leave_request = self.get_object()
        
        if leave_request.status != 'pending':
            return Response(
                {'error': 'Cette demande a déjà été traitée'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        leave_request.status = 'rejected'
        leave_request.rejection_reason = request.data.get('reason', '')
        leave_request.save()
        
        serializer = self.get_serializer(leave_request)
        return Response(serializer.data)


# ==================== ATTENDANCE ====================

class AttendanceViewSet(OrganizationFilterMixin, viewsets.ModelViewSet):
    """
    ViewSet pour gérer les présences
    """
    queryset = Attendance.objects.select_related('organization', 'employee').all()
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated, IsOrganizationMember]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['organization', 'employee', 'date', 'status']
    ordering_fields = ['date']
    ordering = ['-date']
    
    @action(detail=False, methods=['get'])
    def my_attendance(self, request):
        """Mes présences"""
        if hasattr(request.user, 'employee_profile'):
            attendances = self.get_queryset().filter(
                employee=request.user.employee_profile
            )
            serializer = self.get_serializer(attendances, many=True)
            return Response(serializer.data)
        return Response([])


# ==================== DOCUMENT ====================

class DocumentViewSet(OrganizationFilterMixin, viewsets.ModelViewSet):
    """
    ViewSet pour gérer les documents
    """
    queryset = Document.objects.select_related('organization', 'employee', 'uploaded_by').all()
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated, IsOrganizationMember]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['organization', 'employee', 'category']
    search_fields = ['title', 'description']
    ordering_fields = ['uploaded_at']
    ordering = ['-uploaded_at']
    
    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)


# ==================== PAYROLL ====================

class PayrollViewSet(OrganizationFilterMixin, viewsets.ModelViewSet):
    """
    ViewSet pour gérer les fiches de paie
    """
    queryset = Payroll.objects.select_related('organization', 'employee').all()
    serializer_class = PayrollSerializer
    permission_classes = [IsAuthenticated, IsOrganizationAdmin]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['organization', 'employee', 'year', 'month', 'status']
    ordering_fields = ['year', 'month']
    ordering = ['-year', '-month']
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_payrolls(self, request):
        """Mes fiches de paie"""
        if hasattr(request.user, 'employee_profile'):
            payrolls = self.get_queryset().filter(
                employee=request.user.employee_profile
            )
            serializer = self.get_serializer(payrolls, many=True)
            return Response(serializer.data)
        return Response([])


# ==================== WIDGETS ====================

class EventViewSet(OrganizationFilterMixin, viewsets.ModelViewSet):
    """
    ViewSet pour afficher les événements (Dashboard)
    """
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated, IsOrganizationMember]
    ordering = ['start_time']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Seulement les événements futurs ou d'aujourd'hui
        return queryset.filter(start_time__gte=timezone.now().date())


class ProjectViewSet(OrganizationFilterMixin, viewsets.ModelViewSet):
    """
    ViewSet pour afficher les projets clés (Dashboard)
    """
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated, IsOrganizationMember]
    ordering = ['due_date']
    filterset_fields = ['status']

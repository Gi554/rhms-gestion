from rest_framework import viewsets, filters, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count
from django.db import transaction
from django.contrib.auth.models import User
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
    ProjectSerializer, EventSerializer, UserProfileSerializer
)
from .permissions import (
    IsOrganizationMember, IsOrganizationAdmin,
    IsManagerOrAdmin, IsOwnerOrReadOnly
)

class MeViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    def list(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['patch'], url_path='update-profile')
    def update_profile(self, request):
        """Mise à jour des informations personnelles"""
        user = request.user
        allowed_fields = ['first_name', 'last_name', 'email']
        for field in allowed_fields:
            if field in request.data:
                setattr(user, field, request.data[field])
        user.save()
        serializer = UserProfileSerializer(user)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='change-password')
    def change_password(self, request):
        """Réinitialisation du mot de passe"""
        user = request.user
        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password")
        
        if not user.check_password(old_password):
            return Response(
                {"detail": "L'ancien mot de passe est incorrect."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        user.set_password(new_password)
        user.save()
        return Response({"detail": "Mot de passe mis à jour avec succès."})


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
    
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated, IsManagerOrAdmin])
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
    
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated, IsManagerOrAdmin])
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
    permission_classes = [IsAuthenticated, IsOrganizationMember, IsManagerOrAdmin]
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
    permission_classes = [IsAuthenticated, IsOrganizationMember, IsManagerOrAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['organization', 'department', 'status', 'employment_type', 'is_active']
    search_fields = ['first_name', 'last_name', 'email', 'employee_id', 'position']
    ordering_fields = ['last_name', 'first_name', 'hire_date', 'created_at']
    ordering = ['last_name', 'first_name']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return EmployeeListSerializer
        return EmployeeDetailSerializer
    
    def perform_create(self, serializer):
        """
        Automate User, ID and OrganizationMember creation when an Employee is added
        """
        with transaction.atomic():
            # 1. Generate automatic employee ID if not provided
            org_id = self.request.data.get('organization')
            if not org_id:
                raise serializers.ValidationError({"organization": "L'organisation est requise."})
                
            org = Organization.objects.get(id=org_id)
            count = Employee.objects.filter(organization=org).count() + 1
            year = timezone.now().year
            auto_id = f"EMP-{year}-{count:04d}"
            
            # 2. Save the employee profile (using auto_id if needed)
            data = serializer.validated_data
            if not data.get('employee_id'):
                data['employee_id'] = auto_id
                
            employee = serializer.save(employee_id=data['employee_id'])
            
            # 3. Check if a user already exists with this email
            user_email = employee.email
            username = user_email.split('@')[0]
            
            user = User.objects.filter(email=user_email).first()
            
            if not user:
                # 3. Create a new Django User
                user = User.objects.create_user(
                    username=username,
                    email=user_email,
                    password='Hrms2026!', # Default temporary password
                    first_name=employee.first_name,
                    last_name=employee.last_name
                )
            
            # 4. Link User to Employee
            employee.user = user
            employee.save()
            
            # 5. Create OrganizationMember for access
            role = self.request.data.get('role', 'employee')
            OrganizationMember.objects.get_or_create(
                organization=employee.organization,
                user=user,
                defaults={'role': role}
            )
    
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
        
        # Les superusers voient tout (via OrganizationFilterMixin)
        if user.is_superuser:
            return queryset
            
        # Déterminer si l'utilisateur est un manager/admin
        is_admin_manager = user.organization_memberships.filter(
            is_active=True, 
            role__in=['manager', 'admin', 'owner']
        ).exists()
        
        # Filtre selon le rôle demandé
        role = self.request.query_params.get('role', None)
        
        if role == 'my_requests' or not is_admin_manager:
            # Mes propres demandes ou l'utilisateur n'est qu'un employé
            if hasattr(user, 'employee_profile'):
                queryset = queryset.filter(employee=user.employee_profile)
            else:
                queryset = queryset.none()
        elif role == 'to_approve' and is_admin_manager:
            # Demandes à approuver (si je suis manager/admin)
            user_member = user.organization_memberships.filter(is_active=True).first()
            user_role = user_member.role if user_member else 'employee'
            
            if user_role in ['admin', 'owner']:
                # Les Admins/Owners voient TOUTES les demandes en attente de l'organisation
                queryset = queryset.filter(status='pending')
                # On exclut ses propres demandes (auto-approbation interdite)
                if hasattr(user, 'employee_profile'):
                    queryset = queryset.exclude(employee=user.employee_profile)
            elif user_role == 'manager':
                # Les Managers voient seulement les demandes de leurs subordonnés directs
                if hasattr(user, 'employee_profile'):
                    queryset = queryset.filter(
                        employee__manager=user.employee_profile,
                        status='pending'
                    )
                else:
                    queryset = queryset.none()
        
        return queryset

    def perform_create(self, serializer):
        """Forcer la demande à être personnelle (liée au demandeur)"""
        user = self.request.user
        employee = getattr(user, 'employee_profile', None)
        
        if not employee:
            raise serializers.ValidationError({"detail": "Vous n'avez pas de profil employé associé à votre compte."})
            
        # On utilise systématiquement l'organisation et l'employé de l'utilisateur connecté
        serializer.save(
            employee=employee, 
            organization=employee.organization
        )
    
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
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        if user.is_superuser:
            return queryset
            
        # Obtenir le rôle de l'utilisateur dans l'organisation (on prend la première par simplicité)
        member = user.organization_memberships.first()
        if not member:
            return Attendance.objects.none()
            
        # Si c'est un manager, admin ou owner, il voit tout l'organisation
        if member.role in ['admin', 'manager', 'owner']:
            return queryset
            
        # Sinon, il ne voit QUE ses propres présences
        if hasattr(user, 'employee_profile'):
            return queryset.filter(employee=user.employee_profile)
            
        return Attendance.objects.none()
    
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

    @action(detail=False, methods=['get'])
    def current_status(self, request):
        """Statut de présence actuel (aujourd'hui)"""
        if not hasattr(request.user, 'employee_profile'):
            return Response({'status': 'none'})
            
        today = timezone.now().date()
        attendance = Attendance.objects.filter(
            employee=request.user.employee_profile,
            date=today
        ).first()
        
        if not attendance:
            return Response({'status': 'none'})
            
        return Response({
            'status': attendance.status,
            'check_in': attendance.check_in,
            'check_out': attendance.check_out,
            'is_clocked_in': attendance.check_in is not None and attendance.check_out is None
        })

    @action(detail=False, methods=['post'])
    def check_in(self, request):
        """Pointer à l'arrivée"""
        if not hasattr(request.user, 'employee_profile'):
            return Response({'error': 'Profil employé non trouvé'}, status=status.HTTP_400_BAD_REQUEST)
            
        employee = request.user.employee_profile
        today = timezone.now().date()
        now_time = timezone.now().time()
        
        attendance, created = Attendance.objects.get_or_create(
            employee=employee,
            date=today,
            defaults={
                'organization': employee.organization,
                'check_in': now_time,
                'status': 'present'
            }
        )
        
        if not created:
            if attendance.check_in:
                return Response({'error': 'Déjà pointé aujourd\'hui'}, status=status.HTTP_400_BAD_REQUEST)
            attendance.check_in = now_time
            attendance.save()
            
        return Response(AttendanceSerializer(attendance).data)

    @action(detail=False, methods=['post'])
    def check_out(self, request):
        """Pointer au départ"""
        if not hasattr(request.user, 'employee_profile'):
            return Response({'error': 'Profil employé non trouvé'}, status=status.HTTP_400_BAD_REQUEST)
            
        employee = request.user.employee_profile
        today = timezone.now().date()
        now_time = timezone.now().time()
        
        attendance = Attendance.objects.filter(employee=employee, date=today).first()
        
        if not attendance or not attendance.check_in:
            return Response({'error': 'Vous devez d\'abord pointer à l\'arrivée'}, status=status.HTTP_400_BAD_REQUEST)
            
        if attendance.check_out:
            return Response({'error': 'Déjà pointé au départ aujourd\'hui'}, status=status.HTTP_400_BAD_REQUEST)
            
        attendance.check_out = now_time
        
        # Calculer les heures travaillées
        import datetime
        dt_in = datetime.datetime.combine(datetime.date.today(), attendance.check_in)
        dt_out = datetime.datetime.combine(datetime.date.today(), now_time)
        diff = dt_out - dt_in
        attendance.hours_worked = diff.total_seconds() / 3600
        
        attendance.save()
        return Response(AttendanceSerializer(attendance).data)


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
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated, IsOrganizationAdmin])
    def generate(self, request):
        """Génère les fiches de paie pour tous les employés pour un mois/année donné"""
        month = request.data.get('month')
        year = request.data.get('year')
        organization = self.get_organization()
        
        if not month or not year:
            return Response({"error": "Le mois et l'année sont requis."}, status=400)
            
        employees = Employee.objects.filter(organization=organization, is_active=True)
        created_count = 0
        skipped_count = 0
        
        for employee in employees:
            # Vérifier si elle existe déjà
            if Payroll.objects.filter(employee=employee, month=month, year=year).exists():
                skipped_count += 1
                continue
            
            # Calcul basique
            base_salary = (employee.salary or 0) / 12
            # Simulation : 22% de retenues, 5% de bonus
            bonuses = base_salary * 0.05
            deductions = base_salary * 0.22
            net_salary = base_salary + bonuses - deductions
            
            Payroll.objects.create(
                organization=organization,
                employee=employee,
                month=month,
                year=year,
                base_salary=base_salary,
                bonuses=bonuses,
                deductions=deductions,
                net_salary=net_salary,
                status='draft'
            )
            created_count += 1
            
        return Response({
            "message": f"Génération terminée: {created_count} créées, {skipped_count} déjà existantes.",
            "created": created_count,
            "skipped": skipped_count
        })

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

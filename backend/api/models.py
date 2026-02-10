from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone


# ==================== MULTI-TENANCY ====================

class Organization(models.Model):
    """Organisation/Entreprise - Tenant principal pour multi-tenancy"""
    
    PLAN_FREE = 'free'
    PLAN_STARTER = 'starter'
    PLAN_PROFESSIONAL = 'professional'
    PLAN_ENTERPRISE = 'enterprise'
    
    PLAN_CHOICES = [
        (PLAN_FREE, 'Free'),
        (PLAN_STARTER, 'Starter'),
        (PLAN_PROFESSIONAL, 'Professional'),
        (PLAN_ENTERPRISE, 'Enterprise'),
    ]
    
    name = models.CharField(max_length=200, unique=True)
    slug = models.SlugField(max_length=200, unique=True)
    description = models.TextField(blank=True)
    
    # Branding
    logo = models.ImageField(upload_to='organizations/logos/', null=True, blank=True)
    primary_color = models.CharField(max_length=7, default='#4F46E5')  # Hex color
    
    # Subscription
    plan = models.CharField(max_length=20, choices=PLAN_CHOICES, default=PLAN_FREE)
    max_employees = models.IntegerField(default=10)  # Limite selon le plan
    
    # Contact
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    website = models.URLField(blank=True)
    
    # Settings
    timezone = models.CharField(max_length=50, default='UTC')
    date_format = models.CharField(max_length=20, default='DD/MM/YYYY')
    currency = models.CharField(max_length=3, default='EUR')
    
    # Metadata
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        verbose_name = 'Organisation'
        verbose_name_plural = 'Organisations'
    
    def __str__(self):
        return self.name


class OrganizationMember(models.Model):
    """Lien entre User et Organization avec rôle"""
    
    ROLE_OWNER = 'owner'
    ROLE_ADMIN = 'admin'
    ROLE_MANAGER = 'manager'
    ROLE_EMPLOYEE = 'employee'
    
    ROLE_CHOICES = [
        (ROLE_OWNER, 'Owner'),
        (ROLE_ADMIN, 'Admin'),
        (ROLE_MANAGER, 'Manager'),
        (ROLE_EMPLOYEE, 'Employee'),
    ]
    
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='organization_memberships')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_EMPLOYEE)
    
    is_active = models.BooleanField(default=True)
    joined_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['organization', 'user']
        ordering = ['organization', '-joined_at']
        verbose_name = 'Membre d\'organisation'
        verbose_name_plural = 'Membres d\'organisation'
    
    def __str__(self):
        return f"{self.user.username} - {self.organization.name} ({self.role})"


# ==================== CORE HR MODELS ====================

class Department(models.Model):
    """Département de l'organisation"""
    
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='departments')
    name = models.CharField(max_length=120)
    code = models.CharField(max_length=20, blank=True)  # Ex: IT, HR, FIN
    description = models.TextField(blank=True)
    
    # Hiérarchie
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='sub_departments')
    manager = models.ForeignKey('Employee', on_delete=models.SET_NULL, null=True, blank=True, related_name='managed_departments')
    
    # Metadata
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['organization', 'name']
        ordering = ['organization', 'name']
        verbose_name = 'Département'
        verbose_name_plural = 'Départements'
    
    def __str__(self):
        return f"{self.name} ({self.organization.name})"


class Employee(models.Model):
    """Employé de l'organisation"""
    
    GENDER_MALE = 'M'
    GENDER_FEMALE = 'F'
    GENDER_OTHER = 'O'
    GENDER_CHOICES = [
        (GENDER_MALE, 'Homme'),
        (GENDER_FEMALE, 'Femme'),
        (GENDER_OTHER, 'Autre'),
    ]
    
    EMPLOYMENT_FULL_TIME = 'full_time'
    EMPLOYMENT_PART_TIME = 'part_time'
    EMPLOYMENT_CONTRACT = 'contract'
    EMPLOYMENT_INTERN = 'intern'
    EMPLOYMENT_CHOICES = [
        (EMPLOYMENT_FULL_TIME, 'Temps plein'),
        (EMPLOYMENT_PART_TIME, 'Temps partiel'),
        (EMPLOYMENT_CONTRACT, 'Contractuel'),
        (EMPLOYMENT_INTERN, 'Stagiaire'),
    ]
    
    STATUS_ACTIVE = 'active'
    STATUS_ON_LEAVE = 'on_leave'
    STATUS_SUSPENDED = 'suspended'
    STATUS_TERMINATED = 'terminated'
    STATUS_CHOICES = [
        (STATUS_ACTIVE, 'Actif'),
        (STATUS_ON_LEAVE, 'En congé'),
        (STATUS_SUSPENDED, 'Suspendu'),
        (STATUS_TERMINATED, 'Terminé'),
    ]
    
    # Relations
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='employees')
    user = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='employee_profile')
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='employees')
    manager = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='subordinates')
    
    # Informations personnelles
    employee_id = models.CharField(max_length=50, unique=True)  # ID unique employé
    first_name = models.CharField(max_length=120)
    last_name = models.CharField(max_length=120)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, blank=True)
    
    # Adresse
    address_line1 = models.CharField(max_length=255, blank=True)
    address_line2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    country = models.CharField(max_length=100, blank=True)
    
    # Informations professionnelles
    position = models.CharField(max_length=120)
    employment_type = models.CharField(max_length=20, choices=EMPLOYMENT_CHOICES, default=EMPLOYMENT_FULL_TIME)
    hire_date = models.DateField()
    termination_date = models.DateField(null=True, blank=True)
    
    # Salaire (optionnel, peut être dans un modèle séparé)
    salary = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    salary_currency = models.CharField(max_length=3, default='EUR')
    
    # Documents
    profile_photo = models.ImageField(upload_to='employees/photos/', null=True, blank=True)
    resume = models.FileField(upload_to='employees/resumes/', null=True, blank=True)
    
    # Congés
    annual_leave_days = models.IntegerField(default=25)  # Jours de congés annuels
    sick_leave_days = models.IntegerField(default=10)
    
    # Statut
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_ACTIVE)
    is_active = models.BooleanField(default=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['organization', 'last_name', 'first_name']
        verbose_name = 'Employé'
        verbose_name_plural = 'Employés'
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.employee_id})"
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"


# ==================== LEAVE MANAGEMENT ====================

class LeaveType(models.Model):
    """Types de congés configurables par organisation"""
    
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='leave_types')
    name = models.CharField(max_length=100)  # Ex: Congé payé, Maladie, Maternité
    code = models.CharField(max_length=20)  # Ex: PAID, SICK, MATERNITY
    description = models.TextField(blank=True)
    
    # Configuration
    is_paid = models.BooleanField(default=True)
    requires_approval = models.BooleanField(default=True)
    max_days_per_year = models.IntegerField(null=True, blank=True)
    
    # Couleur pour le calendrier
    color = models.CharField(max_length=7, default='#4F46E5')
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['organization', 'code']
        ordering = ['organization', 'name']
        verbose_name = 'Type de congé'
        verbose_name_plural = 'Types de congés'
    
    def __str__(self):
        return f"{self.name} ({self.organization.name})"


class LeaveRequest(models.Model):
    """Demande de congé"""
    
    STATUS_PENDING = 'pending'
    STATUS_APPROVED = 'approved'
    STATUS_REJECTED = 'rejected'
    STATUS_CANCELLED = 'cancelled'
    STATUS_CHOICES = [
        (STATUS_PENDING, 'En attente'),
        (STATUS_APPROVED, 'Approuvé'),
        (STATUS_REJECTED, 'Rejeté'),
        (STATUS_CANCELLED, 'Annulé'),
    ]
    
    # Relations
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='leave_requests')
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='leave_requests')
    leave_type = models.ForeignKey(LeaveType, on_delete=models.PROTECT, related_name='requests')
    
    # Dates
    start_date = models.DateField()
    end_date = models.DateField()
    total_days = models.IntegerField(default=0)  # Calculé automatiquement
    
    # Détails
    reason = models.TextField(blank=True)
    attachment = models.FileField(upload_to='leaves/attachments/', null=True, blank=True)
    
    # Workflow
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    approved_by = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_leaves')
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Demande de congé'
        verbose_name_plural = 'Demandes de congés'
    
    def __str__(self):
        return f"{self.employee.full_name} - {self.leave_type.name} ({self.start_date} → {self.end_date})"
    
    def save(self, *args, **kwargs):
        # Calculer le nombre de jours
        if self.start_date and self.end_date:
            self.total_days = (self.end_date - self.start_date).days + 1
        super().save(*args, **kwargs)


# ==================== ATTENDANCE ====================

class Attendance(models.Model):
    """Suivi des présences"""
    
    STATUS_PRESENT = 'present'
    STATUS_ABSENT = 'absent'
    STATUS_LATE = 'late'
    STATUS_HALF_DAY = 'half_day'
    STATUS_CHOICES = [
        (STATUS_PRESENT, 'Présent'),
        (STATUS_ABSENT, 'Absent'),
        (STATUS_LATE, 'En retard'),
        (STATUS_HALF_DAY, 'Demi-journée'),
    ]
    
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='attendances')
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='attendances')
    
    date = models.DateField()
    check_in = models.TimeField(null=True, blank=True)
    check_out = models.TimeField(null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PRESENT)
    hours_worked = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['employee', 'date']
        ordering = ['-date']
        verbose_name = 'Présence'
        verbose_name_plural = 'Présences'
    
    def __str__(self):
        return f"{self.employee.full_name} - {self.date} ({self.status})"


# ==================== DOCUMENTS ====================

class Document(models.Model):
    """Documents des employés"""
    
    CATEGORY_CONTRACT = 'contract'
    CATEGORY_ID = 'id'
    CATEGORY_CERTIFICATE = 'certificate'
    CATEGORY_PAYSLIP = 'payslip'
    CATEGORY_OTHER = 'other'
    CATEGORY_CHOICES = [
        (CATEGORY_CONTRACT, 'Contrat'),
        (CATEGORY_ID, 'Pièce d\'identité'),
        (CATEGORY_CERTIFICATE, 'Certificat'),
        (CATEGORY_PAYSLIP, 'Fiche de paie'),
        (CATEGORY_OTHER, 'Autre'),
    ]
    
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='documents')
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='documents')
    
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    file = models.FileField(upload_to='documents/')
    description = models.TextField(blank=True)
    
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='uploaded_documents')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-uploaded_at']
        verbose_name = 'Document'
        verbose_name_plural = 'Documents'
    
    def __str__(self):
        return f"{self.title} - {self.employee.full_name}"


# ==================== PAYROLL (Basique) ====================

class Payroll(models.Model):
    """Fiche de paie"""
    
    STATUS_DRAFT = 'draft'
    STATUS_PROCESSED = 'processed'
    STATUS_PAID = 'paid'
    STATUS_CHOICES = [
        (STATUS_DRAFT, 'Brouillon'),
        (STATUS_PROCESSED, 'Traité'),
        (STATUS_PAID, 'Payé'),
    ]
    
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='payrolls')
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='payrolls')
    
    month = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(12)])
    year = models.IntegerField()
    
    # Montants
    base_salary = models.DecimalField(max_digits=10, decimal_places=2)
    bonuses = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    deductions = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    net_salary = models.DecimalField(max_digits=10, decimal_places=2)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_DRAFT)
    payment_date = models.DateField(null=True, blank=True)
    
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['employee', 'month', 'year']
        ordering = ['-year', '-month']
        verbose_name = 'Fiche de paie'
        verbose_name_plural = 'Fiches de paie'
    
    def __str__(self):
        return f"{self.employee.full_name} - {self.month}/{self.year}"

# ==================== DASHBOARD WIDGETS ====================

class Event(models.Model):
    """Événements et Rappels pour le Dashboard"""
    
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='events')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)
    
    link = models.URLField(blank=True, help_text="Lien vers la réunion ou le document")
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['start_time']
        verbose_name = 'Événement'
        verbose_name_plural = 'Événements'
        
    def __str__(self):
        return f"{self.title} ({self.start_time})"


class Project(models.Model):
    """Projets Clés pour le Dashboard"""
    
    STATUS_TODO = 'todo'
    STATUS_IN_PROGRESS = 'in_progress'
    STATUS_DONE = 'done'
    STATUS_CHOICES = [
        (STATUS_TODO, 'À faire'),
        (STATUS_IN_PROGRESS, 'En cours'),
        (STATUS_DONE, 'Terminé'),
    ]

    COLORS = [
        ('blue', 'Bleu'),
        ('green', 'Vert'),
        ('orange', 'Orange'),
        ('purple', 'Violet'),
        ('pink', 'Rose'),
    ]

    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='projects')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    due_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_TODO)
    
    icon_emoji = models.CharField(max_length=10, default='🚀', help_text="Emoji pour l'icône")
    color = models.CharField(max_length=20, choices=COLORS, default='blue', help_text="Couleur du thème")
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['due_date']
        verbose_name = 'Projet'
        verbose_name_plural = 'Projets'
        
    def __str__(self):
        return self.name

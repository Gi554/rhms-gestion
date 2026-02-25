"""
Script pour créer des données de test pour le HRMS SaaS

Usage:
    docker-compose exec backend python manage.py shell < create_test_data.py
    # ou
    python manage.py shell < create_test_data.py
"""

from django.contrib.auth.models import User
from api.models import (
    Organization, OrganizationMember,
    Department, Employee,
    LeaveType, LeaveRequest,
    Attendance
)
from datetime import date, timedelta
from django.utils.text import slugify

print("🚀 Création des données de test...")

# ==================== ORGANISATION ====================
print("\n📊 Création de l'organisation...")

org, created = Organization.objects.get_or_create(
    slug='acme-corp',
    defaults={
        'name': 'ACME Corporation',
        'description': 'Une entreprise de démonstration',
        'plan': 'professional',
        'max_employees': 100,
        'email': 'contact@acme-corp.com',
        'phone': '+33 1 23 45 67 89',
        'address': '123 Avenue des Champs-Élysées, 75008 Paris',
        'website': 'https://acme-corp.com',
        'primary_color': '#4F46E5',
    }
)

if created:
    print(f"✅ Organisation créée: {org.name}")
else:
    print(f"ℹ️  Organisation existante: {org.name}")

# ==================== USERS & MEMBERS ====================
print("\n👥 Création des utilisateurs...")

# Admin user
admin_user, created = User.objects.get_or_create(
    username='admin',
    defaults={
        'email': 'admin@acme-corp.com',
        'first_name': 'Admin',
        'last_name': 'User',
        'is_staff': True,
        'is_superuser': True,
    }
)
admin_user.set_password('admin123')
admin_user.is_staff = True
admin_user.is_superuser = True
admin_user.save()
print(f"✅ Superuser configuré: {admin_user.username}")

# Manager user
manager_user, created = User.objects.get_or_create(
    username='manager',
    defaults={
        'email': 'manager@acme-corp.com',
        'first_name': 'Marie',
        'last_name': 'Martin',
    }
)
manager_user.set_password('manager123')
manager_user.save()
print(f"✅ Manager configuré: {manager_user.username}")

# Employee user
employee_user, created = User.objects.get_or_create(
    username='employee',
    defaults={
        'email': 'employee@acme-corp.com',
        'first_name': 'Jean',
        'last_name': 'Dupont',
    }
)
employee_user.set_password('employee123')
employee_user.save()
print(f"✅ Employé configuré: {employee_user.username}")

# Créer les membres d'organisation
OrganizationMember.objects.get_or_create(
    organization=org,
    user=admin_user,
    defaults={'role': 'owner'}
)

OrganizationMember.objects.get_or_create(
    organization=org,
    user=manager_user,
    defaults={'role': 'manager'}
)

OrganizationMember.objects.get_or_create(
    organization=org,
    user=employee_user,
    defaults={'role': 'employee'}
)

# ==================== DEPARTMENTS ====================
print("\n🏢 Création des départements...")

departments_data = [
    {'name': 'Direction', 'code': 'DIR'},
    {'name': 'Ressources Humaines', 'code': 'RH'},
    {'name': 'Informatique', 'code': 'IT'},
    {'name': 'Marketing', 'code': 'MKT'},
    {'name': 'Ventes', 'code': 'SALES'},
    {'name': 'Finance', 'code': 'FIN'},
]

departments = {}
for dept_data in departments_data:
    dept, created = Department.objects.get_or_create(
        organization=org,
        name=dept_data['name'],
        defaults={'code': dept_data['code']}
    )
    departments[dept_data['code']] = dept
    if created:
        print(f"✅ Département créé: {dept.name}")

# ==================== EMPLOYEES ====================
print("\n👨‍💼 Création des employés...")

employees_data = [
    {
        'employee_id': 'EMP001',
        'first_name': 'Sophie',
        'last_name': 'Bernard',
        'email': 'sophie.bernard@acme-corp.com',
        'position': 'Directrice Générale',
        'department': 'DIR',
        'hire_date': date(2020, 1, 15),
        'salary': 85000,
    },
    {
        'employee_id': 'EMP002',
        'first_name': 'Thomas',
        'last_name': 'Dubois',
        'email': 'thomas.dubois@acme-corp.com',
        'position': 'Responsable RH',
        'department': 'RH',
        'hire_date': date(2020, 3, 1),
        'salary': 55000,
    },
    {
        'employee_id': 'EMP003',
        'first_name': 'Julie',
        'last_name': 'Petit',
        'email': 'julie.petit@acme-corp.com',
        'position': 'Développeuse Senior',
        'department': 'IT',
        'hire_date': date(2021, 6, 1),
        'salary': 60000,
    },
    {
        'employee_id': 'EMP004',
        'first_name': 'Pierre',
        'last_name': 'Moreau',
        'email': 'pierre.moreau@acme-corp.com',
        'position': 'Chef de Projet Marketing',
        'department': 'MKT',
        'hire_date': date(2021, 9, 15),
        'salary': 50000,
    },
    {
        'employee_id': 'EMP005',
        'first_name': 'Emma',
        'last_name': 'Laurent',
        'email': 'emma.laurent@acme-corp.com',
        'position': 'Commercial Senior',
        'department': 'SALES',
        'hire_date': date(2022, 2, 1),
        'salary': 48000,
    },
]

    employees[emp.employee_id] = emp
    
    # Associer automatiquement à l'utilisateur correspondant si possible
    if emp.employee_id == 'EMP001':
        emp.user = admin_user
    elif emp.employee_id == 'EMP002':
        emp.user = manager_user
    elif emp.employee_id == 'EMP003':
        emp.user = employee_user
    else:
        # Fallback par email
        emp.user = User.objects.filter(email=emp.email).first()
    
    emp.save()
    
    if created:
        print(f"✅ Employé créé et lié: {emp.full_name} ({emp.employee_id})")

# Définir les managers
if 'EMP001' in employees and 'EMP002' in employees:
    employees['EMP002'].manager = employees['EMP001']
    employees['EMP002'].save()

if 'EMP001' in employees and 'EMP003' in employees:
    employees['EMP003'].manager = employees['EMP001']
    employees['EMP003'].save()

# ==================== LEAVE TYPES ====================
print("\n📅 Création des types de congés...")

leave_types_data = [
    {
        'name': 'Congé payé',
        'code': 'PAID',
        'is_paid': True,
        'requires_approval': True,
        'max_days_per_year': 25,
        'color': '#4F46E5',
    },
    {
        'name': 'Congé maladie',
        'code': 'SICK',
        'is_paid': True,
        'requires_approval': False,
        'max_days_per_year': 10,
        'color': '#EF4444',
    },
    {
        'name': 'Congé sans solde',
        'code': 'UNPAID',
        'is_paid': False,
        'requires_approval': True,
        'max_days_per_year': None,
        'color': '#6B7280',
    },
    {
        'name': 'RTT',
        'code': 'RTT',
        'is_paid': True,
        'requires_approval': True,
        'max_days_per_year': 12,
        'color': '#10B981',
    },
]

leave_types = {}
for lt_data in leave_types_data:
    lt, created = LeaveType.objects.get_or_create(
        organization=org,
        code=lt_data['code'],
        defaults=lt_data
    )
    leave_types[lt.code] = lt
    if created:
        print(f"✅ Type de congé créé: {lt.name}")

# ==================== LEAVE REQUESTS ====================
print("\n🏖️  Création de demandes de congés...")

if 'EMP003' in employees and 'PAID' in leave_types:
    # Demande approuvée
    LeaveRequest.objects.get_or_create(
        organization=org,
        employee=employees['EMP003'],
        leave_type=leave_types['PAID'],
        start_date=date.today() + timedelta(days=30),
        end_date=date.today() + timedelta(days=37),
        defaults={
            'reason': 'Vacances d\'été',
            'status': 'approved',
            'approved_by': employees.get('EMP001'),
        }
    )
    
    # Demande en attente
    LeaveRequest.objects.get_or_create(
        organization=org,
        employee=employees['EMP003'],
        leave_type=leave_types['RTT'],
        start_date=date.today() + timedelta(days=10),
        end_date=date.today() + timedelta(days=10),
        defaults={
            'reason': 'Jour de RTT',
            'status': 'pending',
        }
    )

print("\n✅ Données de test créées avec succès!")
print("\n📝 Comptes de test:")
print("   - Admin: admin / admin123 (superuser)")
print("   - Manager: manager / manager123")
print("   - Employee: employee / employee123")
print("\n🏢 Organisation: ACME Corporation")
print(f"   - {len(departments_data)} départements")
print(f"   - {len(employees_data)} employés")
print(f"   - {len(leave_types_data)} types de congés")

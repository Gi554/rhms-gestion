import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Organization, OrganizationMember

def initialize_production():
    print("🚀 Initialisation du compte administrateur...")
    
    # Paramètres de l'admin
    admin_username = os.environ.get('ADMIN_USERNAME', 'admin')
    admin_email = os.environ.get('ADMIN_EMAIL', 'admin@rhms-gestion.com')
    admin_password = os.environ.get('ADMIN_PASSWORD', 'admin123')
    
    # 1. Créer le Superuser
    if not User.objects.filter(username=admin_username).exists():
        admin_user = User.objects.create_superuser(
            username=admin_username,
            email=admin_email,
            password=admin_password
        )
        print(f"✅ Superuser créé : {admin_username}")
    else:
        admin_user = User.objects.get(username=admin_username)
        # Update password just in case or if requested
        admin_user.set_password(admin_password)
        admin_user.save()
        print(f"ℹ️ Superuser '{admin_username}' déjà existant (mot de passe mis à jour)")

    # 2. Créer l'organisation par défaut (Indispensable pour le HRMS)
    org, created = Organization.objects.get_or_create(
        slug='rhms-corp',
        defaults={
            'name': 'RHMS Gestion',
            'description': 'Organisation de production',
            'email': admin_email,
            'plan': 'professional'
        }
    )
    
    if created:
        print(f"✅ Organisation '{org.name}' créée")

    # 4. Créer des Départements par défaut
    print("\n🏢 Création des départements par défaut...")
    depts = [
        {'name': 'Direction', 'code': 'DIR'},
        {'name': 'Ressources Humaines', 'code': 'RH'},
        {'name': 'Informatique', 'code': 'IT'},
        {'name': 'Marketing & Ventes', 'code': 'MKT'},
    ]
    for d in depts:
        dept, d_created = Department.objects.get_or_create(
            organization=org,
            name=d['name'],
            defaults={'code': d['code']}
        )
        if d_created:
            print(f"   ✅ Département créé : {d['name']}")

    # 5. Créer des Types de Congés par défaut
    print("\n📅 Création des types de congés par défaut...")
    leave_types = [
        {'name': 'Congés Payés', 'code': 'PAID', 'color': '#4F46E5', 'max_days_per_year': 25},
        {'name': 'Congés Maladie', 'code': 'SICK', 'color': '#EF4444', 'requires_approval': False},
        {'name': 'RTT', 'code': 'RTT', 'color': '#10B981', 'max_days_per_year': 12},
        {'name': 'Congé sans solde', 'code': 'UNPAID', 'color': '#6B7280', 'is_paid': False},
    ]
    for lt in leave_types:
        l_type, lt_created = LeaveType.objects.get_or_create(
            organization=org,
            code=lt['code'],
            defaults=lt
        )
        if lt_created:
            print(f"   ✅ Type de congé créé : {lt['name']}")

    print("\n🎉 Initialisation terminée avec succès !")
    print(f"Identifiants : {admin_username} / {admin_password}")

if __name__ == "__main__":
    initialize_production()

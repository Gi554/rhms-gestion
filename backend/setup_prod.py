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
    
    # 3. Lier l'admin à l'organisation comme 'owner'
    member, created = OrganizationMember.objects.get_or_create(
        organization=org,
        user=admin_user,
        defaults={'role': 'owner'}
    )
    
    if created:
        print(f"✅ Admin lié à l'organisation en tant que propriétaire")

    print("\n🎉 Initialisation terminée avec succès !")
    print(f"Identifiants : {admin_username} / {admin_password}")

if __name__ == "__main__":
    initialize_production()

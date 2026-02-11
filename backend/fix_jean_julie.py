import os
import django
from datetime import date

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Employee, Organization

def fix_isolation():
    print("Correction de l'isolation Jean / Julie...")
    
    # 1. Identifier les acteurs
    jean_user = User.objects.filter(username='employee').first()
    julie_emp = Employee.objects.filter(employee_id='EMP003').first() # Julie Petit
    
    if not jean_user:
        print("Utilisateur 'employee' non trouve.")
        return

    # 2. Verifier si Jean a deja un profil par email
    jean_emp = Employee.objects.filter(email=jean_user.email).first()
    
    org = Organization.objects.first()

    if julie_emp and julie_emp.user == jean_user:
        print(f"Julie Petit ({julie_emp.employee_id}) etait liee par erreur a Jean ({jean_user.username}). Desassociation...")
        julie_emp.user = None
        julie_emp.save()

    if not jean_emp:
        print("Creation du profil employe pour Jean Dupont...")
        jean_emp = Employee.objects.create(
            organization=org,
            user=jean_user,
            employee_id='EMP000',
            first_name='Jean',
            last_name='Dupont',
            email=jean_user.email,
            position='Employe standard',
            status='active',
            hire_date=date(2026, 1, 1) # Date par defaut
        )
    else:
        print(f"Jean Dupont ({jean_emp.employee_id}) existe deja. Liaison avec l'utilisateur...")
        jean_emp.user = jean_user
        jean_emp.save()

    # 3. Re-associer Julie a son propre compte si il existe ou par email
    julie_user = User.objects.filter(email='julie.petit@acme-corp.com').first()
    if julie_user and julie_emp:
        julie_emp.user = julie_user
        julie_emp.save()
        print(f"Julie Petit liee a son propre compte ({julie_user.username})")

    print("\nIsolation terminee ! Jean est maintenant Jean, et Julie est Julie.")

if __name__ == "__main__":
    fix_isolation()

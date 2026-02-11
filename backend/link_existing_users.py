from django.contrib.auth.models import User
from api.models import Employee

print("🔍 Réparation des liens Utilisateur-Employé...")

# 1. Associer l'admin (EMP001 - Sophie Bernard)
admin_user = User.objects.filter(username='admin').first()
sophie = Employee.objects.filter(employee_id='EMP001').first()
if admin_user and sophie:
    sophie.user = admin_user
    sophie.save()
    print(f"✅ Admin ({admin_user.username}) lié à {sophie.full_name}")

# 2. Associer le manager (EMP002 - Thomas Dubois)
manager_user = User.objects.filter(username='manager').first()
thomas = Employee.objects.filter(employee_id='EMP002').first()
if manager_user and thomas:
    thomas.user = manager_user
    thomas.save()
    print(f"✅ Manager ({manager_user.username}) lié à {thomas.full_name}")

# 3. Associer l'employé (EMP003 - Julie Petit)
employee_user = User.objects.filter(username='employee').first()
julie = Employee.objects.filter(employee_id='EMP003').first()
if employee_user and julie:
    julie.user = employee_user
    julie.save()
    print(f"✅ Employé ({employee_user.username}) lié à {julie.full_name}")

# 4. Association automatique par email pour les autres
users = User.objects.all()
for user in users:
    employee = Employee.objects.filter(email=user.email).first()
    if employee and not employee.user:
        employee.user = user
        employee.save()
        print(f"✅ {user.username} lié à {employee.full_name} via email")

print("\n🚀 Réparation terminée !")

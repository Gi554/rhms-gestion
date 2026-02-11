import os
import django
import sys

# Configuration Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import LeaveType

print("Demarrage de la correction fine des LeaveTypes...")

leave_types = LeaveType.objects.all()
for lt in leave_types:
    original_name = lt.name
    code = lt.code
    new_name = original_name
    
    if code == 'PAID':
        new_name = "Cong\u00e9 pay\u00e9"
    elif code == 'SICK':
        new_name = "Cong\u00e9 maladie"
    elif code == 'UNPAID':
        new_name = "Cong\u00e9 sans solde"
    elif code == 'RTT':
        new_name = "Repos Compensateur (RTT)"
    
    if new_name != original_name:
        lt.name = new_name
        lt.save()
        print(f"Mis a jour: {code} -> {new_name}")

print("Correction terminee !")

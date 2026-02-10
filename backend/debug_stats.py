import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Organization, OrganizationMember

print("Checking data for admin user...")

try:
    user = User.objects.get(username='admin')
    print(f"User: {user.username} (ID: {user.id})")
    print(f"Is Superuser: {user.is_superuser}")
    
    orgs = Organization.objects.filter(members__user=user, members__is_active=True).distinct()
    print(f"Organizations found for user: {orgs.count()}")
    
    if orgs.count() > 0:
        org = orgs.first()
        print(f"First Org: {org.name} (ID: {org.id})")
        
        # Check stats logic
        total_employees = org.employees.filter(is_active=True).count()
        total_departments = org.departments.filter(is_active=True).count()
        pending_leaves = org.leave_requests.filter(status='pending').count()
        active_members = org.members.filter(is_active=True).count()
        
        print(f"Stats for {org.name}:")
        print(f"  - Total Employees: {total_employees}")
        print(f"  - Total Departments: {total_departments}")
        print(f"  - Pending Leaves: {pending_leaves}")
        print(f"  - Active Members: {active_members}")
        
    else:
        print("No organizations found!")
        
except User.DoesNotExist:
    print("User 'admin' does not exist!")

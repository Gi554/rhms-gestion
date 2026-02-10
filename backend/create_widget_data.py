import os
import django
from django.utils import timezone
import random
from datetime import timedelta
import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import Organization, Project, Event, Attendance, Employee, Department

# Get first org
org = Organization.objects.first()
if not org:
    print("No organization found.")
    exit()

print(f"Updating data for {org.name}...")

# 1. Ensure we have enough employees
employee_count = Employee.objects.filter(organization=org).count()
print(f"Current employee count: {employee_count}")

if employee_count < 10:
    print("Creating more employees for better viz...")
    dept, _ = Department.objects.get_or_create(organization=org, name="Engineering")
    
    for i in range(10 - employee_count):
        Employee.objects.create(
            organization=org,
            department=dept,
            employee_id=f"EMP-GEN-{i}",
            first_name=f"Employee",
            last_name=f"{i}",
            email=f"emp{i}@demo.com",
            position="Developer",
            hire_date=timezone.now().date(),
            status='active'
        )
    print("Employees created.")

# Refresh list
employees = Employee.objects.filter(organization=org)

# 2. Create Attendance Activity (Last 7 days)
# Clean existing recent attendance
today = timezone.now().date()

print("Generating high attendance data...")
for i in range(7):
    day = today - timedelta(days=i)
    # Delete existing for this day
    Attendance.objects.filter(organization=org, date=day).delete()
    
    # Create attendance for ALMOST ALL employees to make bars high
    # Weekends: low attendance, Weekdays: high attendance
    is_weekend = day.weekday() >= 5
    
    for emp in employees:
        should_attend = False
        if is_weekend:
            should_attend = random.random() > 0.9 # 10% chance on weekends
        else:
            should_attend = random.random() > 0.1 # 90% chance on weekdays
            
        if should_attend:
            Attendance.objects.create(
                organization=org,
                employee=emp,
                date=day,
                check_in=datetime.time(9, 0),
                check_out=datetime.time(18, 0),
                status='present'
            )

print("Attendance history updated.")

# 3. Ensure Projects exist
if Project.objects.filter(organization=org).count() == 0:
    projects_data = [
        {"name": "Campagne Recrutement 2026", "due": 30, "color": "blue", "icon": "🚀", "status": "in_progress"},
        {"name": "Onboarding Stagiaires", "due": 15, "color": "green", "icon": "🎓", "status": "todo"},
        {"name": "Refonte Documents", "due": 45, "color": "orange", "icon": "📄", "status": "in_progress"},
        {"name": "Audit Sécurité", "due": 10, "color": "purple", "icon": "🔒", "status": "todo"},
    ]
    for p in projects_data:
        Project.objects.create(
            organization=org,
            name=p["name"],
            due_date=timezone.now().date() + timedelta(days=p["due"]),
            status=p["status"],
            color=p["color"],
            icon_emoji=p["icon"]
        )
    print("Projects created.")

print("Done! Refresh the dashboard.")

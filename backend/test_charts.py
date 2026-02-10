
import os
import django
from django.utils import timezone
import random
from datetime import timedelta
import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import Organization, Attendance, Employee

# Get first org
org = Organization.objects.first()
if not org:
    print("No organization found.")
    exit()

print(f"Checking data for {org.name} (ID: {org.id})...")

today = timezone.now().date()
print(f"Today is: {today} (weekday: {today.weekday()})")

last_7_days = [today - timedelta(days=i) for i in range(6, -1, -1)]
for day in last_7_days:
    count = Attendance.objects.filter(
        organization=org,
        date=day,
        status='present'
    ).count()
    print(f"Date: {day}, Count: {count}")

print("\nRecent Attendance Records:")
records = Attendance.objects.select_related('employee').filter(organization=org).order_by('-date', '-created_at')[:10]
for r in records:
    print(f"  {r.date} - {r.employee.full_name} - {r.status}")

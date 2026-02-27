from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    OrganizationViewSet, OrganizationMemberViewSet,
    DepartmentViewSet, EmployeeViewSet,
    LeaveTypeViewSet, LeaveRequestViewSet,
    AttendanceViewSet, DocumentViewSet, PayrollViewSet,
    ProjectViewSet, EventViewSet, MeViewSet, NotificationViewSet,
    ScreenCaptureScheduleViewSet, ScreenshotCaptureViewSet
)
from .health import health_check

# Router pour les ViewSets
router = DefaultRouter()
router.register(r'auth/me', MeViewSet, basename='me')

# Organization
router.register(r'organizations', OrganizationViewSet, basename='organization')
router.register(r'organization-members', OrganizationMemberViewSet, basename='organization-member')

# Core HR
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'employees', EmployeeViewSet, basename='employee')

# Leave Management
router.register(r'leave-types', LeaveTypeViewSet, basename='leave-type')
router.register(r'leaves', LeaveRequestViewSet, basename='leave')

# Attendance
router.register(r'attendances', AttendanceViewSet, basename='attendance')

# Documents
router.register(r'documents', DocumentViewSet, basename='document')

# Payroll
router.register(r'payrolls', PayrollViewSet, basename='payroll')

# Widgets
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'events', EventViewSet, basename='event')
router.register(r'notifications', NotificationViewSet, basename='notification')

# Screen Monitoring
router.register(r'screen-capture-schedule', ScreenCaptureScheduleViewSet, basename='screen-capture-schedule')
router.register(r'screenshots', ScreenshotCaptureViewSet, basename='screenshot')

urlpatterns = [
    # Auth endpoints
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Health check
    path('health/', health_check, name='health_check'),
    
    # API routes
    path('', include(router.urls)),
]

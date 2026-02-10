from rest_framework import permissions


class IsOrganizationMember(permissions.BasePermission):
    """
    Permission: L'utilisateur doit être membre de l'organisation
    """
    
    def has_permission(self, request, view):
        # Vérifier si l'utilisateur est authentifié
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Les superusers ont accès à tout
        if request.user.is_superuser:
            return True
        
        # Vérifier si l'utilisateur a au moins une organisation
        return request.user.organization_memberships.filter(is_active=True).exists()
    
    def has_object_permission(self, request, view, obj):
        # Les superusers ont accès à tout
        if request.user.is_superuser:
            return True
        
        # Vérifier que l'objet appartient à une organisation de l'utilisateur
        if hasattr(obj, 'organization'):
            return request.user.organization_memberships.filter(
                organization=obj.organization,
                is_active=True
            ).exists()
        
        return False


class IsOrganizationAdmin(permissions.BasePermission):
    """
    Permission: L'utilisateur doit être admin ou owner de l'organisation
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        if request.user.is_superuser:
            return True
        
        # Vérifier si l'utilisateur est admin ou owner dans au moins une organisation
        return request.user.organization_memberships.filter(
            is_active=True,
            role__in=['admin', 'owner']
        ).exists()
    
    def has_object_permission(self, request, view, obj):
        if request.user.is_superuser:
            return True
        
        if hasattr(obj, 'organization'):
            return request.user.organization_memberships.filter(
                organization=obj.organization,
                is_active=True,
                role__in=['admin', 'owner']
            ).exists()
        
        return False


class IsOrganizationOwner(permissions.BasePermission):
    """
    Permission: L'utilisateur doit être owner de l'organisation
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        if request.user.is_superuser:
            return True
        
        return request.user.organization_memberships.filter(
            is_active=True,
            role='owner'
        ).exists()
    
    def has_object_permission(self, request, view, obj):
        if request.user.is_superuser:
            return True
        
        if hasattr(obj, 'organization'):
            return request.user.organization_memberships.filter(
                organization=obj.organization,
                is_active=True,
                role='owner'
            ).exists()
        
        return False


class IsManagerOrAdmin(permissions.BasePermission):
    """
    Permission: L'utilisateur doit être manager, admin ou owner
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        if request.user.is_superuser:
            return True
        
        return request.user.organization_memberships.filter(
            is_active=True,
            role__in=['manager', 'admin', 'owner']
        ).exists()
    
    def has_object_permission(self, request, view, obj):
        if request.user.is_superuser:
            return True
        
        if hasattr(obj, 'organization'):
            return request.user.organization_memberships.filter(
                organization=obj.organization,
                is_active=True,
                role__in=['manager', 'admin', 'owner']
            ).exists()
        
        return False


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Permission: Lecture pour tous les membres, écriture pour le propriétaire
    """
    
    def has_object_permission(self, request, view, obj):
        # Lecture autorisée pour tous les membres
        if request.method in permissions.SAFE_METHODS:
            return IsOrganizationMember().has_object_permission(request, view, obj)
        
        # Écriture uniquement pour l'utilisateur propriétaire
        if hasattr(obj, 'user'):
            return obj.user == request.user
        
        return False

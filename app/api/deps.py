from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, Dict, Any
from datetime import datetime

from app.core.database import get_session
from app.core.security import verify_token
from app.core.casbin import get_casbin_manager
from app.middleware.tenant import get_current_school_id, get_current_school
from app.models.user import User, UserRole
from app.models.school import School
from app.models.super_admin import SuperAdmin

# Security scheme
security = HTTPBearer()


async def get_db() -> AsyncSession:
    """Database session dependency."""
    async for session in get_session():
        yield session


async def get_current_user(
    db: AsyncSession = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security),
    request: Request = None
) -> User:
    """
    Get current authenticated user.
    """
    # Verify JWT token
    payload = verify_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user from database
    stmt = select(User).where(User.id == int(user_id))
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive",
        )
    
    # Verify user belongs to current tenant/school
    current_school_id = get_current_school_id(request)
    if current_school_id and user.school_id != current_school_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not belong to this school",
        )
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Get current active user."""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user


def require_role(allowed_roles: list[UserRole]):
    """
    Dependency factory to require specific roles.
    
    Usage:
    @router.get("/admin-only")
    async def admin_endpoint(user: User = Depends(require_role([UserRole.ADMIN]))):
        pass
    """
    def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation requires one of these roles: {[role.value for role in allowed_roles]}"
            )
        return current_user
    
    return role_checker


# Common role dependencies
require_admin = require_role([UserRole.ADMIN])
require_teacher_or_admin = require_role([UserRole.TEACHER, UserRole.ADMIN])
require_parent = require_role([UserRole.PARENT])
require_security = require_role([UserRole.SECURITY])
require_security_or_admin = require_role([UserRole.SECURITY, UserRole.ADMIN])


def get_tenant_filter(request: Request) -> dict:
    """
    Get tenant filter for database queries.
    Returns {"school_id": school_id} for tenant-aware models.
    """
    school_id = get_current_school_id(request)
    if not school_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant information missing"
        )
    return {"school_id": school_id}


def get_current_school_dep(request: Request) -> School:
    """Get current school as dependency."""
    school = get_current_school(request)
    if not school:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="School information missing"
        )
    return school 


def require_permission(resource_type: str, resource: str, action: str, 
                      check_attributes: bool = True):
    """
    Dependency factory to require specific permissions using Casbin RBAC + ABAC.
    
    Args:
        resource_type: Type of resource (page, feature, api)
        resource: Resource identifier
        action: Action to perform
        check_attributes: Whether to check ABAC attributes
        
    Usage:
    @router.get("/admin-only")
    async def admin_endpoint(user: User = Depends(require_permission("page", "settings", "read"))):
        pass
    """
    def permission_checker(
        current_user: User = Depends(get_current_active_user),
        request: Request = None
    ) -> User:
        # Get user role
        role = current_user.role.value.lower()
        
        # Prepare attributes for ABAC
        attributes = None
        if check_attributes:
            attributes = {
                "school_id": str(current_user.school_id),
                "user_id": str(current_user.id),
                "user_status": current_user.status.value,
                "department": current_user.department or "",
                "current_time": datetime.now().strftime("%H:%M"),
                "current_date": datetime.now().strftime("%Y-%m-%d"),
            }
        
        # Check permission using Casbin
        casbin_manager = get_casbin_manager()
        has_permission = casbin_manager.check_permission(
            role=role,
            resource_type=resource_type,
            resource=resource,
            action=action,
            attributes=attributes
        )
        
        if not has_permission:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required permission: {resource_type}:{resource}:{action}"
            )
        
        return current_user
    
    return permission_checker


def require_feature_permission(feature: str, action: str = "full"):
    """
    Dependency factory to require feature-level permissions.
    
    Args:
        feature: Feature name
        action: Required action level (full, limited, read)
        
    Usage:
    @router.get("/attendance")
    async def attendance_page(user: User = Depends(require_feature_permission("attendance_management"))):
        pass
    """
    return require_permission("feature", feature, action)


def require_page_permission(page: str, action: str = "read"):
    """
    Dependency factory to require page-level permissions.
    
    Args:
        page: Page name
        action: Required action (read, write)
        
    Usage:
    @router.get("/settings")
    async def settings_page(user: User = Depends(require_page_permission("settings", "read"))):
        pass
    """
    return require_permission("page", page, action)


def require_api_permission(endpoint: str, method: str):
    """
    Dependency factory to require API endpoint permissions.
    
    Args:
        endpoint: API endpoint path
        method: HTTP method
        
    Usage:
    @router.get("/api/v1/students")
    async def get_students(user: User = Depends(require_api_permission("/api/v1/students/*", "GET"))):
        pass
    """
    return require_permission("api", endpoint, method)


def check_settings_aware_permission(setting_key: str, default_value: Any = True):
    """
    Dependency factory to check permissions based on system settings.
    
    Args:
        setting_key: Settings key to check
        default_value: Default value if setting is not found
        
    Usage:
    @router.get("/biometric")
    async def biometric_page(
        user: User = Depends(check_settings_aware_permission("biometric_enabled"))
    ):
        pass
    """
    async def settings_checker(
        current_user: User = Depends(get_current_active_user),
        db: AsyncSession = Depends(get_db)
    ) -> User:
        # Get school settings
        from app.models.settings import SchoolSettings
        stmt = select(SchoolSettings).where(SchoolSettings.school_id == current_user.school_id)
        result = await db.execute(stmt)
        settings = result.scalar_one_or_none()
        
        if not settings:
            # If no settings, use default value
            setting_enabled = default_value
        else:
            # Get setting value
            setting_value = getattr(settings, setting_key, default_value)
            setting_enabled = setting_value if setting_value is not None else default_value
        
        if not setting_enabled:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Feature '{setting_key}' is disabled for this school"
            )
        
        return current_user
    
    return settings_checker


# Enhanced role dependencies with Casbin integration
def require_admin_with_settings():
    """Require admin role and check relevant settings."""
    def admin_checker(
        current_user: User = Depends(require_role([UserRole.ADMIN])),
        db: AsyncSession = Depends(get_db)
    ) -> User:
        # Additional admin-specific checks can be added here
        return current_user
    
    return admin_checker


def require_teacher_with_attendance_settings():
    """Require teacher role and check attendance settings."""
    async def teacher_checker(
        current_user: User = Depends(require_role([UserRole.TEACHER])),
        db: AsyncSession = Depends(get_db)
    ) -> User:
        # Check if attendance management is enabled
        from app.models.settings import SchoolSettings
        stmt = select(SchoolSettings).where(SchoolSettings.school_id == current_user.school_id)
        result = await db.execute(stmt)
        settings = result.scalar_one_or_none()
        
        if settings and not settings.default_attendance_mode:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Attendance management is not configured for this school"
            )
        
        return current_user
    
    return teacher_checker


def require_security_with_gate_pass_settings():
    """Require security role and check gate pass settings."""
    async def security_checker(
        current_user: User = Depends(require_role([UserRole.SECURITY])),
        db: AsyncSession = Depends(get_db)
    ) -> User:
        # Check if gate pass system is enabled
        from app.models.settings import SchoolSettings
        stmt = select(SchoolSettings).where(SchoolSettings.school_id == current_user.school_id)
        result = await db.execute(stmt)
        settings = result.scalar_one_or_none()
        
        if settings and not settings.gate_pass_approval_workflow:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Gate pass system is not configured for this school"
            )
        
        return current_user
    
    return security_checker


def require_parent_with_notification_settings():
    """Require parent role and check notification settings."""
    async def parent_checker(
        current_user: User = Depends(require_role([UserRole.PARENT])),
        db: AsyncSession = Depends(get_db)
    ) -> User:
        # Check if parent notifications are enabled
        from app.models.settings import SchoolSettings
        stmt = select(SchoolSettings).where(SchoolSettings.school_id == current_user.school_id)
        result = await db.execute(stmt)
        settings = result.scalar_one_or_none()
        
        if settings and not settings.parent_notification_on_entry:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Parent notifications are not enabled for this school"
            )
        
        return current_user
    
    return parent_checker 
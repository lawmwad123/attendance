from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, Generator

from app.core.database import get_session
from app.core.security import verify_token
from app.models.user import User, UserRole
from app.models.school import School
from app.middleware.tenant import get_current_school_id, get_current_school

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


async def get_current_school_dep(request: Request) -> School:
    """Get current school as dependency."""
    school = get_current_school(request)
    if not school:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="School information missing"
        )
    return school 
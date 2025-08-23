from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request as StarletteRequest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import re
from typing import Optional

from app.core.config import settings
from app.core.database import async_session_factory
from app.models.school import School


class TenantMiddleware(BaseHTTPMiddleware):
    """
    Middleware to extract tenant information from subdomain or header.
    
    Supports:
    1. Subdomain-based tenancy: school1.attendance.com
    2. Header-based tenancy: X-Tenant-ID header
    3. Query parameter: ?tenant=school1
    """
    
    async def dispatch(self, request: Request, call_next):
        # Skip tenant checking for certain paths
        skip_paths = ["/docs", "/openapi.json", "/redoc", "/health"]
        
        # Special case for exact root path
        if request.url.path == "/":
            return await call_next(request)
        
        # Skip tenant checking for OPTIONS requests (CORS preflight)
        if request.method == "OPTIONS":
            return await call_next(request)
        
        for skip_path in skip_paths:
            if request.url.path.startswith(skip_path):
                return await call_next(request)
        
        # Extract tenant identifier
        tenant_id = await self._extract_tenant(request)
        
        if not tenant_id and request.url.path.startswith("/api"):
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"detail": "Tenant identifier required"}
            )
        
        # Set tenant in request state
        request.state.tenant_id = tenant_id
        request.state.school = None
        
        # Validate tenant exists (for API calls)
        if tenant_id and request.url.path.startswith("/api"):
            school = await self._get_school_by_tenant(tenant_id)
            if not school:
                return JSONResponse(
                    status_code=status.HTTP_404_NOT_FOUND,
                    content={"detail": f"School with identifier '{tenant_id}' not found"}
                )
            
            if not school.is_active:
                return JSONResponse(
                    status_code=status.HTTP_403_FORBIDDEN,
                    content={"detail": "School account is inactive"}
                )
            
            request.state.school = school
            request.state.school_id = school.id
        
        return await call_next(request)
    
    async def _extract_tenant(self, request: Request) -> Optional[str]:
        """Extract tenant identifier from request."""
        
        # 1. Try header first (for API clients)
        tenant_header = request.headers.get(settings.TENANT_HEADER)
        if tenant_header:
            return tenant_header.strip()
        
        # 2. Try query parameter
        tenant_param = request.query_params.get("tenant")
        if tenant_param:
            return tenant_param.strip()
        
        # 3. Try subdomain extraction
        host = request.headers.get("host", "")
        tenant_from_subdomain = self._extract_tenant_from_subdomain(host)
        if tenant_from_subdomain:
            return tenant_from_subdomain
        
        # 4. Default tenant for development
        if settings.DEFAULT_TENANT:
            return settings.DEFAULT_TENANT
        
        return None
    
    def _extract_tenant_from_subdomain(self, host: str) -> Optional[str]:
        """
        Extract tenant from subdomain.
        Examples:
        - school1.attendance.com -> school1
        - school1.localhost:8000 -> school1
        - localhost:8000 -> None
        """
        if not host:
            return None
        
        # Remove port if present
        host = host.split(':')[0]
        
        # Split by dots
        parts = host.split('.')
        
        # If we have at least 2 parts and the first part is not 'www'
        if len(parts) >= 2 and parts[0] not in ['www', 'localhost', '127']:
            # Validate tenant format (alphanumeric, hyphens allowed)
            tenant = parts[0].lower()
            if re.match(r'^[a-z0-9][a-z0-9-]*[a-z0-9]$', tenant) or re.match(r'^[a-z0-9]$', tenant):
                return tenant
        
        return None
    
    async def _get_school_by_tenant(self, tenant_id: str) -> Optional[School]:
        """Get school by tenant identifier (slug)."""
        async with async_session_factory() as session:
            stmt = select(School).where(School.slug == tenant_id)
            result = await session.execute(stmt)
            return result.scalar_one_or_none()


def get_current_tenant(request: Request) -> Optional[str]:
    """Get current tenant from request state."""
    return getattr(request.state, "tenant_id", None)


def get_current_school(request: Request) -> Optional[School]:
    """Get current school from request state."""
    return getattr(request.state, "school", None)


def get_current_school_id(request: Request) -> Optional[int]:
    """Get current school ID from request state."""
    return getattr(request.state, "school_id", None) 
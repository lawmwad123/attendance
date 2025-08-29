"""
Permissions management endpoints for RBAC + ABAC.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any

from app.api.deps import get_db, require_admin
from app.core.casbin import get_casbin_manager
from app.models.user import User

router = APIRouter()


@router.get("/policies")
async def get_policies(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get all RBAC + ABAC policies."""
    casbin_manager = get_casbin_manager()
    policies = casbin_manager.get_policies()
    
    # Format policies for response
    formatted_policies = []
    for policy in policies:
        if len(policy) >= 3:
            formatted_policies.append({
                "role": policy[0],
                "resource_type": policy[1],
                "resource": policy[2],
                "action": policy[3] if len(policy) > 3 else "",
                "attributes": policy[4:] if len(policy) > 4 else []
            })
    
    return {
        "policies": formatted_policies,
        "total": len(formatted_policies)
    }


@router.post("/policies")
async def add_policy(
    policy_data: Dict[str, Any],
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Add a new RBAC + ABAC policy."""
    required_fields = ["role", "resource_type", "resource", "action"]
    
    for field in required_fields:
        if field not in policy_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Missing required field: {field}"
            )
    
    casbin_manager = get_casbin_manager()
    success = casbin_manager.add_policy(
        role=policy_data["role"],
        resource_type=policy_data["resource_type"],
        resource=policy_data["resource"],
        action=policy_data["action"]
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to add policy"
        )
    
    return {"message": "Policy added successfully"}


@router.delete("/policies")
async def remove_policy(
    policy_data: Dict[str, Any],
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Remove an RBAC + ABAC policy."""
    required_fields = ["role", "resource_type", "resource", "action"]
    
    for field in required_fields:
        if field not in policy_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Missing required field: {field}"
            )
    
    casbin_manager = get_casbin_manager()
    success = casbin_manager.remove_policy(
        role=policy_data["role"],
        resource_type=policy_data["resource_type"],
        resource=policy_data["resource"],
        action=policy_data["action"]
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to remove policy"
        )
    
    return {"message": "Policy removed successfully"}


@router.get("/user-roles/{user_id}")
async def get_user_roles(
    user_id: str,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get all roles for a specific user."""
    casbin_manager = get_casbin_manager()
    roles = casbin_manager.get_user_roles(user_id)
    
    return {
        "user_id": user_id,
        "roles": roles
    }


@router.post("/user-roles/{user_id}")
async def add_user_role(
    user_id: str,
    role_data: Dict[str, str],
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Add a role to a user."""
    if "role" not in role_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing required field: role"
        )
    
    casbin_manager = get_casbin_manager()
    success = casbin_manager.add_user_role(user_id, role_data["role"])
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to add role to user"
        )
    
    return {"message": "Role added to user successfully"}


@router.delete("/user-roles/{user_id}")
async def remove_user_role(
    user_id: str,
    role_data: Dict[str, str],
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Remove a role from a user."""
    if "role" not in role_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing required field: role"
        )
    
    casbin_manager = get_casbin_manager()
    success = casbin_manager.remove_user_role(user_id, role_data["role"])
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to remove role from user"
        )
    
    return {"message": "Role removed from user successfully"}


@router.post("/test-permission")
async def test_permission(
    test_data: Dict[str, Any],
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Test a permission check."""
    required_fields = ["role", "resource_type", "resource", "action"]
    
    for field in required_fields:
        if field not in test_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Missing required field: {field}"
            )
    
    attributes = test_data.get("attributes", {})
    
    casbin_manager = get_casbin_manager()
    has_permission = casbin_manager.check_permission(
        role=test_data["role"],
        resource_type=test_data["resource_type"],
        resource=test_data["resource"],
        action=test_data["action"],
        attributes=attributes
    )
    
    return {
        "has_permission": has_permission,
        "test_data": test_data
    }


@router.get("/role-hierarchy")
async def get_role_hierarchy(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get the role hierarchy."""
    # This would need to be implemented in CasbinManager
    # For now, return a static hierarchy
    hierarchy = {
        "system_developer": ["system_admin", "support_agent", "financial_admin"],
        "system_admin": ["support_agent", "financial_admin"],
        "admin": ["teacher", "security", "parent"],
        "teacher": ["parent"],
        "support_agent": [],
        "financial_admin": [],
        "security": [],
        "parent": [],
        "student": []
    }
    
    return {
        "hierarchy": hierarchy
    }


@router.get("/available-resources")
async def get_available_resources(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get available resource types and resources."""
    resources = {
        "pages": [
            "dashboard", "students", "attendance", "gate-pass", 
            "users", "settings", "analytics", "staff-attendance", "visitors"
        ],
        "features": [
            "attendance_management", "gate_pass_management", "user_management",
            "settings_management", "analytics", "staff_attendance", 
            "visitor_management", "notifications"
        ],
        "api_endpoints": [
            "/api/v1/auth/*", "/api/v1/students/*", "/api/v1/attendance/*",
            "/api/v1/gate-pass/*", "/api/v1/users/*", "/api/v1/settings/*",
            "/api/v1/staff-attendance/*", "/api/v1/visitors/*"
        ]
    }
    
    return resources


@router.get("/available-actions")
async def get_available_actions(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get available actions for different resource types."""
    actions = {
        "pages": ["read", "write"],
        "features": ["full", "limited", "read"],
        "api_endpoints": ["GET", "POST", "PUT", "DELETE", "PATCH"]
    }
    
    return actions

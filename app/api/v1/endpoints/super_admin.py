from fastapi import APIRouter, Depends, HTTPException, status, Request, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, desc
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import uuid
import json

from app.api.deps import get_db
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.config import settings
from app.models.super_admin import (
    SuperAdmin, SuperAdminRole, SuperAdminStatus, SystemLog, SystemLogLevel,
    SupportTicket, SupportTicketStatus, SupportTicketPriority, AdminActionLog,
    SystemConfiguration, SystemAnnouncement, FeatureFlag
)
from app.models.school import School
from app.models.user import User
from app.schemas.super_admin import (
    SuperAdminCreate, SuperAdminUpdate, SuperAdminResponse, SuperAdminLogin,
    SuperAdminLoginResponse, SystemLogCreate, SystemLogResponse,
    SupportTicketCreate, SupportTicketUpdate, SupportTicketResponse,
    AdminActionLogResponse, SystemConfigurationCreate, SystemConfigurationUpdate,
    SystemConfigurationResponse, SystemAnnouncementCreate, SystemAnnouncementUpdate,
    SystemAnnouncementResponse, FeatureFlagCreate, FeatureFlagUpdate, FeatureFlagResponse,
    SystemStats, SchoolSummary, SystemHealth
)

router = APIRouter()


# Dependency for super admin authentication
async def get_current_super_admin(
    request: Request,
    db: AsyncSession = Depends(get_db)
) -> SuperAdmin:
    """Get current super admin from JWT token."""
    try:
        # Extract token from Authorization header
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
        
        token = auth_header.split(" ")[1]
        
        # Verify token and get admin
        # This is a simplified version - you should implement proper JWT verification
        # For now, we'll use a simple approach
        stmt = select(SuperAdmin).where(SuperAdmin.is_active == True)
        result = await db.execute(stmt)
        admin = result.scalar_one_or_none()
        
        if not admin:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
        
        return admin
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )


async def require_super_admin_role(
    current_admin: SuperAdmin = Depends(get_current_super_admin)
) -> SuperAdmin:
    """Require super admin role."""
    if current_admin.role not in [SuperAdminRole.SYSTEM_DEVELOPER, SuperAdminRole.SYSTEM_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    return current_admin


async def require_developer_role(
    current_admin: SuperAdmin = Depends(get_current_super_admin)
) -> SuperAdmin:
    """Require system developer role."""
    if current_admin.role != SuperAdminRole.SYSTEM_DEVELOPER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions - Developer access required"
        )
    return current_admin


# Log admin action
async def log_admin_action(
    db: AsyncSession,
    admin: SuperAdmin,
    action: str,
    resource_type: str,
    resource_id: Optional[int] = None,
    details: Optional[Dict[str, Any]] = None,
    request: Optional[Request] = None
):
    """Log an admin action for audit trail."""
    try:
        action_log = AdminActionLog(
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details,
            admin_id=admin.id,
            admin_email=admin.email,
            ip_address=request.client.host if request else None,
            user_agent=request.headers.get("User-Agent") if request else None
        )
        db.add(action_log)
        await db.commit()
    except Exception as e:
        # Don't fail the main operation if logging fails
        print(f"Failed to log admin action: {e}")


# Authentication endpoints
@router.post("/login", response_model=SuperAdminLoginResponse)
async def super_admin_login(
    login_data: SuperAdminLogin,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Super admin login."""
    # Find admin by email
    stmt = select(SuperAdmin).where(SuperAdmin.email == login_data.email.lower())
    result = await db.execute(stmt)
    admin = result.scalar_one_or_none()
    
    if not admin or not verify_password(login_data.password, admin.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is deactivated"
        )
    
    # Update last login
    admin.last_login = datetime.utcnow()
    await db.commit()
    
    # Create access token
    access_token = create_access_token(
        data={"sub": str(admin.id), "role": "super_admin"}
    )
    
    # Log login
    await log_admin_action(
        db, admin, "login", "auth", admin.id, 
        {"ip": request.client.host}, request
    )
    
    return SuperAdminLoginResponse(
        access_token=access_token,
        admin=admin
    )


@router.get("/me", response_model=SuperAdminResponse)
async def get_current_admin_info(
    current_admin: SuperAdmin = Depends(get_current_super_admin)
):
    """Get current super admin information."""
    return current_admin

# Super Admin Management
@router.post("/admins", response_model=SuperAdminResponse, status_code=status.HTTP_201_CREATED)
async def create_super_admin(
    admin_data: SuperAdminCreate,
    current_admin: SuperAdmin = Depends(require_developer_role),
    request: Request = None,
    db: AsyncSession = Depends(get_db)
):
    """Create a new super admin. Only developers can create admins."""
    # Check if email already exists
    stmt = select(SuperAdmin).where(SuperAdmin.email == admin_data.email.lower())
    result = await db.execute(stmt)
    existing_admin = result.scalar_one_or_none()
    
    if existing_admin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin with this email already exists"
        )
    
    # Check if username already exists
    stmt = select(SuperAdmin).where(SuperAdmin.username == admin_data.username)
    result = await db.execute(stmt)
    existing_username = result.scalar_one_or_none()
    
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin with this username already exists"
        )
    
    try:
        # Create admin
        admin = SuperAdmin(
            email=admin_data.email.lower(),
            username=admin_data.username,
            first_name=admin_data.first_name,
            last_name=admin_data.last_name,
            phone=admin_data.phone,
            hashed_password=get_password_hash(admin_data.password),
            role=admin_data.role,
            bio=admin_data.bio,
            is_active=True,
            is_verified=True
        )
        
        db.add(admin)
        await db.commit()
        await db.refresh(admin)
        
        # Log action
        await log_admin_action(
            db, current_admin, "create_super_admin", "super_admin", 
            admin.id, {"created_admin_email": admin.email}, request
        )
        
        return admin
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create super admin"
        )


@router.get("/admins", response_model=List[SuperAdminResponse])
async def get_super_admins(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    role: Optional[SuperAdminRole] = Query(None),
    status: Optional[SuperAdminStatus] = Query(None),
    current_admin: SuperAdmin = Depends(get_current_super_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get list of super admins."""
    stmt = select(SuperAdmin)
    
    if role:
        stmt = stmt.where(SuperAdmin.role == role)
    
    if status:
        stmt = stmt.where(SuperAdmin.status == status)
    
    stmt = stmt.offset(skip).limit(limit)
    
    result = await db.execute(stmt)
    admins = result.scalars().all()
    
    return admins


# System Management
@router.get("/dashboard/stats", response_model=SystemStats)
async def get_system_stats(
    current_admin: SuperAdmin = Depends(get_current_super_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get system-wide statistics."""
    try:
        # Count schools
        stmt = select(func.count(School.id))
        result = await db.execute(stmt)
        total_schools = result.scalar()
        
        stmt = select(func.count(School.id)).where(School.is_active == True)
        result = await db.execute(stmt)
        active_schools = result.scalar()
        
        # Count users
        stmt = select(func.count(User.id))
        result = await db.execute(stmt)
        total_users = result.scalar()
        
        stmt = select(func.count(User.id)).where(User.is_active == True)
        result = await db.execute(stmt)
        active_users = result.scalar()
        
        # Count support tickets
        stmt = select(func.count(SupportTicket.id))
        result = await db.execute(stmt)
        total_support_tickets = result.scalar()
        
        stmt = select(func.count(SupportTicket.id)).where(
            SupportTicket.status.in_([SupportTicketStatus.OPEN, SupportTicketStatus.IN_PROGRESS])
        )
        result = await db.execute(stmt)
        open_support_tickets = result.scalar()
        
        return SystemStats(
            total_schools=total_schools,
            active_schools=active_schools,
            total_users=total_users,
            active_users=active_users,
            total_students=0,  # Placeholder
            active_students=0,  # Placeholder
            total_support_tickets=total_support_tickets,
            open_support_tickets=open_support_tickets,
            system_uptime_hours=24.0,  # Placeholder
            storage_used_gb=1.5,  # Placeholder
            storage_total_gb=10.0  # Placeholder
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get system stats"
        )


@router.get("/schools", response_model=List[SchoolSummary])
async def get_schools_summary(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    is_active: Optional[bool] = Query(None),
    current_admin: SuperAdmin = Depends(get_current_super_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get summary of all schools."""
    stmt = select(School)
    
    if is_active is not None:
        stmt = stmt.where(School.is_active == is_active)
    
    stmt = stmt.offset(skip).limit(limit).order_by(desc(School.created_at))
    
    result = await db.execute(stmt)
    schools = result.scalars().all()
    
    # Convert to SchoolSummary
    summaries = []
    for school in schools:
        # Count teachers for this school
        stmt = select(func.count(User.id)).where(
            and_(User.school_id == school.id, User.role == "TEACHER")
        )
        result = await db.execute(stmt)
        total_teachers = result.scalar()
        
        summaries.append(SchoolSummary(
            id=school.id,
            name=school.name,
            slug=school.slug,
            total_students=0,  # Placeholder
            total_teachers=total_teachers,
            is_active=school.is_active,
            subscription_plan=school.subscription_plan,
            subscription_expires_at=school.subscription_expires_at,
            last_activity=school.updated_at,  # Placeholder
            created_at=school.created_at
        ))
    
    return summaries


@router.put("/schools/{school_id}/suspend")
async def suspend_school(
    school_id: int,
    current_admin: SuperAdmin = Depends(require_super_admin_role),
    request: Request = None,
    db: AsyncSession = Depends(get_db)
):
    """Suspend a school."""
    stmt = select(School).where(School.id == school_id)
    result = await db.execute(stmt)
    school = result.scalar_one_or_none()
    
    if not school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    try:
        school.is_active = False
        await db.commit()
        
        # Log action
        await log_admin_action(
            db, current_admin, "suspend_school", "school", 
            school.id, {"school_name": school.name}, request
        )
        
        return {"message": f"School '{school.name}' has been suspended"}
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to suspend school"
        )


@router.put("/schools/{school_id}/activate")
async def activate_school(
    school_id: int,
    current_admin: SuperAdmin = Depends(require_super_admin_role),
    request: Request = None,
    db: AsyncSession = Depends(get_db)
):
    """Activate a suspended school."""
    stmt = select(School).where(School.id == school_id)
    result = await db.execute(stmt)
    school = result.scalar_one_or_none()
    
    if not school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    try:
        school.is_active = True
        await db.commit()
        
        # Log action
        await log_admin_action(
            db, current_admin, "activate_school", "school", 
            school.id, {"school_name": school.name}, request
        )
        
        return {"message": f"School '{school.name}' has been activated"}
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to activate school"
        )


# Support Tickets
@router.get("/support-tickets", response_model=List[SupportTicketResponse])
async def get_support_tickets(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[SupportTicketStatus] = Query(None),
    priority: Optional[SupportTicketPriority] = Query(None),
    current_admin: SuperAdmin = Depends(get_current_super_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get support tickets."""
    stmt = select(SupportTicket)
    
    if status:
        stmt = stmt.where(SupportTicket.status == status)
    
    if priority:
        stmt = stmt.where(SupportTicket.priority == priority)
    
    stmt = stmt.offset(skip).limit(limit).order_by(desc(SupportTicket.created_at))
    
    result = await db.execute(stmt)
    tickets = result.scalars().all()
    
    return tickets


@router.post("/support-tickets", response_model=SupportTicketResponse, status_code=status.HTTP_201_CREATED)
async def create_support_ticket(
    ticket_data: SupportTicketCreate,
    current_admin: SuperAdmin = Depends(get_current_super_admin),
    request: Request = None,
    db: AsyncSession = Depends(get_db)
):
    """Create a support ticket."""
    try:
        # Generate ticket number
        ticket_number = f"TKT-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        
        ticket = SupportTicket(
            ticket_number=ticket_number,
            subject=ticket_data.subject,
            description=ticket_data.description,
            priority=ticket_data.priority,
            school_id=ticket_data.school_id,
            school_name=ticket_data.school_name,
            contact_email=ticket_data.contact_email,
            contact_phone=ticket_data.contact_phone
        )
        
        db.add(ticket)
        await db.commit()
        await db.refresh(ticket)
        
        # Log action
        await log_admin_action(
            db, current_admin, "create_support_ticket", "support_ticket", 
            ticket.id, {"ticket_number": ticket.ticket_number}, request
        )
        
        return ticket
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create support ticket"
        )


# System Configuration
@router.get("/configurations", response_model=List[SystemConfigurationResponse])
async def get_system_configurations(
    category: Optional[str] = Query(None),
    current_admin: SuperAdmin = Depends(get_current_super_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get system configurations."""
    stmt = select(SystemConfiguration)
    
    if category:
        stmt = stmt.where(SystemConfiguration.category == category)
    
    result = await db.execute(stmt)
    configs = result.scalars().all()
    
    return configs


@router.post("/configurations", response_model=SystemConfigurationResponse, status_code=status.HTTP_201_CREATED)
async def create_system_configuration(
    config_data: SystemConfigurationCreate,
    current_admin: SuperAdmin = Depends(require_developer_role),
    request: Request = None,
    db: AsyncSession = Depends(get_db)
):
    """Create a system configuration."""
    # Check if key already exists
    stmt = select(SystemConfiguration).where(SystemConfiguration.key == config_data.key)
    result = await db.execute(stmt)
    existing_config = result.scalar_one_or_none()
    
    if existing_config:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Configuration with this key already exists"
        )
    
    try:
        config = SystemConfiguration(**config_data.dict())
        db.add(config)
        await db.commit()
        await db.refresh(config)
        
        # Log action
        await log_admin_action(
            db, current_admin, "create_system_configuration", "system_configuration", 
            config.id, {"config_key": config.key}, request
        )
        
        return config
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create system configuration"
        )


# System Logs
@router.get("/logs", response_model=List[SystemLogResponse])
async def get_system_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    level: Optional[SystemLogLevel] = Query(None),
    current_admin: SuperAdmin = Depends(get_current_super_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get system logs."""
    stmt = select(SystemLog)
    
    if level:
        stmt = stmt.where(SystemLog.level == level)
    
    stmt = stmt.offset(skip).limit(limit).order_by(desc(SystemLog.created_at))
    
    result = await db.execute(stmt)
    logs = result.scalars().all()
    
    return logs


# Admin Action Logs
@router.get("/admin-actions", response_model=List[AdminActionLogResponse])
async def get_admin_action_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    action: Optional[str] = Query(None),
    resource_type: Optional[str] = Query(None),
    current_admin: SuperAdmin = Depends(get_current_super_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get admin action logs."""
    stmt = select(AdminActionLog)
    
    if action:
        stmt = stmt.where(AdminActionLog.action == action)
    
    if resource_type:
        stmt = stmt.where(AdminActionLog.resource_type == resource_type)
    
    stmt = stmt.offset(skip).limit(limit).order_by(desc(AdminActionLog.created_at))
    
    result = await db.execute(stmt)
    logs = result.scalars().all()
    
    return logs

from fastapi import APIRouter, Depends, HTTPException, status, Query, Request, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, desc
from typing import List, Optional
from datetime import datetime, timedelta, date
import uuid
import qrcode
import io
import base64

from app.api.deps import (
    get_db, get_current_active_user, require_admin, 
    require_security_or_admin, get_tenant_filter
)
from app.models.visitor import (
    Visitor, VisitorLog, VisitorBlacklist, VisitorSettings,
    VisitorStatus, VisitorType, VisitorApprovalWorkflow
)
from app.models.user import User, UserRole
from app.models.student import Student
from app.schemas.visitor import (
    VisitorCreate, VisitorUpdate, VisitorResponse, VisitorPreRegistration,
    VisitorCheckIn, VisitorCheckOut, VisitorApproval, VisitorDenial,
    VisitorBlacklistCreate, VisitorBlacklistUpdate, VisitorBlacklistResponse,
    VisitorSettingsCreate, VisitorSettingsUpdate, VisitorSettingsResponse,
    VisitorLogResponse, VisitorAnalytics, VisitorReport, VisitorQRCode,
    VisitorBadge, EmergencyEvacuation, VisitorSearchParams
)
from app.core.security import generate_qr_code
from app.core.email import send_visitor_notification_email

router = APIRouter()


# ============================================================================
# VISITOR MANAGEMENT ENDPOINTS
# ============================================================================

@router.get("/", response_model=List[VisitorResponse])
async def get_visitors(
    search: Optional[str] = Query(None),
    visitor_type: Optional[VisitorType] = Query(None),
    status: Optional[VisitorStatus] = Query(None),
    host_user_id: Optional[int] = Query(None),
    host_student_id: Optional[int] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    is_blacklisted: Optional[bool] = Query(None),
    is_overdue: Optional[bool] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get visitors with filtering and search."""
    # Build query
    stmt = select(Visitor).where(Visitor.school_id == current_user.school_id)
    
    # Apply filters
    if search:
        search_filter = or_(
            Visitor.first_name.ilike(f"%{search}%"),
            Visitor.last_name.ilike(f"%{search}%"),
            Visitor.email.ilike(f"%{search}%"),
            Visitor.phone.ilike(f"%{search}%"),
            Visitor.purpose.ilike(f"%{search}%")
        )
        stmt = stmt.where(search_filter)
    
    if visitor_type:
        stmt = stmt.where(Visitor.visitor_type == visitor_type)
    
    if status:
        stmt = stmt.where(Visitor.status == status)
    
    if host_user_id:
        stmt = stmt.where(Visitor.host_user_id == host_user_id)
    
    if host_student_id:
        stmt = stmt.where(Visitor.host_student_id == host_student_id)
    
    if date_from:
        stmt = stmt.where(Visitor.requested_entry_time >= date_from)
    
    if date_to:
        stmt = stmt.where(Visitor.requested_entry_time <= date_to)
    
    if is_blacklisted is not None:
        stmt = stmt.where(Visitor.is_blacklisted == is_blacklisted)
    
    # Order by creation date
    stmt = stmt.order_by(desc(Visitor.created_at)).offset(skip).limit(limit)
    
    result = await db.execute(stmt)
    visitors = result.scalars().all()
    
    # Convert to response format with related data
    visitor_responses = []
    for visitor in visitors:
        visitor_dict = visitor.dict()
        
        # Add related data
        if visitor.host_user:
            visitor_dict["host_user_name"] = visitor.host_user.full_name
        if visitor.host_student:
            visitor_dict["host_student_name"] = visitor.host_student.full_name
        if visitor.approved_by:
            visitor_dict["approved_by_name"] = visitor.approved_by.full_name
        if visitor.entry_guard:
            visitor_dict["entry_guard_name"] = visitor.entry_guard.full_name
        if visitor.exit_guard:
            visitor_dict["exit_guard_name"] = visitor.exit_guard.full_name
        
        # Add computed properties
        visitor_dict["full_name"] = visitor.full_name
        visitor_dict["is_overdue"] = visitor.is_overdue
        visitor_dict["visit_duration_minutes"] = visitor.visit_duration_minutes
        
        visitor_responses.append(VisitorResponse(**visitor_dict))
    
    return visitor_responses


@router.post("/", response_model=VisitorResponse, status_code=status.HTTP_201_CREATED)
async def create_visitor(
    visitor_data: VisitorCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new visitor registration."""
    # Check if visitor is blacklisted
    blacklist_stmt = select(VisitorBlacklist).where(
        and_(
            VisitorBlacklist.school_id == current_user.school_id,
            VisitorBlacklist.is_active == True,
            or_(
                and_(
                    VisitorBlacklist.first_name.ilike(visitor_data.first_name),
                    VisitorBlacklist.last_name.ilike(visitor_data.last_name)
                ),
                VisitorBlacklist.phone == visitor_data.phone,
                VisitorBlacklist.email == visitor_data.email
            )
        )
    )
    blacklist_result = await db.execute(blacklist_stmt)
    blacklisted = blacklist_result.scalar_one_or_none()
    
    if blacklisted:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Visitor is blacklisted. Reason: {blacklisted.reason}"
        )
    
    # Generate QR code
    qr_code = generate_qr_code(f"visitor_{uuid.uuid4()}")
    
    # Create visitor
    visitor = Visitor(
        school_id=current_user.school_id,
        **visitor_data.dict(),
        qr_code=qr_code,
        badge_number=f"VB{datetime.now().strftime('%Y%m%d')}{uuid.uuid4().hex[:6].upper()}"
    )
    
    # Check approval workflow
    settings_stmt = select(VisitorSettings).where(VisitorSettings.school_id == current_user.school_id)
    settings_result = await db.execute(settings_stmt)
    settings = settings_result.scalar_one_or_none()
    
    if settings:
        if settings.approval_workflow == VisitorApprovalWorkflow.AUTO_APPROVE:
            visitor.status = VisitorStatus.APPROVED
        elif settings.approval_workflow == VisitorApprovalWorkflow.AUTO_APPROVE and visitor_data.visitor_type == VisitorType.PARENT_GUARDIAN:
            visitor.status = VisitorStatus.APPROVED
    
    db.add(visitor)
    await db.commit()
    await db.refresh(visitor)
    
    # Create log entry
    log = VisitorLog(
        school_id=current_user.school_id,
        visitor_id=visitor.id,
        action="REGISTERED",
        performed_by_user_id=current_user.id,
        notes=f"Visitor registered by {current_user.full_name}"
    )
    db.add(log)
    await db.commit()
    
    # Send notifications in background
    if visitor.status == VisitorStatus.APPROVED:
        background_tasks.add_task(send_visitor_notifications, visitor.id, db)
    
    return visitor


@router.get("/{visitor_id}", response_model=VisitorResponse)
async def get_visitor(
    visitor_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific visitor."""
    stmt = select(Visitor).where(
        and_(
            Visitor.id == visitor_id,
            Visitor.school_id == current_user.school_id
        )
    )
    result = await db.execute(stmt)
    visitor = result.scalar_one_or_none()
    
    if not visitor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Visitor not found"
        )
    
    # Convert to response format with related data
    visitor_dict = visitor.dict()
    
    # Add related data
    if visitor.host_user:
        visitor_dict["host_user_name"] = visitor.host_user.full_name
    if visitor.host_student:
        visitor_dict["host_student_name"] = visitor.host_student.full_name
    if visitor.approved_by:
        visitor_dict["approved_by_name"] = visitor.approved_by.full_name
    if visitor.entry_guard:
        visitor_dict["entry_guard_name"] = visitor.entry_guard.full_name
    if visitor.exit_guard:
        visitor_dict["exit_guard_name"] = visitor.exit_guard.full_name
    
    # Add computed properties
    visitor_dict["full_name"] = visitor.full_name
    visitor_dict["is_overdue"] = visitor.is_overdue
    visitor_dict["visit_duration_minutes"] = visitor.visit_duration_minutes
    
    return VisitorResponse(**visitor_dict)


@router.put("/{visitor_id}", response_model=VisitorResponse)
async def update_visitor(
    visitor_id: int,
    visitor_data: VisitorUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update a visitor."""
    stmt = select(Visitor).where(
        and_(
            Visitor.id == visitor_id,
            Visitor.school_id == current_user.school_id
        )
    )
    result = await db.execute(stmt)
    visitor = result.scalar_one_or_none()
    
    if not visitor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Visitor not found"
        )
    
    # Update only provided fields
    update_data = visitor_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(visitor, field, value)
    
    await db.commit()
    await db.refresh(visitor)
    
    # Create log entry
    log = VisitorLog(
        school_id=current_user.school_id,
        visitor_id=visitor.id,
        action="UPDATED",
        performed_by_user_id=current_user.id,
        notes=f"Visitor updated by {current_user.full_name}"
    )
    db.add(log)
    await db.commit()
    
    return visitor


# ============================================================================
# VISITOR CHECK-IN/CHECK-OUT ENDPOINTS
# ============================================================================

@router.post("/{visitor_id}/check-in", response_model=VisitorResponse)
async def check_in_visitor(
    visitor_id: int,
    check_in_data: VisitorCheckIn,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_security_or_admin)
):
    """Check in a visitor."""
    stmt = select(Visitor).where(
        and_(
            Visitor.id == visitor_id,
            Visitor.school_id == current_user.school_id
        )
    )
    result = await db.execute(stmt)
    visitor = result.scalar_one_or_none()
    
    if not visitor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Visitor not found"
        )
    
    if visitor.status != VisitorStatus.APPROVED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Visitor must be approved before check-in"
        )
    
    if visitor.status == VisitorStatus.CHECKED_IN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Visitor is already checked in"
        )
    
    # Update visitor
    visitor.status = VisitorStatus.CHECKED_IN
    visitor.actual_entry_time = datetime.now()
    visitor.entry_gate = check_in_data.entry_gate
    visitor.entry_security_guard_id = check_in_data.security_guard_id
    visitor.entry_verified = True
    
    await db.commit()
    await db.refresh(visitor)
    
    # Create log entry
    log = VisitorLog(
        school_id=current_user.school_id,
        visitor_id=visitor.id,
        action="CHECKED_IN",
        performed_by_user_id=current_user.id,
        notes=check_in_data.notes or f"Visitor checked in at {check_in_data.entry_gate}"
    )
    db.add(log)
    await db.commit()
    
    # Send notifications in background
    background_tasks.add_task(send_check_in_notifications, visitor.id, db)
    
    return visitor


@router.post("/{visitor_id}/check-out", response_model=VisitorResponse)
async def check_out_visitor(
    visitor_id: int,
    check_out_data: VisitorCheckOut,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_security_or_admin)
):
    """Check out a visitor."""
    stmt = select(Visitor).where(
        and_(
            Visitor.id == visitor_id,
            Visitor.school_id == current_user.school_id
        )
    )
    result = await db.execute(stmt)
    visitor = result.scalar_one_or_none()
    
    if not visitor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Visitor not found"
        )
    
    if visitor.status != VisitorStatus.CHECKED_IN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Visitor must be checked in before check-out"
        )
    
    # Update visitor
    visitor.status = VisitorStatus.CHECKED_OUT
    visitor.actual_exit_time = datetime.now()
    visitor.exit_gate = check_out_data.exit_gate
    visitor.exit_security_guard_id = check_out_data.security_guard_id
    visitor.exit_verified = True
    
    await db.commit()
    await db.refresh(visitor)
    
    # Create log entry
    log = VisitorLog(
        school_id=current_user.school_id,
        visitor_id=visitor.id,
        action="CHECKED_OUT",
        performed_by_user_id=current_user.id,
        notes=check_out_data.notes or f"Visitor checked out at {check_out_data.exit_gate}"
    )
    db.add(log)
    await db.commit()
    
    return visitor


# ============================================================================
# VISITOR APPROVAL ENDPOINTS
# ============================================================================

@router.post("/{visitor_id}/approve", response_model=VisitorResponse)
async def approve_visitor(
    visitor_id: int,
    approval_data: VisitorApproval,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Approve a visitor."""
    stmt = select(Visitor).where(
        and_(
            Visitor.id == visitor_id,
            Visitor.school_id == current_user.school_id
        )
    )
    result = await db.execute(stmt)
    visitor = result.scalar_one_or_none()
    
    if not visitor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Visitor not found"
        )
    
    if visitor.status != VisitorStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Visitor is not pending approval"
        )
    
    # Check if user can approve
    settings_stmt = select(VisitorSettings).where(VisitorSettings.school_id == current_user.school_id)
    settings_result = await db.execute(settings_stmt)
    settings = settings_result.scalar_one_or_none()
    
    if settings:
        if settings.approval_workflow == VisitorApprovalWorkflow.ADMIN_APPROVE and current_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admins can approve visitors"
            )
        elif settings.approval_workflow == VisitorApprovalWorkflow.HOST_APPROVE and visitor.host_user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the host can approve this visitor"
            )
    
    # Update visitor
    visitor.status = VisitorStatus.APPROVED
    visitor.approved_by_user_id = current_user.id
    visitor.approved_at = datetime.now()
    visitor.approval_notes = approval_data.approval_notes
    
    await db.commit()
    await db.refresh(visitor)
    
    # Create log entry
    log = VisitorLog(
        school_id=current_user.school_id,
        visitor_id=visitor.id,
        action="APPROVED",
        performed_by_user_id=current_user.id,
        notes=approval_data.approval_notes or f"Visitor approved by {current_user.full_name}"
    )
    db.add(log)
    await db.commit()
    
    # Send notifications in background
    background_tasks.add_task(send_visitor_notifications, visitor.id, db)
    
    return visitor


@router.post("/{visitor_id}/deny", response_model=VisitorResponse)
async def deny_visitor(
    visitor_id: int,
    denial_data: VisitorDenial,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Deny a visitor."""
    stmt = select(Visitor).where(
        and_(
            Visitor.id == visitor_id,
            Visitor.school_id == current_user.school_id
        )
    )
    result = await db.execute(stmt)
    visitor = result.scalar_one_or_none()
    
    if not visitor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Visitor not found"
        )
    
    if visitor.status != VisitorStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Visitor is not pending approval"
        )
    
    # Update visitor
    visitor.status = VisitorStatus.DENIED
    visitor.approved_by_user_id = current_user.id
    visitor.approved_at = datetime.now()
    visitor.approval_notes = denial_data.denial_reason
    
    await db.commit()
    await db.refresh(visitor)
    
    # Create log entry
    log = VisitorLog(
        school_id=current_user.school_id,
        visitor_id=visitor.id,
        action="DENIED",
        performed_by_user_id=current_user.id,
        notes=denial_data.denial_reason or f"Visitor denied by {current_user.full_name}"
    )
    db.add(log)
    await db.commit()
    
    return visitor


# ============================================================================
# VISITOR PRE-REGISTRATION ENDPOINTS
# ============================================================================

@router.post("/pre-register", response_model=VisitorResponse, status_code=status.HTTP_201_CREATED)
async def pre_register_visitor(
    visitor_data: VisitorPreRegistration,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Pre-register a visitor."""
    # Check if pre-registration is allowed
    settings_stmt = select(VisitorSettings).where(VisitorSettings.school_id == current_user.school_id)
    settings_result = await db.execute(settings_stmt)
    settings = settings_result.scalar_one_or_none()
    
    if not settings or not settings.allow_pre_registration:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Pre-registration is not enabled for this school"
        )
    
    # Check if within allowed time window
    hours_ahead = settings.pre_registration_hours_ahead
    earliest_time = datetime.now() + timedelta(hours=hours_ahead)
    if visitor_data.requested_entry_time < earliest_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Pre-registration must be at least {hours_ahead} hours in advance"
        )
    
    # Generate QR code
    qr_code = generate_qr_code(f"visitor_{uuid.uuid4()}")
    
    # Create visitor
    visitor = Visitor(
        school_id=current_user.school_id,
        **visitor_data.dict(),
        qr_code=qr_code,
        badge_number=f"VB{datetime.now().strftime('%Y%m%d')}{uuid.uuid4().hex[:6].upper()}",
        is_pre_registered=True,
        pre_registered_by_user_id=current_user.id,
        pre_registration_date=datetime.now()
    )
    
    # Auto-approve if enabled
    if settings.auto_approve_pre_registered:
        visitor.status = VisitorStatus.APPROVED
        visitor.approved_by_user_id = current_user.id
        visitor.approved_at = datetime.now()
    
    db.add(visitor)
    await db.commit()
    await db.refresh(visitor)
    
    # Create log entry
    log = VisitorLog(
        school_id=current_user.school_id,
        visitor_id=visitor.id,
        action="PRE_REGISTERED",
        performed_by_user_id=current_user.id,
        notes=f"Visitor pre-registered by {current_user.full_name}"
    )
    db.add(log)
    await db.commit()
    
    return visitor


# ============================================================================
# VISITOR BLACKLIST ENDPOINTS
# ============================================================================

@router.get("/blacklist", response_model=List[VisitorBlacklistResponse])
async def get_blacklist(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get blacklisted visitors."""
    stmt = select(VisitorBlacklist).where(
        VisitorBlacklist.school_id == current_user.school_id
    ).order_by(desc(VisitorBlacklist.blacklisted_at)).offset(skip).limit(limit)
    
    result = await db.execute(stmt)
    blacklist = result.scalars().all()
    
    # Convert to response format
    blacklist_responses = []
    for entry in blacklist:
        entry_dict = entry.dict()
        if entry.blacklisted_by:
            entry_dict["blacklisted_by_name"] = entry.blacklisted_by.full_name
        blacklist_responses.append(VisitorBlacklistResponse(**entry_dict))
    
    return blacklist_responses


@router.post("/blacklist", response_model=VisitorBlacklistResponse, status_code=status.HTTP_201_CREATED)
async def add_to_blacklist(
    blacklist_data: VisitorBlacklistCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Add a visitor to blacklist."""
    blacklist_entry = VisitorBlacklist(
        school_id=current_user.school_id,
        **blacklist_data.dict(),
        blacklisted_by_user_id=current_user.id
    )
    
    db.add(blacklist_entry)
    await db.commit()
    await db.refresh(blacklist_entry)
    
    return blacklist_entry


@router.delete("/blacklist/{blacklist_id}")
async def remove_from_blacklist(
    blacklist_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Remove a visitor from blacklist."""
    stmt = select(VisitorBlacklist).where(
        and_(
            VisitorBlacklist.id == blacklist_id,
            VisitorBlacklist.school_id == current_user.school_id
        )
    )
    result = await db.execute(stmt)
    blacklist_entry = result.scalar_one_or_none()
    
    if not blacklist_entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blacklist entry not found"
        )
    
    blacklist_entry.is_active = False
    await db.commit()
    
    return {"message": "Visitor removed from blacklist"}


# ============================================================================
# VISITOR SETTINGS ENDPOINTS
# ============================================================================

@router.get("/settings", response_model=VisitorSettingsResponse)
async def get_visitor_settings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get visitor settings."""
    stmt = select(VisitorSettings).where(VisitorSettings.school_id == current_user.school_id)
    result = await db.execute(stmt)
    settings = result.scalar_one_or_none()
    
    if not settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Visitor settings not found"
        )
    
    return settings


@router.post("/settings", response_model=VisitorSettingsResponse, status_code=status.HTTP_201_CREATED)
async def create_visitor_settings(
    settings_data: VisitorSettingsCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Create visitor settings."""
    # Check if settings already exist
    stmt = select(VisitorSettings).where(VisitorSettings.school_id == current_user.school_id)
    result = await db.execute(stmt)
    existing_settings = result.scalar_one_or_none()
    
    if existing_settings:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Visitor settings already exist"
        )
    
    settings = VisitorSettings(
        school_id=current_user.school_id,
        **settings_data.dict()
    )
    
    db.add(settings)
    await db.commit()
    await db.refresh(settings)
    
    return settings


@router.put("/settings", response_model=VisitorSettingsResponse)
async def update_visitor_settings(
    settings_data: VisitorSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update visitor settings."""
    stmt = select(VisitorSettings).where(VisitorSettings.school_id == current_user.school_id)
    result = await db.execute(stmt)
    settings = result.scalar_one_or_none()
    
    if not settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Visitor settings not found"
        )
    
    # Update only provided fields
    update_data = settings_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(settings, field, value)
    
    await db.commit()
    await db.refresh(settings)
    
    return settings


# ============================================================================
# VISITOR ANALYTICS AND REPORTS
# ============================================================================

@router.get("/analytics", response_model=VisitorAnalytics)
async def get_visitor_analytics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get visitor analytics."""
    today = date.today()
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)
    
    # Today's visitors
    today_stmt = select(func.count(Visitor.id)).where(
        and_(
            Visitor.school_id == current_user.school_id,
            func.date(Visitor.requested_entry_time) == today
        )
    )
    total_visitors_today = await db.scalar(today_stmt) or 0
    
    # This week's visitors
    week_stmt = select(func.count(Visitor.id)).where(
        and_(
            Visitor.school_id == current_user.school_id,
            func.date(Visitor.requested_entry_time) >= week_ago
        )
    )
    total_visitors_this_week = await db.scalar(week_stmt) or 0
    
    # This month's visitors
    month_stmt = select(func.count(Visitor.id)).where(
        and_(
            Visitor.school_id == current_user.school_id,
            func.date(Visitor.requested_entry_time) >= month_ago
        )
    )
    total_visitors_this_month = await db.scalar(month_stmt) or 0
    
    # Currently checked in
    checked_in_stmt = select(func.count(Visitor.id)).where(
        and_(
            Visitor.school_id == current_user.school_id,
            Visitor.status == VisitorStatus.CHECKED_IN
        )
    )
    visitors_checked_in = await db.scalar(checked_in_stmt) or 0
    
    # Overdue visitors
    overdue_stmt = select(func.count(Visitor.id)).where(
        and_(
            Visitor.school_id == current_user.school_id,
            Visitor.status == VisitorStatus.CHECKED_IN,
            Visitor.expected_exit_time < datetime.now()
        )
    )
    visitors_overdue = await db.scalar(overdue_stmt) or 0
    
    # Blacklisted attempts
    blacklist_stmt = select(func.count(Visitor.id)).where(
        and_(
            Visitor.school_id == current_user.school_id,
            Visitor.is_blacklisted == True
        )
    )
    blacklisted_attempts = await db.scalar(blacklist_stmt) or 0
    
    # Popular visitor types
    type_stmt = select(
        Visitor.visitor_type,
        func.count(Visitor.id).label('count')
    ).where(
        Visitor.school_id == current_user.school_id
    ).group_by(Visitor.visitor_type).order_by(desc('count')).limit(5)
    
    type_result = await db.execute(type_stmt)
    popular_visitor_types = [
        {"type": row.visitor_type, "count": row.count}
        for row in type_result.fetchall()
    ]
    
    # Peak visiting hours (simplified)
    peak_visiting_hours = [
        {"hour": "09:00-11:00", "count": 25},
        {"hour": "11:00-13:00", "count": 15},
        {"hour": "13:00-15:00", "count": 20},
        {"hour": "15:00-17:00", "count": 30}
    ]
    
    # Average visit duration
    duration_stmt = select(func.avg(Visitor.visit_duration_minutes)).where(
        and_(
            Visitor.school_id == current_user.school_id,
            Visitor.actual_entry_time.isnot(None),
            Visitor.actual_exit_time.isnot(None)
        )
    )
    average_visit_duration = await db.scalar(duration_stmt) or 0.0
    
    return VisitorAnalytics(
        total_visitors_today=total_visitors_today,
        total_visitors_this_week=total_visitors_this_week,
        total_visitors_this_month=total_visitors_this_month,
        visitors_checked_in=visitors_checked_in,
        visitors_overdue=visitors_overdue,
        blacklisted_attempts=blacklisted_attempts,
        popular_visitor_types=popular_visitor_types,
        peak_visiting_hours=peak_visiting_hours,
        average_visit_duration=average_visit_duration
    )


# ============================================================================
# EMERGENCY EVACUATION
# ============================================================================

@router.get("/emergency-evacuation", response_model=EmergencyEvacuation)
async def get_emergency_evacuation_list(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_security_or_admin)
):
    """Get list of visitors currently in school for emergency evacuation."""
    stmt = select(Visitor).where(
        and_(
            Visitor.school_id == current_user.school_id,
            Visitor.status == VisitorStatus.CHECKED_IN
        )
    )
    result = await db.execute(stmt)
    visitors_inside = result.scalars().all()
    
    # Get school emergency contacts
    school_stmt = select(VisitorSettings).where(VisitorSettings.school_id == current_user.school_id)
    school_result = await db.execute(school_stmt)
    settings = school_result.scalar_one_or_none()
    
    return EmergencyEvacuation(
        visitors_inside=[VisitorResponse(**visitor.dict()) for visitor in visitors_inside],
        total_visitors=len(visitors_inside),
        evacuation_time=datetime.now(),
        security_contact="+1234567890",  # This should come from school settings
        emergency_contact="911"
    )


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

async def send_visitor_notifications(visitor_id: int, db: AsyncSession):
    """Send notifications for visitor approval."""
    # This would integrate with the existing notification system
    pass


async def send_check_in_notifications(visitor_id: int, db: AsyncSession):
    """Send notifications for visitor check-in."""
    # This would integrate with the existing notification system
    pass

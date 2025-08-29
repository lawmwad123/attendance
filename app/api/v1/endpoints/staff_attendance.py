from fastapi import APIRouter, Depends, HTTPException, Query, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, extract, join
from sqlalchemy.orm import selectinload
from typing import List, Optional, Dict, Any
from datetime import date, datetime, timedelta, time
import json

from app.api.deps import get_db, require_teacher_or_admin, get_tenant_filter
from app.models.user import User, UserRole
from app.models.staff_attendance import (
    StaffAttendance, StaffAttendanceStatus, StaffAttendanceMethod,
    StaffLeave, LeaveType, LeaveStatus,
    StaffSchedule, StaffAttendanceSummary
)
from app.schemas.staff_attendance import (
    StaffAttendanceCreate, StaffAttendanceUpdate, StaffAttendanceResponse,
    StaffLeaveCreate, StaffLeaveUpdate, StaffLeaveResponse,
    StaffScheduleCreate, StaffScheduleUpdate, StaffScheduleResponse,
    StaffAttendanceSummaryResponse, StaffAttendanceDashboard,
    StaffClockInRequest, StaffClockOutRequest, StaffClockResponse,
    StaffAttendanceFilter, StaffLeaveFilter, StaffScheduleFilter,
    BulkStaffAttendanceCreate, BulkStaffScheduleCreate
)

router = APIRouter()


# Helper Functions
async def calculate_attendance_stats(db: AsyncSession, school_id: int, date_filter: Optional[date] = None) -> Dict[str, Any]:
    """Calculate attendance statistics for dashboard."""
    stmt = select(StaffAttendance).where(StaffAttendance.school_id == school_id)
    
    if date_filter:
        stmt = stmt.where(StaffAttendance.attendance_date == date_filter)
    
    result = await db.execute(stmt)
    records = result.scalars().all()
    
    total_records = len(records)
    present_count = sum(1 for r in records if r.status == StaffAttendanceStatus.PRESENT)
    absent_count = sum(1 for r in records if r.status == StaffAttendanceStatus.ABSENT)
    late_count = sum(1 for r in records if r.status == StaffAttendanceStatus.LATE)
    on_leave_count = sum(1 for r in records if r.status == StaffAttendanceStatus.ON_LEAVE)
    
    return {
        "total": total_records,
        "present": present_count,
        "absent": absent_count,
        "late": late_count,
        "on_leave": on_leave_count,
        "present_percentage": round((present_count / total_records * 100) if total_records > 0 else 0, 2)
    }


def calculate_late_minutes(expected_time: time, actual_time: datetime) -> int:
    """Calculate minutes late for check-in."""
    if not expected_time or not actual_time:
        return 0
    
    expected_datetime = datetime.combine(actual_time.date(), expected_time)
    if actual_time > expected_datetime:
        return int((actual_time - expected_datetime).total_seconds() / 60)
    return 0


def calculate_overtime_hours(expected_time: time, actual_time: datetime) -> int:
    """Calculate overtime hours for check-out."""
    if not expected_time or not actual_time:
        return 0
    
    expected_datetime = datetime.combine(actual_time.date(), expected_time)
    if actual_time > expected_datetime:
        return int((actual_time - expected_datetime).total_seconds() / 3600)
    return 0


# Staff Attendance Endpoints
@router.post("/", response_model=StaffAttendanceResponse)
async def create_staff_attendance(
    attendance: StaffAttendanceCreate,
    request: Request,
    current_user: User = Depends(require_teacher_or_admin),
    db: AsyncSession = Depends(get_db)
):
    """Create a new staff attendance record."""
    tenant_filter = get_tenant_filter(request)
    school_id = tenant_filter["school_id"]
    
    # Check if attendance already exists for this staff on this date
    stmt = select(StaffAttendance).where(
        and_(
            StaffAttendance.staff_id == attendance.staff_id,
            StaffAttendance.attendance_date == attendance.attendance_date,
            StaffAttendance.school_id == school_id
        )
    )
    result = await db.execute(stmt)
    existing_attendance = result.scalar_one_or_none()
    
    if existing_attendance:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Attendance record already exists for this staff on this date"
        )
    
    # Create attendance record
    db_attendance = StaffAttendance(
        **attendance.dict(),
        school_id=school_id,
        marked_by_user_id=current_user.id
    )
    
    # Calculate late minutes if check-in time is provided
    if db_attendance.actual_check_in and db_attendance.expected_check_in:
        db_attendance.minutes_late = calculate_late_minutes(
            db_attendance.expected_check_in, 
            db_attendance.actual_check_in
        )
    
    # Calculate overtime if check-out time is provided
    if db_attendance.actual_check_out and db_attendance.expected_check_out:
        db_attendance.overtime_hours = calculate_overtime_hours(
            db_attendance.expected_check_out,
            db_attendance.actual_check_out
        )
    
    db.add(db_attendance)
    await db.commit()
    await db.refresh(db_attendance)
    
    return db_attendance


@router.get("/", response_model=List[StaffAttendanceResponse])
async def get_staff_attendance(
    request: Request,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    staff_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    status_filter: Optional[StaffAttendanceStatus] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_teacher_or_admin)
):
    """Get staff attendance records with filtering."""
    tenant_filter = get_tenant_filter(request)
    school_id = tenant_filter["school_id"]
    
    stmt = select(StaffAttendance).options(selectinload(StaffAttendance.staff)).where(
        StaffAttendance.school_id == school_id
    )
    
    # Apply filters
    if staff_id:
        stmt = stmt.where(StaffAttendance.staff_id == staff_id)
    if start_date:
        stmt = stmt.where(StaffAttendance.attendance_date >= start_date)
    if end_date:
        stmt = stmt.where(StaffAttendance.attendance_date <= end_date)
    if status_filter:
        stmt = stmt.where(StaffAttendance.status == status_filter)
    
    stmt = stmt.offset(skip).limit(limit)
    
    result = await db.execute(stmt)
    attendance_records = result.scalars().all()
    
    # Convert to response format
    response = []
    for record in attendance_records:
        record_dict = record.__dict__.copy()
        if record.staff:
            record_dict["staff_name"] = f"{record.staff.first_name} {record.staff.last_name}"
            record_dict["staff_email"] = record.staff.email
            record_dict["staff_role"] = record.staff.role.value
        response.append(record_dict)
    
    return response


@router.get("/{attendance_id}", response_model=StaffAttendanceResponse)
async def get_staff_attendance_by_id(
    attendance_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_teacher_or_admin)
):
    """Get a specific staff attendance record."""
    tenant_filter = get_tenant_filter(request)
    school_id = tenant_filter["school_id"]
    
    stmt = select(StaffAttendance).options(selectinload(StaffAttendance.staff)).where(
        and_(
            StaffAttendance.id == attendance_id,
            StaffAttendance.school_id == school_id
        )
    )
    result = await db.execute(stmt)
    attendance = result.scalar_one_or_none()
    
    if not attendance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attendance record not found"
        )
    
    attendance_dict = attendance.__dict__.copy()
    if attendance.staff:
        attendance_dict["staff_name"] = f"{attendance.staff.first_name} {attendance.staff.last_name}"
        attendance_dict["staff_email"] = attendance.staff.email
        attendance_dict["staff_role"] = attendance.staff.role.value
    
    return attendance_dict


@router.put("/{attendance_id}", response_model=StaffAttendanceResponse)
async def update_staff_attendance(
    attendance_id: int,
    attendance_update: StaffAttendanceUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_teacher_or_admin)
):
    """Update a staff attendance record."""
    tenant_filter = get_tenant_filter(request)
    school_id = tenant_filter["school_id"]
    
    stmt = select(StaffAttendance).where(
        and_(
            StaffAttendance.id == attendance_id,
            StaffAttendance.school_id == school_id
        )
    )
    result = await db.execute(stmt)
    attendance = result.scalar_one_or_none()
    
    if not attendance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attendance record not found"
        )
    
    # Update fields
    update_data = attendance_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(attendance, field, value)
    
    # Recalculate late minutes and overtime if times are updated
    if attendance.actual_check_in and attendance.expected_check_in:
        attendance.minutes_late = calculate_late_minutes(
            attendance.expected_check_in, 
            attendance.actual_check_in
        )
    
    if attendance.actual_check_out and attendance.expected_check_out:
        attendance.overtime_hours = calculate_overtime_hours(
            attendance.expected_check_out,
            attendance.actual_check_out
        )
    
    await db.commit()
    await db.refresh(attendance)
    
    return attendance


@router.delete("/{attendance_id}")
async def delete_staff_attendance(
    attendance_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_teacher_or_admin)
):
    """Delete a staff attendance record."""
    tenant_filter = get_tenant_filter(request)
    school_id = tenant_filter["school_id"]
    
    stmt = select(StaffAttendance).where(
        and_(
            StaffAttendance.id == attendance_id,
            StaffAttendance.school_id == school_id
        )
    )
    result = await db.execute(stmt)
    attendance = result.scalar_one_or_none()
    
    if not attendance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attendance record not found"
        )
    
    await db.delete(attendance)
    await db.commit()
    
    return {"message": "Attendance record deleted successfully"}


# Clock In/Out Endpoints
@router.post("/clock-in", response_model=StaffClockResponse)
async def staff_clock_in(
    clock_in: StaffClockInRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_teacher_or_admin)
):
    """Staff clock-in functionality."""
    tenant_filter = get_tenant_filter(request)
    school_id = tenant_filter["school_id"]
    
    today = date.today()
    now = datetime.now()
    
    # Check if already clocked in today
    stmt = select(StaffAttendance).where(
        and_(
            StaffAttendance.staff_id == clock_in.staff_id,
            StaffAttendance.attendance_date == today,
            StaffAttendance.school_id == school_id
        )
    )
    result = await db.execute(stmt)
    existing_attendance = result.scalar_one_or_none()
    
    if existing_attendance and existing_attendance.actual_check_in:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already clocked in today"
        )
    
    # Get staff schedule for today
    day_of_week = today.weekday()
    schedule_stmt = select(StaffSchedule).where(
        and_(
            StaffSchedule.staff_id == clock_in.staff_id,
            StaffSchedule.day_of_week == day_of_week,
            StaffSchedule.school_id == school_id
        )
    )
    schedule_result = await db.execute(schedule_stmt)
    schedule = schedule_result.scalar_one_or_none()
    
    expected_check_in = schedule.start_time if schedule else None
    
    # Create or update attendance record
    if existing_attendance:
        existing_attendance.actual_check_in = now
        existing_attendance.method = clock_in.method
        existing_attendance.device_id = clock_in.device_id
        existing_attendance.location = clock_in.location
        existing_attendance.notes = clock_in.notes
        attendance_record = existing_attendance
    else:
        attendance_record = StaffAttendance(
            staff_id=clock_in.staff_id,
            attendance_date=today,
            actual_check_in=now,
            expected_check_in=expected_check_in,
            method=clock_in.method,
            device_id=clock_in.device_id,
            location=clock_in.location,
            notes=clock_in.notes,
            school_id=school_id,
            marked_by_user_id=current_user.id
        )
        db.add(attendance_record)
    
    # Calculate late minutes
    minutes_late = 0
    if expected_check_in:
        minutes_late = calculate_late_minutes(expected_check_in, now)
        if minutes_late > 0:
            attendance_record.status = StaffAttendanceStatus.LATE
        else:
            attendance_record.status = StaffAttendanceStatus.PRESENT
    
    attendance_record.minutes_late = minutes_late
    
    await db.commit()
    await db.refresh(attendance_record)
    
    return StaffClockResponse(
        success=True,
        message="Successfully clocked in",
        attendance_id=attendance_record.id,
        check_in_time=attendance_record.actual_check_in,
        minutes_late=minutes_late
    )


@router.post("/clock-out", response_model=StaffClockResponse)
async def staff_clock_out(
    clock_out: StaffClockOutRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_teacher_or_admin)
):
    """Staff clock-out functionality."""
    tenant_filter = get_tenant_filter(request)
    school_id = tenant_filter["school_id"]
    
    today = date.today()
    now = datetime.now()
    
    # Find today's attendance record
    stmt = select(StaffAttendance).where(
        and_(
            StaffAttendance.staff_id == clock_out.staff_id,
            StaffAttendance.attendance_date == today,
            StaffAttendance.school_id == school_id
        )
    )
    result = await db.execute(stmt)
    attendance = result.scalar_one_or_none()
    
    if not attendance:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No clock-in record found for today"
        )
    
    if attendance.actual_check_out:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already clocked out today"
        )
    
    # Get staff schedule for today
    day_of_week = today.weekday()
    schedule_stmt = select(StaffSchedule).where(
        and_(
            StaffSchedule.staff_id == clock_out.staff_id,
            StaffSchedule.day_of_week == day_of_week,
            StaffSchedule.school_id == school_id
        )
    )
    schedule_result = await db.execute(schedule_stmt)
    schedule = schedule_result.scalar_one_or_none()
    
    expected_check_out = schedule.end_time if schedule else None
    
    # Update attendance record
    attendance.actual_check_out = now
    attendance.expected_check_out = expected_check_out
    attendance.method = clock_out.method
    attendance.device_id = clock_out.device_id
    attendance.location = clock_out.location
    attendance.notes = clock_out.notes
    
    # Calculate overtime
    overtime_hours = 0
    if expected_check_out:
        overtime_hours = calculate_overtime_hours(expected_check_out, now)
    
    attendance.overtime_hours = overtime_hours
    
    await db.commit()
    await db.refresh(attendance)
    
    return StaffClockResponse(
        success=True,
        message="Successfully clocked out",
        attendance_id=attendance.id,
        check_out_time=attendance.actual_check_out,
        overtime_hours=overtime_hours
    )


# Staff Leave Endpoints
@router.post("/leave", response_model=StaffLeaveResponse)
async def create_staff_leave(
    leave: StaffLeaveCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_teacher_or_admin)
):
    """Create a staff leave request."""
    tenant_filter = get_tenant_filter(request)
    school_id = tenant_filter["school_id"]
    
    # Calculate total days
    total_days = (leave.end_date - leave.start_date).days + 1
    
    # Check for overlapping leave requests
    stmt = select(StaffLeave).where(
        and_(
            StaffLeave.staff_id == current_user.id,
            StaffLeave.status.in_([LeaveStatus.PENDING, LeaveStatus.APPROVED]),
            or_(
                and_(StaffLeave.start_date <= leave.end_date, StaffLeave.end_date >= leave.start_date)
            )
        )
    )
    result = await db.execute(stmt)
    overlapping_leave = result.scalar_one_or_none()
    
    if overlapping_leave:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Leave request overlaps with existing approved or pending leave"
        )
    
    db_leave = StaffLeave(
        **leave.dict(),
        staff_id=current_user.id,
        total_days=total_days,
        school_id=school_id
    )
    
    db.add(db_leave)
    await db.commit()
    await db.refresh(db_leave)
    
    return db_leave


@router.get("/leave", response_model=List[StaffLeaveResponse])
async def get_staff_leave(
    request: Request,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    staff_id: Optional[int] = None,
    status_filter: Optional[LeaveStatus] = None,
    leave_type: Optional[LeaveType] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_teacher_or_admin)
):
    """Get staff leave requests."""
    tenant_filter = get_tenant_filter(request)
    school_id = tenant_filter["school_id"]
    
    stmt = select(StaffLeave).options(selectinload(StaffLeave.staff)).where(
        StaffLeave.school_id == school_id
    )
    
    # Filter by staff_id (only admins can see all, others see only their own)
    if current_user.role == UserRole.ADMIN and staff_id:
        stmt = stmt.where(StaffLeave.staff_id == staff_id)
    elif current_user.role != UserRole.ADMIN:
        stmt = stmt.where(StaffLeave.staff_id == current_user.id)
    
    if status_filter:
        stmt = stmt.where(StaffLeave.status == status_filter)
    if leave_type:
        stmt = stmt.where(StaffLeave.leave_type == leave_type)
    
    stmt = stmt.offset(skip).limit(limit)
    
    result = await db.execute(stmt)
    leave_records = result.scalars().all()
    
    # Convert to response format
    response = []
    for record in leave_records:
        record_dict = record.__dict__.copy()
        if record.staff:
            record_dict["staff_name"] = f"{record.staff.first_name} {record.staff.last_name}"
            record_dict["staff_email"] = record.staff.email
        response.append(record_dict)
    
    return response


@router.put("/leave/{leave_id}/approve", response_model=StaffLeaveResponse)
async def approve_staff_leave(
    leave_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_teacher_or_admin)
):
    """Approve a staff leave request."""
    tenant_filter = get_tenant_filter(request)
    school_id = tenant_filter["school_id"]
    
    stmt = select(StaffLeave).where(
        and_(
            StaffLeave.id == leave_id,
            StaffLeave.school_id == school_id
        )
    )
    result = await db.execute(stmt)
    leave = result.scalar_one_or_none()
    
    if not leave:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Leave request not found"
        )
    
    if leave.status != LeaveStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Leave request is not pending"
        )
    
    leave.status = LeaveStatus.APPROVED
    leave.approved_by_user_id = current_user.id
    leave.approved_at = datetime.now()
    
    await db.commit()
    await db.refresh(leave)
    
    return leave


@router.put("/leave/{leave_id}/reject", response_model=StaffLeaveResponse)
async def reject_staff_leave(
    leave_id: int,
    rejection_reason: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_teacher_or_admin)
):
    """Reject a staff leave request."""
    tenant_filter = get_tenant_filter(request)
    school_id = tenant_filter["school_id"]
    
    stmt = select(StaffLeave).where(
        and_(
            StaffLeave.id == leave_id,
            StaffLeave.school_id == school_id
        )
    )
    result = await db.execute(stmt)
    leave = result.scalar_one_or_none()
    
    if not leave:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Leave request not found"
        )
    
    if leave.status != LeaveStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Leave request is not pending"
        )
    
    leave.status = LeaveStatus.REJECTED
    leave.rejection_reason = rejection_reason
    leave.approved_by_user_id = current_user.id
    leave.approved_at = datetime.now()
    
    await db.commit()
    await db.refresh(leave)
    
    return leave


# Staff Schedule Endpoints
@router.post("/schedule", response_model=StaffScheduleResponse)
async def create_staff_schedule(
    schedule: StaffScheduleCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_teacher_or_admin)
):
    """Create a staff work schedule."""
    tenant_filter = get_tenant_filter(request)
    school_id = tenant_filter["school_id"]
    
    # Check if schedule already exists for this staff and day
    stmt = select(StaffSchedule).where(
        and_(
            StaffSchedule.staff_id == schedule.staff_id,
            StaffSchedule.day_of_week == schedule.day_of_week,
            StaffSchedule.school_id == school_id
        )
    )
    result = await db.execute(stmt)
    existing_schedule = result.scalar_one_or_none()
    
    if existing_schedule:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Schedule already exists for this staff on this day"
        )
    
    db_schedule = StaffSchedule(
        **schedule.dict(),
        school_id=school_id
    )
    
    db.add(db_schedule)
    await db.commit()
    await db.refresh(db_schedule)
    
    return db_schedule


@router.get("/schedule", response_model=List[StaffScheduleResponse])
async def get_staff_schedule(
    request: Request,
    staff_id: Optional[int] = None,
    day_of_week: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_teacher_or_admin)
):
    """Get staff work schedules."""
    tenant_filter = get_tenant_filter(request)
    school_id = tenant_filter["school_id"]
    
    stmt = select(StaffSchedule).options(selectinload(StaffSchedule.staff)).where(
        StaffSchedule.school_id == school_id
    )
    
    if staff_id:
        stmt = stmt.where(StaffSchedule.staff_id == staff_id)
    if day_of_week is not None:
        stmt = stmt.where(StaffSchedule.day_of_week == day_of_week)
    
    stmt = stmt.all()
    
    # Convert to response format
    response = []
    for schedule in stmt:
        schedule_dict = schedule.__dict__.copy()
        if schedule.staff:
            schedule_dict["staff_name"] = f"{schedule.staff.first_name} {schedule.staff.last_name}"
            schedule_dict["staff_email"] = schedule.staff.email
        response.append(schedule_dict)
    
    return response


# Dashboard Endpoints
@router.get("/dashboard/overview", response_model=StaffAttendanceDashboard)
async def get_staff_attendance_dashboard(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_teacher_or_admin)
):
    """Get staff attendance dashboard overview."""
    tenant_filter = get_tenant_filter(request)
    school_id = tenant_filter["school_id"]
    today = date.today()
    
    # Get today's attendance
    today_stmt = select(StaffAttendance).options(selectinload(StaffAttendance.staff)).where(
        and_(
            StaffAttendance.attendance_date == today,
            StaffAttendance.school_id == school_id
        )
    )
    today_result = await db.execute(today_stmt)
    today_attendance = today_result.scalars().all()
    
    # Get pending leave requests
    pending_stmt = select(StaffLeave).options(selectinload(StaffLeave.staff)).where(
        and_(
            StaffLeave.status == LeaveStatus.PENDING,
            StaffLeave.school_id == school_id
        )
    ).limit(10)
    pending_result = await db.execute(pending_stmt)
    pending_leaves = pending_result.scalars().all()
    
    # Get recent attendance (last 7 days)
    week_ago = today - timedelta(days=7)
    recent_stmt = select(StaffAttendance).options(selectinload(StaffAttendance.staff)).where(
        and_(
            StaffAttendance.attendance_date >= week_ago,
            StaffAttendance.school_id == school_id
        )
    ).order_by(StaffAttendance.attendance_date.desc()).limit(20)
    recent_result = await db.execute(recent_stmt)
    recent_attendance = recent_result.scalars().all()
    
    # Calculate statistics
    attendance_stats = await calculate_attendance_stats(db, school_id, today)
    
    # Convert to response format
    today_attendance_with_info = []
    for record in today_attendance:
        record_dict = record.__dict__.copy()
        if record.staff:
            record_dict["staff_name"] = f"{record.staff.first_name} {record.staff.last_name}"
            record_dict["staff_email"] = record.staff.email
            record_dict["staff_role"] = record.staff.role.value
        today_attendance_with_info.append(record_dict)
    
    pending_leaves_with_info = []
    for record in pending_leaves:
        record_dict = record.__dict__.copy()
        if record.staff:
            record_dict["staff_name"] = f"{record.staff.first_name} {record.staff.last_name}"
            record_dict["staff_email"] = record.staff.email
        pending_leaves_with_info.append(record_dict)
    
    recent_attendance_with_info = []
    for record in recent_attendance:
        record_dict = record.__dict__.copy()
        if record.staff:
            record_dict["staff_name"] = f"{record.staff.first_name} {record.staff.last_name}"
            record_dict["staff_email"] = record.staff.email
            record_dict["staff_role"] = record.staff.role.value
        recent_attendance_with_info.append(record_dict)
    
    return StaffAttendanceDashboard(
        today_attendance=today_attendance_with_info,
        pending_leaves=pending_leaves_with_info,
        recent_attendance=recent_attendance_with_info,
        attendance_stats=attendance_stats
    )


# Bulk Operations
@router.post("/bulk", response_model=List[StaffAttendanceResponse])
async def create_bulk_staff_attendance(
    bulk_data: BulkStaffAttendanceCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_teacher_or_admin)
):
    """Create multiple staff attendance records."""
    tenant_filter = get_tenant_filter(request)
    school_id = tenant_filter["school_id"]
    
    created_records = []
    
    for attendance_data in bulk_data.attendance_records:
        # Check if attendance already exists
        stmt = select(StaffAttendance).where(
            and_(
                StaffAttendance.staff_id == attendance_data.staff_id,
                StaffAttendance.attendance_date == attendance_data.attendance_date,
                StaffAttendance.school_id == school_id
            )
        )
        result = await db.execute(stmt)
        existing = result.scalar_one_or_none()
        
        if existing:
            continue  # Skip if already exists
        
        # Create attendance record
        db_attendance = StaffAttendance(
            **attendance_data.dict(),
            school_id=school_id,
            marked_by_user_id=current_user.id
        )
        
        # Calculate late minutes and overtime
        if db_attendance.actual_check_in and db_attendance.expected_check_in:
            db_attendance.minutes_late = calculate_late_minutes(
                db_attendance.expected_check_in, 
                db_attendance.actual_check_in
            )
        
        if db_attendance.actual_check_out and db_attendance.expected_check_out:
            db_attendance.overtime_hours = calculate_overtime_hours(
                db_attendance.expected_check_out,
                db_attendance.actual_check_out
            )
        
        db.add(db_attendance)
        created_records.append(db_attendance)
    
    await db.commit()
    
    # Refresh all created records
    for record in created_records:
        await db.refresh(record)
    
    return created_records

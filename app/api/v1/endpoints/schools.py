from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import List

from app.api.deps import get_db, require_admin, get_current_school_dep
from app.core.security import get_password_hash
from app.models.school import School
from app.models.user import User, UserRole, UserStatus
from app.models.student import Student, StudentStatus
from app.models.attendance import Attendance, AttendanceStatus
from app.models.gate_pass import GatePass, GatePassStatus
from app.schemas.school import SchoolCreate, SchoolUpdate, School as SchoolResponse, SchoolStats
from app.schemas.user import UserCreate
from datetime import date

router = APIRouter()


@router.post("/", response_model=SchoolResponse, status_code=status.HTTP_201_CREATED)
async def create_school(
    school_data: SchoolCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new school (tenant).
    This endpoint is typically used during the signup process.
    """
    # Check if slug already exists
    stmt = select(School).where(School.slug == school_data.slug.lower())
    result = await db.execute(stmt)
    existing_school = result.scalar_one_or_none()
    
    if existing_school:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="School with this slug already exists"
        )
    
    # Check if admin email already exists
    stmt = select(User).where(User.email == school_data.admin_email.lower())
    result = await db.execute(stmt)
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    try:
        # Create school
        school = School(
            name=school_data.name,
            slug=school_data.slug.lower(),
            address=school_data.address,
            phone=school_data.phone,
            email=school_data.email,
            website=school_data.website,
            principal_name=school_data.principal_name,
            timezone=school_data.timezone,
            school_start_time=school_data.school_start_time,
            school_end_time=school_data.school_end_time
        )
        
        db.add(school)
        await db.flush()  # Get the school ID
        
        # Create admin user
        admin_user = User(
            email=school_data.admin_email.lower(),
            first_name=school_data.admin_first_name,
            last_name=school_data.admin_last_name,
            phone=school_data.admin_phone,
            hashed_password=get_password_hash(school_data.admin_password),
            role=UserRole.ADMIN,
            status=UserStatus.ACTIVE,
            is_active=True,
            is_verified=True,
            school_id=school.id
        )
        
        db.add(admin_user)
        await db.commit()
        await db.refresh(school)
        
        return school
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create school"
        )


@router.get("/current", response_model=SchoolResponse)
async def get_current_school(
    school: School = Depends(get_current_school_dep)
):
    """
    Get current school information based on tenant context.
    """
    return school


@router.put("/current", response_model=SchoolResponse)
async def update_current_school(
    school_update: SchoolUpdate,
    school: School = Depends(get_current_school_dep),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Update current school information.
    Only accessible by school admins.
    """
    # Update school fields
    update_data = school_update.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        if hasattr(school, field):
            setattr(school, field, value)
    
    try:
        await db.commit()
        await db.refresh(school)
        return school
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update school"
        )


@router.get("/stats", response_model=SchoolStats)
async def get_school_stats(
    school: School = Depends(get_current_school_dep),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Get school statistics.
    Only accessible by school admins.
    """
    school_id = school.id
    today = date.today()
    
    # Get total counts
    total_students_stmt = select(func.count(Student.id)).where(
        and_(Student.school_id == school_id, Student.is_active == True)
    )
    total_students_result = await db.execute(total_students_stmt)
    total_students = total_students_result.scalar() or 0
    
    active_students_stmt = select(func.count(Student.id)).where(
        and_(
            Student.school_id == school_id, 
            Student.is_active == True,
            Student.status == StudentStatus.ACTIVE
        )
    )
    active_students_result = await db.execute(active_students_stmt)
    active_students = active_students_result.scalar() or 0
    
    total_staff_stmt = select(func.count(User.id)).where(
        and_(User.school_id == school_id, User.is_active == True)
    )
    total_staff_result = await db.execute(total_staff_stmt)
    total_staff = total_staff_result.scalar() or 0
    
    total_teachers_stmt = select(func.count(User.id)).where(
        and_(
            User.school_id == school_id, 
            User.is_active == True,
            User.role == UserRole.TEACHER
        )
    )
    total_teachers_result = await db.execute(total_teachers_stmt)
    total_teachers = total_teachers_result.scalar() or 0
    
    # Today's attendance
    present_today_stmt = select(func.count(Attendance.id)).where(
        and_(
            Attendance.school_id == school_id,
            Attendance.attendance_date == today,
            Attendance.status == AttendanceStatus.PRESENT
        )
    )
    present_today_result = await db.execute(present_today_stmt)
    present_today = present_today_result.scalar() or 0
    
    absent_today_stmt = select(func.count(Attendance.id)).where(
        and_(
            Attendance.school_id == school_id,
            Attendance.attendance_date == today,
            Attendance.status == AttendanceStatus.ABSENT
        )
    )
    absent_today_result = await db.execute(absent_today_stmt)
    absent_today = absent_today_result.scalar() or 0
    
    # Pending gate passes
    pending_gate_passes_stmt = select(func.count(GatePass.id)).where(
        and_(
            GatePass.school_id == school_id,
            GatePass.status == GatePassStatus.PENDING
        )
    )
    pending_gate_passes_result = await db.execute(pending_gate_passes_stmt)
    pending_gate_passes = pending_gate_passes_result.scalar() or 0
    
    return SchoolStats(
        total_students=total_students,
        total_teachers=total_teachers,
        total_staff=total_staff,
        active_students=active_students,
        present_today=present_today,
        absent_today=absent_today,
        pending_gate_passes=pending_gate_passes
    )


@router.get("/validate-slug/{slug}")
async def validate_school_slug(
    slug: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Check if a school slug is available.
    Public endpoint for registration process.
    """
    import re
    
    # Validate slug format
    if not re.match(r'^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$', slug.lower()):
        return {
            "available": False,
            "message": "Slug must contain only lowercase letters, numbers, and hyphens"
        }
    
    if len(slug) < 2 or len(slug) > 50:
        return {
            "available": False,
            "message": "Slug must be between 2 and 50 characters"
        }
    
    # Check if slug exists
    stmt = select(School).where(School.slug == slug.lower())
    result = await db.execute(stmt)
    existing_school = result.scalar_one_or_none()
    
    if existing_school:
        return {
            "available": False,
            "message": "This slug is already taken"
        }
    
    return {
        "available": True,
        "message": "Slug is available"
    } 
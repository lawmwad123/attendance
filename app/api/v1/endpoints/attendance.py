from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, distinct
from typing import List, Optional
from datetime import datetime, date

from app.api.deps import get_db, require_teacher_or_admin, get_tenant_filter
from app.models.user import User
from app.models.student import Student
from app.models.attendance import Attendance, AttendanceStatus, AttendanceMethod
from app.schemas.attendance import (
    AttendanceCreate,
    AttendanceUpdate, 
    Attendance as AttendanceResponse,
    AttendanceStats,
    ClassAttendance,
    BulkAttendanceCreate
)

router = APIRouter()


@router.get("/", response_model=List[AttendanceResponse])
async def get_attendance(
    request: Request,
    date: Optional[str] = Query(None),
    student_id: Optional[int] = Query(None),
    class_name: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(require_teacher_or_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Get attendance records with filtering.
    """
    tenant_filter = get_tenant_filter(request)
    school_id = tenant_filter["school_id"]
    
    # Build query with student join
    stmt = select(Attendance, Student).join(Student).where(Student.school_id == school_id)
    
    # Apply filters
    if date:
        attendance_date = datetime.strptime(date, "%Y-%m-%d").date()
        stmt = stmt.where(Attendance.attendance_date == attendance_date)
    
    if student_id:
        stmt = stmt.where(Attendance.student_id == student_id)
    
    if class_name:
        stmt = stmt.where(Student.grade_level.ilike(f"%{class_name}%"))
    
    # Apply pagination and ordering
    stmt = stmt.offset(skip).limit(limit).order_by(
        Attendance.attendance_date.desc(),
        Student.first_name,
        Student.last_name
    )
    
    result = await db.execute(stmt)
    attendance_records = result.all()
    
    # Convert to response format
    response = []
    for attendance, student in attendance_records:
        response.append(AttendanceResponse(
            id=attendance.id,
            student_id=attendance.student_id,
            student={
                "id": student.id,
                "student_id": student.student_id,
                "first_name": student.first_name,
                "last_name": student.last_name,
                "full_name": student.full_name,
                "class_name": student.grade_level,
                "section": student.section,
                "status": student.status.value
            },
            date=attendance.attendance_date.isoformat(),
            status=attendance.status.value,
            check_in_time=attendance.check_in_time.strftime("%H:%M:%S") if attendance.check_in_time else None,
            check_out_time=attendance.check_out_time.strftime("%H:%M:%S") if attendance.check_out_time else None,
            notes=attendance.notes,
            marked_by=attendance.marked_by.full_name if attendance.marked_by else "System",
            created_at=attendance.created_at.isoformat()
        ))
    
    return response


@router.post("/", response_model=AttendanceResponse, status_code=status.HTTP_201_CREATED)
async def mark_attendance(
    attendance_data: AttendanceCreate,
    request: Request,
    current_user: User = Depends(require_teacher_or_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Mark attendance for a student.
    """
    tenant_filter = get_tenant_filter(request)
    school_id = tenant_filter["school_id"]
    
    # Verify student exists and belongs to school
    stmt = select(Student).where(
        and_(
            Student.id == attendance_data.student_id,
            Student.school_id == school_id
        )
    )
    result = await db.execute(stmt)
    student = result.scalar_one_or_none()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    attendance_date = datetime.strptime(attendance_data.date, "%Y-%m-%d").date()
    
    # Check if attendance already exists for this date
    stmt = select(Attendance).where(
        and_(
            Attendance.student_id == attendance_data.student_id,
            Attendance.attendance_date == attendance_date
        )
    )
    result = await db.execute(stmt)
    existing_attendance = result.scalar_one_or_none()
    
    try:
        if existing_attendance:
            # Update existing attendance
            existing_attendance.status = AttendanceStatus(attendance_data.status)
            existing_attendance.notes = attendance_data.notes
            existing_attendance.marked_by_user_id = current_user.id
            
            if attendance_data.status == "present":
                existing_attendance.check_in_time = datetime.now()
            
            await db.commit()
            await db.refresh(existing_attendance)
            attendance = existing_attendance
        else:
            # Create new attendance record
            attendance = Attendance(
                student_id=attendance_data.student_id,
                attendance_date=attendance_date,
                status=AttendanceStatus(attendance_data.status),
                method=AttendanceMethod.MANUAL,
                notes=attendance_data.notes,
                marked_by_user_id=current_user.id,
                check_in_time=datetime.now() if attendance_data.status == "present" else None
            )
            
            db.add(attendance)
            await db.commit()
            await db.refresh(attendance)
        
        return AttendanceResponse(
            id=attendance.id,
            student_id=attendance.student_id,
            student={
                "id": student.id,
                "student_id": student.student_id,
                "first_name": student.first_name,
                "last_name": student.last_name,
                "full_name": student.full_name,
                "class_name": student.grade_level,
                "section": student.section,
                "status": student.status.value
            },
            date=attendance.attendance_date.isoformat(),
            status=attendance.status.value,
            check_in_time=attendance.check_in_time.strftime("%H:%M:%S") if attendance.check_in_time else None,
            check_out_time=attendance.check_out_time.strftime("%H:%M:%S") if attendance.check_out_time else None,
            notes=attendance.notes,
            marked_by=current_user.full_name,
            created_at=attendance.created_at.isoformat()
        )
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to mark attendance"
        )


@router.post("/bulk", status_code=status.HTTP_201_CREATED)
async def bulk_mark_attendance(
    bulk_data: BulkAttendanceCreate,
    request: Request,
    current_user: User = Depends(require_teacher_or_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Mark attendance for multiple students.
    """
    tenant_filter = get_tenant_filter(request)
    school_id = tenant_filter["school_id"]
    
    try:
        for record in bulk_data.records:
            # Verify student exists
            stmt = select(Student).where(
                and_(
                    Student.id == record.student_id,
                    Student.school_id == school_id
                )
            )
            result = await db.execute(stmt)
            student = result.scalar_one_or_none()
            
            if not student:
                continue  # Skip invalid students
            
            attendance_date = datetime.strptime(record.date, "%Y-%m-%d").date()
            
            # Check if attendance already exists
            stmt = select(Attendance).where(
                and_(
                    Attendance.student_id == record.student_id,
                    Attendance.attendance_date == attendance_date
                )
            )
            result = await db.execute(stmt)
            existing_attendance = result.scalar_one_or_none()
            
            if existing_attendance:
                # Update existing
                existing_attendance.status = AttendanceStatus(record.status)
                existing_attendance.notes = record.notes
                existing_attendance.marked_by_user_id = current_user.id
                
                if record.status == "present":
                    existing_attendance.check_in_time = datetime.now()
            else:
                # Create new
                attendance = Attendance(
                    student_id=record.student_id,
                    attendance_date=attendance_date,
                    status=AttendanceStatus(record.status),
                    method=AttendanceMethod.MANUAL,
                    notes=record.notes,
                    marked_by_user_id=current_user.id,
                    check_in_time=datetime.now() if record.status == "present" else None
                )
                db.add(attendance)
        
        await db.commit()
        return {"message": "Bulk attendance marked successfully"}
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to mark bulk attendance"
        )


@router.get("/stats", response_model=AttendanceStats)
async def get_attendance_stats(
    request: Request,
    date: Optional[str] = Query(None),
    current_user: User = Depends(require_teacher_or_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Get attendance statistics for a specific date.
    """
    tenant_filter = get_tenant_filter(request)
    school_id = tenant_filter["school_id"]
    
    if date:
        attendance_date = datetime.strptime(date, "%Y-%m-%d").date()
    else:
        attendance_date = datetime.now().date()
    
    # Get total students
    stmt = select(func.count(Student.id)).where(
        and_(
            Student.school_id == school_id,
            Student.is_active == True
        )
    )
    result = await db.execute(stmt)
    total_students = result.scalar() or 0
    
    # Get attendance counts by status
    stmt = select(
        Attendance.status,
        func.count(Attendance.id)
    ).join(Student).where(
        and_(
            Student.school_id == school_id,
            Attendance.attendance_date == attendance_date
        )
    ).group_by(Attendance.status)
    
    result = await db.execute(stmt)
    status_counts = dict(result.all())
    
    present = status_counts.get(AttendanceStatus.PRESENT, 0)
    absent = status_counts.get(AttendanceStatus.ABSENT, 0)
    late = status_counts.get(AttendanceStatus.LATE, 0)
    excused = status_counts.get(AttendanceStatus.EXCUSED, 0)
    
    # Calculate attendance rate
    total_marked = present + absent + late + excused
    if total_students > 0:
        attendance_rate = round((present + late) / total_students * 100, 2)
    else:
        attendance_rate = 0
    
    return AttendanceStats(
        total_students=total_students,
        present=present,
        absent=absent,
        late=late,
        excused=excused,
        attendance_rate=attendance_rate
    )


@router.get("/by-class", response_model=List[ClassAttendance])
async def get_class_attendance(
    request: Request,
    date: Optional[str] = Query(None),
    current_user: User = Depends(require_teacher_or_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Get class-wise attendance statistics.
    """
    tenant_filter = get_tenant_filter(request)
    school_id = tenant_filter["school_id"]
    
    if date:
        attendance_date = datetime.strptime(date, "%Y-%m-%d").date()
    else:
        attendance_date = datetime.now().date()
    
    # Get class-wise student counts
    stmt = select(
        Student.grade_level,
        Student.section,
        func.count(Student.id).label("total_students")
    ).where(
        and_(
            Student.school_id == school_id,
            Student.is_active == True
        )
    ).group_by(Student.grade_level, Student.section)
    
    result = await db.execute(stmt)
    class_counts = result.all()
    
    response = []
    for grade_level, section, total_students in class_counts:
        # Get attendance counts for this class
        stmt = select(
            func.count(Attendance.id).label("present_count")
        ).join(Student).where(
            and_(
                Student.school_id == school_id,
                Student.grade_level == grade_level,
                Student.section == section,
                Attendance.attendance_date == attendance_date,
                Attendance.status.in_([AttendanceStatus.PRESENT, AttendanceStatus.LATE])
            )
        )
        
        result = await db.execute(stmt)
        present = result.scalar() or 0
        
        absent = total_students - present
        attendance_rate = round((present / total_students * 100) if total_students > 0 else 0, 2)
        
        response.append(ClassAttendance(
            class_name=grade_level or "Unassigned",
            section=section or "A",
            total_students=total_students,
            present=present,
            absent=absent,
            attendance_rate=attendance_rate
        ))
    
    return response


@router.get("/student/{student_id}", response_model=List[AttendanceResponse])
async def get_student_attendance_history(
    student_id: int,
    request: Request,
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: User = Depends(require_teacher_or_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Get attendance history for a specific student.
    """
    tenant_filter = get_tenant_filter(request)
    school_id = tenant_filter["school_id"]
    
    # Verify student exists and belongs to school
    stmt = select(Student).where(
        and_(
            Student.id == student_id,
            Student.school_id == school_id
        )
    )
    result = await db.execute(stmt)
    student = result.scalar_one_or_none()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    # Build attendance query
    stmt = select(Attendance).where(Attendance.student_id == student_id)
    
    if start_date:
        start_dt = datetime.strptime(start_date, "%Y-%m-%d").date()
        stmt = stmt.where(Attendance.attendance_date >= start_dt)
    
    if end_date:
        end_dt = datetime.strptime(end_date, "%Y-%m-%d").date()
        stmt = stmt.where(Attendance.attendance_date <= end_dt)
    
    stmt = stmt.order_by(Attendance.attendance_date.desc())
    
    result = await db.execute(stmt)
    attendance_records = result.scalars().all()
    
    # Convert to response format
    response = []
    for attendance in attendance_records:
        response.append(AttendanceResponse(
            id=attendance.id,
            student_id=attendance.student_id,
            student={
                "id": student.id,
                "student_id": student.student_id,
                "first_name": student.first_name,
                "last_name": student.last_name,
                "full_name": student.full_name,
                "class_name": student.grade_level,
                "section": student.section,
                "status": student.status.value
            },
            date=attendance.attendance_date.isoformat(),
            status=attendance.status.value,
            check_in_time=attendance.check_in_time.strftime("%H:%M:%S") if attendance.check_in_time else None,
            check_out_time=attendance.check_out_time.strftime("%H:%M:%S") if attendance.check_out_time else None,
            notes=attendance.notes,
            marked_by=attendance.marked_by.full_name if attendance.marked_by else "System",
            created_at=attendance.created_at.isoformat()
        ))
    
    return response 
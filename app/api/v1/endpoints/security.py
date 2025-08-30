from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from datetime import datetime, timedelta

from app.api.deps import get_db, require_security_with_gate_pass_settings
from app.models.user import User, UserRole
from app.models.student import Student
from app.models.attendance import Attendance, AttendanceStatus
from app.models.visitor import Visitor, VisitorStatus
from app.models.staff_attendance import StaffAttendance, StaffAttendanceStatus
from app.schemas.security import (
    SecurityDashboardResponse,
    PersonSearchResponse,
    AttendanceMarkRequest,
    VisitorRegistrationRequest,
    VisitorCheckOutRequest,
    RecentActivityResponse
)

router = APIRouter()

@router.get("/dashboard", response_model=SecurityDashboardResponse)
async def get_security_dashboard(
    current_user: User = Depends(require_security_with_gate_pass_settings()),
    db: AsyncSession = Depends(get_db)
):
    """Get security dashboard data."""
    
    try:
        # Get current date
        today = datetime.now().date()
        
        # Count students present today
        students_present_stmt = select(func.count(Student.id)).where(
            and_(
                Student.school_id == current_user.school_id,
                Student.is_active == True
            )
        )
        students_present_result = await db.execute(students_present_stmt)
        students_present = students_present_result.scalar() or 0
        
        # Count staff present today
        staff_present_stmt = select(func.count(User.id)).where(
            and_(
                User.school_id == current_user.school_id,
                User.role.in_([UserRole.ADMIN, UserRole.TEACHER, UserRole.SECURITY]),
                User.is_active == True
            )
        )
        staff_present_result = await db.execute(staff_present_stmt)
        staff_present = staff_present_result.scalar() or 0
        
        # Count visitors today
        visitors_today_stmt = select(func.count(Visitor.id)).where(
            and_(
                Visitor.school_id == current_user.school_id,
                func.date(Visitor.actual_entry_time) == today
            )
        )
        visitors_today_result = await db.execute(visitors_today_stmt)
        visitors_today = visitors_today_result.scalar() or 0
        
        # Get recent student check-ins (last 10)
        recent_student_checkins_stmt = select(Attendance).where(
            and_(
                Attendance.school_id == current_user.school_id,
                func.date(Attendance.marked_at) == today
            )
        ).order_by(Attendance.marked_at.desc()).limit(5)
        
        recent_student_checkins_result = await db.execute(recent_student_checkins_stmt)
        recent_student_checkins = recent_student_checkins_result.scalars().all()
        
        # Get recent staff check-ins (last 10)
        recent_staff_checkins_stmt = select(StaffAttendance).where(
            and_(
                StaffAttendance.school_id == current_user.school_id,
                func.date(StaffAttendance.marked_at) == today
            )
        ).order_by(StaffAttendance.marked_at.desc()).limit(5)
        
        recent_staff_checkins_result = await db.execute(recent_staff_checkins_stmt)
        recent_staff_checkins = recent_staff_checkins_result.scalars().all()
        
        # Format recent check-ins
        formatted_checkins = []
        
        # Format student check-ins
        for checkin in recent_student_checkins:
            student_stmt = select(Student).where(Student.id == checkin.student_id)
            student_result = await db.execute(student_stmt)
            student = student_result.scalar_one_or_none()
            if student:
                formatted_checkins.append({
                    "person_name": f"{student.first_name} {student.last_name}",
                    "type": checkin.status,
                    "time": checkin.marked_at.strftime("%H:%M"),
                    "method": checkin.method
                })
        
        # Format staff check-ins
        for checkin in recent_staff_checkins:
            user_stmt = select(User).where(User.id == checkin.staff_id)
            user_result = await db.execute(user_stmt)
            user = user_result.scalar_one_or_none()
            if user:
                formatted_checkins.append({
                    "person_name": f"{user.first_name} {user.last_name}",
                    "type": checkin.status,
                    "time": checkin.marked_at.strftime("%H:%M"),
                    "method": checkin.method
                })
        
        # Sort by timestamp
        formatted_checkins.sort(key=lambda x: x["time"], reverse=True)
        formatted_checkins = formatted_checkins[:10]
        
        # Get active alerts (placeholder - can be expanded)
        active_alerts = []
        
        # Get emergency contacts
        emergency_contacts_stmt = select(User).where(
            and_(
                User.school_id == current_user.school_id,
                User.role.in_([UserRole.ADMIN, UserRole.SECURITY]),
                User.is_active == True
            )
        ).limit(5)
        
        emergency_contacts_result = await db.execute(emergency_contacts_stmt)
        emergency_contacts = emergency_contacts_result.scalars().all()
        
        formatted_contacts = []
        for contact in emergency_contacts:
            formatted_contacts.append({
                "name": f"{contact.first_name} {contact.last_name}",
                "role": contact.role.title(),
                "phone": contact.phone or "N/A"
            })
        
        return SecurityDashboardResponse(
            students_present=students_present,
            staff_present=staff_present,
            visitors_today=visitors_today,
            active_incidents=0,  # Placeholder
            recent_checkins=formatted_checkins,
            active_alerts=active_alerts,
            emergency_contacts=formatted_contacts,
            security_officer={
                "first_name": current_user.first_name,
                "last_name": current_user.last_name
            }
        )
    except Exception as e:
        print(f"Error in security dashboard: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/search", response_model=List[PersonSearchResponse])
async def search_people(
    query: str = Query(..., min_length=2),
    type: str = Query("all", pattern="^(all|student|staff)$"),
    current_user: User = Depends(require_security_with_gate_pass_settings()),
    db: AsyncSession = Depends(get_db)
):
    """Search for students and staff members."""
    
    search_term = f"%{query}%"
    results = []
    
    # Search students
    if type in ["all", "student"]:
        students_stmt = select(Student).where(
            and_(
                Student.school_id == current_user.school_id,
                Student.is_active == True,
                or_(
                    Student.first_name.ilike(search_term),
                    Student.last_name.ilike(search_term),
                    Student.student_id.ilike(search_term),
                    Student.roll_number.ilike(search_term) if Student.roll_number else False,
                    Student.rfid_card_id.ilike(search_term) if Student.rfid_card_id else False,
                    func.concat(Student.first_name, ' ', Student.last_name).ilike(search_term)
                )
            )
        ).limit(10)
        
        students_result = await db.execute(students_stmt)
        students = students_result.scalars().all()
        
        for student in students:
            results.append(PersonSearchResponse(
                id=student.id,
                first_name=student.first_name,
                last_name=student.last_name,
                type="student",
                id_number=student.student_id,
                class_name=None
            ))
    
    # Search staff
    if type in ["all", "staff"]:
        staff_stmt = select(User).where(
            and_(
                User.school_id == current_user.school_id,
                User.is_active == True,
                User.role.in_([UserRole.ADMIN, UserRole.TEACHER, UserRole.SECURITY]),
                or_(
                    User.first_name.ilike(search_term),
                    User.last_name.ilike(search_term),
                    User.email.ilike(search_term),
                    User.employee_id.ilike(search_term) if User.employee_id else False,
                    User.department.ilike(search_term) if User.department else False,
                    func.concat(User.first_name, ' ', User.last_name).ilike(search_term)
                )
            )
        ).limit(10)
        
        staff_result = await db.execute(staff_stmt)
        staff_members = staff_result.scalars().all()
        
        for staff in staff_members:
            results.append(PersonSearchResponse(
                id=staff.id,
                first_name=staff.first_name,
                last_name=staff.last_name,
                type="staff",
                employee_id=staff.employee_id,
                class_name=None
            ))
    
    return results[:10]  # Limit total results


@router.get("/verify/{person_type}/{person_id}", response_model=PersonSearchResponse)
async def verify_person(
    person_type: str = Path(..., pattern="^(student|staff)$"),
    person_id: int = Path(...),
    current_user: User = Depends(require_security_with_gate_pass_settings()),
    db: AsyncSession = Depends(get_db)
):
    """Verify a person by ID (useful for RFID card scanning)."""
    
    if person_type == "student":
        person_stmt = select(Student).where(
            and_(
                Student.id == person_id,
                Student.school_id == current_user.school_id,
                Student.is_active == True
            )
        )
        person_result = await db.execute(person_stmt)
        person = person_result.scalar_one_or_none()
        
        if not person:
            raise HTTPException(status_code=404, detail="Student not found")
        
        # Get class name if available
        class_name = None
        if person.class_id:
            class_stmt = select(Class).where(Class.id == person.class_id)
            class_result = await db.execute(class_stmt)
            class_obj = class_result.scalar_one_or_none()
            if class_obj:
                class_name = f"{class_obj.name} {class_obj.section}"
        
        return PersonSearchResponse(
            id=person.id,
            first_name=person.first_name,
            last_name=person.last_name,
            type="student",
            id_number=person.student_id,
            class_name=class_name
        )
    
    elif person_type == "staff":
        person_stmt = select(User).where(
            and_(
                User.id == person_id,
                User.school_id == current_user.school_id,
                User.is_active == True,
                User.role.in_([UserRole.ADMIN, UserRole.TEACHER, UserRole.SECURITY])
            )
        )
        person_result = await db.execute(person_stmt)
        person = person_result.scalar_one_or_none()
        
        if not person:
            raise HTTPException(status_code=404, detail="Staff member not found")
        
        return PersonSearchResponse(
            id=person.id,
            first_name=person.first_name,
            last_name=person.last_name,
            type="staff",
            employee_id=person.employee_id,
            class_name=None
        )
    
    else:
        raise HTTPException(status_code=400, detail="Invalid person type")


@router.get("/verify/rfid/{rfid_card_id}", response_model=PersonSearchResponse)
async def verify_by_rfid(
    rfid_card_id: str = Path(...),
    current_user: User = Depends(require_security_with_gate_pass_settings()),
    db: AsyncSession = Depends(get_db)
):
    """Verify a person by RFID card ID."""
    
    # First try to find a student with this RFID card
    student_stmt = select(Student).where(
        and_(
            Student.rfid_card_id == rfid_card_id,
            Student.school_id == current_user.school_id,
            Student.is_active == True
        )
    )
    student_result = await db.execute(student_stmt)
    student = student_result.scalar_one_or_none()
    
    if student:
        return PersonSearchResponse(
            id=student.id,
            first_name=student.first_name,
            last_name=student.last_name,
            type="student",
            id_number=student.student_id,
            class_name=None
        )
    
    # If not found as student, try to find as staff (if staff have RFID cards)
    # Note: This assumes staff might have RFID cards in the future
    staff_stmt = select(User).where(
        and_(
            User.school_id == current_user.school_id,
            User.is_active == True,
            User.role.in_([UserRole.ADMIN, UserRole.TEACHER, UserRole.SECURITY])
            # Add RFID field when available: User.rfid_card_id == rfid_card_id
        )
    )
    staff_result = await db.execute(staff_stmt)
    staff = staff_result.scalar_one_or_none()
    
    if staff:
        return PersonSearchResponse(
            id=staff.id,
            first_name=staff.first_name,
            last_name=staff.last_name,
            type="staff",
            employee_id=staff.employee_id,
            class_name=None
        )
    
    raise HTTPException(status_code=404, detail="Person with this RFID card not found")


@router.post("/attendance/mark")
async def mark_attendance(
    attendance_data: AttendanceMarkRequest,
    current_user: User = Depends(require_security_with_gate_pass_settings()),
    db: AsyncSession = Depends(get_db)
):
    """Mark attendance for a student or staff member."""
    
    # Validate person exists and belongs to school
    if attendance_data.person_type == "student":
        person_stmt = select(Student).where(
            and_(
                Student.id == attendance_data.person_id,
                Student.school_id == current_user.school_id,
                Student.is_active == True
            )
        )
        person_result = await db.execute(person_stmt)
        person = person_result.scalar_one_or_none()
        
        if not person:
            raise HTTPException(status_code=404, detail="Student not found")
        
        # Create attendance record
        attendance = Attendance(
            school_id=current_user.school_id,
            student_id=person.id,
            status=AttendanceStatus.PRESENT if attendance_data.check_type == "IN" else AttendanceStatus.ABSENT,
            method=attendance_data.method,
            location=attendance_data.location,
            notes=attendance_data.notes,
            marked_at=datetime.now(),
            attendance_date=datetime.now().date()
        )
        
    elif attendance_data.person_type == "staff":
        person_stmt = select(User).where(
            and_(
                User.id == attendance_data.person_id,
                User.school_id == current_user.school_id,
                User.is_active == True
            )
        )
        person_result = await db.execute(person_stmt)
        person = person_result.scalar_one_or_none()
        
        if not person:
            raise HTTPException(status_code=404, detail="Staff member not found")
        
        # Create staff attendance record
        attendance = StaffAttendance(
            school_id=current_user.school_id,
            staff_id=person.id,
            status=StaffAttendanceStatus.PRESENT if attendance_data.check_type == "IN" else StaffAttendanceStatus.ABSENT,
            method=attendance_data.method,
            location=attendance_data.location,
            notes=attendance_data.notes,
            marked_at=datetime.now(),
            attendance_date=datetime.now().date()
        )
    
    else:
        raise HTTPException(status_code=400, detail="Invalid person type")
    
    db.add(attendance)
    await db.commit()
    await db.refresh(attendance)
    
    return {"message": f"{attendance_data.check_type} recorded successfully", "id": attendance.id}

@router.get("/recent-checkins", response_model=List[RecentActivityResponse])
async def get_recent_checkins(
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(require_security_with_gate_pass_settings()),
    db: AsyncSession = Depends(get_db)
):
    """Get recent check-in/out activity."""
    
    # Get recent student attendance
    student_attendance_stmt = select(Attendance).where(
        Attendance.school_id == current_user.school_id
    ).order_by(Attendance.marked_at.desc()).limit(limit)
    
    student_result = await db.execute(student_attendance_stmt)
    student_attendance = student_result.scalars().all()
    
    # Get recent staff attendance
    staff_attendance_stmt = select(StaffAttendance).where(
        StaffAttendance.school_id == current_user.school_id
    ).order_by(StaffAttendance.marked_at.desc()).limit(limit)
    
    staff_result = await db.execute(staff_attendance_stmt)
    staff_attendance = staff_result.scalars().all()
    
    # Combine and sort by timestamp
    all_attendance = []
    
    for attendance in student_attendance:
        student_stmt = select(Student).where(Student.id == attendance.student_id)
        student_result = await db.execute(student_stmt)
        student = student_result.scalar_one_or_none()
        
        if student:
            all_attendance.append({
                "person_name": f"{student.first_name} {student.last_name}",
                "check_type": attendance.status,
                "time": attendance.marked_at.strftime("%H:%M"),
                "method": attendance.method,
                "timestamp": attendance.marked_at
            })
    
    for attendance in staff_attendance:
        user_stmt = select(User).where(User.id == attendance.staff_id)
        user_result = await db.execute(user_stmt)
        user = user_result.scalar_one_or_none()
        
        if user:
            all_attendance.append({
                "person_name": f"{user.first_name} {user.last_name}",
                "check_type": attendance.status,
                "time": attendance.marked_at.strftime("%H:%M"),
                "method": attendance.method,
                "timestamp": attendance.marked_at
            })
    
    # Sort by timestamp and return limited results
    all_attendance.sort(key=lambda x: x["timestamp"], reverse=True)
    return all_attendance[:limit]

@router.post("/visitors/register")
async def register_visitor(
    visitor_data: VisitorRegistrationRequest,
    current_user: User = Depends(require_security_with_gate_pass_settings()),
    db: AsyncSession = Depends(get_db)
):
    """Register a new visitor."""
    
    visitor = Visitor(
        school_id=current_user.school_id,
        first_name=visitor_data.first_name,
        last_name=visitor_data.last_name,
        phone=visitor_data.phone,
        email=visitor_data.email,
        purpose=visitor_data.purpose,
        requested_entry_time=datetime.now(),
        actual_entry_time=datetime.now(),
        status=VisitorStatus.CHECKED_IN,
        entry_security_guard_id=current_user.id,
        entry_gate="main_gate",
        id_number=visitor_data.id_number,
        vehicle_number=visitor_data.vehicle_number
    )
    
    db.add(visitor)
    await db.commit()
    await db.refresh(visitor)
    
    return {"message": "Visitor registered successfully", "id": visitor.id}

@router.post("/visitors/{visitor_id}/checkout")
async def check_out_visitor(
    visitor_id: int,
    checkout_data: VisitorCheckOutRequest,
    current_user: User = Depends(require_security_with_gate_pass_settings()),
    db: AsyncSession = Depends(get_db)
):
    """Check out a visitor."""
    
    visitor_stmt = select(Visitor).where(
        and_(
            Visitor.id == visitor_id,
            Visitor.school_id == current_user.school_id,
            Visitor.status == VisitorStatus.CHECKED_IN
        )
    )
    
    visitor_result = await db.execute(visitor_stmt)
    visitor = visitor_result.scalar_one_or_none()
    
    if not visitor:
        raise HTTPException(status_code=404, detail="Visitor not found or already checked out")
    
    visitor.actual_exit_time = datetime.now()
    visitor.status = VisitorStatus.CHECKED_OUT
    visitor.security_notes = checkout_data.notes
    
    await db.commit()
    await db.refresh(visitor)
    
    return {"message": "Visitor checked out successfully"}

@router.get("/visitors")
async def get_visitors(
    search: Optional[str] = None,
    status: Optional[str] = Query(None, pattern="^(present|checked_out|all)$"),
    current_user: User = Depends(require_security_with_gate_pass_settings()),
    db: AsyncSession = Depends(get_db)
):
    """Get visitors with optional search and status filter."""
    
    query = select(Visitor).where(Visitor.school_id == current_user.school_id)
    
    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                Visitor.first_name.ilike(search_term),
                Visitor.last_name.ilike(search_term),
                Visitor.purpose.ilike(search_term)
            )
        )
    
    if status and status != "all":
        if status == "present":
            query = query.where(Visitor.status == VisitorStatus.CHECKED_IN)
        elif status == "checked_out":
            query = query.where(Visitor.status == VisitorStatus.CHECKED_OUT)
    
    query = query.order_by(Visitor.actual_entry_time.desc())
    
    result = await db.execute(query)
    visitors = result.scalars().all()
    
    return visitors

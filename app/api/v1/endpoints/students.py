from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from typing import List, Optional

from app.api.deps import get_db, require_teacher_or_admin, require_admin, get_tenant_filter
from app.models.user import User
from app.models.student import Student, StudentStatus
from app.schemas.student import (
    StudentCreate, 
    StudentUpdate, 
    Student as StudentResponse, 
    StudentWithStats
)

router = APIRouter()


@router.get("/", response_model=List[StudentResponse])
async def get_students(
    request: Request,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = Query(None),
    class_name: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(require_teacher_or_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Get list of students with filtering and pagination.
    """
    tenant_filter = get_tenant_filter(request)
    school_id = tenant_filter["school_id"]
    
    # Build query
    stmt = select(Student).where(Student.school_id == school_id)
    
    # Apply filters
    if status and status != "all":
        if status == "active":
            stmt = stmt.where(Student.status == StudentStatus.ACTIVE)
        elif status == "inactive":
            stmt = stmt.where(Student.status == StudentStatus.INACTIVE)
        elif status == "graduated":
            stmt = stmt.where(Student.status == StudentStatus.GRADUATED)
        elif status == "transferred":
            stmt = stmt.where(Student.status == StudentStatus.TRANSFERRED)
    
    if class_name:
        stmt = stmt.where(Student.grade_level.ilike(f"%{class_name}%"))
    
    if search:
        search_term = f"%{search}%"
        stmt = stmt.where(
            or_(
                Student.first_name.ilike(search_term),
                Student.last_name.ilike(search_term),
                Student.student_id.ilike(search_term),
                Student.email.ilike(search_term)
            )
        )
    
    # Apply pagination
    stmt = stmt.offset(skip).limit(limit).order_by(Student.first_name, Student.last_name)
    
    result = await db.execute(stmt)
    students = result.scalars().all()
    
    # Convert to response format
    student_responses = []
    for student in students:
        student_responses.append(StudentResponse(
            id=student.id,
            student_id=student.student_id,
            first_name=student.first_name,
            last_name=student.last_name,
            full_name=student.full_name,
            email=student.email,
            phone=student.phone,
            date_of_birth=student.date_of_birth.isoformat() if student.date_of_birth else None,
            address=student.address,
            guardian_name=student.guardian_name,
            guardian_phone=student.guardian_phone,
            guardian_email=None,  # Not in model, will add if needed
            class_name=student.grade_level,
            section=student.section,
            admission_date=student.admission_date.isoformat() if student.admission_date else None,
            status=student.status.value,
            created_at=student.created_at.isoformat()
        ))
    
    return student_responses


@router.get("/{student_id}", response_model=StudentResponse)
async def get_student(
    student_id: int,
    request: Request,
    current_user: User = Depends(require_teacher_or_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Get specific student by ID.
    """
    tenant_filter = get_tenant_filter(request)
    school_id = tenant_filter["school_id"]
    
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
    
    return StudentResponse(
        id=student.id,
        student_id=student.student_id,
        first_name=student.first_name,
        last_name=student.last_name,
        full_name=student.full_name,
        email=student.email,
        phone=student.phone,
        date_of_birth=student.date_of_birth.isoformat() if student.date_of_birth else None,
        address=student.address,
        guardian_name=student.guardian_name,
        guardian_phone=student.guardian_phone,
        guardian_email=None,
        class_name=student.grade_level,
        section=student.section,
        admission_date=student.admission_date.isoformat() if student.admission_date else None,
        status=student.status.value,
        created_at=student.created_at.isoformat()
    )


@router.post("/", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
async def create_student(
    student_data: StudentCreate,
    request: Request,
    current_user: User = Depends(require_teacher_or_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new student.
    """
    tenant_filter = get_tenant_filter(request)
    school_id = tenant_filter["school_id"]
    
    # Check if student ID already exists
    stmt = select(Student).where(
        and_(
            Student.student_id == student_data.student_id,
            Student.school_id == school_id
        )
    )
    result = await db.execute(stmt)
    existing_student = result.scalar_one_or_none()
    
    if existing_student:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student with this ID already exists"
        )
    
    try:
        # Create student
        student = Student(
            student_id=student_data.student_id,
            first_name=student_data.first_name,
            last_name=student_data.last_name,
            email=student_data.email,
            phone=student_data.phone,
            date_of_birth=student_data.date_of_birth,
            address=student_data.address,
            guardian_name=student_data.guardian_name,
            guardian_phone=student_data.guardian_phone,
            grade_level=student_data.class_name or "Not Assigned",
            section=student_data.section,
            admission_date=student_data.admission_date,
            school_id=school_id,
            status=StudentStatus.ACTIVE,
            is_active=True
        )
        
        db.add(student)
        await db.commit()
        await db.refresh(student)
        
        return StudentResponse(
            id=student.id,
            student_id=student.student_id,
            first_name=student.first_name,
            last_name=student.last_name,
            full_name=student.full_name,
            email=student.email,
            phone=student.phone,
            date_of_birth=student.date_of_birth.isoformat() if student.date_of_birth else None,
            address=student.address,
            guardian_name=student.guardian_name,
            guardian_phone=student.guardian_phone,
            guardian_email=None,
            class_name=student.grade_level,
            section=student.section,
            admission_date=student.admission_date.isoformat() if student.admission_date else None,
            status=student.status.value,
            created_at=student.created_at.isoformat()
        )
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create student"
        )


@router.put("/{student_id}", response_model=StudentResponse)
async def update_student(
    student_id: int,
    student_update: StudentUpdate,
    request: Request,
    current_user: User = Depends(require_teacher_or_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Update student information.
    """
    tenant_filter = get_tenant_filter(request)
    school_id = tenant_filter["school_id"]
    
    # Get student to update
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
    
    try:
        # Update student fields
        update_data = student_update.dict(exclude_unset=True)
        
        for field, value in update_data.items():
            if field == "class_name":
                setattr(student, "grade_level", value)
            elif hasattr(student, field):
                setattr(student, field, value)
        
        await db.commit()
        await db.refresh(student)
        
        return StudentResponse(
            id=student.id,
            student_id=student.student_id,
            first_name=student.first_name,
            last_name=student.last_name,
            full_name=student.full_name,
            email=student.email,
            phone=student.phone,
            date_of_birth=student.date_of_birth.isoformat() if student.date_of_birth else None,
            address=student.address,
            guardian_name=student.guardian_name,
            guardian_phone=student.guardian_phone,
            guardian_email=None,
            class_name=student.grade_level,
            section=student.section,
            admission_date=student.admission_date.isoformat() if student.admission_date else None,
            status=student.status.value,
            created_at=student.created_at.isoformat()
        )
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update student"
        )


@router.delete("/{student_id}")
async def delete_student(
    student_id: int,
    request: Request,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete (deactivate) a student.
    Only accessible by admins.
    """
    tenant_filter = get_tenant_filter(request)
    school_id = tenant_filter["school_id"]
    
    # Get student to delete
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
    
    try:
        # Soft delete by deactivating
        student.is_active = False
        student.status = StudentStatus.INACTIVE
        
        await db.commit()
        
        return {"message": "Student deleted successfully"}
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete student"
        ) 
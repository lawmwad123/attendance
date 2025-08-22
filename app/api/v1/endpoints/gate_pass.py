from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from typing import List, Optional
from datetime import datetime, date
import uuid

from app.api.deps import get_db, require_teacher_or_admin, get_tenant_filter
from app.models.user import User
from app.models.student import Student
from app.models.gate_pass import GatePass, GatePassStatus, GatePassType
from app.schemas.gate_pass import (
    GatePassCreate,
    GatePassUpdate,
    GatePass as GatePassResponse,
    GatePassApproval
)

router = APIRouter()


@router.get("/", response_model=List[GatePassResponse])
async def get_gate_passes(
    request: Request,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    date: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(require_teacher_or_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Get gate pass requests with filtering.
    """
    tenant_filter = get_tenant_filter(request)
    school_id = tenant_filter["school_id"]
    
    # Build query with student join
    stmt = select(GatePass, Student).join(Student).where(Student.school_id == school_id)
    
    # Apply filters
    if status and status != "all":
        if status == "pending":
            stmt = stmt.where(GatePass.status == GatePassStatus.PENDING)
        elif status == "approved":
            stmt = stmt.where(GatePass.status == GatePassStatus.APPROVED)
        elif status == "denied":
            stmt = stmt.where(GatePass.status == GatePassStatus.DENIED)
        elif status == "used":
            stmt = stmt.where(GatePass.status == GatePassStatus.ACTIVE)
        elif status == "expired":
            stmt = stmt.where(GatePass.status == GatePassStatus.EXPIRED)
    
    if type and type != "all":
        if type == "exit":
            stmt = stmt.where(GatePass.pass_type == GatePassType.EARLY_EXIT)
        elif type == "entry":
            stmt = stmt.where(GatePass.pass_type == GatePassType.LATE_ARRIVAL)
        elif type == "temporary":
            stmt = stmt.where(GatePass.pass_type == GatePassType.APPOINTMENT)
    
    if date:
        request_date = datetime.strptime(date, "%Y-%m-%d").date()
        stmt = stmt.where(func.date(GatePass.requested_exit_time) == request_date)
    
    if search:
        search_term = f"%{search}%"
        stmt = stmt.where(
            or_(
                Student.first_name.ilike(search_term),
                Student.last_name.ilike(search_term),
                Student.student_id.ilike(search_term),
                GatePass.reason.ilike(search_term)
            )
        )
    
    # Apply pagination and ordering
    stmt = stmt.offset(skip).limit(limit).order_by(GatePass.created_at.desc())
    
    result = await db.execute(stmt)
    gate_pass_records = result.all()
    
    # Convert to response format
    response = []
    for gate_pass, student in gate_pass_records:
        response.append(GatePassResponse(
            id=gate_pass.id,
            student_id=gate_pass.student_id,
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
            type=_map_gate_pass_type(gate_pass.pass_type),
            reason=gate_pass.reason,
            requested_time=gate_pass.requested_exit_time.isoformat(),
            approved_time=gate_pass.approved_at.isoformat() if gate_pass.approved_at else None,
            exit_time=gate_pass.actual_exit_time.isoformat() if gate_pass.actual_exit_time else None,
            return_time=gate_pass.actual_return_time.isoformat() if gate_pass.actual_return_time else None,
            status=_map_gate_pass_status(gate_pass.status),
            guardian_approval=bool(gate_pass.approved_by_user_id),  # Simplified for now
            admin_approval=bool(gate_pass.approved_by_user_id),
            notes=gate_pass.approval_notes,
            approved_by=gate_pass.approved_by.full_name if gate_pass.approved_by else None,
            created_at=gate_pass.created_at.isoformat(),
            updated_at=gate_pass.updated_at.isoformat()
        ))
    
    return response


@router.get("/{pass_id}", response_model=GatePassResponse)
async def get_gate_pass(
    pass_id: int,
    request: Request,
    current_user: User = Depends(require_teacher_or_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Get specific gate pass by ID.
    """
    tenant_filter = get_tenant_filter(request)
    school_id = tenant_filter["school_id"]
    
    stmt = select(GatePass, Student).join(Student).where(
        and_(
            GatePass.id == pass_id,
            Student.school_id == school_id
        )
    )
    result = await db.execute(stmt)
    gate_pass_record = result.one_or_none()
    
    if not gate_pass_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gate pass not found"
        )
    
    gate_pass, student = gate_pass_record
    
    return GatePassResponse(
        id=gate_pass.id,
        student_id=gate_pass.student_id,
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
        type=_map_gate_pass_type(gate_pass.pass_type),
        reason=gate_pass.reason,
        requested_time=gate_pass.requested_exit_time.isoformat(),
        approved_time=gate_pass.approved_at.isoformat() if gate_pass.approved_at else None,
        exit_time=gate_pass.actual_exit_time.isoformat() if gate_pass.actual_exit_time else None,
        return_time=gate_pass.actual_return_time.isoformat() if gate_pass.actual_return_time else None,
        status=_map_gate_pass_status(gate_pass.status),
        guardian_approval=bool(gate_pass.approved_by_user_id),
        admin_approval=bool(gate_pass.approved_by_user_id),
        notes=gate_pass.approval_notes,
        approved_by=gate_pass.approved_by.full_name if gate_pass.approved_by else None,
        created_at=gate_pass.created_at.isoformat(),
        updated_at=gate_pass.updated_at.isoformat()
    )


@router.post("/", response_model=GatePassResponse, status_code=status.HTTP_201_CREATED)
async def create_gate_pass(
    gate_pass_data: GatePassCreate,
    request: Request,
    current_user: User = Depends(require_teacher_or_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new gate pass request.
    """
    tenant_filter = get_tenant_filter(request)
    school_id = tenant_filter["school_id"]
    
    # Verify student exists and belongs to school
    stmt = select(Student).where(
        and_(
            Student.id == gate_pass_data.student_id,
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
        # Generate unique pass number
        pass_number = f"GP-{uuid.uuid4().hex[:8].upper()}"
        
        # Map frontend type to backend enum
        pass_type = _map_frontend_type_to_enum(gate_pass_data.type)
        
        # Create gate pass
        gate_pass = GatePass(
            student_id=gate_pass_data.student_id,
            pass_number=pass_number,
            pass_type=pass_type,
            reason=gate_pass_data.reason,
            status=GatePassStatus.PENDING,
            requested_exit_time=datetime.fromisoformat(gate_pass_data.requested_time.replace('Z', '+00:00')),
            requested_by_user_id=current_user.id,
            special_instructions=gate_pass_data.notes
        )
        
        db.add(gate_pass)
        await db.commit()
        await db.refresh(gate_pass)
        
        return GatePassResponse(
            id=gate_pass.id,
            student_id=gate_pass.student_id,
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
            type=gate_pass_data.type,
            reason=gate_pass.reason,
            requested_time=gate_pass.requested_exit_time.isoformat(),
            approved_time=None,
            exit_time=None,
            return_time=None,
            status="pending",
            guardian_approval=False,
            admin_approval=False,
            notes=gate_pass.special_instructions,
            approved_by=None,
            created_at=gate_pass.created_at.isoformat(),
            updated_at=gate_pass.updated_at.isoformat()
        )
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create gate pass"
        )


@router.put("/{pass_id}/approve", response_model=GatePassResponse)
async def approve_gate_pass(
    pass_id: int,
    approval_data: GatePassApproval,
    request: Request,
    current_user: User = Depends(require_teacher_or_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Approve a gate pass request.
    """
    tenant_filter = get_tenant_filter(request)
    school_id = tenant_filter["school_id"]
    
    # Get gate pass with student
    stmt = select(GatePass, Student).join(Student).where(
        and_(
            GatePass.id == pass_id,
            Student.school_id == school_id
        )
    )
    result = await db.execute(stmt)
    gate_pass_record = result.one_or_none()
    
    if not gate_pass_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gate pass not found"
        )
    
    gate_pass, student = gate_pass_record
    
    if gate_pass.status != GatePassStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Gate pass is not pending approval"
        )
    
    try:
        # Approve gate pass
        gate_pass.status = GatePassStatus.APPROVED
        gate_pass.approved_by_user_id = current_user.id
        gate_pass.approved_at = datetime.now()
        gate_pass.approval_notes = approval_data.notes
        
        await db.commit()
        await db.refresh(gate_pass)
        
        return GatePassResponse(
            id=gate_pass.id,
            student_id=gate_pass.student_id,
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
            type=_map_gate_pass_type(gate_pass.pass_type),
            reason=gate_pass.reason,
            requested_time=gate_pass.requested_exit_time.isoformat(),
            approved_time=gate_pass.approved_at.isoformat(),
            exit_time=gate_pass.actual_exit_time.isoformat() if gate_pass.actual_exit_time else None,
            return_time=gate_pass.actual_return_time.isoformat() if gate_pass.actual_return_time else None,
            status="approved",
            guardian_approval=True,
            admin_approval=True,
            notes=gate_pass.approval_notes,
            approved_by=current_user.full_name,
            created_at=gate_pass.created_at.isoformat(),
            updated_at=gate_pass.updated_at.isoformat()
        )
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to approve gate pass"
        )


@router.put("/{pass_id}/deny", response_model=GatePassResponse)
async def deny_gate_pass(
    pass_id: int,
    approval_data: GatePassApproval,
    request: Request,
    current_user: User = Depends(require_teacher_or_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Deny a gate pass request.
    """
    tenant_filter = get_tenant_filter(request)
    school_id = tenant_filter["school_id"]
    
    # Get gate pass with student
    stmt = select(GatePass, Student).join(Student).where(
        and_(
            GatePass.id == pass_id,
            Student.school_id == school_id
        )
    )
    result = await db.execute(stmt)
    gate_pass_record = result.one_or_none()
    
    if not gate_pass_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gate pass not found"
        )
    
    gate_pass, student = gate_pass_record
    
    if gate_pass.status != GatePassStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Gate pass is not pending approval"
        )
    
    try:
        # Deny gate pass
        gate_pass.status = GatePassStatus.DENIED
        gate_pass.approved_by_user_id = current_user.id
        gate_pass.approved_at = datetime.now()
        gate_pass.approval_notes = approval_data.notes
        
        await db.commit()
        await db.refresh(gate_pass)
        
        return GatePassResponse(
            id=gate_pass.id,
            student_id=gate_pass.student_id,
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
            type=_map_gate_pass_type(gate_pass.pass_type),
            reason=gate_pass.reason,
            requested_time=gate_pass.requested_exit_time.isoformat(),
            approved_time=gate_pass.approved_at.isoformat(),
            exit_time=gate_pass.actual_exit_time.isoformat() if gate_pass.actual_exit_time else None,
            return_time=gate_pass.actual_return_time.isoformat() if gate_pass.actual_return_time else None,
            status="denied",
            guardian_approval=False,
            admin_approval=False,
            notes=gate_pass.approval_notes,
            approved_by=current_user.full_name,
            created_at=gate_pass.created_at.isoformat(),
            updated_at=gate_pass.updated_at.isoformat()
        )
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to deny gate pass"
        )


@router.put("/{pass_id}", response_model=GatePassResponse)
async def update_gate_pass(
    pass_id: int,
    update_data: GatePassUpdate,
    request: Request,
    current_user: User = Depends(require_teacher_or_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Update gate pass information.
    """
    tenant_filter = get_tenant_filter(request)
    school_id = tenant_filter["school_id"]
    
    # Get gate pass with student
    stmt = select(GatePass, Student).join(Student).where(
        and_(
            GatePass.id == pass_id,
            Student.school_id == school_id
        )
    )
    result = await db.execute(stmt)
    gate_pass_record = result.one_or_none()
    
    if not gate_pass_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gate pass not found"
        )
    
    gate_pass, student = gate_pass_record
    
    try:
        # Update gate pass fields
        update_dict = update_data.dict(exclude_unset=True)
        
        for field, value in update_dict.items():
            if field == "type":
                setattr(gate_pass, "pass_type", _map_frontend_type_to_enum(value))
            elif field == "requested_time":
                setattr(gate_pass, "requested_exit_time", datetime.fromisoformat(value.replace('Z', '+00:00')))
            elif field == "notes":
                setattr(gate_pass, "special_instructions", value)
            elif hasattr(gate_pass, field):
                setattr(gate_pass, field, value)
        
        await db.commit()
        await db.refresh(gate_pass)
        
        return GatePassResponse(
            id=gate_pass.id,
            student_id=gate_pass.student_id,
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
            type=_map_gate_pass_type(gate_pass.pass_type),
            reason=gate_pass.reason,
            requested_time=gate_pass.requested_exit_time.isoformat(),
            approved_time=gate_pass.approved_at.isoformat() if gate_pass.approved_at else None,
            exit_time=gate_pass.actual_exit_time.isoformat() if gate_pass.actual_exit_time else None,
            return_time=gate_pass.actual_return_time.isoformat() if gate_pass.actual_return_time else None,
            status=_map_gate_pass_status(gate_pass.status),
            guardian_approval=bool(gate_pass.approved_by_user_id),
            admin_approval=bool(gate_pass.approved_by_user_id),
            notes=gate_pass.special_instructions,
            approved_by=gate_pass.approved_by.full_name if gate_pass.approved_by else None,
            created_at=gate_pass.created_at.isoformat(),
            updated_at=gate_pass.updated_at.isoformat()
        )
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update gate pass"
        )


@router.delete("/{pass_id}")
async def delete_gate_pass(
    pass_id: int,
    request: Request,
    current_user: User = Depends(require_teacher_or_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a gate pass.
    """
    tenant_filter = get_tenant_filter(request)
    school_id = tenant_filter["school_id"]
    
    # Get gate pass
    stmt = select(GatePass, Student).join(Student).where(
        and_(
            GatePass.id == pass_id,
            Student.school_id == school_id
        )
    )
    result = await db.execute(stmt)
    gate_pass_record = result.one_or_none()
    
    if not gate_pass_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gate pass not found"
        )
    
    gate_pass, student = gate_pass_record
    
    try:
        await db.delete(gate_pass)
        await db.commit()
        
        return {"message": "Gate pass deleted successfully"}
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete gate pass"
        )


# Helper functions
def _map_gate_pass_type(pass_type: GatePassType) -> str:
    """Map backend enum to frontend string."""
    mapping = {
        GatePassType.EARLY_EXIT: "exit",
        GatePassType.LATE_ARRIVAL: "entry",
        GatePassType.APPOINTMENT: "temporary",
        GatePassType.EMERGENCY: "exit",
        GatePassType.PARENT_PICKUP: "exit",
        GatePassType.FIELD_TRIP: "exit",
        GatePassType.OTHER: "temporary"
    }
    return mapping.get(pass_type, "temporary")


def _map_gate_pass_status(status: GatePassStatus) -> str:
    """Map backend enum to frontend string."""
    mapping = {
        GatePassStatus.PENDING: "pending",
        GatePassStatus.APPROVED: "approved",
        GatePassStatus.DENIED: "denied",
        GatePassStatus.ACTIVE: "used",
        GatePassStatus.COMPLETED: "used",
        GatePassStatus.EXPIRED: "expired",
        GatePassStatus.CANCELLED: "denied"
    }
    return mapping.get(status, "pending")


def _map_frontend_type_to_enum(frontend_type: str) -> GatePassType:
    """Map frontend string to backend enum."""
    mapping = {
        "exit": GatePassType.EARLY_EXIT,
        "entry": GatePassType.LATE_ARRIVAL,
        "temporary": GatePassType.APPOINTMENT
    }
    return mapping.get(frontend_type, GatePassType.OTHER) 
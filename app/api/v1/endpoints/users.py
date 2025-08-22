from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from typing import List, Optional

from app.api.deps import (
    get_db, 
    get_current_active_user, 
    require_admin, 
    require_teacher_or_admin,
    get_tenant_filter
)
from app.core.security import get_password_hash
from app.models.user import User, UserRole, UserStatus
from app.schemas.user import UserCreate, UserUpdate, User as UserResponse, UserProfile
from app.middleware.tenant import get_current_school_id

router = APIRouter()


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    request: Request,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new user.
    Only accessible by school admins.
    """
    # Get tenant filter
    tenant_filter = get_tenant_filter(request)
    school_id = tenant_filter["school_id"]
    
    # Check if user with email already exists in this school
    stmt = select(User).where(
        and_(
            User.email == user_data.email.lower(),
            User.school_id == school_id
        )
    )
    result = await db.execute(stmt)
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists in this school"
        )
    
    # Check employee_id uniqueness if provided
    if user_data.employee_id:
        stmt = select(User).where(
            and_(
                User.employee_id == user_data.employee_id,
                User.school_id == school_id
            )
        )
        result = await db.execute(stmt)
        existing_employee = result.scalar_one_or_none()
        
        if existing_employee:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this employee ID already exists"
            )
    
    try:
        # Create user
        user = User(
            email=user_data.email.lower(),
            username=user_data.username,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            phone=user_data.phone,
            hashed_password=get_password_hash(user_data.password),
            role=user_data.role,
            employee_id=user_data.employee_id,
            department=user_data.department,
            hire_date=user_data.hire_date,
            school_id=school_id,
            status=UserStatus.ACTIVE,
            is_active=True,
            is_verified=True
        )
        
        db.add(user)
        await db.commit()
        await db.refresh(user)
        
        return user
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user"
        )


@router.get("/", response_model=List[UserResponse])
async def get_users(
    request: Request,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    role: Optional[UserRole] = Query(None),
    status: Optional[UserStatus] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(require_teacher_or_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Get list of users with filtering and pagination.
    Accessible by teachers and admins.
    """
    # Get tenant filter
    tenant_filter = get_tenant_filter(request)
    school_id = tenant_filter["school_id"]
    
    # Build query
    stmt = select(User).where(User.school_id == school_id)
    
    # Apply filters
    if role:
        stmt = stmt.where(User.role == role)
    
    if status:
        stmt = stmt.where(User.status == status)
    
    if search:
        search_term = f"%{search}%"
        stmt = stmt.where(
            or_(
                User.first_name.ilike(search_term),
                User.last_name.ilike(search_term),
                User.email.ilike(search_term),
                User.employee_id.ilike(search_term)
            )
        )
    
    # Apply pagination
    stmt = stmt.offset(skip).limit(limit)
    
    result = await db.execute(stmt)
    users = result.scalars().all()
    
    return users


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    request: Request,
    current_user: User = Depends(require_teacher_or_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Get specific user by ID.
    Accessible by teachers and admins.
    """
    # Get tenant filter
    tenant_filter = get_tenant_filter(request)
    school_id = tenant_filter["school_id"]
    
    stmt = select(User).where(
        and_(
            User.id == user_id,
            User.school_id == school_id
        )
    )
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_update: UserUpdate,
    request: Request,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Update user information.
    Only accessible by school admins.
    """
    # Get tenant filter
    tenant_filter = get_tenant_filter(request)
    school_id = tenant_filter["school_id"]
    
    # Get user to update
    stmt = select(User).where(
        and_(
            User.id == user_id,
            User.school_id == school_id
        )
    )
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check email uniqueness if being updated
    if user_update.email and user_update.email.lower() != user.email:
        stmt = select(User).where(
            and_(
                User.email == user_update.email.lower(),
                User.school_id == school_id,
                User.id != user_id
            )
        )
        result = await db.execute(stmt)
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists"
            )
    
    # Check employee_id uniqueness if being updated
    if user_update.employee_id and user_update.employee_id != user.employee_id:
        stmt = select(User).where(
            and_(
                User.employee_id == user_update.employee_id,
                User.school_id == school_id,
                User.id != user_id
            )
        )
        result = await db.execute(stmt)
        existing_employee = result.scalar_one_or_none()
        
        if existing_employee:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this employee ID already exists"
            )
    
    try:
        # Update user fields
        update_data = user_update.dict(exclude_unset=True)
        
        for field, value in update_data.items():
            if field == "email" and value:
                setattr(user, field, value.lower())
            elif hasattr(user, field):
                setattr(user, field, value)
        
        await db.commit()
        await db.refresh(user)
        
        return user
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user"
        )


@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    request: Request,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete (deactivate) a user.
    Only accessible by school admins.
    """
    # Get tenant filter
    tenant_filter = get_tenant_filter(request)
    school_id = tenant_filter["school_id"]
    
    # Prevent admin from deleting themselves
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    # Get user to delete
    stmt = select(User).where(
        and_(
            User.id == user_id,
            User.school_id == school_id
        )
    )
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    try:
        # Soft delete by deactivating
        user.is_active = False
        user.status = UserStatus.INACTIVE
        
        await db.commit()
        
        return {"message": "User deleted successfully"}
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete user"
        )


@router.get("/teachers/", response_model=List[UserResponse])
async def get_teachers(
    request: Request,
    current_user: User = Depends(require_teacher_or_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Get list of teachers.
    Accessible by teachers and admins.
    """
    # Get tenant filter
    tenant_filter = get_tenant_filter(request)
    school_id = tenant_filter["school_id"]
    
    stmt = select(User).where(
        and_(
            User.school_id == school_id,
            User.role == UserRole.TEACHER,
            User.is_active == True
        )
    )
    
    result = await db.execute(stmt)
    teachers = result.scalars().all()
    
    return teachers


@router.get("/parents/", response_model=List[UserResponse])
async def get_parents(
    request: Request,
    current_user: User = Depends(require_teacher_or_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Get list of parents.
    Accessible by teachers and admins.
    """
    # Get tenant filter
    tenant_filter = get_tenant_filter(request)
    school_id = tenant_filter["school_id"]
    
    stmt = select(User).where(
        and_(
            User.school_id == school_id,
            User.role == UserRole.PARENT,
            User.is_active == True
        )
    )
    
    result = await db.execute(stmt)
    parents = result.scalars().all()
    
    return parents 
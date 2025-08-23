from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import timedelta

from app.api.deps import get_db, get_current_active_user
from app.core.config import settings
from app.core.security import verify_password, create_access_token, get_password_hash
from app.models.user import User
from app.schemas.user import UserLogin, Token, UserProfile, PasswordChange, UserUpdate
from app.middleware.tenant import get_current_school_id

router = APIRouter()
security = HTTPBearer()


@router.post("/login", response_model=Token)
async def login(
    user_credentials: UserLogin,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    User login endpoint.
    """
    # Get current school from tenant context
    school_id = get_current_school_id(request)
    if not school_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="School context required for login"
        )
    
    # Find user by email and school
    stmt = select(User).where(
        User.email == user_credentials.email.lower(),
        User.school_id == school_id
    )
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if not verify_password(user_credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive"
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.id,
        expires_delta=access_token_expires,
        additional_claims={
            "role": user.role.value,
            "school_id": user.school_id
        }
    )
    
    # Prepare user profile
    user_profile = UserProfile(
        id=user.id,
        email=user.email,
        username=user.username,
        first_name=user.first_name,
        last_name=user.last_name,
        full_name=user.full_name,
        phone=user.phone,
        role=user.role,
        status=user.status,
        employee_id=user.employee_id,
        department=user.department,
        hire_date=user.hire_date,
        is_active=user.is_active,
        is_verified=user.is_verified,
        created_at=user.created_at
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=user_profile
    )


@router.get("/me", response_model=UserProfile)
async def get_current_user_profile(
    current_user: User = Depends(get_current_active_user)
):
    """
    Get current user profile.
    """
    return UserProfile(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        full_name=current_user.full_name,
        phone=current_user.phone,
        role=current_user.role,
        status=current_user.status,
        employee_id=current_user.employee_id,
        department=current_user.department,
        hire_date=current_user.hire_date,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        created_at=current_user.created_at
    )


@router.post("/change-password")
async def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Change user password.
    """
    # Verify current password
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid current password"
        )
    
    # Update password
    current_user.hashed_password = get_password_hash(password_data.new_password)
    
    try:
        await db.commit()
        await db.refresh(current_user)
        return {"message": "Password changed successfully"}
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to change password"
        )


@router.put("/profile", response_model=UserProfile)
async def update_profile(
    profile_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update current user's profile information.
    Users can update their own personal information but not role or status.
    """
    # Prevent updating sensitive fields
    if profile_update.role is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update role through profile endpoint"
        )
    
    if profile_update.status is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update status through profile endpoint"
        )
    
    if profile_update.is_active is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update active status through profile endpoint"
        )
    
    # Check email uniqueness if being updated
    if profile_update.email and profile_update.email.lower() != current_user.email:
        stmt = select(User).where(
            User.email == profile_update.email.lower(),
            User.school_id == current_user.school_id,
            User.id != current_user.id
        )
        result = await db.execute(stmt)
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists"
            )
    
    # Check employee_id uniqueness if being updated
    if profile_update.employee_id and profile_update.employee_id != current_user.employee_id:
        stmt = select(User).where(
            User.employee_id == profile_update.employee_id,
            User.school_id == current_user.school_id,
            User.id != current_user.id
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
        update_data = profile_update.dict(exclude_unset=True)
        
        for field, value in update_data.items():
            if field == "email" and value:
                setattr(current_user, field, value.lower())
            elif hasattr(current_user, field):
                setattr(current_user, field, value)
        
        await db.commit()
        await db.refresh(current_user)
        
        return UserProfile(
            id=current_user.id,
            email=current_user.email,
            username=current_user.username,
            first_name=current_user.first_name,
            last_name=current_user.last_name,
            full_name=current_user.full_name,
            phone=current_user.phone,
            role=current_user.role,
            status=current_user.status,
            employee_id=current_user.employee_id,
            department=current_user.department,
            hire_date=current_user.hire_date,
            is_active=current_user.is_active,
            is_verified=current_user.is_verified,
            created_at=current_user.created_at
        )
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update profile"
        )


@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_active_user)
):
    """
    User logout endpoint.
    Note: In a stateless JWT system, logout is typically handled client-side
    by removing the token. This endpoint can be used for logging/audit purposes.
    """
    return {"message": "Logged out successfully"}


@router.get("/verify-token")
async def verify_token_endpoint(
    current_user: User = Depends(get_current_active_user)
):
    """
    Verify if the current token is valid.
    """
    return {
        "valid": True,
        "user_id": current_user.id,
        "role": current_user.role,
        "school_id": current_user.school_id
    }
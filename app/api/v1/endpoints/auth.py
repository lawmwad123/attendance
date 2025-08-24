from fastapi import APIRouter, Depends, HTTPException, status, Request, UploadFile, File
from fastapi.security import HTTPBearer
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import timedelta, datetime

from app.api.deps import get_db, get_current_active_user
from app.core.config import settings
from app.core.security import verify_password, create_access_token, get_password_hash
from app.core.file_upload import file_upload_service
from app.core.email import email_service
from app.models.user import User
from app.schemas.user import UserLogin, Token, UserProfile, PasswordChange, UserUpdate, ForgotPassword, ResetPassword
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
        profile_image=user.profile_image,
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
        profile_image=current_user.profile_image,
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
            profile_image=current_user.profile_image,
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


@router.post("/upload-profile-image")
async def upload_profile_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload profile image for current user.
    """
    try:
        # Process and save the image
        image_path = await file_upload_service.process_and_save_profile_image(
            file=file,
            user_id=current_user.id,
            school_id=current_user.school_id
        )
        
        print(f"DEBUG: Image saved at path: {image_path}")
        
        # Delete old profile image if exists
        if current_user.profile_image:
            await file_upload_service.delete_profile_image(current_user.profile_image)
        
        # Update user profile with new image path
        current_user.profile_image = image_path
        
        await db.commit()
        await db.refresh(current_user)
        
        print(f"DEBUG: User profile_image after update: {current_user.profile_image}")
        
        return {
            "message": "Profile image uploaded successfully",
            "image_path": image_path,
            "image_url": file_upload_service.get_image_url(image_path)
        }
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload profile image: {str(e)}"
        )


@router.delete("/delete-profile-image")
async def delete_profile_image(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete profile image for current user.
    """
    try:
        if not current_user.profile_image:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No profile image found"
            )
        
        # Delete the file
        deleted = await file_upload_service.delete_profile_image(current_user.profile_image)
        
        if deleted:
            # Update user profile
            current_user.profile_image = None
            await db.commit()
            await db.refresh(current_user)
            
            return {"message": "Profile image deleted successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete profile image file"
            )
            
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete profile image: {str(e)}"
        )


@router.get("/profile-image/{user_id}")
async def get_profile_image(
    user_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Get profile image for a user.
    """
    # Get tenant filter
    school_id = get_current_school_id(request)
    if not school_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="School context required"
        )
    
    # Get user
    stmt = select(User).where(
        User.id == user_id,
        User.school_id == school_id
    )
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if not user.profile_image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No profile image found"
        )
    
    # Serve the image
    response = await file_upload_service.serve_image(user.profile_image)
    if response:
        return response
    
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Profile image file not found"
    )


@router.post("/forgot-password")
async def forgot_password(
    forgot_password_data: ForgotPassword,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Request password reset for a user.
    """
    # Get current school from tenant context
    school_id = get_current_school_id(request)
    if not school_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="School context required"
        )
    
    # Find user by email and school
    stmt = select(User).where(
        User.email == forgot_password_data.email.lower(),
        User.school_id == school_id
    )
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    # Always return success to prevent email enumeration attacks
    if not user:
        return {"message": "If the email exists, a password reset link has been sent"}
    
    if not user.is_active:
        return {"message": "If the email exists, a password reset link has been sent"}
    
    try:
        # Generate reset token
        reset_token = email_service.generate_reset_token()
        reset_token_expires = datetime.utcnow() + timedelta(hours=settings.EMAIL_RESET_TOKEN_EXPIRE_HOURS)
        
        # Debug logging
        print(f"DEBUG: Generated reset token for {user.email}: {reset_token[:10]}...")
        print(f"DEBUG: Token expires at: {reset_token_expires}")
        
        # Update user with reset token
        user.reset_token = reset_token
        user.reset_token_expires = reset_token_expires
        
        await db.commit()
        await db.refresh(user)
        
        # Get school name for email
        from app.models.school import School
        school_stmt = select(School).where(School.id == school_id)
        school_result = await db.execute(school_stmt)
        school = school_result.scalar_one_or_none()
        school_name = school.name if school else "School"
        
        # Get tenant ID from request
        tenant_id = request.headers.get(settings.TENANT_HEADER_NAME)
        
        # Send password reset email
        email_sent = email_service.send_password_reset_email(
            to_email=user.email,
            reset_token=reset_token,
            user_name=user.full_name,
            school_name=school_name,
            tenant_id=tenant_id
        )
        
        if email_sent:
            return {"message": "Password reset email sent successfully"}
        else:
            # If email fails, clear the token
            user.reset_token = None
            user.reset_token_expires = None
            await db.commit()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send password reset email"
            )
            
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process password reset request"
        )


@router.post("/reset-password")
async def reset_password(
    reset_password_data: ResetPassword,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Reset password using reset token.
    """
    # Get current school from tenant context
    school_id = get_current_school_id(request)
    if not school_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="School context required"
        )
    
    # Debug logging
    print(f"DEBUG: Reset password request - Token: {reset_password_data.token[:10]}..., School ID: {school_id}")
    
    # Find user by reset token and school
    stmt = select(User).where(
        User.reset_token == reset_password_data.token,
        User.school_id == school_id
    )
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    # Debug logging
    if user:
        print(f"DEBUG: User found - ID: {user.id}, Email: {user.email}")
    else:
        print(f"DEBUG: No user found with token: {reset_password_data.token[:10]}...")
        # Check if token exists in any school
        all_tokens_stmt = select(User).where(User.reset_token == reset_password_data.token)
        all_tokens_result = await db.execute(all_tokens_stmt)
        all_tokens_users = all_tokens_result.scalars().all()
        print(f"DEBUG: Found {len(all_tokens_users)} users with this token across all schools")
        for u in all_tokens_users:
            print(f"DEBUG: - User ID: {u.id}, Email: {u.email}, School ID: {u.school_id}")
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    # Check if token is expired
    if user.reset_token_expires and user.reset_token_expires < datetime.utcnow():
        # Clear expired token
        user.reset_token = None
        user.reset_token_expires = None
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token has expired"
        )
    
    try:
        # Update password and clear reset token
        user.hashed_password = get_password_hash(reset_password_data.new_password)
        user.reset_token = None
        user.reset_token_expires = None
        
        await db.commit()
        await db.refresh(user)
        
        return {"message": "Password reset successfully"}
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reset password"
        )
from pydantic import BaseModel, EmailStr, validator
from typing import Optional
from datetime import datetime

from app.models.user import UserRole, UserStatus


class UserBase(BaseModel):
    """Base user schema."""
    email: EmailStr
    username: Optional[str] = None
    first_name: str
    last_name: str
    phone: Optional[str] = None
    role: UserRole = UserRole.TEACHER
    employee_id: Optional[str] = None
    department: Optional[str] = None
    hire_date: Optional[str] = None


class UserCreate(UserBase):
    """Schema for creating a user."""
    password: str
    school_id: Optional[int] = None  # Will be set from tenant context
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v


class UserUpdate(BaseModel):
    """Schema for updating a user."""
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[UserRole] = None
    employee_id: Optional[str] = None
    department: Optional[str] = None
    hire_date: Optional[str] = None
    is_active: Optional[bool] = None
    status: Optional[UserStatus] = None


class UserInDB(UserBase):
    """Schema for user in database."""
    id: int
    school_id: int
    is_active: bool
    is_verified: bool
    status: UserStatus
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class User(UserInDB):
    """Public user schema (excludes sensitive data)."""
    full_name: str
    
    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr
    password: str


class UserProfile(BaseModel):
    """Schema for user profile response."""
    id: int
    email: str
    username: Optional[str]
    first_name: str
    last_name: str
    full_name: str
    phone: Optional[str]
    role: UserRole
    status: UserStatus
    employee_id: Optional[str]
    department: Optional[str]
    hire_date: Optional[str]
    is_active: bool
    is_verified: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    """Token response schema."""
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserProfile


class PasswordChange(BaseModel):
    """Schema for changing password."""
    current_password: str
    new_password: str
    
    @validator('new_password')
    def validate_new_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v 
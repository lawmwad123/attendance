from pydantic import BaseModel, validator
from typing import Optional
from datetime import datetime


class SchoolBase(BaseModel):
    """Base school schema."""
    name: str
    slug: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    principal_name: Optional[str] = None
    timezone: str = "UTC"
    school_start_time: str = "08:00"
    school_end_time: str = "15:00"
    
    @validator('slug')
    def validate_slug(cls, v):
        import re
        if not re.match(r'^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$', v.lower()):
            raise ValueError('Slug must contain only lowercase letters, numbers, and hyphens')
        if len(v) < 2 or len(v) > 50:
            raise ValueError('Slug must be between 2 and 50 characters')
        return v.lower()
    
    @validator('school_start_time', 'school_end_time')
    def validate_time_format(cls, v):
        import re
        if not re.match(r'^([01]?[0-9]|2[0-3]):[0-5][0-9]$', v):
            raise ValueError('Time must be in HH:MM format')
        return v


class SchoolCreate(SchoolBase):
    """Schema for creating a school."""
    admin_email: str
    admin_password: str
    admin_first_name: str
    admin_last_name: str
    admin_phone: Optional[str] = None


class SchoolUpdate(BaseModel):
    """Schema for updating a school."""
    name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    principal_name: Optional[str] = None
    timezone: Optional[str] = None
    school_start_time: Optional[str] = None
    school_end_time: Optional[str] = None
    is_active: Optional[bool] = None


class SchoolInDB(SchoolBase):
    """Schema for school in database."""
    id: int
    total_students: int
    total_teachers: int
    is_active: bool
    subscription_plan: str
    subscription_expires_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class School(SchoolInDB):
    """Public school schema."""
    
    class Config:
        from_attributes = True


class SchoolStats(BaseModel):
    """Schema for school statistics."""
    total_students: int
    total_teachers: int
    total_staff: int
    active_students: int
    present_today: int
    absent_today: int
    pending_gate_passes: int
    
    class Config:
        from_attributes = True 
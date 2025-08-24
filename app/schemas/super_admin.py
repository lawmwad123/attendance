from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

from app.models.super_admin import (
    SuperAdminRole, SuperAdminStatus, SystemLogLevel, 
    SupportTicketStatus, SupportTicketPriority
)


# Super Admin Schemas
class SuperAdminBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=100)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = None
    role: SuperAdminRole = SuperAdminRole.SUPPORT_AGENT
    bio: Optional[str] = None


class SuperAdminCreate(SuperAdminBase):
    password: str = Field(..., min_length=8)


class SuperAdminUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = Field(None, min_length=3, max_length=100)
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = None
    role: Optional[SuperAdminRole] = None
    status: Optional[SuperAdminStatus] = None
    bio: Optional[str] = None
    is_active: Optional[bool] = None


class SuperAdminResponse(SuperAdminBase):
    id: int
    status: SuperAdminStatus
    is_active: bool
    is_verified: bool
    two_factor_enabled: bool
    last_login: Optional[datetime] = None
    profile_image: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SuperAdminLogin(BaseModel):
    email: EmailStr
    password: str


class SuperAdminLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    admin: SuperAdminResponse


# System Log Schemas
class SystemLogBase(BaseModel):
    level: SystemLogLevel = SystemLogLevel.INFO
    message: str
    details: Optional[Dict[str, Any]] = None


class SystemLogCreate(SystemLogBase):
    school_id: Optional[int] = None
    user_id: Optional[int] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None


class SystemLogResponse(SystemLogBase):
    id: int
    admin_id: Optional[int] = None
    school_id: Optional[int] = None
    user_id: Optional[int] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Support Ticket Schemas
class SupportTicketBase(BaseModel):
    subject: str = Field(..., min_length=1, max_length=255)
    description: str = Field(..., min_length=1)
    priority: SupportTicketPriority = SupportTicketPriority.MEDIUM
    contact_email: EmailStr
    contact_phone: Optional[str] = None


class SupportTicketCreate(SupportTicketBase):
    school_id: int
    school_name: str


class SupportTicketUpdate(BaseModel):
    subject: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, min_length=1)
    priority: Optional[SupportTicketPriority] = None
    status: Optional[SupportTicketStatus] = None
    assigned_admin_id: Optional[int] = None
    resolution: Optional[str] = None


class SupportTicketResponse(SupportTicketBase):
    id: int
    ticket_number: str
    status: SupportTicketStatus
    school_id: int
    school_name: str
    assigned_admin_id: Optional[int] = None
    assigned_at: Optional[datetime] = None
    resolution: Optional[str] = None
    resolved_at: Optional[datetime] = None
    resolution_time_hours: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Admin Action Log Schemas
class AdminActionLogBase(BaseModel):
    action: str
    resource_type: str
    resource_id: Optional[int] = None
    details: Optional[Dict[str, Any]] = None


class AdminActionLogCreate(AdminActionLogBase):
    admin_id: int
    admin_email: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None


class AdminActionLogResponse(AdminActionLogBase):
    id: int
    admin_id: int
    admin_email: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# System Configuration Schemas
class SystemConfigurationBase(BaseModel):
    key: str = Field(..., min_length=1, max_length=100)
    value: str
    description: Optional[str] = None
    is_public: bool = False
    data_type: str = "string"
    category: str


class SystemConfigurationCreate(SystemConfigurationBase):
    pass


class SystemConfigurationUpdate(BaseModel):
    value: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None
    data_type: Optional[str] = None
    category: Optional[str] = None


class SystemConfigurationResponse(SystemConfigurationBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# System Announcement Schemas
class SystemAnnouncementBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    content: str = Field(..., min_length=1)
    is_active: bool = True
    target_schools: Optional[List[int]] = None
    target_roles: Optional[List[str]] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class SystemAnnouncementCreate(SystemAnnouncementBase):
    created_by_admin_id: int


class SystemAnnouncementUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    content: Optional[str] = Field(None, min_length=1)
    is_active: Optional[bool] = None
    target_schools: Optional[List[int]] = None
    target_roles: Optional[List[str]] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class SystemAnnouncementResponse(SystemAnnouncementBase):
    id: int
    created_by_admin_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Feature Flag Schemas
class FeatureFlagBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    is_enabled: bool = False
    target_schools: Optional[List[int]] = None
    target_percentage: int = Field(100, ge=0, le=100)
    category: str


class FeatureFlagCreate(FeatureFlagBase):
    pass


class FeatureFlagUpdate(BaseModel):
    description: Optional[str] = None
    is_enabled: Optional[bool] = None
    target_schools: Optional[List[int]] = None
    target_percentage: Optional[int] = Field(None, ge=0, le=100)
    category: Optional[str] = None


class FeatureFlagResponse(FeatureFlagBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Dashboard and Analytics Schemas
class SystemStats(BaseModel):
    total_schools: int
    active_schools: int
    total_users: int
    active_users: int
    total_students: int
    active_students: int
    total_support_tickets: int
    open_support_tickets: int
    system_uptime_hours: float
    storage_used_gb: float
    storage_total_gb: float


class SchoolSummary(BaseModel):
    id: int
    name: str
    slug: str
    total_students: int
    total_teachers: int
    is_active: bool
    subscription_plan: str
    subscription_expires_at: Optional[datetime] = None
    last_activity: Optional[datetime] = None
    created_at: datetime


class SystemHealth(BaseModel):
    database_status: str
    redis_status: str
    storage_status: str
    api_response_time_ms: float
    error_rate_percentage: float
    active_connections: int

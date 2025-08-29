from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime, date
from enum import Enum

from app.models.visitor import (
    VisitorStatus, VisitorType, VisitorApprovalWorkflow
)


# Base Schemas
class VisitorBase(BaseModel):
    """Base visitor schema."""
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    phone: str = Field(..., min_length=10, max_length=20)
    id_type: Optional[str] = None
    id_number: Optional[str] = None
    visitor_type: VisitorType = VisitorType.GUEST
    purpose: str = Field(..., min_length=1, max_length=500)
    host_user_id: Optional[int] = None
    host_student_id: Optional[int] = None
    requested_entry_time: datetime
    expected_exit_time: Optional[datetime] = None
    vehicle_number: Optional[str] = None
    company_name: Optional[str] = None
    emergency_contact: Optional[str] = None
    special_instructions: Optional[str] = None


class VisitorCreate(VisitorBase):
    """Schema for creating a visitor."""
    pass


class VisitorUpdate(BaseModel):
    """Schema for updating a visitor."""
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, min_length=10, max_length=20)
    id_type: Optional[str] = None
    id_number: Optional[str] = None
    visitor_type: Optional[VisitorType] = None
    purpose: Optional[str] = Field(None, min_length=1, max_length=500)
    host_user_id: Optional[int] = None
    host_student_id: Optional[int] = None
    requested_entry_time: Optional[datetime] = None
    expected_exit_time: Optional[datetime] = None
    vehicle_number: Optional[str] = None
    company_name: Optional[str] = None
    emergency_contact: Optional[str] = None
    special_instructions: Optional[str] = None


class VisitorResponse(VisitorBase):
    """Schema for visitor response."""
    id: int
    school_id: int
    status: VisitorStatus
    qr_code: Optional[str] = None
    temp_rfid_card: Optional[str] = None
    badge_number: Optional[str] = None
    is_blacklisted: bool
    blacklist_reason: Optional[str] = None
    security_notes: Optional[str] = None
    entry_gate: Optional[str] = None
    exit_gate: Optional[str] = None
    entry_verified: bool
    exit_verified: bool
    host_notified: bool
    parent_notified: bool
    is_pre_registered: bool
    actual_entry_time: Optional[datetime] = None
    actual_exit_time: Optional[datetime] = None
    approved_by_user_id: Optional[int] = None
    approved_at: Optional[datetime] = None
    approval_notes: Optional[str] = None
    entry_security_guard_id: Optional[int] = None
    exit_security_guard_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    
    # Computed properties
    full_name: str
    is_overdue: bool
    visit_duration_minutes: Optional[int] = None
    
    # Related data
    host_user_name: Optional[str] = None
    host_student_name: Optional[str] = None
    approved_by_name: Optional[str] = None
    entry_guard_name: Optional[str] = None
    exit_guard_name: Optional[str] = None
    
    class Config:
        from_attributes = True


# Pre-registration Schemas
class VisitorPreRegistration(BaseModel):
    """Schema for pre-registering a visitor."""
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    phone: str = Field(..., min_length=10, max_length=20)
    visitor_type: VisitorType = VisitorType.GUEST
    purpose: str = Field(..., min_length=1, max_length=500)
    host_user_id: Optional[int] = None
    host_student_id: Optional[int] = None
    requested_entry_time: datetime
    expected_exit_time: Optional[datetime] = None
    vehicle_number: Optional[str] = None
    company_name: Optional[str] = None
    emergency_contact: Optional[str] = None
    special_instructions: Optional[str] = None


# Check-in/Check-out Schemas
class VisitorCheckIn(BaseModel):
    """Schema for visitor check-in."""
    visitor_id: int
    entry_gate: str = Field(..., min_length=1, max_length=100)
    security_guard_id: int
    notes: Optional[str] = None


class VisitorCheckOut(BaseModel):
    """Schema for visitor check-out."""
    visitor_id: int
    exit_gate: str = Field(..., min_length=1, max_length=100)
    security_guard_id: int
    notes: Optional[str] = None


# Approval Schemas
class VisitorApproval(BaseModel):
    """Schema for visitor approval."""
    visitor_id: int
    approved_by_user_id: int
    approval_notes: Optional[str] = None


class VisitorDenial(BaseModel):
    """Schema for visitor denial."""
    visitor_id: int
    denied_by_user_id: int
    denial_reason: str = Field(..., min_length=1, max_length=500)


# Blacklist Schemas
class VisitorBlacklistBase(BaseModel):
    """Base blacklist schema."""
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = Field(None, min_length=10, max_length=20)
    email: Optional[EmailStr] = None
    id_number: Optional[str] = None
    id_type: Optional[str] = None
    reason: str = Field(..., min_length=1, max_length=500)
    expires_at: Optional[datetime] = None
    notes: Optional[str] = None


class VisitorBlacklistCreate(VisitorBlacklistBase):
    """Schema for creating a blacklist entry."""
    pass


class VisitorBlacklistUpdate(BaseModel):
    """Schema for updating a blacklist entry."""
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, min_length=10, max_length=20)
    email: Optional[EmailStr] = None
    id_number: Optional[str] = None
    id_type: Optional[str] = None
    reason: Optional[str] = Field(None, min_length=1, max_length=500)
    expires_at: Optional[datetime] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class VisitorBlacklistResponse(VisitorBlacklistBase):
    """Schema for blacklist response."""
    id: int
    school_id: int
    blacklisted_by_user_id: int
    blacklisted_at: datetime
    is_active: bool
    photo_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    # Computed properties
    full_name: str
    is_expired: bool
    
    # Related data
    blacklisted_by_name: Optional[str] = None
    
    class Config:
        from_attributes = True


# Settings Schemas
class VisitorSettingsBase(BaseModel):
    """Base visitor settings schema."""
    visiting_hours_start: str = "09:00"
    visiting_hours_end: str = "16:00"
    max_visit_duration_hours: int = Field(2, ge=1, le=24)
    auto_checkout_after_hours: int = Field(4, ge=1, le=24)
    approval_workflow: VisitorApprovalWorkflow = VisitorApprovalWorkflow.HOST_APPROVE
    auto_approve_parent_visits: bool = True
    require_id_verification: bool = True
    notify_host_on_arrival: bool = True
    notify_parent_on_visitor: bool = True
    notify_security_on_overstay: bool = True
    notify_admin_on_blacklisted: bool = True
    print_visitor_badges: bool = True
    badge_expiry_hours: int = Field(8, ge=1, le=24)
    require_photo_capture: bool = False
    enable_blacklist: bool = True
    enable_emergency_evacuation: bool = True
    require_vehicle_registration: bool = False
    integrate_with_gate_pass: bool = True
    enable_qr_codes: bool = True
    enable_temp_rfid: bool = False
    allow_pre_registration: bool = True
    pre_registration_hours_ahead: int = Field(24, ge=1, le=168)
    auto_approve_pre_registered: bool = False
    daily_visitor_reports: bool = True
    weekly_visitor_analytics: bool = True
    security_alert_reports: bool = True


class VisitorSettingsCreate(VisitorSettingsBase):
    """Schema for creating visitor settings."""
    pass


class VisitorSettingsUpdate(BaseModel):
    """Schema for updating visitor settings."""
    visiting_hours_start: Optional[str] = None
    visiting_hours_end: Optional[str] = None
    max_visit_duration_hours: Optional[int] = Field(None, ge=1, le=24)
    auto_checkout_after_hours: Optional[int] = Field(None, ge=1, le=24)
    approval_workflow: Optional[VisitorApprovalWorkflow] = None
    auto_approve_parent_visits: Optional[bool] = None
    require_id_verification: Optional[bool] = None
    notify_host_on_arrival: Optional[bool] = None
    notify_parent_on_visitor: Optional[bool] = None
    notify_security_on_overstay: Optional[bool] = None
    notify_admin_on_blacklisted: Optional[bool] = None
    print_visitor_badges: Optional[bool] = None
    badge_expiry_hours: Optional[int] = Field(None, ge=1, le=24)
    require_photo_capture: Optional[bool] = None
    enable_blacklist: Optional[bool] = None
    enable_emergency_evacuation: Optional[bool] = None
    require_vehicle_registration: Optional[bool] = None
    integrate_with_gate_pass: Optional[bool] = None
    enable_qr_codes: Optional[bool] = None
    enable_temp_rfid: Optional[bool] = None
    allow_pre_registration: Optional[bool] = None
    pre_registration_hours_ahead: Optional[int] = Field(None, ge=1, le=168)
    auto_approve_pre_registered: Optional[bool] = None
    daily_visitor_reports: Optional[bool] = None
    weekly_visitor_analytics: Optional[bool] = None
    security_alert_reports: Optional[bool] = None


class VisitorSettingsResponse(VisitorSettingsBase):
    """Schema for visitor settings response."""
    id: int
    school_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Log Schemas
class VisitorLogBase(BaseModel):
    """Base visitor log schema."""
    visitor_id: int
    action: str = Field(..., min_length=1, max_length=50)
    performed_by_user_id: int
    notes: Optional[str] = None
    device_info: Optional[str] = None
    location_info: Optional[str] = None
    ip_address: Optional[str] = None


class VisitorLogCreate(VisitorLogBase):
    """Schema for creating a visitor log."""
    pass


class VisitorLogResponse(VisitorLogBase):
    """Schema for visitor log response."""
    id: int
    school_id: int
    performed_at: datetime
    created_at: datetime
    
    # Related data
    visitor_name: Optional[str] = None
    performed_by_name: Optional[str] = None
    
    class Config:
        from_attributes = True


# Analytics and Reports
class VisitorAnalytics(BaseModel):
    """Schema for visitor analytics."""
    total_visitors_today: int
    total_visitors_this_week: int
    total_visitors_this_month: int
    visitors_checked_in: int
    visitors_overdue: int
    blacklisted_attempts: int
    popular_visitor_types: List[dict]
    peak_visiting_hours: List[dict]
    average_visit_duration: float


class VisitorReport(BaseModel):
    """Schema for visitor report."""
    date: date
    total_visitors: int
    visitors_by_type: dict
    visitors_by_status: dict
    average_visit_duration: float
    security_incidents: int
    blacklisted_attempts: int


# QR Code and Badge Schemas
class VisitorQRCode(BaseModel):
    """Schema for visitor QR code."""
    visitor_id: int
    qr_code: str
    expires_at: datetime
    is_valid: bool


class VisitorBadge(BaseModel):
    """Schema for visitor badge."""
    visitor_id: int
    badge_number: str
    visitor_name: str
    visitor_type: str
    purpose: str
    host_name: Optional[str] = None
    entry_time: datetime
    expected_exit_time: Optional[datetime] = None
    qr_code: str
    photo_url: Optional[str] = None


# Emergency Evacuation
class EmergencyEvacuation(BaseModel):
    """Schema for emergency evacuation list."""
    visitors_inside: List[VisitorResponse]
    total_visitors: int
    evacuation_time: datetime
    security_contact: str
    emergency_contact: str


# Search and Filter Schemas
class VisitorSearchParams(BaseModel):
    """Schema for visitor search parameters."""
    search: Optional[str] = None
    visitor_type: Optional[VisitorType] = None
    status: Optional[VisitorStatus] = None
    host_user_id: Optional[int] = None
    host_student_id: Optional[int] = None
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    is_blacklisted: Optional[bool] = None
    is_overdue: Optional[bool] = None
    skip: int = 0
    limit: int = 100

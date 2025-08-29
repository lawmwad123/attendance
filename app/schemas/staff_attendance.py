from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import date, datetime, time
from enum import Enum

from app.models.staff_attendance import (
    StaffAttendanceStatus, StaffAttendanceMethod, LeaveType, 
    LeaveStatus, EmploymentType
)


# Base Schemas
class StaffAttendanceBase(BaseModel):
    """Base schema for staff attendance."""
    attendance_date: date
    status: StaffAttendanceStatus = StaffAttendanceStatus.PRESENT
    method: StaffAttendanceMethod = StaffAttendanceMethod.MANUAL
    notes: Optional[str] = None
    device_id: Optional[str] = None
    location: Optional[str] = None


class StaffLeaveBase(BaseModel):
    """Base schema for staff leave requests."""
    leave_type: LeaveType
    start_date: date
    end_date: date
    reason: str = Field(..., min_length=10, max_length=1000)
    emergency_contact: Optional[str] = None
    emergency_phone: Optional[str] = None


class StaffScheduleBase(BaseModel):
    """Base schema for staff work schedule."""
    day_of_week: int = Field(..., ge=0, le=6)  # 0=Monday, 6=Sunday
    start_time: time
    end_time: time
    break_start: Optional[time] = None
    break_end: Optional[time] = None
    is_working_day: bool = True
    is_flexible: bool = False
    notes: Optional[str] = None


# Create Schemas
class StaffAttendanceCreate(StaffAttendanceBase):
    """Schema for creating staff attendance."""
    staff_id: int
    expected_check_in: Optional[time] = None
    expected_check_out: Optional[time] = None
    actual_check_in: Optional[datetime] = None
    actual_check_out: Optional[datetime] = None


class StaffLeaveCreate(StaffLeaveBase):
    """Schema for creating staff leave request."""
    pass


class StaffScheduleCreate(StaffScheduleBase):
    """Schema for creating staff work schedule."""
    staff_id: int


# Update Schemas
class StaffAttendanceUpdate(BaseModel):
    """Schema for updating staff attendance."""
    status: Optional[StaffAttendanceStatus] = None
    actual_check_in: Optional[datetime] = None
    actual_check_out: Optional[datetime] = None
    notes: Optional[str] = None
    overtime_hours: Optional[int] = None


class StaffLeaveUpdate(BaseModel):
    """Schema for updating staff leave request."""
    status: Optional[LeaveStatus] = None
    rejection_reason: Optional[str] = None
    notes: Optional[str] = None


class StaffScheduleUpdate(StaffScheduleBase):
    """Schema for updating staff work schedule."""
    pass


# Response Schemas
class StaffAttendanceResponse(StaffAttendanceBase):
    """Schema for staff attendance response."""
    id: int
    staff_id: int
    expected_check_in: Optional[time] = None
    expected_check_out: Optional[time] = None
    actual_check_in: Optional[datetime] = None
    actual_check_out: Optional[datetime] = None
    minutes_late: int = 0
    minutes_early_departure: int = 0
    overtime_hours: int = 0
    is_verified: bool = True
    verification_method: Optional[str] = None
    marked_at: datetime
    marked_by_user_id: Optional[int] = None
    
    # Staff information
    staff_name: Optional[str] = None
    staff_email: Optional[str] = None
    staff_role: Optional[str] = None
    
    class Config:
        from_attributes = True


class StaffLeaveResponse(StaffLeaveBase):
    """Schema for staff leave response."""
    id: int
    staff_id: int
    status: LeaveStatus
    total_days: int
    requested_at: datetime
    approved_by_user_id: Optional[int] = None
    approved_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    notes: Optional[str] = None
    documents: Optional[str] = None
    
    # Staff information
    staff_name: Optional[str] = None
    staff_email: Optional[str] = None
    approved_by_name: Optional[str] = None
    
    class Config:
        from_attributes = True


class StaffScheduleResponse(StaffScheduleBase):
    """Schema for staff schedule response."""
    id: int
    staff_id: int
    
    # Staff information
    staff_name: Optional[str] = None
    staff_email: Optional[str] = None
    
    class Config:
        from_attributes = True


class StaffAttendanceSummaryResponse(BaseModel):
    """Schema for staff attendance summary response."""
    id: int
    staff_id: int
    month: str
    year: int
    total_working_days: int
    present_days: int
    absent_days: int
    late_days: int
    half_days: int
    leave_days: int
    total_hours_worked: int
    total_overtime_hours: int
    average_check_in_time: Optional[time] = None
    average_check_out_time: Optional[time] = None
    attendance_percentage: int
    punctuality_score: int
    
    # Staff information
    staff_name: Optional[str] = None
    staff_email: Optional[str] = None
    
    class Config:
        from_attributes = True


# Dashboard and Analytics Schemas
class StaffAttendanceDashboard(BaseModel):
    """Schema for staff attendance dashboard data."""
    today_attendance: List[StaffAttendanceResponse]
    pending_leaves: List[StaffLeaveResponse]
    recent_attendance: List[StaffAttendanceResponse]
    attendance_stats: Dict[str, Any]


class StaffAttendanceReport(BaseModel):
    """Schema for staff attendance report."""
    staff_id: int
    staff_name: str
    period: str  # e.g., "2024-01" for January 2024
    total_days: int
    present_days: int
    absent_days: int
    late_days: int
    attendance_percentage: float
    average_check_in_time: Optional[str] = None
    average_check_out_time: Optional[str] = None
    total_overtime_hours: float


class StaffLeaveReport(BaseModel):
    """Schema for staff leave report."""
    staff_id: int
    staff_name: str
    leave_type: LeaveType
    total_days: int
    status: LeaveStatus
    start_date: date
    end_date: date
    reason: str


# Clock In/Out Schemas
class StaffClockInRequest(BaseModel):
    """Schema for staff clock-in request."""
    staff_id: int
    method: StaffAttendanceMethod = StaffAttendanceMethod.WEB_PORTAL
    device_id: Optional[str] = None
    location: Optional[str] = None
    notes: Optional[str] = None


class StaffClockOutRequest(BaseModel):
    """Schema for staff clock-out request."""
    staff_id: int
    method: StaffAttendanceMethod = StaffAttendanceMethod.WEB_PORTAL
    device_id: Optional[str] = None
    location: Optional[str] = None
    notes: Optional[str] = None
    overtime_hours: Optional[int] = None


class StaffClockResponse(BaseModel):
    """Schema for staff clock in/out response."""
    success: bool
    message: str
    attendance_id: Optional[int] = None
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    minutes_late: Optional[int] = None
    overtime_hours: Optional[int] = None


# Bulk Operations
class BulkStaffAttendanceCreate(BaseModel):
    """Schema for bulk staff attendance creation."""
    attendance_records: List[StaffAttendanceCreate]


class BulkStaffScheduleCreate(BaseModel):
    """Schema for bulk staff schedule creation."""
    schedule_records: List[StaffScheduleCreate]


# Filters and Queries
class StaffAttendanceFilter(BaseModel):
    """Schema for filtering staff attendance."""
    staff_id: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[StaffAttendanceStatus] = None
    method: Optional[StaffAttendanceMethod] = None


class StaffLeaveFilter(BaseModel):
    """Schema for filtering staff leave requests."""
    staff_id: Optional[int] = None
    leave_type: Optional[LeaveType] = None
    status: Optional[LeaveStatus] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class StaffScheduleFilter(BaseModel):
    """Schema for filtering staff schedules."""
    staff_id: Optional[int] = None
    day_of_week: Optional[int] = None
    is_working_day: Optional[bool] = None

from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Date, Text, Enum as SQLEnum, Time
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum
from datetime import datetime, time

from app.models.base import TenantBaseModel


class StaffAttendanceStatus(str, Enum):
    """Staff attendance status options."""
    PRESENT = "present"
    ABSENT = "absent"
    LATE = "late"
    HALF_DAY = "half_day"  # Left early or came late
    ON_LEAVE = "on_leave"  # Approved leave
    SICK_LEAVE = "sick_leave"
    PERSONAL_LEAVE = "personal_leave"
    HOLIDAY = "holiday"


class StaffAttendanceMethod(str, Enum):
    """Methods of marking staff attendance."""
    MANUAL = "manual"           # Manually marked by admin
    BIOMETRIC = "biometric"     # Fingerprint/face recognition
    RFID = "rfid"              # RFID card scan
    QR_CODE = "qr_code"        # QR code scan
    MOBILE_APP = "mobile_app"   # Via mobile app
    WEB_PORTAL = "web_portal"   # Via web dashboard


class LeaveType(str, Enum):
    """Types of leave that staff can request."""
    SICK_LEAVE = "sick_leave"
    PERSONAL_LEAVE = "personal_leave"
    ANNUAL_LEAVE = "annual_leave"
    MATERNITY_LEAVE = "maternity_leave"
    PATERNITY_LEAVE = "paternity_leave"
    EMERGENCY_LEAVE = "emergency_leave"
    OTHER = "other"


class LeaveStatus(str, Enum):
    """Leave request status."""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


class EmploymentType(str, Enum):
    """Employment types for staff."""
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACT = "contract"
    TEMPORARY = "temporary"
    INTERN = "intern"


class StaffAttendance(TenantBaseModel):
    """
    Staff attendance model for tracking teacher and staff attendance.
    """
    __tablename__ = "staff_attendance"
    
    # Staff and Date
    staff_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    attendance_date = Column(Date, nullable=False, index=True)
    
    # Attendance Details
    status = Column(SQLEnum(StaffAttendanceStatus), nullable=False, default=StaffAttendanceStatus.PRESENT)
    method = Column(SQLEnum(StaffAttendanceMethod), nullable=False, default=StaffAttendanceMethod.MANUAL)
    
    # Timing Information
    expected_check_in = Column(Time, nullable=True)  # Expected check-in time
    expected_check_out = Column(Time, nullable=True)  # Expected check-out time
    actual_check_in = Column(DateTime(timezone=True), nullable=True)
    actual_check_out = Column(DateTime(timezone=True), nullable=True)
    marked_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Late/Early Information
    minutes_late = Column(Integer, default=0)  # Minutes late for check-in
    minutes_early_departure = Column(Integer, default=0)  # Minutes early departure
    
    # Additional Information
    notes = Column(Text, nullable=True)  # Reason for absence, etc.
    marked_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Who marked attendance
    
    # Location/Device Info (for audit)
    device_id = Column(String(100), nullable=True)  # Biometric device ID, etc.
    location = Column(String(200), nullable=True)   # Gate name, classroom, etc.
    
    # Verification
    is_verified = Column(Boolean, default=True)
    verification_method = Column(String(50), nullable=True)  # Photo verification, etc.
    
    # Overtime tracking
    overtime_hours = Column(Integer, default=0)  # Hours worked beyond scheduled time
    
    # Relationships
    staff = relationship("User", foreign_keys=[staff_id], back_populates="staff_attendance")
    marked_by = relationship("User", foreign_keys=[marked_by_user_id])
    
    def __repr__(self):
        return f"<StaffAttendance(staff_id={self.staff_id}, date={self.attendance_date}, status='{self.status}')>"


class StaffLeave(TenantBaseModel):
    """
    Staff leave requests and management.
    """
    __tablename__ = "staff_leave"
    
    # Staff and Leave Details
    staff_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    leave_type = Column(SQLEnum(LeaveType), nullable=False)
    status = Column(SQLEnum(LeaveStatus), nullable=False, default=LeaveStatus.PENDING)
    
    # Date Range
    start_date = Column(Date, nullable=False, index=True)
    end_date = Column(Date, nullable=False, index=True)
    total_days = Column(Integer, nullable=False)  # Calculated total days
    
    # Request Details
    reason = Column(Text, nullable=False)
    emergency_contact = Column(String(255), nullable=True)
    emergency_phone = Column(String(20), nullable=True)
    
    # Approval Information
    requested_at = Column(DateTime(timezone=True), server_default=func.now())
    approved_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    rejection_reason = Column(Text, nullable=True)
    
    # Additional Information
    notes = Column(Text, nullable=True)  # Additional notes from admin
    documents = Column(Text, nullable=True)  # JSON array of document paths (medical certificates, etc.)
    
    # Relationships
    staff = relationship("User", foreign_keys=[staff_id], back_populates="leave_requests")
    approved_by = relationship("User", foreign_keys=[approved_by_user_id])
    
    def __repr__(self):
        return f"<StaffLeave(staff_id={self.staff_id}, type='{self.leave_type}', status='{self.status}')>"


class StaffSchedule(TenantBaseModel):
    """
    Staff work schedule and timetable.
    """
    __tablename__ = "staff_schedule"
    
    # Staff and Schedule Details
    staff_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    day_of_week = Column(Integer, nullable=False, index=True)  # 0=Monday, 6=Sunday
    
    # Work Hours
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    break_start = Column(Time, nullable=True)
    break_end = Column(Time, nullable=True)
    
    # Schedule Type
    is_working_day = Column(Boolean, default=True)
    is_flexible = Column(Boolean, default=False)  # Flexible working hours
    
    # Additional Information
    notes = Column(Text, nullable=True)
    
    # Relationships
    staff = relationship("User", foreign_keys=[staff_id], back_populates="work_schedule")
    
    def __repr__(self):
        return f"<StaffSchedule(staff_id={self.staff_id}, day={self.day_of_week}, time={self.start_time}-{self.end_time})>"


class StaffAttendanceSummary(TenantBaseModel):
    """
    Monthly staff attendance summary for quick reporting.
    """
    __tablename__ = "staff_attendance_summary"
    
    staff_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    month = Column(String(7), nullable=False, index=True)  # YYYY-MM format
    year = Column(Integer, nullable=False)
    
    # Summary Counts
    total_working_days = Column(Integer, default=0)
    present_days = Column(Integer, default=0)
    absent_days = Column(Integer, default=0)
    late_days = Column(Integer, default=0)
    half_days = Column(Integer, default=0)
    leave_days = Column(Integer, default=0)
    
    # Time Tracking
    total_hours_worked = Column(Integer, default=0)  # In minutes
    total_overtime_hours = Column(Integer, default=0)  # In minutes
    average_check_in_time = Column(Time, nullable=True)
    average_check_out_time = Column(Time, nullable=True)
    
    # Calculated Fields
    attendance_percentage = Column(Integer, default=0)  # 0-100
    punctuality_score = Column(Integer, default=0)  # 0-100
    
    # Relationships
    staff = relationship("User")
    
    def __repr__(self):
        return f"<StaffAttendanceSummary(staff_id={self.staff_id}, month='{self.month}', percentage={self.attendance_percentage}%)>"

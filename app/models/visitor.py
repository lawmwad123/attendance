from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum
from datetime import datetime, timedelta

from app.models.base import TenantBaseModel


class VisitorStatus(str, Enum):
    """Visitor status options."""
    PENDING = "pending"        # Awaiting approval
    APPROVED = "approved"      # Approved for entry
    DENIED = "denied"         # Denied entry
    CHECKED_IN = "checked_in"  # Currently in school
    CHECKED_OUT = "checked_out"  # Left school
    EXPIRED = "expired"       # Pass expired
    CANCELLED = "cancelled"   # Cancelled by requester


class VisitorType(str, Enum):
    """Types of visitors."""
    PARENT_GUARDIAN = "parent_guardian"  # Parent picking up child
    GUEST_SPEAKER = "guest_speaker"      # Guest speaker/lecturer
    CONTRACTOR = "contractor"           # Maintenance/contractor
    SUPPLIER = "supplier"              # Vendor/supplier
    GUEST = "guest"                   # General guest
    EMERGENCY = "emergency"           # Emergency contact
    OTHER = "other"                  # Other


class VisitorApprovalWorkflow(str, Enum):
    """Visitor approval workflows."""
    AUTO_APPROVE = "auto_approve"           # No approval needed
    HOST_APPROVE = "host_approve"          # Host (teacher/staff) approves
    ADMIN_APPROVE = "admin_approve"        # Admin approval required
    BOTH_APPROVE = "both_approve"          # Both host and admin approve


class Visitor(TenantBaseModel):
    """
    Visitor model for managing school visitors.
    """
    __tablename__ = "visitors"
    
    # Basic Information
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=False)
    
    # Identification
    id_type = Column(String(50), nullable=True)  # passport, national_id, driving_license, etc.
    id_number = Column(String(100), nullable=True)
    id_photo_url = Column(String(500), nullable=True)  # Path to scanned ID
    
    # Visit Details
    visitor_type = Column(SQLEnum(VisitorType), nullable=False, default=VisitorType.GUEST)
    purpose = Column(Text, nullable=False)
    host_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Staff hosting visitor
    host_student_id = Column(Integer, ForeignKey("students.id"), nullable=True)  # Student being visited
    
    # Timing
    requested_entry_time = Column(DateTime(timezone=True), nullable=False)
    expected_exit_time = Column(DateTime(timezone=True), nullable=True)
    actual_entry_time = Column(DateTime(timezone=True), nullable=True)
    actual_exit_time = Column(DateTime(timezone=True), nullable=True)
    
    # Status and Approval
    status = Column(SQLEnum(VisitorStatus), nullable=False, default=VisitorStatus.PENDING)
    approved_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    approval_notes = Column(Text, nullable=True)
    
    # Access Control
    qr_code = Column(String(255), nullable=True, unique=True, index=True)  # QR code for entry
    temp_rfid_card = Column(String(100), nullable=True, unique=True, index=True)  # Temporary RFID card
    badge_number = Column(String(50), nullable=True, unique=True, index=True)  # Visitor badge number
    
    # Security
    is_blacklisted = Column(Boolean, default=False)
    blacklist_reason = Column(Text, nullable=True)
    security_notes = Column(Text, nullable=True)  # For security staff use
    
    # Entry/Exit Information
    entry_gate = Column(String(100), nullable=True)
    exit_gate = Column(String(100), nullable=True)
    entry_security_guard_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    exit_security_guard_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Verification
    entry_verified = Column(Boolean, default=False)
    exit_verified = Column(Boolean, default=False)
    
    # Notifications
    host_notified = Column(Boolean, default=False)
    host_notification_sent_at = Column(DateTime(timezone=True), nullable=True)
    parent_notified = Column(Boolean, default=False)  # If visiting a student
    parent_notification_sent_at = Column(DateTime(timezone=True), nullable=True)
    
    # Additional Information
    vehicle_number = Column(String(20), nullable=True)
    company_name = Column(String(200), nullable=True)  # For contractors/suppliers
    emergency_contact = Column(String(20), nullable=True)
    special_instructions = Column(Text, nullable=True)
    
    # Pre-registration
    is_pre_registered = Column(Boolean, default=False)
    pre_registered_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    pre_registration_date = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    host_user = relationship("User", foreign_keys=[host_user_id])
    host_student = relationship("Student", foreign_keys=[host_student_id])
    approved_by = relationship("User", foreign_keys=[approved_by_user_id])
    entry_guard = relationship("User", foreign_keys=[entry_security_guard_id])
    exit_guard = relationship("User", foreign_keys=[exit_security_guard_id])
    pre_registered_by = relationship("User", foreign_keys=[pre_registered_by_user_id])
    visitor_logs = relationship("VisitorLog", back_populates="visitor")
    
    @property
    def full_name(self):
        """Get visitor's full name."""
        return f"{self.first_name} {self.last_name}"
    
    @property
    def is_overdue(self):
        """Check if visitor is overdue for exit."""
        if self.status == VisitorStatus.CHECKED_IN and self.expected_exit_time:
            return datetime.now() > self.expected_exit_time
        return False
    
    @property
    def visit_duration_minutes(self):
        """Calculate visit duration in minutes."""
        if self.actual_entry_time and self.actual_exit_time:
            return int((self.actual_exit_time - self.actual_entry_time).total_seconds() / 60)
        return None
    
    def __repr__(self):
        return f"<Visitor(name='{self.full_name}', type='{self.visitor_type}', status='{self.status}')>"


class VisitorLog(TenantBaseModel):
    """
    Log of all visitor activities for audit trail.
    """
    __tablename__ = "visitor_logs"
    
    visitor_id = Column(Integer, ForeignKey("visitors.id"), nullable=False, index=True)
    action = Column(String(50), nullable=False)  # REGISTERED, APPROVED, DENIED, CHECKED_IN, CHECKED_OUT, etc.
    performed_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    performed_at = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(Text, nullable=True)
    
    # Device/Location info for security
    device_info = Column(Text, nullable=True)
    location_info = Column(String(200), nullable=True)
    ip_address = Column(String(45), nullable=True)
    
    # Relationships
    visitor = relationship("Visitor", back_populates="visitor_logs")
    performed_by = relationship("User", foreign_keys=[performed_by_user_id])
    
    def __repr__(self):
        return f"<VisitorLog(visitor_id={self.visitor_id}, action='{self.action}')>"


class VisitorBlacklist(TenantBaseModel):
    """
    Blacklisted visitors for security.
    """
    __tablename__ = "visitor_blacklist"
    
    # Identification
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True)
    id_number = Column(String(100), nullable=True)
    id_type = Column(String(50), nullable=True)
    
    # Blacklist Details
    reason = Column(Text, nullable=False)
    blacklisted_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    blacklisted_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)  # None = permanent
    is_active = Column(Boolean, default=True)
    
    # Additional Information
    notes = Column(Text, nullable=True)
    photo_url = Column(String(500), nullable=True)
    
    # Relationships
    blacklisted_by = relationship("User", foreign_keys=[blacklisted_by_user_id])
    
    @property
    def full_name(self):
        """Get blacklisted person's full name."""
        return f"{self.first_name} {self.last_name}"
    
    @property
    def is_expired(self):
        """Check if blacklist entry has expired."""
        if self.expires_at:
            return datetime.now() > self.expires_at
        return False
    
    def __repr__(self):
        return f"<VisitorBlacklist(name='{self.full_name}', reason='{self.reason}')>"


class VisitorSettings(TenantBaseModel):
    """
    Visitor management settings for each school.
    """
    __tablename__ = "visitor_settings"
    
    # Visiting Hours
    visiting_hours_start = Column(String(10), default="09:00")  # HH:MM format
    visiting_hours_end = Column(String(10), default="16:00")    # HH:MM format
    
    # Duration Limits
    max_visit_duration_hours = Column(Integer, default=2)
    auto_checkout_after_hours = Column(Integer, default=4)  # Auto checkout if overstaying
    
    # Approval Settings
    approval_workflow = Column(SQLEnum(VisitorApprovalWorkflow), default=VisitorApprovalWorkflow.HOST_APPROVE)
    auto_approve_parent_visits = Column(Boolean, default=True)
    require_id_verification = Column(Boolean, default=True)
    
    # Notification Settings
    notify_host_on_arrival = Column(Boolean, default=True)
    notify_parent_on_visitor = Column(Boolean, default=True)  # If visitor wants to see student
    notify_security_on_overstay = Column(Boolean, default=True)
    notify_admin_on_blacklisted = Column(Boolean, default=True)
    
    # Badge Settings
    print_visitor_badges = Column(Boolean, default=True)
    badge_expiry_hours = Column(Integer, default=8)
    require_photo_capture = Column(Boolean, default=False)
    
    # Security Settings
    enable_blacklist = Column(Boolean, default=True)
    enable_emergency_evacuation = Column(Boolean, default=True)
    require_vehicle_registration = Column(Boolean, default=False)
    
    # Integration Settings
    integrate_with_gate_pass = Column(Boolean, default=True)  # Link visitor entry with student gate pass
    enable_qr_codes = Column(Boolean, default=True)
    enable_temp_rfid = Column(Boolean, default=False)
    
    # Pre-registration Settings
    allow_pre_registration = Column(Boolean, default=True)
    pre_registration_hours_ahead = Column(Integer, default=24)
    auto_approve_pre_registered = Column(Boolean, default=False)
    
    # Reporting Settings
    daily_visitor_reports = Column(Boolean, default=True)
    weekly_visitor_analytics = Column(Boolean, default=True)
    security_alert_reports = Column(Boolean, default=True)
    
    def __repr__(self):
        return f"<VisitorSettings(school_id={self.school_id})>"

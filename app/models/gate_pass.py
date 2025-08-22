from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum

from app.models.base import TenantBaseModel


class GatePassStatus(str, Enum):
    """Gate pass status options."""
    PENDING = "pending"        # Awaiting approval
    APPROVED = "approved"      # Approved by parent/admin
    DENIED = "denied"         # Denied by parent/admin
    ACTIVE = "active"         # Student has exited
    COMPLETED = "completed"   # Student has returned
    EXPIRED = "expired"       # Pass expired without use
    CANCELLED = "cancelled"   # Cancelled by requester


class GatePassType(str, Enum):
    """Types of gate passes."""
    EMERGENCY = "emergency"           # Emergency exit
    MEDICAL = "medical"              # Medical appointment
    EARLY_DISMISSAL = "early_dismissal"  # Early dismissal
    PARENT_PICKUP = "parent_pickup"   # Parent picking up
    FIELD_TRIP = "field_trip"        # Field trip
    OTHER = "other"                  # Other reason


class GatePass(TenantBaseModel):
    """
    Gate pass model for tracking student exits and entries.
    """
    __tablename__ = "gate_passes"
    
    # Basic Information
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    pass_number = Column(String(50), nullable=False, unique=True, index=True)  # Unique pass number
    
    # Pass Details
    pass_type = Column(SQLEnum(GatePassType), nullable=False, default=GatePassType.OTHER)
    reason = Column(Text, nullable=False)
    status = Column(SQLEnum(GatePassStatus), nullable=False, default=GatePassStatus.PENDING)
    
    # Timing
    requested_exit_time = Column(DateTime(timezone=True), nullable=False)
    expected_return_time = Column(DateTime(timezone=True), nullable=True)
    actual_exit_time = Column(DateTime(timezone=True), nullable=True)
    actual_return_time = Column(DateTime(timezone=True), nullable=True)
    
    # Approval Information
    requested_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # Teacher who requested
    approved_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)    # Parent/admin who approved
    approved_at = Column(DateTime(timezone=True), nullable=True)
    approval_notes = Column(Text, nullable=True)
    
    # Guardian Information
    guardian_name = Column(String(200), nullable=True)
    guardian_phone = Column(String(20), nullable=True)
    guardian_id_proof = Column(String(100), nullable=True)  # ID proof number
    
    # Exit/Entry Information
    exit_gate = Column(String(100), nullable=True)          # Which gate used for exit
    entry_gate = Column(String(100), nullable=True)         # Which gate used for entry
    exit_security_guard_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    entry_security_guard_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Verification
    exit_verified = Column(Boolean, default=False)
    entry_verified = Column(Boolean, default=False)
    
    # Emergency Contact
    emergency_contact_notified = Column(Boolean, default=False)
    notification_sent_at = Column(DateTime(timezone=True), nullable=True)
    
    # Additional Notes
    special_instructions = Column(Text, nullable=True)
    internal_notes = Column(Text, nullable=True)  # For school staff use only
    
    # Relationships
    student = relationship("Student", back_populates="gate_pass_requests")
    requested_by = relationship("User", foreign_keys=[requested_by_user_id])
    approved_by = relationship("User", foreign_keys=[approved_by_user_id])
    exit_guard = relationship("User", foreign_keys=[exit_security_guard_id])
    entry_guard = relationship("User", foreign_keys=[entry_security_guard_id])
    
    @property
    def is_overdue(self):
        """Check if student is overdue for return."""
        if self.status == GatePassStatus.ACTIVE and self.expected_return_time:
            from datetime import datetime, timezone
            return datetime.now(timezone.utc) > self.expected_return_time
        return False
    
    def __repr__(self):
        return f"<GatePass(pass_number='{self.pass_number}', student_id={self.student_id}, status='{self.status}')>"


class GatePassLog(TenantBaseModel):
    """
    Log of all gate pass activities for audit trail.
    """
    __tablename__ = "gate_pass_logs"
    
    gate_pass_id = Column(Integer, ForeignKey("gate_passes.id"), nullable=False, index=True)
    action = Column(String(50), nullable=False)  # CREATED, APPROVED, DENIED, EXITED, RETURNED, etc.
    performed_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    performed_at = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(Text, nullable=True)
    
    # Device/Location info for security
    device_info = Column(Text, nullable=True)
    location_info = Column(String(200), nullable=True)
    
    # Relationships
    gate_pass = relationship("GatePass")
    performed_by = relationship("User", foreign_keys=[performed_by_user_id])
    
    def __repr__(self):
        return f"<GatePassLog(gate_pass_id={self.gate_pass_id}, action='{self.action}')>" 
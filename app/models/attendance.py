from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Date, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum

from app.models.base import TenantBaseModel


class AttendanceStatus(str, Enum):
    """Attendance status options."""
    PRESENT = "present"
    ABSENT = "absent"
    LATE = "late"
    PARTIAL = "partial"  # Left early
    EXCUSED = "excused"  # Excused absence


class AttendanceMethod(str, Enum):
    """Methods of marking attendance."""
    MANUAL = "manual"           # Manually marked by teacher
    BIOMETRIC = "biometric"     # Fingerprint/face recognition
    RFID = "rfid"              # RFID card scan
    QR_CODE = "qr_code"        # QR code scan
    MOBILE_APP = "mobile_app"   # Via mobile app


class Attendance(TenantBaseModel):
    """
    Attendance model for tracking student attendance.
    """
    __tablename__ = "attendance"
    
    # Student and Date
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    attendance_date = Column(Date, nullable=False, index=True)
    
    # Attendance Details
    status = Column(SQLEnum(AttendanceStatus), nullable=False, default=AttendanceStatus.PRESENT)
    method = Column(SQLEnum(AttendanceMethod), nullable=False, default=AttendanceMethod.MANUAL)
    
    # Timing Information
    check_in_time = Column(DateTime(timezone=True), nullable=True)
    check_out_time = Column(DateTime(timezone=True), nullable=True)
    marked_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Additional Information
    notes = Column(Text, nullable=True)  # Reason for absence, etc.
    marked_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Who marked attendance
    
    # Location/Device Info (for audit)
    device_id = Column(String(100), nullable=True)  # Biometric device ID, etc.
    location = Column(String(200), nullable=True)   # Gate name, classroom, etc.
    
    # Verification
    is_verified = Column(Boolean, default=True)
    verification_method = Column(String(50), nullable=True)  # Photo verification, etc.
    
    # Relationships
    student = relationship("Student", back_populates="attendance_records")
    marked_by = relationship("User", foreign_keys=[marked_by_user_id])
    
    def __repr__(self):
        return f"<Attendance(student_id={self.student_id}, date={self.attendance_date}, status='{self.status}')>"


class AttendanceSummary(TenantBaseModel):
    """
    Monthly attendance summary for quick reporting.
    """
    __tablename__ = "attendance_summary"
    
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    month = Column(String(7), nullable=False, index=True)  # YYYY-MM format
    year = Column(Integer, nullable=False)
    
    # Summary Counts
    total_days = Column(Integer, default=0)
    present_days = Column(Integer, default=0)
    absent_days = Column(Integer, default=0)
    late_days = Column(Integer, default=0)
    excused_days = Column(Integer, default=0)
    
    # Calculated Fields
    attendance_percentage = Column(Integer, default=0)  # 0-100
    
    # Relationships
    student = relationship("Student")
    
    def __repr__(self):
        return f"<AttendanceSummary(student_id={self.student_id}, month='{self.month}', percentage={self.attendance_percentage}%)>" 
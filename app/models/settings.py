from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, JSON, Time, Date, Text
from sqlalchemy.orm import relationship
from enum import Enum

from app.models.base import TenantBaseModel


class AttendanceMode(str, Enum):
    """Attendance marking modes."""
    BIOMETRIC = "BIOMETRIC"
    RFID_CARD = "RFID_CARD"
    MANUAL = "MANUAL"
    HYBRID = "HYBRID"


class BiometricType(str, Enum):
    """Types of biometric authentication."""
    FINGERPRINT = "FINGERPRINT"
    FACE = "FACE"
    IRIS = "IRIS"
    VOICE = "VOICE"


class NotificationChannel(str, Enum):
    """Notification channels."""
    SMS = "SMS"
    EMAIL = "EMAIL"
    PUSH = "PUSH"
    WHATSAPP = "WHATSAPP"


class GatePassApprovalWorkflow(str, Enum):
    """Gate pass approval workflows."""
    PARENT_ONLY = "PARENT_ONLY"
    ADMIN_ONLY = "ADMIN_ONLY"
    BOTH = "BOTH"
    TEACHER_APPROVAL = "TEACHER_APPROVAL"


class SchoolSettings(TenantBaseModel):
    """
    School settings model for comprehensive system configuration.
    """
    __tablename__ = "school_settings"
    
    # General School Information
    school_name = Column(String(255), nullable=False)
    school_motto = Column(String(500), nullable=True)
    school_logo_url = Column(String(500), nullable=True)
    school_address = Column(Text, nullable=True)
    school_phone = Column(String(20), nullable=True)
    school_email = Column(String(255), nullable=True)
    school_website = Column(String(255), nullable=True)
    
    # Academic Year & Calendar
    academic_year_start = Column(Date, nullable=True)
    academic_year_end = Column(Date, nullable=True)
    working_days = Column(JSON, nullable=True)  # ["monday", "tuesday", ...]
    timezone = Column(String(50), default="UTC")
    
    # School Terms/Semesters
    terms = Column(JSON, nullable=True)  # [{"name": "Term 1", "start": "2024-01-15", "end": "2024-04-15"}]
    
    # Attendance Settings
    default_attendance_mode = Column(String(50), default=AttendanceMode.MANUAL)
    morning_attendance_start = Column(Time, nullable=True)  # e.g., 08:00
    morning_attendance_end = Column(Time, nullable=True)    # e.g., 08:30
    afternoon_attendance_start = Column(Time, nullable=True)  # e.g., 14:00
    afternoon_attendance_end = Column(Time, nullable=True)    # e.g., 14:30
    late_arrival_threshold = Column(Time, nullable=True)   # e.g., 08:15
    absent_threshold = Column(Time, nullable=True)         # e.g., 09:00
    auto_logout_time = Column(Time, nullable=True)         # e.g., 17:00
    
    # Gate Pass Settings
    gate_pass_approval_workflow = Column(String(50), default=GatePassApprovalWorkflow.PARENT_ONLY)
    gate_pass_auto_expiry_hours = Column(Integer, default=24)
    allowed_exit_start_time = Column(Time, nullable=True)  # e.g., 14:00
    allowed_exit_end_time = Column(Time, nullable=True)    # e.g., 17:00
    emergency_override_roles = Column(JSON, nullable=True)  # ["nurse", "headteacher", "admin"]
    
    # Biometric & Card Settings
    biometric_type = Column(String(50), nullable=True)
    biometric_enrollment_fingers = Column(Integer, default=2)
    biometric_retry_attempts = Column(Integer, default=3)
    rfid_card_format = Column(String(50), nullable=True)
    card_reissue_policy = Column(Text, nullable=True)
    
    # Device Integration
    devices = Column(JSON, nullable=True)  # [{"type": "biometric", "location": "main_gate", "device_id": "..."}]
    
    # Notifications & Communication
    notification_channels = Column(JSON, nullable=True)  # ["SMS", "EMAIL", "PUSH"]
    parent_notification_on_entry = Column(Boolean, default=True)
    parent_notification_on_exit = Column(Boolean, default=True)
    parent_notification_late_arrival = Column(Boolean, default=True)
    teacher_notification_absentees = Column(Boolean, default=True)
    security_notification_gate_pass = Column(Boolean, default=True)
    
    # SMS/Email Provider Settings
    sms_provider = Column(String(100), nullable=True)
    sms_api_key = Column(String(255), nullable=True)
    email_provider = Column(String(100), nullable=True)
    email_api_key = Column(String(255), nullable=True)
    
    # Academic Calendar & Events
    public_holidays = Column(JSON, nullable=True)  # [{"date": "2024-01-01", "name": "New Year"}]
    special_events = Column(JSON, nullable=True)   # [{"date": "2024-03-15", "name": "Sports Day", "no_attendance": true}]
    exam_periods = Column(JSON, nullable=True)     # [{"start": "2024-06-01", "end": "2024-06-15", "strict_gate_pass": true}]
    
    # Customization
    theme_colors = Column(JSON, nullable=True)  # {"primary": "#007bff", "secondary": "#6c757d"}
    report_template = Column(String(100), default="default")
    language = Column(String(10), default="en")
    
    # Security & Compliance
    data_retention_days = Column(Integer, default=1095)  # 3 years
    backup_frequency_hours = Column(Integer, default=24)
    audit_log_enabled = Column(Boolean, default=True)
    
    # System Integrations
    api_keys = Column(JSON, nullable=True)  # {"biometric_device": "...", "payment_gateway": "..."}
    integrations = Column(JSON, nullable=True)  # {"erp_system": "moodle", "payment_gateway": "stripe"}
    
    # Staff Attendance Settings
    staff_clock_in_start_time = Column(String(10), nullable=True)  # e.g., "08:00"
    staff_clock_in_end_time = Column(String(10), nullable=True)    # e.g., "09:00"
    staff_clock_out_start_time = Column(String(10), nullable=True)  # e.g., "16:00"
    staff_clock_out_end_time = Column(String(10), nullable=True)    # e.g., "17:00"
    staff_late_threshold_minutes = Column(Integer, default=15)
    staff_overtime_threshold_hours = Column(Integer, default=8)
    staff_auto_mark_absent_hours = Column(Integer, default=2)
    staff_attendance_methods = Column(JSON, nullable=True)  # ["web_portal", "biometric", "rfid"]
    staff_leave_approval_workflow = Column(String(50), default="admin_only")
    staff_leave_auto_approve_hours = Column(Integer, default=24)
    staff_leave_types = Column(JSON, nullable=True)  # ["personal_leave", "sick_leave", "annual_leave"]
    staff_work_days = Column(JSON, nullable=True)  # [1, 2, 3, 4, 5] - Monday to Friday
    staff_holiday_calendar_enabled = Column(Boolean, default=False)
    staff_attendance_reports_enabled = Column(Boolean, default=True)
    staff_attendance_notifications_enabled = Column(Boolean, default=True)
    
    # Visitor Management Settings
    visitor_management_enabled = Column(Boolean, default=True)
    visitor_approval_workflow = Column(String(50), default="host_approve")  # auto_approve, host_approve, admin_approve, both_approve
    visitor_auto_approve_parent_visits = Column(Boolean, default=True)
    visitor_require_id_verification = Column(Boolean, default=True)
    visitor_notify_host_on_arrival = Column(Boolean, default=True)
    visitor_notify_parent_on_visitor = Column(Boolean, default=True)
    visitor_notify_security_on_overstay = Column(Boolean, default=True)
    visitor_print_badges = Column(Boolean, default=True)
    visitor_badge_expiry_hours = Column(Integer, default=8)
    visitor_enable_blacklist = Column(Boolean, default=True)
    visitor_enable_emergency_evacuation = Column(Boolean, default=True)
    visitor_integrate_with_gate_pass = Column(Boolean, default=True)
    visitor_enable_qr_codes = Column(Boolean, default=True)
    visitor_allow_pre_registration = Column(Boolean, default=True)
    visitor_pre_registration_hours_ahead = Column(Integer, default=24)
    visitor_auto_approve_pre_registered = Column(Boolean, default=False)
    visitor_visiting_hours_start = Column(String(10), default="09:00")
    visitor_visiting_hours_end = Column(String(10), default="16:00")
    visitor_max_duration_hours = Column(Integer, default=2)
    visitor_auto_checkout_after_hours = Column(Integer, default=4)
    
    # Relationships
    school = relationship("School", back_populates="settings")
    
    def __repr__(self):
        return f"<SchoolSettings(school_id={self.school_id}, school_name='{self.school_name}')>"


class ClassLevel(TenantBaseModel):
    """
    Class levels (e.g., Primary 1, Grade 5, Senior 2).
    """
    __tablename__ = "class_levels"
    
    name = Column(String(100), nullable=False)  # e.g., "Primary 1", "Grade 5"
    code = Column(String(20), nullable=False, unique=True)  # e.g., "P1", "G5"
    description = Column(Text, nullable=True)
    order = Column(Integer, default=0)  # For sorting
    is_active = Column(Boolean, default=True)
    
    # Relationships
    classes = relationship("Class", back_populates="level")
    
    def __repr__(self):
        return f"<ClassLevel(name='{self.name}', code='{self.code}')>"


class Class(TenantBaseModel):
    """
    Classes with streams/sections (e.g., "P5 – Blue", "Grade 6 – A").
    """
    __tablename__ = "classes"
    
    name = Column(String(100), nullable=False)  # e.g., "P5 – Blue"
    code = Column(String(20), nullable=False)  # e.g., "P5B"
    level_id = Column(Integer, ForeignKey("class_levels.id"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    capacity = Column(Integer, default=40)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    level = relationship("ClassLevel", back_populates="classes")
    teacher = relationship("User", back_populates="classes_taught")
    students = relationship("Student", back_populates="class_")
    school = relationship("School", back_populates="classes")
    
    def __repr__(self):
        return f"<Class(name='{self.name}', code='{self.code}')>"


class Subject(TenantBaseModel):
    """
    Subjects list for linking to attendance per subject if needed.
    """
    __tablename__ = "subjects"
    
    name = Column(String(100), nullable=False)  # e.g., "Mathematics"
    code = Column(String(20), nullable=False)  # e.g., "MATH"
    description = Column(Text, nullable=True)
    is_core = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    
    def __repr__(self):
        return f"<Subject(name='{self.name}', code='{self.code}')>"


class Device(TenantBaseModel):
    """
    Biometric devices and RFID readers.
    """
    __tablename__ = "devices"
    
    name = Column(String(100), nullable=False)  # e.g., "Main Gate Biometric"
    device_type = Column(String(50), nullable=False)  # "biometric", "rfid_reader", "qr_scanner"
    device_id = Column(String(100), nullable=False, unique=True)
    location = Column(String(100), nullable=False)  # e.g., "main_gate", "staff_entrance"
    ip_address = Column(String(45), nullable=True)
    port = Column(Integer, nullable=True)
    api_key = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    last_sync = Column(String(50), nullable=True)  # ISO timestamp
    
    def __repr__(self):
        return f"<Device(name='{self.name}', type='{self.device_type}', location='{self.location}')>"

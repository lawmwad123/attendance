from pydantic import BaseModel, validator
from typing import Optional, List, Dict, Any
from datetime import date, time
from enum import Enum

from app.models.settings import (
    AttendanceMode, BiometricType, NotificationChannel, 
    GatePassApprovalWorkflow
)


# Base Schemas
class ClassLevelBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    order: int = 0
    is_active: bool = True


class ClassLevelCreate(ClassLevelBase):
    pass


class ClassLevelUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    order: Optional[int] = None
    is_active: Optional[bool] = None


class ClassLevel(ClassLevelBase):
    id: int
    school_id: int
    created_at: str
    updated_at: str
    
    class Config:
        from_attributes = True


class ClassBase(BaseModel):
    name: str
    code: str
    level_id: int
    teacher_id: Optional[int] = None
    capacity: int = 40
    is_active: bool = True


class ClassCreate(ClassBase):
    pass


class ClassUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    level_id: Optional[int] = None
    teacher_id: Optional[int] = None
    capacity: Optional[int] = None
    is_active: Optional[bool] = None


class Class(ClassBase):
    id: int
    school_id: int
    created_at: str
    updated_at: str
    
    class Config:
        from_attributes = True


class SubjectBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    is_core: bool = False
    is_active: bool = True


class SubjectCreate(SubjectBase):
    pass


class SubjectUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    is_core: Optional[bool] = None
    is_active: Optional[bool] = None


class Subject(SubjectBase):
    id: int
    school_id: int
    created_at: str
    updated_at: str
    
    class Config:
        from_attributes = True


class DeviceBase(BaseModel):
    name: str
    device_type: str
    device_id: str
    location: str
    ip_address: Optional[str] = None
    port: Optional[int] = None
    api_key: Optional[str] = None
    is_active: bool = True


class DeviceCreate(DeviceBase):
    pass


class DeviceUpdate(BaseModel):
    name: Optional[str] = None
    device_type: Optional[str] = None
    device_id: Optional[str] = None
    location: Optional[str] = None
    ip_address: Optional[str] = None
    port: Optional[int] = None
    api_key: Optional[str] = None
    is_active: Optional[bool] = None


class Device(DeviceBase):
    id: int
    school_id: int
    last_sync: Optional[str] = None
    created_at: str
    updated_at: str
    
    class Config:
        from_attributes = True


# School Settings Schemas
class SchoolSettingsBase(BaseModel):
    # General School Information
    school_name: str
    school_motto: Optional[str] = None
    school_logo_url: Optional[str] = None
    school_address: Optional[str] = None
    school_phone: Optional[str] = None
    school_email: Optional[str] = None
    school_website: Optional[str] = None
    
    # Academic Year & Calendar
    academic_year_start: Optional[date] = None
    academic_year_end: Optional[date] = None
    working_days: Optional[List[str]] = None
    timezone: str = "UTC"
    
    # School Terms/Semesters
    terms: Optional[List[Dict[str, Any]]] = None
    
    # Attendance Settings
    default_attendance_mode: AttendanceMode = AttendanceMode.MANUAL
    morning_attendance_start: Optional[time] = None
    morning_attendance_end: Optional[time] = None
    afternoon_attendance_start: Optional[time] = None
    afternoon_attendance_end: Optional[time] = None
    late_arrival_threshold: Optional[time] = None
    absent_threshold: Optional[time] = None
    auto_logout_time: Optional[time] = None
    
    # Gate Pass Settings
    gate_pass_approval_workflow: GatePassApprovalWorkflow = GatePassApprovalWorkflow.PARENT_ONLY
    gate_pass_auto_expiry_hours: int = 24
    allowed_exit_start_time: Optional[time] = None
    allowed_exit_end_time: Optional[time] = None
    emergency_override_roles: Optional[List[str]] = None
    
    # Biometric & Card Settings
    biometric_type: Optional[BiometricType] = None
    biometric_enrollment_fingers: int = 2
    biometric_retry_attempts: int = 3
    rfid_card_format: Optional[str] = None
    card_reissue_policy: Optional[str] = None
    
    # Device Integration
    devices: Optional[List[Dict[str, Any]]] = None
    
    # Notifications & Communication
    notification_channels: Optional[List[NotificationChannel]] = None
    parent_notification_on_entry: bool = True
    parent_notification_on_exit: bool = True
    parent_notification_late_arrival: bool = True
    teacher_notification_absentees: bool = True
    security_notification_gate_pass: bool = True
    
    # SMS/Email Provider Settings
    sms_provider: Optional[str] = None
    sms_api_key: Optional[str] = None
    email_provider: Optional[str] = None
    email_api_key: Optional[str] = None
    
    # Academic Calendar & Events
    public_holidays: Optional[List[Dict[str, Any]]] = None
    special_events: Optional[List[Dict[str, Any]]] = None
    exam_periods: Optional[List[Dict[str, Any]]] = None
    
    # Customization
    theme_colors: Optional[Dict[str, str]] = None
    report_template: str = "default"
    language: str = "en"
    
    # Security & Compliance
    data_retention_days: int = 1095
    backup_frequency_hours: int = 24
    audit_log_enabled: bool = True
    
    # System Integrations
    api_keys: Optional[Dict[str, str]] = None
    integrations: Optional[Dict[str, str]] = None


class SchoolSettingsCreate(SchoolSettingsBase):
    pass


class SchoolSettingsUpdate(BaseModel):
    # General School Information
    school_name: Optional[str] = None
    school_motto: Optional[str] = None
    school_logo_url: Optional[str] = None
    school_address: Optional[str] = None
    school_phone: Optional[str] = None
    school_email: Optional[str] = None
    school_website: Optional[str] = None
    
    # Academic Year & Calendar
    academic_year_start: Optional[date] = None
    academic_year_end: Optional[date] = None
    working_days: Optional[List[str]] = None
    timezone: Optional[str] = None
    
    # School Terms/Semesters
    terms: Optional[List[Dict[str, Any]]] = None
    
    # Attendance Settings
    default_attendance_mode: Optional[AttendanceMode] = None
    morning_attendance_start: Optional[time] = None
    morning_attendance_end: Optional[time] = None
    afternoon_attendance_start: Optional[time] = None
    afternoon_attendance_end: Optional[time] = None
    late_arrival_threshold: Optional[time] = None
    absent_threshold: Optional[time] = None
    auto_logout_time: Optional[time] = None
    
    # Gate Pass Settings
    gate_pass_approval_workflow: Optional[GatePassApprovalWorkflow] = None
    gate_pass_auto_expiry_hours: Optional[int] = None
    allowed_exit_start_time: Optional[time] = None
    allowed_exit_end_time: Optional[time] = None
    emergency_override_roles: Optional[List[str]] = None
    
    # Biometric & Card Settings
    biometric_type: Optional[BiometricType] = None
    biometric_enrollment_fingers: Optional[int] = None
    biometric_retry_attempts: Optional[int] = None
    rfid_card_format: Optional[str] = None
    card_reissue_policy: Optional[str] = None
    
    # Device Integration
    devices: Optional[List[Dict[str, Any]]] = None
    
    # Notifications & Communication
    notification_channels: Optional[List[NotificationChannel]] = None
    parent_notification_on_entry: Optional[bool] = None
    parent_notification_on_exit: Optional[bool] = None
    parent_notification_late_arrival: Optional[bool] = None
    teacher_notification_absentees: Optional[bool] = None
    security_notification_gate_pass: Optional[bool] = None
    
    # SMS/Email Provider Settings
    sms_provider: Optional[str] = None
    sms_api_key: Optional[str] = None
    email_provider: Optional[str] = None
    email_api_key: Optional[str] = None
    
    # Academic Calendar & Events
    public_holidays: Optional[List[Dict[str, Any]]] = None
    special_events: Optional[List[Dict[str, Any]]] = None
    exam_periods: Optional[List[Dict[str, Any]]] = None
    
    # Customization
    theme_colors: Optional[Dict[str, str]] = None
    report_template: Optional[str] = None
    language: Optional[str] = None
    
    # Security & Compliance
    data_retention_days: Optional[int] = None
    backup_frequency_hours: Optional[int] = None
    audit_log_enabled: Optional[bool] = None
    
    # System Integrations
    api_keys: Optional[Dict[str, str]] = None
    integrations: Optional[Dict[str, str]] = None


class SchoolSettings(SchoolSettingsBase):
    id: int
    school_id: int
    created_at: str
    updated_at: str
    
    class Config:
        from_attributes = True


# Response schemas for specific settings sections
class GeneralSettings(BaseModel):
    school_name: str
    school_motto: Optional[str] = None
    school_logo_url: Optional[str] = None
    school_address: Optional[str] = None
    school_phone: Optional[str] = None
    school_email: Optional[str] = None
    school_website: Optional[str] = None
    timezone: str = "UTC"


class AttendanceSettings(BaseModel):
    default_attendance_mode: AttendanceMode
    morning_attendance_start: Optional[time] = None
    morning_attendance_end: Optional[time] = None
    afternoon_attendance_start: Optional[time] = None
    afternoon_attendance_end: Optional[time] = None
    late_arrival_threshold: Optional[time] = None
    absent_threshold: Optional[time] = None
    auto_logout_time: Optional[time] = None


class GatePassSettings(BaseModel):
    gate_pass_approval_workflow: GatePassApprovalWorkflow
    gate_pass_auto_expiry_hours: int
    allowed_exit_start_time: Optional[time] = None
    allowed_exit_end_time: Optional[time] = None
    emergency_override_roles: Optional[List[str]] = None


class NotificationSettings(BaseModel):
    notification_channels: Optional[List[NotificationChannel]] = None
    parent_notification_on_entry: bool
    parent_notification_on_exit: bool
    parent_notification_late_arrival: bool
    teacher_notification_absentees: bool
    security_notification_gate_pass: bool


class BiometricSettings(BaseModel):
    biometric_type: Optional[BiometricType] = None
    biometric_enrollment_fingers: int
    biometric_retry_attempts: int
    rfid_card_format: Optional[str] = None
    card_reissue_policy: Optional[str] = None


# Settings summary for dashboard
class SettingsSummary(BaseModel):
    general: GeneralSettings
    attendance: AttendanceSettings
    gate_pass: GatePassSettings
    notifications: NotificationSettings
    biometric: BiometricSettings
    total_classes: int
    total_subjects: int
    total_devices: int

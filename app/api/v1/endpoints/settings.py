from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional

from app.api.deps import get_db, get_current_active_user, require_admin
from app.models.user import User
from app.models.settings import (
    SchoolSettings, ClassLevel, Class, Subject, Device,
    AttendanceMode, BiometricType, NotificationChannel, GatePassApprovalWorkflow
)
from app.schemas.settings import (
    SchoolSettings as SchoolSettingsSchema,
    SchoolSettingsCreate, SchoolSettingsUpdate,
    ClassLevel as ClassLevelSchema, ClassLevelCreate, ClassLevelUpdate,
    Class as ClassSchema, ClassCreate, ClassUpdate,
    Subject as SubjectSchema, SubjectCreate, SubjectUpdate,
    Device as DeviceSchema, DeviceCreate, DeviceUpdate,
    GeneralSettings, AttendanceSettings, GatePassSettings,
    NotificationSettings, BiometricSettings, StaffAttendanceSettings, SettingsSummary
)

router = APIRouter()


# ============================================================================
# SCHOOL SETTINGS ENDPOINTS
# ============================================================================

@router.get("/", response_model=SchoolSettingsSchema)
async def get_school_settings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get current school settings."""
    stmt = select(SchoolSettings).where(SchoolSettings.school_id == current_user.school_id)
    result = await db.execute(stmt)
    settings = result.scalar_one_or_none()
    
    if not settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School settings not found"
        )
    
    # Convert to dict to handle datetime serialization
    return settings.dict()


@router.post("/", response_model=SchoolSettingsSchema)
async def create_school_settings(
    settings_data: SchoolSettingsCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Create school settings (admin only)."""
    # Check if settings already exist
    stmt = select(SchoolSettings).where(SchoolSettings.school_id == current_user.school_id)
    result = await db.execute(stmt)
    existing_settings = result.scalar_one_or_none()
    
    if existing_settings:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="School settings already exist"
        )
    
    # Create new settings
    settings = SchoolSettings(
        school_id=current_user.school_id,
        **settings_data.dict()
    )
    
    db.add(settings)
    await db.commit()
    await db.refresh(settings)
    
    # Convert to dict to handle datetime serialization
    return settings.dict()


@router.put("/", response_model=SchoolSettingsSchema)
async def update_school_settings(
    settings_data: SchoolSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update school settings (admin only)."""
    stmt = select(SchoolSettings).where(SchoolSettings.school_id == current_user.school_id)
    result = await db.execute(stmt)
    settings = result.scalar_one_or_none()
    
    if not settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School settings not found"
        )
    
    # Update only provided fields
    update_data = settings_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(settings, field, value)
    
    await db.commit()
    await db.refresh(settings)
    
    # Convert to dict to handle datetime serialization
    return settings.dict()


# ============================================================================
# SETTINGS SECTIONS ENDPOINTS
# ============================================================================

@router.get("/general", response_model=GeneralSettings)
async def get_general_settings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get general school settings."""
    stmt = select(SchoolSettings).where(SchoolSettings.school_id == current_user.school_id)
    result = await db.execute(stmt)
    settings = result.scalar_one_or_none()
    
    if not settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School settings not found"
        )
    
    return GeneralSettings(
        school_name=settings.school_name,
        school_motto=settings.school_motto,
        school_logo_url=settings.school_logo_url,
        school_address=settings.school_address,
        school_phone=settings.school_phone,
        school_email=settings.school_email,
        school_website=settings.school_website,
        timezone=settings.timezone
    )


@router.get("/attendance", response_model=AttendanceSettings)
async def get_attendance_settings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get attendance settings."""
    stmt = select(SchoolSettings).where(SchoolSettings.school_id == current_user.school_id)
    result = await db.execute(stmt)
    settings = result.scalar_one_or_none()
    
    if not settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School settings not found"
        )
    
    return AttendanceSettings(
        default_attendance_mode=settings.default_attendance_mode,
        morning_attendance_start=settings.morning_attendance_start,
        morning_attendance_end=settings.morning_attendance_end,
        afternoon_attendance_start=settings.afternoon_attendance_start,
        afternoon_attendance_end=settings.afternoon_attendance_end,
        late_arrival_threshold=settings.late_arrival_threshold,
        absent_threshold=settings.absent_threshold,
        auto_logout_time=settings.auto_logout_time
    )


@router.get("/gate-pass", response_model=GatePassSettings)
async def get_gate_pass_settings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get gate pass settings."""
    stmt = select(SchoolSettings).where(SchoolSettings.school_id == current_user.school_id)
    result = await db.execute(stmt)
    settings = result.scalar_one_or_none()
    
    if not settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School settings not found"
        )
    
    return GatePassSettings(
        gate_pass_approval_workflow=settings.gate_pass_approval_workflow,
        gate_pass_auto_expiry_hours=settings.gate_pass_auto_expiry_hours,
        allowed_exit_start_time=settings.allowed_exit_start_time,
        allowed_exit_end_time=settings.allowed_exit_end_time,
        emergency_override_roles=settings.emergency_override_roles
    )


@router.get("/notifications", response_model=NotificationSettings)
async def get_notification_settings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get notification settings."""
    stmt = select(SchoolSettings).where(SchoolSettings.school_id == current_user.school_id)
    result = await db.execute(stmt)
    settings = result.scalar_one_or_none()
    
    if not settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School settings not found"
        )
    
    return NotificationSettings(
        notification_channels=settings.notification_channels,
        parent_notification_on_entry=settings.parent_notification_on_entry,
        parent_notification_on_exit=settings.parent_notification_on_exit,
        parent_notification_late_arrival=settings.parent_notification_late_arrival,
        teacher_notification_absentees=settings.teacher_notification_absentees,
        security_notification_gate_pass=settings.security_notification_gate_pass
    )


@router.get("/biometric", response_model=BiometricSettings)
async def get_biometric_settings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get biometric settings."""
    stmt = select(SchoolSettings).where(SchoolSettings.school_id == current_user.school_id)
    result = await db.execute(stmt)
    settings = result.scalar_one_or_none()
    
    if not settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School settings not found"
        )
    
    return BiometricSettings(
        biometric_type=settings.biometric_type,
        biometric_enrollment_fingers=settings.biometric_enrollment_fingers,
        biometric_retry_attempts=settings.biometric_retry_attempts,
        rfid_card_format=settings.rfid_card_format,
        card_reissue_policy=settings.card_reissue_policy
    )


@router.get("/summary", response_model=SettingsSummary)
async def get_settings_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get settings summary for dashboard."""
    # Get school settings
    stmt = select(SchoolSettings).where(SchoolSettings.school_id == current_user.school_id)
    result = await db.execute(stmt)
    settings = result.scalar_one_or_none()
    
    if not settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School settings not found"
        )
    
    # Get counts
    class_count = await db.scalar(select(func.count(Class.id)).where(Class.school_id == current_user.school_id))
    subject_count = await db.scalar(select(func.count(Subject.id)).where(Subject.school_id == current_user.school_id))
    device_count = await db.scalar(select(func.count(Device.id)).where(Device.school_id == current_user.school_id))
    
    # Convert settings to dict to handle datetime serialization
    settings_dict = settings.dict()
    
    return SettingsSummary(
        general=GeneralSettings(
            school_name=settings_dict["school_name"],
            school_motto=settings_dict.get("school_motto"),
            school_logo_url=settings_dict.get("school_logo_url"),
            school_address=settings_dict.get("school_address"),
            school_phone=settings_dict.get("school_phone"),
            school_email=settings_dict.get("school_email"),
            school_website=settings_dict.get("school_website"),
            timezone=settings_dict.get("timezone", "UTC")
        ),
        attendance=AttendanceSettings(
            default_attendance_mode=settings_dict["default_attendance_mode"],
            morning_attendance_start=settings_dict.get("morning_attendance_start"),
            morning_attendance_end=settings_dict.get("morning_attendance_end"),
            afternoon_attendance_start=settings_dict.get("afternoon_attendance_start"),
            afternoon_attendance_end=settings_dict.get("afternoon_attendance_end"),
            late_arrival_threshold=settings_dict.get("late_arrival_threshold"),
            absent_threshold=settings_dict.get("absent_threshold"),
            auto_logout_time=settings_dict.get("auto_logout_time")
        ),
        gate_pass=GatePassSettings(
            gate_pass_approval_workflow=settings_dict["gate_pass_approval_workflow"],
            gate_pass_auto_expiry_hours=settings_dict["gate_pass_auto_expiry_hours"],
            allowed_exit_start_time=settings_dict.get("allowed_exit_start_time"),
            allowed_exit_end_time=settings_dict.get("allowed_exit_end_time"),
            emergency_override_roles=settings_dict.get("emergency_override_roles")
        ),
        notifications=NotificationSettings(
            notification_channels=settings_dict.get("notification_channels"),
            parent_notification_on_entry=settings_dict["parent_notification_on_entry"],
            parent_notification_on_exit=settings_dict["parent_notification_on_exit"],
            parent_notification_late_arrival=settings_dict["parent_notification_late_arrival"],
            teacher_notification_absentees=settings_dict["teacher_notification_absentees"],
            security_notification_gate_pass=settings_dict["security_notification_gate_pass"]
        ),
        biometric=BiometricSettings(
            biometric_type=settings_dict.get("biometric_type"),
            biometric_enrollment_fingers=settings_dict["biometric_enrollment_fingers"],
            biometric_retry_attempts=settings_dict["biometric_retry_attempts"],
            rfid_card_format=settings_dict.get("rfid_card_format"),
            card_reissue_policy=settings_dict.get("card_reissue_policy")
        ),
        staff_attendance=StaffAttendanceSettings(
            staff_clock_in_start_time=settings_dict.get("staff_clock_in_start_time", "08:00"),
            staff_clock_in_end_time=settings_dict.get("staff_clock_in_end_time", "09:00"),
            staff_clock_out_start_time=settings_dict.get("staff_clock_out_start_time", "16:00"),
            staff_clock_out_end_time=settings_dict.get("staff_clock_out_end_time", "17:00"),
            staff_late_threshold_minutes=settings_dict.get("staff_late_threshold_minutes", 15),
            staff_overtime_threshold_hours=settings_dict.get("staff_overtime_threshold_hours", 8),
            staff_auto_mark_absent_hours=settings_dict.get("staff_auto_mark_absent_hours", 2),
            staff_attendance_methods=settings_dict.get("staff_attendance_methods", ["web_portal", "biometric", "rfid"]),
            staff_leave_approval_workflow=settings_dict.get("staff_leave_approval_workflow", "admin_only"),
            staff_leave_auto_approve_hours=settings_dict.get("staff_leave_auto_approve_hours", 24),
            staff_leave_types=settings_dict.get("staff_leave_types", ["personal_leave", "sick_leave", "annual_leave", "emergency_leave"]),
            staff_work_days=settings_dict.get("staff_work_days", [1, 2, 3, 4, 5]),
            staff_holiday_calendar_enabled=settings_dict.get("staff_holiday_calendar_enabled", False),
            staff_attendance_reports_enabled=settings_dict.get("staff_attendance_reports_enabled", True),
            staff_attendance_notifications_enabled=settings_dict.get("staff_attendance_notifications_enabled", True)
        ),
        total_classes=class_count or 0,
        total_subjects=subject_count or 0,
        total_devices=device_count or 0
    )


# ============================================================================
# CLASS LEVELS ENDPOINTS
# ============================================================================

@router.get("/class-levels", response_model=List[ClassLevelSchema])
async def get_class_levels(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100)
):
    """Get class levels."""
    stmt = select(ClassLevel).where(
        ClassLevel.school_id == current_user.school_id
    ).order_by(ClassLevel.order, ClassLevel.name).offset(skip).limit(limit)
    
    result = await db.execute(stmt)
    class_levels = result.scalars().all()
    
    # Convert to dict to handle datetime serialization
    return [class_level.dict() for class_level in class_levels]


@router.post("/class-levels", response_model=ClassLevelSchema)
async def create_class_level(
    class_level_data: ClassLevelCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Create a new class level."""
    class_level = ClassLevel(
        school_id=current_user.school_id,
        **class_level_data.dict()
    )
    
    db.add(class_level)
    await db.commit()
    await db.refresh(class_level)
    
    return class_level


@router.get("/class-levels/{class_level_id}", response_model=ClassLevelSchema)
async def get_class_level(
    class_level_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific class level."""
    stmt = select(ClassLevel).where(
        ClassLevel.id == class_level_id,
        ClassLevel.school_id == current_user.school_id
    )
    result = await db.execute(stmt)
    class_level = result.scalar_one_or_none()
    
    if not class_level:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class level not found"
        )
    
    return class_level


@router.put("/class-levels/{class_level_id}", response_model=ClassLevelSchema)
async def update_class_level(
    class_level_id: int,
    class_level_data: ClassLevelUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update a class level."""
    stmt = select(ClassLevel).where(
        ClassLevel.id == class_level_id,
        ClassLevel.school_id == current_user.school_id
    )
    result = await db.execute(stmt)
    class_level = result.scalar_one_or_none()
    
    if not class_level:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class level not found"
        )
    
    # Update only provided fields
    update_data = class_level_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(class_level, field, value)
    
    await db.commit()
    await db.refresh(class_level)
    
    return class_level


@router.delete("/class-levels/{class_level_id}")
async def delete_class_level(
    class_level_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Delete a class level."""
    stmt = select(ClassLevel).where(
        ClassLevel.id == class_level_id,
        ClassLevel.school_id == current_user.school_id
    )
    result = await db.execute(stmt)
    class_level = result.scalar_one_or_none()
    
    if not class_level:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class level not found"
        )
    
    await db.delete(class_level)
    await db.commit()
    
    return {"message": "Class level deleted successfully"}


# ============================================================================
# CLASSES ENDPOINTS
# ============================================================================

@router.get("/classes", response_model=List[ClassSchema])
async def get_classes(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    level_id: Optional[int] = Query(None)
):
    """Get classes."""
    stmt = select(Class).where(Class.school_id == current_user.school_id)
    
    if level_id:
        stmt = stmt.where(Class.level_id == level_id)
    
    stmt = stmt.order_by(Class.name).offset(skip).limit(limit)
    result = await db.execute(stmt)
    classes = result.scalars().all()
    
    # Convert to dict to handle datetime serialization
    return [class_obj.dict() for class_obj in classes]


@router.post("/classes", response_model=ClassSchema)
async def create_class(
    class_data: ClassCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Create a new class."""
    class_obj = Class(
        school_id=current_user.school_id,
        **class_data.dict()
    )
    
    db.add(class_obj)
    await db.commit()
    await db.refresh(class_obj)
    
    return class_obj


@router.get("/classes/{class_id}", response_model=ClassSchema)
async def get_class(
    class_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific class."""
    stmt = select(Class).where(
        Class.id == class_id,
        Class.school_id == current_user.school_id
    )
    result = await db.execute(stmt)
    class_obj = result.scalar_one_or_none()
    
    if not class_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found"
        )
    
    return class_obj


@router.put("/classes/{class_id}", response_model=ClassSchema)
async def update_class(
    class_id: int,
    class_data: ClassUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update a class."""
    stmt = select(Class).where(
        Class.id == class_id,
        Class.school_id == current_user.school_id
    )
    result = await db.execute(stmt)
    class_obj = result.scalar_one_or_none()
    
    if not class_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found"
        )
    
    # Update only provided fields
    update_data = class_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(class_obj, field, value)
    
    await db.commit()
    await db.refresh(class_obj)
    
    return class_obj


@router.delete("/classes/{class_id}")
async def delete_class(
    class_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Delete a class."""
    stmt = select(Class).where(
        Class.id == class_id,
        Class.school_id == current_user.school_id
    )
    result = await db.execute(stmt)
    class_obj = result.scalar_one_or_none()
    
    if not class_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found"
        )
    
    await db.delete(class_obj)
    await db.commit()
    
    return {"message": "Class deleted successfully"}


# ============================================================================
# SUBJECTS ENDPOINTS
# ============================================================================

@router.get("/subjects", response_model=List[SubjectSchema])
async def get_subjects(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    is_core: Optional[bool] = Query(None)
):
    """Get subjects."""
    stmt = select(Subject).where(Subject.school_id == current_user.school_id)
    
    if is_core is not None:
        stmt = stmt.where(Subject.is_core == is_core)
    
    stmt = stmt.order_by(Subject.name).offset(skip).limit(limit)
    result = await db.execute(stmt)
    subjects = result.scalars().all()
    
    # Convert to dict to handle datetime serialization
    return [subject.dict() for subject in subjects]


@router.post("/subjects", response_model=SubjectSchema)
async def create_subject(
    subject_data: SubjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Create a new subject."""
    subject = Subject(
        school_id=current_user.school_id,
        **subject_data.dict()
    )
    
    db.add(subject)
    await db.commit()
    await db.refresh(subject)
    
    return subject


@router.get("/subjects/{subject_id}", response_model=SubjectSchema)
async def get_subject(
    subject_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific subject."""
    stmt = select(Subject).where(
        Subject.id == subject_id,
        Subject.school_id == current_user.school_id
    )
    result = await db.execute(stmt)
    subject = result.scalar_one_or_none()
    
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found"
        )
    
    return subject


@router.put("/subjects/{subject_id}", response_model=SubjectSchema)
async def update_subject(
    subject_id: int,
    subject_data: SubjectUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update a subject."""
    stmt = select(Subject).where(
        Subject.id == subject_id,
        Subject.school_id == current_user.school_id
    )
    result = await db.execute(stmt)
    subject = result.scalar_one_or_none()
    
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found"
        )
    
    # Update only provided fields
    update_data = subject_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(subject, field, value)
    
    await db.commit()
    await db.refresh(subject)
    
    return subject


@router.delete("/subjects/{subject_id}")
async def delete_subject(
    subject_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Delete a subject."""
    stmt = select(Subject).where(
        Subject.id == subject_id,
        Subject.school_id == current_user.school_id
    )
    result = await db.execute(stmt)
    subject = result.scalar_one_or_none()
    
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found"
        )
    
    await db.delete(subject)
    await db.commit()
    
    return {"message": "Subject deleted successfully"}


# ============================================================================
# DEVICES ENDPOINTS
# ============================================================================

@router.get("/devices", response_model=List[DeviceSchema])
async def get_devices(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    device_type: Optional[str] = Query(None)
):
    """Get devices."""
    stmt = select(Device).where(Device.school_id == current_user.school_id)
    
    if device_type:
        stmt = stmt.where(Device.device_type == device_type)
    
    stmt = stmt.order_by(Device.name).offset(skip).limit(limit)
    result = await db.execute(stmt)
    devices = result.scalars().all()
    
    # Convert to dict to handle datetime serialization
    return [device.dict() for device in devices]


@router.post("/devices", response_model=DeviceSchema)
async def create_device(
    device_data: DeviceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Create a new device."""
    device = Device(
        school_id=current_user.school_id,
        **device_data.dict()
    )
    
    db.add(device)
    await db.commit()
    await db.refresh(device)
    
    return device


@router.get("/devices/{device_id}", response_model=DeviceSchema)
async def get_device(
    device_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific device."""
    stmt = select(Device).where(
        Device.id == device_id,
        Device.school_id == current_user.school_id
    )
    result = await db.execute(stmt)
    device = result.scalar_one_or_none()
    
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found"
        )
    
    return device


@router.put("/devices/{device_id}", response_model=DeviceSchema)
async def update_device(
    device_id: int,
    device_data: DeviceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update a device."""
    stmt = select(Device).where(
        Device.id == device_id,
        Device.school_id == current_user.school_id
    )
    result = await db.execute(stmt)
    device = result.scalar_one_or_none()
    
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found"
        )
    
    # Update only provided fields
    update_data = device_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(device, field, value)
    
    await db.commit()
    await db.refresh(device)
    
    return device


@router.delete("/devices/{device_id}")
async def delete_device(
    device_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Delete a device."""
    stmt = select(Device).where(
        Device.id == device_id,
        Device.school_id == current_user.school_id
    )
    result = await db.execute(stmt)
    device = result.scalar_one_or_none()
    
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found"
        )
    
    await db.delete(device)
    await db.commit()
    
    return {"message": "Device deleted successfully"}


# ============================================================================
# ENUM ENDPOINTS
# ============================================================================

@router.get("/enums/attendance-modes")
async def get_attendance_modes():
    """Get available attendance modes."""
    return [mode.value for mode in AttendanceMode]


@router.get("/enums/biometric-types")
async def get_biometric_types():
    """Get available biometric types."""
    return [bio_type.value for bio_type in BiometricType]


@router.get("/enums/notification-channels")
async def get_notification_channels():
    """Get available notification channels."""
    return [channel.value for channel in NotificationChannel]


@router.get("/enums/gate-pass-workflows")
async def get_gate_pass_workflows():
    """Get available gate pass approval workflows."""
    return [workflow.value for workflow in GatePassApprovalWorkflow]

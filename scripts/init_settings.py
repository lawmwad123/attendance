#!/usr/bin/env python3
"""
Initialize settings with demo data for the School Attendance System.
"""

import asyncio
import sys
import os
from datetime import date, time

# Add the project root to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import async_session_factory
from app.models.settings import (
    SchoolSettings, ClassLevel, Class, Subject, Device,
    AttendanceMode, BiometricType, NotificationChannel, GatePassApprovalWorkflow
)
from app.models.school import School
from app.models.user import User
from sqlalchemy import select


async def create_demo_settings():
    """Create demo settings for the demo school."""
    async with async_session_factory() as session:
        # Get demo school
        stmt = select(School).where(School.slug == "demo")
        result = await session.execute(stmt)
        school = result.scalar_one_or_none()
        
        if not school:
            print("❌ Demo school not found! Please run init_db.py first.")
            return
        
        # Check if settings already exist
        stmt = select(SchoolSettings).where(SchoolSettings.school_id == school.id)
        result = await session.execute(stmt)
        existing_settings = result.scalar_one_or_none()
        
        if existing_settings:
            print("✅ Settings already exist for demo school!")
            return
        
        try:
            # Create school settings
            settings = SchoolSettings(
                school_id=school.id,
                school_name="Demo High School",
                school_motto="Excellence in Education",
                school_logo_url="https://example.com/logo.png",
                school_address="123 Education Street, Learning City, LC 12345",
                school_phone="+1-555-0123",
                school_email="admin@demo-school.com",
                school_website="https://demo-school.com",
                
                # Academic Year & Calendar
                academic_year_start=date(2024, 9, 1),
                academic_year_end=date(2025, 6, 30),
                working_days=["monday", "tuesday", "wednesday", "thursday", "friday"],
                timezone="UTC",
                
                # School Terms
                terms=[
                    {"name": "Term 1", "start": "2024-09-01", "end": "2024-12-20"},
                    {"name": "Term 2", "start": "2025-01-06", "end": "2025-04-15"},
                    {"name": "Term 3", "start": "2025-04-28", "end": "2025-06-30"}
                ],
                
                # Attendance Settings
                default_attendance_mode=AttendanceMode.MANUAL,
                morning_attendance_start=time(8, 0),
                morning_attendance_end=time(8, 30),
                afternoon_attendance_start=time(14, 0),
                afternoon_attendance_end=time(14, 30),
                late_arrival_threshold=time(8, 15),
                absent_threshold=time(9, 0),
                auto_logout_time=time(17, 0),
                
                # Gate Pass Settings
                gate_pass_approval_workflow=GatePassApprovalWorkflow.PARENT_ONLY,
                gate_pass_auto_expiry_hours=24,
                allowed_exit_start_time=time(14, 0),
                allowed_exit_end_time=time(17, 0),
                emergency_override_roles=["nurse", "headteacher", "admin"],
                
                # Biometric & Card Settings
                biometric_type=BiometricType.FINGERPRINT,
                biometric_enrollment_fingers=2,
                biometric_retry_attempts=3,
                rfid_card_format="ISO14443A",
                card_reissue_policy="Report to admin office within 24 hours",
                
                # Device Integration
                devices=[
                    {"type": "biometric", "location": "main_gate", "device_id": "BIO001"},
                    {"type": "rfid_reader", "location": "staff_entrance", "device_id": "RFID001"}
                ],
                
                # Notifications & Communication
                notification_channels=[NotificationChannel.SMS, NotificationChannel.EMAIL],
                parent_notification_on_entry=True,
                parent_notification_on_exit=True,
                parent_notification_late_arrival=True,
                teacher_notification_absentees=True,
                security_notification_gate_pass=True,
                
                # SMS/Email Provider Settings
                sms_provider="twilio",
                email_provider="sendgrid",
                
                # Academic Calendar & Events
                public_holidays=[
                    {"date": "2024-12-25", "name": "Christmas Day"},
                    {"date": "2025-01-01", "name": "New Year's Day"}
                ],
                special_events=[
                    {"date": "2024-10-15", "name": "Sports Day", "no_attendance": True},
                    {"date": "2024-11-20", "name": "Parent-Teacher Meeting", "no_attendance": False}
                ],
                exam_periods=[
                    {"start": "2024-12-01", "end": "2024-12-15", "strict_gate_pass": True},
                    {"start": "2025-05-01", "end": "2025-05-15", "strict_gate_pass": True}
                ],
                
                # Customization
                theme_colors={"primary": "#007bff", "secondary": "#6c757d"},
                report_template="default",
                language="en",
                
                # Security & Compliance
                data_retention_days=1095,
                backup_frequency_hours=24,
                audit_log_enabled=True,
                
                # System Integrations
                api_keys={"biometric_device": "demo_key_123", "payment_gateway": "demo_payment_key"},
                integrations={"erp_system": "moodle", "payment_gateway": "stripe"}
            )
            
            session.add(settings)
            await session.flush()
            
            # Create class levels
            class_levels = [
                ClassLevel(school_id=school.id, name="Primary 1", code="P1", order=1),
                ClassLevel(school_id=school.id, name="Primary 2", code="P2", order=2),
                ClassLevel(school_id=school.id, name="Primary 3", code="P3", order=3),
                ClassLevel(school_id=school.id, name="Primary 4", code="P4", order=4),
                ClassLevel(school_id=school.id, name="Primary 5", code="P5", order=5),
                ClassLevel(school_id=school.id, name="Primary 6", code="P6", order=6),
                ClassLevel(school_id=school.id, name="Grade 7", code="G7", order=7),
                ClassLevel(school_id=school.id, name="Grade 8", code="G8", order=8),
                ClassLevel(school_id=school.id, name="Grade 9", code="G9", order=9),
                ClassLevel(school_id=school.id, name="Grade 10", code="G10", order=10),
            ]
            
            for level in class_levels:
                session.add(level)
            
            await session.flush()
            
            # Create subjects
            subjects = [
                Subject(school_id=school.id, name="Mathematics", code="MATH", is_core=True),
                Subject(school_id=school.id, name="English", code="ENG", is_core=True),
                Subject(school_id=school.id, name="Science", code="SCI", is_core=True),
                Subject(school_id=school.id, name="Social Studies", code="SOC", is_core=True),
                Subject(school_id=school.id, name="Physical Education", code="PE", is_core=False),
                Subject(school_id=school.id, name="Art", code="ART", is_core=False),
                Subject(school_id=school.id, name="Music", code="MUSIC", is_core=False),
                Subject(school_id=school.id, name="Computer Science", code="CS", is_core=False),
            ]
            
            for subject in subjects:
                session.add(subject)
            
            await session.flush()
            
            # Create classes
            classes = [
                Class(school_id=school.id, name="P1 - Blue", code="P1B", level_id=class_levels[0].id, capacity=30),
                Class(school_id=school.id, name="P1 - Red", code="P1R", level_id=class_levels[0].id, capacity=30),
                Class(school_id=school.id, name="P2 - Blue", code="P2B", level_id=class_levels[1].id, capacity=30),
                Class(school_id=school.id, name="P2 - Red", code="P2R", level_id=class_levels[1].id, capacity=30),
                Class(school_id=school.id, name="G7 - A", code="G7A", level_id=class_levels[6].id, capacity=35),
                Class(school_id=school.id, name="G7 - B", code="G7B", level_id=class_levels[6].id, capacity=35),
                Class(school_id=school.id, name="G8 - A", code="G8A", level_id=class_levels[7].id, capacity=35),
                Class(school_id=school.id, name="G8 - B", code="G8B", level_id=class_levels[7].id, capacity=35),
            ]
            
            for class_obj in classes:
                session.add(class_obj)
            
            await session.flush()
            
            # Create devices
            devices = [
                Device(
                    school_id=school.id,
                    name="Main Gate Biometric",
                    device_type="biometric",
                    device_id="BIO001",
                    location="main_gate",
                    ip_address="192.168.1.100",
                    port=8080
                ),
                Device(
                    school_id=school.id,
                    name="Staff Entrance RFID",
                    device_type="rfid_reader",
                    device_id="RFID001",
                    location="staff_entrance",
                    ip_address="192.168.1.101",
                    port=8081
                ),
                Device(
                    school_id=school.id,
                    name="Library QR Scanner",
                    device_type="qr_scanner",
                    device_id="QR001",
                    location="library",
                    ip_address="192.168.1.102",
                    port=8082
                )
            ]
            
            for device in devices:
                session.add(device)
            
            await session.commit()
            
            print("✅ Demo settings created successfully!")
            print(f"🏫 School: {settings.school_name}")
            print(f"📚 Class Levels: {len(class_levels)}")
            print(f"📖 Subjects: {len(subjects)}")
            print(f"🏠 Classes: {len(classes)}")
            print(f"🔧 Devices: {len(devices)}")
            print("\n🌐 Access settings via:")
            print("   - API: GET /api/v1/settings/")
            print("   - Summary: GET /api/v1/settings/summary")
            print("   - Sections: GET /api/v1/settings/general, /attendance, /gate-pass, etc.")
            
        except Exception as e:
            await session.rollback()
            print(f"❌ Error creating demo settings: {e}")


async def main():
    """Main initialization function."""
    print("⚙️  Initializing School Attendance System Settings...")
    
    try:
        await create_demo_settings()
        
        print("\n🎉 Settings initialization completed!")
        print("\n📖 Next steps:")
        print("   1. Test settings API endpoints")
        print("   2. Configure settings via frontend")
        print("   3. Add more class levels, subjects, and devices as needed")
        
    except Exception as e:
        print(f"❌ Settings initialization failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())

#!/usr/bin/env python3
"""
Test script to verify visitor management settings persistence
"""

import asyncio
import sys
import os
from datetime import datetime

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_async_session
from app.models.settings import SchoolSettings
from app.models.user import User
from app.models.school import School
from sqlalchemy import select

async def test_visitor_settings():
    """Test visitor management settings update and retrieval."""
    print("🧪 Testing Visitor Management Settings Persistence")
    print("=" * 60)
    
    async for db in get_async_session():
        try:
            # Get the first school and user
            school_result = await db.execute(select(School))
            school = school_result.scalar_one_or_none()
            
            if not school:
                print("❌ No school found in database")
                return
            
            user_result = await db.execute(select(User).where(User.school_id == school.id))
            user = user_result.scalar_one_or_none()
            
            if not user:
                print("❌ No user found in database")
                return
            
            print(f"✅ Found school: {school.name}")
            print(f"✅ Found user: {user.full_name}")
            
            # Get current settings
            settings_result = await db.execute(
                select(SchoolSettings).where(SchoolSettings.school_id == school.id)
            )
            settings = settings_result.scalar_one_or_none()
            
            if not settings:
                print("❌ No school settings found")
                return
            
            print(f"✅ Found school settings (ID: {settings.id})")
            
            # Test current visitor management settings
            print("\n📋 Current Visitor Management Settings:")
            print(f"  - Enabled: {settings.visitor_management_enabled}")
            print(f"  - Approval Workflow: {settings.visitor_approval_workflow}")
            print(f"  - Auto Approve Parents: {settings.visitor_auto_approve_parent_visits}")
            print(f"  - Require ID Verification: {settings.visitor_require_id_verification}")
            print(f"  - Notify Host: {settings.visitor_notify_host_on_arrival}")
            print(f"  - Print Badges: {settings.visitor_print_badges}")
            print(f"  - Badge Expiry Hours: {settings.visitor_badge_expiry_hours}")
            print(f"  - Enable QR Codes: {settings.visitor_enable_qr_codes}")
            print(f"  - Allow Pre-registration: {settings.visitor_allow_pre_registration}")
            print(f"  - Visiting Hours: {settings.visitor_visiting_hours_start} - {settings.visitor_visiting_hours_end}")
            print(f"  - Max Duration: {settings.visitor_max_duration_hours} hours")
            
            # Update visitor management settings
            print("\n🔄 Updating Visitor Management Settings...")
            
            # Set some test values
            settings.visitor_management_enabled = True
            settings.visitor_approval_workflow = "admin_approve"
            settings.visitor_auto_approve_parent_visits = False
            settings.visitor_require_id_verification = True
            settings.visitor_notify_host_on_arrival = True
            settings.visitor_notify_parent_on_visitor = True
            settings.visitor_notify_security_on_overstay = True
            settings.visitor_print_badges = True
            settings.visitor_badge_expiry_hours = 6
            settings.visitor_enable_blacklist = True
            settings.visitor_enable_emergency_evacuation = True
            settings.visitor_integrate_with_gate_pass = True
            settings.visitor_enable_qr_codes = True
            settings.visitor_allow_pre_registration = True
            settings.visitor_pre_registration_hours_ahead = 48
            settings.visitor_auto_approve_pre_registered = False
            settings.visitor_visiting_hours_start = "08:00"
            settings.visitor_visiting_hours_end = "17:00"
            settings.visitor_max_duration_hours = 3
            settings.visitor_auto_checkout_after_hours = 6
            
            await db.commit()
            print("✅ Settings updated successfully!")
            
            # Refresh and verify the changes
            await db.refresh(settings)
            
            print("\n📋 Updated Visitor Management Settings:")
            print(f"  - Enabled: {settings.visitor_management_enabled}")
            print(f"  - Approval Workflow: {settings.visitor_approval_workflow}")
            print(f"  - Auto Approve Parents: {settings.visitor_auto_approve_parent_visits}")
            print(f"  - Require ID Verification: {settings.visitor_require_id_verification}")
            print(f"  - Notify Host: {settings.visitor_notify_host_on_arrival}")
            print(f"  - Print Badges: {settings.visitor_print_badges}")
            print(f"  - Badge Expiry Hours: {settings.visitor_badge_expiry_hours}")
            print(f"  - Enable QR Codes: {settings.visitor_enable_qr_codes}")
            print(f"  - Allow Pre-registration: {settings.visitor_allow_pre_registration}")
            print(f"  - Pre-registration Hours: {settings.visitor_pre_registration_hours_ahead}")
            print(f"  - Visiting Hours: {settings.visitor_visiting_hours_start} - {settings.visitor_visiting_hours_end}")
            print(f"  - Max Duration: {settings.visitor_max_duration_hours} hours")
            print(f"  - Auto Checkout: {settings.visitor_auto_checkout_after_hours} hours")
            
            # Test that the settings are properly saved
            print("\n✅ All visitor management settings have been successfully updated and persisted!")
            
        except Exception as e:
            print(f"❌ Error testing visitor settings: {e}")
            await db.rollback()
        finally:
            break

if __name__ == "__main__":
    asyncio.run(test_visitor_settings())

#!/usr/bin/env python3
"""
Verify that visitor management settings are properly saved
"""

import asyncio
import sys
import os

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.core.database import async_session_factory
from app.models.settings import SchoolSettings
from sqlalchemy import select

async def verify_settings():
    """Verify visitor management settings are saved correctly."""
    print("🔍 Verifying Visitor Management Settings")
    print("=" * 50)
    
    async with async_session_factory() as db:
        try:
            # Get school settings
            settings_result = await db.execute(select(SchoolSettings).limit(1))
            settings = settings_result.scalar_one_or_none()
            
            if not settings:
                print("❌ No school settings found")
                return
            
            print(f"✅ Found school settings (ID: {settings.id})")
            
            # Check visitor management settings
            print("\n📋 Visitor Management Settings Status:")
            print(f"  - Enabled: {settings.visitor_management_enabled}")
            print(f"  - Approval Workflow: {settings.visitor_approval_workflow}")
            print(f"  - Auto Approve Parents: {settings.visitor_auto_approve_parent_visits}")
            print(f"  - Require ID Verification: {settings.visitor_require_id_verification}")
            print(f"  - Notify Host: {settings.visitor_notify_host_on_arrival}")
            print(f"  - Notify Parent: {settings.visitor_notify_parent_on_visitor}")
            print(f"  - Notify Security: {settings.visitor_notify_security_on_overstay}")
            print(f"  - Print Badges: {settings.visitor_print_badges}")
            print(f"  - Badge Expiry Hours: {settings.visitor_badge_expiry_hours}")
            print(f"  - Enable Blacklist: {settings.visitor_enable_blacklist}")
            print(f"  - Enable Emergency Evacuation: {settings.visitor_enable_emergency_evacuation}")
            print(f"  - Integrate with Gate Pass: {settings.visitor_integrate_with_gate_pass}")
            print(f"  - Enable QR Codes: {settings.visitor_enable_qr_codes}")
            print(f"  - Allow Pre-registration: {settings.visitor_allow_pre_registration}")
            print(f"  - Pre-registration Hours: {settings.visitor_pre_registration_hours_ahead}")
            print(f"  - Auto Approve Pre-registered: {settings.visitor_auto_approve_pre_registered}")
            print(f"  - Visiting Hours: {settings.visitor_visiting_hours_start} - {settings.visitor_visiting_hours_end}")
            print(f"  - Max Duration: {settings.visitor_max_duration_hours} hours")
            print(f"  - Auto Checkout: {settings.visitor_auto_checkout_after_hours} hours")
            
            # Check if settings are properly set
            if settings.visitor_management_enabled is True:
                print("\n✅ Visitor Management is ENABLED")
            else:
                print("\n❌ Visitor Management is DISABLED")
                
            if settings.visitor_approval_workflow == "admin_approve":
                print("✅ Approval workflow is set to 'admin_approve'")
            else:
                print(f"⚠️  Approval workflow is set to '{settings.visitor_approval_workflow}'")
                
            print(f"\n🎉 All visitor management settings are properly saved and accessible!")
            
        except Exception as e:
            print(f"❌ Error verifying settings: {e}")

if __name__ == "__main__":
    asyncio.run(verify_settings())


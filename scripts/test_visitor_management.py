#!/usr/bin/env python3
"""
Test script for Visitor Management System
"""

import asyncio
import sys
import os
from datetime import datetime, timedelta

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.core.database import get_session
from app.models.visitor import Visitor, VisitorStatus, VisitorType
from app.models.user import User, UserRole
from app.models.school import School
from app.models.settings import SchoolSettings
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


async def test_visitor_management():
    """Test the visitor management system."""
    print("🧪 Testing Visitor Management System")
    print("=" * 50)
    
    async for db in get_session():
        try:
            # Test 1: Check if visitor tables exist
            print("\n1. Checking database tables...")
            
            # Check if we have any schools
            school_stmt = select(School).limit(1)
            result = await db.execute(school_stmt)
            school = result.scalar_one_or_none()
            
            if not school:
                print("❌ No schools found. Please create a school first.")
                return
            
            print(f"✅ Found school: {school.name}")
            
            # Check if we have any users
            user_stmt = select(User).where(User.school_id == school.id).limit(1)
            result = await db.execute(user_stmt)
            user = result.scalar_one_or_none()
            
            if not user:
                print("❌ No users found. Please create a user first.")
                return
            
            print(f"✅ Found user: {user.full_name} (Role: {user.role})")
            
            # Test 2: Create a test visitor
            print("\n2. Creating test visitor...")
            
            test_visitor = Visitor(
                school_id=school.id,
                first_name="John",
                last_name="Doe",
                email="john.doe@example.com",
                phone="+1234567890",
                visitor_type=VisitorType.GUEST,
                purpose="Meeting with principal",
                requested_entry_time=datetime.now(),
                expected_exit_time=datetime.now() + timedelta(hours=2),
                host_user_id=user.id,
                status=VisitorStatus.PENDING
            )
            
            db.add(test_visitor)
            await db.commit()
            await db.refresh(test_visitor)
            
            print(f"✅ Created visitor: {test_visitor.full_name}")
            print(f"   - ID: {test_visitor.id}")
            print(f"   - Status: {test_visitor.status}")
            print(f"   - QR Code: {test_visitor.qr_code}")
            print(f"   - Badge Number: {test_visitor.badge_number}")
            
            # Test 3: Update visitor status
            print("\n3. Testing visitor status updates...")
            
            test_visitor.status = VisitorStatus.APPROVED
            test_visitor.approved_by_user_id = user.id
            test_visitor.approved_at = datetime.now()
            
            await db.commit()
            await db.refresh(test_visitor)
            
            print(f"✅ Updated visitor status to: {test_visitor.status}")
            
            # Test 4: Check in visitor
            print("\n4. Testing visitor check-in...")
            
            test_visitor.status = VisitorStatus.CHECKED_IN
            test_visitor.actual_entry_time = datetime.now()
            test_visitor.entry_gate = "main_gate"
            test_visitor.entry_security_guard_id = user.id
            test_visitor.entry_verified = True
            
            await db.commit()
            await db.refresh(test_visitor)
            
            print(f"✅ Checked in visitor at: {test_visitor.actual_entry_time}")
            print(f"   - Entry Gate: {test_visitor.entry_gate}")
            print(f"   - Entry Verified: {test_visitor.entry_verified}")
            
            # Test 5: Check out visitor
            print("\n5. Testing visitor check-out...")
            
            test_visitor.status = VisitorStatus.CHECKED_OUT
            test_visitor.actual_exit_time = datetime.now()
            test_visitor.exit_gate = "main_gate"
            test_visitor.exit_security_guard_id = user.id
            test_visitor.exit_verified = True
            
            await db.commit()
            await db.refresh(test_visitor)
            
            print(f"✅ Checked out visitor at: {test_visitor.actual_exit_time}")
            print(f"   - Exit Gate: {test_visitor.exit_gate}")
            print(f"   - Exit Verified: {test_visitor.exit_verified}")
            print(f"   - Visit Duration: {test_visitor.visit_duration_minutes} minutes")
            
            # Test 6: Query visitors
            print("\n6. Testing visitor queries...")
            
            visitors_stmt = select(Visitor).where(Visitor.school_id == school.id)
            result = await db.execute(visitors_stmt)
            visitors = result.scalars().all()
            
            print(f"✅ Found {len(visitors)} visitors in the system")
            
            for visitor in visitors:
                print(f"   - {visitor.full_name}: {visitor.status} ({visitor.visitor_type})")
            
            # Test 7: Check visitor properties
            print("\n7. Testing visitor properties...")
            
            print(f"✅ Visitor full name: {test_visitor.full_name}")
            print(f"✅ Visitor is overdue: {test_visitor.is_overdue}")
            print(f"✅ Visit duration: {test_visitor.visit_duration_minutes} minutes")
            
            print("\n🎉 All visitor management tests passed!")
            
        except Exception as e:
            print(f"❌ Error during testing: {e}")
            import traceback
            traceback.print_exc()
        finally:
            break


async def test_visitor_settings():
    """Test visitor settings integration."""
    print("\n🔧 Testing Visitor Settings Integration")
    print("=" * 50)
    
    async for db in get_session():
        try:
            # Check if school settings exist
            settings_stmt = select(SchoolSettings).limit(1)
            result = await db.execute(settings_stmt)
            settings = result.scalar_one_or_none()
            
            if settings:
                print("✅ Found school settings")
                print(f"   - Visitor management enabled: {getattr(settings, 'visitor_management_enabled', 'Not set')}")
                print(f"   - Approval workflow: {getattr(settings, 'visitor_approval_workflow', 'Not set')}")
                print(f"   - Auto approve parent visits: {getattr(settings, 'visitor_auto_approve_parent_visits', 'Not set')}")
                print(f"   - Require ID verification: {getattr(settings, 'visitor_require_id_verification', 'Not set')}")
            else:
                print("❌ No school settings found")
                
        except Exception as e:
            print(f"❌ Error testing settings: {e}")
        finally:
            break


if __name__ == "__main__":
    print("🚀 Starting Visitor Management System Tests")
    print("=" * 60)
    
    # Run tests
    asyncio.run(test_visitor_management())
    asyncio.run(test_visitor_settings())
    
    print("\n✅ Testing completed!")

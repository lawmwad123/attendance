#!/usr/bin/env python3
"""
Test script to verify super admin authentication.
"""

import asyncio
import sys
import os
from pathlib import Path

# Add the app directory to the Python path
sys.path.append(str(Path(__file__).parent.parent))

from app.core.database import async_session_factory
from app.core.security import verify_password, create_access_token, verify_token
from app.models.super_admin import SuperAdmin
from sqlalchemy import select


async def test_admin_auth():
    """Test super admin authentication."""
    
    print("🧪 Testing Super Admin Authentication")
    print("=" * 50)
    
    try:
        async with async_session_factory() as session:
            # Test 1: Check if admin exists
            print("\n1. Checking if admin exists...")
            stmt = select(SuperAdmin).where(SuperAdmin.email == "lawmwad@gmail.com")
            result = await session.execute(stmt)
            admin = result.scalar_one_or_none()
            
            if not admin:
                print("❌ Admin not found!")
                return
            
            print(f"✅ Admin found: {admin.first_name} {admin.last_name}")
            print(f"   Role: {admin.role.value}")
            print(f"   Active: {admin.is_active}")
            
            # Test 2: Test password verification
            print("\n2. Testing password verification...")
            test_password = "Law2@admin"
            is_valid = verify_password(test_password, admin.hashed_password)
            
            if is_valid:
                print("✅ Password verification successful")
            else:
                print("❌ Password verification failed")
                return
            
            # Test 3: Test token creation
            print("\n3. Testing token creation...")
            token = create_access_token(
                subject=admin.id,
                additional_claims={"role": "super_admin", "admin_email": admin.email}
            )
            print(f"✅ Token created: {token[:50]}...")
            
            # Test 4: Test token verification
            print("\n4. Testing token verification...")
            payload = verify_token(token)
            
            if payload:
                print("✅ Token verification successful")
                print(f"   Admin ID: {payload.get('sub')}")
                print(f"   Role: {payload.get('role')}")
                print(f"   Email: {payload.get('admin_email')}")
            else:
                print("❌ Token verification failed")
                return
            
            # Test 5: Test invalid token
            print("\n5. Testing invalid token...")
            invalid_payload = verify_token("invalid_token")
            
            if not invalid_payload:
                print("✅ Invalid token correctly rejected")
            else:
                print("❌ Invalid token incorrectly accepted")
            
            print("\n🎉 All authentication tests passed!")
            
    except Exception as e:
        print(f"❌ Error during testing: {e}")
        return


if __name__ == "__main__":
    asyncio.run(test_admin_auth())

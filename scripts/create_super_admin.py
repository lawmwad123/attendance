#!/usr/bin/env python3
"""
Script to create the first super admin user.
This should be run once to set up the initial system administrator.
"""

import asyncio
import sys
import os
from pathlib import Path

# Add the app directory to the Python path
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import async_session_factory
from app.core.security import get_password_hash
from app.models.super_admin import SuperAdmin, SuperAdminRole, SuperAdminStatus


async def create_super_admin():
    """Create the first super admin user."""
    
    print("🚀 Creating Super Admin User")
    print("=" * 50)
    
    # Get user input
    print("\nPlease provide the following information:")
    
    email = input("Email address: ").strip()
    if not email:
        print("❌ Email is required!")
        return
    
    username = input("Username: ").strip()
    if not username:
        print("❌ Username is required!")
        return
    
    first_name = input("First name: ").strip()
    if not first_name:
        print("❌ First name is required!")
        return
    
    last_name = input("Last name: ").strip()
    if not last_name:
        print("❌ Last name is required!")
        return
    
    password = input("Password (min 8 characters): ").strip()
    if len(password) < 8:
        print("❌ Password must be at least 8 characters!")
        return
    
    phone = input("Phone number (optional): ").strip() or None
    
    # Role selection
    print("\nSelect role:")
    print("1. SYSTEM_DEVELOPER (Full system access)")
    print("2. SYSTEM_ADMIN (System administration)")
    print("3. SUPPORT_AGENT (Support and troubleshooting)")
    print("4. FINANCIAL_ADMIN (Financial management only)")
    
    role_choice = input("Enter choice (1-4): ").strip()
    role_map = {
        "1": SuperAdminRole.SYSTEM_DEVELOPER,
        "2": SuperAdminRole.SYSTEM_ADMIN,
        "3": SuperAdminRole.SUPPORT_AGENT,
        "4": SuperAdminRole.FINANCIAL_ADMIN,
    }
    
    role = role_map.get(role_choice)
    if not role:
        print("❌ Invalid role choice!")
        return
    
    bio = input("Bio (optional): ").strip() or None
    
    # Confirm creation
    print(f"\n📋 Summary:")
    print(f"Email: {email}")
    print(f"Username: {username}")
    print(f"Name: {first_name} {last_name}")
    print(f"Role: {role.value}")
    print(f"Phone: {phone or 'Not provided'}")
    
    confirm = input("\nCreate this super admin user? (y/N): ").strip().lower()
    if confirm != 'y':
        print("❌ Cancelled!")
        return
    
    try:
        # Create database session
        async with async_session_factory() as session:
            # Check if admin with this email already exists
            from sqlalchemy import select
            stmt = select(SuperAdmin).where(SuperAdmin.email == email.lower())
            result = await session.execute(stmt)
            existing_admin = result.scalar_one_or_none()
            
            if existing_admin:
                print(f"❌ Admin with email {email} already exists!")
                return
            
            # Check if admin with this username already exists
            stmt = select(SuperAdmin).where(SuperAdmin.username == username)
            result = await session.execute(stmt)
            existing_username = result.scalar_one_or_none()
            
            if existing_username:
                print(f"❌ Admin with username {username} already exists!")
                return
            
            # Create the super admin
            admin = SuperAdmin(
                email=email.lower(),
                username=username,
                first_name=first_name,
                last_name=last_name,
                phone=phone,
                hashed_password=get_password_hash(password),
                role=role,
                bio=bio,
                is_active=True,
                is_verified=True,
                status=SuperAdminStatus.ACTIVE
            )
            
            session.add(admin)
            await session.commit()
            await session.refresh(admin)
            
            print(f"\n✅ Super admin user created successfully!")
            print(f"ID: {admin.id}")
            print(f"Email: {admin.email}")
            print(f"Username: {admin.username}")
            print(f"Role: {admin.role.value}")
            print(f"\n🔐 You can now log in at: http://localhost:5173/admin/login")
            
    except Exception as e:
        print(f"❌ Error creating super admin: {e}")
        return


if __name__ == "__main__":
    asyncio.run(create_super_admin())

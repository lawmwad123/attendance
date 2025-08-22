#!/usr/bin/env python3
"""
Database initialization script for the School Attendance System.
Creates database tables and optionally creates a demo school with admin user.
"""

import asyncio
import sys
import os

# Add the project root to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import init_db, async_session_factory
from app.core.security import get_password_hash
from app.models.school import School
from app.models.user import User, UserRole, UserStatus
from sqlalchemy import select


async def create_demo_school():
    """Create a demo school with admin user."""
    async with async_session_factory() as session:
        # Check if demo school already exists
        stmt = select(School).where(School.slug == "demo")
        result = await session.execute(stmt)
        existing_school = result.scalar_one_or_none()
        
        if existing_school:
            print("Demo school already exists!")
            return
        
        try:
            # Create demo school
            demo_school = School(
                name="Demo High School",
                slug="demo",
                address="123 Education Street, Learning City, LC 12345",
                phone="+1-555-0123",
                email="admin@demo-school.com",
                principal_name="Dr. Jane Smith",
                timezone="UTC",
                school_start_time="08:00",
                school_end_time="15:30"
            )
            
            session.add(demo_school)
            await session.flush()  # Get the school ID
            
            # Create admin user
            admin_user = User(
                email="admin@demo-school.com",
                first_name="Admin",
                last_name="User",
                phone="+1-555-0124",
                hashed_password=get_password_hash("admin123"),
                role=UserRole.ADMIN,
                status=UserStatus.ACTIVE,
                is_active=True,
                is_verified=True,
                school_id=demo_school.id,
                employee_id="ADMIN001"
            )
            
            session.add(admin_user)
            await session.commit()
            
            print("✅ Demo school created successfully!")
            print("🏫 School: Demo High School (slug: demo)")
            print("👤 Admin: admin@demo-school.com")
            print("🔑 Password: admin123")
            print("\n🌐 Access via:")
            print("   - Header: X-Tenant-ID: demo")
            print("   - Query: ?tenant=demo")
            print("   - Subdomain: demo.localhost:8000")
            
        except Exception as e:
            await session.rollback()
            print(f"❌ Error creating demo school: {e}")


async def main():
    """Main initialization function."""
    print("🚀 Initializing School Attendance System Database...")
    
    try:
        # Initialize database tables
        print("📋 Creating database tables...")
        await init_db()
        print("✅ Database tables created successfully!")
        
        # Ask if user wants to create demo school
        create_demo = input("\n🤔 Create demo school? (y/N): ").lower().strip()
        
        if create_demo in ['y', 'yes']:
            await create_demo_school()
        
        print("\n🎉 Database initialization completed!")
        print("\n📖 Next steps:")
        print("   1. Start the server: uvicorn app.main:app --reload")
        print("   2. Visit: http://localhost:8000/docs")
        print("   3. Login with demo credentials (if created)")
        
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main()) 
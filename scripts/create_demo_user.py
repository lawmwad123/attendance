#!/usr/bin/env python3
"""
Script to create a test user in the demo school.
"""

import asyncio
import sys
import os

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.core.database import get_session
from app.core.security import get_password_hash
from app.models.user import User, UserRole, UserStatus


async def create_demo_user():
    """Create a test user in the demo school."""
    async for db in get_session():
        try:
            # Check if user already exists in demo school
            from sqlalchemy import select
            result = await db.execute(
                select(User).where(
                    User.email == "teacher@demo-school.com",
                    User.school_id == 1
                )
            )
            existing_user = result.scalar_one_or_none()
            
            if existing_user:
                print(f"User {existing_user.email} already exists in demo school (ID: {existing_user.id})")
                return existing_user
            
            # Create new user in demo school
            new_user = User(
                email="teacher@demo-school.com",
                username="demo_teacher",
                first_name="Demo",
                last_name="Teacher",
                phone="+1234567890",
                role=UserRole.TEACHER,
                status=UserStatus.ACTIVE,
                is_active=True,
                is_verified=True,
                hashed_password=get_password_hash("demo123"),
                school_id=1
            )
            
            db.add(new_user)
            await db.commit()
            await db.refresh(new_user)
            
            print(f"Created demo user: {new_user.email} (ID: {new_user.id})")
            print(f"Password: demo123")
            return new_user
            
        except Exception as e:
            await db.rollback()
            print(f"Error creating demo user: {e}")
            raise
        finally:
            break


if __name__ == "__main__":
    asyncio.run(create_demo_user())

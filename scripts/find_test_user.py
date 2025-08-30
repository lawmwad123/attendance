#!/usr/bin/env python3
"""
Script to find where the test user exists.
"""

import asyncio
import sys
import os

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.core.database import get_session
from app.models.user import User
from app.models.school import School
from sqlalchemy import select


async def find_test_user():
    """Find where the test user exists."""
    async for db in get_session():
        try:
            # Find test user in any school
            result = await db.execute(
                select(User).where(User.email == "lawmwad@gmail.com")
            )
            test_user = result.scalar_one_or_none()
            
            if test_user:
                # Get the school info
                school_result = await db.execute(
                    select(School).where(School.id == test_user.school_id)
                )
                school = school_result.scalar_one_or_none()
                
                print(f"Test user found: {test_user.email} (ID: {test_user.id})")
                print(f"Role: {test_user.role}")
                print(f"Active: {test_user.is_active}")
                print(f"School ID: {test_user.school_id}")
                if school:
                    print(f"School: {school.name} (slug: {school.slug})")
                return test_user
            else:
                print("Test user not found!")
                return None
                
        except Exception as e:
            print(f"Error finding test user: {e}")
            return None
        finally:
            break


if __name__ == "__main__":
    asyncio.run(find_test_user())

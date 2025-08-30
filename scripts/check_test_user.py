#!/usr/bin/env python3
"""
Script to check if test user exists in the demo school.
"""

import asyncio
import sys
import os

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.core.database import get_session
from app.models.user import User
from sqlalchemy import select


async def check_test_user():
    """Check if test user exists."""
    async for db in get_session():
        try:
            # Check for test user in demo school (school_id = 1)
            result = await db.execute(
                select(User).where(
                    User.email == "lawmwad@gmail.com",
                    User.school_id == 1
                )
            )
            test_user = result.scalar_one_or_none()
            
            if test_user:
                print(f"Test user found: {test_user.email} (ID: {test_user.id})")
                print(f"Role: {test_user.role}")
                print(f"Active: {test_user.is_active}")
                print(f"School ID: {test_user.school_id}")
                return test_user
            else:
                print("Test user not found!")
                return None
                
        except Exception as e:
            print(f"Error checking test user: {e}")
            return None
        finally:
            break


if __name__ == "__main__":
    asyncio.run(check_test_user())

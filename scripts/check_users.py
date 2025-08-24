#!/usr/bin/env python3
"""
Script to check users in the database.
"""

import asyncio
import sys
import os

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.core.database import get_session
from app.models.user import User
from sqlalchemy import select


async def check_users():
    """Check users in the database."""
    async for db in get_session():
        try:
            # Get all users
            result = await db.execute(select(User))
            users = result.scalars().all()
            
            print(f"Found {len(users)} users:")
            for user in users:
                print(f"- ID: {user.id}, Email: {user.email}, Role: {user.role}, School ID: {user.school_id}")
            
            # Group by school
            schools = {}
            for user in users:
                if user.school_id not in schools:
                    schools[user.school_id] = []
                schools[user.school_id].append(user)
            
            print(f"\nUsers by school:")
            for school_id, school_users in schools.items():
                print(f"\nSchool ID {school_id} ({len(school_users)} users):")
                for user in school_users:
                    print(f"  - {user.email} ({user.role})")
                    
        except Exception as e:
            print(f"Error: {e}")
        finally:
            break


if __name__ == "__main__":
    asyncio.run(check_users())

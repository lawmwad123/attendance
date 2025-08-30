#!/usr/bin/env python3
"""
Script to check if demo school exists in the database.
"""

import asyncio
import sys
import os

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.core.database import get_session
from app.models.school import School
from sqlalchemy import select


async def check_demo_school():
    """Check if demo school exists."""
    async for db in get_session():
        try:
            # Check for demo school
            result = await db.execute(
                select(School).where(School.slug == "demo")
            )
            demo_school = result.scalar_one_or_none()
            
            if demo_school:
                print(f"Demo school found: {demo_school.name} (ID: {demo_school.id})")
                print(f"Active: {demo_school.is_active}")
                return demo_school
            else:
                print("Demo school not found!")
                return None
                
        except Exception as e:
            print(f"Error checking demo school: {e}")
            return None
        finally:
            break


if __name__ == "__main__":
    asyncio.run(check_demo_school())

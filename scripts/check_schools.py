#!/usr/bin/env python3
"""
Script to check schools in the database.
"""

import asyncio
import sys
import os

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.core.database import get_session
from app.models.school import School
from sqlalchemy import select


async def check_schools():
    """Check schools in the database."""
    async for db in get_session():
        try:
            # Get all schools
            result = await db.execute(select(School))
            schools = result.scalars().all()
            
            print(f"Found {len(schools)} schools:")
            for school in schools:
                print(f"- ID: {school.id}, Name: {school.name}, Slug: {school.slug}")
                    
        except Exception as e:
            print(f"Error: {e}")
        finally:
            break


if __name__ == "__main__":
    asyncio.run(check_schools())

#!/usr/bin/env python3
"""
Script to get the full reset token for testing.
"""

import asyncio
import sys
import os

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.core.database import get_session
from app.models.user import User
from sqlalchemy import select


async def get_full_token():
    """Get the full reset token for the user."""
    async for db in get_session():
        try:
            # Get user with reset token
            result = await db.execute(
                select(User).where(
                    User.email == "lawmwad@gmail.com"
                )
            )
            user = result.scalar_one_or_none()
            
            if user and user.reset_token:
                print(f"Full token for {user.email}: {user.reset_token}")
                print(f"Token length: {len(user.reset_token)}")
                return user.reset_token
            else:
                print("No token found")
                return None
                    
        except Exception as e:
            print(f"Error: {e}")
            return None
        finally:
            break


if __name__ == "__main__":
    asyncio.run(get_full_token())

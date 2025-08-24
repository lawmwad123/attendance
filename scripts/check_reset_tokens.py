#!/usr/bin/env python3
"""
Script to check reset tokens in the database for debugging.
"""

import asyncio
import sys
import os
from datetime import datetime

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.core.database import get_session
from app.models.user import User
from sqlalchemy import select


async def check_reset_tokens():
    """Check reset tokens in the database."""
    async for db in get_session():
        try:
            # Get all users with reset tokens
            result = await db.execute(
                select(User).where(User.reset_token.isnot(None))
            )
            users_with_tokens = result.scalars().all()
            
            print(f"Found {len(users_with_tokens)} users with reset tokens:")
            for user in users_with_tokens:
                print(f"- User ID: {user.id}")
                print(f"  Email: {user.email}")
                print(f"  School ID: {user.school_id}")
                print(f"  Token: {user.reset_token[:10]}...")
                print(f"  Expires: {user.reset_token_expires}")
                print(f"  Is expired: {user.reset_token_expires < datetime.utcnow() if user.reset_token_expires else 'No expiry'}")
                print()
                    
        except Exception as e:
            print(f"Error: {e}")
        finally:
            break


if __name__ == "__main__":
    asyncio.run(check_reset_tokens())

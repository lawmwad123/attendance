#!/usr/bin/env python3
"""
Script to test reset password functionality with a real token.
"""

import asyncio
import sys
import os
import requests

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.core.database import get_session
from app.models.user import User
from sqlalchemy import select


async def get_user_token():
    """Get a user with a reset token."""
    async for db in get_session():
        try:
            # Get user with reset token
            result = await db.execute(
                select(User).where(
                    User.email == "lawmwad@gmail.com"
                )
            )
            user = result.scalar_one_or_none()
            
            if user:
                print(f"Found user: {user.email}, Token: {user.reset_token[:10] if user.reset_token else 'None'}...")
                print(f"Token is None: {user.reset_token is None}")
                print(f"Token value: {user.reset_token}")
                result = (user.reset_token, user.school_id)
                print(f"Returning: {result}")
                return result
            else:
                print("No user found with reset token")
                return None, None
                    
        except Exception as e:
            print(f"Error: {e}")
            return None, None
        finally:
            break


def test_reset_password():
    """Test the reset password endpoint."""
    # Get token
    result = asyncio.run(get_user_token())
    
    if not result:
        print("No result from get_user_token")
        return
    
    token, school_id = result
    
    if not token:
        print("No token found")
        return
    
    print(f"Testing with token: {token[:10]}...")
    print(f"School ID: {school_id}")
    
    # Determine tenant based on school ID
    tenant = "st-marys-academy" if school_id == 2 else "demo"
    print(f"Using tenant: {tenant}")
    
    # Test reset password endpoint
    url = "http://localhost:8000/api/v1/auth/reset-password"
    headers = {
        "Content-Type": "application/json",
        "X-Tenant-ID": tenant
    }
    data = {
        "token": token,
        "new_password": "newpassword123"
    }
    
    try:
        response = requests.post(url, headers=headers, json=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ Reset password successful!")
        else:
            print("❌ Reset password failed!")
            
    except Exception as e:
        print(f"Error making request: {e}")


if __name__ == "__main__":
    test_reset_password()

#!/usr/bin/env python3
"""
Script to set up database password and test connection.
Run this script to configure your database password.
"""

import os
import sys
import getpass
from pathlib import Path

# Add the app directory to the Python path
sys.path.append(str(Path(__file__).parent.parent))

from app.core.config import settings
from app.core.database import engine
import asyncio


def create_env_file():
    """Create a .env file with database configuration."""
    env_content = f"""# Database Configuration
POSTGRES_SERVER={settings.POSTGRES_SERVER}
POSTGRES_USER={settings.POSTGRES_USER}
POSTGRES_PASSWORD={settings.POSTGRES_PASSWORD}
POSTGRES_DB={settings.POSTGRES_DB}
POSTGRES_PORT={settings.POSTGRES_PORT}

# Security
SECRET_KEY={settings.SECRET_KEY}

# Environment
DEBUG={settings.DEBUG}
ENVIRONMENT={settings.ENVIRONMENT}

# Redis
REDIS_URL={settings.REDIS_URL}

# CORS
CORS_ORIGINS={settings.CORS_ORIGINS}

# Frontend URL
FRONTEND_URL={settings.FRONTEND_URL}

# Multi-tenancy
DEFAULT_TENANT_ID={settings.DEFAULT_TENANT_ID}
"""
    
    env_file = Path(__file__).parent.parent / ".env"
    with open(env_file, "w") as f:
        f.write(env_content)
    
    print(f"✅ Created .env file at {env_file}")
    return env_file


async def test_database_connection():
    """Test the database connection."""
    try:
        print("🔍 Testing database connection...")
        print(f"Database URL: {settings.FINAL_DATABASE_URL}")
        
        # Test connection
        async with engine.begin() as conn:
            result = await conn.execute("SELECT 1 as test")
            await result.fetchone()
            print("✅ Database connection successful!")
            return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False


def setup_postgres_password():
    """Interactive setup for PostgreSQL password."""
    print("🔐 Setting up PostgreSQL password...")
    print("\nYou have several options:")
    print("1. Use environment variable (recommended for production)")
    print("2. Set password directly in config (for development only)")
    print("3. Use .env file (recommended for development)")
    
    choice = input("\nChoose option (1/2/3): ").strip()
    
    if choice == "1":
        print("\nSet the environment variable:")
        print("export POSTGRES_PASSWORD='your_password_here'")
        print("\nOr add it to your shell profile (.bashrc, .zshrc, etc.)")
        
    elif choice == "2":
        password = getpass.getpass("Enter PostgreSQL password: ")
        if password:
            # Update the config file
            config_file = Path(__file__).parent.parent / "app" / "core" / "config.py"
            with open(config_file, "r") as f:
                content = f.read()
            
            # Replace the password line
            import re
            content = re.sub(
                r'POSTGRES_PASSWORD: str = "[^"]*"',
                f'POSTGRES_PASSWORD: str = "{password}"',
                content
            )
            
            with open(config_file, "w") as f:
                f.write(content)
            
            print("✅ Password updated in config file")
            
    elif choice == "3":
        password = getpass.getpass("Enter PostgreSQL password: ")
        if password:
            # Create .env file
            env_file = create_env_file()
            print(f"✅ Created .env file. Please edit it and set POSTGRES_PASSWORD={password}")
    
    else:
        print("Invalid choice. Please run the script again.")


async def main():
    """Main function."""
    print("🚀 Database Password Setup Script")
    print("=" * 40)
    
    # Check if .env file exists
    env_file = Path(__file__).parent.parent / ".env"
    if env_file.exists():
        print(f"✅ .env file found at {env_file}")
        print("The file contains environment variables that will override config defaults.")
    else:
        print("❌ No .env file found")
    
    # Show current configuration
    print(f"\n📋 Current Database Configuration:")
    print(f"Server: {settings.POSTGRES_SERVER}")
    print(f"User: {settings.POSTGRES_USER}")
    print(f"Database: {settings.POSTGRES_DB}")
    print(f"Port: {settings.POSTGRES_PORT}")
    print(f"Password: {'*' * len(settings.POSTGRES_PASSWORD) if settings.POSTGRES_PASSWORD else '(not set)'}")
    
    # Test current connection
    if await test_database_connection():
        print("\n🎉 Database is already working!")
        return
    
    # Setup password if connection failed
    print("\n" + "=" * 40)
    setup_postgres_password()
    
    # Test connection again
    print("\n" + "=" * 40)
    if await test_database_connection():
        print("🎉 Database setup successful!")
    else:
        print("❌ Database setup failed. Please check your PostgreSQL configuration.")
        print("\nCommon issues:")
        print("1. PostgreSQL service is not running")
        print("2. Wrong password")
        print("3. Database doesn't exist")
        print("4. User doesn't have permissions")


if __name__ == "__main__":
    asyncio.run(main())

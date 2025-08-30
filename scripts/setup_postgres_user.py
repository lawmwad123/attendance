#!/usr/bin/env python3
"""
Script to set up PostgreSQL user and database.
This script helps you create the database user and set up permissions.
"""

import subprocess
import sys
import getpass
from pathlib import Path


def run_command(command, description):
    """Run a shell command and handle errors."""
    print(f"🔧 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} successful")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed: {e}")
        print(f"Error output: {e.stderr}")
        return False


def setup_postgres_user():
    """Set up PostgreSQL user and database."""
    print("🚀 PostgreSQL Setup Script")
    print("=" * 40)
    
    # Get database details
    db_name = input("Enter database name (default: attendance_db): ").strip() or "attendance_db"
    db_user = input("Enter database user (default: postgres): ").strip() or "postgres"
    
    # Get password securely
    password = getpass.getpass(f"Enter password for user '{db_user}': ")
    if not password:
        print("❌ Password cannot be empty")
        return False
    
    print(f"\n📋 Setup Summary:")
    print(f"Database: {db_name}")
    print(f"User: {db_user}")
    print(f"Password: {'*' * len(password)}")
    
    confirm = input("\nProceed with setup? (y/N): ").strip().lower()
    if confirm != 'y':
        print("Setup cancelled")
        return False
    
    # Check if PostgreSQL is running
    if not run_command("pg_isready", "Checking PostgreSQL service"):
        print("❌ PostgreSQL is not running. Please start PostgreSQL first.")
        print("On Ubuntu/Debian: sudo systemctl start postgresql")
        print("On macOS: brew services start postgresql")
        return False
    
    # Create database if it doesn't exist
    create_db_cmd = f"createdb -U postgres {db_name}"
    if not run_command(create_db_cmd, f"Creating database '{db_name}'"):
        print("⚠️  Database might already exist, continuing...")
    
    # Create user if it doesn't exist
    create_user_cmd = f"psql -U postgres -c \"CREATE USER {db_user} WITH PASSWORD '{password}';\""
    if not run_command(create_user_cmd, f"Creating user '{db_user}'"):
        print("⚠️  User might already exist, continuing...")
    
    # Grant privileges
    grant_cmd = f"psql -U postgres -c \"GRANT ALL PRIVILEGES ON DATABASE {db_name} TO {db_user};\""
    if not run_command(grant_cmd, f"Granting privileges to '{db_user}'"):
        print("⚠️  Privileges might already be granted, continuing...")
    
    # Grant schema privileges
    schema_cmd = f"psql -U postgres -d {db_name} -c \"GRANT ALL ON SCHEMA public TO {db_user};\""
    if not run_command(schema_cmd, f"Granting schema privileges to '{db_user}'"):
        print("⚠️  Schema privileges might already be granted, continuing...")
    
    print("\n🎉 PostgreSQL setup completed!")
    print(f"\n📝 Next steps:")
    print(f"1. Update your .env file or config with:")
    print(f"   POSTGRES_USER={db_user}")
    print(f"   POSTGRES_PASSWORD={password}")
    print(f"   POSTGRES_DB={db_name}")
    print(f"2. Run the database password setup script:")
    print(f"   python scripts/setup_database_password.py")
    
    return True


def test_connection():
    """Test the database connection."""
    print("\n🔍 Testing database connection...")
    
    # Get connection details
    db_name = input("Enter database name (default: attendance_db): ").strip() or "attendance_db"
    db_user = input("Enter database user (default: postgres): ").strip() or "postgres"
    password = getpass.getpass(f"Enter password for user '{db_user}': ")
    
    # Test connection
    test_cmd = f"PGPASSWORD={password} psql -U {db_user} -d {db_name} -c 'SELECT 1;'"
    if run_command(test_cmd, "Testing database connection"):
        print("✅ Database connection successful!")
        return True
    else:
        print("❌ Database connection failed!")
        return False


def main():
    """Main function."""
    print("Choose an option:")
    print("1. Set up PostgreSQL user and database")
    print("2. Test database connection")
    print("3. Exit")
    
    choice = input("\nEnter choice (1/2/3): ").strip()
    
    if choice == "1":
        setup_postgres_user()
    elif choice == "2":
        test_connection()
    elif choice == "3":
        print("Goodbye!")
    else:
        print("Invalid choice")


if __name__ == "__main__":
    main()

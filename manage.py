#!/usr/bin/env python3
"""
Management script for the School Attendance System.
Provides commands to start, stop, and manage the application.
"""

import os
import sys
import subprocess
import argparse
from pathlib import Path


def run_command(cmd, description=""):
    """Run a command and handle errors."""
    print(f"🔄 {description}")
    try:
        result = subprocess.run(cmd, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully!")
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed!")
        if e.stdout:
            print("STDOUT:", e.stdout)
        if e.stderr:
            print("STDERR:", e.stderr)
        return False


def start_server():
    """Start the FastAPI server."""
    print("🚀 Starting School Attendance System...")
    
    # Check if virtual environment is activated
    if not os.environ.get('VIRTUAL_ENV'):
        print("⚠️  Virtual environment not detected. Activating...")
        venv_path = Path("venv/bin/activate")
        if not venv_path.exists():
            print("❌ Virtual environment not found. Please run: python -m venv venv")
            return False
    
    # Start the server
    cmd = "uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
    print(f"🌐 Server will be available at: http://localhost:8000")
    print(f"📚 API Documentation: http://localhost:8000/docs")
    print(f"🔧 Alternative docs: http://localhost:8000/redoc")
    print("\nPress Ctrl+C to stop the server")
    
    try:
        subprocess.run(cmd, shell=True)
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
        return True


def init_database():
    """Initialize the database."""
    print("🗄️  Initializing database...")
    success = run_command("python scripts/init_db.py", "Database initialization")
    if success:
        print("🔄 Initializing settings...")
        run_command("python scripts/init_settings.py", "Settings initialization")
    return success


def run_migrations():
    """Run database migrations."""
    print("🔄 Running database migrations...")
    return run_command("alembic upgrade head", "Database migrations")


def create_migration():
    """Create a new migration."""
    message = input("Enter migration message: ")
    if not message:
        print("❌ Migration message is required")
        return False
    return run_command(f'alembic revision --autogenerate -m "{message}"', "Creating migration")


def main():
    parser = argparse.ArgumentParser(description="School Attendance System Management")
    parser.add_argument("command", choices=["start", "init-db", "migrate", "create-migration", "help"],
                       help="Command to run")
    
    args = parser.parse_args()
    
    if args.command == "start":
        start_server()
    elif args.command == "init-db":
        init_database()
    elif args.command == "migrate":
        run_migrations()
    elif args.command == "create-migration":
        create_migration()
    elif args.command == "help":
        print("""
🏫 School Attendance System Management

Available commands:
  start           - Start the FastAPI server
  init-db         - Initialize database with demo data
  migrate         - Run database migrations
  create-migration - Create a new migration
  help            - Show this help message

Examples:
  python manage.py start
  python manage.py init-db
  python manage.py migrate
        """)


if __name__ == "__main__":
    main()

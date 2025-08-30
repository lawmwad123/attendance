# Database Setup Guide

This guide will help you set up PostgreSQL with password authentication for the Attendance System.

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

1. **Run the PostgreSQL setup script:**
   ```bash
   python scripts/setup_postgres_user.py
   ```
   This script will:
   - Create the database user
   - Set up the database
   - Grant necessary permissions
   - Test the connection

2. **Run the database password setup script:**
   ```bash
   python scripts/setup_database_password.py
   ```
   This script will:
   - Help you configure the password in your application
   - Test the database connection
   - Create a `.env` file if needed

### Option 2: Manual Setup

## 📋 Prerequisites

1. **PostgreSQL installed and running**
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   sudo systemctl start postgresql
   sudo systemctl enable postgresql
   
   # macOS
   brew install postgresql
   brew services start postgresql
   ```

2. **Python dependencies installed**
   ```bash
   pip install -r requirements.txt
   ```

## 🔧 Manual Database Setup

### 1. Create Database User

Connect to PostgreSQL as the superuser:
```bash
sudo -u postgres psql
```

Create a new user and database:
```sql
-- Create user
CREATE USER attendance_user WITH PASSWORD 'your_secure_password';

-- Create database
CREATE DATABASE attendance_db;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE attendance_db TO attendance_user;

-- Connect to the database
\c attendance_db

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO attendance_user;

-- Exit
\q
```

### 2. Configure Application

#### Option A: Using Environment Variables (Recommended for Production)

Set environment variables:
```bash
export POSTGRES_USER=attendance_user
export POSTGRES_PASSWORD=your_secure_password
export POSTGRES_DB=attendance_db
export POSTGRES_SERVER=localhost
export POSTGRES_PORT=5432
```

#### Option B: Using .env File (Recommended for Development)

Create a `.env` file in the project root:
```bash
# Database Configuration
POSTGRES_SERVER=localhost
POSTGRES_USER=attendance_user
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=attendance_db
POSTGRES_PORT=5432

# Security
SECRET_KEY=your-super-secret-key-change-this-in-production

# Environment
DEBUG=True
ENVIRONMENT=development

# Redis
REDIS_URL=redis://localhost:6379

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://127.0.0.1:5173

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Multi-tenancy
DEFAULT_TENANT_ID=demo-school
```

#### Option C: Direct Configuration (Not Recommended for Production)

Edit `app/core/config.py` and update the password:
```python
POSTGRES_PASSWORD: str = "your_secure_password"
```

## 🧪 Test Database Connection

### Using the Test Script
```bash
python scripts/setup_database_password.py
```

### Manual Testing
```bash
# Test with psql
PGPASSWORD=your_secure_password psql -U attendance_user -d attendance_db -c "SELECT 1;"

# Test with Python
python -c "
from app.core.config import settings
from app.core.database import engine
import asyncio

async def test():
    try:
        async with engine.begin() as conn:
            result = await conn.execute('SELECT 1')
            print('✅ Database connection successful!')
    except Exception as e:
        print(f'❌ Database connection failed: {e}')

asyncio.run(test())
"
```

## 🔄 Initialize Database Tables

After setting up the connection, initialize the database tables:

```bash
# Run database migrations
alembic upgrade head

# Or initialize tables directly
python -c "
from app.core.database import init_db
import asyncio
asyncio.run(init_db())
"
```

## 🔒 Security Best Practices

### 1. Password Security
- Use strong, unique passwords
- Never commit passwords to version control
- Use environment variables in production
- Consider using a password manager

### 2. Database Security
- Limit database user permissions
- Use SSL connections in production
- Regularly update PostgreSQL
- Monitor database access logs

### 3. Application Security
- Use environment variables for sensitive data
- Keep `.env` files out of version control
- Use different passwords for different environments
- Regularly rotate passwords

## 🐛 Troubleshooting

### Common Issues

1. **Connection Refused**
   ```bash
   # Check if PostgreSQL is running
   sudo systemctl status postgresql
   
   # Start PostgreSQL if needed
   sudo systemctl start postgresql
   ```

2. **Authentication Failed**
   - Verify username and password
   - Check PostgreSQL authentication configuration
   - Ensure user has proper permissions

3. **Database Does Not Exist**
   ```sql
   -- Connect as postgres user
   sudo -u postgres psql
   
   -- Create database
   CREATE DATABASE attendance_db;
   
   -- Grant privileges
   GRANT ALL PRIVILEGES ON DATABASE attendance_db TO attendance_user;
   ```

4. **Permission Denied**
   ```sql
   -- Grant schema privileges
   GRANT ALL ON SCHEMA public TO attendance_user;
   ```

### PostgreSQL Configuration

Check PostgreSQL configuration files:
```bash
# Main configuration
sudo nano /etc/postgresql/*/main/postgresql.conf

# Authentication configuration
sudo nano /etc/postgresql/*/main/pg_hba.conf
```

### Logs

Check PostgreSQL logs:
```bash
# Ubuntu/Debian
sudo tail -f /var/log/postgresql/postgresql-*.log

# macOS
tail -f /usr/local/var/log/postgres.log
```

## 📚 Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [FastAPI Database Documentation](https://fastapi.tiangolo.com/tutorial/database/)

## 🆘 Getting Help

If you encounter issues:

1. Check the troubleshooting section above
2. Review PostgreSQL logs
3. Test connection manually with `psql`
4. Verify environment variables are set correctly
5. Ensure all dependencies are installed

For additional support, check the project's issue tracker or documentation.

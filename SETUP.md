# 🚀 FastAPI Backend Setup Guide

This guide will help you set up and run the School Attendance Management System FastAPI backend.

## 📋 Prerequisites

- Python 3.8+
- PostgreSQL 12+
- pip (Python package manager)

## 🛠️ Installation Steps

### 1. Clone and Navigate to Project
```bash
cd /home/laurent/dev/attendance
```

### 2. Set Up Virtual Environment
```bash
# Create virtual environment (if not already created)
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment
The `.env` file has been created with the following configuration:
```env
# Security
SECRET_KEY=your-super-secret-key-change-this-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=2880

# Database
POSTGRES_SERVER=localhost
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=attendance_db
POSTGRES_PORT=5432

# Multi-tenancy
TENANT_HEADER=X-Tenant-ID
DEFAULT_TENANT=demo

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5174

# Development
DEBUG=true
ENVIRONMENT=development
```

### 5. Set Up Database
```bash
# Create PostgreSQL database (if not already created)
sudo -u postgres createdb attendance_db

# Set password for postgres user (if not already set)
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"

# Run database migrations
alembic upgrade head
```

### 6. Initialize Database with Demo Data
```bash
python scripts/init_db.py
```
This will create a demo school with admin credentials:
- **Email**: admin@demo-school.com
- **Password**: admin123

## 🚀 Running the Application

### Option 1: Using the Management Script (Recommended)
```bash
# Start the server
python manage.py start

# Or use the executable
./manage.py start
```

### Option 2: Direct Command
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Option 3: Using the Start Script
```bash
python start.py
```

## 🌐 Accessing the Application

Once the server is running, you can access:

- **API Base URL**: http://localhost:8000
- **Interactive API Docs**: http://localhost:8000/docs
- **Alternative API Docs**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## 🔐 Authentication & Multi-Tenancy

### Demo Credentials
- **Email**: admin@demo-school.com
- **Password**: admin123
- **Tenant ID**: demo

### Multi-Tenant Access Methods

#### Method 1: Header-based (Recommended for API clients)
```bash
curl -H "X-Tenant-ID: demo" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:8000/api/v1/auth/me
```

#### Method 2: Query Parameter (Development)
```
http://localhost:8000/api/v1/auth/login?tenant=demo
```

#### Method 3: Subdomain (Production)
```
https://demo.attendance.com/api/v1/auth/login
```

## 📚 API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/me` - Get current user profile
- `POST /api/v1/auth/change-password` - Change password
- `POST /api/v1/auth/logout` - Logout

### Schools
- `POST /api/v1/schools/` - Create new school (registration)
- `GET /api/v1/schools/current` - Get current school info
- `PUT /api/v1/schools/current` - Update school info
- `GET /api/v1/schools/stats` - Get school statistics

### Users
- `POST /api/v1/users/` - Create new user
- `GET /api/v1/users/` - List users (with filtering)
- `GET /api/v1/users/{id}` - Get specific user
- `PUT /api/v1/users/{id}` - Update user
- `DELETE /api/v1/users/{id}` - Delete user

### Students (Coming Soon)
- Student CRUD operations
- Class assignments
- Parent linking

### Attendance (Coming Soon)
- Mark attendance
- Get attendance records
- Attendance analytics

### Gate Passes (Coming Soon)
- Create gate pass requests
- Approve/deny requests
- Track entry/exit

## 🛠️ Development Commands

### Database Management
```bash
# Run migrations
python manage.py migrate

# Create new migration
python manage.py create-migration

# Initialize database
python manage.py init-db
```

### Testing
```bash
# Run tests
pytest

# Run tests with coverage
pytest --cov=app
```

### Code Formatting
```bash
# Format code
black app/

# Sort imports
isort app/

# Lint code
flake8 app/
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Database Connection Error
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Check database exists
sudo -u postgres psql -l | grep attendance_db
```

#### 2. Migration Issues
```bash
# Reset migrations (WARNING: This will delete all data)
sudo -u postgres dropdb attendance_db
sudo -u postgres createdb attendance_db
alembic upgrade head
```

#### 3. Port Already in Use
```bash
# Find process using port 8000
lsof -i :8000

# Kill the process
kill -9 <PID>
```

#### 4. Virtual Environment Issues
```bash
# Recreate virtual environment
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## 📁 Project Structure

```
attendance/
├── app/
│   ├── api/                    # API routes
│   │   └── v1/
│   │       ├── endpoints/      # API endpoints
│   │       └── api.py         # Main API router
│   ├── core/                   # Core functionality
│   │   ├── config.py          # Configuration
│   │   ├── database.py        # Database setup
│   │   └── security.py        # Security utilities
│   ├── middleware/             # Custom middleware
│   │   └── tenant.py          # Multi-tenant middleware
│   ├── models/                 # Database models
│   │   ├── user.py
│   │   ├── school.py
│   │   ├── student.py
│   │   ├── attendance.py
│   │   └── gate_pass.py
│   ├── schemas/                # Pydantic schemas
│   │   ├── user.py
│   │   └── school.py
│   └── main.py                # FastAPI application
├── alembic/                   # Database migrations
├── scripts/                   # Utility scripts
│   └── init_db.py            # Database initialization
├── manage.py                  # Management script
├── requirements.txt           # Python dependencies
└── README.md                 # This file
```

## 🎯 Next Steps

1. **Test the API**: Visit http://localhost:8000/docs and try the endpoints
2. **Set up Frontend**: Configure the React.js frontend to connect to the API
3. **Add More Features**: Implement student management, attendance tracking, etc.
4. **Production Setup**: Configure for production deployment

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Review the API documentation at `/docs`
3. Check the logs for error messages
4. Ensure all prerequisites are installed

---

**Happy coding! 🚀**

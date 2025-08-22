# 🏫 School Attendance Management System

A comprehensive multi-tenant FastAPI-based school attendance management system supporting biometric authentication, RFID cards, gate passes, and real-time notifications.

## 🌟 Features

### 🏢 Multi-Tenancy
- **Subdomain-based tenancy**: `school1.attendance.com`, `school2.attendance.com`
- **Header-based tenancy**: `X-Tenant-ID` header support
- **Row-level isolation**: Each school's data is completely isolated

### 👥 User Management
- **Role-based access control**: Admin, Teacher, Parent, Security Guard
- **JWT Authentication**: Secure token-based authentication
- **User profiles**: Complete user management with departments and roles

### 📚 Student Management
- **Student profiles**: Complete academic and contact information
- **Class assignments**: Grade levels, sections, and class management
- **Parent linking**: Connect students with their parents/guardians

### ✅ Attendance Tracking
- **Multiple methods**: Biometric, RFID, QR codes, manual entry
- **Real-time tracking**: Instant attendance updates
- **Attendance history**: Complete attendance records with analytics

### 🚪 Gate Pass Management
- **Digital gate passes**: Request and approval workflow
- **Parent notifications**: Real-time alerts for entry/exit
- **Security verification**: Guard verification at entry/exit points
- **Audit trail**: Complete log of all gate pass activities

### 📊 Analytics & Reporting
- **Attendance reports**: Daily, weekly, monthly attendance analytics
- **School statistics**: Real-time dashboards for administrators
- **Trend analysis**: Attendance patterns and insights

## 🛠️ Technology Stack

### Backend
- **FastAPI**: Modern, fast Python web framework
- **PostgreSQL**: Robust relational database with async support
- **SQLAlchemy**: Advanced ORM with async capabilities
- **Alembic**: Database migration management
- **Redis**: Caching and session management
- **JWT**: Secure authentication tokens

### Additional Features
- **Pydantic**: Data validation and serialization
- **Celery**: Background task processing
- **Twilio**: SMS notifications integration
- **Docker**: Containerization support

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- PostgreSQL 12+
- Redis (optional, for caching)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd attendance-system
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. **Set up database**
```bash
# Create PostgreSQL database
createdb attendance_db

# Run database migrations
alembic upgrade head

# Initialize database with demo data
python scripts/init_db.py
```

6. **Start the server**
```bash
uvicorn app.main:app --reload
```

7. **Access the API**
- API Documentation: http://localhost:8000/docs
- Alternative docs: http://localhost:8000/redoc

## 🏫 Multi-Tenant Usage

### Method 1: Subdomain (Production)
```
https://demo.attendance.com/api/v1/auth/login
```

### Method 2: Header (API Clients)
```bash
curl -H "X-Tenant-ID: demo" http://localhost:8000/api/v1/auth/login
```

### Method 3: Query Parameter (Development)
```
http://localhost:8000/api/v1/auth/login?tenant=demo
```

## 🔐 Authentication

### Login
```bash
POST /api/v1/auth/login
Content-Type: application/json
X-Tenant-ID: demo

{
  "email": "admin@demo-school.com",
  "password": "admin123"
}
```

### Using the token
```bash
curl -H "Authorization: Bearer <your-jwt-token>" \
     -H "X-Tenant-ID: demo" \
     http://localhost:8000/api/v1/auth/me
```

## 📋 API Endpoints

### Authentication
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user profile
- `POST /auth/change-password` - Change password
- `POST /auth/logout` - Logout

### Schools
- `POST /schools/` - Create new school (registration)
- `GET /schools/current` - Get current school info
- `PUT /schools/current` - Update school info
- `GET /schools/stats` - Get school statistics

### Users
- `POST /users/` - Create new user
- `GET /users/` - List users (with filtering)
- `GET /users/{id}` - Get specific user
- `PUT /users/{id}` - Update user
- `DELETE /users/{id}` - Delete user

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

## 🏗️ Project Structure

```
attendance-system/
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
├── requirements.txt           # Python dependencies
└── README.md                 # This file
```

## 🔧 Configuration

Key environment variables:

```env
# Security
SECRET_KEY=your-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=2880

# Database
POSTGRES_SERVER=localhost
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=attendance_db

# Multi-tenancy
TENANT_HEADER=X-Tenant-ID
DEFAULT_TENANT=demo

# Optional: SMS Notifications
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_NUMBER=your-number
```

## 🚦 Development Roadmap

### ✅ Phase 1 (Current)
- [x] Multi-tenant architecture
- [x] User authentication & authorization
- [x] School management
- [x] Basic user management
- [x] API documentation

### 🔄 Phase 2 (In Progress)
- [ ] Complete student management
- [ ] Attendance tracking system
- [ ] Gate pass management
- [ ] Parent notifications

### 📋 Phase 3 (Planned)
- [ ] Mobile app (React Native)
- [ ] Web dashboard (React.js)
- [ ] Biometric device integration
- [ ] RFID card support
- [ ] Advanced analytics
- [ ] Report generation

### 🚀 Phase 4 (Future)
- [ ] Transport tracking
- [ ] Fee management
- [ ] AI-powered insights
- [ ] Mobile notifications
- [ ] Real-time WebSocket updates

## 🧪 Testing

```bash
# Run tests
pytest

# Run tests with coverage
pytest --cov=app
```

## 📦 Deployment

### Docker (Recommended)
```bash
# Build and run with docker-compose
docker-compose up -d
```

### Manual Deployment
1. Set up PostgreSQL and Redis
2. Configure environment variables
3. Run database migrations
4. Deploy with gunicorn or similar WSGI server

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the API documentation at `/docs`
- Review the project structure above

---

**Built with ❤️ for educational institutions worldwide** 
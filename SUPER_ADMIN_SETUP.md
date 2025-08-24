# 🛡️ Super Admin Panel Setup Guide

This guide will help you set up and use the Super Admin Panel for system-wide administration of the School Attendance Management System.

## 📋 Overview

The Super Admin Panel provides elevated privileges for system developers and administrators to manage:

- **System Management**: Schools, users, subscriptions
- **Support & Troubleshooting**: Support tickets, system logs
- **Configuration**: System settings, feature flags
- **Security**: Admin actions, audit trails
- **Monitoring**: System health, analytics

## 🚀 Quick Setup

### 1. Database Migration

The super admin models have been added to the database. Run the migration:

```bash
# Activate virtual environment
source venv/bin/activate

# Run migration
alembic upgrade head
```

### 2. Create First Super Admin

Run the setup script to create your first super admin user:

```bash
# Run the script
python scripts/create_super_admin.py
```

Follow the prompts to create your admin account:
- Email address
- Username
- First and last name
- Password (min 8 characters)
- Role selection
- Optional phone and bio

### 3. Access the Admin Panel

1. Start the backend server:
   ```bash
   python start.py
   ```

2. Start the frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```

3. Navigate to the admin panel:
   ```
   http://localhost:5174/admin/login
   ```

4. Log in with your super admin credentials

## 🔐 Admin Roles & Permissions

### SYSTEM_DEVELOPER
- **Full system access**
- Create/update/delete super admins
- System configuration management
- Feature flag management
- Database tools and debugging

### SYSTEM_ADMIN
- **System administration**
- School management (suspend/activate)
- User management across schools
- Support ticket management
- System monitoring

### SUPPORT_AGENT
- **Support and troubleshooting**
- View support tickets
- Update ticket status
- Basic system monitoring
- Limited configuration access

### FINANCIAL_ADMIN
- **Financial management only**
- View payment records
- Subscription management
- Financial reports
- Billing configuration

## 🏗️ Architecture

### Backend Components

```
app/
├── models/super_admin.py          # Super admin models
├── schemas/super_admin.py         # Pydantic schemas
├── api/v1/endpoints/super_admin.py # API endpoints
└── middleware/tenant.py           # Multi-tenant middleware
```

### Frontend Components

```
frontend/src/
├── lib/adminApi.ts               # Admin API client
├── store/slices/adminSlice.ts    # Redux state management
├── components/layouts/AdminLayout.tsx # Admin layout
├── pages/AdminLoginPage.tsx      # Login page
└── pages/AdminDashboardPage.tsx  # Dashboard
```

## 📊 Dashboard Features

### System Statistics
- Total and active schools
- User counts and activity
- Support ticket metrics
- System health indicators

### Quick Actions
- Manage schools
- View users
- Handle support tickets
- Access system logs

### Real-time Monitoring
- System uptime
- Storage usage
- Database status
- Error rates

## 🔧 API Endpoints

### Authentication
- `POST /api/v1/super-admin/login` - Admin login
- `GET /api/v1/super-admin/me` - Get current admin

### System Management
- `GET /api/v1/super-admin/dashboard/stats` - System statistics
- `GET /api/v1/super-admin/schools` - List all schools
- `PUT /api/v1/super-admin/schools/{id}/suspend` - Suspend school
- `PUT /api/v1/super-admin/schools/{id}/activate` - Activate school

### Support Tickets
- `GET /api/v1/super-admin/support-tickets` - List tickets
- `POST /api/v1/super-admin/support-tickets` - Create ticket
- `PUT /api/v1/super-admin/support-tickets/{id}` - Update ticket

### System Configuration
- `GET /api/v1/super-admin/configurations` - List configurations
- `POST /api/v1/super-admin/configurations` - Create configuration
- `PUT /api/v1/super-admin/configurations/{id}` - Update configuration

### Logging & Monitoring
- `GET /api/v1/super-admin/logs` - System logs
- `GET /api/v1/super-admin/admin-actions` - Admin action logs

## 🛡️ Security Features

### Authentication
- JWT-based authentication
- Separate admin tokens from school tokens
- Automatic token refresh

### Authorization
- Role-based access control
- Granular permissions per endpoint
- Admin action logging

### Audit Trail
- All admin actions logged
- IP address tracking
- User agent logging
- Timestamped entries

### Two-Factor Authentication
- Optional 2FA for super admins
- TOTP-based authentication
- Backup codes support

## 🔍 Monitoring & Logging

### System Logs
- Application errors and warnings
- User activity tracking
- Performance metrics
- Security events

### Admin Action Logs
- All administrative actions
- Resource modifications
- Configuration changes
- User management actions

### Health Monitoring
- Database connectivity
- Storage usage
- API response times
- Error rates

## 🚨 Support & Troubleshooting

### Common Issues

1. **Login Fails**
   - Verify email and password
   - Check if account is active
   - Ensure proper role assignment

2. **Permission Denied**
   - Verify admin role permissions
   - Check if feature is enabled
   - Contact system developer

3. **Database Connection**
   - Check database status
   - Verify connection settings
   - Review error logs

### Getting Help

1. **System Logs**: Check `/admin/logs` for errors
2. **Admin Actions**: Review `/admin/actions` for recent changes
3. **Support Tickets**: Create ticket in admin panel
4. **Documentation**: Review API docs at `/docs`

## 🔄 Development Workflow

### Adding New Features

1. **Backend**
   - Add models to `app/models/super_admin.py`
   - Create schemas in `app/schemas/super_admin.py`
   - Add endpoints to `app/api/v1/endpoints/super_admin.py`
   - Run migrations: `alembic revision --autogenerate`

2. **Frontend**
   - Add types to `frontend/src/lib/adminApi.ts`
   - Update Redux slice in `frontend/src/store/slices/adminSlice.ts`
   - Create components in `frontend/src/pages/`
   - Add routes to `frontend/src/App.tsx`

### Testing

1. **API Testing**
   ```bash
   # Test endpoints
   curl -X POST http://localhost:8000/api/v1/super-admin/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@example.com","password":"password"}'
   ```

2. **Frontend Testing**
   - Navigate to `/admin/login`
   - Test all admin features
   - Verify permissions work correctly

## 📈 Future Enhancements

### Planned Features
- **Advanced Analytics**: Detailed usage reports
- **Bulk Operations**: Mass school/user management
- **API Management**: API key generation and monitoring
- **Backup & Restore**: Database backup tools
- **Integration Hub**: Third-party service management

### Security Enhancements
- **Advanced 2FA**: Hardware key support
- **IP Whitelisting**: Restricted access by IP
- **Session Management**: Active session monitoring
- **Encryption**: Enhanced data encryption

## 📞 Support

For technical support or questions about the Super Admin Panel:

1. **Documentation**: Check this guide and API docs
2. **Logs**: Review system and admin action logs
3. **Issues**: Create support ticket in admin panel
4. **Development**: Contact the development team

---

**⚠️ Important**: The Super Admin Panel has elevated privileges. Use with caution and ensure proper security measures are in place.

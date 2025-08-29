# 🔐 RBAC + ABAC Implementation Guide

This document provides a comprehensive overview of the Role-Based Access Control (RBAC) and Attribute-Based Access Control (ABAC) implementation using Casbin in the School Attendance Management System.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Implementation Details](#implementation-details)
4. [Usage Guide](#usage-guide)
5. [API Reference](#api-reference)
6. [Frontend Integration](#frontend-integration)
7. [Settings Integration](#settings-integration)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

## 🎯 Overview

The system implements a hybrid RBAC + ABAC model using Casbin, providing:

- **Role-Based Access Control (RBAC)**: Users are assigned roles with predefined permissions
- **Attribute-Based Access Control (ABAC)**: Access decisions based on user attributes, resource attributes, and environmental conditions
- **Fine-grained permissions**: Page-level, feature-level, and API-level access control
- **Settings-aware permissions**: Integration with school settings for dynamic access control
- **Flexible policy management**: Easy addition, modification, and removal of policies

### Key Features

- ✅ Multi-tenant support with school isolation
- ✅ Role hierarchy (admin > teacher > parent)
- ✅ Time-based access control
- ✅ Department-based access control
- ✅ Settings-aware permissions
- ✅ Real-time policy updates
- ✅ Comprehensive audit logging
- ✅ Frontend management interface

## 🏗️ Architecture

### Core Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│                 │    │                 │    │                 │
│ • Permissions   │◄──►│ • Casbin        │◄──►│ • casbin_rule   │
│   Manager       │    │   Manager       │    │   table         │
│ • Settings      │    │ • Dependencies  │    │ • User roles    │
│   Integration   │    │ • Middleware    │    │ • Settings      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Permission Model

The system uses a 4-tuple permission model:
- **Subject (Role)**: User role (admin, teacher, parent, security, student)
- **Resource Type**: Type of resource (page, feature, api)
- **Resource**: Specific resource identifier
- **Action**: Operation to perform (read, write, full, limited)

### ABAC Attributes

Additional attributes for fine-grained control:
- `school_id`: Multi-tenant isolation
- `user_id`: User-specific permissions
- `user_status`: Active/inactive user status
- `department`: Department-based access
- `current_time`: Time-based access control
- `current_date`: Date-based access control

## 🔧 Implementation Details

### Backend Implementation

#### 1. Casbin Manager (`app/core/casbin.py`)

```python
class CasbinManager:
    def __init__(self):
        self.enforcer = None
        self._initialize_enforcer()
    
    def check_permission(self, role, resource_type, resource, action, attributes=None):
        # Check permission with optional ABAC attributes
        pass
    
    def add_policy(self, role, resource_type, resource, action):
        # Add new policy
        pass
```

#### 2. Dependencies (`app/api/deps.py`)

```python
def require_permission(resource_type: str, resource: str, action: str, check_attributes: bool = True):
    """Dependency factory for permission checking"""
    pass

def require_feature_permission(feature: str, action: str = "full"):
    """Feature-level permission dependency"""
    pass

def require_page_permission(page: str, action: str = "read"):
    """Page-level permission dependency"""
    pass

def check_settings_aware_permission(setting_key: str, default_value: Any = True):
    """Settings-aware permission dependency"""
    pass
```

#### 3. API Endpoints (`app/api/v1/endpoints/permissions.py`)

- `GET /api/v1/permissions/policies` - Get all policies
- `POST /api/v1/permissions/policies` - Add new policy
- `DELETE /api/v1/permissions/policies` - Remove policy
- `GET /api/v1/permissions/role-hierarchy` - Get role hierarchy
- `POST /api/v1/permissions/test-permission` - Test permission

### Frontend Implementation

#### 1. Permissions Manager Component

```typescript
const PermissionsManager: React.FC = () => {
  // State management for policies, roles, and testing
  // Tab-based interface for different management areas
  // Real-time policy updates
}
```

#### 2. Settings Integration

The permissions system integrates with the settings page, providing:
- Dedicated permissions management tab
- Settings-aware permission checks
- Dynamic feature enabling/disabling

## 📖 Usage Guide

### 1. Setting Up the System

#### Database Migration

```bash
# Run the Casbin migration
alembic upgrade head
```

#### Initialize Casbin System

```bash
# Run the initialization script
python scripts/init_casbin.py
```

### 2. Using Permission Dependencies

#### Basic Permission Check

```python
@router.get("/settings")
async def get_settings(
    current_user: User = Depends(require_page_permission("settings", "read"))
):
    # Only users with 'settings:read' permission can access
    pass
```

#### Feature-Level Permission

```python
@router.post("/attendance")
async def mark_attendance(
    current_user: User = Depends(require_feature_permission("attendance_management"))
):
    # Only users with attendance management feature access
    pass
```

#### Settings-Aware Permission

```python
@router.get("/biometric")
async def biometric_page(
    current_user: User = Depends(check_settings_aware_permission("biometric_enabled"))
):
    # Only accessible if biometric is enabled in settings
    pass
```

### 3. Adding Custom Policies

#### Via API

```bash
curl -X POST /api/v1/permissions/policies \
  -H "Content-Type: application/json" \
  -d '{
    "role": "teacher",
    "resource_type": "page",
    "resource": "analytics",
    "action": "read"
  }'
```

#### Via Frontend

1. Navigate to Settings → Permissions
2. Click "Add Policy"
3. Fill in the form with role, resource type, resource, and action
4. Save the policy

### 4. Testing Permissions

#### Via API

```bash
curl -X POST /api/v1/permissions/test-permission \
  -H "Content-Type: application/json" \
  -d '{
    "role": "teacher",
    "resource_type": "page",
    "resource": "settings",
    "action": "read"
  }'
```

#### Via Frontend

1. Go to Settings → Permissions → Test Permissions
2. Fill in the test form
3. Click "Test Permission"
4. View the result

## 🔌 API Reference

### Permissions Endpoints

#### Get All Policies

```http
GET /api/v1/permissions/policies
Authorization: Bearer <token>
```

Response:
```json
{
  "policies": [
    {
      "role": "admin",
      "resource_type": "page",
      "resource": "settings",
      "action": "read",
      "attributes": []
    }
  ],
  "total": 1
}
```

#### Add Policy

```http
POST /api/v1/permissions/policies
Authorization: Bearer <token>
Content-Type: application/json

{
  "role": "teacher",
  "resource_type": "page",
  "resource": "analytics",
  "action": "read"
}
```

#### Test Permission

```http
POST /api/v1/permissions/test-permission
Authorization: Bearer <token>
Content-Type: application/json

{
  "role": "teacher",
  "resource_type": "page",
  "resource": "settings",
  "action": "read",
  "attributes": {
    "school_id": "1",
    "current_time": "14:30"
  }
}
```

Response:
```json
{
  "has_permission": false,
  "test_data": {
    "role": "teacher",
    "resource_type": "page",
    "resource": "settings",
    "action": "read"
  }
}
```

## 🎨 Frontend Integration

### Permissions Manager Component

The `PermissionsManager` component provides:

1. **Policies Tab**: View, add, and remove policies
2. **Role Hierarchy Tab**: Visualize role relationships
3. **Test Permissions Tab**: Test permission scenarios

### Settings Integration

The permissions system is integrated into the settings page:

1. **Permissions Tab**: Full permissions management interface
2. **Settings-Aware Checks**: Dynamic permission validation
3. **Real-Time Updates**: Immediate policy changes

### Usage in Components

```typescript
// Check if user has permission to access a feature
const hasPermission = usePermission('feature', 'attendance_management', 'full');

// Conditional rendering based on permissions
{hasPermission && <AttendanceManagementComponent />}
```

## ⚙️ Settings Integration

### Settings-Aware Permissions

The system integrates with school settings to provide dynamic access control:

```python
@router.get("/biometric")
async def biometric_page(
    current_user: User = Depends(check_settings_aware_permission("biometric_enabled"))
):
    # Only accessible if biometric is enabled in school settings
    pass
```

### Supported Settings Keys

- `biometric_enabled`: Biometric feature access
- `visitor_management_enabled`: Visitor management access
- `staff_attendance_enabled`: Staff attendance access
- `gate_pass_enabled`: Gate pass system access

### Dynamic Feature Control

Settings changes automatically affect permissions:

1. **Enable Feature**: Automatically grants access to related functionality
2. **Disable Feature**: Automatically revokes access to related functionality
3. **Settings Validation**: Prevents access to disabled features

## 🏆 Best Practices

### 1. Policy Design

- **Principle of Least Privilege**: Grant minimum necessary permissions
- **Role Hierarchy**: Use role inheritance for efficient policy management
- **Resource Granularity**: Define resources at appropriate levels
- **Action Specificity**: Use specific actions (read, write, full, limited)

### 2. Performance Optimization

- **Policy Caching**: Cache frequently accessed policies
- **Database Indexing**: Index Casbin rule tables for fast queries
- **Batch Operations**: Use batch operations for bulk policy changes
- **Lazy Loading**: Load policies on-demand

### 3. Security Considerations

- **Input Validation**: Validate all policy inputs
- **Audit Logging**: Log all permission checks and changes
- **Regular Reviews**: Regularly review and update policies
- **Testing**: Test permission scenarios thoroughly

### 4. Maintenance

- **Documentation**: Document all custom policies
- **Version Control**: Track policy changes in version control
- **Backup**: Regular backup of policy data
- **Monitoring**: Monitor permission check performance

## 🔧 Troubleshooting

### Common Issues

#### 1. Permission Denied Errors

**Problem**: Users getting permission denied for expected access

**Solution**:
1. Check if the policy exists in Casbin
2. Verify role hierarchy is correct
3. Check ABAC attributes
4. Review settings integration

```bash
# Test the specific permission
curl -X POST /api/v1/permissions/test-permission \
  -d '{"role": "teacher", "resource_type": "page", "resource": "settings", "action": "read"}'
```

#### 2. Casbin Initialization Errors

**Problem**: Casbin enforcer fails to initialize

**Solution**:
1. Check database connection
2. Verify Casbin tables exist
3. Check model configuration
4. Review adapter setup

```bash
# Re-run initialization
python scripts/init_casbin.py
```

#### 3. Policy Not Applied

**Problem**: New policies not taking effect

**Solution**:
1. Verify policy was saved correctly
2. Check policy format
3. Reload Casbin enforcer
4. Clear any caches

#### 4. Performance Issues

**Problem**: Slow permission checks

**Solution**:
1. Add database indexes
2. Implement policy caching
3. Optimize policy queries
4. Review policy complexity

### Debug Commands

#### Check Casbin Status

```python
# In Python shell
from app.core.casbin import casbin_manager
print(f"Enforcer initialized: {casbin_manager.enforcer is not None}")
print(f"Total policies: {len(casbin_manager.get_policies())}")
```

#### Test Specific Permission

```python
# Test permission programmatically
result = casbin_manager.check_permission(
    role="teacher",
    resource_type="page",
    resource="settings",
    action="read"
)
print(f"Permission granted: {result}")
```

#### List All Policies

```python
# Get all policies
policies = casbin_manager.get_policies()
for policy in policies:
    print(f"Policy: {policy}")
```

### Logging

Enable debug logging for permission checks:

```python
import logging
logging.getLogger('casbin').setLevel(logging.DEBUG)
```

## 📚 Additional Resources

- [Casbin Documentation](https://casbin.org/docs/overview)
- [RBAC vs ABAC Comparison](https://en.wikipedia.org/wiki/Role-based_access_control)
- [FastAPI Dependencies](https://fastapi.tiangolo.com/tutorial/dependencies/)
- [React Query Documentation](https://tanstack.com/query/latest)

## 🤝 Contributing

When contributing to the RBAC + ABAC system:

1. **Follow the existing patterns** for permission dependencies
2. **Add tests** for new permission scenarios
3. **Update documentation** for new features
4. **Consider performance** implications of new policies
5. **Maintain backward compatibility** when possible

## 📄 License

This implementation is part of the School Attendance Management System and follows the same licensing terms.

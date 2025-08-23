# 🌐 Frontend Integration Guide

## ✅ CORS Issue Resolved

The CORS error you were experiencing has been fixed! Your frontend running on `http://localhost:5174` can now successfully communicate with the FastAPI backend.

## 🔧 Changes Made

### 1. Updated CORS Configuration
- **File**: `.env`
- **Change**: Added `http://localhost:5174` to allowed origins
- **Result**: Frontend can now make requests to the API

### 2. Enhanced CORS Headers
- **File**: `app/main.py`
- **Change**: Added explicit headers for better compatibility
- **Result**: All necessary headers are now properly allowed

## 🚀 Frontend Integration Steps

### 1. API Base Configuration
Configure your frontend to use the correct API base URL:

```javascript
// API Configuration
const API_BASE_URL = 'http://localhost:8000/api/v1';
const TENANT_ID = 'demo'; // or get from your app configuration
```

### 2. Authentication Setup
Implement login functionality:

```javascript
// Login function
async function login(email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': TENANT_ID,
      },
      body: JSON.stringify({
        email: email,
        password: password
      })
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();
    
    // Store the token
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}
```

### 3. API Request Helper
Create a helper function for authenticated requests:

```javascript
// API request helper
async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('access_token');
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'X-Tenant-ID': TENANT_ID,
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
}
```

### 4. Example API Calls

#### Get Current User
```javascript
async function getCurrentUser() {
  return await apiRequest('/auth/me');
}
```

#### Get School Information
```javascript
async function getSchoolInfo() {
  return await apiRequest('/schools/current');
}
```

#### Get Users List
```javascript
async function getUsers() {
  return await apiRequest('/users/');
}
```

## 🧪 Testing Your Integration

### 1. Test Login
```javascript
// Test with demo credentials
login('admin@demo-school.com', 'admin123')
  .then(data => {
    console.log('Login successful:', data);
  })
  .catch(error => {
    console.error('Login failed:', error);
  });
```

### 2. Test Protected Endpoints
```javascript
// Test after login
getCurrentUser()
  .then(user => {
    console.log('Current user:', user);
  })
  .catch(error => {
    console.error('Failed to get user:', error);
  });
```

## 🔐 Authentication Flow

### 1. Login Process
1. User enters credentials
2. Frontend sends POST to `/api/v1/auth/login`
3. Backend validates credentials and returns JWT token
4. Frontend stores token in localStorage
5. User is redirected to dashboard

### 2. Protected Requests
1. Frontend includes JWT token in Authorization header
2. Backend validates token and extracts user info
3. Request is processed with user context
4. Response is returned to frontend

### 3. Token Management
- **Storage**: Store in localStorage or secure cookie
- **Expiration**: Tokens expire after 8 days (configurable)
- **Refresh**: Implement token refresh logic if needed
- **Logout**: Clear token from storage

## 📋 Available API Endpoints

### Authentication
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user profile
- `POST /auth/change-password` - Change password
- `POST /auth/logout` - Logout

### Schools
- `GET /schools/current` - Get current school info
- `PUT /schools/current` - Update school info
- `GET /schools/stats` - Get school statistics

### Users
- `GET /users/` - List users
- `POST /users/` - Create new user
- `GET /users/{id}` - Get specific user
- `PUT /users/{id}` - Update user
- `DELETE /users/{id}` - Delete user

## 🎯 Demo Credentials

Use these credentials for testing:
- **Email**: `admin@demo-school.com`
- **Password**: `admin123`
- **Tenant ID**: `demo`

## 🔧 Troubleshooting

### Common Issues

#### 1. CORS Errors
- ✅ **Fixed**: Added `http://localhost:5174` to allowed origins
- **If still having issues**: Check that your frontend is running on the correct port

#### 2. Authentication Errors
- **Check**: Token is included in Authorization header
- **Check**: X-Tenant-ID header is included
- **Check**: Token hasn't expired

#### 3. Network Errors
- **Check**: Backend is running on `http://localhost:8000`
- **Check**: No firewall blocking the connection
- **Check**: Correct API endpoint URLs

### Debug Commands

#### Test CORS from Frontend Port
```bash
curl -X OPTIONS http://localhost:8000/api/v1/auth/login \
  -H "Origin: http://localhost:5174" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,X-Tenant-ID" \
  -v
```

#### Test Login from Frontend Port
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: demo" \
  -H "Origin: http://localhost:5174" \
  -d '{"email":"admin@demo-school.com","password":"admin123"}'
```

## 🚀 Next Steps

1. **Implement Login UI**: Create login form in your frontend
2. **Add Authentication Guards**: Protect routes that require authentication
3. **Create Dashboard**: Build the main application interface
4. **Add Error Handling**: Implement proper error handling for API calls
5. **Add Loading States**: Show loading indicators during API calls

---

**Status**: ✅ CORS issue resolved - Frontend integration ready!

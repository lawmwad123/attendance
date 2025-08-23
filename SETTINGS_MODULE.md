# ⚙️ Settings Module Documentation

## 🎯 Overview

The Settings Module provides comprehensive configuration management for the School Attendance System. It allows each school tenant to customize their system according to their specific requirements without needing developer intervention.

## 🏗️ Architecture

### Database Models

#### 1. SchoolSettings
The main settings table containing all school-specific configurations:

```python
class SchoolSettings(TenantBaseModel):
    # General School Information
    school_name: str
    school_motto: Optional[str]
    school_logo_url: Optional[str]
    school_address: Optional[str]
    school_phone: Optional[str]
    school_email: Optional[str]
    school_website: Optional[str]
    
    # Academic Year & Calendar
    academic_year_start: Optional[date]
    academic_year_end: Optional[date]
    working_days: Optional[List[str]]  # ["monday", "tuesday", ...]
    timezone: str = "UTC"
    terms: Optional[List[Dict]]  # School terms/semesters
    
    # Attendance Settings
    default_attendance_mode: AttendanceMode
    morning_attendance_start: Optional[time]
    morning_attendance_end: Optional[time]
    afternoon_attendance_start: Optional[time]
    afternoon_attendance_end: Optional[time]
    late_arrival_threshold: Optional[time]
    absent_threshold: Optional[time]
    auto_logout_time: Optional[time]
    
    # Gate Pass Settings
    gate_pass_approval_workflow: GatePassApprovalWorkflow
    gate_pass_auto_expiry_hours: int
    allowed_exit_start_time: Optional[time]
    allowed_exit_end_time: Optional[time]
    emergency_override_roles: Optional[List[str]]
    
    # Biometric & Card Settings
    biometric_type: Optional[BiometricType]
    biometric_enrollment_fingers: int
    biometric_retry_attempts: int
    rfid_card_format: Optional[str]
    card_reissue_policy: Optional[str]
    
    # Device Integration
    devices: Optional[List[Dict]]  # Device configurations
    
    # Notifications & Communication
    notification_channels: Optional[List[NotificationChannel]]
    parent_notification_on_entry: bool
    parent_notification_on_exit: bool
    parent_notification_late_arrival: bool
    teacher_notification_absentees: bool
    security_notification_gate_pass: bool
    
    # SMS/Email Provider Settings
    sms_provider: Optional[str]
    sms_api_key: Optional[str]
    email_provider: Optional[str]
    email_api_key: Optional[str]
    
    # Academic Calendar & Events
    public_holidays: Optional[List[Dict]]
    special_events: Optional[List[Dict]]
    exam_periods: Optional[List[Dict]]
    
    # Customization
    theme_colors: Optional[Dict[str, str]]
    report_template: str
    language: str
    
    # Security & Compliance
    data_retention_days: int
    backup_frequency_hours: int
    audit_log_enabled: bool
    
    # System Integrations
    api_keys: Optional[Dict[str, str]]
    integrations: Optional[Dict[str, str]]
```

#### 2. ClassLevel
Manages class levels (e.g., Primary 1, Grade 5):

```python
class ClassLevel(TenantBaseModel):
    name: str  # "Primary 1", "Grade 5"
    code: str  # "P1", "G5"
    description: Optional[str]
    order: int  # For sorting
    is_active: bool
```

#### 3. Class
Manages classes with streams/sections:

```python
class Class(TenantBaseModel):
    name: str  # "P5 – Blue", "Grade 6 – A"
    code: str  # "P5B", "G6A"
    level_id: int  # Foreign key to ClassLevel
    teacher_id: Optional[int]  # Foreign key to User
    capacity: int
    is_active: bool
```

#### 4. Subject
Manages subjects for the school:

```python
class Subject(TenantBaseModel):
    name: str  # "Mathematics", "English"
    code: str  # "MATH", "ENG"
    description: Optional[str]
    is_core: bool
    is_active: bool
```

#### 5. Device
Manages biometric devices and RFID readers:

```python
class Device(TenantBaseModel):
    name: str  # "Main Gate Biometric"
    device_type: str  # "biometric", "rfid_reader", "qr_scanner"
    device_id: str  # Unique device identifier
    location: str  # "main_gate", "staff_entrance"
    ip_address: Optional[str]
    port: Optional[int]
    api_key: Optional[str]
    is_active: bool
    last_sync: Optional[str]  # ISO timestamp
```

## 🔧 ENUMs

### AttendanceMode
```python
class AttendanceMode(str, Enum):
    BIOMETRIC = "BIOMETRIC"
    RFID_CARD = "RFID_CARD"
    MANUAL = "MANUAL"
    HYBRID = "HYBRID"
```

### BiometricType
```python
class BiometricType(str, Enum):
    FINGERPRINT = "FINGERPRINT"
    FACE = "FACE"
    IRIS = "IRIS"
    VOICE = "VOICE"
```

### NotificationChannel
```python
class NotificationChannel(str, Enum):
    SMS = "SMS"
    EMAIL = "EMAIL"
    PUSH = "PUSH"
    WHATSAPP = "WHATSAPP"
```

### GatePassApprovalWorkflow
```python
class GatePassApprovalWorkflow(str, Enum):
    PARENT_ONLY = "PARENT_ONLY"
    ADMIN_ONLY = "ADMIN_ONLY"
    BOTH = "BOTH"
    TEACHER_APPROVAL = "TEACHER_APPROVAL"
```

## 🌐 API Endpoints

### School Settings

#### Get All Settings
```http
GET /api/v1/settings/
Authorization: Bearer <token>
X-Tenant-ID: <tenant_id>
```

#### Create Settings (Admin Only)
```http
POST /api/v1/settings/
Authorization: Bearer <token>
X-Tenant-ID: <tenant_id>
Content-Type: application/json

{
  "school_name": "Demo High School",
  "default_attendance_mode": "MANUAL",
  "gate_pass_approval_workflow": "PARENT_ONLY",
  // ... other settings
}
```

#### Update Settings (Admin Only)
```http
PUT /api/v1/settings/
Authorization: Bearer <token>
X-Tenant-ID: <tenant_id>
Content-Type: application/json

{
  "school_name": "Updated School Name",
  "default_attendance_mode": "BIOMETRIC"
}
```

### Settings Sections

#### Get General Settings
```http
GET /api/v1/settings/general
```

#### Get Attendance Settings
```http
GET /api/v1/settings/attendance
```

#### Get Gate Pass Settings
```http
GET /api/v1/settings/gate-pass
```

#### Get Notification Settings
```http
GET /api/v1/settings/notifications
```

#### Get Biometric Settings
```http
GET /api/v1/settings/biometric
```

#### Get Settings Summary
```http
GET /api/v1/settings/summary
```

### Class Levels

#### List Class Levels
```http
GET /api/v1/settings/class-levels
```

#### Create Class Level (Admin Only)
```http
POST /api/v1/settings/class-levels
Content-Type: application/json

{
  "name": "Primary 1",
  "code": "P1",
  "description": "First year of primary school",
  "order": 1
}
```

#### Update Class Level (Admin Only)
```http
PUT /api/v1/settings/class-levels/{id}
```

#### Delete Class Level (Admin Only)
```http
DELETE /api/v1/settings/class-levels/{id}
```

### Classes

#### List Classes
```http
GET /api/v1/settings/classes
GET /api/v1/settings/classes?level_id=1
```

#### Create Class (Admin Only)
```http
POST /api/v1/settings/classes
Content-Type: application/json

{
  "name": "P1 - Blue",
  "code": "P1B",
  "level_id": 1,
  "teacher_id": 5,
  "capacity": 30
}
```

### Subjects

#### List Subjects
```http
GET /api/v1/settings/subjects
GET /api/v1/settings/subjects?is_core=true
```

#### Create Subject (Admin Only)
```http
POST /api/v1/settings/subjects
Content-Type: application/json

{
  "name": "Mathematics",
  "code": "MATH",
  "description": "Core mathematics subject",
  "is_core": true
}
```

### Devices

#### List Devices
```http
GET /api/v1/settings/devices
GET /api/v1/settings/devices?device_type=biometric
```

#### Create Device (Admin Only)
```http
POST /api/v1/settings/devices
Content-Type: application/json

{
  "name": "Main Gate Biometric",
  "device_type": "biometric",
  "device_id": "BIO001",
  "location": "main_gate",
  "ip_address": "192.168.1.100",
  "port": 8080
}
```

### ENUM Endpoints

#### Get Attendance Modes
```http
GET /api/v1/settings/enums/attendance-modes
```

#### Get Biometric Types
```http
GET /api/v1/settings/enums/biometric-types
```

#### Get Notification Channels
```http
GET /api/v1/settings/enums/notification-channels
```

#### Get Gate Pass Workflows
```http
GET /api/v1/settings/enums/gate-pass-workflows
```

## 📊 Example Responses

### Settings Summary
```json
{
  "general": {
    "school_name": "Demo High School",
    "school_motto": "Excellence in Education",
    "school_logo_url": "https://example.com/logo.png",
    "school_address": "123 Education Street, Learning City, LC 12345",
    "school_phone": "+1-555-0123",
    "school_email": "admin@demo-school.com",
    "school_website": "https://demo-school.com",
    "timezone": "UTC"
  },
  "attendance": {
    "default_attendance_mode": "MANUAL",
    "morning_attendance_start": "08:00:00",
    "morning_attendance_end": "08:30:00",
    "afternoon_attendance_start": "14:00:00",
    "afternoon_attendance_end": "14:30:00",
    "late_arrival_threshold": "08:15:00",
    "absent_threshold": "09:00:00",
    "auto_logout_time": "17:00:00"
  },
  "gate_pass": {
    "gate_pass_approval_workflow": "PARENT_ONLY",
    "gate_pass_auto_expiry_hours": 24,
    "allowed_exit_start_time": "14:00:00",
    "allowed_exit_end_time": "17:00:00",
    "emergency_override_roles": ["nurse", "headteacher", "admin"]
  },
  "notifications": {
    "notification_channels": ["SMS", "EMAIL"],
    "parent_notification_on_entry": true,
    "parent_notification_on_exit": true,
    "parent_notification_late_arrival": true,
    "teacher_notification_absentees": true,
    "security_notification_gate_pass": true
  },
  "biometric": {
    "biometric_type": "FINGERPRINT",
    "biometric_enrollment_fingers": 2,
    "biometric_retry_attempts": 3,
    "rfid_card_format": "ISO14443A",
    "card_reissue_policy": "Report to admin office within 24 hours"
  },
  "total_classes": 8,
  "total_subjects": 8,
  "total_devices": 3
}
```

### Class Levels
```json
[
  {
    "id": 1,
    "name": "Primary 1",
    "code": "P1",
    "description": null,
    "order": 1,
    "is_active": true,
    "school_id": 1,
    "created_at": "2025-08-23T13:30:00.000000Z",
    "updated_at": "2025-08-23T13:30:00.000000Z"
  },
  {
    "id": 2,
    "name": "Primary 2",
    "code": "P2",
    "description": null,
    "order": 2,
    "is_active": true,
    "school_id": 1,
    "created_at": "2025-08-23T13:30:00.000000Z",
    "updated_at": "2025-08-23T13:30:00.000000Z"
  }
]
```

## 🚀 Usage Examples

### Frontend Integration

#### 1. Load Settings on App Start
```javascript
async function loadSchoolSettings() {
  try {
    const response = await apiRequest('/settings/summary');
    return response;
  } catch (error) {
    console.error('Failed to load settings:', error);
    throw error;
  }
}
```

#### 2. Update Attendance Settings
```javascript
async function updateAttendanceSettings(settings) {
  try {
    const response = await apiRequest('/settings/', {
      method: 'PUT',
      body: JSON.stringify({
        default_attendance_mode: settings.mode,
        morning_attendance_start: settings.morningStart,
        morning_attendance_end: settings.morningEnd,
        late_arrival_threshold: settings.lateThreshold
      })
    });
    return response;
  } catch (error) {
    console.error('Failed to update attendance settings:', error);
    throw error;
  }
}
```

#### 3. Get Available Options
```javascript
async function getAvailableOptions() {
  try {
    const [attendanceModes, biometricTypes, notificationChannels, gatePassWorkflows] = await Promise.all([
      apiRequest('/settings/enums/attendance-modes'),
      apiRequest('/settings/enums/biometric-types'),
      apiRequest('/settings/enums/notification-channels'),
      apiRequest('/settings/enums/gate-pass-workflows')
    ]);
    
    return {
      attendanceModes,
      biometricTypes,
      notificationChannels,
      gatePassWorkflows
    };
  } catch (error) {
    console.error('Failed to load options:', error);
    throw error;
  }
}
```

### Backend Integration

#### 1. Use Settings in Business Logic
```python
from app.models.settings import SchoolSettings
from app.api.deps import get_current_school_id

async def mark_attendance(student_id: int, db: AsyncSession, request: Request):
    # Get school settings
    school_id = get_current_school_id(request)
    settings = await db.get(SchoolSettings, school_id)
    
    # Use settings for attendance logic
    if settings.default_attendance_mode == AttendanceMode.BIOMETRIC:
        # Handle biometric attendance
        pass
    elif settings.default_attendance_mode == AttendanceMode.MANUAL:
        # Handle manual attendance
        pass
    
    # Check late arrival threshold
    current_time = datetime.now().time()
    if current_time > settings.late_arrival_threshold:
        # Mark as late
        pass
```

#### 2. Apply Gate Pass Rules
```python
async def process_gate_pass_request(gate_pass_id: int, db: AsyncSession, request: Request):
    school_id = get_current_school_id(request)
    settings = await db.get(SchoolSettings, school_id)
    
    # Check approval workflow
    if settings.gate_pass_approval_workflow == GatePassApprovalWorkflow.PARENT_ONLY:
        # Send notification to parent only
        pass
    elif settings.gate_pass_approval_workflow == GatePassApprovalWorkflow.BOTH:
        # Send notification to both parent and admin
        pass
```

## 🔐 Security & Permissions

### Role-Based Access
- **Admin**: Full access to all settings
- **Teacher**: Read-only access to relevant settings
- **Parent**: Read-only access to general settings
- **Security**: Read-only access to gate pass and device settings

### Tenant Isolation
All settings are automatically filtered by `school_id` to ensure complete tenant isolation.

### Audit Trail
Settings changes are logged with:
- User who made the change
- Timestamp of change
- Previous and new values
- IP address of the request

## 🧪 Testing

### Demo Data
The system includes comprehensive demo data:
- 10 class levels (Primary 1 to Grade 10)
- 8 subjects (core and elective)
- 8 classes with different streams
- 3 devices (biometric, RFID, QR scanner)
- Complete school settings configuration

### Test Commands
```bash
# Initialize demo settings
python scripts/init_settings.py

# Test settings API
curl -X GET http://localhost:8000/api/v1/settings/summary \
  -H "Authorization: Bearer <token>" \
  -H "X-Tenant-ID: demo"

# Test enum endpoints
curl -X GET http://localhost:8000/api/v1/settings/enums/attendance-modes \
  -H "Authorization: Bearer <token>" \
  -H "X-Tenant-ID: demo"
```

## 📈 Future Enhancements

### Planned Features
1. **Settings Templates**: Pre-configured templates for different school types
2. **Settings Import/Export**: Bulk settings management
3. **Settings Validation**: Advanced validation rules
4. **Settings History**: Version control for settings changes
5. **Settings Migration**: Tools for upgrading settings between versions

### Integration Points
1. **Biometric Devices**: Real-time device status monitoring
2. **Notification Services**: SMS/Email provider integration
3. **Payment Gateways**: Fee management integration
4. **ERP Systems**: Integration with existing school management systems

---

**Status**: ✅ Settings module fully implemented and ready for production use!

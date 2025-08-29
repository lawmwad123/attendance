# 🧑‍💼 Visitor Management System

## 📋 Overview

The Visitor Management System is a comprehensive solution integrated into the School Attendance System that provides complete control over who enters and exits the school premises. It offers pre-registration, walk-in registration, approval workflows, check-in/check-out tracking, and security features.

## 🎯 Key Features

### ✅ Core Functionality
- **Visitor Registration** (pre-registration and walk-in)
- **Check-in/Check-out** with QR codes and RFID cards
- **Approval Workflows** (auto, host, admin, or both)
- **Visitor Badges** with photo capture
- **Blacklist Management** for security
- **Emergency Evacuation** lists
- **Analytics & Reporting** for insights

### 🔐 Security Features
- **Blacklist/Watchlist** to deny entry for certain individuals
- **ID Verification** requirements
- **Emergency Evacuation** tracking
- **Visitor Photo Capture** for records
- **Audit Trail** with complete activity logs

### 📱 Integration
- **Gate Pass Integration** - links visitor entry with student gate passes
- **Notification System** - alerts hosts, parents, and security
- **Multi-tenant** - each school has isolated visitor data
- **Role-based Access** - different permissions for different user types

## 🏗️ Architecture

### Database Models

#### 1. Visitor
```python
class Visitor(TenantBaseModel):
    # Basic Information
    first_name, last_name, email, phone
    id_type, id_number, id_photo_url
    
    # Visit Details
    visitor_type, purpose, host_user_id, host_student_id
    requested_entry_time, expected_exit_time
    actual_entry_time, actual_exit_time
    
    # Status and Approval
    status, approved_by_user_id, approved_at, approval_notes
    
    # Access Control
    qr_code, temp_rfid_card, badge_number
    
    # Security
    is_blacklisted, blacklist_reason, security_notes
    
    # Entry/Exit Information
    entry_gate, exit_gate, entry_security_guard_id, exit_security_guard_id
    entry_verified, exit_verified
    
    # Notifications
    host_notified, parent_notified
    
    # Additional Information
    vehicle_number, company_name, emergency_contact, special_instructions
    
    # Pre-registration
    is_pre_registered, pre_registered_by_user_id, pre_registration_date
```

#### 2. VisitorLog
```python
class VisitorLog(TenantBaseModel):
    visitor_id, action, performed_by_user_id, performed_at, notes
    device_info, location_info, ip_address
```

#### 3. VisitorBlacklist
```python
class VisitorBlacklist(TenantBaseModel):
    first_name, last_name, phone, email, id_number, id_type
    reason, blacklisted_by_user_id, blacklisted_at, expires_at, is_active
    notes, photo_url
```

#### 4. VisitorSettings
```python
class VisitorSettings(TenantBaseModel):
    # Visiting Hours
    visiting_hours_start, visiting_hours_end
    
    # Duration Limits
    max_visit_duration_hours, auto_checkout_after_hours
    
    # Approval Settings
    approval_workflow, auto_approve_parent_visits, require_id_verification
    
    # Notification Settings
    notify_host_on_arrival, notify_parent_on_visitor
    notify_security_on_overstay, notify_admin_on_blacklisted
    
    # Badge Settings
    print_visitor_badges, badge_expiry_hours, require_photo_capture
    
    # Security Settings
    enable_blacklist, enable_emergency_evacuation, require_vehicle_registration
    
    # Integration Settings
    integrate_with_gate_pass, enable_qr_codes, enable_temp_rfid
    
    # Pre-registration Settings
    allow_pre_registration, pre_registration_hours_ahead, auto_approve_pre_registered
    
    # Reporting Settings
    daily_visitor_reports, weekly_visitor_analytics, security_alert_reports
```

### API Endpoints

#### Visitor Management
- `GET /visitors` - List visitors with filtering
- `POST /visitors` - Create new visitor
- `GET /visitors/{id}` - Get specific visitor
- `PUT /visitors/{id}` - Update visitor
- `POST /visitors/{id}/check-in` - Check in visitor
- `POST /visitors/{id}/check-out` - Check out visitor
- `POST /visitors/{id}/approve` - Approve visitor
- `POST /visitors/{id}/deny` - Deny visitor

#### Pre-registration
- `POST /visitors/pre-register` - Pre-register visitor

#### Blacklist Management
- `GET /visitors/blacklist` - Get blacklisted visitors
- `POST /visitors/blacklist` - Add to blacklist
- `DELETE /visitors/blacklist/{id}` - Remove from blacklist

#### Settings
- `GET /visitors/settings` - Get visitor settings
- `POST /visitors/settings` - Create visitor settings
- `PUT /visitors/settings` - Update visitor settings

#### Analytics & Reports
- `GET /visitors/analytics` - Get visitor analytics
- `GET /visitors/emergency-evacuation` - Get emergency evacuation list

## 🔄 Workflows

### 1. Pre-registration Workflow
```
1. Staff/Admin pre-registers visitor
2. System generates QR code
3. Visitor receives QR code via email/SMS
4. Visitor presents QR code at gate
5. Security scans QR code
6. Visitor is checked in automatically
```

### 2. Walk-in Registration Workflow
```
1. Visitor arrives at gate
2. Security registers visitor details
3. System checks blacklist
4. If approved → Check in immediately
5. If pending → Send approval request
6. Host/Admin approves/denies
7. If approved → Check in
8. If denied → Visitor leaves
```

### 3. Check-in/Check-out Workflow
```
1. Visitor presents QR code/badge
2. Security verifies identity
3. System records entry time and gate
4. Host is notified of arrival
5. During visit → Monitor for overstay
6. Visitor requests exit
7. Security scans QR code/badge
8. System records exit time and gate
9. Visit duration calculated
```

### 4. Approval Workflows
- **Auto Approve**: No approval needed
- **Host Approve**: Only the host can approve
- **Admin Approve**: Only admins can approve
- **Both Approve**: Both host and admin must approve

## 🎨 Frontend Features

### Visitor Dashboard
- **Analytics Cards**: Today's visitors, currently inside, overdue, blacklisted attempts
- **Tabbed Interface**: All, Pending, Inside, Overdue visitors
- **Search & Filter**: By name, type, status, date range
- **Quick Actions**: Check-in, check-out, approve, deny

### Visitor Registration
- **Add Visitor Modal**: Complete visitor information form
- **Pre-registration**: Advanced booking with time slots
- **ID Verification**: Photo capture and document scanning
- **Host Assignment**: Link to staff or students

### Security Features
- **Blacklist Management**: Add/remove from blacklist
- **Emergency Evacuation**: Real-time list of visitors inside
- **Visitor Badges**: Print temporary badges with QR codes
- **Audit Trail**: Complete activity logs

## 🔧 Configuration

### Visitor Settings
```typescript
interface VisitorSettings {
  // Visiting Hours
  visiting_hours_start: "09:00"
  visiting_hours_end: "16:00"
  
  // Duration Limits
  max_visit_duration_hours: 2
  auto_checkout_after_hours: 4
  
  // Approval Settings
  approval_workflow: "host_approve"
  auto_approve_parent_visits: true
  require_id_verification: true
  
  // Notification Settings
  notify_host_on_arrival: true
  notify_parent_on_visitor: true
  notify_security_on_overstay: true
  
  // Badge Settings
  print_visitor_badges: true
  badge_expiry_hours: 8
  require_photo_capture: false
  
  // Security Settings
  enable_blacklist: true
  enable_emergency_evacuation: true
  
  // Integration Settings
  integrate_with_gate_pass: true
  enable_qr_codes: true
  enable_temp_rfid: false
  
  // Pre-registration Settings
  allow_pre_registration: true
  pre_registration_hours_ahead: 24
  auto_approve_pre_registered: false
}
```

## 🚀 Getting Started

### 1. Database Setup
The visitor management tables are created automatically when you run:
```bash
alembic upgrade head
```

### 2. API Integration
The visitor management API is available at `/api/v1/visitors/` and includes all CRUD operations.

### 3. Frontend Integration
The visitor management page is available at `/visitors` and is integrated into the main navigation.

### 4. Settings Configuration
Configure visitor management settings through the main settings page under the "Visitor Management" tab.

## 📊 Analytics & Reporting

### Visitor Analytics
- **Daily/Weekly/Monthly** visitor counts
- **Popular visitor types** and peak hours
- **Average visit duration** and overstay tracking
- **Blacklisted attempts** and security incidents

### Reports
- **Daily visitor logs** with detailed information
- **Security alerts** for suspicious activity
- **Emergency evacuation** lists
- **Host notification** reports

## 🔐 Security Considerations

### Data Protection
- All visitor data is **tenant-isolated** (school-specific)
- **Audit trails** for all visitor activities
- **Encrypted storage** for sensitive information
- **Access control** based on user roles

### Physical Security
- **QR code verification** for entry/exit
- **Photo capture** for visitor identification
- **Blacklist checking** before entry
- **Emergency evacuation** tracking

### Compliance
- **Data retention** policies for visitor records
- **Privacy protection** for visitor information
- **Audit compliance** for security requirements
- **GDPR compliance** for data handling

## 🎯 Benefits

### For Schools
- **Enhanced Security**: Complete control over who enters the premises
- **Audit Trail**: Digital records instead of paper logbooks
- **Emergency Response**: Quick evacuation lists and contact information
- **Compliance**: Meeting security and safety requirements

### For Staff
- **Efficient Management**: Streamlined visitor registration process
- **Notifications**: Real-time alerts for visitor arrivals
- **Integration**: Seamless connection with attendance and gate pass systems
- **Reporting**: Comprehensive analytics and insights

### For Visitors
- **Convenient Registration**: Pre-registration and QR code access
- **Clear Communication**: Status updates and approval notifications
- **Professional Experience**: Modern, efficient check-in process
- **Safety**: Enhanced security measures

## 🔮 Future Enhancements

### Planned Features
- **Facial Recognition**: Automated visitor identification
- **Mobile App**: Visitor self-registration and QR code generation
- **Integration APIs**: Connect with external security systems
- **Advanced Analytics**: AI-powered insights and predictions

### Potential Integrations
- **CCTV Systems**: Link visitor records with camera feeds
- **Access Control**: Integration with door locks and card readers
- **Emergency Services**: Direct connection to police/fire departments
- **Parent Portal**: Real-time visitor notifications for parents

## 📞 Support

For technical support or questions about the Visitor Management System:

1. **Documentation**: Check this file and the API documentation
2. **Testing**: Use the test script `scripts/test_visitor_management.py`
3. **Issues**: Report bugs through the project's issue tracker
4. **Features**: Request new features through the project's feature request system

---

**Visitor Management System** - Making school security smarter, safer, and more efficient! 🏫🔐

"""
Casbin RBAC + ABAC configuration for the attendance management system.
"""
import os
from typing import Optional, Dict, Any
from casbin import Enforcer
from casbin_sqlalchemy_adapter import Adapter
from sqlalchemy import create_engine
from app.core.config import settings


class CasbinManager:
    """
    Manages Casbin enforcer for RBAC + ABAC authorization.
    """
    
    def __init__(self):
        self.enforcer: Optional[Enforcer] = None
        try:
            self._initialize_enforcer()
        except Exception as e:
            print(f"Warning: Casbin initialization failed: {e}")
            # Continue without Casbin for now
    
    def _initialize_enforcer(self):
        """Initialize the Casbin enforcer with RBAC + ABAC model."""
        
        # Check if DATABASE_URL is available
        if not settings.DATABASE_URL:
            print("Warning: DATABASE_URL not configured, skipping Casbin initialization")
            return
        
        try:
            # Create database adapter
            database_url = settings.DATABASE_URL.replace("+asyncpg", "+psycopg2")
            engine = create_engine(database_url)
            adapter = Adapter(engine, "casbin_rule")
            
            # Create enforcer with RBAC + ABAC model
            model_path = os.path.join(os.path.dirname(__file__), "casbin_model.conf")
            if not os.path.exists(model_path):
                print(f"Warning: Casbin model file not found at {model_path}")
                return
                
            self.enforcer = Enforcer(model_path, adapter)
            
            # Load policies
            self._load_default_policies()
        except Exception as e:
            print(f"Error initializing Casbin enforcer: {e}")
            self.enforcer = None
    
    def _load_default_policies(self):
        """Load default RBAC + ABAC policies."""
        
        if not self.enforcer:
            print("Warning: Enforcer not initialized, skipping policy loading")
            return
        
        try:
            # Role hierarchy
            self.enforcer.add_role_for_user("admin", "teacher")
            self.enforcer.add_role_for_user("admin", "security")
            self.enforcer.add_role_for_user("admin", "parent")
            self.enforcer.add_role_for_user("teacher", "parent")
            
            # Super admin hierarchy
            self.enforcer.add_role_for_user("system_developer", "system_admin")
            self.enforcer.add_role_for_user("system_admin", "support_agent")
            self.enforcer.add_role_for_user("system_admin", "financial_admin")
            
            # Page-level permissions
            self._add_page_permissions()
            
            # Feature-level permissions
            self._add_feature_permissions()
            
            # API endpoint permissions
            self._add_api_permissions()
            
            # Security-specific permissions
            self._add_security_permissions()
            
            # Save policies
            self.enforcer.save_policy()
        except Exception as e:
            print(f"Error loading default policies: {e}")
    
    def _add_page_permissions(self):
        """Add page-level access permissions."""
        
        if not self.enforcer:
            return
        
        # Dashboard pages
        pages = [
            # General pages
            ("admin", "page", "dashboard", "read"),
            ("teacher", "page", "dashboard", "read"),
            ("parent", "page", "dashboard", "read"),
            ("security", "page", "dashboard", "read"),
            
            # Student management
            ("admin", "page", "students", "read"),
            ("admin", "page", "students", "write"),
            ("teacher", "page", "students", "read"),
            
            # Attendance
            ("admin", "page", "attendance", "read"),
            ("admin", "page", "attendance", "write"),
            ("teacher", "page", "attendance", "read"),
            ("teacher", "page", "attendance", "write"),
            ("parent", "page", "attendance", "read"),
            
            # Gate pass
            ("admin", "page", "gate-pass", "read"),
            ("admin", "page", "gate-pass", "write"),
            ("security", "page", "gate-pass", "read"),
            ("security", "page", "gate-pass", "write"),
            ("parent", "page", "gate-pass", "read"),
            ("parent", "page", "gate-pass", "write"),
            
            # Users
            ("admin", "page", "users", "read"),
            ("admin", "page", "users", "write"),
            
            # Settings
            ("admin", "page", "settings", "read"),
            ("admin", "page", "settings", "write"),
            
            # Analytics
            ("admin", "page", "analytics", "read"),
            ("teacher", "page", "analytics", "read"),
            
            # Staff attendance
            ("admin", "page", "staff-attendance", "read"),
            ("admin", "page", "staff-attendance", "write"),
            ("teacher", "page", "staff-attendance", "read"),
            ("teacher", "page", "staff-attendance", "write"),
            
            # Visitor management
            ("admin", "page", "visitors", "read"),
            ("admin", "page", "visitors", "write"),
            ("security", "page", "visitors", "read"),
            ("security", "page", "visitors", "write"),
        ]
        
        for role, resource_type, resource, action in pages:
            self.enforcer.add_policy(role, resource_type, resource, action)
    
    def _add_feature_permissions(self):
        """Add feature-level access permissions."""
        
        if not self.enforcer:
            return
        
        features = [
            # Attendance features
            ("admin", "feature", "attendance_management", "full"),
            ("teacher", "feature", "attendance_management", "limited"),
            ("parent", "feature", "attendance_view", "read"),
            
            # Gate pass features
            ("admin", "feature", "gate_pass_management", "full"),
            ("security", "feature", "gate_pass_verification", "limited"),
            ("parent", "feature", "gate_pass_approval", "limited"),
            
            # User management
            ("admin", "feature", "user_management", "full"),
            
            # Settings management
            ("admin", "feature", "settings_management", "full"),
            
            # Analytics
            ("admin", "feature", "analytics", "full"),
            ("teacher", "feature", "analytics", "limited"),
            
            # Staff attendance
            ("admin", "feature", "staff_attendance", "full"),
            ("teacher", "feature", "staff_attendance", "limited"),
            
            # Visitor management
            ("admin", "feature", "visitor_management", "full"),
            ("security", "feature", "visitor_management", "limited"),
            
            # Notifications
            ("admin", "feature", "notifications", "full"),
            ("teacher", "feature", "notifications", "limited"),
            ("parent", "feature", "notifications", "limited"),
            ("security", "feature", "notifications", "limited"),
        ]
        
        for role, resource_type, resource, action in features:
            self.enforcer.add_policy(role, resource_type, resource, action)
    
    def _add_api_permissions(self):
        """Add API endpoint permissions."""
        
        if not self.enforcer:
            return
        
        api_endpoints = [
            # Auth endpoints
            ("admin", "api", "/api/v1/auth/*", "GET"),
            ("admin", "api", "/api/v1/auth/*", "POST"),
            ("teacher", "api", "/api/v1/auth/*", "GET"),
            ("teacher", "api", "/api/v1/auth/*", "POST"),
            ("parent", "api", "/api/v1/auth/*", "GET"),
            ("parent", "api", "/api/v1/auth/*", "POST"),
            ("security", "api", "/api/v1/auth/*", "GET"),
            ("security", "api", "/api/v1/auth/*", "POST"),
            
            # Students
            ("admin", "api", "/api/v1/students/*", "GET"),
            ("admin", "api", "/api/v1/students/*", "POST"),
            ("admin", "api", "/api/v1/students/*", "PUT"),
            ("admin", "api", "/api/v1/students/*", "DELETE"),
            ("teacher", "api", "/api/v1/students/*", "GET"),
            
            # Attendance
            ("admin", "api", "/api/v1/attendance/*", "GET"),
            ("admin", "api", "/api/v1/attendance/*", "POST"),
            ("admin", "api", "/api/v1/attendance/*", "PUT"),
            ("teacher", "api", "/api/v1/attendance/*", "GET"),
            ("teacher", "api", "/api/v1/attendance/*", "POST"),
            ("parent", "api", "/api/v1/attendance/*", "GET"),
            
            # Gate pass
            ("admin", "api", "/api/v1/gate-pass/*", "GET"),
            ("admin", "api", "/api/v1/gate-pass/*", "POST"),
            ("admin", "api", "/api/v1/gate-pass/*", "PUT"),
            ("security", "api", "/api/v1/gate-pass/*", "GET"),
            ("security", "api", "/api/v1/gate-pass/*", "PUT"),
            ("parent", "api", "/api/v1/gate-pass/*", "GET"),
            ("parent", "api", "/api/v1/gate-pass/*", "POST"),
            ("parent", "api", "/api/v1/gate-pass/*", "PUT"),
            
            # Users
            ("admin", "api", "/api/v1/users/*", "GET"),
            ("admin", "api", "/api/v1/users/*", "POST"),
            ("admin", "api", "/api/v1/users/*", "PUT"),
            ("admin", "api", "/api/v1/users/*", "DELETE"),
            
            # Settings
            ("admin", "api", "/api/v1/settings/*", "GET"),
            ("admin", "api", "/api/v1/settings/*", "POST"),
            ("admin", "api", "/api/v1/settings/*", "PUT"),
            ("teacher", "api", "/api/v1/settings/*", "GET"),
            ("parent", "api", "/api/v1/settings/*", "GET"),
            ("security", "api", "/api/v1/settings/*", "GET"),
            
            # Staff attendance
            ("admin", "api", "/api/v1/staff-attendance/*", "GET"),
            ("admin", "api", "/api/v1/staff-attendance/*", "POST"),
            ("admin", "api", "/api/v1/staff-attendance/*", "PUT"),
            ("teacher", "api", "/api/v1/staff-attendance/*", "GET"),
            ("teacher", "api", "/api/v1/staff-attendance/*", "POST"),
            
            # Visitors
            ("admin", "api", "/api/v1/visitors/*", "GET"),
            ("admin", "api", "/api/v1/visitors/*", "POST"),
            ("admin", "api", "/api/v1/visitors/*", "PUT"),
            ("admin", "api", "/api/v1/visitors/*", "DELETE"),
            ("security", "api", "/api/v1/visitors/*", "GET"),
            ("security", "api", "/api/v1/visitors/*", "POST"),
            ("security", "api", "/api/v1/visitors/*", "PUT"),
        ]
        
        for role, resource_type, resource, action in api_endpoints:
            self.enforcer.add_policy(role, resource_type, resource, action)

    def _add_security_permissions(self):
        """Add security-specific permissions."""
        
        if not self.enforcer:
            return
        
        # Security page permissions
        security_pages = [
            ("security", "page", "security/dashboard", "read"),
            ("security", "page", "security/check-in-out", "read"),
            ("security", "page", "security/visitors", "read"),
            ("security", "page", "security/qr-scanner", "read"),
            ("security", "page", "security/card-reader", "read"),
            ("security", "page", "security/search", "read"),
            ("security", "page", "security/incidents", "read"),
            ("security", "page", "security/notifications", "read"),
        ]
        
        # Security feature permissions
        security_features = [
            ("security", "feature", "attendance/mark", "write"),
            ("security", "feature", "visitors/register", "write"),
            ("security", "feature", "visitors/checkout", "write"),
            ("security", "feature", "people/search", "read"),
            ("security", "feature", "dashboard/view", "read"),
            ("security", "feature", "reports/view", "read"),
        ]
        
        # Security API permissions
        security_apis = [
            ("security", "api", "/api/v1/security/dashboard", "GET"),
            ("security", "api", "/api/v1/security/search", "GET"),
            ("security", "api", "/api/v1/security/attendance/mark", "POST"),
            ("security", "api", "/api/v1/security/recent-checkins", "GET"),
            ("security", "api", "/api/v1/security/visitors/register", "POST"),
            ("security", "api", "/api/v1/security/visitors/*/checkout", "POST"),
            ("security", "api", "/api/v1/security/visitors", "GET"),
        ]
        
        # Add security page permissions
        for role, resource_type, resource, action in security_pages:
            self.enforcer.add_policy(role, resource_type, resource, action)
        
        # Add security feature permissions
        for role, resource_type, resource, action in security_features:
            self.enforcer.add_policy(role, resource_type, resource, action)
        
        # Add security API permissions
        for role, resource_type, resource, action in security_apis:
            self.enforcer.add_policy(role, resource_type, resource, action)
    
    def check_permission(self, role: str, resource_type: str, resource: str, action: str, 
                        attributes: Optional[Dict[str, Any]] = None) -> bool:
        """
        Check if a role has permission to perform an action on a resource.
        
        Args:
            role: User role
            resource_type: Type of resource (page, feature, api)
            resource: Resource identifier
            action: Action to perform
            attributes: Optional attributes for ABAC evaluation
            
        Returns:
            bool: True if permission is granted, False otherwise
        """
        if not self.enforcer:
            return False
        
        # For ABAC, we need to pass attributes as additional parameters
        if attributes:
            # Convert attributes to list format for Casbin
            attr_list = []
            for key, value in attributes.items():
                attr_list.extend([key, str(value)])
            
            return self.enforcer.enforce(role, resource_type, resource, action, *attr_list)
        else:
            return self.enforcer.enforce(role, resource_type, resource, action)
    
    def add_user_role(self, user_id: str, role: str) -> bool:
        """Add a role to a user."""
        if not self.enforcer:
            return False
        return self.enforcer.add_role_for_user(user_id, role)
    
    def remove_user_role(self, user_id: str, role: str) -> bool:
        """Remove a role from a user."""
        if not self.enforcer:
            return False
        return self.enforcer.remove_role_for_user(user_id, role)
    
    def get_user_roles(self, user_id: str) -> list:
        """Get all roles for a user."""
        if not self.enforcer:
            return []
        return self.enforcer.get_roles_for_user(user_id)
    
    def add_policy(self, role: str, resource_type: str, resource: str, action: str) -> bool:
        """Add a new policy."""
        if not self.enforcer:
            return False
        return self.enforcer.add_policy(role, resource_type, resource, action)
    
    def remove_policy(self, role: str, resource_type: str, resource: str, action: str) -> bool:
        """Remove a policy."""
        if not self.enforcer:
            return False
        return self.enforcer.remove_policy(role, resource_type, resource, action)
    
    def get_policies(self) -> list:
        """Get all policies."""
        if not self.enforcer:
            return []
        return self.enforcer.get_policy()


# Global instance - lazy initialization
casbin_manager = None

def get_casbin_manager():
    """Get the global Casbin manager instance, initializing if necessary."""
    global casbin_manager
    if casbin_manager is None:
        casbin_manager = CasbinManager()
    return casbin_manager

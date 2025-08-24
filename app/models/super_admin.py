from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Enum as SQLEnum, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum
from datetime import datetime

from app.models.base import BaseModel


class SuperAdminRole(str, Enum):
    """Super admin roles in the system."""
    SYSTEM_DEVELOPER = "SYSTEM_DEVELOPER"    # Full system access
    SYSTEM_ADMIN = "SYSTEM_ADMIN"            # System administration
    SUPPORT_AGENT = "SUPPORT_AGENT"          # Support and troubleshooting
    FINANCIAL_ADMIN = "FINANCIAL_ADMIN"      # Financial management only


class SuperAdminStatus(str, Enum):
    """Super admin status."""
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    SUSPENDED = "SUSPENDED"


class SystemLogLevel(str, Enum):
    """System log levels."""
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


class SupportTicketStatus(str, Enum):
    """Support ticket status."""
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"


class SupportTicketPriority(str, Enum):
    """Support ticket priority."""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"


class SuperAdmin(BaseModel):
    """
    Super admin model for system-wide administration.
    """
    __tablename__ = "super_admins"
    
    # Basic Information
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)
    
    # Authentication
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    
    # Role and Permissions
    role = Column(SQLEnum(SuperAdminRole), nullable=False, default=SuperAdminRole.SUPPORT_AGENT)
    status = Column(SQLEnum(SuperAdminStatus), nullable=False, default=SuperAdminStatus.ACTIVE)
    
    # Security
    two_factor_enabled = Column(Boolean, default=False)
    two_factor_secret = Column(String(255), nullable=True)
    last_login = Column(DateTime(timezone=True), nullable=True)
    login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime(timezone=True), nullable=True)
    
    # Profile
    profile_image = Column(String(255), nullable=True)
    bio = Column(Text, nullable=True)
    
    # Password Reset
    reset_token = Column(String(255), nullable=True, index=True)
    reset_token_expires = Column(DateTime, nullable=True)
    
    # Relationships
    system_logs = relationship("SystemLog", back_populates="admin")
    support_tickets = relationship("SupportTicket", back_populates="assigned_admin")
    admin_actions = relationship("AdminActionLog", back_populates="admin")
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    def __repr__(self):
        return f"<SuperAdmin(email='{self.email}', role='{self.role}')>"


class SystemLog(BaseModel):
    """
    System-wide activity logs.
    """
    __tablename__ = "system_logs"
    
    # Log Information
    level = Column(SQLEnum(SystemLogLevel), nullable=False, default=SystemLogLevel.INFO)
    message = Column(Text, nullable=False)
    details = Column(JSON, nullable=True)  # Additional structured data
    
    # Context
    admin_id = Column(Integer, ForeignKey("super_admins.id"), nullable=True)
    school_id = Column(Integer, ForeignKey("schools.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    ip_address = Column(String(45), nullable=True)  # IPv6 compatible
    user_agent = Column(Text, nullable=True)
    
    # Relationships
    admin = relationship("SuperAdmin", back_populates="system_logs")
    
    def __repr__(self):
        return f"<SystemLog(level='{self.level}', message='{self.message[:50]}...')>"


class SupportTicket(BaseModel):
    """
    Support tickets from schools.
    """
    __tablename__ = "support_tickets"
    
    # Ticket Information
    ticket_number = Column(String(20), unique=True, nullable=False, index=True)
    subject = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(SQLEnum(SupportTicketPriority), nullable=False, default=SupportTicketPriority.MEDIUM)
    status = Column(SQLEnum(SupportTicketStatus), nullable=False, default=SupportTicketStatus.OPEN)
    
    # School Information
    school_id = Column(Integer, ForeignKey("schools.id"), nullable=False)
    school_name = Column(String(255), nullable=False)  # Denormalized for performance
    contact_email = Column(String(255), nullable=False)
    contact_phone = Column(String(20), nullable=True)
    
    # Assignment
    assigned_admin_id = Column(Integer, ForeignKey("super_admins.id"), nullable=True)
    assigned_at = Column(DateTime(timezone=True), nullable=True)
    
    # Resolution
    resolution = Column(Text, nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    resolution_time_hours = Column(Integer, nullable=True)  # Time to resolution
    
    # Relationships
    assigned_admin = relationship("SuperAdmin", back_populates="support_tickets")
    
    def __repr__(self):
        return f"<SupportTicket(number='{self.ticket_number}', subject='{self.subject}')>"


class AdminActionLog(BaseModel):
    """
    Log of all admin actions for audit trail.
    """
    __tablename__ = "admin_action_logs"
    
    # Action Information
    action = Column(String(100), nullable=False)  # e.g., "create_school", "suspend_user"
    resource_type = Column(String(50), nullable=False)  # e.g., "school", "user", "system"
    resource_id = Column(Integer, nullable=True)  # ID of the affected resource
    details = Column(JSON, nullable=True)  # Additional action details
    
    # Admin Information
    admin_id = Column(Integer, ForeignKey("super_admins.id"), nullable=False)
    admin_email = Column(String(255), nullable=False)  # Denormalized for audit
    
    # Context
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    
    # Relationships
    admin = relationship("SuperAdmin", back_populates="admin_actions")
    
    def __repr__(self):
        return f"<AdminActionLog(action='{self.action}', admin='{self.admin_email}')>"


class SystemConfiguration(BaseModel):
    """
    System-wide configuration settings.
    """
    __tablename__ = "system_configurations"
    
    # Configuration
    key = Column(String(100), unique=True, nullable=False, index=True)
    value = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    is_public = Column(Boolean, default=False)  # Whether schools can see this config
    
    # Metadata
    data_type = Column(String(20), default="string")  # string, integer, boolean, json
    category = Column(String(50), nullable=False)  # e.g., "billing", "features", "security"
    
    def __repr__(self):
        return f"<SystemConfiguration(key='{self.key}', value='{self.value}')>"


class SystemAnnouncement(BaseModel):
    """
    System-wide announcements to schools.
    """
    __tablename__ = "system_announcements"
    
    # Announcement Information
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    is_active = Column(Boolean, default=True)
    
    # Targeting
    target_schools = Column(JSON, nullable=True)  # List of school IDs, null for all
    target_roles = Column(JSON, nullable=True)  # List of user roles to target
    
    # Timing
    start_date = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)
    
    # Creator
    created_by_admin_id = Column(Integer, ForeignKey("super_admins.id"), nullable=False)
    
    def __repr__(self):
        return f"<SystemAnnouncement(title='{self.title}', active={self.is_active})>"


class FeatureFlag(BaseModel):
    """
    Feature flags for controlling system features.
    """
    __tablename__ = "feature_flags"
    
    # Flag Information
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    is_enabled = Column(Boolean, default=False)
    
    # Targeting
    target_schools = Column(JSON, nullable=True)  # List of school IDs, null for all
    target_percentage = Column(Integer, default=100)  # Percentage of schools to enable for
    
    # Metadata
    category = Column(String(50), nullable=False)  # e.g., "beta", "premium", "experimental"
    
    def __repr__(self):
        return f"<FeatureFlag(name='{self.name}', enabled={self.is_enabled})>"

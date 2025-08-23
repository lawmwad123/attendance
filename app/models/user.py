from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from enum import Enum

from app.models.base import TenantBaseModel


class UserRole(str, Enum):
    """User roles in the system."""
    ADMIN = "ADMIN"          # School administrator
    TEACHER = "TEACHER"      # Teachers
    PARENT = "PARENT"        # Parents
    SECURITY = "SECURITY"    # Security guards
    STUDENT = "STUDENT"      # Students (for future mobile app access)


class UserStatus(str, Enum):
    """User status."""
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    PENDING = "PENDING"
    SUSPENDED = "SUSPENDED"


class User(TenantBaseModel):
    """
    User model for all types of users in the system.
    """
    __tablename__ = "users"
    
    # Basic Information
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), nullable=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)
    
    # Authentication
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    
    # Role and Permissions
    role = Column(SQLEnum(UserRole), nullable=False, default=UserRole.TEACHER)
    status = Column(SQLEnum(UserStatus), nullable=False, default=UserStatus.PENDING)
    
    # Additional Info
    employee_id = Column(String(50), nullable=True, unique=True)  # For staff
    department = Column(String(100), nullable=True)  # For teachers/staff
    hire_date = Column(String(10), nullable=True)  # YYYY-MM-DD format
    
    # Profile Image
    profile_image = Column(String(255), nullable=True)  # Path to profile image
    
    # Relationships
    school = relationship("School", back_populates="users", foreign_keys="User.school_id")
    
    # Parent-specific relationships
    children = relationship("Student", back_populates="parent", foreign_keys="Student.parent_id")
    
    # Teacher-specific relationships
    classes_taught = relationship("Class", back_populates="teacher")
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    def __repr__(self):
        return f"<User(email='{self.email}', role='{self.role}', school_id={self.school_id})>" 
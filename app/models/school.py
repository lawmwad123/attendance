from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.models.base import BaseModel


class School(BaseModel):
    """
    School model - represents a tenant in the multi-tenant system.
    """
    __tablename__ = "schools"
    
    # Basic Information
    name = Column(String(255), nullable=False, index=True)
    slug = Column(String(100), unique=True, nullable=False, index=True)  # For subdomain
    address = Column(Text, nullable=True)
    phone = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True)
    website = Column(String(255), nullable=True)
    
    # School Details
    principal_name = Column(String(255), nullable=True)
    total_students = Column(Integer, default=0)
    total_teachers = Column(Integer, default=0)
    
    # Settings
    is_active = Column(Boolean, default=True, nullable=False)
    timezone = Column(String(50), default="UTC")
    school_start_time = Column(String(10), default="08:00")  # HH:MM format
    school_end_time = Column(String(10), default="15:00")   # HH:MM format
    
    # Subscription info (for future SaaS features)
    subscription_plan = Column(String(50), default="basic")
    subscription_expires_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    users = relationship("User", back_populates="school")
    students = relationship("Student", back_populates="school")
    classes = relationship("Class", back_populates="school")
    
    def __repr__(self):
        return f"<School(name='{self.name}', slug='{self.slug}')>" 
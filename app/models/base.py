from sqlalchemy import Column, Integer, DateTime, String, Boolean, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base
from typing import Optional


class TenantMixin:
    """
    Mixin for multi-tenant models.
    Every model that inherits this will be tenant-aware.
    """
    school_id = Column(Integer, ForeignKey("schools.id"), nullable=False, index=True)


class TimestampMixin:
    """
    Mixin for timestamp fields.
    """
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class BaseModel(Base, TimestampMixin):
    """
    Base model with common fields.
    """
    __abstract__ = True
    
    id = Column(Integer, primary_key=True, index=True)
    
    def dict(self):
        """Convert model to dictionary."""
        result = {}
        for c in self.__table__.columns:
            value = getattr(self, c.name)
            # Convert datetime objects to ISO format strings
            if hasattr(value, 'isoformat'):
                result[c.name] = value.isoformat()
            else:
                result[c.name] = value
        return result


class TenantBaseModel(BaseModel, TenantMixin):
    """
    Base model for tenant-aware models.
    """
    __abstract__ = True 
from pydantic_settings import BaseSettings
from typing import List, Optional
import os


class Settings(BaseSettings):
    # Project Information
    PROJECT_NAME: str = "School Attendance System"
    PROJECT_VERSION: str = "1.0.0"
    PROJECT_DESCRIPTION: str = "Multi-tenant school attendance management system"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = "your-super-secret-key-change-this-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    ALGORITHM: str = "HS256"
    
    # Database - Support both direct URL and individual components
    DATABASE_URL: Optional[str] = None
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "geniusmind"
    POSTGRES_DB: str = "attendance_db"
    POSTGRES_PORT: str = "5432"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173,http://localhost:5173,http://127.0.0.1:5173,http://127.0.0.1:5173"
    ALLOWED_HOSTS: List[str] = ["*"]  # Configure for production
    
    # Frontend URL for email links
    FRONTEND_URL: str = "http://localhost:5173"
    
    # Multi-tenancy
    DEFAULT_TENANT_ID: str = "demo-school"
    TENANT_HEADER_NAME: str = "X-Tenant-ID"
    TENANT_HEADER: str = "X-Tenant-ID"
    DEFAULT_TENANT: str = "demo"
    
    # Development
    DEBUG: bool = False
    ENVIRONMENT: str = "development"
    
    # SMS/Notifications
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_PHONE_NUMBER: Optional[str] = None
    
    # Email
    SMTP_TLS: bool = True
    SMTP_PORT: Optional[int] = None
    SMTP_HOST: Optional[str] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAIL_RESET_TOKEN_EXPIRE_HOURS: int = 24
    
    # File Upload Settings
    UPLOAD_DIR: str = "uploads"
    PROFILE_IMAGES_DIR: str = "profile_images"
    MAX_FILE_SIZE: int = 5 * 1024 * 1024  # 5MB
    ALLOWED_IMAGE_TYPES: List[str] = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    IMAGE_MAX_WIDTH: int = 800
    IMAGE_MAX_HEIGHT: int = 800
    IMAGE_QUALITY: int = 85
    
    @property
    def FINAL_DATABASE_URL(self) -> str:
        # Use DATABASE_URL if provided, otherwise construct from components
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
    
    @property
    def SYNC_DATABASE_URL(self) -> str:
        # Use DATABASE_URL if provided, otherwise construct from components
        if self.DATABASE_URL:
            return self.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings() 
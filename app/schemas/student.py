from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from datetime import date, datetime


class StudentBase(BaseModel):
    """Base student schema with common fields."""
    student_id: str = Field(..., min_length=1, max_length=50)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    date_of_birth: Optional[date] = None
    address: Optional[str] = None
    guardian_name: Optional[str] = Field(None, max_length=200)
    guardian_phone: Optional[str] = Field(None, max_length=20)
    guardian_email: Optional[EmailStr] = None
    class_name: Optional[str] = Field(None, max_length=50)
    section: Optional[str] = Field(None, max_length=10)
    admission_date: Optional[date] = None
    profile_image: Optional[str] = None


class StudentCreate(StudentBase):
    """Schema for creating a new student."""
    pass


class StudentUpdate(BaseModel):
    """Schema for updating a student."""
    student_id: Optional[str] = Field(None, min_length=1, max_length=50)
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    date_of_birth: Optional[date] = None
    address: Optional[str] = None
    guardian_name: Optional[str] = Field(None, max_length=200)
    guardian_phone: Optional[str] = Field(None, max_length=20)
    guardian_email: Optional[EmailStr] = None
    class_name: Optional[str] = Field(None, max_length=50)
    section: Optional[str] = Field(None, max_length=10)
    admission_date: Optional[date] = None
    profile_image: Optional[str] = None
    status: Optional[str] = None


class Student(StudentBase):
    """Schema for student response."""
    id: int
    full_name: str
    status: str
    created_at: str
    
    class Config:
        from_attributes = True


class StudentWithStats(Student):
    """Student schema with attendance statistics."""
    attendance_rate: Optional[float] = None
    total_days: Optional[int] = None
    present_days: Optional[int] = None
    absent_days: Optional[int] = None
    late_days: Optional[int] = None


class StudentList(BaseModel):
    """Schema for paginated student list response."""
    students: list[Student]
    total: int
    page: int
    per_page: int
    total_pages: int 
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date


class AttendanceBase(BaseModel):
    """Base attendance schema."""
    student_id: int
    date: str  # ISO date string
    status: str = Field(..., pattern="^(present|absent|late|excused)$")
    notes: Optional[str] = None


class AttendanceCreate(AttendanceBase):
    """Schema for creating attendance record."""
    pass


class AttendanceUpdate(BaseModel):
    """Schema for updating attendance record."""
    status: Optional[str] = Field(None, pattern="^(present|absent|late|excused)$")
    notes: Optional[str] = None


class StudentInfo(BaseModel):
    """Student information for attendance response."""
    id: int
    student_id: str
    first_name: str
    last_name: str
    full_name: str
    class_name: str
    section: Optional[str]
    status: str


class Attendance(BaseModel):
    """Schema for attendance response."""
    id: int
    student_id: int
    student: StudentInfo
    date: str
    status: str
    check_in_time: Optional[str] = None
    check_out_time: Optional[str] = None
    notes: Optional[str] = None
    marked_by: str
    created_at: str
    
    class Config:
        from_attributes = True


class BulkAttendanceCreate(BaseModel):
    """Schema for bulk attendance creation."""
    records: List[AttendanceCreate]


class AttendanceStats(BaseModel):
    """Schema for attendance statistics."""
    total_students: int
    present: int
    absent: int
    late: int
    excused: int
    attendance_rate: float


class ClassAttendance(BaseModel):
    """Schema for class-wise attendance."""
    class_name: str
    section: str
    total_students: int
    present: int
    absent: int
    attendance_rate: float 
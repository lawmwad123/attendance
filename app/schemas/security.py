from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime

class SecurityDashboardResponse(BaseModel):
    students_present: int
    staff_present: int
    visitors_today: int
    active_incidents: int
    recent_checkins: List[dict]
    active_alerts: List[dict]
    emergency_contacts: List[dict]
    security_officer: dict

class PersonSearchResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    type: str  # "student" or "staff"
    id_number: Optional[str] = None
    employee_id: Optional[str] = None
    class_name: Optional[str] = None

class AttendanceMarkRequest(BaseModel):
    person_id: int
    person_type: str = Field(..., pattern="^(student|staff)$")
    check_type: str = Field(..., pattern="^(IN|OUT)$")
    method: str = Field(..., pattern="^(manual|qr|card|biometric)$")
    location: str = "main_gate"
    notes: Optional[str] = None

class VisitorRegistrationRequest(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    phone: str = Field(..., min_length=10, max_length=15)
    email: Optional[str] = Field(None, max_length=100)
    purpose: str = Field(..., min_length=1, max_length=500)
    meeting_with: str = Field(..., min_length=1, max_length=100)
    location: str = Field(default="main_gate", max_length=50)
    id_number: Optional[str] = Field(None, max_length=50)
    vehicle_number: Optional[str] = Field(None, max_length=20)

class VisitorCheckOutRequest(BaseModel):
    notes: Optional[str] = Field(None, max_length=500)

class RecentActivityResponse(BaseModel):
    person_name: str
    check_type: str
    time: str
    method: str
    timestamp: datetime

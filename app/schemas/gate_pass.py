from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class GatePassBase(BaseModel):
    """Base gate pass schema."""
    student_id: int
    type: str = Field(..., pattern="^(exit|entry|temporary)$")
    reason: str = Field(..., min_length=1, max_length=500)
    requested_time: str  # ISO datetime string
    notes: Optional[str] = None


class GatePassCreate(GatePassBase):
    """Schema for creating a gate pass."""
    pass


class GatePassUpdate(BaseModel):
    """Schema for updating a gate pass."""
    type: Optional[str] = Field(None, pattern="^(exit|entry|temporary)$")
    reason: Optional[str] = Field(None, min_length=1, max_length=500)
    requested_time: Optional[str] = None
    notes: Optional[str] = None


class GatePassApproval(BaseModel):
    """Schema for approving/denying a gate pass."""
    notes: Optional[str] = None


class StudentInfo(BaseModel):
    """Student information for gate pass response."""
    id: int
    student_id: str
    first_name: str
    last_name: str
    full_name: str
    class_name: str
    section: Optional[str]
    status: str


class GatePass(BaseModel):
    """Schema for gate pass response."""
    id: int
    student_id: int
    student: StudentInfo
    type: str
    reason: str
    requested_time: str
    approved_time: Optional[str] = None
    exit_time: Optional[str] = None
    return_time: Optional[str] = None
    status: str
    guardian_approval: bool
    admin_approval: bool
    notes: Optional[str] = None
    approved_by: Optional[str] = None
    created_at: str
    updated_at: str
    
    class Config:
        from_attributes = True 
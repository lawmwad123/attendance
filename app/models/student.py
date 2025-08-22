from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Date, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from enum import Enum

from app.models.base import TenantBaseModel


class StudentStatus(str, Enum):
    """Student status."""
    ACTIVE = "active"
    INACTIVE = "inactive"
    GRADUATED = "graduated"
    TRANSFERRED = "transferred"
    SUSPENDED = "suspended"


class Gender(str, Enum):
    """Gender options."""
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"


class Student(TenantBaseModel):
    """
    Student model.
    """
    __tablename__ = "students"
    
    # Basic Information
    student_id = Column(String(50), nullable=False, unique=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    date_of_birth = Column(Date, nullable=True)
    gender = Column(SQLEnum(Gender), nullable=True)
    
    # Contact Information
    email = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    address = Column(Text, nullable=True)
    emergency_contact = Column(String(20), nullable=True)
    
    # Academic Information
    grade_level = Column(String(10), nullable=False)  # e.g., "Grade 1", "Class 10"
    section = Column(String(10), nullable=True)       # e.g., "A", "B"
    roll_number = Column(String(20), nullable=True)
    admission_date = Column(Date, nullable=True)
    
    # Status
    status = Column(SQLEnum(StudentStatus), nullable=False, default=StudentStatus.ACTIVE)
    is_active = Column(Boolean, default=True)
    
    # Biometric/RFID Information
    rfid_card_id = Column(String(100), nullable=True, unique=True, index=True)
    biometric_id = Column(String(100), nullable=True, unique=True, index=True)
    
    # Parent/Guardian Information
    parent_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    guardian_name = Column(String(200), nullable=True)
    guardian_phone = Column(String(20), nullable=True)
    guardian_relationship = Column(String(50), nullable=True)  # Father, Mother, Guardian, etc.
    
    # Class Assignment
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=True)
    
    # Transportation (for future bus tracking)
    bus_route = Column(String(100), nullable=True)
    pickup_point = Column(String(200), nullable=True)
    
    # Relationships
    school = relationship("School", back_populates="students", foreign_keys="Student.school_id")
    parent = relationship("User", back_populates="children", foreign_keys=[parent_id])
    class_assigned = relationship("Class", back_populates="students")
    attendance_records = relationship("Attendance", back_populates="student")
    gate_pass_requests = relationship("GatePass", back_populates="student")
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    def __repr__(self):
        return f"<Student(student_id='{self.student_id}', name='{self.full_name}', school_id={self.school_id})>"


class Class(TenantBaseModel):
    """
    Class/Section model.
    """
    __tablename__ = "classes"
    
    name = Column(String(100), nullable=False)  # e.g., "Grade 5-A"
    grade_level = Column(String(10), nullable=False)  # e.g., "Grade 5"
    section = Column(String(10), nullable=True)       # e.g., "A"
    subject = Column(String(100), nullable=True)      # For subject-specific classes
    
    # Teacher Assignment
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Class Details
    room_number = Column(String(20), nullable=True)
    capacity = Column(Integer, default=30)
    current_strength = Column(Integer, default=0)
    
    # Schedule (basic)
    schedule_info = Column(Text, nullable=True)  # JSON string for detailed schedule
    
    # Status
    is_active = Column(Boolean, default=True)
    
    # Relationships
    school = relationship("School", back_populates="classes", foreign_keys="Class.school_id")
    teacher = relationship("User", back_populates="classes_taught")
    students = relationship("Student", back_populates="class_assigned")
    
    def __repr__(self):
        return f"<Class(name='{self.name}', teacher_id={self.teacher_id}, school_id={self.school_id})>" 
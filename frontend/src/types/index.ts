// User types
export interface User {
  id: number;
  email: string;
  username?: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  employee_id?: string;
  department?: string;
  hire_date?: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  school_id: number;
}

export const UserRole = {
  ADMIN: 'ADMIN',
  TEACHER: 'TEACHER',
  PARENT: 'PARENT',
  SECURITY: 'SECURITY',
  STUDENT: 'STUDENT'
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

export const UserStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  PENDING: 'PENDING',
  SUSPENDED: 'SUSPENDED'
} as const;

export type UserStatus = typeof UserStatus[keyof typeof UserStatus];

// School types
export interface School {
  id: number;
  name: string;
  slug: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  principal_name?: string;
  timezone: string;
  school_start_time: string;
  school_end_time: string;
  total_students: number;
  total_teachers: number;
  is_active: boolean;
  subscription_plan: string;
  subscription_expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SchoolStats {
  total_students: number;
  total_teachers: number;
  total_staff: number;
  active_students: number;
  present_today: number;
  absent_today: number;
  pending_gate_passes: number;
}

// Student types
export interface Student {
  id: number;
  student_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  date_of_birth?: string;
  gender?: Gender;
  email?: string;
  phone?: string;
  address?: string;
  emergency_contact?: string;
  grade_level: string;
  section?: string;
  roll_number?: string;
  admission_date?: string;
  status: StudentStatus;
  is_active: boolean;
  rfid_card_id?: string;
  biometric_id?: string;
  parent_id?: number;
  guardian_name?: string;
  guardian_phone?: string;
  guardian_relationship?: string;
  class_id?: number;
  bus_route?: string;
  pickup_point?: string;
  school_id: number;
  created_at: string;
  updated_at: string;
}

export const Gender = {
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other'
} as const;

export type Gender = typeof Gender[keyof typeof Gender];

export const StudentStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  GRADUATED: 'graduated',
  TRANSFERRED: 'transferred',
  SUSPENDED: 'suspended'
} as const;

export type StudentStatus = typeof StudentStatus[keyof typeof StudentStatus];

// Attendance types
export interface Attendance {
  id: number;
  student_id: number;
  attendance_date: string;
  status: AttendanceStatus;
  method: AttendanceMethod;
  check_in_time?: string;
  check_out_time?: string;
  marked_at: string;
  notes?: string;
  marked_by_user_id?: number;
  device_id?: string;
  location?: string;
  is_verified: boolean;
  verification_method?: string;
  school_id: number;
  student?: Student;
  marked_by?: User;
}

export const AttendanceStatus = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
  PARTIAL: 'partial',
  EXCUSED: 'excused'
} as const;

export type AttendanceStatus = typeof AttendanceStatus[keyof typeof AttendanceStatus];

export const AttendanceMethod = {
  MANUAL: 'manual',
  BIOMETRIC: 'biometric',
  RFID: 'rfid',
  QR_CODE: 'qr_code',
  MOBILE_APP: 'mobile_app'
} as const;

export type AttendanceMethod = typeof AttendanceMethod[keyof typeof AttendanceMethod];

// Gate Pass types
export interface GatePass {
  id: number;
  student_id: number;
  pass_number: string;
  pass_type: GatePassType;
  reason: string;
  status: GatePassStatus;
  requested_exit_time: string;
  expected_return_time?: string;
  actual_exit_time?: string;
  actual_return_time?: string;
  requested_by_user_id: number;
  approved_by_user_id?: number;
  approved_at?: string;
  approval_notes?: string;
  guardian_name?: string;
  guardian_phone?: string;
  guardian_id_proof?: string;
  exit_gate?: string;
  entry_gate?: string;
  exit_security_guard_id?: number;
  entry_security_guard_id?: number;
  exit_verified: boolean;
  entry_verified: boolean;
  emergency_contact_notified: boolean;
  notification_sent_at?: string;
  special_instructions?: string;
  internal_notes?: string;
  school_id: number;
  created_at: string;
  updated_at: string;
  student?: Student;
  requested_by?: User;
  approved_by?: User;
  exit_guard?: User;
  entry_guard?: User;
}

export const GatePassStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  DENIED: 'denied',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled'
} as const;

export type GatePassStatus = typeof GatePassStatus[keyof typeof GatePassStatus];

export const GatePassType = {
  EMERGENCY: 'emergency',
  MEDICAL: 'medical',
  EARLY_DISMISSAL: 'early_dismissal',
  PARENT_PICKUP: 'parent_pickup',
  FIELD_TRIP: 'field_trip',
  OTHER: 'other'
} as const;

export type GatePassType = typeof GatePassType[keyof typeof GatePassType];

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

// API types
export interface ApiError {
  detail: string;
  status_code?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

// Filter types
export interface UserFilters {
  role?: UserRole;
  status?: UserStatus;
  search?: string;
  skip?: number;
  limit?: number;
}

export interface StudentFilters {
  grade_level?: string;
  section?: string;
  status?: StudentStatus;
  search?: string;
  skip?: number;
  limit?: number;
}

export interface AttendanceFilters {
  student_id?: number;
  date_from?: string;
  date_to?: string;
  status?: AttendanceStatus;
  method?: AttendanceMethod;
  skip?: number;
  limit?: number;
}

export interface GatePassFilters {
  student_id?: number;
  status?: GatePassStatus;
  pass_type?: GatePassType;
  date_from?: string;
  date_to?: string;
  skip?: number;
  limit?: number;
}

// Dashboard types
export interface DashboardStats {
  school: SchoolStats;
  recent_attendance: Attendance[];
  pending_gate_passes: GatePass[];
  recent_activities: Activity[];
}

export interface Activity {
  id: string;
  type: 'attendance' | 'gate_pass' | 'user' | 'student';
  title: string;
  description: string;
  timestamp: string;
  user?: User;
  student?: Student;
}

// Form types
export interface CreateUserForm {
  email: string;
  username?: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: UserRole;
  employee_id?: string;
  department?: string;
  hire_date?: string;
  password: string;
}

export interface UpdateUserForm {
  email?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role?: UserRole;
  employee_id?: string;
  department?: string;
  hire_date?: string;
  is_active?: boolean;
  status?: UserStatus;
}

export interface CreateStudentForm {
  student_id: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  gender?: Gender;
  email?: string;
  phone?: string;
  address?: string;
  emergency_contact?: string;
  grade_level: string;
  section?: string;
  roll_number?: string;
  admission_date?: string;
  rfid_card_id?: string;
  biometric_id?: string;
  parent_id?: number;
  guardian_name?: string;
  guardian_phone?: string;
  guardian_relationship?: string;
  class_id?: number;
  bus_route?: string;
  pickup_point?: string;
}

export interface MarkAttendanceForm {
  student_id: number;
  attendance_date: string;
  status: AttendanceStatus;
  method: AttendanceMethod;
  check_in_time?: string;
  check_out_time?: string;
  notes?: string;
  location?: string;
}

export interface CreateGatePassForm {
  student_id: number;
  pass_type: GatePassType;
  reason: string;
  requested_exit_time: string;
  expected_return_time?: string;
  guardian_name?: string;
  guardian_phone?: string;
  guardian_id_proof?: string;
  special_instructions?: string;
} 
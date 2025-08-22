import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  User,
  X,
  Save,
  AlertCircle
} from 'lucide-react';

interface Student {
  id: number;
  student_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  address?: string;
  guardian_name?: string;
  guardian_phone?: string;
  guardian_email?: string;
  class_name?: string;
  section?: string;
  admission_date?: string;
  status: 'active' | 'inactive' | 'graduated' | 'transferred';
  created_at: string;
}

interface CreateStudentForm {
  student_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  address?: string;
  guardian_name?: string;
  guardian_phone?: string;
  guardian_email?: string;
  class_name?: string;
  section?: string;
  admission_date?: string;
}

const StudentsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState<CreateStudentForm>({
    student_id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    address: '',
    guardian_name: '',
    guardian_phone: '',
    guardian_email: '',
    class_name: '',
    section: '',
    admission_date: '',
  });

  const queryClient = useQueryClient();

  // Fetch students from backend
  const { data: students, isLoading, error } = useQuery<Student[]>({
    queryKey: ['students', statusFilter],
    queryFn: async () => {
      const filters = statusFilter !== 'all' ? { status: statusFilter } : undefined;
      return await api.getStudents(filters);
    },
  });

  // Create student mutation
  const createStudentMutation = useMutation({
    mutationFn: (studentData: CreateStudentForm) => api.createStudent(studentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setShowAddModal(false);
      resetForm();
    },
    onError: (error: any) => {
      console.error('Error creating student:', error);
      alert(error.response?.data?.detail || 'Failed to create student');
    },
  });

  // Update student mutation
  const updateStudentMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateStudentForm> }) => 
      api.updateStudent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setShowEditModal(false);
      setSelectedStudent(null);
      resetForm();
    },
    onError: (error: any) => {
      console.error('Error updating student:', error);
      alert(error.response?.data?.detail || 'Failed to update student');
    },
  });

  // Delete student mutation
  const deleteStudentMutation = useMutation({
    mutationFn: (id: number) => api.deleteStudent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
    onError: (error: any) => {
      console.error('Error deleting student:', error);
      alert(error.response?.data?.detail || 'Failed to delete student');
    },
  });

  const resetForm = () => {
    setFormData({
      student_id: '',
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      date_of_birth: '',
      address: '',
      guardian_name: '',
      guardian_phone: '',
      guardian_email: '',
      class_name: '',
      section: '',
      admission_date: '',
    });
  };

  const handleAddStudent = () => {
    setShowAddModal(true);
    resetForm();
  };

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setFormData({
      student_id: student.student_id,
      first_name: student.first_name,
      last_name: student.last_name,
      email: student.email || '',
      phone: student.phone || '',
      date_of_birth: student.date_of_birth || '',
      address: student.address || '',
      guardian_name: student.guardian_name || '',
      guardian_phone: student.guardian_phone || '',
      guardian_email: student.guardian_email || '',
      class_name: student.class_name || '',
      section: student.section || '',
      admission_date: student.admission_date || '',
    });
    setShowEditModal(true);
  };

  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student);
    setShowViewModal(true);
  };

  const handleDeleteStudent = (student: Student) => {
    if (window.confirm(`Are you sure you want to delete ${student.full_name}?`)) {
      deleteStudentMutation.mutate(student.id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (showEditModal && selectedStudent) {
      updateStudentMutation.mutate({ id: selectedStudent.id, data: formData });
    } else {
      createStudentMutation.mutate(formData);
    }
  };

  const filteredStudents = students?.filter(student => {
    const matchesSearch = student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  }) || [];

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      active: 'badge-success',
      inactive: 'badge-secondary',
      graduated: 'badge-primary',
      transferred: 'badge-warning',
    };
    return statusClasses[status as keyof typeof statusClasses] || 'badge-secondary';
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Students</h1>
          <p className="text-secondary-600">Manage student profiles and information</p>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center text-danger-600">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>Error loading students data: {(error as Error).message}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Students</h1>
          <p className="text-secondary-600">Manage student profiles and information</p>
        </div>
        <button
          onClick={handleAddStudent}
          className="btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Student
        </button>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="h-5 w-5 absolute left-3 top-3 text-secondary-400" />
              <input
                type="text"
                placeholder="Search students by name, ID, or email..."
                className="input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-secondary-400" />
            <select
              className="input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="graduated">Graduated</option>
              <option value="transferred">Transferred</option>
            </select>
          </div>
        </div>
      </div>

      {/* Students List */}
      <div className="card">
        <div className="p-6 border-b border-secondary-200">
          <h2 className="text-lg font-semibold text-secondary-900">
            Students ({filteredStudents.length})
          </h2>
        </div>
        
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-secondary-600 mt-2">Loading students...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-6 text-center">
            <User className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-secondary-900 mb-2">No students found</h3>
            <p className="text-secondary-600 mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by adding your first student.'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <button onClick={handleAddStudent} className="btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add First Student
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Guardian
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-secondary-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-secondary-900">
                          {student.full_name}
                        </div>
                        <div className="text-sm text-secondary-500">
                          ID: {student.student_id}
                        </div>
                        {student.email && (
                          <div className="text-sm text-secondary-500">
                            {student.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-secondary-900">
                        {student.class_name || 'N/A'}
                        {student.section && ` - ${student.section}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-secondary-900">
                        {student.guardian_name || 'N/A'}
                      </div>
                      {student.guardian_phone && (
                        <div className="text-sm text-secondary-500">
                          {student.guardian_phone}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`badge ${getStatusBadge(student.status)}`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewStudent(student)}
                          className="text-primary-600 hover:text-primary-900"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditStudent(student)}
                          className="text-secondary-600 hover:text-secondary-900"
                          title="Edit Student"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(student)}
                          className="text-danger-600 hover:text-danger-900"
                          title="Delete Student"
                          disabled={deleteStudentMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Student Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-secondary-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-secondary-900">
                  {showEditModal ? 'Edit Student' : 'Add New Student'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setSelectedStudent(null);
                    resetForm();
                  }}
                  className="text-secondary-400 hover:text-secondary-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Student ID *</label>
                  <input
                    type="text"
                    required
                    className="input"
                    value={formData.student_id}
                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                    placeholder="STU001"
                  />
                </div>
                
                <div>
                  <label className="label">First Name *</label>
                  <input
                    type="text"
                    required
                    className="input"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    placeholder="John"
                  />
                </div>
                
                <div>
                  <label className="label">Last Name *</label>
                  <input
                    type="text"
                    required
                    className="input"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    placeholder="Doe"
                  />
                </div>
                
                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    className="input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="student@email.com"
                  />
                </div>
                
                <div>
                  <label className="label">Phone</label>
                  <input
                    type="tel"
                    className="input"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1-555-0123"
                  />
                </div>
                
                <div>
                  <label className="label">Date of Birth</label>
                  <input
                    type="date"
                    className="input"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="label">Class</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.class_name}
                    onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                    placeholder="Grade 8"
                  />
                </div>
                
                <div>
                  <label className="label">Section</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    placeholder="A"
                  />
                </div>
                
                <div>
                  <label className="label">Admission Date</label>
                  <input
                    type="date"
                    className="input"
                    value={formData.admission_date}
                    onChange={(e) => setFormData({ ...formData, admission_date: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="label">Address</label>
                <textarea
                  className="input"
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street, City, State, Country"
                />
              </div>

              <div className="border-t border-secondary-200 pt-6">
                <h3 className="text-lg font-medium text-secondary-900 mb-4">Guardian Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Guardian Name</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.guardian_name}
                      onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
                      placeholder="Jane Doe"
                    />
                  </div>
                  
                  <div>
                    <label className="label">Guardian Phone</label>
                    <input
                      type="tel"
                      className="input"
                      value={formData.guardian_phone}
                      onChange={(e) => setFormData({ ...formData, guardian_phone: e.target.value })}
                      placeholder="+1-555-0124"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="label">Guardian Email</label>
                    <input
                      type="email"
                      className="input"
                      value={formData.guardian_email}
                      onChange={(e) => setFormData({ ...formData, guardian_email: e.target.value })}
                      placeholder="guardian@email.com"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-secondary-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setSelectedStudent(null);
                    resetForm();
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createStudentMutation.isPending || updateStudentMutation.isPending}
                  className="btn-primary flex items-center"
                >
                  {(createStudentMutation.isPending || updateStudentMutation.isPending) ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {showEditModal ? 'Update Student' : 'Add Student'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Student Modal */}
      {showViewModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-secondary-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-secondary-900">
                  Student Details
                </h2>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedStudent(null);
                  }}
                  className="text-secondary-400 hover:text-secondary-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-secondary-900 mb-4">Personal Information</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-secondary-600">Full Name:</span>
                      <p className="text-secondary-900">{selectedStudent.full_name}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-secondary-600">Student ID:</span>
                      <p className="text-secondary-900">{selectedStudent.student_id}</p>
                    </div>
                    {selectedStudent.email && (
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 text-secondary-600 mr-2" />
                        <span className="text-secondary-900">{selectedStudent.email}</span>
                      </div>
                    )}
                    {selectedStudent.phone && (
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 text-secondary-600 mr-2" />
                        <span className="text-secondary-900">{selectedStudent.phone}</span>
                      </div>
                    )}
                    {selectedStudent.date_of_birth && (
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-secondary-600 mr-2" />
                        <span className="text-secondary-900">
                          {new Date(selectedStudent.date_of_birth).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {selectedStudent.address && (
                      <div className="flex items-start">
                        <MapPin className="h-4 w-4 text-secondary-600 mr-2 mt-1" />
                        <span className="text-secondary-900">{selectedStudent.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-secondary-900 mb-4">Academic Information</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-secondary-600">Class:</span>
                      <p className="text-secondary-900">
                        {selectedStudent.class_name || 'N/A'}
                        {selectedStudent.section && ` - Section ${selectedStudent.section}`}
                      </p>
                    </div>
                    {selectedStudent.admission_date && (
                      <div>
                        <span className="text-sm font-medium text-secondary-600">Admission Date:</span>
                        <p className="text-secondary-900">
                          {new Date(selectedStudent.admission_date).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    <div>
                      <span className="text-sm font-medium text-secondary-600">Status:</span>
                      <p>
                        <span className={`badge ${getStatusBadge(selectedStudent.status)}`}>
                          {selectedStudent.status}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {(selectedStudent.guardian_name || selectedStudent.guardian_phone || selectedStudent.guardian_email) && (
                <div className="border-t border-secondary-200 pt-6">
                  <h3 className="text-lg font-medium text-secondary-900 mb-4">Guardian Information</h3>
                  <div className="space-y-3">
                    {selectedStudent.guardian_name && (
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-secondary-600 mr-2" />
                        <span className="text-secondary-900">{selectedStudent.guardian_name}</span>
                      </div>
                    )}
                    {selectedStudent.guardian_phone && (
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 text-secondary-600 mr-2" />
                        <span className="text-secondary-900">{selectedStudent.guardian_phone}</span>
                      </div>
                    )}
                    {selectedStudent.guardian_email && (
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 text-secondary-600 mr-2" />
                        <span className="text-secondary-900">{selectedStudent.guardian_email}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-6 border-t border-secondary-200">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleEditStudent(selectedStudent);
                  }}
                  className="btn-primary"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Student
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsPage; 
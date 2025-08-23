import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '../lib/api';
import Modal from '../components/ui/Modal';
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
  AlertCircle,
  GraduationCap,
  Users,
  RefreshCw
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
  class_id?: number;
  admission_date?: string;
}

const StudentsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showSlidePanel, setShowSlidePanel] = useState(false);
  const [panelMode, setPanelMode] = useState<'add' | 'edit' | 'view'>('add');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
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
    class_id: undefined,
    admission_date: '',
  });

  const queryClient = useQueryClient();

  // Cleanup effect to restore body scroll when component unmounts
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  // Fetch students from backend
  const { data: students, isLoading, error } = useQuery<Student[]>({
    queryKey: ['students', statusFilter],
    queryFn: async () => {
      const filters = statusFilter !== 'all' ? { status: statusFilter } : undefined;
      return await api.getStudents(filters);
    },
  });

  // Fetch classes from backend
  const { data: classes, isLoading: classesLoading, error: classesError } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      return await api.getClasses();
    },
    onError: (error: any) => {
      console.error('Error loading classes:', error);
      toast.error('Failed to load classes. Please refresh the page.');
    },
  });

  // Create student mutation
  const createStudentMutation = useMutation({
    mutationFn: (studentData: CreateStudentForm) => api.createStudent(studentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setShowSlidePanel(false);
      resetForm();
      toast.success('Student created successfully!');
    },
    onError: (error: any) => {
      console.error('Error creating student:', error);
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          'Failed to create student. Please check your input and try again.';
      toast.error(errorMessage);
    },
  });

  // Update student mutation
  const updateStudentMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateStudentForm> }) => 
      api.updateStudent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setShowSlidePanel(false);
      setSelectedStudent(null);
      resetForm();
      toast.success('Student updated successfully!');
    },
    onError: (error: any) => {
      console.error('Error updating student:', error);
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          'Failed to update student. Please check your input and try again.';
      toast.error(errorMessage);
    },
  });

  // Delete student mutation
  const deleteStudentMutation = useMutation({
    mutationFn: (id: number) => api.deleteStudent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Student deleted successfully!');
    },
    onError: (error: any) => {
      console.error('Error deleting student:', error);
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          'Failed to delete student. Please try again.';
      toast.error(errorMessage);
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
      class_id: undefined,
      admission_date: '',
    });
  };

  const handleAddStudent = () => {
    setPanelMode('add');
    resetForm();
    setShowSlidePanel(true);
    handleOpenPanel();
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
      class_id: undefined, // Will be set based on class lookup
      admission_date: student.admission_date || '',
    });
    setPanelMode('edit');
    setShowSlidePanel(true);
    handleOpenPanel();
  };

  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student);
    setPanelMode('view');
    setShowSlidePanel(true);
    handleOpenPanel();
  };

  const handleDeleteStudent = (student: Student) => {
    setStudentToDelete(student);
    setShowDeleteModal(true);
  };

  const confirmDeleteStudent = () => {
    if (studentToDelete) {
      deleteStudentMutation.mutate(studentToDelete.id);
      setStudentToDelete(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.student_id.trim()) {
      toast.error('Student ID is required');
      return;
    }
    
    if (!formData.first_name.trim()) {
      toast.error('First name is required');
      return;
    }
    
    if (!formData.last_name.trim()) {
      toast.error('Last name is required');
      return;
    }
    
    // Transform form data to match backend expectations
    const selectedClass = classes?.find(cls => cls.id === formData.class_id);
    const transformedData = {
      ...formData,
      class_name: selectedClass?.name || undefined,
      section: selectedClass?.name?.split(' - ')[1] || undefined, // Extract section from class name if it exists
    };
    
    // Remove class_id as backend doesn't expect it
    delete transformedData.class_id;
    
    if (panelMode === 'edit' && selectedStudent) {
      updateStudentMutation.mutate({ id: selectedStudent.id, data: transformedData });
    } else {
      createStudentMutation.mutate(transformedData);
    }
  };

  const handleClosePanel = () => {
    setShowSlidePanel(false);
    setSelectedStudent(null);
    resetForm();
    // Re-enable body scroll when panel closes
    document.body.style.overflow = 'auto';
  };

  const handleOpenPanel = () => {
    // Disable body scroll when panel opens
    document.body.style.overflow = 'hidden';
  };

  const filteredStudents = students?.filter(student => {
    const matchesSearch = student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  }) || [];

  const getStatusBadge = (status: string) => {
    const statusClasses: Record<string, string> = {
      active: 'bg-green-100 text-green-800 border-green-200',
      inactive: 'bg-gray-100 text-gray-800 border-gray-200',
      graduated: 'bg-blue-100 text-blue-800 border-blue-200',
      transferred: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  };

  const getPanelTitle = () => {
    switch (panelMode) {
      case 'add': return 'Add New Student';
      case 'edit': return 'Edit Student';
      case 'view': return 'Student Details';
      default: return 'Student';
    }
  };

  if (error) {
  return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center text-red-600">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>Error loading students data: {(error as Error).message}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Student Management</h1>
          <p className="text-secondary-600">Manage student profiles and information</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleAddStudent}
            className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 transform hover:scale-105"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Student
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Users className="h-5 w-5 text-primary-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-secondary-600">Total Students</p>
              <p className="text-xl font-bold text-secondary-900">{students?.length || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center">
            <div className="p-2 bg-success-100 rounded-lg">
              <User className="h-5 w-5 text-success-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-secondary-600">Active</p>
              <p className="text-xl font-bold text-success-600">
                {students?.filter(s => s.status === 'active').length || 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center">
            <div className="p-2 bg-secondary-100 rounded-lg">
              <GraduationCap className="h-5 w-5 text-secondary-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-secondary-600">Graduated</p>
              <p className="text-xl font-bold text-secondary-900">
                {students?.filter(s => s.status === 'graduated').length || 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center">
            <div className="p-2 bg-warning-100 rounded-lg">
              <AlertCircle className="h-5 w-5 text-warning-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-secondary-600">Inactive</p>
              <p className="text-xl font-bold text-warning-600">
                {students?.filter(s => s.status === 'inactive').length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Search Students</label>
            <div className="relative">
              <Search className="h-5 w-5 absolute left-3 top-3 text-secondary-400" />
              <input
                type="text"
                placeholder="Search by name, ID, or email..."
                className="input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="label">Status Filter</label>
            <div className="relative">
              <Filter className="h-5 w-5 absolute left-3 top-3 text-secondary-400" />
              <select
                className="input pl-10"
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
      </div>

      {/* Students Table */}
      <div className="card">
        <div className="p-6 border-b border-secondary-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-secondary-900">
              Students ({filteredStudents.length})
            </h2>
            <button 
              onClick={() => queryClient.invalidateQueries({ queryKey: ['students'] })}
              className="btn-ghost flex items-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-secondary-600">Loading students...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="h-16 w-16 text-secondary-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-secondary-900 mb-2">No students found</h3>
            <p className="text-secondary-600 mb-6">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by adding your first student.'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <button onClick={handleAddStudent} className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700">
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
                  <tr key={student.id} className="hover:bg-secondary-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                            <User className="h-6 w-6 text-indigo-600" />
                          </div>
                        </div>
                        <div className="ml-4">
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
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-secondary-900">
                        {student.class_name || 'N/A'}
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
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(student.status)}`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewStudent(student)}
                          className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50 transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditStudent(student)}
                          className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-50 transition-colors"
                          title="Edit Student"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(student)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
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

      {/* Right Slide Panel */}
      <div className={`fixed inset-y-0 right-0 z-50 w-full max-w-md transform transition-transform duration-300 ease-in-out ${
        showSlidePanel ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex h-full flex-col bg-white shadow-xl">
          {/* Panel Header */}
          <div className="bg-indigo-600 px-6 py-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-white">
                {getPanelTitle()}
                </h2>
                <button
                onClick={handleClosePanel}
                className="text-indigo-200 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {panelMode === 'view' && selectedStudent ? (
              <div className="p-6 space-y-8">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Full Name</label>
                      <p className="text-gray-900">{selectedStudent.full_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Student ID</label>
                      <p className="text-gray-900">{selectedStudent.student_id}</p>
                    </div>
                    {selectedStudent.email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900">{selectedStudent.email}</span>
                      </div>
                    )}
                    {selectedStudent.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900">{selectedStudent.phone}</span>
                      </div>
                    )}
                    {selectedStudent.date_of_birth && (
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900">
                          {new Date(selectedStudent.date_of_birth).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {selectedStudent.address && (
                      <div className="flex items-start space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                        <span className="text-gray-900">{selectedStudent.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Academic Information */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Academic Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Class</label>
                      <p className="text-gray-900">
                        {selectedStudent.class_name || 'N/A'}
                      </p>
                    </div>
                    {selectedStudent.admission_date && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Admission Date</label>
                        <p className="text-gray-900">
                          {new Date(selectedStudent.admission_date).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(selectedStudent.status)}`}>
                          {selectedStudent.status}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Guardian Information */}
                {(selectedStudent.guardian_name || selectedStudent.guardian_phone || selectedStudent.guardian_email) && (
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Guardian Information</h3>
                    <div className="space-y-4">
                      {selectedStudent.guardian_name && (
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-900">{selectedStudent.guardian_name}</span>
                        </div>
                      )}
                      {selectedStudent.guardian_phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-900">{selectedStudent.guardian_phone}</span>
                        </div>
                      )}
                      {selectedStudent.guardian_email && (
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-900">{selectedStudent.guardian_email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Form for Add/Edit
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Personal Information Section */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Student ID *</label>
                  <input
                    type="text"
                    required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={formData.student_id}
                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                    placeholder="STU001"
                  />
                </div>
                
                    <div className="grid grid-cols-2 gap-3">
                <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    placeholder="John"
                  />
                </div>
                
                <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    placeholder="Doe"
                  />
                      </div>
                </div>
                
                <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="student@email.com"
                  />
                </div>
                
                <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1-555-0123"
                  />
                </div>
                
                <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  />
                </div>
                
                <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        rows={2}
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Street, City, State, Country"
                      />
                    </div>
                  </div>
                </div>

                                {/* Academic Information Section */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Academic Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                      {classesLoading ? (
                        <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                          Loading classes...
                        </div>
                      ) : classesError ? (
                        <div className="w-full px-3 py-2 border border-red-300 rounded-lg bg-red-50 text-red-600">
                          Failed to load classes
                        </div>
                      ) : (
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          value={formData.class_id || ''}
                          onChange={(e) => setFormData({ ...formData, class_id: e.target.value ? parseInt(e.target.value) : undefined })}
                        >
                          <option value="">Select a class</option>
                          {classes?.map((cls) => (
                            <option key={cls.id} value={cls.id}>
                              {cls.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Admission Date</label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        value={formData.admission_date}
                        onChange={(e) => setFormData({ ...formData, admission_date: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Guardian Information Section */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Guardian Information</h3>
                  <div className="space-y-4">
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Guardian Name</label>
                    <input
                      type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      value={formData.guardian_name}
                      onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
                      placeholder="Jane Doe"
                    />
                  </div>
                  
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Guardian Phone</label>
                    <input
                      type="tel"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      value={formData.guardian_phone}
                      onChange={(e) => setFormData({ ...formData, guardian_phone: e.target.value })}
                      placeholder="+1-555-0124"
                    />
                  </div>
                  
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Guardian Email</label>
                    <input
                      type="email"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      value={formData.guardian_email}
                      onChange={(e) => setFormData({ ...formData, guardian_email: e.target.value })}
                      placeholder="guardian@email.com"
                    />
                  </div>
                </div>
                </div>
              </form>
            )}
              </div>

          {/* Panel Footer */}
          {panelMode === 'view' && selectedStudent ? (
            <div className="border-t border-gray-200 px-6 py-4">
              <div className="flex space-x-3">
                <button
                  onClick={() => handleEditStudent(selectedStudent)}
                  className="flex-1 inline-flex justify-center items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Student
                </button>
              </div>
            </div>
          ) : (
            <div className="border-t border-gray-200 px-6 py-4">
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleClosePanel}
                  className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={createStudentMutation.isPending || updateStudentMutation.isPending}
                  className="flex-1 inline-flex justify-center items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {(createStudentMutation.isPending || updateStudentMutation.isPending) ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {panelMode === 'edit' ? 'Update Student' : 'Add Student'}
                    </>
                  )}
                </button>
              </div>
                      </div>
                    )}
                  </div>
                </div>

      {/* Backdrop */}
      {showSlidePanel && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={handleClosePanel}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setStudentToDelete(null);
        }}
        onConfirm={confirmDeleteStudent}
        title="Delete Student"
        message={`Are you sure you want to delete ${studentToDelete?.full_name}? This action cannot be undone.`}
        type="danger"
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};

export default StudentsPage; 
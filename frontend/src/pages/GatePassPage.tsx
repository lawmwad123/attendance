import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '../lib/api';
import Modal from '../components/ui/Modal';
import SearchableDropdown from '../components/ui/SearchableDropdown';
import { 
  LogOut,
  LogIn,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Plus,
  Eye,
  Check,
  X,
  Calendar,
  User,
  FileText,
  RefreshCw,
  Save,
  Edit
} from 'lucide-react';

interface Student {
  id: number;
  student_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  class_name: string;
  section: string;
  status: 'active' | 'inactive';
}

interface GatePass {
  id: number;
  student_id: number;
  student: Student;
  type: 'exit' | 'entry' | 'temporary';
  reason: string;
  requested_time: string;
  approved_time?: string;
  exit_time?: string;
  return_time?: string;
  status: 'pending' | 'approved' | 'denied' | 'used' | 'expired';
  guardian_approval: boolean;
  admin_approval: boolean;
  notes?: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
}

interface CreateGatePassForm {
  student_id: number;
  type: 'exit' | 'entry' | 'temporary';
  reason: string;
  requested_time: string;
  notes?: string;
}

const GatePassPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [showSlidePanel, setShowSlidePanel] = useState(false);
  const [panelMode, setPanelMode] = useState<'add' | 'edit' | 'view'>('add');
  const [selectedPass, setSelectedPass] = useState<GatePass | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [passToDelete, setPassToDelete] = useState<GatePass | null>(null);
  const [formData, setFormData] = useState<CreateGatePassForm>({
    student_id: 0,
    type: 'exit',
    reason: '',
    requested_time: '',
    notes: '',
  });

  const queryClient = useQueryClient();

  // Cleanup effect to restore body scroll when component unmounts
  React.useEffect(() => {
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  // Fetch students for pass creation
  const { data: students } = useQuery<Student[]>({
    queryKey: ['students'],
    queryFn: async () => {
      return await api.getStudents({ status: 'active' });
    },
  });

  // Fetch gate passes with filters
  const { data: gatePasses, isLoading, error } = useQuery<GatePass[]>({
    queryKey: ['gatePasses', statusFilter, typeFilter, dateFilter],
    queryFn: async () => {
      const filters: any = {};
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (typeFilter !== 'all') filters.type = typeFilter;
      if (dateFilter) filters.date = dateFilter;
      
      return await api.getGatePasses(filters);
    },
  });

  // Create gate pass mutation
  const createGatePassMutation = useMutation({
    mutationFn: (passData: CreateGatePassForm) => api.createGatePass(passData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gatePasses'] });
      setShowSlidePanel(false);
      resetForm();
      toast.success('Gate pass created successfully!');
    },
    onError: (error: any) => {
      console.error('Error creating gate pass:', error);
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          'Failed to create gate pass. Please try again.';
      toast.error(errorMessage);
    },
  });

  // Update gate pass mutation
  const updateGatePassMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateGatePassForm> }) => 
      api.updateGatePass(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gatePasses'] });
      setShowSlidePanel(false);
      setSelectedPass(null);
      resetForm();
      toast.success('Gate pass updated successfully!');
    },
    onError: (error: any) => {
      console.error('Error updating gate pass:', error);
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          'Failed to update gate pass. Please try again.';
      toast.error(errorMessage);
    },
  });

  // Approve gate pass mutation
  const approveGatePassMutation = useMutation({
    mutationFn: ({ id, notes }: { id: number; notes?: string }) => 
      api.approveGatePass(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gatePasses'] });
      if (selectedPass) {
        setShowSlidePanel(false);
        setSelectedPass(null);
      }
      toast.success('Gate pass approved successfully!');
    },
    onError: (error: any) => {
      console.error('Error approving gate pass:', error);
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          'Failed to approve gate pass. Please try again.';
      toast.error(errorMessage);
    },
  });

  // Deny gate pass mutation
  const denyGatePassMutation = useMutation({
    mutationFn: ({ id, notes }: { id: number; notes?: string }) => 
      api.denyGatePass(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gatePasses'] });
      if (selectedPass) {
        setShowSlidePanel(false);
        setSelectedPass(null);
      }
      toast.success('Gate pass denied successfully!');
    },
    onError: (error: any) => {
      console.error('Error denying gate pass:', error);
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          'Failed to deny gate pass. Please try again.';
      toast.error(errorMessage);
    },
  });

  // Delete gate pass mutation
  const deleteGatePassMutation = useMutation({
    mutationFn: (id: number) => api.deleteGatePass(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gatePasses'] });
      toast.success('Gate pass deleted successfully!');
    },
    onError: (error: any) => {
      console.error('Error deleting gate pass:', error);
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          'Failed to delete gate pass. Please try again.';
      toast.error(errorMessage);
    },
  });

  const resetForm = () => {
    setFormData({
      student_id: 0,
      type: 'exit',
      reason: '',
      requested_time: '',
      notes: '',
    });
  };

  const handleAddPass = () => {
    setPanelMode('add');
    resetForm();
    setShowSlidePanel(true);
    handleOpenPanel();
  };

  const handleEditPass = (pass: GatePass) => {
    setSelectedPass(pass);
    setFormData({
      student_id: pass.student_id,
      type: pass.type,
      reason: pass.reason,
      requested_time: pass.requested_time,
      notes: pass.notes || '',
    });
    setPanelMode('edit');
    setShowSlidePanel(true);
    handleOpenPanel();
  };

  const handleViewPass = (pass: GatePass) => {
    setSelectedPass(pass);
    setPanelMode('view');
    setShowSlidePanel(true);
    handleOpenPanel();
  };

  const handleDeletePass = (pass: GatePass) => {
    setPassToDelete(pass);
    setShowDeleteModal(true);
  };

  const confirmDeletePass = () => {
    if (passToDelete) {
      deleteGatePassMutation.mutate(passToDelete.id);
      setPassToDelete(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.student_id) {
      toast.error('Please select a student');
      return;
    }
    
    if (!formData.reason.trim()) {
      toast.error('Reason is required');
      return;
    }
    
    if (!formData.requested_time) {
      toast.error('Requested time is required');
      return;
    }
    
    if (panelMode === 'edit' && selectedPass) {
      updateGatePassMutation.mutate({ id: selectedPass.id, data: formData });
    } else {
      createGatePassMutation.mutate(formData);
    }
  };

  const handleApprove = (pass: GatePass) => {
    const notes = prompt('Add approval notes (optional):') || '';
    approveGatePassMutation.mutate({ id: pass.id, notes });
  };

  const handleDeny = (pass: GatePass) => {
    const notes = prompt('Add denial reason:');
    if (notes) {
      denyGatePassMutation.mutate({ id: pass.id, notes });
    }
  };

  const handleClosePanel = () => {
    setShowSlidePanel(false);
    setSelectedPass(null);
    resetForm();
    // Re-enable body scroll when panel closes
    document.body.style.overflow = 'auto';
  };

  const handleOpenPanel = () => {
    // Disable body scroll when panel opens
    document.body.style.overflow = 'hidden';
  };

  const filteredPasses = gatePasses?.filter(pass => {
    const matchesSearch = pass.student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pass.student.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pass.reason.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  }) || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-success-600" />;
      case 'denied':
        return <XCircle className="h-5 w-5 text-danger-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-warning-600" />;
      case 'used':
        return <LogOut className="h-5 w-5 text-primary-600" />;
      case 'expired':
        return <AlertTriangle className="h-5 w-5 text-secondary-600" />;
      default:
        return <Clock className="h-5 w-5 text-secondary-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusClasses: Record<string, string> = {
      approved: 'bg-green-100 text-green-800 border-green-200',
      denied: 'bg-red-100 text-red-800 border-red-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      used: 'bg-blue-100 text-blue-800 border-blue-200',
      expired: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'exit':
        return <LogOut className="h-4 w-4" />;
      case 'entry':
        return <LogIn className="h-4 w-4" />;
      case 'temporary':
        return <Clock className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getPanelTitle = () => {
    switch (panelMode) {
      case 'add': return 'Create New Gate Pass';
      case 'edit': return 'Edit Gate Pass';
      case 'view': return 'Gate Pass Details';
      default: return 'Gate Pass';
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center text-red-600">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <span>Error loading gate passes data: {(error as Error).message}</span>
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
          <h1 className="text-2xl font-bold text-secondary-900">Gate Pass Management</h1>
          <p className="text-secondary-600">Manage student exit and entry permissions</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleAddPass}
            className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 transform hover:scale-105"
          >
            <Plus className="h-5 w-5 mr-2" />
            New Pass
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="card p-4">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <FileText className="h-5 w-5 text-primary-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-secondary-600">Total</p>
              <p className="text-xl font-bold text-secondary-900">{filteredPasses.length}</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center">
            <div className="p-2 bg-warning-100 rounded-lg">
              <Clock className="h-5 w-5 text-warning-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-secondary-600">Pending</p>
              <p className="text-xl font-bold text-warning-600">
                {filteredPasses.filter(p => p.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center">
            <div className="p-2 bg-success-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-success-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-secondary-600">Approved</p>
              <p className="text-xl font-bold text-success-600">
                {filteredPasses.filter(p => p.status === 'approved').length}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center">
            <div className="p-2 bg-danger-100 rounded-lg">
              <XCircle className="h-5 w-5 text-danger-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-secondary-600">Denied</p>
              <p className="text-xl font-bold text-danger-600">
                {filteredPasses.filter(p => p.status === 'denied').length}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center">
            <div className="p-2 bg-secondary-100 rounded-lg">
              <LogOut className="h-5 w-5 text-secondary-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-secondary-600">Used</p>
              <p className="text-xl font-bold text-secondary-900">
                {filteredPasses.filter(p => p.status === 'used').length}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="label">Search</label>
            <div className="relative">
              <Search className="h-5 w-5 absolute left-3 top-3 text-secondary-400" />
              <input
                type="text"
                placeholder="Search students or reason..."
                className="input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <label className="label">Status</label>
            <div className="relative">
              <Filter className="h-5 w-5 absolute left-3 top-3 text-secondary-400" />
              <select
                className="input pl-10"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="denied">Denied</option>
                <option value="used">Used</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="label">Type</label>
            <div className="relative">
              <FileText className="h-5 w-5 absolute left-3 top-3 text-secondary-400" />
              <select
                className="input pl-10"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="exit">Exit</option>
                <option value="entry">Entry</option>
                <option value="temporary">Temporary</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="label">Date</label>
            <div className="relative">
              <Calendar className="h-5 w-5 absolute left-3 top-3 text-secondary-400" />
              <input
                type="date"
                className="input pl-10"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Gate Passes Table */}
      <div className="card">
        <div className="p-6 border-b border-secondary-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-secondary-900">
              Gate Pass Requests ({filteredPasses.length})
            </h2>
            <button 
              onClick={() => queryClient.invalidateQueries({ queryKey: ['gatePasses'] })}
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
            <p className="text-secondary-600">Loading gate passes...</p>
          </div>
        ) : filteredPasses.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="h-16 w-16 text-secondary-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-secondary-900 mb-2">No gate passes found</h3>
            <p className="text-secondary-600 mb-6">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by creating your first gate pass.'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && typeFilter === 'all' && (
              <button onClick={handleAddPass} className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700">
                <Plus className="h-4 w-4 mr-2" />
                Create First Pass
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
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Requested Time
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
                {filteredPasses.map((pass) => (
                  <tr key={pass.id} className="hover:bg-secondary-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-secondary-900">
                          {pass.student.full_name}
                        </div>
                        <div className="text-sm text-secondary-500">
                          {pass.student.student_id} • {pass.student.class_name} - {pass.student.section}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getTypeIcon(pass.type)}
                        <span className="ml-2 text-sm text-secondary-900">
                          {pass.type.charAt(0).toUpperCase() + pass.type.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-secondary-900 max-w-xs truncate">
                        {pass.reason}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-secondary-900">
                        {new Date(pass.requested_time).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(pass.status)}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ml-2 ${getStatusBadge(pass.status)}`}>
                          {pass.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewPass(pass)}
                          className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50 transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditPass(pass)}
                          className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-50 transition-colors"
                          title="Edit Pass"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        {pass.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(pass)}
                              disabled={approveGatePassMutation.isPending}
                              className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors"
                              title="Approve"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeny(pass)}
                              disabled={denyGatePassMutation.isPending}
                              className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                              title="Deny"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDeletePass(pass)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                          title="Delete Pass"
                          disabled={deleteGatePassMutation.isPending}
                        >
                          <X className="h-4 w-4" />
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
            {panelMode === 'view' && selectedPass ? (
              <div className="p-6 space-y-8">
                {/* Student Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Student Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Student Name</label>
                      <p className="text-gray-900">{selectedPass.student.full_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Student ID</label>
                      <p className="text-gray-900">{selectedPass.student.student_id}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Class</label>
                      <p className="text-gray-900">
                        {selectedPass.student.class_name} - {selectedPass.student.section}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pass Details */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Pass Details</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Type</label>
                      <div className="flex items-center mt-1">
                        {getTypeIcon(selectedPass.type)}
                        <span className="ml-2 text-gray-900">
                          {selectedPass.type.charAt(0).toUpperCase() + selectedPass.type.slice(1)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <div className="flex items-center mt-1">
                        {getStatusIcon(selectedPass.status)}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ml-2 ${getStatusBadge(selectedPass.status)}`}>
                          {selectedPass.status}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Requested Time</label>
                      <p className="text-gray-900">
                        {new Date(selectedPass.requested_time).toLocaleString()}
                      </p>
                    </div>
                    {selectedPass.approved_time && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Approved Time</label>
                        <p className="text-gray-900">
                          {new Date(selectedPass.approved_time).toLocaleString()}
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-500">Reason</label>
                      <p className="text-gray-900">{selectedPass.reason}</p>
                    </div>
                    {selectedPass.notes && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Notes</label>
                        <p className="text-gray-900">{selectedPass.notes}</p>
                      </div>
                    )}
                    {selectedPass.approved_by && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Approved By</label>
                        <p className="text-gray-900">{selectedPass.approved_by}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              // Form for Add/Edit
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Student Selection */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Student Information</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
                    <SearchableDropdown
                      options={students?.map(student => ({
                        value: student.id,
                        label: `${student.full_name} (${student.student_id}) - ${student.class_name}`,
                        ...student
                      })) || []}
                      value={formData.student_id}
                      onChange={(value) => setFormData({ ...formData, student_id: Number(value) })}
                      placeholder="Select a student"
                      searchPlaceholder="Search students by name, ID, or class..."
                      isLoading={false}
                      renderOption={(option) => (
                        <div className="flex flex-col">
                          <span className="font-medium">{option.full_name}</span>
                          <span className="text-sm text-gray-500">
                            {option.student_id} • {option.class_name} - {option.section}
                          </span>
                        </div>
                      )}
                      getOptionLabel={(option) => `${option.full_name} (${option.student_id}) - ${option.class_name}`}
                    />
                  </div>
                </div>

                {/* Pass Details */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Pass Details</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                        required
                      >
                        <option value="exit">Exit</option>
                        <option value="entry">Entry</option>
                        <option value="temporary">Temporary</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Requested Time *</label>
                      <input
                        type="datetime-local"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        value={formData.requested_time}
                        onChange={(e) => setFormData({ ...formData, requested_time: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        rows={3}
                        placeholder="Enter the reason for gate pass..."
                        value={formData.reason}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        rows={2}
                        placeholder="Additional notes (optional)..."
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* Panel Footer */}
          {panelMode === 'view' && selectedPass ? (
            <div className="border-t border-gray-200 px-6 py-4">
              <div className="flex space-x-3">
                <button
                  onClick={() => handleEditPass(selectedPass)}
                  className="flex-1 inline-flex justify-center items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Pass
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
                  disabled={createGatePassMutation.isPending || updateGatePassMutation.isPending}
                  className="flex-1 inline-flex justify-center items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {(createGatePassMutation.isPending || updateGatePassMutation.isPending) ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {panelMode === 'edit' ? 'Update Pass' : 'Create Pass'}
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
          setPassToDelete(null);
        }}
        onConfirm={confirmDeletePass}
        title="Delete Gate Pass"
        message={`Are you sure you want to delete this gate pass for ${passToDelete?.student.full_name}? This action cannot be undone.`}
        type="danger"
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};

export default GatePassPage; 
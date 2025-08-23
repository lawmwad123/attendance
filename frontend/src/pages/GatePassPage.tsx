import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
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
  RefreshCw
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPass, setSelectedPass] = useState<GatePass | null>(null);
  const [createForm, setCreateForm] = useState<CreateGatePassForm>({
    student_id: 0,
    type: 'exit',
    reason: '',
    requested_time: '',
    notes: '',
  });

  const queryClient = useQueryClient();

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
      setShowCreateModal(false);
      resetForm();
    },
    onError: (error: any) => {
      console.error('Error creating gate pass:', error);
      alert(error.response?.data?.detail || 'Failed to create gate pass');
    },
  });

  // Approve gate pass mutation
  const approveGatePassMutation = useMutation({
    mutationFn: ({ id, notes }: { id: number; notes?: string }) => 
      api.approveGatePass(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gatePasses'] });
      if (selectedPass) {
        setShowDetailsModal(false);
        setSelectedPass(null);
      }
    },
    onError: (error: any) => {
      console.error('Error approving gate pass:', error);
      alert(error.response?.data?.detail || 'Failed to approve gate pass');
    },
  });

  // Deny gate pass mutation
  const denyGatePassMutation = useMutation({
    mutationFn: ({ id, notes }: { id: number; notes?: string }) => 
      api.denyGatePass(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gatePasses'] });
      if (selectedPass) {
        setShowDetailsModal(false);
        setSelectedPass(null);
      }
    },
    onError: (error: any) => {
      console.error('Error denying gate pass:', error);
      alert(error.response?.data?.detail || 'Failed to deny gate pass');
    },
  });

  const resetForm = () => {
    setCreateForm({
      student_id: 0,
      type: 'exit',
      reason: '',
      requested_time: '',
      notes: '',
    });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.student_id || !createForm.reason || !createForm.requested_time) {
      alert('Please fill in all required fields');
      return;
    }
    createGatePassMutation.mutate(createForm);
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
    switch (status) {
      case 'approved':
        return 'badge-success';
      case 'denied':
        return 'badge-danger';
      case 'pending':
        return 'badge-warning';
      case 'used':
        return 'badge-primary';
      case 'expired':
        return 'badge-secondary';
      default:
        return 'badge-secondary';
    }
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

  // Stats calculations
  const stats = {
    total: filteredPasses.length,
    pending: filteredPasses.filter(p => p.status === 'pending').length,
    approved: filteredPasses.filter(p => p.status === 'approved').length,
    denied: filteredPasses.filter(p => p.status === 'denied').length,
    used: filteredPasses.filter(p => p.status === 'used').length,
  };

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
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Pass
          </button>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['gatePasses'] })}
            className="btn-secondary flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
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
              <p className="text-xl font-bold text-secondary-900">{stats.total}</p>
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
              <p className="text-xl font-bold text-warning-600">{stats.pending}</p>
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
              <p className="text-xl font-bold text-success-600">{stats.approved}</p>
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
              <p className="text-xl font-bold text-danger-600">{stats.denied}</p>
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
              <p className="text-xl font-bold text-secondary-900">{stats.used}</p>
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
          <h2 className="text-lg font-semibold text-secondary-900">Gate Pass Requests</h2>
        </div>

        {isLoading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-secondary-600 mt-2">Loading gate passes...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <div className="flex items-center justify-center text-danger-600 mb-4">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <span>Error loading gate passes data: {(error as Error).message}</span>
            </div>
          </div>
        ) : filteredPasses.length === 0 ? (
          <div className="p-6 text-center">
            <FileText className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-secondary-900 mb-2">No gate passes found</h3>
            <p className="text-secondary-600">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'No gate pass requests available.'
              }
            </p>
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
                  <tr key={pass.id} className="hover:bg-secondary-50">
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
                        <span className={`badge ${getStatusBadge(pass.status)} ml-2`}>
                          {pass.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedPass(pass);
                            setShowDetailsModal(true);
                          }}
                          className="text-primary-600 hover:text-primary-900"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {pass.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(pass)}
                              disabled={approveGatePassMutation.isPending}
                              className="text-success-600 hover:text-success-900"
                              title="Approve"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeny(pass)}
                              disabled={denyGatePassMutation.isPending}
                              className="text-danger-600 hover:text-danger-900"
                              title="Deny"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Gate Pass Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-secondary-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-secondary-900">Create Gate Pass</h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="text-secondary-400 hover:text-secondary-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Student *</label>
                <select
                  className="input"
                  value={createForm.student_id}
                  onChange={(e) => setCreateForm({ ...createForm, student_id: parseInt(e.target.value) })}
                  required
                >
                  <option value={0}>Select a student</option>
                  {students?.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.full_name} ({student.student_id}) - {student.class_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Type *</label>
                <select
                  className="input"
                  value={createForm.type}
                  onChange={(e) => setCreateForm({ ...createForm, type: e.target.value as any })}
                  required
                >
                  <option value="exit">Exit</option>
                  <option value="entry">Entry</option>
                  <option value="temporary">Temporary</option>
                </select>
              </div>

              <div>
                <label className="label">Requested Time *</label>
                <input
                  type="datetime-local"
                  className="input"
                  value={createForm.requested_time}
                  onChange={(e) => setCreateForm({ ...createForm, requested_time: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="label">Reason *</label>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Enter the reason for gate pass..."
                  value={createForm.reason}
                  onChange={(e) => setCreateForm({ ...createForm, reason: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="label">Notes</label>
                <textarea
                  className="input"
                  rows={2}
                  placeholder="Additional notes (optional)..."
                  value={createForm.notes}
                  onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createGatePassMutation.isPending}
                  className="btn-primary flex items-center"
                >
                  {createGatePassMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Pass
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gate Pass Details Modal */}
      {showDetailsModal && selectedPass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-secondary-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-secondary-900">Gate Pass Details</h2>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedPass(null);
                  }}
                  className="text-secondary-400 hover:text-secondary-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Student Info */}
              <div>
                <h3 className="text-lg font-medium text-secondary-900 mb-3">Student Information</h3>
                <div className="bg-secondary-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-secondary-600">Name:</span>
                    <span className="text-sm font-medium text-secondary-900">
                      {selectedPass.student.full_name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-secondary-600">Student ID:</span>
                    <span className="text-sm font-medium text-secondary-900">
                      {selectedPass.student.student_id}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-secondary-600">Class:</span>
                    <span className="text-sm font-medium text-secondary-900">
                      {selectedPass.student.class_name} - {selectedPass.student.section}
                    </span>
                  </div>
                </div>
              </div>

              {/* Pass Details */}
              <div>
                <h3 className="text-lg font-medium text-secondary-900 mb-3">Pass Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-secondary-600">Type:</span>
                    <div className="flex items-center">
                      {getTypeIcon(selectedPass.type)}
                      <span className="ml-2 text-sm font-medium text-secondary-900">
                        {selectedPass.type.charAt(0).toUpperCase() + selectedPass.type.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-secondary-600">Status:</span>
                    <div className="flex items-center">
                      {getStatusIcon(selectedPass.status)}
                      <span className={`badge ${getStatusBadge(selectedPass.status)} ml-2`}>
                        {selectedPass.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-secondary-600">Requested Time:</span>
                    <span className="text-sm font-medium text-secondary-900">
                      {new Date(selectedPass.requested_time).toLocaleString()}
                    </span>
                  </div>
                  {selectedPass.approved_time && (
                    <div className="flex justify-between">
                      <span className="text-sm text-secondary-600">Approved Time:</span>
                      <span className="text-sm font-medium text-secondary-900">
                        {new Date(selectedPass.approved_time).toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-secondary-600">Reason:</span>
                    <span className="text-sm font-medium text-secondary-900 text-right max-w-xs">
                      {selectedPass.reason}
                    </span>
                  </div>
                  {selectedPass.notes && (
                    <div className="flex justify-between">
                      <span className="text-sm text-secondary-600">Notes:</span>
                      <span className="text-sm font-medium text-secondary-900 text-right max-w-xs">
                        {selectedPass.notes}
                      </span>
                    </div>
                  )}
                  {selectedPass.approved_by && (
                    <div className="flex justify-between">
                      <span className="text-sm text-secondary-600">Approved By:</span>
                      <span className="text-sm font-medium text-secondary-900">
                        {selectedPass.approved_by}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              {selectedPass.status === 'pending' && (
                <div className="flex justify-end space-x-3 pt-4 border-t border-secondary-200">
                  <button
                    onClick={() => handleDeny(selectedPass)}
                    disabled={denyGatePassMutation.isPending}
                    className="btn-danger flex items-center"
                  >
                    {denyGatePassMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Denying...
                      </>
                    ) : (
                      <>
                        <X className="h-4 w-4 mr-2" />
                        Deny
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleApprove(selectedPass)}
                    disabled={approveGatePassMutation.isPending}
                    className="btn-success flex items-center"
                  >
                    {approveGatePassMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Approving...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Approve
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GatePassPage; 
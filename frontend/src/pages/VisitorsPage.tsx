import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '../lib/api';
import { 
  Users, 
  UserPlus, 
  UserCheck, 
  UserX, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar,
  Search,
  Filter,
  MoreVertical,
  Edit3,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Shield,
  QrCode,
  Badge,
  Settings,
  Download,
  RefreshCw,
  Plus,
  ArrowUpDown,
  CalendarDays,
  BarChart3,
  Users2,
  Clock3,
  AlertCircle,
  CheckSquare,
  Square
} from 'lucide-react';

interface Visitor {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
  phone: string;
  visitor_type: string;
  purpose: string;
  status: string;
  requested_entry_time: string;
  expected_exit_time?: string;
  actual_entry_time?: string;
  actual_exit_time?: string;
  host_user_name?: string;
  host_student_name?: string;
  qr_code?: string;
  badge_number?: string;
  is_blacklisted: boolean;
  is_overdue: boolean;
  visit_duration_minutes?: number;
  entry_gate?: string;
  exit_gate?: string;
  created_at: string;
}

interface VisitorAnalytics {
  total_visitors_today: number;
  total_visitors_this_week: number;
  total_visitors_this_month: number;
  visitors_checked_in: number;
  visitors_overdue: number;
  blacklisted_attempts: number;
  popular_visitor_types: Array<{type: string, count: number}>;
  peak_visiting_hours: Array<{hour: string, count: number}>;
  average_visit_duration: number;
}

const VisitorsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const queryClient = useQueryClient();

  // Fetch visitors data
  const {
    data: visitors,
    isLoading: visitorsLoading,
    error: visitorsError,
    refetch: refetchVisitors
  } = useQuery({
    queryKey: ['visitors', searchTerm, filterStatus, filterType, sortBy, sortOrder],
    queryFn: () => api.getVisitors({
      search: searchTerm || undefined,
      status: filterStatus === 'all' ? undefined : filterStatus,
      visitor_type: filterType === 'all' ? undefined : filterType,
      skip: 0,
      limit: 100
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch analytics
  const {
    data: analytics,
    isLoading: analyticsLoading
  } = useQuery({
    queryKey: ['visitorAnalytics'],
    queryFn: () => api.getVisitorAnalytics(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Mutations
  const checkInMutation = useMutation({
    mutationFn: (data: {visitor_id: number, entry_gate: string, security_guard_id: number}) => 
      api.checkInVisitor(data.visitor_id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
      queryClient.invalidateQueries({ queryKey: ['visitorAnalytics'] });
      toast.success('Visitor checked in successfully!');
      setShowCheckInModal(false);
      setSelectedVisitor(null);
    },
    onError: (error: any) => {
      toast.error('Failed to check in visitor. Please try again.');
    }
  });

  const checkOutMutation = useMutation({
    mutationFn: (data: {visitor_id: number, exit_gate: string, security_guard_id: number}) => 
      api.checkOutVisitor(data.visitor_id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
      queryClient.invalidateQueries({ queryKey: ['visitorAnalytics'] });
      toast.success('Visitor checked out successfully!');
      setShowCheckOutModal(false);
      setSelectedVisitor(null);
    },
    onError: (error: any) => {
      toast.error('Failed to check out visitor. Please try again.');
    }
  });

  const approveMutation = useMutation({
    mutationFn: (data: {visitor_id: number, approved_by_user_id: number, approval_notes?: string}) => 
      api.approveVisitor(data.visitor_id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
      toast.success('Visitor approved successfully!');
    },
    onError: (error: any) => {
      toast.error('Failed to approve visitor. Please try again.');
    }
  });

  const denyMutation = useMutation({
    mutationFn: (data: {visitor_id: number, denied_by_user_id: number, denial_reason: string}) => 
      api.denyVisitor(data.visitor_id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
      toast.success('Visitor denied successfully!');
    },
    onError: (error: any) => {
      toast.error('Failed to deny visitor. Please try again.');
    }
  });

  // Filter visitors based on active tab
  const filteredVisitors = visitors?.filter(visitor => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return visitor.status === 'pending';
    if (activeTab === 'approved') return visitor.status === 'approved';
    if (activeTab === 'checked-in') return visitor.status === 'checked_in';
    if (activeTab === 'overdue') return visitor.is_overdue;
    if (activeTab === 'blacklisted') return visitor.is_blacklisted;
    return true;
  }) || [];

  const handleCheckIn = (visitor: Visitor) => {
    setSelectedVisitor(visitor);
    setShowCheckInModal(true);
  };

  const handleCheckOut = (visitor: Visitor) => {
    setSelectedVisitor(visitor);
    setShowCheckOutModal(true);
  };

  const handleApprove = (visitor: Visitor) => {
    approveMutation.mutate({
      visitor_id: visitor.id,
      approved_by_user_id: 1, // This should come from current user context
      approval_notes: 'Approved by admin'
    });
  };

  const handleDeny = (visitor: Visitor) => {
    denyMutation.mutate({
      visitor_id: visitor.id,
      denied_by_user_id: 1, // This should come from current user context
      denial_reason: 'Denied by admin'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'denied': return 'bg-red-100 text-red-800';
      case 'checked_in': return 'bg-green-100 text-green-800';
      case 'checked_out': return 'bg-gray-100 text-gray-800';
      case 'expired': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVisitorTypeColor = (type: string) => {
    switch (type) {
      case 'parent_guardian': return 'bg-purple-100 text-purple-800';
      case 'guest_speaker': return 'bg-indigo-100 text-indigo-800';
      case 'contractor': return 'bg-orange-100 text-orange-800';
      case 'supplier': return 'bg-teal-100 text-teal-800';
      case 'emergency': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (visitorsError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Visitor Management</h1>
          <p className="text-gray-600">Manage school visitors and access control</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center text-red-600">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>Error loading visitors. Please try again.</span>
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
          <h1 className="text-2xl font-bold text-gray-900">Visitor Management</h1>
          <p className="text-gray-600">Manage school visitors and access control</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => refetchVisitors()}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Visitor
          </button>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-blue-50 mr-3">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Today's Visitors</p>
                <p className="text-xl font-bold text-gray-900">{analytics.total_visitors_today}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-green-50 mr-3">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Currently Inside</p>
                <p className="text-xl font-bold text-gray-900">{analytics.visitors_checked_in}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-yellow-50 mr-3">
                <Clock3 className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-xl font-bold text-gray-900">{analytics.visitors_overdue}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-red-50 mr-3">
                <Shield className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Blacklisted Attempts</p>
                <p className="text-xl font-bold text-gray-900">{analytics.blacklisted_attempts}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex items-center py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="h-4 w-4 mr-2" />
              All Visitors ({visitors?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex items-center py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'pending'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Clock className="h-4 w-4 mr-2" />
              Pending ({visitors?.filter(v => v.status === 'pending').length || 0})
            </button>
            <button
              onClick={() => setActiveTab('checked-in')}
              className={`flex items-center py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'checked-in'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Inside ({visitors?.filter(v => v.status === 'checked_in').length || 0})
            </button>
            <button
              onClick={() => setActiveTab('overdue')}
              className={`flex items-center py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'overdue'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Overdue ({visitors?.filter(v => v.is_overdue).length || 0})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search visitors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 w-full"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="denied">Denied</option>
                <option value="checked_in">Checked In</option>
                <option value="checked_out">Checked Out</option>
              </select>
              
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="parent_guardian">Parent/Guardian</option>
                <option value="guest_speaker">Guest Speaker</option>
                <option value="contractor">Contractor</option>
                <option value="supplier">Supplier</option>
                <option value="emergency">Emergency</option>
                <option value="guest">Guest</option>
              </select>
            </div>
          </div>

          {/* Visitors Table */}
          {visitorsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg shadow">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Visitor
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Purpose
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entry Time
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Host
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredVisitors.map((visitor) => (
                    <tr key={visitor.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {visitor.first_name[0]}{visitor.last_name[0]}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {visitor.first_name} {visitor.last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {visitor.phone}
                            </div>
                            {visitor.email && (
                              <div className="text-sm text-gray-500">
                                {visitor.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getVisitorTypeColor(visitor.visitor_type)}`}>
                          {visitor.visitor_type.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {visitor.purpose}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(visitor.status)}`}>
                          {visitor.status.replace('_', ' ').toUpperCase()}
                        </span>
                        {visitor.is_overdue && (
                          <div className="text-xs text-red-600 mt-1">OVERDUE</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {visitor.actual_entry_time ? (
                          <div>
                            <div>{new Date(visitor.actual_entry_time).toLocaleDateString()}</div>
                            <div>{new Date(visitor.actual_entry_time).toLocaleTimeString()}</div>
                          </div>
                        ) : (
                          <div>
                            <div>{new Date(visitor.requested_entry_time).toLocaleDateString()}</div>
                            <div>{new Date(visitor.requested_entry_time).toLocaleTimeString()}</div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {visitor.host_user_name || visitor.host_student_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          {visitor.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(visitor)}
                                className="text-green-600 hover:text-green-900"
                                title="Approve"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeny(visitor)}
                                className="text-red-600 hover:text-red-900"
                                title="Deny"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          
                          {visitor.status === 'approved' && (
                            <button
                              onClick={() => handleCheckIn(visitor)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Check In"
                            >
                              <UserCheck className="h-4 w-4" />
                            </button>
                          )}
                          
                          {visitor.status === 'checked_in' && (
                            <button
                              onClick={() => handleCheckOut(visitor)}
                              className="text-orange-600 hover:text-orange-900"
                              title="Check Out"
                            >
                              <UserX className="h-4 w-4" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => {/* View details */}}
                            className="text-gray-600 hover:text-gray-900"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredVisitors.length === 0 && (
                <div className="text-center py-8 bg-white">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No visitors found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm || filterStatus !== 'all' || filterType !== 'all' 
                      ? 'Try adjusting your search or filters.'
                      : 'Get started by adding a new visitor.'
                    }
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Visitor Modal */}
      {showAddModal && (
        <AddVisitorModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            queryClient.invalidateQueries({ queryKey: ['visitors'] });
            queryClient.invalidateQueries({ queryKey: ['visitorAnalytics'] });
          }}
        />
      )}

      {/* Check In Modal */}
      {showCheckInModal && selectedVisitor && (
        <CheckInModal
          visitor={selectedVisitor}
          onClose={() => {
            setShowCheckInModal(false);
            setSelectedVisitor(null);
          }}
          onSuccess={(data) => {
            checkInMutation.mutate(data);
          }}
        />
      )}

      {/* Check Out Modal */}
      {showCheckOutModal && selectedVisitor && (
        <CheckOutModal
          visitor={selectedVisitor}
          onClose={() => {
            setShowCheckOutModal(false);
            setSelectedVisitor(null);
          }}
          onSuccess={(data) => {
            checkOutMutation.mutate(data);
          }}
        />
      )}
    </div>
  );
};

// Modal Components
const AddVisitorModal: React.FC<{
  onClose: () => void;
  onSuccess: () => void;
}> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    visitor_type: 'guest',
    purpose: '',
    host_user_id: '',
    host_student_id: '',
    requested_entry_time: new Date().toISOString().slice(0, 16),
    expected_exit_time: '',
    vehicle_number: '',
    company_name: '',
    emergency_contact: '',
    special_instructions: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // This would call the API to create visitor
    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Visitor</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Visitor Type</label>
              <select
                value={formData.visitor_type}
                onChange={(e) => setFormData({...formData, visitor_type: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="guest">Guest</option>
                <option value="parent_guardian">Parent/Guardian</option>
                <option value="guest_speaker">Guest Speaker</option>
                <option value="contractor">Contractor</option>
                <option value="supplier">Supplier</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Purpose</label>
              <textarea
                value={formData.purpose}
                onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Requested Entry Time</label>
                <input
                  type="datetime-local"
                  value={formData.requested_entry_time}
                  onChange={(e) => setFormData({...formData, requested_entry_time: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Expected Exit Time</label>
                <input
                  type="datetime-local"
                  value={formData.expected_exit_time}
                  onChange={(e) => setFormData({...formData, expected_exit_time: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Add Visitor
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const CheckInModal: React.FC<{
  visitor: Visitor;
  onClose: () => void;
  onSuccess: (data: any) => void;
}> = ({ visitor, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    entry_gate: 'main_gate',
    security_guard_id: 1, // This should come from current user context
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSuccess({
      visitor_id: visitor.id,
      ...formData
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Check In Visitor</h3>
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              <strong>{visitor.first_name} {visitor.last_name}</strong> - {visitor.visitor_type.replace('_', ' ')}
            </p>
            <p className="text-sm text-gray-500">{visitor.purpose}</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Entry Gate</label>
              <select
                value={formData.entry_gate}
                onChange={(e) => setFormData({...formData, entry_gate: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="main_gate">Main Gate</option>
                <option value="staff_entrance">Staff Entrance</option>
                <option value="visitor_entrance">Visitor Entrance</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Check In
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const CheckOutModal: React.FC<{
  visitor: Visitor;
  onClose: () => void;
  onSuccess: (data: any) => void;
}> = ({ visitor, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    exit_gate: 'main_gate',
    security_guard_id: 1, // This should come from current user context
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSuccess({
      visitor_id: visitor.id,
      ...formData
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Check Out Visitor</h3>
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              <strong>{visitor.first_name} {visitor.last_name}</strong> - {visitor.visitor_type.replace('_', ' ')}
            </p>
            <p className="text-sm text-gray-500">{visitor.purpose}</p>
            {visitor.visit_duration_minutes && (
              <p className="text-sm text-gray-500">
                Duration: {Math.floor(visitor.visit_duration_minutes / 60)}h {visitor.visit_duration_minutes % 60}m
              </p>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Exit Gate</label>
              <select
                value={formData.exit_gate}
                onChange={(e) => setFormData({...formData, exit_gate: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="main_gate">Main Gate</option>
                <option value="staff_entrance">Staff Entrance</option>
                <option value="visitor_entrance">Visitor Entrance</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                Check Out
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VisitorsPage;

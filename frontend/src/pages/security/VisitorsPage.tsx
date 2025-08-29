import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  UserPlus, 
  Search, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  Building, 
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
  Calendar,
  FileText
} from 'lucide-react';
import { api } from '../../lib/api';

const VisitorsPage: React.FC = () => {
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  // Fetch visitors data
  const { data: visitors, isLoading } = useQuery({
    queryKey: ['visitors', searchTerm],
    queryFn: () => api.getSecurityVisitors({ search: searchTerm }),
    refetchInterval: 30000,
  });

  // Register visitor mutation
  const registerVisitorMutation = useMutation({
    mutationFn: (data: any) => api.registerSecurityVisitor(data),
    onSuccess: () => {
      toast.success('Visitor registered successfully!');
      setShowRegistrationForm(false);
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
      queryClient.invalidateQueries({ queryKey: ['securityDashboard'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to register visitor: ${error.message}`);
    }
  });

  // Check-out visitor mutation
  const checkOutVisitorMutation = useMutation({
    mutationFn: (data: { visitorId: number; notes: string }) => api.checkOutSecurityVisitor(data.visitorId, { notes: data.notes }),
    onSuccess: () => {
      toast.success('Visitor checked out successfully!');
      setSelectedVisitor(null);
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
      queryClient.invalidateQueries({ queryKey: ['securityDashboard'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to check out visitor: ${error.message}`);
    }
  });

  const handleRegisterVisitor = async (formData: any) => {
    await registerVisitorMutation.mutateAsync({
      ...formData,
      entry_time: new Date().toISOString(),
      status: 'present'
    });
  };

  const handleCheckOut = async (visitorId: number) => {
    await checkOutVisitorMutation.mutateAsync({ visitorId, notes: "Checked out by security" });
  };

  const activeVisitors = visitors?.filter((v: any) => v.status === 'present') || [];
  const checkedOutVisitors = visitors?.filter((v: any) => v.status === 'checked_out') || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Visitor Management</h1>
            <p className="mt-2 text-lg text-gray-600">
              Register and manage school visitors
            </p>
          </div>
          <button
            onClick={() => setShowRegistrationForm(true)}
            className="flex items-center px-8 py-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-xl font-medium"
          >
            <UserPlus className="h-6 w-6 mr-2" />
            Register Visitor
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Visitors Today</p>
              <p className="text-3xl font-bold text-gray-900">{visitors?.length || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Currently Present</p>
              <p className="text-3xl font-bold text-gray-900">{activeVisitors.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-gray-100">
              <ArrowLeft className="h-8 w-8 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Checked Out</p>
              <p className="text-3xl font-bold text-gray-900">{checkedOutVisitors.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Search Visitors</h2>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, purpose, or contact..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 text-xl border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Active Visitors */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Currently Present</h2>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : activeVisitors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeVisitors.map((visitor: any) => (
              <div key={visitor.id} className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                      <UserPlus className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-xl font-bold text-gray-900">
                        {visitor.first_name} {visitor.last_name}
                      </h3>
                      <p className="text-sm text-gray-600">{visitor.purpose}</p>
                    </div>
                  </div>
                  <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800">
                    Present
                  </span>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    {visitor.phone}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Building className="h-4 w-4 mr-2" />
                    Meeting: {visitor.meeting_with}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    Entry: {new Date(visitor.entry_time).toLocaleTimeString()}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    Location: {visitor.location}
                  </div>
                </div>
                
                <div className="mt-6">
                  <button
                    onClick={() => handleCheckOut(visitor.id)}
                    className="w-full flex items-center justify-center px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-lg font-medium"
                  >
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Check Out
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg">No visitors currently present</p>
          </div>
        )}
      </div>

      {/* Recent Check-outs */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Check-outs</h2>
        {checkedOutVisitors.slice(0, 6).map((visitor: any) => (
          <div key={visitor.id} className="flex items-center p-4 bg-gray-50 rounded-lg mb-4">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </div>
            </div>
            <div className="ml-4 flex-1">
              <p className="text-lg font-medium text-gray-900">
                {visitor.first_name} {visitor.last_name}
              </p>
              <p className="text-sm text-gray-600">
                {visitor.purpose} • Checked out at {new Date(visitor.exit_time).toLocaleTimeString()}
              </p>
            </div>
            <div className="flex-shrink-0">
              <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-gray-100 text-gray-800">
                Checked Out
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Registration Form Modal */}
      {showRegistrationForm && (
        <VisitorRegistrationForm
          onSubmit={handleRegisterVisitor}
          onCancel={() => setShowRegistrationForm(false)}
          isLoading={registerVisitorMutation.isPending}
        />
      )}
    </div>
  );
};

// Visitor Registration Form Component
interface VisitorRegistrationFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const VisitorRegistrationForm: React.FC<VisitorRegistrationFormProps> = ({
  onSubmit,
  onCancel,
  isLoading
}) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    purpose: '',
    meeting_with: '',
    location: 'main_gate',
    id_number: '',
    vehicle_number: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Register New Visitor</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-lg font-medium text-gray-700 mb-2">
                Purpose of Visit *
              </label>
              <textarea
                name="purpose"
                value={formData.purpose}
                onChange={handleChange}
                required
                rows={3}
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Brief description of visit purpose..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">
                  Meeting With *
                </label>
                <input
                  type="text"
                  name="meeting_with"
                  value={formData.meeting_with}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Staff member name"
                />
              </div>
              
              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">
                  Location
                </label>
                <select
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="main_gate">Main Gate</option>
                  <option value="admin_office">Admin Office</option>
                  <option value="staff_room">Staff Room</option>
                  <option value="classroom">Classroom</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">
                  ID Number
                </label>
                <input
                  type="text"
                  name="id_number"
                  value={formData.id_number}
                  onChange={handleChange}
                  className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">
                  Vehicle Number
                </label>
                <input
                  type="text"
                  name="vehicle_number"
                  value={formData.vehicle_number}
                  onChange={handleChange}
                  className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex space-x-4 pt-6">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-6 py-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-xl font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-6 py-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-xl font-medium disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-2"></div>
                    Registering...
                  </div>
                ) : (
                  'Register Visitor'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VisitorsPage;

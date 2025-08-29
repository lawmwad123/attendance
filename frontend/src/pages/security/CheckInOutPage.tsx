import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  Search, 
  Clock, 
  Users, 
  Shield, 
  QrCode, 
  CreditCard, 
  CheckCircle, 
  XCircle,
  ArrowRight,
  ArrowLeft,
  User,
  BookOpen,
  Building
} from 'lucide-react';
import { api } from '../../lib/api';

const CheckInOutPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [checkType, setCheckType] = useState<'IN' | 'OUT'>('IN');
  const [isProcessing, setIsProcessing] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Focus search input on mount
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Search for people
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['securitySearch', searchTerm],
    queryFn: () => api.searchPeopleForSecurity({ query: searchTerm, type: 'all' }),
    enabled: searchTerm.length >= 2,
    staleTime: 30000,
  });

  // Check-in/out mutation
  const checkInOutMutation = useMutation({
    mutationFn: (data: any) => api.markSecurityAttendance(data),
    onSuccess: (data) => {
      toast.success(`${checkType === 'IN' ? 'Check-in' : 'Check-out'} successful!`);
      setSelectedPerson(null);
      setSearchTerm('');
      queryClient.invalidateQueries({ queryKey: ['securityDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['recentCheckins'] });
      
      // Focus search input again
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    },
    onError: (error: any) => {
      toast.error(`Failed to ${checkType.toLowerCase()}: ${error.message}`);
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      // Search is handled by the query
    }
  };

  const handlePersonSelect = (person: any) => {
    setSelectedPerson(person);
    setSearchTerm('');
  };

  const handleCheckInOut = async () => {
    if (!selectedPerson) return;

    setIsProcessing(true);
    try {
      await checkInOutMutation.mutateAsync({
        person_id: selectedPerson.id,
        person_type: selectedPerson.type,
        check_type: checkType,
        method: 'manual',
        location: 'main_gate',
        notes: `Security ${checkType.toLowerCase()} by security officer`
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQRScan = () => {
    // Navigate to QR scanner
    window.location.href = '/security/qr-scanner';
  };

  const handleCardRead = () => {
    // Navigate to card reader
    window.location.href = '/security/card-reader';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Check-in/Out</h1>
            <p className="mt-2 text-lg text-gray-600">
              Mark student or staff entry and exit
            </p>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={handleQRScan}
              className="flex items-center px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-lg font-medium"
            >
              <QrCode className="h-6 w-6 mr-2" />
              QR Scanner
            </button>
            <button
              onClick={handleCardRead}
              className="flex items-center px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-lg font-medium"
            >
              <CreditCard className="h-6 w-6 mr-2" />
              Card Reader
            </button>
          </div>
        </div>
      </div>

      {/* Check Type Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Action</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => setCheckType('IN')}
            className={`
              relative p-8 rounded-xl border-4 transition-all duration-200 text-left
              ${checkType === 'IN' 
                ? 'border-green-500 bg-green-50' 
                : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-50'
              }
            `}
          >
            <div className="flex items-center">
              <div className={`
                p-4 rounded-lg mr-4
                ${checkType === 'IN' ? 'bg-green-500' : 'bg-gray-200'}
              `}>
                <ArrowRight className={`h-8 w-8 ${checkType === 'IN' ? 'text-white' : 'text-gray-400'}`} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Check-in</h3>
                <p className="text-lg text-gray-600">Mark entry into school</p>
              </div>
            </div>
            {checkType === 'IN' && (
              <div className="absolute top-4 right-4">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            )}
          </button>

          <button
            onClick={() => setCheckType('OUT')}
            className={`
              relative p-8 rounded-xl border-4 transition-all duration-200 text-left
              ${checkType === 'OUT' 
                ? 'border-red-500 bg-red-50' 
                : 'border-gray-200 bg-white hover:border-red-300 hover:bg-red-50'
              }
            `}
          >
            <div className="flex items-center">
              <div className={`
                p-4 rounded-lg mr-4
                ${checkType === 'OUT' ? 'bg-red-500' : 'bg-gray-200'}
              `}>
                <ArrowLeft className={`h-8 w-8 ${checkType === 'OUT' ? 'text-white' : 'text-gray-400'}`} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Check-out</h3>
                <p className="text-lg text-gray-600">Mark exit from school</p>
              </div>
            </div>
            {checkType === 'OUT' && (
              <div className="absolute top-4 right-4">
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Search Person</h2>
        
        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search by name, ID, or card number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 text-xl border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </form>

        {/* Search Results */}
        {searchTerm.length >= 2 && (
          <div className="space-y-4">
            {isSearching ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-lg">Searching...</span>
              </div>
            ) : searchResults?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map((person: any) => (
                  <button
                    key={person.id}
                    onClick={() => handlePersonSelect(person)}
                    className="p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left border-2 border-transparent hover:border-blue-300"
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                          {person.type === 'student' ? (
                            <BookOpen className="h-6 w-6 text-blue-600" />
                          ) : person.type === 'staff' ? (
                            <Shield className="h-6 w-6 text-blue-600" />
                          ) : (
                            <User className="h-6 w-6 text-blue-600" />
                          )}
                        </div>
                      </div>
                      <div className="ml-4 flex-1">
                        <h3 className="text-lg font-medium text-gray-900">
                          {person.first_name} {person.last_name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {person.type === 'student' ? 'Student' : 'Staff'}
                        </p>
                        <p className="text-sm text-gray-500">
                          ID: {person.id_number || person.employee_id}
                        </p>
                        {person.class_name && (
                          <p className="text-sm text-gray-500">
                            Class: {person.class_name}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">No results found</p>
                <p className="text-sm">Try searching with a different term</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Person */}
      {selectedPerson && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Confirm {checkType === 'IN' ? 'Check-in' : 'Check-out'}</h2>
          
          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                  {selectedPerson.type === 'student' ? (
                    <BookOpen className="h-8 w-8 text-blue-600" />
                  ) : (
                    <Shield className="h-8 w-8 text-blue-600" />
                  )}
                </div>
              </div>
              <div className="ml-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  {selectedPerson.first_name} {selectedPerson.last_name}
                </h3>
                <p className="text-lg text-gray-600">
                  {selectedPerson.type === 'student' ? 'Student' : 'Staff Member'}
                </p>
                <p className="text-lg text-gray-600">
                  ID: {selectedPerson.id_number || selectedPerson.employee_id}
                </p>
                {selectedPerson.class_name && (
                  <p className="text-lg text-gray-600">
                    Class: {selectedPerson.class_name}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => setSelectedPerson(null)}
              className="flex-1 px-8 py-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-xl font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleCheckInOut}
              disabled={isProcessing}
              className={`
                flex-1 px-8 py-4 rounded-lg text-xl font-medium transition-colors
                ${checkType === 'IN'
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-red-500 hover:bg-red-600 text-white'
                }
                ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {isProcessing ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                `Confirm ${checkType === 'IN' ? 'Check-in' : 'Check-out'}`
              )}
            </button>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
        <RecentActivity />
      </div>
    </div>
  );
};

// Recent Activity Component
const RecentActivity: React.FC = () => {
  const { data: recentActivity, isLoading } = useQuery({
    queryKey: ['recentCheckins'],
    queryFn: () => api.getRecentCheckins({ limit: 10 }),
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {recentActivity?.map((activity: any, index: number) => (
        <div key={index} className="flex items-center p-4 bg-gray-50 rounded-lg">
          <div className="flex-shrink-0">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
              activity.check_type === 'IN' ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {activity.check_type === 'IN' ? (
                <ArrowRight className="h-5 w-5 text-green-600" />
              ) : (
                <ArrowLeft className="h-5 w-5 text-red-600" />
              )}
            </div>
          </div>
          <div className="ml-4 flex-1">
            <p className="text-lg font-medium text-gray-900">
              {activity.person_name}
            </p>
            <p className="text-sm text-gray-600">
              {activity.check_type} • {activity.time} • {activity.method}
            </p>
          </div>
          <div className="flex-shrink-0">
            <span className={`
              inline-flex px-3 py-1 text-sm font-semibold rounded-full
              ${activity.check_type === 'IN' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
              }
            `}>
              {activity.check_type}
            </span>
          </div>
        </div>
      )) || (
        <div className="text-center py-8 text-gray-500">
          <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No recent activity</p>
        </div>
      )}
    </div>
  );
};

export default CheckInOutPage;

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '../lib/api';
import { 
  Shield, 
  Users, 
  Settings, 
  Plus, 
  Trash2, 
  Edit3, 
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';

interface Policy {
  role: string;
  resource_type: string;
  resource: string;
  action: string;
  attributes: string[];
}

interface UserRole {
  user_id: string;
  roles: string[];
}

interface Resource {
  pages: string[];
  features: string[];
  api_endpoints: string[];
}

interface Actions {
  pages: string[];
  features: string[];
  api_endpoints: string[];
}

const PermissionsManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState('policies');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterResourceType, setFilterResourceType] = useState('all');
  const queryClient = useQueryClient();

  // Fetch data
  const {
    data: policies,
    isLoading: policiesLoading,
    error: policiesError
  } = useQuery({
    queryKey: ['permissions', 'policies'],
    queryFn: () => api.getPermissionsPolicies(),
    enabled: activeTab === 'policies'
  });

  const {
    data: resources,
    isLoading: resourcesLoading
  } = useQuery({
    queryKey: ['permissions', 'resources'],
    queryFn: () => api.getAvailableResources(),
    enabled: activeTab === 'policies'
  });

  const {
    data: actions,
    isLoading: actionsLoading
  } = useQuery({
    queryKey: ['permissions', 'actions'],
    queryFn: () => api.getAvailableActions(),
    enabled: activeTab === 'policies'
  });

  const {
    data: roleHierarchy,
    isLoading: hierarchyLoading
  } = useQuery({
    queryKey: ['permissions', 'hierarchy'],
    queryFn: () => api.getRoleHierarchy(),
    enabled: activeTab === 'hierarchy'
  });

  // Mutations
  const addPolicyMutation = useMutation({
    mutationFn: (data: any) => api.addPolicy(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions', 'policies'] });
      toast.success('Policy added successfully!');
    },
    onError: (error: any) => {
      console.error('Error adding policy:', error);
      toast.error('Failed to add policy. Please try again.');
    }
  });

  const removePolicyMutation = useMutation({
    mutationFn: (data: any) => api.removePolicy(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions', 'policies'] });
      toast.success('Policy removed successfully!');
    },
    onError: (error: any) => {
      console.error('Error removing policy:', error);
      toast.error('Failed to remove policy. Please try again.');
    }
  });

  // Filter policies
  const filteredPolicies = policies?.policies?.filter((policy: Policy) => {
    const matchesSearch = 
      policy.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.action.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || policy.role === filterRole;
    const matchesResourceType = filterResourceType === 'all' || policy.resource_type === filterResourceType;
    
    return matchesSearch && matchesRole && matchesResourceType;
  }) || [];

  const handleAddPolicy = (policyData: any) => {
    addPolicyMutation.mutate(policyData);
  };

  const handleRemovePolicy = (policyData: any) => {
    removePolicyMutation.mutate(policyData);
  };

  if (policiesError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Permissions Management</h1>
          <p className="text-gray-600">Manage RBAC + ABAC policies and user roles</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center text-red-600">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <span>Error loading permissions. Please try again.</span>
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
          <h1 className="text-2xl font-bold text-gray-900">Permissions Management</h1>
          <p className="text-gray-600">Manage RBAC + ABAC policies and user roles</p>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('policies')}
              className={`
                flex items-center py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'policies'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <Shield className="h-5 w-5 mr-2" />
              Policies
            </button>
            <button
              onClick={() => setActiveTab('hierarchy')}
              className={`
                flex items-center py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'hierarchy'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <Users className="h-5 w-5 mr-2" />
              Role Hierarchy
            </button>
            <button
              onClick={() => setActiveTab('test')}
              className={`
                flex items-center py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'test'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Test Permissions
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'policies' && (
            <PoliciesTab 
              policies={filteredPolicies}
              resources={resources}
              actions={actions}
              isLoading={policiesLoading}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filterRole={filterRole}
              setFilterRole={setFilterRole}
              filterResourceType={filterResourceType}
              setFilterResourceType={setFilterResourceType}
              onAddPolicy={handleAddPolicy}
              onRemovePolicy={handleRemovePolicy}
              isAdding={addPolicyMutation.isPending}
            />
          )}
          
          {activeTab === 'hierarchy' && (
            <HierarchyTab 
              hierarchy={roleHierarchy}
              isLoading={hierarchyLoading}
            />
          )}
          
          {activeTab === 'test' && (
            <TestPermissionsTab />
          )}
        </div>
      </div>
    </div>
  );
};

// Policies Tab Component
const PoliciesTab: React.FC<{
  policies: Policy[];
  resources: Resource;
  actions: Actions;
  isLoading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterRole: string;
  setFilterRole: (role: string) => void;
  filterResourceType: string;
  setFilterResourceType: (type: string) => void;
  onAddPolicy: (data: any) => void;
  onRemovePolicy: (data: any) => void;
  isAdding: boolean;
}> = ({ 
  policies, resources, actions, isLoading, 
  searchTerm, setSearchTerm, filterRole, setFilterRole,
  filterResourceType, setFilterResourceType,
  onAddPolicy, onRemovePolicy, isAdding 
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPolicy, setNewPolicy] = useState({
    role: '',
    resource_type: '',
    resource: '',
    action: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddPolicy(newPolicy);
    setNewPolicy({ role: '', resource_type: '', resource: '', action: '' });
    setShowAddForm(false);
  };

  const roles = ['admin', 'teacher', 'parent', 'security', 'student'];
  const resourceTypes = ['page', 'feature', 'api'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h3 className="text-lg font-medium text-gray-900">RBAC + ABAC Policies</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search policies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Roles</option>
            {roles.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
          <select
            value={filterResourceType}
            onChange={(e) => setFilterResourceType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Types</option>
            {resourceTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Policy
          </button>
        </div>
      </div>

      {/* Add Policy Form */}
      {showAddForm && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">Add New Policy</h4>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={newPolicy.role}
              onChange={(e) => setNewPolicy({ ...newPolicy, role: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select Role</option>
              {roles.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            
            <select
              value={newPolicy.resource_type}
              onChange={(e) => setNewPolicy({ ...newPolicy, resource_type: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select Type</option>
              {resourceTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            
            <select
              value={newPolicy.resource}
              onChange={(e) => setNewPolicy({ ...newPolicy, resource: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select Resource</option>
              {newPolicy.resource_type && resources && resources[newPolicy.resource_type]?.map((resource) => (
                <option key={resource} value={resource}>{resource}</option>
              ))}
            </select>
            
            <select
              value={newPolicy.action}
              onChange={(e) => setNewPolicy({ ...newPolicy, action: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select Action</option>
              {newPolicy.resource_type && actions && actions[newPolicy.resource_type]?.map((action) => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>
            
            <div className="md:col-span-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isAdding}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-75"
              >
                {isAdding ? 'Adding...' : 'Add Policy'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Policies Table */}
      <div className="overflow-x-auto rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Resource Type
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Resource
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {policies.map((policy, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {policy.role}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {policy.resource_type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {policy.resource}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {policy.action}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => onRemovePolicy(policy)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="h-4 w-4 inline mr-1" />
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {policies.length === 0 && (
          <div className="text-center py-8 bg-white">
            <p className="text-gray-500">No policies found</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Hierarchy Tab Component
const HierarchyTab: React.FC<{
  hierarchy: any;
  isLoading: boolean;
}> = ({ hierarchy, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Role Hierarchy</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hierarchy?.hierarchy && Object.entries(hierarchy.hierarchy).map(([role, subRoles]) => (
          <div key={role} className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-md font-medium text-gray-900 mb-3">{role}</h4>
            <div className="space-y-2">
              {Array.isArray(subRoles) && subRoles.length > 0 ? (
                subRoles.map((subRole: string) => (
                  <div key={subRole} className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    {subRole}
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500">No sub-roles</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Test Permissions Tab Component
const TestPermissionsTab: React.FC = () => {
  const [testData, setTestData] = useState({
    role: '',
    resource_type: '',
    resource: '',
    action: '',
    attributes: {}
  });
  const [testResult, setTestResult] = useState<any>(null);

  const testPermissionMutation = useMutation({
    mutationFn: (data: any) => api.testPermission(data),
    onSuccess: (data) => {
      setTestResult(data);
    },
    onError: (error: any) => {
      console.error('Error testing permission:', error);
      toast.error('Failed to test permission. Please try again.');
    }
  });

  const handleTest = (e: React.FormEvent) => {
    e.preventDefault();
    testPermissionMutation.mutate(testData);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Test Permissions</h3>
      
      <form onSubmit={handleTest} className="bg-gray-50 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <select
              value={testData.role}
              onChange={(e) => setTestData({ ...testData, role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select Role</option>
              <option value="admin">Admin</option>
              <option value="teacher">Teacher</option>
              <option value="parent">Parent</option>
              <option value="security">Security</option>
              <option value="student">Student</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Resource Type</label>
            <select
              value={testData.resource_type}
              onChange={(e) => setTestData({ ...testData, resource_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select Type</option>
              <option value="page">Page</option>
              <option value="feature">Feature</option>
              <option value="api">API</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Resource</label>
            <input
              type="text"
              value={testData.resource}
              onChange={(e) => setTestData({ ...testData, resource: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., settings, students, /api/v1/users/*"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
            <input
              type="text"
              value={testData.action}
              onChange={(e) => setTestData({ ...testData, action: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., read, write, GET"
              required
            />
          </div>
        </div>
        
        <div className="mt-4">
          <button
            type="submit"
            disabled={testPermissionMutation.isPending}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-75"
          >
            {testPermissionMutation.isPending ? 'Testing...' : 'Test Permission'}
          </button>
        </div>
      </form>

      {/* Test Result */}
      {testResult && (
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">Test Result</h4>
          <div className="flex items-center space-x-3">
            {testResult.has_permission ? (
              <CheckCircle className="h-6 w-6 text-green-500" />
            ) : (
              <XCircle className="h-6 w-6 text-red-500" />
            )}
            <span className={`text-lg font-medium ${
              testResult.has_permission ? 'text-green-600' : 'text-red-600'
            }`}>
              {testResult.has_permission ? 'Permission Granted' : 'Permission Denied'}
            </span>
          </div>
          <div className="mt-4">
            <h5 className="text-sm font-medium text-gray-700 mb-2">Test Data:</h5>
            <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
              {JSON.stringify(testResult.test_data, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionsManager;

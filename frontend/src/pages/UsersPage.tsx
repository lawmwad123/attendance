import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { 
  Users,
  UserPlus,
  Search,
  Filter,
  Shield,
  GraduationCap,
  Heart,
  ShieldCheck,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  AlertTriangle,
  X
} from 'lucide-react';
import type { CreateUserForm } from '../types';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: 'ADMIN' | 'TEACHER' | 'PARENT' | 'SECURITY' | 'STAFF';
  status: 'ACTIVE' | 'INACTIVE';
  phone?: string;
  created_at: string;
  last_login?: string;
  tenant_id: string;
}

const UsersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<CreateUserForm>({
    email: '',
    username: '',
    first_name: '',
    last_name: '',
    phone: '',
    role: 'TEACHER',
    employee_id: '',
    department: '',
    hire_date: '',
    password: ''
  });

  const queryClient = useQueryClient();

  // Fetch users from backend
  const { data: users, isLoading, error } = useQuery({
    queryKey: ['users', roleFilter, statusFilter],
    queryFn: async (): Promise<User[]> => {
      const filters: any = {};
      if (roleFilter !== 'all') filters.role = roleFilter;
      if (statusFilter !== 'all') filters.status = statusFilter;
      
      return await api.getUsers(filters);
    },
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: (userData: CreateUserForm) => api.createUser(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowAddModal(false);
      resetForm();
    },
    onError: (error: any) => {
      console.error('Error creating user:', error);
      alert(error.response?.data?.detail || 'Failed to create user');
    },
  });

  // Reset form function
  const resetForm = () => {
    setFormData({
      email: '',
      username: '',
      first_name: '',
      last_name: '',
      phone: '',
      role: 'TEACHER',
      employee_id: '',
      department: '',
      hire_date: '',
      password: ''
    });
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate(formData);
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Filter users based on search term
  const filteredUsers = users?.filter((user: User) => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  }) || [];

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Shield className="h-4 w-4 text-danger-600" />;
      case 'TEACHER':
        return <GraduationCap className="h-4 w-4 text-primary-600" />;
      case 'PARENT':
        return <Heart className="h-4 w-4 text-warning-600" />;
      case 'SECURITY':
        return <ShieldCheck className="h-4 w-4 text-success-600" />;
      case 'STAFF':
        return <Users className="h-4 w-4 text-secondary-600" />;
      default:
        return <Users className="h-4 w-4 text-secondary-400" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'badge-danger';
      case 'TEACHER':
        return 'badge-primary';
      case 'PARENT':
        return 'badge-warning';
      case 'SECURITY':
        return 'badge-success';
      case 'STAFF':
        return 'badge-secondary';
      default:
        return 'badge-secondary';
    }
  };

  const getStatusBadge = (status: string) => {
    return status === 'ACTIVE' ? 'badge-success' : 'badge-secondary';
  };

  // Calculate user counts by role
  const userCounts = {
    total: filteredUsers.length,
    admin: filteredUsers.filter((u: User) => u.role === 'ADMIN').length,
    teacher: filteredUsers.filter((u: User) => u.role === 'TEACHER').length,
    parent: filteredUsers.filter((u: User) => u.role === 'PARENT').length,
    security: filteredUsers.filter((u: User) => u.role === 'SECURITY').length,
    staff: filteredUsers.filter((u: User) => u.role === 'STAFF').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">User Management</h1>
          <p className="text-secondary-600">Manage system users and their roles</p>
        </div>
        <div className="flex gap-3">
          <button 
            className="btn-primary flex items-center"
            onClick={() => setShowAddModal(true)}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </button>
        </div>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="card p-4">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Users className="h-5 w-5 text-primary-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-secondary-600">Total</p>
              <p className="text-xl font-bold text-secondary-900">{userCounts.total}</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center">
            <div className="p-2 bg-danger-100 rounded-lg">
              <Shield className="h-5 w-5 text-danger-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-secondary-600">Admins</p>
              <p className="text-xl font-bold text-danger-600">{userCounts.admin}</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <GraduationCap className="h-5 w-5 text-primary-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-secondary-600">Teachers</p>
              <p className="text-xl font-bold text-primary-600">{userCounts.teacher}</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center">
            <div className="p-2 bg-warning-100 rounded-lg">
              <Heart className="h-5 w-5 text-warning-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-secondary-600">Parents</p>
              <p className="text-xl font-bold text-warning-600">{userCounts.parent}</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center">
            <div className="p-2 bg-success-100 rounded-lg">
              <ShieldCheck className="h-5 w-5 text-success-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-secondary-600">Security</p>
              <p className="text-xl font-bold text-success-600">{userCounts.security}</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center">
            <div className="p-2 bg-secondary-100 rounded-lg">
              <Users className="h-5 w-5 text-secondary-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-secondary-600">Staff</p>
              <p className="text-xl font-bold text-secondary-900">{userCounts.staff}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">Search Users</label>
            <div className="relative">
              <Search className="h-5 w-5 absolute left-3 top-3 text-secondary-400" />
              <input
                type="text"
                placeholder="Search by name, email, or username..."
                className="input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <label className="label">Role</label>
            <div className="relative">
              <Filter className="h-5 w-5 absolute left-3 top-3 text-secondary-400" />
              <select
                className="input pl-10"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="teacher">Teacher</option>
                <option value="parent">Parent</option>
                <option value="security">Security</option>
                <option value="staff">Staff</option>
              </select>
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
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="p-6 border-b border-secondary-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-secondary-900">System Users</h2>
            <button className="btn-ghost flex items-center">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-secondary-600 mt-2">Loading users...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <div className="flex items-center justify-center text-danger-600 mb-4">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <span>Error loading users data: {(error as Error).message}</span>
            </div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-6 text-center">
            <Users className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-secondary-900 mb-2">No users found</h3>
            <p className="text-secondary-600">
              {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'No users available in the system.'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {filteredUsers.map((user: User) => (
                  <tr key={user.id} className="hover:bg-secondary-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-secondary-900">
                          {user.full_name}
                        </div>
                        <div className="text-sm text-secondary-500">
                          @{user.username}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getRoleIcon(user.role)}
                        <span className={`badge ${getRoleBadge(user.role)} ml-2`}>
                          {user.role}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`badge ${getStatusBadge(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-secondary-900">
                        <div>{user.email}</div>
                        {user.phone && (
                          <div className="text-secondary-500">{user.phone}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-secondary-900">
                        {user.last_login ? (
                          new Date(user.last_login).toLocaleDateString()
                        ) : (
                          <span className="text-secondary-400">Never</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          className="text-primary-600 hover:text-primary-900"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          className="text-secondary-600 hover:text-secondary-900"
                          title="Edit User"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          className="text-danger-600 hover:text-danger-900"
                          title="Delete User"
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

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-secondary-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-secondary-900">Add New User</h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="text-secondary-400 hover:text-secondary-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">First Name *</label>
                  <input
                    type="text"
                    name="first_name"
                    className="input"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <label className="label">Last Name *</label>
                  <input
                    type="text"
                    name="last_name"
                    className="input"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Email *</label>
                  <input
                    type="email"
                    name="email"
                    className="input"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <label className="label">Username</label>
                  <input
                    type="text"
                    name="username"
                    className="input"
                    value={formData.username}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    className="input"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label className="label">Role *</label>
                  <select
                    name="role"
                    className="input"
                    value={formData.role}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="TEACHER">Teacher</option>
                    <option value="ADMIN">Admin</option>
                    <option value="PARENT">Parent</option>
                    <option value="SECURITY">Security</option>
                    <option value="STAFF">Staff</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Employee ID</label>
                  <input
                    type="text"
                    name="employee_id"
                    className="input"
                    value={formData.employee_id}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label className="label">Department</label>
                  <input
                    type="text"
                    name="department"
                    className="input"
                    value={formData.department}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Hire Date</label>
                  <input
                    type="date"
                    name="hire_date"
                    className="input"
                    value={formData.hire_date}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label className="label">Password *</label>
                  <input
                    type="password"
                    name="password"
                    className="input"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    minLength={8}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={createUserMutation.isPending}
                >
                  {createUserMutation.isPending ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage; 
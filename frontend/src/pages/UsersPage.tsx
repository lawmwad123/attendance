import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  AlertTriangle
} from 'lucide-react';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: 'admin' | 'teacher' | 'parent' | 'security' | 'staff';
  status: 'active' | 'inactive';
  phone?: string;
  created_at: string;
  last_login?: string;
  tenant_id: string;
}

const UsersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

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
      case 'admin':
        return <Shield className="h-4 w-4 text-danger-600" />;
      case 'teacher':
        return <GraduationCap className="h-4 w-4 text-primary-600" />;
      case 'parent':
        return <Heart className="h-4 w-4 text-warning-600" />;
      case 'security':
        return <ShieldCheck className="h-4 w-4 text-success-600" />;
      case 'staff':
        return <Users className="h-4 w-4 text-secondary-600" />;
      default:
        return <Users className="h-4 w-4 text-secondary-400" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return 'badge-danger';
      case 'teacher':
        return 'badge-primary';
      case 'parent':
        return 'badge-warning';
      case 'security':
        return 'badge-success';
      case 'staff':
        return 'badge-secondary';
      default:
        return 'badge-secondary';
    }
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' ? 'badge-success' : 'badge-secondary';
  };

  // Calculate user counts by role
  const userCounts = {
    total: filteredUsers.length,
    admin: filteredUsers.filter((u: User) => u.role === 'admin').length,
    teacher: filteredUsers.filter((u: User) => u.role === 'teacher').length,
    parent: filteredUsers.filter((u: User) => u.role === 'parent').length,
    security: filteredUsers.filter((u: User) => u.role === 'security').length,
    staff: filteredUsers.filter((u: User) => u.role === 'staff').length,
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
          <button className="btn-primary flex items-center">
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
    </div>
  );
};

export default UsersPage; 
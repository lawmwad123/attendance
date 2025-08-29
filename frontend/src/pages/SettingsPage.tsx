import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '../lib/api';
import { 
  Settings, 
  School, 
  Clock, 
  Shield, 
  Bell, 
  Fingerprint, 
  Users, 
  BookOpen, 
  Monitor,
  Save,
  AlertCircle,
  CheckCircle,
  Plus,
  Edit3,
  Trash2,
  Search,
  Filter,
  MoreVertical,
  UserCheck
} from 'lucide-react';

interface Tab {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
}

const tabs: Tab[] = [
  {
    id: 'general',
    name: 'General',
    icon: <School className="h-5 w-5" />,
    description: 'School information and basic settings'
  },
  {
    id: 'attendance',
    name: 'Attendance',
    icon: <Clock className="h-5 w-5" />,
    description: 'Attendance marking and timing settings'
  },
  {
    id: 'staff-attendance',
    name: 'Staff Attendance',
    icon: <UserCheck className="h-5 w-5" />,
    description: 'Staff attendance and leave management settings'
  },
  {
    id: 'gate-pass',
    name: 'Gate Pass',
    icon: <Shield className="h-5 w-5" />,
    description: 'Gate pass approval and exit settings'
  },
  {
    id: 'notifications',
    name: 'Notifications',
    icon: <Bell className="h-5 w-5" />,
    description: 'Notification preferences and channels'
  },
  {
    id: 'biometric',
    name: 'Biometric',
    icon: <Fingerprint className="h-5 w-5" />,
    description: 'Biometric and card settings'
  },
  {
    id: 'classes',
    name: 'Classes',
    icon: <Users className="h-5 w-5" />,
    description: 'Class levels and sections management'
  },
  {
    id: 'subjects',
    name: 'Subjects',
    icon: <BookOpen className="h-5 w-5" />,
    description: 'Subject management'
  },
  {
    id: 'devices',
    name: 'Devices',
    icon: <Monitor className="h-5 w-5" />,
    description: 'Biometric devices and RFID readers'
  }
];

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();

  // Fetch settings data
  const {
    data: settings,
    isLoading: settingsLoading,
    error: settingsError
  } = useQuery({
    queryKey: ['settingsSummary'],
    queryFn: () => api.getSettingsSummary(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch additional data for specific tabs
  const {
    data: classLevels,
    isLoading: classLevelsLoading
  } = useQuery({
    queryKey: ['classLevels'],
    queryFn: () => api.getClassLevels(),
    enabled: activeTab === 'classes'
  });

  const {
    data: subjects,
    isLoading: subjectsLoading
  } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => api.getSubjects(),
    enabled: activeTab === 'subjects'
  });

  const {
    data: devices,
    isLoading: devicesLoading
  } = useQuery({
    queryKey: ['devices'],
    queryFn: () => api.getDevices(),
    enabled: activeTab === 'devices'
  });

  // Fetch enum options
  const {
    data: attendanceModes
  } = useQuery({
    queryKey: ['attendanceModes'],
    queryFn: () => api.getAttendanceModes(),
    enabled: activeTab === 'attendance'
  });

  const {
    data: biometricTypes
  } = useQuery({
    queryKey: ['biometricTypes'],
    queryFn: () => api.getBiometricTypes(),
    enabled: activeTab === 'biometric'
  });

  const {
    data: notificationChannels
  } = useQuery({
    queryKey: ['notificationChannels'],
    queryFn: () => api.getNotificationChannels(),
    enabled: activeTab === 'notifications'
  });

  const {
    data: gatePassWorkflows
  } = useQuery({
    queryKey: ['gatePassWorkflows'],
    queryFn: () => api.getGatePassWorkflows(),
    enabled: activeTab === 'gate-pass'
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (data: any) => {
      console.log('Sending data to API:', data);
      return api.updateSchoolSettings(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settingsSummary'] });
      toast.success('Settings saved successfully!');
    },
    onError: (error: any) => {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings. Please try again.');
    }
  });

  const handleSave = async (data: any) => {
    setIsSaving(true);
    try {
      await updateSettingsMutation.mutateAsync(data);
    } finally {
      setIsSaving(false);
    }
  };

  if (settingsError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Configure school and system settings</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center text-red-600">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>Error loading settings. Please try again.</span>
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
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Configure school and system settings</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Status messages now handled by toast notifications */}
        </div>
      </div>
      
      {/* Settings Overview */}
      {settings && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-blue-50 mr-3">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Classes</p>
                <p className="text-xl font-bold text-gray-900">{settings.total_classes}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-green-50 mr-3">
                <BookOpen className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Subjects</p>
                <p className="text-xl font-bold text-gray-900">{settings.total_subjects}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-yellow-50 mr-3">
                <Monitor className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Devices</p>
                <p className="text-xl font-bold text-gray-900">{settings.total_devices}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-purple-50 mr-3">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Attendance Mode</p>
                <p className="text-xl font-bold text-gray-900">{settings.attendance.default_attendance_mode}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-indigo-500">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-indigo-50 mr-3">
                <UserCheck className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Staff Attendance</p>
                <p className="text-xl font-bold text-gray-900">
                  {settings.staff_attendance?.staff_attendance_reports_enabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <span className={`mr-2 p-1 rounded-md ${activeTab === tab.id ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  {tab.icon}
                </span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {settingsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div>
              {/* Tab Content */}
              {activeTab === 'general' && settings && (
                <GeneralSettingsTab 
                  settings={settings.general} 
                  onSave={handleSave}
                  isSaving={isSaving}
                />
              )}
              
              {activeTab === 'attendance' && settings && attendanceModes && (
                <AttendanceSettingsTab 
                  settings={settings.attendance}
                  attendanceModes={attendanceModes}
                  onSave={handleSave}
                  isSaving={isSaving}
                />
              )}
              
              {activeTab === 'staff-attendance' && settings && (
                <StaffAttendanceSettingsTab 
                  settings={settings.staff_attendance || {}}
                  onSave={handleSave}
                  isSaving={isSaving}
                />
              )}
              
              {activeTab === 'gate-pass' && settings && gatePassWorkflows && (
                <GatePassSettingsTab 
                  settings={settings.gate_pass}
                  gatePassWorkflows={gatePassWorkflows}
                  onSave={handleSave}
                  isSaving={isSaving}
                />
              )}
              
              {activeTab === 'notifications' && settings && notificationChannels && (
                <NotificationSettingsTab 
                  settings={settings.notifications}
                  notificationChannels={notificationChannels}
                  onSave={handleSave}
                  isSaving={isSaving}
                />
              )}
              
              {activeTab === 'biometric' && settings && biometricTypes && (
                <BiometricSettingsTab 
                  settings={settings.biometric}
                  biometricTypes={biometricTypes}
                  onSave={handleSave}
                  isSaving={isSaving}
                />
              )}
              
              {activeTab === 'classes' && classLevels && (
                <ClassesSettingsTab 
                  classLevels={classLevels}
                  isLoading={classLevelsLoading}
                />
              )}
              
              {activeTab === 'subjects' && subjects && (
                <SubjectsSettingsTab 
                  subjects={subjects}
                  isLoading={subjectsLoading}
                />
              )}
              
              {activeTab === 'devices' && devices && (
                <DevicesSettingsTab 
                  devices={devices}
                  isLoading={devicesLoading}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Tab Components
const GeneralSettingsTab: React.FC<{
  settings: any;
  onSave: (data: any) => void;
  isSaving: boolean;
}> = ({ settings, onSave, isSaving }) => {
  const [formData, setFormData] = useState(settings);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">General School Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              School Name
            </label>
            <input
              type="text"
              value={formData.school_name}
              onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              School Motto
            </label>
            <input
              type="text"
              value={formData.school_motto || ''}
              onChange={(e) => setFormData({ ...formData, school_motto: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              School Email
            </label>
            <input
              type="email"
              value={formData.school_email || ''}
              onChange={(e) => setFormData({ ...formData, school_email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              School Phone
            </label>
            <input
              type="tel"
              value={formData.school_phone || ''}
              onChange={(e) => setFormData({ ...formData, school_phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              School Address
            </label>
            <textarea
              value={formData.school_address || ''}
              onChange={(e) => setFormData({ ...formData, school_address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              School Website
            </label>
            <input
              type="url"
              value={formData.school_website || ''}
              onChange={(e) => setFormData({ ...formData, school_website: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timezone
            </label>
            <select
              value={formData.timezone}
              onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-75"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </form>
  );
};

// Attendance Settings Tab
const AttendanceSettingsTab: React.FC<{
  settings: any;
  attendanceModes: string[];
  onSave: (data: any) => void;
  isSaving: boolean;
}> = ({ settings, attendanceModes, onSave, isSaving }) => {
  const [formData, setFormData] = useState(settings);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Attendance Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Attendance Mode
            </label>
            <select
              value={formData.default_attendance_mode}
              onChange={(e) => setFormData({ ...formData, default_attendance_mode: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {attendanceModes.map((mode) => (
                <option key={mode} value={mode}>{mode}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Morning Attendance Start
            </label>
            <input
              type="time"
              value={formData.morning_attendance_start || ''}
              onChange={(e) => setFormData({ ...formData, morning_attendance_start: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Morning Attendance End
            </label>
            <input
              type="time"
              value={formData.morning_attendance_end || ''}
              onChange={(e) => setFormData({ ...formData, morning_attendance_end: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Late Arrival Threshold
            </label>
            <input
              type="time"
              value={formData.late_arrival_threshold || ''}
              onChange={(e) => setFormData({ ...formData, late_arrival_threshold: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>
      
      <div className="flex justify-end pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-75"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </form>
  );
};

// Gate Pass Settings Tab
const GatePassSettingsTab: React.FC<{
  settings: any;
  gatePassWorkflows: string[];
  onSave: (data: any) => void;
  isSaving: boolean;
}> = ({ settings, gatePassWorkflows, onSave, isSaving }) => {
  const [formData, setFormData] = useState(settings);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Gate Pass Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Approval Workflow
            </label>
            <select
              value={formData.gate_pass_approval_workflow}
              onChange={(e) => setFormData({ ...formData, gate_pass_approval_workflow: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {gatePassWorkflows.map((workflow) => (
                <option key={workflow} value={workflow}>{workflow}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Auto Expiry (Hours)
            </label>
            <input
              type="number"
              value={formData.gate_pass_auto_expiry_hours}
              onChange={(e) => setFormData({ ...formData, gate_pass_auto_expiry_hours: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              min="1"
              max="72"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Allowed Exit Start Time
            </label>
            <input
              type="time"
              value={formData.allowed_exit_start_time || ''}
              onChange={(e) => setFormData({ ...formData, allowed_exit_start_time: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Allowed Exit End Time
            </label>
            <input
              type="time"
              value={formData.allowed_exit_end_time || ''}
              onChange={(e) => setFormData({ ...formData, allowed_exit_end_time: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>
      
      <div className="flex justify-end pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-75"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </form>
  );
};

// Notification Settings Tab
const NotificationSettingsTab: React.FC<{
  settings: any;
  notificationChannels: string[];
  onSave: (data: any) => void;
  isSaving: boolean;
}> = ({ settings, notificationChannels, onSave, isSaving }) => {
  const [formData, setFormData] = useState(settings);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Settings</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notification Channels
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              {notificationChannels.map((channel) => (
                <label key={channel} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.notification_channels?.includes(channel) || false}
                    onChange={(e) => {
                      const channels = formData.notification_channels || [];
                      if (e.target.checked) {
                        setFormData({ ...formData, notification_channels: [...channels, channel] });
                      } else {
                        setFormData({ ...formData, notification_channels: channels.filter((c: string) => c !== channel) });
                      }
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{channel}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center p-3 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                checked={formData.parent_notification_on_entry}
                onChange={(e) => setFormData({ ...formData, parent_notification_on_entry: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Notify parents on entry</span>
            </label>
            
            <label className="flex items-center p-3 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                checked={formData.parent_notification_on_exit}
                onChange={(e) => setFormData({ ...formData, parent_notification_on_exit: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Notify parents on exit</span>
            </label>
            
            <label className="flex items-center p-3 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                checked={formData.parent_notification_late_arrival}
                onChange={(e) => setFormData({ ...formData, parent_notification_late_arrival: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Notify parents on late arrival</span>
            </label>
            
            <label className="flex items-center p-3 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                checked={formData.teacher_notification_absentees}
                onChange={(e) => setFormData({ ...formData, teacher_notification_absentees: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Notify teachers of absentees</span>
            </label>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-75"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </form>
  );
};

// Biometric Settings Tab
const BiometricSettingsTab: React.FC<{
  settings: any;
  biometricTypes: string[];
  onSave: (data: any) => void;
  isSaving: boolean;
}> = ({ settings, biometricTypes, onSave, isSaving }) => {
  const [formData, setFormData] = useState(settings);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Biometric Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Biometric Type
            </label>
            <select
              value={formData.biometric_type || ''}
              onChange={(e) => setFormData({ ...formData, biometric_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select type</option>
              {biometricTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enrollment Fingers
            </label>
            <input
              type="number"
              value={formData.biometric_enrollment_fingers}
              onChange={(e) => setFormData({ ...formData, biometric_enrollment_fingers: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              min="1"
              max="10"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Retry Attempts
            </label>
            <input
              type="number"
              value={formData.biometric_retry_attempts}
              onChange={(e) => setFormData({ ...formData, biometric_retry_attempts: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              min="1"
              max="10"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              RFID Card Format
            </label>
            <input
              type="text"
              value={formData.rfid_card_format || ''}
              onChange={(e) => setFormData({ ...formData, rfid_card_format: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., ISO14443A"
            />
          </div>
        </div>
      </div>
      
      <div className="flex justify-end pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-75"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </form>
  );
};

// Classes Settings Tab
const ClassesSettingsTab: React.FC<{
  classLevels: any[];
  isLoading: boolean;
}> = ({ classLevels, isLoading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const filteredClassLevels = classLevels.filter(level => {
    const matchesSearch = level.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         level.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterActive === 'all' || 
                         (filterActive === 'active' && level.is_active) || 
                         (filterActive === 'inactive' && !level.is_active);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h3 className="text-lg font-medium text-gray-900">Class Levels</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search classes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value as 'all' | 'active' | 'inactive')}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <Plus className="h-4 w-4 mr-2" />
            Add Class Level
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Code
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredClassLevels.map((level) => (
              <tr key={level.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {level.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {level.code}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {level.order}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    level.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {level.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-blue-600 hover:text-blue-900 mr-3">
                    <Edit3 className="h-4 w-4 inline mr-1" />
                    Edit
                  </button>
                  <button className="text-red-600 hover:text-red-900">
                    <Trash2 className="h-4 w-4 inline mr-1" />
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredClassLevels.length === 0 && (
          <div className="text-center py-8 bg-white">
            <p className="text-gray-500">No class levels found</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Subjects Settings Tab
const SubjectsSettingsTab: React.FC<{
  subjects: any[];
  isLoading: boolean;
}> = ({ subjects, isLoading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'core' | 'elective'>('all');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const filteredSubjects = subjects.filter(subject => {
    const matchesSearch = subject.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         subject.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'core' && subject.is_core) || 
                         (filterType === 'elective' && !subject.is_core);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h3 className="text-lg font-medium text-gray-900">Subjects</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search subjects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'all' | 'core' | 'elective')}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Types</option>
            <option value="core">Core</option>
            <option value="elective">Elective</option>
          </select>
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <Plus className="h-4 w-4 mr-2" />
            Add Subject
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Code
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredSubjects.map((subject) => (
              <tr key={subject.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {subject.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {subject.code}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    subject.is_core 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {subject.is_core ? 'Core' : 'Elective'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    subject.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {subject.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-blue-600 hover:text-blue-900 mr-3">
                    <Edit3 className="h-4 w-4 inline mr-1" />
                    Edit
                  </button>
                  <button className="text-red-600 hover:text-red-900">
                    <Trash2 className="h-4 w-4 inline mr-1" />
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredSubjects.length === 0 && (
          <div className="text-center py-8 bg-white">
            <p className="text-gray-500">No subjects found</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Devices Settings Tab
const DevicesSettingsTab: React.FC<{
  devices: any[];
  isLoading: boolean;
}> = ({ devices, isLoading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const filteredDevices = devices.filter(device => {
    const matchesSearch = device.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         device.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'active' && device.is_active) || 
                         (filterStatus === 'inactive' && !device.is_active);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h3 className="text-lg font-medium text-gray-900">Devices</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search devices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <Plus className="h-4 w-4 mr-2" />
            Add Device
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Sync
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredDevices.map((device) => (
              <tr key={device.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {device.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {device.device_type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {device.location}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    device.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {device.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {device.last_sync ? new Date(device.last_sync).toLocaleString() : 'Never'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-blue-600 hover:text-blue-900 mr-3">
                    <Edit3 className="h-4 w-4 inline mr-1" />
                    Edit
                  </button>
                  <button className="text-red-600 hover:text-red-900">
                    <Trash2 className="h-4 w-4 inline mr-1" />
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredDevices.length === 0 && (
          <div className="text-center py-8 bg-white">
            <p className="text-gray-500">No devices found</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Staff Attendance Settings Tab
const StaffAttendanceSettingsTab: React.FC<{
  settings: any;
  onSave: (data: any) => void;
  isSaving: boolean;
}> = ({ settings, onSave, isSaving }) => {
  const [formData, setFormData] = useState({
    staff_clock_in_start_time: settings?.staff_clock_in_start_time || '08:00',
    staff_clock_in_end_time: settings?.staff_clock_in_end_time || '09:00',
    staff_clock_out_start_time: settings?.staff_clock_out_start_time || '16:00',
    staff_clock_out_end_time: settings?.staff_clock_out_end_time || '17:00',
    staff_late_threshold_minutes: settings?.staff_late_threshold_minutes || 15,
    staff_overtime_threshold_hours: settings?.staff_overtime_threshold_hours || 8,
    staff_auto_mark_absent_hours: settings?.staff_auto_mark_absent_hours || 2,
    staff_attendance_methods: settings?.staff_attendance_methods || ['web_portal', 'biometric', 'rfid'],
    staff_leave_approval_workflow: settings?.staff_leave_approval_workflow || 'admin_only',
    staff_leave_auto_approve_hours: settings?.staff_leave_auto_approve_hours || 24,
    staff_leave_types: settings?.staff_leave_types || ['personal_leave', 'sick_leave', 'annual_leave', 'emergency_leave'],
    staff_work_days: settings?.staff_work_days || [1, 2, 3, 4, 5], // Monday to Friday
    staff_holiday_calendar_enabled: settings?.staff_holiday_calendar_enabled || false,
    staff_attendance_reports_enabled: settings?.staff_attendance_reports_enabled || true,
    staff_attendance_notifications_enabled: settings?.staff_attendance_notifications_enabled || true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting staff attendance settings:', formData);
    onSave(formData);
  };

  const workDays = [
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
    { value: 0, label: 'Sunday' }
  ];

  const attendanceMethods = [
    { value: 'web_portal', label: 'Web Portal' },
    { value: 'biometric', label: 'Biometric Scanner' },
    { value: 'rfid', label: 'RFID Card' },
    { value: 'qr_code', label: 'QR Code' },
    { value: 'mobile_app', label: 'Mobile App' }
  ];

  const leaveTypes = [
    { value: 'personal_leave', label: 'Personal Leave' },
    { value: 'sick_leave', label: 'Sick Leave' },
    { value: 'annual_leave', label: 'Annual Leave' },
    { value: 'emergency_leave', label: 'Emergency Leave' },
    { value: 'maternity_leave', label: 'Maternity Leave' },
    { value: 'paternity_leave', label: 'Paternity Leave' },
    { value: 'study_leave', label: 'Study Leave' }
  ];

  const approvalWorkflows = [
    { value: 'admin_only', label: 'Admin Only' },
    { value: 'admin_and_hr', label: 'Admin + HR' },
    { value: 'immediate_supervisor', label: 'Immediate Supervisor' },
    { value: 'auto_approve', label: 'Auto Approve' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Staff Attendance Settings</h3>
        
        {/* Clock In/Out Times */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-800 mb-3">Clock In/Out Times</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Clock In Start Time
              </label>
              <input
                type="time"
                value={formData.staff_clock_in_start_time}
                onChange={(e) => setFormData({ ...formData, staff_clock_in_start_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Clock In End Time
              </label>
              <input
                type="time"
                value={formData.staff_clock_in_end_time}
                onChange={(e) => setFormData({ ...formData, staff_clock_in_end_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Clock Out Start Time
              </label>
              <input
                type="time"
                value={formData.staff_clock_out_start_time}
                onChange={(e) => setFormData({ ...formData, staff_clock_out_start_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Clock Out End Time
              </label>
              <input
                type="time"
                value={formData.staff_clock_out_end_time}
                onChange={(e) => setFormData({ ...formData, staff_clock_out_end_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Thresholds */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-800 mb-3">Thresholds</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Late Threshold (Minutes)
              </label>
              <input
                type="number"
                value={formData.staff_late_threshold_minutes}
                onChange={(e) => setFormData({ ...formData, staff_late_threshold_minutes: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                min="1"
                max="60"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Overtime Threshold (Hours)
              </label>
              <input
                type="number"
                value={formData.staff_overtime_threshold_hours}
                onChange={(e) => setFormData({ ...formData, staff_overtime_threshold_hours: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                min="6"
                max="12"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Auto Mark Absent (Hours)
              </label>
              <input
                type="number"
                value={formData.staff_auto_mark_absent_hours}
                onChange={(e) => setFormData({ ...formData, staff_auto_mark_absent_hours: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                min="1"
                max="8"
              />
            </div>
          </div>
        </div>

        {/* Attendance Methods */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-800 mb-3">Attendance Methods</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            {attendanceMethods.map((method) => (
              <label key={method.value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.staff_attendance_methods.includes(method.value)}
                  onChange={(e) => {
                    const methods = formData.staff_attendance_methods;
                    if (e.target.checked) {
                      setFormData({ ...formData, staff_attendance_methods: [...methods, method.value] });
                    } else {
                      setFormData({ ...formData, staff_attendance_methods: methods.filter((m: string) => m !== method.value) });
                    }
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">{method.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Work Days */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-800 mb-3">Work Days</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            {workDays.map((day) => (
              <label key={day.value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.staff_work_days.includes(day.value)}
                  onChange={(e) => {
                    const days = formData.staff_work_days;
                    if (e.target.checked) {
                      setFormData({ ...formData, staff_work_days: [...days, day.value] });
                    } else {
                      setFormData({ ...formData, staff_work_days: days.filter((d: number) => d !== day.value) });
                    }
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">{day.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Leave Management */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-800 mb-3">Leave Management</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Leave Approval Workflow
              </label>
              <select
                value={formData.staff_leave_approval_workflow}
                onChange={(e) => setFormData({ ...formData, staff_leave_approval_workflow: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {approvalWorkflows.map((workflow) => (
                  <option key={workflow.value} value={workflow.value}>{workflow.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Auto Approve After (Hours)
              </label>
              <input
                type="number"
                value={formData.staff_leave_auto_approve_hours}
                onChange={(e) => setFormData({ ...formData, staff_leave_auto_approve_hours: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                min="1"
                max="72"
              />
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Leave Types
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              {leaveTypes.map((type) => (
                <label key={type.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.staff_leave_types.includes(type.value)}
                    onChange={(e) => {
                      const types = formData.staff_leave_types;
                      if (e.target.checked) {
                        setFormData({ ...formData, staff_leave_types: [...types, type.value] });
                      } else {
                        setFormData({ ...formData, staff_leave_types: types.filter((t: string) => t !== type.value) });
                      }
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{type.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-800 mb-3">Features</h4>
          <div className="space-y-4">
            <label className="flex items-center p-3 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                checked={formData.staff_holiday_calendar_enabled}
                onChange={(e) => setFormData({ ...formData, staff_holiday_calendar_enabled: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Enable holiday calendar integration</span>
            </label>
            
            <label className="flex items-center p-3 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                checked={formData.staff_attendance_reports_enabled}
                onChange={(e) => setFormData({ ...formData, staff_attendance_reports_enabled: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Enable attendance reports</span>
            </label>
            
            <label className="flex items-center p-3 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                checked={formData.staff_attendance_notifications_enabled}
                onChange={(e) => setFormData({ ...formData, staff_attendance_notifications_enabled: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Enable attendance notifications</span>
            </label>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-75"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default SettingsPage;
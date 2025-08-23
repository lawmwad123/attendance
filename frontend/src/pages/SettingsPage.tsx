import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  Plus
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
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
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
    mutationFn: (data: any) => api.updateSchoolSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settingsSummary'] });
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    },
    onError: () => {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
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
          <h1 className="text-2xl font-bold text-secondary-900">Settings</h1>
          <p className="text-secondary-600">Configure school and system settings</p>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center text-danger-600">
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
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Settings</h1>
        <p className="text-secondary-600">Configure school and system settings</p>
      </div>

      {/* Save Status */}
      {saveStatus === 'success' && (
        <div className="card p-4 bg-success-50 border-success-200">
          <div className="flex items-center text-success-600">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span>Settings saved successfully!</span>
          </div>
        </div>
      )}

      {saveStatus === 'error' && (
        <div className="card p-4 bg-danger-50 border-danger-200">
          <div className="flex items-center text-danger-600">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>Error saving settings. Please try again.</span>
          </div>
        </div>
      )}

      {/* Settings Overview */}
      {settings && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-primary-600 mr-3" />
              <div>
                <p className="text-sm text-secondary-600">Classes</p>
                <p className="text-xl font-bold text-secondary-900">{settings.total_classes}</p>
              </div>
            </div>
          </div>
          
          <div className="card p-4">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-success-600 mr-3" />
              <div>
                <p className="text-sm text-secondary-600">Subjects</p>
                <p className="text-xl font-bold text-secondary-900">{settings.total_subjects}</p>
              </div>
            </div>
          </div>
          
          <div className="card p-4">
            <div className="flex items-center">
              <Monitor className="h-8 w-8 text-warning-600 mr-3" />
              <div>
                <p className="text-sm text-secondary-600">Devices</p>
                <p className="text-xl font-bold text-secondary-900">{settings.total_devices}</p>
              </div>
            </div>
          </div>
          
          <div className="card p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-info-600 mr-3" />
              <div>
                <p className="text-sm text-secondary-600">Attendance Mode</p>
                <p className="text-xl font-bold text-secondary-900">{settings.attendance.default_attendance_mode}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="card">
        <div className="border-b border-secondary-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                  }
                `}
              >
                {tab.icon}
                <span className="ml-2">{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {settingsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
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
        <h3 className="text-lg font-medium text-secondary-900 mb-4">General School Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              School Name
            </label>
            <input
              type="text"
              value={formData.school_name}
              onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
              className="form-input w-full"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              School Motto
            </label>
            <input
              type="text"
              value={formData.school_motto || ''}
              onChange={(e) => setFormData({ ...formData, school_motto: e.target.value })}
              className="form-input w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              School Email
            </label>
            <input
              type="email"
              value={formData.school_email || ''}
              onChange={(e) => setFormData({ ...formData, school_email: e.target.value })}
              className="form-input w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              School Phone
            </label>
            <input
              type="tel"
              value={formData.school_phone || ''}
              onChange={(e) => setFormData({ ...formData, school_phone: e.target.value })}
              className="form-input w-full"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              School Address
            </label>
            <textarea
              value={formData.school_address || ''}
              onChange={(e) => setFormData({ ...formData, school_address: e.target.value })}
              className="form-textarea w-full"
              rows={3}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              School Website
            </label>
            <input
              type="url"
              value={formData.school_website || ''}
              onChange={(e) => setFormData({ ...formData, school_website: e.target.value })}
              className="form-input w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Timezone
            </label>
            <select
              value={formData.timezone}
              onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              className="form-select w-full"
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
      
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="btn-primary flex items-center"
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
        <h3 className="text-lg font-medium text-secondary-900 mb-4">Attendance Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Default Attendance Mode
            </label>
            <select
              value={formData.default_attendance_mode}
              onChange={(e) => setFormData({ ...formData, default_attendance_mode: e.target.value })}
              className="form-select w-full"
            >
              {attendanceModes.map((mode) => (
                <option key={mode} value={mode}>{mode}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Morning Attendance Start
            </label>
            <input
              type="time"
              value={formData.morning_attendance_start || ''}
              onChange={(e) => setFormData({ ...formData, morning_attendance_start: e.target.value })}
              className="form-input w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Morning Attendance End
            </label>
            <input
              type="time"
              value={formData.morning_attendance_end || ''}
              onChange={(e) => setFormData({ ...formData, morning_attendance_end: e.target.value })}
              className="form-input w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Late Arrival Threshold
            </label>
            <input
              type="time"
              value={formData.late_arrival_threshold || ''}
              onChange={(e) => setFormData({ ...formData, late_arrival_threshold: e.target.value })}
              className="form-input w-full"
            />
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="btn-primary flex items-center"
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
        <h3 className="text-lg font-medium text-secondary-900 mb-4">Gate Pass Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Approval Workflow
            </label>
            <select
              value={formData.gate_pass_approval_workflow}
              onChange={(e) => setFormData({ ...formData, gate_pass_approval_workflow: e.target.value })}
              className="form-select w-full"
            >
              {gatePassWorkflows.map((workflow) => (
                <option key={workflow} value={workflow}>{workflow}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Auto Expiry (Hours)
            </label>
            <input
              type="number"
              value={formData.gate_pass_auto_expiry_hours}
              onChange={(e) => setFormData({ ...formData, gate_pass_auto_expiry_hours: parseInt(e.target.value) })}
              className="form-input w-full"
              min="1"
              max="72"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Allowed Exit Start Time
            </label>
            <input
              type="time"
              value={formData.allowed_exit_start_time || ''}
              onChange={(e) => setFormData({ ...formData, allowed_exit_start_time: e.target.value })}
              className="form-input w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Allowed Exit End Time
            </label>
            <input
              type="time"
              value={formData.allowed_exit_end_time || ''}
              onChange={(e) => setFormData({ ...formData, allowed_exit_end_time: e.target.value })}
              className="form-input w-full"
            />
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="btn-primary flex items-center"
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
        <h3 className="text-lg font-medium text-secondary-900 mb-4">Notification Settings</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Notification Channels
            </label>
            <div className="space-y-2">
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
                    className="form-checkbox mr-2"
                  />
                  <span className="text-sm text-secondary-700">{channel}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.parent_notification_on_entry}
                onChange={(e) => setFormData({ ...formData, parent_notification_on_entry: e.target.checked })}
                className="form-checkbox mr-2"
              />
              <span className="text-sm text-secondary-700">Notify parents on entry</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.parent_notification_on_exit}
                onChange={(e) => setFormData({ ...formData, parent_notification_on_exit: e.target.checked })}
                className="form-checkbox mr-2"
              />
              <span className="text-sm text-secondary-700">Notify parents on exit</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.parent_notification_late_arrival}
                onChange={(e) => setFormData({ ...formData, parent_notification_late_arrival: e.target.checked })}
                className="form-checkbox mr-2"
              />
              <span className="text-sm text-secondary-700">Notify parents on late arrival</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.teacher_notification_absentees}
                onChange={(e) => setFormData({ ...formData, teacher_notification_absentees: e.target.checked })}
                className="form-checkbox mr-2"
              />
              <span className="text-sm text-secondary-700">Notify teachers of absentees</span>
            </label>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="btn-primary flex items-center"
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
        <h3 className="text-lg font-medium text-secondary-900 mb-4">Biometric Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Biometric Type
            </label>
            <select
              value={formData.biometric_type || ''}
              onChange={(e) => setFormData({ ...formData, biometric_type: e.target.value })}
              className="form-select w-full"
            >
              <option value="">Select type</option>
              {biometricTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Enrollment Fingers
            </label>
            <input
              type="number"
              value={formData.biometric_enrollment_fingers}
              onChange={(e) => setFormData({ ...formData, biometric_enrollment_fingers: parseInt(e.target.value) })}
              className="form-input w-full"
              min="1"
              max="10"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Retry Attempts
            </label>
            <input
              type="number"
              value={formData.biometric_retry_attempts}
              onChange={(e) => setFormData({ ...formData, biometric_retry_attempts: parseInt(e.target.value) })}
              className="form-input w-full"
              min="1"
              max="10"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              RFID Card Format
            </label>
            <input
              type="text"
              value={formData.rfid_card_format || ''}
              onChange={(e) => setFormData({ ...formData, rfid_card_format: e.target.value })}
              className="form-input w-full"
              placeholder="e.g., ISO14443A"
            />
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="btn-primary flex items-center"
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
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-secondary-900">Class Levels</h3>
        <button className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Add Class Level
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-secondary-200">
          <thead className="bg-secondary-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                Order
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
            {classLevels.map((level) => (
              <tr key={level.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">
                  {level.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                  {level.code}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                  {level.order}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    level.is_active 
                      ? 'bg-success-100 text-success-800' 
                      : 'bg-danger-100 text-danger-800'
                  }`}>
                    {level.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-primary-600 hover:text-primary-900 mr-3">Edit</button>
                  <button className="text-danger-600 hover:text-danger-900">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Subjects Settings Tab
const SubjectsSettingsTab: React.FC<{
  subjects: any[];
  isLoading: boolean;
}> = ({ subjects, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-secondary-900">Subjects</h3>
        <button className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Add Subject
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-secondary-200">
          <thead className="bg-secondary-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                Type
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
            {subjects.map((subject) => (
              <tr key={subject.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">
                  {subject.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                  {subject.code}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    subject.is_core 
                      ? 'bg-primary-100 text-primary-800' 
                      : 'bg-secondary-100 text-secondary-800'
                  }`}>
                    {subject.is_core ? 'Core' : 'Elective'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    subject.is_active 
                      ? 'bg-success-100 text-success-800' 
                      : 'bg-danger-100 text-danger-800'
                  }`}>
                    {subject.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-primary-600 hover:text-primary-900 mr-3">Edit</button>
                  <button className="text-danger-600 hover:text-danger-900">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Devices Settings Tab
const DevicesSettingsTab: React.FC<{
  devices: any[];
  isLoading: boolean;
}> = ({ devices, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-secondary-900">Devices</h3>
        <button className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Add Device
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-secondary-200">
          <thead className="bg-secondary-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                Last Sync
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-secondary-200">
            {devices.map((device) => (
              <tr key={device.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">
                  {device.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                  {device.device_type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                  {device.location}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    device.is_active 
                      ? 'bg-success-100 text-success-800' 
                      : 'bg-danger-100 text-danger-800'
                  }`}>
                    {device.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                  {device.last_sync ? new Date(device.last_sync).toLocaleString() : 'Never'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-primary-600 hover:text-primary-900 mr-3">Edit</button>
                  <button className="text-danger-600 hover:text-danger-900">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SettingsPage;
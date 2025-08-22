import React from 'react';

const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Settings</h1>
        <p className="text-secondary-600">Configure school and system settings</p>
      </div>
      
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-secondary-900 mb-4">School Settings</h2>
        <p className="text-secondary-600">Settings features coming soon...</p>
      </div>
    </div>
  );
};

export default SettingsPage; 
import React from 'react';
import { ChangePasswordForm } from '@/components/ChangePasswordForm';

export const OrgSettings: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Organization Settings</h2>
      <ChangePasswordForm />
    </div>
  );
};

export default OrgSettings;

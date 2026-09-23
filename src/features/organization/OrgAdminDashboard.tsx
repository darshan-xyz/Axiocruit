import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Modal } from '@/ui';
import { Users, Building, Plus } from 'lucide-react';
import { apiRequest } from '@/core/api';

export const OrgAdminDashboard: React.FC = () => {
  const [recruiters, setRecruiters] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalRecruiters: 0, activeJobs: 0 });
  const [showAddRecruiter, setShowAddRecruiter] = useState(false);
  const [newRecruiter, setNewRecruiter] = useState({ name: '', email: '', password: '' });

  useEffect(() => {
    fetchRecruiters();
  }, []);

  const fetchRecruiters = () => {
    apiRequest('/auth/recruiters')
      .then((data) => {
        if (Array.isArray(data)) {
          setRecruiters(data);
          setStats((prev) => ({ ...prev, totalRecruiters: data.length }));
        }
      })
      .catch((err) => {
        console.error('[OrgAdminDashboard] Failed to fetch recruiters:', err);
      });
  };

  const handleAddRecruiter = async () => {
    try {
      await apiRequest('/auth/register-recruiter', 'POST', {
        ...newRecruiter,
        email: newRecruiter.email.toLowerCase().trim(),
      });
      setShowAddRecruiter(false);
      setNewRecruiter({ name: '', email: '', password: '' });
      fetchRecruiters();
    } catch (error) {
      console.error('[OrgAdminDashboard] Failed to add recruiter:', error);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Organization Dashboard</h1>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="p-6 flex items-center gap-4 bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="p-3 bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400">
            <Users size={24} />
          </div>
          <div>
            <p className="text-slate-500 dark:text-neutral-400 text-sm">Total Recruiters</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalRecruiters}</h3>
          </div>
        </Card>
        <Card className="p-6 flex items-center gap-4 bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400">
            <Building size={24} />
          </div>
          <div>
            <p className="text-slate-500 dark:text-neutral-400 text-sm">Company Profile</p>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Active</h3>
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Team Management</h2>
          <Button icon={Plus} onClick={() => setShowAddRecruiter(true)}>
            Add Recruiter
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recruiters.map((rec) => (
            <Card key={rec._id} className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-white flex items-center justify-center text-lg font-bold">
                {rec.name?.charAt(0) || 'U'}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">{rec.name}</h4>
                <p className="text-sm text-slate-500 dark:text-neutral-400">{rec.email}</p>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mt-1 inline-block font-semibold">
                  Active
                </span>
              </div>
            </Card>
          ))}
          {recruiters.length === 0 && (
            <div className="col-span-full p-8 text-center text-slate-400 dark:text-neutral-500 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              No recruiters added yet. Click &quot;Add Recruiter&quot; to invite a team member.
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={showAddRecruiter} onClose={() => setShowAddRecruiter(false)} title="Add New Recruiter">
        <div className="space-y-4">
          <Input
            label="Full Name"
            value={newRecruiter.name}
            onChange={(e) => setNewRecruiter({ ...newRecruiter, name: e.target.value })}
          />
          <Input
            label="Email Address"
            type="email"
            value={newRecruiter.email}
            onChange={(e) => setNewRecruiter({ ...newRecruiter, email: e.target.value })}
          />
          <Input
            label="Password"
            type="password"
            value={newRecruiter.password}
            onChange={(e) => setNewRecruiter({ ...newRecruiter, password: e.target.value })}
          />
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="ghost" onClick={() => setShowAddRecruiter(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddRecruiter}>Create Account</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default OrgAdminDashboard;

import React, { useEffect, useState } from 'react';
import { apiRequest } from '@/core/api';
import { Card } from '@/ui';

export const AdminOverview: React.FC = () => {
  const [stats, setStats] = useState({
    users: { total: 0, candidates: 0, recruiters: 0, interviewers: 0 },
    jobs: { active: 0 },
    applications: { total: 0 },
    pendingApprovals: 0,
  });

  useEffect(() => {
    apiRequest('/admin/stats')
      .then((res: any) => {
        if (res.success && res.stats) {
          setStats(res.stats);
        }
      })
      .catch((err) => {
        console.error('[AdminOverview] Failed to fetch stats:', err);
      });
  }, []);

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 border-l-4 border-blue-500 bg-white dark:bg-slate-900 shadow-sm">
          <h3 className="text-3xl font-bold mb-1 text-slate-900 dark:text-white">{stats.users.total}</h3>
          <p className="text-slate-500 dark:text-neutral-400">Total Users</p>
          <div className="text-xs text-slate-400 dark:text-neutral-500 mt-2">
            {stats.users.candidates} Candidates, {stats.users.recruiters} Recruiters, {stats.users.interviewers || 0} Interviewers
          </div>
        </Card>
        <Card className="p-6 border-l-4 border-purple-500 bg-white dark:bg-slate-900 shadow-sm">
          <h3 className="text-3xl font-bold mb-1 text-slate-900 dark:text-white">{stats.jobs.active}</h3>
          <p className="text-slate-500 dark:text-neutral-400">Active Jobs</p>
        </Card>
        <Card className="p-6 border-l-4 border-green-500 bg-white dark:bg-slate-900 shadow-sm">
          <h3 className="text-3xl font-bold mb-1 text-slate-900 dark:text-white">{stats.applications.total}</h3>
          <p className="text-slate-500 dark:text-neutral-400">Total Applications</p>
        </Card>
        <Card className="p-6 border-l-4 border-orange-500 bg-white dark:bg-slate-900 shadow-sm">
          <h3 className="text-3xl font-bold mb-1 text-slate-900 dark:text-white">{stats.pendingApprovals}</h3>
          <p className="text-slate-500 dark:text-neutral-400">Pending Approvals</p>
        </Card>
      </div>
    </div>
  );
};

export default AdminOverview;

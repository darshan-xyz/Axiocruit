import React, { useEffect, useState } from 'react';
import { apiRequest } from '@/core/api';
import { Card, Badge } from '@/ui';
import { Trash2 } from 'lucide-react';

export const AdminJobs: React.FC = () => {
  const [jobs, setJobs] = useState<any[]>([]);

  const fetchJobs = async () => {
    try {
      const res = await apiRequest('/admin/jobs');
      if (res.success && Array.isArray(res.jobs)) {
        setJobs(res.jobs);
      } else {
        setJobs([]);
      }
    } catch (err) {
      console.error('[AdminJobs] Failed to fetch jobs:', err);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this job posting?')) return;
    try {
      await apiRequest(`/admin/jobs/${id}`, 'DELETE');
      fetchJobs();
    } catch (err) {
      console.error('[AdminJobs] Failed to delete job:', err);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Job Management</h2>
      <Card className="overflow-hidden bg-white dark:bg-slate-900 shadow-sm border border-slate-300 dark:border-slate-700">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-300 dark:border-slate-700 text-slate-500 dark:text-neutral-400 bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="p-4">Title</th>
                <th className="p-4">Company</th>
                <th className="p-4">Posted By</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {jobs.map((job) => (
                <tr key={job._id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <td className="p-4 font-bold text-slate-900 dark:text-white">{job.title}</td>
                  <td className="p-4 text-slate-600 dark:text-neutral-300">{job.company}</td>
                  <td className="p-4 text-slate-500 dark:text-neutral-400">{job.postedBy?.name || 'Unknown'}</td>
                  <td className="p-4">
                    <Badge variant={job.status === 'Active' ? 'success' : 'neutral'}>{job.status}</Badge>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDelete(job._id)}
                      className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors"
                      title="Delete job"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {jobs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 dark:text-neutral-500">
                    No job requisitions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default AdminJobs;

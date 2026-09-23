import React, { useEffect, useState } from 'react';
import { apiRequest } from '@/core/api';
import { Card, Badge, Button } from '@/ui';
import { DEFAULT_AVATAR } from '@/utils/defaultAvatar';

export const AdminApprovals: React.FC = () => {
  const [pending, setPending] = useState<any[]>([]);

  const fetchPending = async () => {
    try {
      const res = await apiRequest('/admin/freelancers/pending');
      if (res.success && Array.isArray(res.users)) {
        setPending(res.users);
      } else {
        setPending([]);
      }
    } catch (err) {
      console.error('[AdminApprovals] Fetch Error:', err);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleAction = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await apiRequest(`/admin/freelancers/${id}/approve`, 'PATCH', { status });
      fetchPending();
    } catch (e) {
      console.error('[AdminApprovals] Action failed:', e);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Freelancer Approvals</h2>
      <Card className="min-h-[200px] p-4 bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800">
        {pending.length === 0 && (
          <p className="text-slate-400 dark:text-neutral-500 p-4 text-center">No pending freelancer approvals.</p>
        )}
        <div className="grid gap-4">
          {pending.map((user) => (
            <div
              key={user._id}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-50 dark:bg-neutral-800/50 rounded-xl border border-slate-200 dark:border-neutral-700 gap-4"
            >
              <div className="flex items-center gap-4">
                <img
                  src={user.profilePicture || DEFAULT_AVATAR}
                  className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                  alt={user.name || 'User'}
                />
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">{user.name}</h4>
                  <p className="text-sm text-slate-500 dark:text-neutral-400">{user.email}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="info">{user.role}</Badge>
                    <Badge variant="warning">PENDING</Badge>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 self-end sm:self-auto">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAction(user._id, 'REJECTED')}
                  className="text-red-500 border-red-500/30 hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                  Reject
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleAction(user._id, 'APPROVED')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white border-none"
                >
                  Approve
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default AdminApprovals;

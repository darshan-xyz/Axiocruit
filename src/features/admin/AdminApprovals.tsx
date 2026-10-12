import React, { useEffect, useState } from 'react';
import { apiRequest } from '@/core/api';
import { Card, Badge, Button, Modal } from '@/ui';
import { Eye, FileText, DollarSign, Clock } from 'lucide-react';
import { DEFAULT_AVATAR } from '@/utils/defaultAvatar';

export const AdminApprovals: React.FC = () => {
  const [pending, setPending] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

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
      if (selectedUser && selectedUser._id === id) {
        setSelectedUser(null);
      }
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
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedUser(user)}
                  className="text-slate-600 dark:text-slate-300"
                >
                  <Eye size={14} className="mr-1.5" />
                  View Details
                </Button>
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

      {/* Details Modal */}
      <Modal isOpen={!!selectedUser} onClose={() => setSelectedUser(null)} title="Interviewer Application Details">
        {selectedUser && (
          <div className="space-y-5">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
              <img
                src={selectedUser.profilePicture || DEFAULT_AVATAR}
                className="w-16 h-16 rounded-2xl object-cover border border-slate-200 dark:border-slate-700"
                alt={selectedUser.name}
              />
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selectedUser.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{selectedUser.email}</p>
                <div className="flex gap-2 mt-1.5">
                  <Badge variant="info">{selectedUser.role}</Badge>
                  <Badge variant="warning">{selectedUser.approvalStatus || 'PENDING'}</Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-400 mb-0.5 flex items-center gap-1">
                  <DollarSign size={13} /> Hourly Rate
                </p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {selectedUser.hourlyRate ? `$${selectedUser.hourlyRate}/hr` : (selectedUser.profile?.hourlyRate ? `$${selectedUser.profile.hourlyRate}/hr` : 'Not set')}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-400 mb-0.5 flex items-center gap-1">
                  <Clock size={13} /> Experience
                </p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {selectedUser.yearsOfExperience || selectedUser.experience || selectedUser.profile?.yearsOfExperience || 'Not set'}
                </p>
              </div>
            </div>

            {(selectedUser.headline || selectedUser.profile?.headline) && (
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Headline</h4>
                <p className="text-sm text-slate-800 dark:text-slate-200 font-medium">{selectedUser.headline || selectedUser.profile?.headline}</p>
              </div>
            )}

            {(selectedUser.bio || selectedUser.profile?.bio) && (
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Bio / Summary</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {selectedUser.bio || selectedUser.profile?.bio}
                </p>
              </div>
            )}

            {(selectedUser.skills?.length > 0 || selectedUser.profile?.skills?.length > 0) && (
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Verified Skills</h4>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedUser.skills || selectedUser.profile?.skills || []).map((sk: string, idx: number) => (
                    <span key={idx} className="px-2.5 py-0.5 text-xs rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 font-medium">
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(selectedUser.resumeUrl || selectedUser.resume || selectedUser.profile?.resume) && (
              <a
                href={selectedUser.resumeUrl || selectedUser.resume || selectedUser.profile?.resume}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                <FileText size={14} /> View Attached Resume / Portfolio
              </a>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <Button variant="ghost" onClick={() => setSelectedUser(null)}>
                Close
              </Button>
              <Button
                variant="outline"
                onClick={() => handleAction(selectedUser._id, 'REJECTED')}
                className="text-red-500 border-red-500/30 hover:bg-red-50 dark:hover:bg-red-500/10"
              >
                Reject Application
              </Button>
              <Button
                onClick={() => handleAction(selectedUser._id, 'APPROVED')}
                className="bg-emerald-600 hover:bg-emerald-500 text-white border-none"
              >
                Approve Application
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminApprovals;

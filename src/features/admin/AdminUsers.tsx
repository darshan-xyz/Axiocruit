import React, { useEffect, useState } from 'react';
import { apiRequest } from '@/core/api';
import { Card, Badge, Button } from '@/ui';
import { Trash2 } from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [filter, setFilter] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await apiRequest(`/admin/users?role=${filter}`);
      if (res.success && Array.isArray(res.users)) {
        setUsers(res.users);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error('[AdminUsers] Fetch Error:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filter]);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) return;
    try {
      await apiRequest(`/admin/users/${id}`, 'DELETE');
      fetchUsers();
    } catch (e) {
      console.error('[AdminUsers] Failed to delete user:', e);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">User Management</h2>
      <div className="flex flex-wrap gap-2 mb-6">
        {['', 'CANDIDATE', 'RECRUITER', 'ORGANIZATION', 'INTERVIEWER'].map((role) => (
          <Button
            key={role}
            size="sm"
            variant={filter === role ? 'secondary' : 'outline'}
            onClick={() => setFilter(role)}
          >
            {role || 'All'}
          </Button>
        ))}
      </div>
      <Card className="overflow-hidden bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 dark:border-neutral-800 text-slate-500 dark:text-neutral-400 bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Role</th>
                <th className="p-4">Email</th>
                <th className="p-4">Org</th>
                <th className="p-4">Joined</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <td className="p-4 font-medium text-slate-900 dark:text-white">{user.name}</td>
                  <td className="p-4">
                    <Badge variant="info">{user.role}</Badge>
                  </td>
                  <td className="p-4 text-slate-600 dark:text-neutral-400">{user.email}</td>
                  <td className="p-4 text-slate-600 dark:text-neutral-400">{user.organization?.name || '-'}</td>
                  <td className="p-4 text-slate-400 dark:text-neutral-500">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDelete(user._id, user.name)}
                      className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors"
                      title="Delete user"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 dark:text-neutral-500">
                    No users found matching the selected filter.
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

export default AdminUsers;

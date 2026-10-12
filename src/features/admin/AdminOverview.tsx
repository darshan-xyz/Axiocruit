import React, { useEffect, useState } from 'react';
import { apiRequest } from '@/core/api';
import { Card, Badge, Button } from '@/ui';
import { RefreshCw, Shield, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface AuditLogEntry {
  _id: string;
  actor: {
    id?: string;
    email: string;
    role: string;
  };
  action: string;
  resource: {
    type: string;
    id?: string;
  };
  details?: Record<string, any>;
  ip?: string;
  userAgent?: string;
  timestamp: string;
}

export const AdminOverview: React.FC = () => {
  const [stats, setStats] = useState({
    users: { total: 0, candidates: 0, recruiters: 0, interviewers: 0 },
    jobs: { active: 0 },
    applications: { total: 0 },
    pendingApprovals: 0,
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logError, setLogError] = useState<string | null>(null);

  const fetchStats = () => {
    apiRequest('/admin/stats')
      .then((res: any) => {
        if (res.success && res.stats) {
          setStats(res.stats);
        }
      })
      .catch((err) => {
        console.error('[AdminOverview] Failed to fetch stats:', err);
      });
  };

  const fetchAuditLogs = () => {
    setLoadingLogs(true);
    setLogError(null);
    apiRequest('/admin/audit-logs?limit=15')
      .then((res: any) => {
        if (res.success && Array.isArray(res.logs)) {
          setAuditLogs(res.logs);
        }
      })
      .catch((err) => {
        console.error('[AdminOverview] Failed to fetch audit logs:', err);
        setLogError('Failed to load audit trail');
      })
      .finally(() => {
        setLoadingLogs(false);
      });
  };

  useEffect(() => {
    fetchStats();
    fetchAuditLogs();
  }, []);

  const getActionBadgeVariant = (action: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple' => {
    if (action.includes('DELETE') || action.includes('REMOVE') || action.includes('REUSE')) return 'danger';
    if (action.includes('APPROVE') || action.includes('CREATE')) return 'success';
    if (action.includes('UPDATE')) return 'purple';
    if (action.includes('LOGIN')) return 'info';
    if (action.includes('LOGOUT')) return 'neutral';
    return 'neutral';
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Overview</h2>
          <p className="text-sm text-slate-500 dark:text-neutral-400 mt-1">Platform analytics and operational security telemetry</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={RefreshCw}
          onClick={() => {
            fetchStats();
            fetchAuditLogs();
          }}
          disabled={loadingLogs}
        >
          Refresh Data
        </Button>
      </div>

      {/* KPI Stats Grid */}
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

      {/* Tamper-Evident Security Audit Trail */}
      <Card className="p-6 bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Tamper-Evident Audit Trail</h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Immutable activity log tracking authorization, authentication, and privileged changes
              </p>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
            {auditLogs.length} events
          </span>
        </div>

        {logError && (
          <div className="p-3 mb-4 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-2 border border-rose-200 dark:border-rose-800">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{logError}</span>
          </div>
        )}

        {loadingLogs ? (
          <div className="py-12 flex justify-center items-center text-sm text-slate-400 dark:text-neutral-500">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" />
            Loading recent audit events...
          </div>
        ) : auditLogs.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400 dark:text-neutral-500">
            <Shield className="w-8 h-8 mx-auto mb-2 opacity-40" />
            No audit events recorded yet. Sensitive operations will automatically appear here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase text-slate-400 dark:text-neutral-500 border-b border-slate-100 dark:border-slate-800">
                  <th className="py-3 px-4 font-semibold">Timestamp</th>
                  <th className="py-3 px-4 font-semibold">Action</th>
                  <th className="py-3 px-4 font-semibold">Actor</th>
                  <th className="py-3 px-4 font-semibold">Target Resource</th>
                  <th className="py-3 px-4 font-semibold">Metadata / IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-normal">
                {auditLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-500 dark:text-neutral-400 font-mono">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <Badge variant={getActionBadgeVariant(log.action)}>
                        {log.action}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
                        {log.actor.email}
                      </div>
                      <div className="text-[11px] text-slate-400 dark:text-neutral-500">
                        {log.actor.role}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-slate-600 dark:text-slate-300">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{log.resource.type}</span>
                      {log.resource.id && (
                        <span className="text-[11px] text-slate-400 dark:text-neutral-500 ml-1">
                          #{log.resource.id.substring(0, 8)}...
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500 dark:text-neutral-400 max-w-xs truncate">
                      {log.ip && <span className="font-mono mr-2">{log.ip}</span>}
                      {log.details && Object.keys(log.details).length > 0 && (
                        <span className="text-[11px] text-slate-400 dark:text-neutral-500">
                          {JSON.stringify(log.details)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminOverview;

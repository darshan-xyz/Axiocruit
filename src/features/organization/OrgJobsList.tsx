import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Modal, Badge } from '@/ui';
import { Briefcase, Search, Eye, Users, Calendar, User } from 'lucide-react';
import { apiRequest } from '@/core/api';
import { useTheme } from '@/core/ThemeContext';

interface Job {
  _id: string;
  title: string;
  status: string;
  location?: string;
  type?: string;
  salary?: string;
  skills?: string[];
  description?: string;
  requirements?: string;
  postedBy: {
    _id: string;
    name: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  createdAt: string;
  applicantCount: number;
}

export const OrgJobsList: React.FC = () => {
  const { isDark } = useTheme();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/organization/jobs');
      if (Array.isArray(data)) {
        setJobs(data);
      }
    } catch (err) {
      console.error('[OrgJobsList] Failed to fetch org jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = jobs.filter(
    (j) =>
      j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (j.postedBy?.name && j.postedBy.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const activeJobsCount = jobs.filter((j) => j.status === 'Active').length;
  const totalApplicants = jobs.reduce((sum, j) => sum + (j.applicantCount || 0), 0);

  const textMuted = isDark ? 'text-neutral-400' : 'text-slate-500';
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const borderColor = isDark ? 'border-slate-800' : 'border-slate-200';
  const hoverBg = isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50';
  const headerBg = isDark ? 'bg-slate-800/50' : 'bg-slate-50/80';

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${textPrimary}`}>Company Jobs Overview</h1>
          <p className={`text-sm mt-1 ${textMuted}`}>Monitor all hiring activities across your team</p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="!p-4 flex items-center gap-4 bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Briefcase size={20} />
          </div>
          <div>
            <p className={`text-xs font-medium ${textMuted}`}>Total Jobs</p>
            <p className={`text-xl font-bold ${textPrimary}`}>{jobs.length}</p>
          </div>
        </Card>
        <Card className="!p-4 flex items-center gap-4 bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Briefcase size={20} />
          </div>
          <div>
            <p className={`text-xs font-medium ${textMuted}`}>Active Jobs</p>
            <p className={`text-xl font-bold ${textPrimary}`}>{activeJobsCount}</p>
          </div>
        </Card>
        <Card className="!p-4 flex items-center gap-4 bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Users size={20} />
          </div>
          <div>
            <p className={`text-xs font-medium ${textMuted}`}>Total Applicants</p>
            <p className={`text-xl font-bold ${textPrimary}`}>{totalApplicants}</p>
          </div>
        </Card>
      </div>

      {/* Search bar */}
      <div className="max-w-sm">
        <Input
          placeholder="Search by job title or recruiter..."
          icon={Search}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Data Table */}
      <Card className="!p-0 overflow-hidden bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`${headerBg} border-b ${borderColor}`}>
                <th className={`text-left py-3 px-5 font-semibold ${textMuted} text-xs uppercase tracking-wider`}>Job Title</th>
                <th className={`text-left py-3 px-5 font-semibold ${textMuted} text-xs uppercase tracking-wider`}>Posted By</th>
                <th className={`text-left py-3 px-5 font-semibold ${textMuted} text-xs uppercase tracking-wider hidden sm:table-cell`}>Date Posted</th>
                <th className={`text-center py-3 px-5 font-semibold ${textMuted} text-xs uppercase tracking-wider hidden md:table-cell`}>Total Applicants</th>
                <th className={`text-left py-3 px-5 font-semibold ${textMuted} text-xs uppercase tracking-wider hidden lg:table-cell`}>Status</th>
                <th className={`text-right py-3 px-5 font-semibold ${textMuted} text-xs uppercase tracking-wider`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className={`text-center py-12 ${textMuted}`}>
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
                      <span>Loading jobs...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className={`text-center py-12 ${textMuted}`}>
                    <div className="flex flex-col items-center gap-2">
                      <Briefcase size={32} className="opacity-30" />
                      <p className="font-medium">No jobs found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((job) => (
                  <tr key={job._id} className={`border-b ${borderColor} ${hoverBg} transition-colors`}>
                    <td className={`py-3.5 px-5 font-semibold ${textPrimary}`}>{job.title}</td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
                          {(job.postedBy?.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <span className={textPrimary}>{job.postedBy?.name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className={`py-3.5 px-5 hidden sm:table-cell ${textMuted}`}>
                      {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="py-3.5 px-5 hidden md:table-cell text-center">
                      <span
                        className={`inline-flex items-center justify-center min-w-[2rem] h-6 rounded-full text-xs font-bold ${
                          job.applicantCount > 0
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                            : 'bg-slate-100 dark:bg-neutral-800 text-slate-400 dark:text-neutral-500'
                        }`}
                      >
                        {job.applicantCount || 0}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 hidden lg:table-cell">
                      <Badge variant={job.status === 'Active' ? 'success' : 'neutral'}>{job.status}</Badge>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <Button
                        variant="primary"
                        size="sm"
                        className="!px-3 !py-1.5"
                        onClick={() => setSelectedJob(job)}
                      >
                        <Eye size={14} className="mr-1.5" />
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ====== View Details Stats View ====== */}
      <Modal isOpen={!!selectedJob} onClose={() => setSelectedJob(null)} title="Job Details">
        {selectedJob && (
          <div className="space-y-6">
            <div className={`p-4 rounded-xl ${isDark ? 'bg-white/5 border border-slate-800' : 'bg-slate-50 border border-slate-200'}`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className={`text-xl font-bold ${textPrimary}`}>{selectedJob.title}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={selectedJob.status === 'Active' ? 'success' : 'neutral'}>
                      {selectedJob.status}
                    </Badge>
                    <span className={`text-xs flex items-center gap-1 ${textMuted}`}>
                      <Calendar size={12} />
                      Posted on {selectedJob.createdAt ? new Date(selectedJob.createdAt).toLocaleDateString() : '-'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-900' : 'bg-white'} shadow-sm border ${borderColor}`}>
                  <p className={`text-xs ${textMuted} flex items-center gap-1.5 mb-1`}>
                    <User size={14} /> Recruiter
                  </p>
                  <p className={`font-semibold ${textPrimary} truncate`}>{selectedJob.postedBy?.name || 'Unknown'}</p>
                  <p className={`text-[10px] ${textMuted} truncate mt-0.5`}>{selectedJob.postedBy?.email || '-'}</p>
                </div>
                <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-900' : 'bg-white'} shadow-sm border ${borderColor}`}>
                  <p className={`text-xs ${textMuted} flex items-center gap-1.5 mb-1`}>
                    <Users size={14} /> Pipeline
                  </p>
                  <p className={`font-semibold ${textPrimary}`}>{selectedJob.applicantCount || 0} Applicants</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                <div className={`p-2.5 rounded-lg ${isDark ? 'bg-slate-900' : 'bg-white'} border ${borderColor}`}>
                  <p className={`text-[11px] ${textMuted} mb-0.5`}>Location</p>
                  <p className={`text-xs font-semibold ${textPrimary}`}>{selectedJob.location || 'Remote'}</p>
                </div>
                <div className={`p-2.5 rounded-lg ${isDark ? 'bg-slate-900' : 'bg-white'} border ${borderColor}`}>
                  <p className={`text-[11px] ${textMuted} mb-0.5`}>Employment Type</p>
                  <p className={`text-xs font-semibold ${textPrimary}`}>{selectedJob.type || 'Full-time'}</p>
                </div>
                <div className={`p-2.5 rounded-lg ${isDark ? 'bg-slate-900' : 'bg-white'} border ${borderColor}`}>
                  <p className={`text-[11px] ${textMuted} mb-0.5`}>Salary</p>
                  <p className={`text-xs font-semibold ${textPrimary}`}>{selectedJob.salary || 'Not specified'}</p>
                </div>
              </div>

              {selectedJob.skills && selectedJob.skills.length > 0 && (
                <div className="mt-4">
                  <p className={`text-xs font-bold ${textPrimary} mb-2`}>Required Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedJob.skills.map((s, idx) => (
                      <span key={idx} className="px-2.5 py-1 text-xs rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/60 font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedJob.description && (
                <div className="mt-4">
                  <p className={`text-xs font-bold ${textPrimary} mb-1`}>Description</p>
                  <p className={`text-xs ${textMuted} whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto`}>
                    {selectedJob.description}
                  </p>
                </div>
              )}

              {selectedJob.requirements && (
                <div className="mt-4">
                  <p className={`text-xs font-bold ${textPrimary} mb-1`}>Requirements</p>
                  <p className={`text-xs ${textMuted} whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto`}>
                    {selectedJob.requirements}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setSelectedJob(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OrgJobsList;

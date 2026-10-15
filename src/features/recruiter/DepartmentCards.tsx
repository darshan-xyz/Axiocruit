import React from 'react';
import { Users, Briefcase, ChevronRight } from 'lucide-react';
import { DEFAULT_AVATAR } from '@/utils/defaultAvatar';

interface EmployeeDepartmentCardsProps {
  jobs?: any[];
  applications?: any[];
}

interface DeptSummary {
  name: string;
  candidateCount: number;
  jobCount: number;
  candidates: Array<{ name?: string; profilePicture?: string }>;
}

export const EmployeeDepartmentCards: React.FC<EmployeeDepartmentCardsProps> = ({
  jobs = [],
  applications = [],
}) => {
  // Determine departments dynamically from active requisitions
  const standardDepartments = ['Engineering', 'Design', 'Product', 'Data & AI'];
  const jobDepartments = Array.from(new Set(jobs.map(j => j.department).filter(Boolean)));
  const allDeptNames = Array.from(new Set([...standardDepartments, ...jobDepartments]));

  const deptSummaries: DeptSummary[] = allDeptNames.map(deptName => {
    const matchingJobs = jobs.filter(j =>
      (j.department || '').toLowerCase() === deptName.toLowerCase() ||
      (j.title || '').toLowerCase().includes(deptName.toLowerCase())
    );
    const matchingJobIds = new Set(matchingJobs.map(j => (j._id || j.id)?.toString()));

    const matchingApps = applications.filter(a => {
      const appId = (a.job?._id || a.job || a.jobId)?.toString();
      return matchingJobIds.has(appId);
    });

    const candidates = matchingApps.map(a => {
      const c = typeof a.candidate === 'object' && a.candidate !== null ? a.candidate : {};
      return {
        name: c.name || c.firstName || 'Candidate',
        profilePicture: c.profilePicture,
      };
    });

    return {
      name: deptName,
      jobCount: matchingJobs.length,
      candidateCount: matchingApps.length,
      candidates,
    };
  });

  return (
    <div className="w-full bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
            Department Pipelines
          </h3>
          <p className="text-[11px] text-slate-500">Live candidate allocation by technical team</p>
        </div>
        <button
          onClick={() => (window.location.href = '#/recruiter/applicants')}
          className="text-xs font-black text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 uppercase tracking-wider cursor-pointer"
        >
          View All <ChevronRight size={14} />
        </button>
      </div>

      <div className="space-y-3">
        {deptSummaries.slice(0, 4).map(d => {
          const displayedCandidates = d.candidates.slice(0, 3);
          const extraCount = d.candidates.length > 3 ? d.candidates.length - 3 : 0;

          return (
            <div
              key={d.name}
              className="p-3.5 rounded-2xl bg-slate-50/60 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
            >
              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">{d.name}</h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-black uppercase text-slate-400">
                    {d.jobCount} {d.jobCount === 1 ? 'Job' : 'Jobs'}
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400">
                    {d.candidateCount} {d.candidateCount === 1 ? 'Applicant' : 'Applicants'}
                  </span>
                </div>
              </div>

              <div className="flex items-center -space-x-1.5">
                {displayedCandidates.length > 0 ? (
                  <>
                    {displayedCandidates.map((c, i) => (
                      <img
                        key={i}
                        src={c.profilePicture || DEFAULT_AVATAR}
                        className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-800 object-cover"
                        alt={c.name || 'Candidate'}
                        title={c.name}
                      />
                    ))}
                    {extraCount > 0 && (
                      <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-[9px] font-black flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-2xs">
                        +{extraCount}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-[11px] font-medium text-slate-400 italic">
                    No applicants yet
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EmployeeDepartmentCards;

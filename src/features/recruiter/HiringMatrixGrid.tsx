import React from 'react';
import { ChevronRight } from 'lucide-react';

export const TALENT_PIPELINE_MATRIX_ROWS = [
  {
    jobTitle: 'Staff AI/ML Engineer',
    totalApplications: 124,
    newApplied: '34 Candidates',
    appliedColor: 'bg-[#FFE4E6] text-[#BE123C] dark:bg-rose-950/60 dark:text-rose-300',
    screening: '18 Candidates',
    screeningColor: 'bg-[#EDE9FE] text-[#6D28D9] dark:bg-purple-950/60 dark:text-purple-300',
    interview: '6 Candidates',
    interviewColor: 'bg-[#FBCFE8] text-[#9D174D] dark:bg-pink-950/60 dark:text-pink-300',
    test: '4 In Test',
    testColor: 'bg-[#FEF08A] text-[#854D0E] dark:bg-amber-950/60 dark:text-amber-300',
    hired: '2 Hired',
    hiredColor: 'bg-[#DCFCE7] text-[#15803D] dark:bg-emerald-950/60 dark:text-emerald-300',
  },
  {
    jobTitle: 'Senior Full Stack Lead',
    totalApplications: 96,
    newApplied: '28 Candidates',
    appliedColor: 'bg-[#FFEDD5] text-[#C2410C] dark:bg-orange-950/60 dark:text-orange-300',
    screening: '16 Candidates',
    screeningColor: 'bg-[#FED7AA] text-[#9A3412] dark:bg-amber-950/60 dark:text-amber-300',
    interview: '8 Candidates',
    interviewColor: 'bg-[#FBCFE8] text-[#9D174D] dark:bg-pink-950/60 dark:text-pink-300',
    test: '5 In Test',
    testColor: 'bg-[#FEF08A] text-[#854D0E] dark:bg-amber-950/60 dark:text-amber-300',
    hired: null,
  },
  {
    jobTitle: 'Lead Product Designer',
    totalApplications: 88,
    newApplied: '18 Candidates',
    appliedColor: 'bg-[#CFFAFE] text-[#0E7490] dark:bg-cyan-950/60 dark:text-cyan-300',
    screening: '12 Candidates',
    screeningColor: 'bg-[#BAE6FD] text-[#0369A1] dark:bg-sky-950/60 dark:text-sky-300',
    interview: '5 Candidates',
    interviewColor: 'bg-[#7DD3FC] text-[#0284C7] dark:bg-blue-950/60 dark:text-blue-300',
    test: null,
    hired: null,
  },
  {
    jobTitle: 'DevOps & Cloud Architect',
    totalApplications: 72,
    newApplied: '14 Candidates',
    appliedColor: 'bg-[#FEF9C3] text-[#A16207] dark:bg-yellow-950/60 dark:text-yellow-300',
    screening: '10 Candidates',
    screeningColor: 'bg-[#FEF08A] text-[#854D0E] dark:bg-amber-950/60 dark:text-amber-300',
    interview: '4 Candidates',
    interviewColor: 'bg-[#FDE047] text-[#713F12] dark:bg-yellow-950/80 dark:text-yellow-200',
    test: '2 In Test',
    testColor: 'bg-[#FEF08A] text-[#854D0E] dark:bg-amber-950/60 dark:text-amber-300',
    hired: '1 Hired',
    hiredColor: 'bg-[#DCFCE7] text-[#15803D] dark:bg-emerald-950/60 dark:text-emerald-300',
  },
  {
    jobTitle: 'Mobile Engineer (React Native)',
    totalApplications: 82,
    newApplied: '22 Candidates',
    appliedColor: 'bg-[#F3E8FF] text-[#7E22CE] dark:bg-purple-950/60 dark:text-purple-300',
    screening: '15 Candidates',
    screeningColor: 'bg-[#DDD6FE] text-[#6B21A8] dark:bg-purple-950/80 dark:text-purple-200',
    interview: '3 Candidates',
    interviewColor: 'bg-[#FBCFE8] text-[#9D174D] dark:bg-pink-950/60 dark:text-pink-300',
    test: null,
    hired: null,
  },
  {
    jobTitle: 'Data Platform Architect',
    totalApplications: 90,
    newApplied: '25 Candidates',
    appliedColor: 'bg-[#E0E7FF] text-[#4338CA] dark:bg-indigo-950/60 dark:text-indigo-300',
    screening: '19 Candidates',
    screeningColor: 'bg-[#C7D2FE] text-[#3730A3] dark:bg-indigo-950/80 dark:text-indigo-200',
    interview: '7 Candidates',
    interviewColor: 'bg-[#A5B4FC] text-[#1E40AF] dark:bg-blue-950/80 dark:text-blue-200',
    test: '3 In Test',
    testColor: 'bg-[#FEF08A] text-[#854D0E] dark:bg-amber-950/60 dark:text-amber-300',
    hired: '2 Hired',
    hiredColor: 'bg-[#DCFCE7] text-[#15803D] dark:bg-emerald-950/60 dark:text-emerald-300',
  },
];

export interface HiringMatrixGridProps {
  jobs?: any[];
  applications?: any[];
}

export const HiringMatrixGrid: React.FC<HiringMatrixGridProps> = ({ jobs, applications }) => {
  // If jobs is explicitly provided, compute real dynamic rows from jobs and applications
  const rows = React.useMemo(() => {
    if (jobs === undefined) {
      return TALENT_PIPELINE_MATRIX_ROWS;
    }
    if (!jobs || jobs.length === 0) {
      return [];
    }

    const appList = applications || [];
    return jobs.slice(0, 6).map((job: any) => {
      const jobApps = appList.filter((a: any) => {
        const aJobId = a.job?._id || a.job;
        return aJobId && aJobId.toString() === job._id?.toString();
      });

      const appliedCount = jobApps.filter((a: any) => a.status === 'Applied').length;
      const screeningCount = jobApps.filter((a: any) => a.status === 'Screening').length;
      const interviewCount = jobApps.filter((a: any) => a.status === 'Interview').length;
      const testCount = jobApps.filter((a: any) => a.status === 'Assessment' || a.status === 'Shortlisted').length;
      const hiredCount = jobApps.filter((a: any) => a.status === 'Offer' || a.status === 'Hired').length;

      return {
        jobTitle: job.title || 'Technical Role',
        totalApplications: jobApps.length,
        newApplied: appliedCount > 0 ? `${appliedCount} Candidates` : null,
        appliedColor: 'bg-[#FFE4E6] text-[#BE123C] dark:bg-rose-950/60 dark:text-rose-300',
        screening: screeningCount > 0 ? `${screeningCount} Candidates` : null,
        screeningColor: 'bg-[#EDE9FE] text-[#6D28D9] dark:bg-purple-950/60 dark:text-purple-300',
        interview: interviewCount > 0 ? `${interviewCount} Candidates` : null,
        interviewColor: 'bg-[#FBCFE8] text-[#9D174D] dark:bg-pink-950/60 dark:text-pink-300',
        test: testCount > 0 ? `${testCount} In Test` : null,
        testColor: 'bg-[#FEF08A] text-[#854D0E] dark:bg-amber-950/60 dark:text-amber-300',
        hired: hiredCount > 0 ? `${hiredCount} Hired` : null,
        hiredColor: 'bg-[#DCFCE7] text-[#15803D] dark:bg-emerald-950/60 dark:text-emerald-300',
      };
    });
  }, [jobs, applications]);

  return (
    <div className="bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
            Technical Pipeline Matrix
          </h3>
          <button className="px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 flex items-center gap-1.5 shadow-2xs">
            <span>Engineering</span>
            <ChevronRight size={12} className="rotate-90 text-slate-400" />
          </button>
        </div>
        <button
          onClick={() => window.location.href = '#/recruiter/applicants'}
          className="text-xs font-black text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1 uppercase tracking-wider cursor-pointer"
        >
          VIEW ALL CANDIDATES &gt;
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="pb-3 pr-4 font-bold">Jobs</th>
              <th className="pb-3 px-3 text-center font-bold">New Applied</th>
              <th className="pb-3 px-3 text-center font-bold">Screening</th>
              <th className="pb-3 px-3 text-center font-bold">Interview</th>
              <th className="pb-3 px-3 text-center font-bold">Assessment</th>
              <th className="pb-3 pl-3 text-center font-bold">Hired</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400 dark:text-neutral-500 font-medium">
                  No active job requisitions. Post a new job to start tracking candidate pipeline stages.
                </td>
              </tr>
            ) : (
              rows.map((row: any) => (
                <tr key={row.jobTitle} className="hover:bg-slate-50/70 dark:hover:bg-slate-850/40 transition-colors">
                  <td className="py-3.5 pr-4 font-bold text-slate-900 dark:text-white min-w-[170px]">
                    <div className="font-bold text-xs">{row.jobTitle}</div>
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">TOTAL CANDIDATES {row.totalApplications}</span>
                  </td>
                  <td className="py-3.5 px-3 text-center min-w-[120px]">
                    {row.newApplied ? (
                      <span className={`inline-block px-3 py-1.5 rounded-xl font-bold text-xs shadow-2xs ${row.appliedColor}`}>
                        {row.newApplied}
                      </span>
                    ) : (
                      <div className="h-7 w-20 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 mx-auto" />
                    )}
                  </td>
                  <td className="py-3.5 px-3 text-center min-w-[120px]">
                    {row.screening ? (
                      <span className={`inline-block px-3 py-1.5 rounded-xl font-bold text-xs shadow-2xs ${row.screeningColor}`}>
                        {row.screening}
                      </span>
                    ) : (
                      <div className="h-7 w-20 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 mx-auto" />
                    )}
                  </td>
                  <td className="py-3.5 px-3 text-center min-w-[120px]">
                    {row.interview ? (
                      <span className={`inline-block px-3 py-1.5 rounded-xl font-bold text-xs shadow-2xs ${row.interviewColor}`}>
                        {row.interview}
                      </span>
                    ) : (
                      <div className="h-7 w-20 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 mx-auto" />
                    )}
                  </td>
                  <td className="py-3.5 px-3 text-center min-w-[100px]">
                    {row.test ? (
                      <span className={`inline-block px-3 py-1.5 rounded-xl font-bold text-xs shadow-2xs ${row.testColor}`}>
                        {row.test}
                      </span>
                    ) : (
                      <div className="h-7 w-20 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 mx-auto" />
                    )}
                  </td>
                  <td className="py-3.5 pl-3 text-center min-w-[100px]">
                    {row.hired ? (
                      <span className={`inline-block px-3 py-1.5 rounded-xl font-bold text-xs shadow-2xs ${row.hiredColor}`}>
                        {row.hired}
                      </span>
                    ) : (
                      <div className="h-7 w-20 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 mx-auto" />
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HiringMatrixGrid;

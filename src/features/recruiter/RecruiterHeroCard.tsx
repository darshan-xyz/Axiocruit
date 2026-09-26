import React from 'react';
import { User, Briefcase, Users, PlusCircle, Sparkles } from 'lucide-react';

interface RecruiterHeroCardProps {
  currentUser?: {
    name?: string;
    profilePicture?: string;
    email?: string;
    role?: string;
    companyName?: string;
  } | null;
  onPostJob?: () => void;
  onFindCandidates?: () => void;
  isDark?: boolean;
}

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face';

export const RecruiterHeroCard: React.FC<RecruiterHeroCardProps> = ({
  currentUser,
  onPostJob,
  onFindCandidates,
  isDark = false,
}) => {
  const profilePic = currentUser?.profilePicture || DEFAULT_AVATAR;

  return (
    <div
      className={`rounded-2xl sm:rounded-3xl p-6 border shadow-sm transition-all duration-200 ${
        isDark
          ? 'bg-[#111726] border-slate-800 text-white'
          : 'bg-white border-neutral-200/80 text-[#111111]'
      }`}
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          {/* Avatar with emerald online dot */}
          <div className="relative">
            <img
              src={currentUser?.profilePicture || DEFAULT_AVATAR}
              alt={currentUser?.name || 'Recruiter'}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-2 ring-slate-200 dark:ring-slate-700 shadow-md"
            />
            <span
              className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 ring-2 ring-white dark:ring-slate-900 rounded-full"
              title="Online"
            />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                {currentUser?.name || 'Kevin Nunez'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                Hiring Lead
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active Hiring
              </span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
              {currentUser?.email || 'kevin.nunez@axiocruit.enterprise'} • {currentUser?.companyName || 'Axiocruit Global'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <a
            href="#/recruiter/applicants"
            onClick={onFindCandidates}
            className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-neutral-100 dark:bg-slate-800 hover:bg-neutral-200 dark:hover:bg-slate-700 text-neutral-800 dark:text-slate-200 transition-all flex items-center justify-center gap-2 border border-neutral-200 dark:border-slate-700"
          >
            <Users size={16} />
            <span>Find Candidates</span>
          </a>
          <a
            href="#/recruiter/jobs"
            onClick={onPostJob}
            className="flex-1 md:flex-initial px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            <PlusCircle size={16} />
            <span>Post Requisition</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default RecruiterHeroCard;

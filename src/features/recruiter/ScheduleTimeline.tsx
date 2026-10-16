import React from 'react';
import { Calendar, Clock, Video, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface InterviewItem {
  id: string;
  interviewTitle?: string;
  candidate?: {
    name: string;
    email: string;
  };
  interviewerName?: string;
  scheduledTime?: string;
  status?: string;
  colorVariant?: 'blue' | 'pink' | 'emerald';
}

interface ScheduleTimelineProps {
  interviews?: InterviewItem[];
  isDark?: boolean;
}

export const ScheduleTimeline: React.FC<ScheduleTimelineProps> = ({
  interviews = [],
  isDark = false,
}) => {
  const navigate = useNavigate();

  const items = interviews || [];

  return (
    <div
      className={`w-full rounded-2xl p-6 border shadow-sm transition-all duration-200 ${
        isDark
          ? 'bg-[#111726] border-slate-700 text-white'
          : 'bg-white border-slate-300 text-[#111111]'
      }`}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
            <Calendar size={18} className="text-blue-500" />
            <span>Live Scheduled Interviews</span>
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Real-time WebRTC sessions and Monaco collaborative IDE rooms
          </p>
        </div>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
          {items.length} Scheduled
        </span>
      </div>

      {items.length === 0 ? (
        <div className="py-10 text-center">
          <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-600 dark:text-slate-400">No live interviews scheduled today</p>
          <p className="text-[11px] text-slate-400 mt-1">Schedule an interview with an applicant to launch real-time WebRTC sessions.</p>
          <button
            onClick={() => navigate('/recruiter/schedule')}
            className="mt-4 px-4 py-1.5 rounded-full text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <span>Open Interview Scheduler →</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {items.map((item) => {
            const isBlue = item.colorVariant === 'blue';
            const borderClass = isBlue
              ? 'border-l-4 border-l-blue-600'
              : 'border-l-4 border-l-[#FF5D8F]';

            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl border border-slate-300 dark:border-slate-700 ${borderClass} ${
                  isDark ? 'bg-slate-900/50 hover:bg-slate-900' : 'bg-neutral-50/70 hover:bg-neutral-50'
                } transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm">{item.interviewTitle}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      {item.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
                    <span className="flex items-center gap-1">
                      <UserCheck size={13} className="text-neutral-400" />
                      {item.candidate?.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={13} className="text-neutral-400" />
                      {item.scheduledTime}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/interview/room/${item.id}`)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-sm hover:shadow flex items-center gap-1.5 cursor-pointer self-end sm:self-center"
                >
                  <Video size={14} />
                  <span>Join Room</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ScheduleTimeline;

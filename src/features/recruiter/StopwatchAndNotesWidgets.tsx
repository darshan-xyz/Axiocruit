import React, { useState, useEffect } from 'react';
import { Clock, Pause, Play, RotateCcw, Tag, X, Calendar, ChevronRight, CheckCircle2 } from 'lucide-react';

export const TimeTrackingStopwatch: React.FC = () => {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let timer: any;
    if (isRunning) {
      timer = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning]);

  const formatTime = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-blue-600" />
            <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
              Screening Stopwatch
            </h3>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300">
            {isRunning ? '● Live Recording' : seconds > 0 ? 'Paused' : 'Ready'}
          </span>
        </div>

        <p className="text-xs text-slate-500 mb-4">
          Rubric assessment session time tracker for candidate evaluations.
        </p>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 text-center mb-4">
          <div className="font-mono text-3xl font-black text-slate-900 dark:text-white tracking-wider">
            {formatTime(seconds)}
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-1">
            Active Evaluation Session
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className={`flex-1 py-2 rounded-full font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer ${
            isRunning
              ? 'bg-amber-500 hover:bg-amber-600 text-white'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
        >
          {isRunning ? <><Pause size={13} /> Pause Timer</> : <><Play size={13} /> {seconds > 0 ? 'Resume Timer' : 'Start Timer'}</>}
        </button>
        <button
          onClick={() => { setSeconds(0); setIsRunning(false); }}
          className="p-2 rounded-full border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Reset timer"
        >
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  );
};

export const TagNotesWidget: React.FC = () => {
  const [notes, setNotes] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('axiocruit_recruiter_notes');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      'Debrief candidate pipeline with hiring committee',
      'Calibrate AI semantic rubric for active requisitions'
    ];
  });
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem('axiocruit_recruiter_notes', JSON.stringify(notes));
    } catch (e) {}
  }, [notes]);

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setNotes(prev => [...prev, newNote.trim()]);
    setNewNote('');
  };

  return (
    <div className="bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Tag size={16} className="text-purple-600" />
            <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
              Recruiter Quick Notes
            </h3>
          </div>
          <span className="text-[11px] font-bold text-slate-400">{notes.length} Active</span>
        </div>

        <div className="space-y-2 mb-4 max-h-[170px] overflow-y-auto pr-1">
          {notes.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400 italic">
              No notes saved. Add one below.
            </div>
          ) : (
            notes.map((note, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-800/30 flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />
                <span className="flex-1 leading-snug">{note}</span>
                <button
                  onClick={() => setNotes(prev => prev.filter((_, i) => i !== idx))}
                  className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                >
                  <X size={12} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <form onSubmit={handleAddNote} className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
        <input
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
          placeholder="Add candidate note..."
          className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full px-3.5 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:border-purple-500"
        />
        <button
          type="submit"
          className="px-3 py-1.5 rounded-full bg-purple-600 text-white font-bold text-xs hover:bg-purple-700 transition-colors cursor-pointer"
        >
          Add
        </button>
      </form>
    </div>
  );
};

export const MiniCalendarWidget: React.FC<{ interviews?: any[] }> = ({ interviews = [] }) => {
  const now = new Date();
  const currentMonthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });
  const currentDay = now.getDate();
  const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = new Date(now.getFullYear(), now.getMonth(), 1).getDay();

  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const daysInMonth = Array.from({ length: totalDays }, (_, i) => i + 1);

  // Extract interview days in this month
  const interviewDays = new Set(
    interviews
      .map(item => {
        const d = new Date(item.scheduledTime || item.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() ? d.getDate() : null;
      })
      .filter(Boolean)
  );

  const todayCount = interviews.filter(item => {
    const d = new Date(item.scheduledTime || item.date);
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  }).length;

  return (
    <div className="bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
            {currentMonthName}
          </h3>
          <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">Axiocruit Live ATS</span>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-extrabold text-slate-400 mb-2">
          {daysOfWeek.map(d => (
            <div key={d}>{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {daysInMonth.map(day => {
            const isToday = day === currentDay;
            const hasInterview = interviewDays.has(day);

            return (
              <div
                key={day}
                className={`py-1.5 rounded-xl font-bold flex flex-col items-center justify-center relative ${
                  isToday
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850'
                }`}
              >
                <span>{day}</span>
                {hasInterview && !isToday && (
                  <span className="w-1 h-1 rounded-full bg-blue-500 mt-0.5" />
                )}
                {isToday && (
                  <span className="w-1 h-1 rounded-full bg-white mt-0.5" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-bold text-blue-600 dark:text-blue-400">
          <span className="w-2 h-2 rounded-full bg-blue-600" /> Today: {todayCount} {todayCount === 1 ? 'Interview' : 'Interviews'}
        </span>
        <button
          onClick={() => (window.location.href = '#/recruiter/schedule')}
          className="hover:underline font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
        >
          View Calendar →
        </button>
      </div>
    </div>
  );
};

interface TaskItem {
  id: string;
  interviewTitle: string;
  candidateName: string;
  time: string;
  meetingId?: string;
  color: string;
  done: boolean;
}

export const MyTaskScheduleList: React.FC<{ interviews?: any[] }> = ({ interviews }) => {
  const [completedMap, setCompletedMap] = useState<Record<string, boolean>>({});

  const colorVariants = [
    'border-l-4 border-l-blue-600',
    'border-l-4 border-l-[#FF5D8F]',
    'border-l-4 border-l-emerald-500',
    'border-l-4 border-l-amber-500',
  ];

  const formatInterviewTime = (scheduledTime?: string) => {
    if (!scheduledTime) return 'Scheduled Today';
    try {
      const d = new Date(scheduledTime);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return scheduledTime;
    }
  };

  const tasks: TaskItem[] = (interviews || []).map((item, idx) => {
    const id = item._id || item.id || `task-${idx}`;
    const candidateObj = typeof item.candidate === 'object' && item.candidate !== null ? item.candidate : item.candidateId;
    const candidateName = candidateObj?.name || candidateObj?.firstName || 'Candidate';
    const interviewTitle = item.title || item.job?.title || 'Technical Assessment Round';
    const time = formatInterviewTime(item.scheduledTime);
    const meetingId = item.meetingId || item._id;

    return {
      id,
      interviewTitle,
      candidateName,
      time,
      meetingId,
      color: colorVariants[idx % colorVariants.length],
      done: completedMap[id] !== undefined ? completedMap[id] : item.status === 'Completed',
    };
  });

  const toggleDone = (id: string) => {
    setCompletedMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
              My Task
            </h3>
            <span className="px-2.5 py-0.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 flex items-center gap-1.5 shadow-2xs">
              <span>Today</span>
            </span>
          </div>
          <button
            onClick={() => (window.location.href = '#/recruiter/schedule')}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-black text-slate-800 dark:text-slate-200 hover:bg-slate-50 flex items-center gap-1 shadow-2xs cursor-pointer"
          >
            + ADD TASK
          </button>
        </div>

        {tasks.length === 0 ? (
          <div className="py-8 px-4 text-center rounded-2xl bg-slate-50/60 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 space-y-2">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              No live interview tasks scheduled for today
            </p>
            <p className="text-[11px] text-slate-400">
              All candidate evaluations are up to date.
            </p>
            <button
              onClick={() => (window.location.href = '#/recruiter/schedule')}
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline pt-1 cursor-pointer"
            >
              Open Interview Scheduler <ChevronRight size={13} />
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {tasks.map(t => (
              <div
                key={t.id}
                onClick={() => toggleDone(t.id)}
                className={`p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80 ${t.color} flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-850/60 transition-colors`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold whitespace-nowrap min-w-[90px]">
                    <Clock size={12} />
                    <span>{t.time}</span>
                  </div>
                  <div className="truncate">
                    <p className={`text-xs font-bold truncate ${t.done ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
                      {t.interviewTitle}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">
                      {t.candidateName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {t.meetingId && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `#/interview/room/${t.meetingId}`;
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition cursor-pointer"
                    >
                      Join Room
                    </button>
                  )}
                  <CheckCircle2
                    size={16}
                    className={t.done ? 'text-emerald-500 flex-shrink-0' : 'text-slate-300 dark:text-slate-600 flex-shrink-0'}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

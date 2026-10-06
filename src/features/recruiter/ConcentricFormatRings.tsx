import React from 'react';

export interface ConcentricFormatRingsProps {
  jobs?: any[];
}

export const ConcentricFormatRings: React.FC<ConcentricFormatRingsProps> = ({ jobs }) => {
  const cOuter = 402.12;
  const cMiddle = 301.59;
  const cInner = 201.06;

  const { officePct, hybridPct, remotePct, hasData } = React.useMemo(() => {
    if (jobs === undefined) {
      return { officePct: 60, hybridPct: 30, remotePct: 10, hasData: true };
    }
    const total = jobs.length;
    if (total === 0) {
      return { officePct: 0, hybridPct: 0, remotePct: 0, hasData: false };
    }
    const rem = jobs.filter(j => (j.location && j.location.toLowerCase().includes('remote')) || (j.type && j.type.toLowerCase().includes('remote'))).length;
    const hyb = jobs.filter(j => (j.location && j.location.toLowerCase().includes('hybrid')) || (j.type && j.type.toLowerCase().includes('hybrid'))).length;
    const rPct = Math.round((rem / total) * 100);
    const hPct = Math.round((hyb / total) * 100);
    const oPct = Math.max(0, 100 - rPct - hPct);
    return { officePct: oPct, hybridPct: hPct, remotePct: rPct, hasData: true };
  }, [jobs]);

  return (
    <div className="bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
            Working Format
          </h3>
          <span className="text-[11px] font-bold text-slate-400">Axiocruit Talent Allocation</span>
        </div>

        <div className="flex items-center justify-center py-3 relative">
          <svg width={160} height={160} className="transform -rotate-90">
            {/* Tracks */}
            <circle cx={80} cy={80} r={64} fill="none" stroke="currentColor" strokeWidth={7} className="text-slate-100 dark:text-slate-800" />
            <circle cx={80} cy={80} r={48} fill="none" stroke="currentColor" strokeWidth={7} className="text-slate-100 dark:text-slate-800" />
            <circle cx={80} cy={80} r={32} fill="none" stroke="currentColor" strokeWidth={7} className="text-slate-100 dark:text-slate-800" />

            {/* Outer: Office */}
            {officePct > 0 && (
              <circle
                cx={80} cy={80} r={64} fill="none"
                stroke="#2563EB" strokeWidth={7}
                strokeDasharray={`${cOuter * (officePct / 100)} ${cOuter}`}
                strokeDashoffset={0}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            )}
            {/* Middle: Hybrid */}
            {hybridPct > 0 && (
              <circle
                cx={80} cy={80} r={48} fill="none"
                stroke="#F59E0B" strokeWidth={7}
                strokeDasharray={`${cMiddle * (hybridPct / 100)} ${cMiddle}`}
                strokeDashoffset={0}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            )}
            {/* Inner: Remote */}
            {remotePct > 0 && (
              <circle
                cx={80} cy={80} r={32} fill="none"
                stroke="#10B981" strokeWidth={7}
                strokeDasharray={`${cInner * (remotePct / 100)} ${cInner}`}
                strokeDashoffset={0}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            )}
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xs font-black text-slate-900 dark:text-white">Format</span>
            <span className="text-[9px] font-bold text-slate-400">{hasData ? '100%' : '0%'}</span>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
              <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">Office Attendance</span>
            </div>
            <span className="font-black text-blue-600 dark:text-blue-400">{officePct}%</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
              <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">Hybrid Flexible</span>
            </div>
            <span className="font-black text-amber-500">{hybridPct}%</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
              <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">Full Remote</span>
            </div>
            <span className="font-black text-emerald-600 dark:text-emerald-400">{remotePct}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConcentricFormatRings;

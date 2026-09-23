import React from 'react';

export const ConcentricFormatRings: React.FC = () => {
  const cOuter = 402.12;
  const cMiddle = 301.59;
  const cInner = 201.06;

  return (
    <div className="bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
            Working Format
          </h3>
          <span className="text-[11px] font-bold text-slate-400">Procruit Talent Allocation</span>
        </div>

        <div className="flex items-center justify-center py-3 relative">
          <svg width={160} height={160} className="transform -rotate-90">
            {/* Tracks */}
            <circle cx={80} cy={80} r={64} fill="none" stroke="currentColor" strokeWidth={7} className="text-slate-100 dark:text-slate-800" />
            <circle cx={80} cy={80} r={48} fill="none" stroke="currentColor" strokeWidth={7} className="text-slate-100 dark:text-slate-800" />
            <circle cx={80} cy={80} r={32} fill="none" stroke="currentColor" strokeWidth={7} className="text-slate-100 dark:text-slate-800" />

            {/* Outer: 60% Office */}
            <circle
              cx={80} cy={80} r={64} fill="none"
              stroke="#2563EB" strokeWidth={7}
              strokeDasharray={`${cOuter * 0.60} ${cOuter}`}
              strokeDashoffset={0}
              strokeLinecap="round"
            />
            {/* Middle: 30% Hybrid */}
            <circle
              cx={80} cy={80} r={48} fill="none"
              stroke="#F59E0B" strokeWidth={7}
              strokeDasharray={`${cMiddle * 0.30} ${cMiddle}`}
              strokeDashoffset={0}
              strokeLinecap="round"
            />
            {/* Inner: 10% Remote */}
            <circle
              cx={80} cy={80} r={32} fill="none"
              stroke="#10B981" strokeWidth={7}
              strokeDasharray={`${cInner * 0.10} ${cInner}`}
              strokeDashoffset={0}
              strokeLinecap="round"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xs font-black text-slate-900 dark:text-white">Format</span>
            <span className="text-[9px] font-bold text-slate-400">100%</span>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
              <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">Office Attendance</span>
            </div>
            <span className="font-black text-blue-600 dark:text-blue-400">60%</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
              <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">Hybrid Flexible</span>
            </div>
            <span className="font-black text-amber-500">30%</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
              <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">Full Remote</span>
            </div>
            <span className="font-black text-emerald-600 dark:text-emerald-400">10%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConcentricFormatRings;

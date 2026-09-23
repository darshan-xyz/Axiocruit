import React from 'react';

export const JobsSummaryDonutChart: React.FC = () => {
  const circumference = 345.57; // 2 * PI * 55
  // Published 80, On Hold 20, Internal 18, Closed 15 => Total 133
  return (
    <div className="bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
            Jobs Summary
          </h3>
          <span className="text-slate-400 font-black cursor-pointer text-sm">⋮</span>
        </div>

        <div className="flex flex-col items-center justify-center py-2 relative">
          <svg width={170} height={170} className="transform -rotate-90">
            <circle cx={85} cy={85} r={55} fill="none" stroke="currentColor" strokeWidth={16} className="text-slate-100 dark:text-slate-800" />
            {/* Published: 80 / 133 = 60.15% */}
            <circle
              cx={85} cy={85} r={55} fill="none"
              stroke="#8B5CF6" strokeWidth={16}
              strokeDasharray={`${circumference * (80 / 133)} ${circumference}`}
              strokeDashoffset={0}
              className="transition-all duration-700"
            />
            {/* On Hold: 20 / 133 = 15.04% */}
            <circle
              cx={85} cy={85} r={55} fill="none"
              stroke="#F59E0B" strokeWidth={16}
              strokeDasharray={`${circumference * (20 / 133)} ${circumference}`}
              strokeDashoffset={-(circumference * (80 / 133))}
              className="transition-all duration-700"
            />
            {/* Internal: 18 / 133 = 13.53% */}
            <circle
              cx={85} cy={85} r={55} fill="none"
              stroke="#EC4899" strokeWidth={16}
              strokeDasharray={`${circumference * (18 / 133)} ${circumference}`}
              strokeDashoffset={-(circumference * ((80 + 20) / 133))}
              className="transition-all duration-700"
            />
            {/* Closed: 15 / 133 = 11.28% */}
            <circle
              cx={85} cy={85} r={55} fill="none"
              stroke="#10B981" strokeWidth={16}
              strokeDasharray={`${circumference * (15 / 133)} ${circumference}`}
              strokeDashoffset={-(circumference * ((80 + 20 + 18) / 133))}
              className="transition-all duration-700"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">133</span>
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">TOTAL JOBS</span>
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2 p-2">
            <span className="w-1 h-5 rounded-full bg-[#8B5CF6]" />
            <div>
              <span className="font-black text-slate-900 dark:text-white text-sm">80</span>
              <span className="text-[10px] font-black uppercase text-slate-400 ml-1.5">PUBLISHED</span>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2">
            <span className="w-1 h-5 rounded-full bg-[#F59E0B]" />
            <div>
              <span className="font-black text-slate-900 dark:text-white text-sm">20</span>
              <span className="text-[10px] font-black uppercase text-slate-400 ml-1.5">ON HOLD</span>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2">
            <span className="w-1 h-5 rounded-full bg-[#EC4899]" />
            <div>
              <span className="font-black text-slate-900 dark:text-white text-sm">18</span>
              <span className="text-[10px] font-black uppercase text-slate-400 ml-1.5">INTERNAL</span>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2">
            <span className="w-1 h-5 rounded-full bg-[#10B981]" />
            <div>
              <span className="font-black text-slate-900 dark:text-white text-sm">15</span>
              <span className="text-[10px] font-black uppercase text-slate-400 ml-1.5">CLOSED</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobsSummaryDonutChart;

import React from 'react';

export interface JobsSummaryDonutChartProps {
  jobs?: any[];
}

export const JobsSummaryDonutChart: React.FC<JobsSummaryDonutChartProps> = ({ jobs }) => {
  const circumference = 345.57; // 2 * PI * 55

  const { total, published, onHold, internal, closed } = React.useMemo(() => {
    if (jobs === undefined) {
      // Benchmark distribution fractions: 80 / 133, 20 / 133, 18 / 133, 15 / 133
      return { total: 133, published: 80, onHold: 20, internal: 18, closed: 15 };
    }
    const tot = jobs.length;
    const pub = jobs.filter(j => !j.status || j.status.toLowerCase() === 'active').length;
    const hld = jobs.filter(j => j.status && (j.status.toLowerCase() === 'on hold' || j.status.toLowerCase() === 'on_hold')).length;
    const int = jobs.filter(j => j.status && (j.status.toLowerCase() === 'internal' || j.status.toLowerCase() === 'draft')).length;
    const cls = jobs.filter(j => j.status && j.status.toLowerCase() === 'closed').length;
    return { total: tot, published: pub, onHold: hld, internal: int, closed: cls };
  }, [jobs]);

  const pRatio = total > 0 ? published / total : 0;
  const hRatio = total > 0 ? onHold / total : 0;
  const iRatio = total > 0 ? internal / total : 0;
  const cRatio = total > 0 ? closed / total : 0;

  return (
    <div className="w-full bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-full">
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
            {total > 0 && published > 0 && (
              <circle
                cx={85} cy={85} r={55} fill="none"
                stroke="#8B5CF6" strokeWidth={16}
                strokeDasharray={`${circumference * pRatio} ${circumference}`}
                strokeDashoffset={0}
                className="transition-all duration-700"
              />
            )}
            {total > 0 && onHold > 0 && (
              <circle
                cx={85} cy={85} r={55} fill="none"
                stroke="#F59E0B" strokeWidth={16}
                strokeDasharray={`${circumference * hRatio} ${circumference}`}
                strokeDashoffset={-(circumference * pRatio)}
                className="transition-all duration-700"
              />
            )}
            {total > 0 && internal > 0 && (
              <circle
                cx={85} cy={85} r={55} fill="none"
                stroke="#EC4899" strokeWidth={16}
                strokeDasharray={`${circumference * iRatio} ${circumference}`}
                strokeDashoffset={-(circumference * (pRatio + hRatio))}
                className="transition-all duration-700"
              />
            )}
            {total > 0 && closed > 0 && (
              <circle
                cx={85} cy={85} r={55} fill="none"
                stroke="#10B981" strokeWidth={16}
                strokeDasharray={`${circumference * cRatio} ${circumference}`}
                strokeDashoffset={-(circumference * (pRatio + hRatio + iRatio))}
                className="transition-all duration-700"
              />
            )}
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{total}</span>
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">TOTAL JOBS</span>
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2 p-2">
            <span className="w-1 h-5 rounded-full bg-[#8B5CF6]" />
            <div>
              <span className="font-black text-slate-900 dark:text-white text-sm">{published}</span>
              <span className="text-[10px] font-black uppercase text-slate-400 ml-1.5">PUBLISHED</span>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2">
            <span className="w-1 h-5 rounded-full bg-[#F59E0B]" />
            <div>
              <span className="font-black text-slate-900 dark:text-white text-sm">{onHold}</span>
              <span className="text-[10px] font-black uppercase text-slate-400 ml-1.5">ON HOLD</span>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2">
            <span className="w-1 h-5 rounded-full bg-[#EC4899]" />
            <div>
              <span className="font-black text-slate-900 dark:text-white text-sm">{internal}</span>
              <span className="text-[10px] font-black uppercase text-slate-400 ml-1.5">INTERNAL</span>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2">
            <span className="w-1 h-5 rounded-full bg-[#10B981]" />
            <div>
              <span className="font-black text-slate-900 dark:text-white text-sm">{closed}</span>
              <span className="text-[10px] font-black uppercase text-slate-400 ml-1.5">CLOSED</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobsSummaryDonutChart;

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export interface AnalyticsDataPoint {
  period: string;
  interviews: number;
  hirings: number;
}

const DEFAULT_ANALYTICS_DATA: AnalyticsDataPoint[] = [
  { period: 'Mon', interviews: 12, hirings: 3 },
  { period: 'Tue', interviews: 19, hirings: 5 },
  { period: 'Wed', interviews: 15, hirings: 4 },
  { period: 'Thu', interviews: 22, hirings: 7 },
  { period: 'Fri', interviews: 28, hirings: 9 },
  { period: 'Sat', interviews: 8, hirings: 2 },
  { period: 'Sun', interviews: 5, hirings: 1 },
];

export const AnalyticsChartView: React.FC<{ data?: AnalyticsDataPoint[] }> = ({
  data = DEFAULT_ANALYTICS_DATA,
}) => {
  return (
    <div className="w-full h-48 bg-white dark:bg-[#111726] rounded-2xl p-4 border border-slate-300 dark:border-slate-700">
      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
        Weekly Interview Velocity
      </div>
      <ResponsiveContainer width="100%" height="85%">
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="interviewGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
          <XAxis dataKey="period" stroke="#94a3b8" fontSize={10} tickLine={false} />
          <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0F172A',
              borderColor: '#334155',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#F8FAFC',
            }}
          />
          <Area
            type="monotone"
            dataKey="interviews"
            stroke="#2563EB"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#interviewGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AnalyticsChartView;

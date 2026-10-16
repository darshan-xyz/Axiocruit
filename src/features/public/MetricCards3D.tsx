import React from 'react';
import { ArrowUpRight, TrendingUp, CheckCircle, Users } from 'lucide-react';

interface MetricCards3DProps {
  isDark?: boolean;
}

export const MetricCards3D: React.FC<MetricCards3DProps> = ({ isDark = false }) => {
  return (
    <>
      {/* Card 1: Total Income (Floating bottom-left) */}
      <div
        className={`absolute -left-4 sm:-left-8 lg:-left-12 -bottom-6 sm:-bottom-8 z-20 hidden sm:block [transform:translateZ(50px)] ${
          isDark
            ? 'bg-[#141B2D]/95 border-slate-700 shadow-2xl text-white'
            : 'bg-white/95 border-slate-300 shadow-2xl text-[#111111]'
        } backdrop-blur-md border rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 min-w-[170px] sm:min-w-[210px] transform hover:scale-105 transition-all duration-300 pointer-events-auto select-none`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] sm:text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            Total Income
          </span>
          <span className="inline-flex items-center gap-0.5 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <TrendingUp size={10} />
            ↑ 234.45%
          </span>
        </div>
        <div className="text-xl sm:text-2xl font-black tracking-tight">$234.98K</div>
        <div className="text-[9px] sm:text-[10px] text-neutral-400 dark:text-neutral-500 mt-1">
          Automated talent pipelines
        </div>
      </div>

      {/* Card 2: Top Capsule Badge (Floating top-right) */}
      <div
        className={`absolute -right-3 sm:-right-6 lg:-right-8 -top-4 sm:-top-6 z-20 hidden md:block [transform:translateZ(65px)] ${
          isDark
            ? 'bg-[#141B2D]/95 border-slate-700 shadow-xl text-white'
            : 'bg-white/95 border-slate-300 shadow-xl text-[#111111]'
        } backdrop-blur-md border rounded-full px-3.5 sm:px-4 py-1.5 sm:py-2 flex items-center gap-2 transform hover:scale-105 transition-all duration-300 pointer-events-auto select-none`}
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400">
          ↑ 347.23%
        </span>
        <span className="text-[10px] sm:text-xs font-medium text-neutral-500 dark:text-neutral-400 hidden sm:inline">
          Efficiency Surge
        </span>
      </div>

      {/* Card 3: Resolved Identities (Floating right edge) */}
      <div
        className={`absolute -right-4 sm:-right-8 lg:-right-12 bottom-12 sm:bottom-16 z-20 hidden sm:block [transform:translateZ(55px)] ${
          isDark
            ? 'bg-[#141B2D]/95 border-slate-700 shadow-2xl text-white'
            : 'bg-white/95 border-slate-300 shadow-2xl text-[#111111]'
        } backdrop-blur-md border rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 min-w-[170px] sm:min-w-[200px] transform hover:scale-105 transition-all duration-300 pointer-events-auto select-none`}
      >
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] sm:text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            Resolved Identities
          </span>
          <CheckCircle size={13} className="text-blue-500" />
        </div>
        <div className="text-xl sm:text-2xl font-black tracking-tight mb-2">3,639</div>
        <div className="flex items-center justify-between">
          <div className="flex -space-x-1.5 overflow-hidden">
            <img className="inline-block h-5 w-5 rounded-full ring-2 ring-white dark:ring-slate-900 object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&h=60&fit=crop&crop=face" alt="Avatar" />
            <img className="inline-block h-5 w-5 rounded-full ring-2 ring-white dark:ring-slate-900 object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face" alt="Avatar" />
            <img className="inline-block h-5 w-5 rounded-full ring-2 ring-white dark:ring-slate-900 object-cover" src="https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=60&h=60&fit=crop&crop=face" alt="Avatar" />
          </div>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
            12k+
          </span>
        </div>
      </div>
    </>
  );
};

export default MetricCards3D;

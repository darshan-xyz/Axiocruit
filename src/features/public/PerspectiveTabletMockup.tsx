import React from 'react';
import { MetricCards3D } from './MetricCards3D';

interface PerspectiveTabletMockupProps {
  children: React.ReactNode;
  isDark?: boolean;
}

export const PerspectiveTabletMockup: React.FC<PerspectiveTabletMockupProps> = ({
  children,
  isDark = false,
}) => {
  return (
    <div className="relative max-w-5xl mx-auto [perspective:1400px]">
      {/* Realistic depth drop-shadow underneath */}
      <div
        className={`absolute -bottom-10 left-1/2 -translate-x-1/2 w-[90%] h-16 ${
          isDark ? 'bg-black/60 blur-3xl' : 'bg-[#111111]/25 blur-3xl'
        } rounded-full pointer-events-none`}
        aria-hidden="true"
      />

      {/* Floating 3D Metric Cards */}
      <MetricCards3D isDark={isDark} />

      {/* Tablet Hardware Frame */}
      <div
        className={`relative rounded-[40px] sm:rounded-[48px] ${
          isDark
            ? 'bg-[#10141D] border-[#1E2533] ring-1 ring-white/10'
            : 'bg-[#14181E] border-[#222831] ring-1 ring-white/15'
        } p-3.5 sm:p-5 md:p-6 shadow-2xl border-[6px] sm:border-[8px] sm:[transform:rotateX(13deg)_rotateY(-5deg)_rotateZ(1deg)] [transform-style:preserve-3d] transition-colors`}
      >
        {/* Tablet Camera Hole */}
        <div className="w-3 h-3 rounded-full bg-slate-800 mx-auto mb-3 flex items-center justify-center border border-slate-700/60">
          <div className="w-1.5 h-1.5 rounded-full bg-black" />
        </div>

        {/* Tablet Screen Surface */}
        <div
          className={`relative rounded-[30px] sm:rounded-[36px] ${
            isDark ? 'bg-[#0F172A] border-slate-700 text-slate-100' : 'bg-[#D4F882] border-[#111111]/20 text-left'
          } overflow-hidden border transition-colors`}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default PerspectiveTabletMockup;

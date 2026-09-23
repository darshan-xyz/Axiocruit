import React from 'react';

export type LandingSegment = 'marketing' | 'website_design';

interface SegmentedToggleProps {
  activeSegment: LandingSegment;
  setActiveSegment: (segment: LandingSegment) => void;
  isDark?: boolean;
}

export const SegmentedToggle: React.FC<SegmentedToggleProps> = ({
  activeSegment,
  setActiveSegment,
  isDark = false,
}) => {
  return (
    <div className="flex items-center justify-center my-6">
      <div
        className={`inline-flex p-1.5 rounded-full border shadow-sm transition-all duration-200 ${
          isDark
            ? 'bg-slate-900/90 border-slate-800'
            : 'bg-white/90 border-[#111111]/10'
        }`}
        role="tablist"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeSegment === 'marketing'}
          onClick={() => setActiveSegment('marketing')}
          className={`px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
            activeSegment === 'marketing'
              ? isDark
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-[#111111] text-white shadow-md'
              : isDark
              ? 'text-slate-400 hover:text-slate-200'
              : 'text-[#111111]/70 hover:text-[#111111]'
          }`}
        >
          Marketing
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeSegment === 'website_design'}
          onClick={() => setActiveSegment('website_design')}
          className={`px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
            activeSegment === 'website_design'
              ? isDark
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-[#111111] text-white shadow-md'
              : isDark
              ? 'text-slate-400 hover:text-slate-200'
              : 'text-[#111111]/70 hover:text-[#111111]'
          }`}
        >
          Website design
        </button>
      </div>
    </div>
  );
};

export default SegmentedToggle;

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/core/ThemeContext';
import {
  DoodleSearchVector,
  DoodleClickVector,
  DoodleStackVector,
  DoodleChartsVector,
} from './DoodleVectors';

export const FeatureComparisonMatrix: React.FC = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  return (
    <section id="features" className={`py-24 px-4 ${
      isDark ? 'bg-[#080C14] border-slate-800' : 'bg-[#FAF9F5] border-slate-200/80'
    } border-b transition-colors duration-200`}>
      <div className="max-w-6xl mx-auto">

        {/* Headline with highlighter pill */}
        <div className="mb-14">
          <h2 className={`text-3xl sm:text-5xl font-black ${
            isDark ? 'text-white' : 'text-[#111111]'
          } tracking-tight leading-[1.15] max-w-3xl`}>
            If all{' '}
            <span className={`${
              isDark ? 'bg-lime-400/20 text-lime-300 border border-lime-400/40' : 'bg-[#D4F882] text-[#111111]'
            } px-4 py-1 rounded-2xl inline-block mx-1 transform -rotate-1 shadow-sm`}>
              your hiring needs
            </span>{' '}
            and wants were a place – that's us.
          </h2>
          <p className={`text-sm sm:text-base ${
            isDark ? 'text-slate-400' : 'text-slate-600'
          } mt-4 max-w-2xl font-normal leading-relaxed`}>
            We analyzed over 14 million candidate interactions, fine-tuned semantic embeddings, and developed the ULTIMATE recruitment intelligence that'll have you asking, "Do they read minds?"
          </p>
        </div>

        {/* 4 Cards Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* CARD 1: Clean White in Light / Deep Slate in Dark */}
          <div className={`${
            isDark ? 'bg-[#111726] border-slate-800 text-slate-100' : 'bg-white border-slate-200/80 text-[#111111]'
          } rounded-[32px] p-8 border shadow-md flex flex-col justify-between group hover:shadow-xl transition-all duration-300`}>
            <div className="flex justify-between items-start">
              <div className="max-w-[280px]">
                <span className={`${
                  isDark ? 'bg-lime-400/20 text-lime-300 border border-lime-400/40' : 'bg-[#D4F882] text-[#111111]'
                } font-extrabold text-base px-4 py-1.5 rounded-2xl inline-block mb-4 shadow-sm`}>
                  Resume & Semantic AI Screening
                </span>
                <p className={`text-xs sm:text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'} leading-relaxed mt-2`}>
                  Multi-dimensional vector scoring against custom rubrics eliminates manual resume scanning while guaranteeing strict objective fairness.
                </p>
              </div>
              <div className={isDark ? 'text-white [&_circle]:stroke-white [&_line]:stroke-white [&_path]:stroke-white' : ''}>
                <DoodleSearchVector />
              </div>
            </div>

            <div className={`pt-6 mt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'} flex items-center gap-3`}>
              <button
                onClick={() => navigate('/signup')}
                className={`w-8 h-8 rounded-full ${
                  isDark ? 'bg-lime-400 text-slate-950' : 'bg-[#D4F882] text-[#111111]'
                } flex items-center justify-center font-bold text-sm group-hover:scale-110 transition-transform shadow-sm cursor-pointer`}
              >
                ↗
              </button>
              <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#111111]'} uppercase tracking-wider`}>Learn More</span>
            </div>
          </div>

          {/* CARD 2: Light Grey-Blue (#CBD5E1) in Light / Dark Steel (#1E293B) in Dark */}
          <div className={`${
            isDark ? 'bg-[#1E293B] border border-slate-700/70 text-slate-100' : 'bg-[#CBD5E1] text-[#111111]'
          } rounded-[32px] p-8 shadow-md flex flex-col justify-between group hover:shadow-xl transition-all duration-300`}>
            <div className="flex justify-between items-start">
              <div className="max-w-[280px]">
                <span className={`${
                  isDark ? 'bg-white/10 text-white border border-white/20' : 'bg-white text-[#111111]'
                } font-extrabold text-base px-4 py-1.5 rounded-2xl inline-block mb-4 shadow-sm`}>
                  Technical Coding Assessments
                </span>
                <p className={`text-xs sm:text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'} leading-relaxed mt-2`}>
                  Interactive Monaco-powered coding sandbox featuring automated unit test runners, AST execution audits, and algorithmic scoring.
                </p>
              </div>
              <div className={isDark ? 'text-white [&_circle]:stroke-white [&_line]:stroke-white [&_path]:stroke-white [&_rect]:stroke-white' : ''}>
                <DoodleClickVector />
              </div>
            </div>

            <div className={`pt-6 mt-4 border-t ${isDark ? 'border-slate-700/50' : 'border-[#111111]/10'} flex items-center gap-3`}>
              <button
                onClick={() => navigate('/signup')}
                className="w-8 h-8 rounded-full bg-white text-[#111111] flex items-center justify-center font-bold text-sm group-hover:scale-110 transition-transform shadow-sm cursor-pointer"
              >
                ↗
              </button>
              <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#111111]'} uppercase tracking-wider`}>Learn More</span>
            </div>
          </div>

          {/* CARD 3: Deep Forest (#587150) in Light / Deep Emerald (#064E3B) in Dark */}
          <div className={`${
            isDark ? 'bg-[#064E3B] border border-emerald-800/80' : 'bg-[#587150]'
          } text-white rounded-[32px] p-8 shadow-md flex flex-col justify-between group hover:shadow-xl transition-all duration-300`}>
            <div className="flex justify-between items-start">
              <div className="max-w-[280px]">
                <span className={`${
                  isDark ? 'bg-lime-400 text-slate-950' : 'bg-[#D4F882] text-[#111111]'
                } font-extrabold text-base px-4 py-1.5 rounded-2xl inline-block mb-4 shadow-sm`}>
                  Real-Time Anti-Cheat Proctoring
                </span>
                <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed mt-2">
                  MediaPipe face-mesh, gaze orientation tracking, ambient speech anomaly detection, and tab-focus lockdown to safeguard integrity.
                </p>
              </div>
              <DoodleStackVector />
            </div>

            <div className="pt-6 mt-4 border-t border-white/15 flex items-center gap-3">
              <button
                onClick={() => navigate('/signup')}
                className={`w-8 h-8 rounded-full ${
                  isDark ? 'bg-lime-400 text-slate-950' : 'bg-[#D4F882] text-[#111111]'
                } flex items-center justify-center font-bold text-sm group-hover:scale-110 transition-transform shadow-sm cursor-pointer`}
              >
                ↗
              </button>
              <span className="text-xs font-bold text-white uppercase tracking-wider">Learn More</span>
            </div>
          </div>

          {/* CARD 4: Pitch Dark Charcoal (#212121) in Light / Pitch Obsidian (#0B0F19) in Dark */}
          <div className={`${
            isDark ? 'bg-[#0B0F19] border border-slate-800' : 'bg-[#212121]'
          } text-white rounded-[32px] p-8 shadow-md flex flex-col justify-between group hover:shadow-xl transition-all duration-300`}>
            <div className="flex justify-between items-start">
              <div className="max-w-[280px]">
                <span className="bg-white text-[#111111] font-extrabold text-base px-4 py-1.5 rounded-2xl inline-block mb-4 shadow-sm">
                  Verified Freelance Interviewers
                </span>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mt-2">
                  On-demand marketplace connecting your team with vetted senior engineers and hiring managers to scale interview capacity on demand.
                </p>
              </div>
              <DoodleChartsVector />
            </div>

            <div className="pt-6 mt-4 border-t border-white/10 flex items-center gap-3">
              <button
                onClick={() => navigate('/signup')}
                className={`w-8 h-8 rounded-full ${
                  isDark ? 'bg-blue-600 text-white' : 'bg-[#D4F882] text-[#111111]'
                } flex items-center justify-center font-bold text-sm group-hover:scale-110 transition-transform shadow-sm cursor-pointer`}
              >
                ↗
              </button>
              <span className="text-xs font-bold text-white uppercase tracking-wider">Learn More</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default FeatureComparisonMatrix;

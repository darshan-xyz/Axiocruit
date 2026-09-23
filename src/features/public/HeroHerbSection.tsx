import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Info } from 'lucide-react';
import { useTheme } from '@/core/ThemeContext';

export const HeroHerbSection: React.FC = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [activeSegment, setActiveSegment] = useState<'marketing' | 'website_design' | 'ats' | 'proctoring'>('marketing');

  return (
    <section className={`relative pt-10 pb-20 md:pt-14 md:pb-24 px-4 overflow-hidden border-b border-[#111111]/10 transition-colors duration-200 ${
      isDark ? 'bg-[#0A0E1A] border-slate-800' : 'bg-[#D4F882]'
    }`}>
      {/* Top Procruit Platform Badge */}
      <div className="flex justify-center mb-8">
        <div
          className={`${
            isDark ? 'bg-[#111726] border border-slate-800 shadow-xl' : 'bg-[#111111]'
          } text-white px-5 py-2.5 rounded-2xl shadow-md text-center inline-block cursor-pointer transition-colors`}
          onClick={() => navigate('/')}
        >
          <div className="text-xl font-black tracking-tight leading-none">PROCRUIT</div>
          <div className="text-[9px] font-black tracking-[0.25em] uppercase text-lime-400 mt-0.5">AUTONOMOUS TALENT HUB</div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto text-center relative z-10">

        {/* 3D Perspective Tablet Mockup Container */}
        <div className="relative max-w-5xl mx-auto [perspective:1200px]">
          {/* Depth drop-shadow underneath */}
          <div
            className={`absolute -bottom-8 sm:-bottom-12 left-1/2 -translate-x-1/2 w-[90%] h-16 ${
              isDark ? 'bg-black/60 blur-2xl rounded-full' : 'bg-[#111111]/25 blur-2xl rounded-full'
            } pointer-events-none`}
            aria-hidden="true"
          />

          {/* Floating 3D Metric Card 1: Total Income (bottom-left) */}
          <div className={`absolute -left-6 sm:-left-12 -bottom-6 sm:-bottom-8 z-20 hidden sm:block [transform:translateZ(50px)] ${
            isDark ? 'bg-[#141B2D]/95 border-slate-700/80 text-white' : 'bg-white/95 border-neutral-200/80 text-[#111111]'
          } backdrop-blur-md border rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 min-w-[170px] sm:min-w-[210px] shadow-2xl pointer-events-auto text-left`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] sm:text-xs font-semibold text-neutral-500 uppercase tracking-wider">Total Income</span>
              <span className="inline-flex items-center gap-0.5 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                ↑ 234.45%
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black tracking-tight">$234.98K</div>
          </div>

          {/* Floating 3D Metric Card 2: Top Pill (top-right) */}
          <div className={`absolute -right-4 sm:-right-8 -top-4 sm:-top-6 z-20 hidden md:block [transform:translateZ(65px)] ${
            isDark ? 'bg-[#141B2D]/95 border-slate-700/80 text-white' : 'bg-white/95 border-neutral-200/80 text-[#111111]'
          } backdrop-blur-md border rounded-full px-3.5 sm:px-4 py-1.5 sm:py-2 flex items-center gap-2 shadow-xl pointer-events-auto`}>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs sm:text-sm font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
              ↑ 347.23%
            </span>
          </div>

          {/* Floating 3D Metric Card 3: Resolved Identities (right) */}
          <div className={`absolute -right-6 sm:-right-12 bottom-12 sm:bottom-16 z-20 hidden sm:block [transform:translateZ(55px)] ${
            isDark ? 'bg-[#141B2D]/95 border-slate-700/80 text-white' : 'bg-white/95 border-neutral-200/80 text-[#111111]'
          } backdrop-blur-md border rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 min-w-[170px] sm:min-w-[200px] shadow-2xl pointer-events-auto text-left`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] sm:text-xs font-semibold text-neutral-500 uppercase tracking-wider">Resolved Identities</span>
            </div>
            <div className="text-xl sm:text-2xl font-black tracking-tight mb-2">3,639</div>
            <div className="flex items-center justify-between">
              <div className="flex -space-x-1.5 overflow-hidden">
                <span className="inline-block h-5 w-5 rounded-full bg-slate-300 ring-2 ring-white" />
                <span className="inline-block h-5 w-5 rounded-full bg-slate-400 ring-2 ring-white" />
                <span className="inline-block h-5 w-5 rounded-full bg-slate-500 ring-2 ring-white" />
              </div>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600">
                12k+
              </span>
            </div>
          </div>

          {/* Tablet Hardware Frame */}
          <div className={`relative rounded-[36px] sm:rounded-[42px] bg-[#1a1e24] border-4 sm:border-[5px] border-[#2b323c] sm:[transform:rotateX(13deg)_rotateY(-5deg)_rotateZ(1deg)] [transform-style:preserve-3d] ${
            isDark ? 'ring-1 ring-white/10' : 'ring-1 ring-white/15'
          } p-3.5 sm:p-5 md:p-6 shadow-2xl transition-colors`}>
            {/* Tablet Camera Hole */}
            <div className="w-3 h-3 rounded-full bg-slate-800 mx-auto mb-3 flex items-center justify-center border border-slate-700/60">
              <div className="w-1.5 h-1.5 rounded-full bg-black" />
            </div>

            {/* Tablet Screen Surface */}
            <div className={`relative rounded-[30px] sm:rounded-[36px] ${
              isDark ? 'bg-[#0F172A] border-slate-800 text-slate-100' : 'bg-[#D4F882] border-[#111111]/10 text-left'
            } overflow-hidden border transition-colors`}>

              {/* 1. Header inside Tablet Screen */}
              <div className="flex items-center justify-between px-6 sm:px-10 pt-6 sm:pt-8 pb-4">
                <div className={`${
                  isDark ? 'bg-slate-800 border border-slate-700' : 'bg-[#111111]'
                } text-white px-4 py-1.5 rounded-xl shadow-xs text-center cursor-pointer transition-colors`} onClick={() => navigate('/')}>
                  <span className="text-sm font-black tracking-tight block leading-none">PROCRUIT</span>
                  <span className="text-[7px] font-black tracking-[0.2em] uppercase text-lime-300 block">INTELLIGENCE</span>
                </div>

                <div className={`hidden md:flex items-center space-x-8 text-xs font-black ${
                  isDark ? 'text-slate-300' : 'text-[#111111]'
                }`}>
                  <a href="#features" className="hover:opacity-75 transition-opacity">ATS Engine</a>
                  <a href="#proctoring" className="hover:opacity-75 transition-opacity">AI Proctoring</a>
                  <a href="#assessments" className="hover:opacity-75 transition-opacity">Coding Sandbox</a>
                </div>

                <button
                  onClick={() => navigate('/signup')}
                  className={`${
                    isDark
                      ? 'bg-white text-slate-900 border-white hover:bg-slate-100'
                      : 'bg-white text-[#111111] border-[#111111] hover:bg-neutral-50'
                  } font-black text-xs px-5 py-2 rounded-full shadow-xs transition-all flex items-center gap-1.5 cursor-pointer`}
                >
                  <span>Get Started</span>
                  <ArrowUpRight size={14} />
                </button>
              </div>

              {/* 2. Hero Headline inside Tablet Screen */}
              <div className="text-center px-4 sm:px-8 pt-6 sm:pt-10 pb-6 max-w-4xl mx-auto">
                <h1 className={`text-4xl sm:text-6xl md:text-7xl lg:text-[80px] font-black tracking-tight leading-[1.06] ${
                  isDark ? 'text-white' : 'text-[#111111]'
                } uppercase max-w-4xl mx-auto mb-4`}>
                  THE ONLY RECRUITMENT{' '}
                  <span className={`inline-block ${
                    isDark ? 'bg-white/10 text-white border border-white/20' : 'bg-white text-[#111111] border border-[#111111]/10'
                  } px-3 sm:px-5 py-1 rounded-2xl md:rounded-3xl shadow-sm align-middle mx-1`}>
                    [TALENT]
                  </span>{' '}
                  <span className={`inline-block ${
                    isDark ? 'bg-white/10 text-white border border-white/20' : 'bg-white text-[#111111] border border-[#111111]/10'
                  } px-3 sm:px-5 py-1 rounded-2xl md:rounded-3xl shadow-sm align-middle mx-1`}>
                    [HUB]
                  </span>{' '}
                  HUB YOU'LL EVER NEED.
                </h1>

                <p className={`text-xs sm:text-sm md:text-base ${
                  isDark ? 'text-slate-300' : 'text-[#111111]/85'
                } max-w-xl mx-auto font-medium leading-relaxed mb-6`}>
                  Engineered for high-growth engineering teams and talent leaders. Screen resumes with semantic embeddings, run real-time proctored Monaco coding assessments, and scale verified technical hiring 10x faster.
                </p>

                {/* Action CTAs */}
                <div className="flex flex-wrap items-center justify-center gap-3.5 mb-8">
                  <button
                    onClick={() => navigate('/signup')}
                    className={`${
                      isDark
                        ? 'bg-blue-600 text-white border border-blue-500 hover:bg-blue-500 shadow-blue-500/20'
                        : 'bg-white text-[#111111] border border-[#111111]/80 hover:bg-neutral-100'
                    } font-black text-xs sm:text-sm px-6 py-3 rounded-full shadow-sm hover:shadow-md transition-all flex items-center gap-2 group cursor-pointer`}
                  >
                    <span>Get Started</span>
                    <ArrowUpRight size={15} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </button>
                  <button
                    onClick={() => {
                      const el = document.getElementById('features');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`${
                      isDark
                        ? 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-700'
                        : 'bg-[#111111] text-white hover:bg-black'
                    } font-black text-xs sm:text-sm px-6 py-3 rounded-full shadow-sm hover:shadow-md transition-all flex items-center gap-2 group cursor-pointer`}
                  >
                    <span>Explore Platform</span>
                    <ArrowUpRight size={15} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </button>
                </div>

                {/* Segmented Pill Toggle */}
                <div className="flex items-center justify-center my-6">
                  <div className={`p-1.5 rounded-full border inline-flex ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#111111]/10'}`}>
                    <button
                      type="button"
                      onClick={() => setActiveSegment('marketing')}
                      className={`px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                        activeSegment === 'marketing'
                          ? (isDark ? 'bg-blue-600 text-white shadow-md' : 'bg-[#111111] text-white shadow-md')
                          : (isDark ? 'text-slate-400 hover:text-white' : 'text-[#111111]/70 hover:text-[#111111]')
                      }`}
                    >
                      Marketing
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSegment('website_design')}
                      className={`px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                        activeSegment === 'website_design'
                          ? (isDark ? 'bg-blue-600 text-white shadow-md' : 'bg-[#111111] text-white shadow-md')
                          : (isDark ? 'text-slate-400 hover:text-white' : 'text-[#111111]/70 hover:text-[#111111]')
                      }`}
                    >
                      Website design
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. Organic Curved Landscape Horizon in Lower Half */}
              <div className="relative pt-6 px-4 sm:px-12 pb-0">
                <div
                  className={`absolute inset-x-0 bottom-0 top-12 ${
                    isDark ? 'bg-[#0E1726]' : 'bg-[#263D29]'
                  } rounded-t-[120px] sm:rounded-t-[200px] pointer-events-none transition-colors`}
                  style={{ transform: 'scale(1.05)' }}
                />

                {/* 4. Dashboard Window rising up inside the tablet */}
                <div className={`relative z-10 ${
                  isDark ? 'bg-[#111726] border-slate-800 text-slate-100 shadow-2xl' : 'bg-white border-slate-200/90 text-slate-900'
                } rounded-t-[28px] sm:rounded-t-[34px] p-4 sm:p-7 shadow-2xl border-t border-x max-w-4xl mx-auto transition-colors`}>
                  <div className="absolute -top-4 left-10 sm:left-16 z-30">
                    <div className={`${
                      isDark ? 'bg-slate-800 text-white border-slate-700' : 'bg-white text-slate-900 border-slate-200'
                    } font-black text-xs px-3.5 py-1.5 rounded-full shadow-lg border flex items-center gap-1.5 transition-colors`}>
                      <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-black">
                        ↑
                      </span>
                      <span className="tracking-tight font-black">98.6% Accuracy</span>
                    </div>
                  </div>

                  {/* Window Header */}
                  <div className={`flex flex-wrap items-center justify-between pb-3 mb-4 border-b ${
                    isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500'
                  } text-xs gap-2`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-lg ${
                        isDark ? 'bg-blue-600' : 'bg-[#111111]'
                      } text-white flex items-center justify-center text-[10px] font-black`}>
                        P
                      </div>
                      <div>
                        <span className={`font-extrabold ${isDark ? 'text-white' : 'text-slate-900'} text-xs sm:text-sm block leading-none`}>Procruit Talent Cloud</span>
                        <span className="text-[10px] text-slate-400 font-medium">133 Requisitions Active</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Sprint Analytics</span>
                      <div className={`flex items-center gap-1 ${
                        isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                      } px-2.5 py-1 rounded-lg text-[10px] font-mono`}>
                        <span>📅 2026-09-01</span>
                        <span>&gt;</span>
                        <span>2026-09-30</span>
                      </div>
                    </div>
                  </div>

                  {/* Tabs row */}
                  <div className={`flex items-center gap-4 text-[11px] font-bold ${
                    isDark ? 'text-slate-400 border-slate-800' : 'text-slate-500 border-slate-100'
                  } border-b pb-2.5 mb-4 overflow-x-auto`}>
                    <span className={`${
                      isDark ? 'text-white border-emerald-400' : 'text-slate-900 border-emerald-600'
                    } font-black border-b-2 pb-2`}>ATS Sourcing</span>
                    <span className="hover:text-slate-300 cursor-pointer">Proctored Code</span>
                    <span className="hover:text-slate-300 cursor-pointer">Candidate Ranking</span>
                    <span className="hover:text-slate-300 cursor-pointer">Live Interviews</span>
                  </div>

                  {activeSegment === 'marketing' ? (
                    <div>
                      <div className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-800'} mb-3 flex items-center justify-between`}>
                        <span>Marketing Acquisition</span>
                        <span className="text-[10px] font-medium text-slate-400">Pipeline Progression & Sourcing Activity</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4 text-[11px]">
                        <div className={`p-2.5 rounded-xl ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-100'} border`}>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Resolved Candidates</span>
                          <div className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'} mt-0.5`}>3,639</div>
                        </div>
                        <div className={`p-2.5 rounded-xl ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-100'} border`}>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Inbound Reach</span>
                          <div className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'} mt-0.5`}>84.5k</div>
                        </div>
                        <div className={`p-2.5 rounded-xl ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-100'} border`}>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Interviews Conducted</span>
                          <div className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'} mt-0.5`}>1,248</div>
                        </div>
                        <div className={`p-2.5 rounded-xl ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-100'} border`}>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Avg AI Match Score</span>
                          <div className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'} mt-0.5`}>88.4%</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-800'} mb-3 flex items-center justify-between`}>
                        <span>Website Design & UI/UX</span>
                        <span className="text-[10px] font-medium text-slate-400">Creative Portfolio Scoring & UI Benchmarks</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4 text-[11px]">
                        <div className={`p-2.5 rounded-xl ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-100'} border`}>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Design Submissions</span>
                          <div className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'} mt-0.5`}>842</div>
                        </div>
                        <div className={`p-2.5 rounded-xl ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-100'} border`}>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Figma & UI Audits</span>
                          <div className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'} mt-0.5`}>629</div>
                        </div>
                        <div className={`p-2.5 rounded-xl ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-100'} border`}>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Senior Design Reviews</span>
                          <div className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'} mt-0.5`}>312</div>
                        </div>
                        <div className={`p-2.5 rounded-xl ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-100'} border`}>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Creative Benchmarks</span>
                          <div className="text-base font-black text-emerald-500 mt-0.5">96.8%</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Candidate Match Score Distribution Bar Chart */}
                  <div className={`p-3.5 rounded-xl ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-100'} border`}>
                    <div className={`flex justify-between items-center mb-2 text-[10px] font-bold ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      <span>CANDIDATE MATCH SCORE DISTRIBUTION</span>
                      <span>INTERVIEW READINESS %</span>
                    </div>
                    <div className="flex items-end justify-between h-20 px-4 gap-3">
                      {[25, 65, 95, 45, 80, 55, 75, 40].map((h, idx) => (
                        <div key={idx} className={`flex-1 ${isDark ? 'bg-emerald-950/40' : 'bg-emerald-100/60'} rounded-t-md flex flex-col justify-end h-full`}>
                          <div className={`${isDark ? 'bg-emerald-500 hover:bg-emerald-400' : 'bg-[#1B5E20] hover:bg-[#2E7D32]'} rounded-t-md w-full transition-all duration-300`} style={{ height: `${h}%` }} />
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>

            </div>

            {/* FLOATING 3D METRIC CARDS OVERLAPPING TABLET EDGES */}
            <div className="absolute -left-3 sm:-left-8 md:-left-12 top-[48%] sm:top-[52%] -translate-y-1/2 z-30 hidden sm:block pointer-events-auto">
              <div className={`${
                isDark ? 'bg-[#111726]/95 border-slate-700 text-slate-100 shadow-black/60' : 'bg-white/95 border-slate-200/90 text-slate-900'
              } backdrop-blur-md rounded-2xl p-4 sm:p-5 shadow-2xl border text-left min-w-[210px] transform hover:scale-105 transition-all`}>
                <div className="flex items-center justify-between gap-3 mb-1">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Active Pipeline</span>
                  <div className={`w-4 h-4 rounded-full ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-400'} flex items-center justify-center text-[10px]`}>
                    <Info size={10} />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black tracking-tight">1,284</div>
                <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-black text-emerald-500 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full shadow-2xs">
                  <span>↑</span> 87.4% Match Rate
                </div>
              </div>
            </div>

            <div className="absolute -right-3 sm:-right-8 md:-right-12 top-[40%] sm:top-[44%] -translate-y-1/2 z-30 hidden sm:block pointer-events-auto">
              <div className={`${
                isDark ? 'bg-[#111726]/95 border-slate-700 text-slate-100 shadow-black/60' : 'bg-white/95 border-slate-200/90 text-slate-900'
              } backdrop-blur-md rounded-2xl p-4 sm:p-5 shadow-2xl border text-left min-w-[225px] transform hover:scale-105 transition-all`}>
                <div className="flex items-center justify-between gap-3 mb-1">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Verified Engineers</span>
                  <div className={`w-4 h-4 rounded-full ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-400'} flex items-center justify-center text-[10px]`}>
                    <Info size={10} />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black tracking-tight">3,639</div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-black text-emerald-500 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full shadow-2xs">
                    ↑ 99.8% Integrity
                  </span>
                  <div className="flex items-center -space-x-1.5">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&fit=crop&crop=faces"
                      className="w-5 h-5 rounded-full border-2 border-white object-cover"
                      alt="Talent 1"
                    />
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=faces"
                      className="w-5 h-5 rounded-full border-2 border-white object-cover"
                      alt="Talent 2"
                    />
                    <img
                      src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&fit=crop&crop=faces"
                      className="w-5 h-5 rounded-full border-2 border-white object-cover"
                      alt="Talent 3"
                    />
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[9px] font-black flex items-center justify-center border-2 border-white shadow-2xs">
                      ✓
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Segmented Pill Toggle: Sourcing vs Live Proctoring */}
        <div className={`mt-14 sm:mt-16 inline-flex items-center gap-1.5 ${
          isDark ? 'bg-[#111726] border-slate-800' : 'bg-[#1C241E] border-[#111111]/20'
        } p-1.5 rounded-full border shadow-lg transition-colors`}>
          <button
            type="button"
            onClick={() => setActiveSegment('ats')}
            className={`px-6 sm:px-8 py-2.5 rounded-full text-xs sm:text-sm font-black transition-all duration-200 cursor-pointer ${
              activeSegment === 'ats'
                ? (isDark ? 'bg-blue-600 text-white shadow-sm' : 'bg-[#2A382D] text-white shadow-sm')
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Autonomous ATS & Sourcing
          </button>
          <button
            type="button"
            onClick={() => setActiveSegment('proctoring')}
            className={`px-6 sm:px-8 py-2.5 rounded-full text-xs sm:text-sm font-black transition-all duration-200 cursor-pointer ${
              activeSegment === 'proctoring'
                ? (isDark ? 'bg-white text-slate-900 shadow-md' : 'bg-white text-[#111111] shadow-md')
                : 'bg-transparent text-slate-400 hover:text-white'
            }`}
          >
            AI Proctoring & Live Coding
          </button>
        </div>

        {/* Dynamic Module Spotlight */}
        <div className="mt-8 max-w-4xl mx-auto transition-all duration-300">
          {activeSegment === 'ats' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-left">
              <div className={`${
                isDark ? 'bg-[#111726]/90 border-slate-800 text-slate-200' : 'bg-white/90 border-[#111111]/10 text-[#111111]'
              } backdrop-blur-md p-4 rounded-2xl border shadow-sm transition-colors`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <h4 className={`font-extrabold text-xs ${isDark ? 'text-white' : 'text-[#111111]'} uppercase tracking-wider`}>Semantic CV Parser</h4>
                </div>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-[#111111]/80'} leading-relaxed font-medium`}>
                  Converts unstructured PDF resumes into normalized vector embeddings using SentenceTransformers for calibrated semantic matching.
                </p>
              </div>
              <div className={`${
                isDark ? 'bg-[#111726]/90 border-slate-800 text-slate-200' : 'bg-white/90 border-[#111111]/10 text-[#111111]'
              } backdrop-blur-md p-4 rounded-2xl border shadow-sm transition-colors`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <h4 className={`font-extrabold text-xs ${isDark ? 'text-white' : 'text-[#111111]'} uppercase tracking-wider`}>Automated Fit Scoring</h4>
                </div>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-[#111111]/80'} leading-relaxed font-medium`}>
                  Calculates dual-tone match percentages, detects missing technical proficiencies, and highlights verified engineering strengths.
                </p>
              </div>
              <div className={`${
                isDark ? 'bg-[#111726]/90 border-slate-800 text-slate-200' : 'bg-white/90 border-[#111111]/10 text-[#111111]'
              } backdrop-blur-md p-4 rounded-2xl border shadow-sm transition-colors`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  <h4 className={`font-extrabold text-xs ${isDark ? 'text-white' : 'text-[#111111]'} uppercase tracking-wider`}>1-Click Pipeline Sync</h4>
                </div>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-[#111111]/80'} leading-relaxed font-medium`}>
                  Automatically schedules verified applicants into technical assessment stages with calibrated candidate drawer inspections.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-left">
              <div className={`${
                isDark ? 'bg-[#111726]/90 border-slate-800 text-slate-200' : 'bg-white/90 border-[#111111]/10 text-[#111111]'
              } backdrop-blur-md p-4 rounded-2xl border shadow-sm transition-colors`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <h4 className={`font-extrabold text-xs ${isDark ? 'text-white' : 'text-[#111111]'} uppercase tracking-wider`}>MediaPipe Face-Mesh</h4>
                </div>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-[#111111]/80'} leading-relaxed font-medium`}>
                  468 facial landmarks track pupil gaze angle, secondary face detections, and head orientation anomalies in real time.
                </p>
              </div>
              <div className={`${
                isDark ? 'bg-[#111726]/90 border-slate-800 text-slate-200' : 'bg-white/90 border-[#111111]/10 text-[#111111]'
              } backdrop-blur-md p-4 rounded-2xl border shadow-sm transition-colors`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <h4 className={`font-extrabold text-xs ${isDark ? 'text-white' : 'text-[#111111]'} uppercase tracking-wider`}>Monaco Code Sandbox</h4>
                </div>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-[#111111]/80'} leading-relaxed font-medium`}>
                  Full VS Code-grade IDE with automated test runners, algorithmic validation, and real-time AST execution audits.
                </p>
              </div>
              <div className={`${
                isDark ? 'bg-[#111726]/90 border-slate-800 text-slate-200' : 'bg-white/90 border-[#111111]/10 text-[#111111]'
              } backdrop-blur-md p-4 rounded-2xl border shadow-sm transition-colors`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <h4 className={`font-extrabold text-xs ${isDark ? 'text-white' : 'text-[#111111]'} uppercase tracking-wider`}>Integrity Audit Logs</h4>
                </div>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-[#111111]/80'} leading-relaxed font-medium`}>
                  Generates tamper-proof assessment logs capturing tab-switches, clipboard paste detections, and WebRTC audio telemetry.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </section>
  );
};

export default HeroHerbSection;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Info, CheckCircle2, Shield, Sparkles, TrendingUp } from 'lucide-react';
import { useTheme } from '@/core/ThemeContext';
import { SegmentedToggle, LandingSegment } from './SegmentedToggle';
import { PerspectiveTabletMockup } from './PerspectiveTabletMockup';

export const HeroHerbSection: React.FC = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [activeSegment, setActiveSegment] = useState<LandingSegment>('marketing');
  const [activeModule, setActiveModule] = useState<'ats' | 'proctoring'>('ats');

  return (
    <section
      id="platform"
      className={`relative pt-10 pb-20 md:pt-16 md:pb-28 px-4 sm:px-6 lg:px-12 overflow-hidden border-b border-[#111111]/10 transition-colors duration-200 ${
        isDark ? 'bg-[#0A0E1A] border-slate-700 text-slate-100' : 'bg-[#D4F882] text-[#111111]'
      }`}
    >
      {/* Background glow effects */}
      <div
        className={`absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] ${
          isDark ? 'bg-blue-600/10 blur-[120px]' : 'bg-white/40 blur-[100px]'
        } rounded-full pointer-events-none`}
        aria-hidden="true"
      />

      <div className="max-w-6xl mx-auto text-center relative z-10">
        {/* Top Axiocruit Platform Pill Badge */}
        <div className="flex justify-center mb-6">
          <div
            className={`${
              isDark ? 'bg-[#111726] border border-slate-700 text-slate-200 shadow-xl' : 'bg-[#111111] text-white'
            } px-4 py-2 rounded-2xl shadow-md text-center inline-flex items-center gap-2 cursor-pointer transition-transform hover:scale-105`}
            onClick={() => navigate('/')}
          >
            <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
            <span className="text-xs font-black tracking-tight leading-none">AXIOCRUIT</span>
            <span className="text-[8px] font-black tracking-[0.2em] uppercase text-lime-400">AUTONOMOUS TALENT HUB</span>
          </div>
        </div>

        {/* Primary Hero Headline */}
        <h1
          className={`text-4xl sm:text-6xl md:text-7xl lg:text-[76px] font-black tracking-tight leading-[1.06] ${
            isDark ? 'text-white' : 'text-[#111111]'
          } uppercase max-w-5xl mx-auto mb-5`}
        >
          THE ONLY RECRUITMENT{' '}
          <span
            className={`inline-block ${
              isDark
                ? 'bg-white/10 text-white border border-white/20'
                : 'bg-white text-[#111111] border border-[#111111]/10'
            } px-3 sm:px-5 py-0.5 rounded-2xl md:rounded-3xl shadow-sm align-middle mx-1`}
          >
            [TALENT]
          </span>{' '}
          <span
            className={`inline-block ${
              isDark
                ? 'bg-white/10 text-white border border-white/20'
                : 'bg-white text-[#111111] border border-[#111111]/10'
            } px-3 sm:px-5 py-0.5 rounded-2xl md:rounded-3xl shadow-sm align-middle mx-1`}
          >
            [HUB]
          </span>{' '}
          HUB YOU'LL EVER NEED.
        </h1>

        {/* Subtitle */}
        <p
          className={`text-sm sm:text-base md:text-lg ${
            isDark ? 'text-slate-300' : 'text-[#111111]/85'
          } max-w-2xl mx-auto font-medium leading-relaxed mb-8`}
        >
          Engineered for high-growth engineering teams and talent leaders. Screen resumes with semantic embeddings, run
          real-time proctored Monaco coding assessments, and scale verified technical hiring 10x faster.
        </p>

        {/* Action CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
          <button
            onClick={() => navigate('/signup')}
            className={`${
              isDark
                ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-600/30'
                : 'bg-[#111111] text-white hover:bg-black shadow-black/20'
            } font-extrabold text-sm sm:text-base px-8 py-3.5 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-2 group cursor-pointer`}
          >
            <span>Get Started</span>
            <ArrowUpRight
              size={18}
              className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
            />
          </button>
          <button
            onClick={() => {
              const el = document.getElementById('features');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className={`${
              isDark
                ? 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-700'
                : 'bg-white text-[#111111] border border-[#111111]/80 hover:bg-neutral-100 shadow-sm'
            } font-extrabold text-sm sm:text-base px-8 py-3.5 rounded-full shadow-sm hover:shadow-md transition-all flex items-center gap-2 group cursor-pointer`}
          >
            <span>Explore Platform</span>
            <ArrowUpRight
              size={18}
              className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
            />
          </button>
        </div>

        {/* Segmented Pill Toggle */}
        <div className="mb-12">
          <SegmentedToggle
            activeSegment={activeSegment}
            setActiveSegment={setActiveSegment}
            isDark={isDark}
          />
        </div>

        {/* 3D Perspective Tablet Mockup Container */}
        <div className="mt-4 mb-16 px-2 sm:px-6">
          <PerspectiveTabletMockup isDark={isDark}>
            {/* Tablet Screen Surface Header */}
            <div className={`flex flex-wrap items-center justify-between px-5 sm:px-8 pt-5 pb-3 border-b ${
              isDark ? 'border-slate-700 bg-[#111726]' : 'border-slate-300 bg-white'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-lg ${
                  isDark ? 'bg-blue-600' : 'bg-[#111111]'
                } text-white flex items-center justify-center text-xs font-black shadow-sm`}>
                  A
                </div>
                <div className="text-left">
                  <span className={`font-extrabold ${isDark ? 'text-white' : 'text-slate-900'} text-xs sm:text-sm block leading-none`}>
                    Axiocruit Talent Cloud
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">133 Requisitions Active</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className={`${
                  isDark ? 'bg-slate-800 text-slate-200 border-slate-600' : 'bg-slate-50 text-slate-800 border-slate-300'
                } font-black text-xs px-3 py-1 rounded-full shadow-xs border flex items-center gap-1.5`}>
                  <span className="w-3.5 h-3.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[9px] font-black">
                    ↑
                  </span>
                  <span className="tracking-tight text-[11px] font-bold">98.6% Accuracy</span>
                </div>
                <div className={`hidden sm:flex items-center gap-1 ${
                  isDark ? 'bg-slate-800/80 text-slate-300' : 'bg-slate-100 text-slate-600'
                } px-2.5 py-1 rounded-lg text-[10px] font-mono`}>
                  <span>📅 2026-09-01</span>
                  <span>&gt;</span>
                  <span>2026-09-30</span>
                </div>
              </div>
            </div>

            {/* Dashboard Workspace */}
            <div className={`p-4 sm:p-7 ${isDark ? 'bg-[#0F172A]' : 'bg-[#FAFAFA]'}`}>
              {/* Tabs row */}
              <div className={`flex items-center gap-4 text-[11px] font-bold ${
                isDark ? 'text-slate-400 border-slate-700' : 'text-slate-500 border-slate-300'
              } border-b pb-2.5 mb-5 overflow-x-auto text-left`}>
                <span className={`${
                  isDark ? 'text-white border-emerald-400' : 'text-slate-900 border-emerald-600'
                } font-black border-b-2 pb-2`}>
                  ATS Sourcing
                </span>
                <span className="hover:text-slate-300 cursor-pointer">Proctored Code</span>
                <span className="hover:text-slate-300 cursor-pointer">Candidate Ranking</span>
                <span className="hover:text-slate-300 cursor-pointer">Live Interviews</span>
              </div>

              {/* Dynamic Segment Analytics */}
              {activeSegment === 'marketing' ? (
                <div>
                  <div className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-800'} mb-3 flex items-center justify-between text-left`}>
                    <span>Marketing Acquisition</span>
                    <span className="text-[10px] font-medium text-slate-400">Pipeline Progression & Sourcing Activity</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4 text-[11px] text-left">
                    <div className={`p-3 rounded-xl ${isDark ? 'bg-slate-900/80 border-slate-700' : 'bg-white border-slate-300'} border shadow-xs`}>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Resolved Candidates</span>
                      <div className={`text-base sm:text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'} mt-0.5`}>3,639</div>
                    </div>
                    <div className={`p-3 rounded-xl ${isDark ? 'bg-slate-900/80 border-slate-700' : 'bg-white border-slate-300'} border shadow-xs`}>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Inbound Reach</span>
                      <div className={`text-base sm:text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'} mt-0.5`}>84.5k</div>
                    </div>
                    <div className={`p-3 rounded-xl ${isDark ? 'bg-slate-900/80 border-slate-700' : 'bg-white border-slate-300'} border shadow-xs`}>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Interviews Conducted</span>
                      <div className={`text-base sm:text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'} mt-0.5`}>1,248</div>
                    </div>
                    <div className={`p-3 rounded-xl ${isDark ? 'bg-slate-900/80 border-slate-700' : 'bg-white border-slate-300'} border shadow-xs`}>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Avg AI Match Score</span>
                      <div className={`text-base sm:text-lg font-black text-emerald-500 mt-0.5`}>88.4%</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-800'} mb-3 flex items-center justify-between text-left`}>
                    <span>Website Design & UI/UX</span>
                    <span className="text-[10px] font-medium text-slate-400">Creative Portfolio Scoring & UI Benchmarks</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4 text-[11px] text-left">
                    <div className={`p-3 rounded-xl ${isDark ? 'bg-slate-900/80 border-slate-700' : 'bg-white border-slate-300'} border shadow-xs`}>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Design Submissions</span>
                      <div className={`text-base sm:text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'} mt-0.5`}>842</div>
                    </div>
                    <div className={`p-3 rounded-xl ${isDark ? 'bg-slate-900/80 border-slate-700' : 'bg-white border-slate-300'} border shadow-xs`}>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Figma & UI Audits</span>
                      <div className={`text-base sm:text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'} mt-0.5`}>629</div>
                    </div>
                    <div className={`p-3 rounded-xl ${isDark ? 'bg-slate-900/80 border-slate-700' : 'bg-white border-slate-300'} border shadow-xs`}>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Senior Design Reviews</span>
                      <div className={`text-base sm:text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'} mt-0.5`}>312</div>
                    </div>
                    <div className={`p-3 rounded-xl ${isDark ? 'bg-slate-900/80 border-slate-700' : 'bg-white border-slate-300'} border shadow-xs`}>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Creative Benchmarks</span>
                      <div className="text-base sm:text-lg font-black text-emerald-500 mt-0.5">96.8%</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Candidate Match Score Distribution Bar Chart */}
              <div className={`p-4 rounded-2xl ${isDark ? 'bg-slate-900/80 border-slate-700' : 'bg-white border-slate-300'} border shadow-xs text-left`}>
                <div className={`flex justify-between items-center mb-3 text-[10px] font-bold ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  <span className="tracking-wider">CANDIDATE MATCH SCORE DISTRIBUTION</span>
                  <span className="text-emerald-500">INTERVIEW READINESS %</span>
                </div>
                <div className="flex items-end justify-between h-24 px-2 sm:px-4 gap-2 sm:gap-4">
                  {[25, 65, 95, 45, 80, 55, 75, 40].map((h, idx) => (
                    <div
                      key={idx}
                      className={`flex-1 ${
                        isDark ? 'bg-emerald-950/40' : 'bg-emerald-100/60'
                      } rounded-t-lg flex flex-col justify-end h-full overflow-hidden`}
                    >
                      <div
                        className={`${
                          isDark ? 'bg-emerald-500 hover:bg-emerald-400' : 'bg-[#1B5E20] hover:bg-[#2E7D32]'
                        } rounded-t-lg w-full transition-all duration-300`}
                        style={{ height: `${h}%` }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </PerspectiveTabletMockup>
        </div>

        {/* Bottom Segmented Pill Toggle: Sourcing vs Live Proctoring */}
        <div
          className={`inline-flex items-center gap-1.5 ${
            isDark ? 'bg-[#111726] border-slate-700' : 'bg-[#1C241E] border-[#111111]/30'
          } p-1.5 rounded-full border shadow-lg transition-colors`}
        >
          <button
            type="button"
            onClick={() => setActiveModule('ats')}
            className={`px-6 sm:px-8 py-2.5 rounded-full text-xs sm:text-sm font-black transition-all duration-200 cursor-pointer ${
              activeModule === 'ats'
                ? isDark
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-[#2A382D] text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Autonomous ATS & Sourcing
          </button>
          <button
            type="button"
            onClick={() => setActiveModule('proctoring')}
            className={`px-6 sm:px-8 py-2.5 rounded-full text-xs sm:text-sm font-black transition-all duration-200 cursor-pointer ${
              activeModule === 'proctoring'
                ? isDark
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'bg-white text-[#111111] shadow-md'
                : 'bg-transparent text-slate-400 hover:text-white'
            }`}
          >
            AI Proctoring & Live Coding
          </button>
        </div>

        {/* Dynamic Module Spotlight */}
        <div className="mt-8 max-w-4xl mx-auto transition-all duration-300">
          {activeModule === 'ats' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-left">
              <div
                className={`${
                  isDark
                    ? 'bg-[#111726]/90 border-slate-700 text-slate-200'
                    : 'bg-white/90 border-slate-300 text-[#111111]'
                } backdrop-blur-md p-4 rounded-2xl border shadow-sm transition-colors`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <h4
                    className={`font-extrabold text-xs ${
                      isDark ? 'text-white' : 'text-[#111111]'
                    } uppercase tracking-wider`}
                  >
                    Semantic CV Parser
                  </h4>
                </div>
                <p
                  className={`text-xs ${
                    isDark ? 'text-slate-400' : 'text-[#111111]/80'
                  } leading-relaxed font-medium`}
                >
                  Converts unstructured PDF resumes into normalized vector embeddings using SentenceTransformers for
                  calibrated semantic matching.
                </p>
              </div>

              <div
                className={`${
                  isDark
                    ? 'bg-[#111726]/90 border-slate-700 text-slate-200'
                    : 'bg-white/90 border-slate-300 text-[#111111]'
                } backdrop-blur-md p-4 rounded-2xl border shadow-sm transition-colors`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <h4
                    className={`font-extrabold text-xs ${
                      isDark ? 'text-white' : 'text-[#111111]'
                    } uppercase tracking-wider`}
                  >
                    Vector Calibrated Scoring
                  </h4>
                </div>
                <p
                  className={`text-xs ${
                    isDark ? 'text-slate-400' : 'text-[#111111]/80'
                  } leading-relaxed font-medium`}
                >
                  Computes multi-dimensional cosine similarity across core requirements, engineering stacks, and
                  leadership rubrics.
                </p>
              </div>

              <div
                className={`${
                  isDark
                    ? 'bg-[#111726]/90 border-slate-700 text-slate-200'
                    : 'bg-white/90 border-slate-300 text-[#111111]'
                } backdrop-blur-md p-4 rounded-2xl border shadow-sm transition-colors`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-2 h-2 rounded-full bg-lime-400" />
                  <h4
                    className={`font-extrabold text-xs ${
                      isDark ? 'text-white' : 'text-[#111111]'
                    } uppercase tracking-wider`}
                  >
                    Automated Candidate Drawer
                  </h4>
                </div>
                <p
                  className={`text-xs ${
                    isDark ? 'text-slate-400' : 'text-[#111111]/80'
                  } leading-relaxed font-medium`}
                >
                  Instant deep-dive inspections with circular readiness gauges, missing skill badges, and one-click
                  interview scheduling.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-left">
              <div
                className={`${
                  isDark
                    ? 'bg-[#111726]/90 border-slate-700 text-slate-200'
                    : 'bg-white/90 border-slate-300 text-[#111111]'
                } backdrop-blur-md p-4 rounded-2xl border shadow-sm transition-colors`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  <h4
                    className={`font-extrabold text-xs ${
                      isDark ? 'text-white' : 'text-[#111111]'
                    } uppercase tracking-wider`}
                  >
                    MediaPipe Face Tracking
                  </h4>
                </div>
                <p
                  className={`text-xs ${
                    isDark ? 'text-slate-400' : 'text-[#111111]/80'
                  } leading-relaxed font-medium`}
                >
                  Real-time 468-point 3D facial landmark mesh tracking gaze deviation, head orientation, and multiple
                  face anomalies.
                </p>
              </div>

              <div
                className={`${
                  isDark
                    ? 'bg-[#111726]/90 border-slate-700 text-slate-200'
                    : 'bg-white/90 border-slate-300 text-[#111111]'
                } backdrop-blur-md p-4 rounded-2xl border shadow-sm transition-colors`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-2 h-2 rounded-full bg-pink-500" />
                  <h4
                    className={`font-extrabold text-xs ${
                      isDark ? 'text-white' : 'text-[#111111]'
                    } uppercase tracking-wider`}
                  >
                    Monaco Collaborative IDE
                  </h4>
                </div>
                <p
                  className={`text-xs ${
                    isDark ? 'text-slate-400' : 'text-[#111111]/80'
                  } leading-relaxed font-medium`}
                >
                  Full VS Code editor with live syntax highlighting, multi-language sandbox execution, and real-time
                  telemetry synchronization.
                </p>
              </div>

              <div
                className={`${
                  isDark
                    ? 'bg-[#111726]/90 border-slate-700 text-slate-200'
                    : 'bg-white/90 border-slate-300 text-[#111111]'
                } backdrop-blur-md p-4 rounded-2xl border shadow-sm transition-colors`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <h4
                    className={`font-extrabold text-xs ${
                      isDark ? 'text-white' : 'text-[#111111]'
                    } uppercase tracking-wider`}
                  >
                    Integrity Audit Logs
                  </h4>
                </div>
                <p
                  className={`text-xs ${
                    isDark ? 'text-slate-400' : 'text-[#111111]/80'
                  } leading-relaxed font-medium`}
                >
                  Immutable, chronological integrity scorecards recording tab switches, voice anomalies, and code paste
                  events for compliance.
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

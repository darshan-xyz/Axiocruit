import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Card } from '../components/UI';
import {
  ArrowUpRight,
  TrendingUp,
  Search,
  Eye,
  EyeOff,
  Video,
  Shield,
  Users,
  CheckCircle2,
  Calendar,
  Clock,
  Sparkles,
  Info,
  Check
} from 'lucide-react';
import { UserRole } from '../types';
import { apiRequest } from '../utils/api';
import { useTheme } from '../components/ThemeContext';

// Vector Doodle Illustrations for Feature Cards
const DoodleSearchVector = () => (
  <svg viewBox="0 0 160 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-28 h-24 md:w-36 md:h-28 flex-shrink-0">
    {/* Magnifying Glass */}
    <circle cx="65" cy="55" r="32" stroke="#111111" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="3 3 10 3" />
    <circle cx="65" cy="55" r="26" stroke="#111111" strokeWidth="1.5" />
    <line x1="88" y1="78" x2="118" y2="108" stroke="#111111" strokeWidth="3.5" strokeLinecap="round" />
    <path d="M110 100 L125 115" stroke="#111111" strokeWidth="5" strokeLinecap="round" />
    {/* Globe Grid */}
    <circle cx="40" cy="98" r="14" stroke="#111111" strokeWidth="1.5" />
    <ellipse cx="40" cy="98" rx="7" ry="14" stroke="#111111" strokeWidth="1.2" />
    <line x1="26" y1="98" x2="54" y2="98" stroke="#111111" strokeWidth="1.2" />
    {/* Stars & Sparkles */}
    <path d="M110 30 L113 40 L123 43 L113 46 L110 56 L107 46 L97 43 L107 40 Z" fill="#111111" />
    <circle cx="120" cy="20" r="2.5" fill="#111111" />
    <line x1="120" y1="12" x2="120" y2="28" stroke="#111111" strokeWidth="1.2" />
    <line x1="112" y1="20" x2="128" y2="20" stroke="#111111" strokeWidth="1.2" />
    {/* Smiley Face */}
    <circle cx="95" cy="115" r="10" stroke="#111111" strokeWidth="1.5" fill="white" />
    <circle cx="92" cy="113" r="1.5" fill="#111111" />
    <circle cx="98" cy="113" r="1.5" fill="#111111" />
    <path d="M91 118 Q95 122 99 118" stroke="#111111" strokeWidth="1.5" strokeLinecap="round" fill="none" />
  </svg>
);

const DoodleClickVector = () => (
  <svg viewBox="0 0 160 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-28 h-24 md:w-36 md:h-28 flex-shrink-0">
    {/* Spring coil on left */}
    <path d="M25 40 C35 30 35 60 25 60 C35 60 35 90 25 90 C35 90 35 110 25 110" stroke="#111111" strokeWidth="1.5" fill="none" />
    {/* Browser Card */}
    <rect x="50" y="32" width="70" height="52" rx="8" stroke="#111111" strokeWidth="2" fill="white" />
    <line x1="50" y1="44" x2="120" y2="44" stroke="#111111" strokeWidth="1.5" />
    <circle cx="58" cy="38" r="2" fill="#111111" />
    <circle cx="64" cy="38" r="2" fill="#111111" />
    <circle cx="70" cy="38" r="2" fill="#111111" />
    {/* Cursor Click Starburst */}
    <path d="M85 55 L90 50 L95 56 L102 52 L98 60 L106 63 L99 68 L104 75 L96 73 L94 82 L89 74 L82 78 L86 70 L78 66 L86 62 Z" fill="#111111" />
    <path d="M94 65 L94 85 L99 80 L105 91 L108 89 L102 78 L109 78 Z" fill="white" stroke="#111111" strokeWidth="1.5" />
    {/* Background Globe Wireframe */}
    <circle cx="115" cy="95" r="16" stroke="#111111" strokeWidth="1.2" strokeDasharray="3 3" />
    <ellipse cx="115" cy="95" rx="8" ry="16" stroke="#111111" strokeWidth="1" />
  </svg>
);

const DoodleStackVector = () => (
  <svg viewBox="0 0 160 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-28 h-24 md:w-36 md:h-28 flex-shrink-0">
    {/* Stacked White & Black Cards */}
    <g transform="rotate(-10 60 70)">
      <rect x="25" y="40" width="70" height="24" rx="4" fill="white" stroke="#111111" strokeWidth="2" />
      <rect x="75" y="40" width="20" height="24" rx="0" fill="#111111" />
      <circle cx="35" cy="52" r="1.5" fill="#111111" />
      <circle cx="41" cy="52" r="1.5" fill="#111111" />
      <circle cx="47" cy="52" r="1.5" fill="#111111" />
    </g>
    <g transform="rotate(5 70 80)">
      <rect x="30" y="65" width="75" height="24" rx="4" fill="white" stroke="#111111" strokeWidth="2" />
      <rect x="85" y="65" width="20" height="24" rx="0" fill="#111111" />
      <circle cx="40" cy="77" r="1.5" fill="#111111" />
      <circle cx="46" cy="77" r="1.5" fill="#111111" />
      <circle cx="52" cy="77" r="1.5" fill="#111111" />
    </g>
    <g transform="rotate(-4 65 95)">
      <rect x="22" y="90" width="78" height="24" rx="4" fill="white" stroke="#111111" strokeWidth="2" />
      <rect x="80" y="90" width="20" height="24" rx="0" fill="#111111" />
    </g>
    {/* Sparkle */}
    <path d="M125 40 L127 48 L135 50 L127 52 L125 60 L123 52 L115 50 L123 48 Z" fill="#D4F882" stroke="#111111" strokeWidth="1" />
    <circle cx="115" cy="85" r="3" fill="#D4F882" stroke="#111111" strokeWidth="1.5" />
  </svg>
);

const DoodleChartsVector = () => (
  <svg viewBox="0 0 160 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-28 h-24 md:w-36 md:h-28 flex-shrink-0">
    {/* Top-left window: Line chart */}
    <rect x="25" y="25" width="46" height="34" rx="4" fill="white" stroke="#111111" strokeWidth="1.8" />
    <line x1="25" y1="34" x2="71" y2="34" stroke="#111111" strokeWidth="1" />
    <path d="M30 52 L38 42 L48 48 L56 38 L65 44" stroke="#111111" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    {/* Top-right window: Wave/area chart */}
    <rect x="76" y="30" width="48" height="36" rx="4" fill="white" stroke="#111111" strokeWidth="1.8" />
    <line x1="76" y1="38" x2="124" y2="38" stroke="#111111" strokeWidth="1" />
    <path d="M80 56 Q90 44 100 52 T120 45" stroke="#111111" strokeWidth="1.8" fill="none" />
    {/* Sun on top of right window */}
    <circle cx="98" cy="24" r="5" stroke="#111111" strokeWidth="1.5" />
    <line x1="98" y1="16" x2="98" y2="19" stroke="#111111" strokeWidth="1.5" />
    {/* Bottom-left window: Bar chart */}
    <rect x="20" y="65" width="42" height="42" rx="4" fill="white" stroke="#111111" strokeWidth="1.8" />
    <line x1="20" y1="74" x2="62" y2="74" stroke="#111111" strokeWidth="1" />
    <rect x="25" y="86" width="5" height="15" fill="#111111" />
    <rect x="33" y="80" width="5" height="21" fill="#111111" />
    <rect x="41" y="77" width="5" height="24" fill="#111111" />
    <rect x="49" y="84" width="5" height="17" fill="#111111" />
    {/* Bottom-right window: Pie chart */}
    <rect x="68" y="70" width="52" height="42" rx="4" fill="white" stroke="#111111" strokeWidth="1.8" />
    <line x1="68" y1="78" x2="120" y2="78" stroke="#111111" strokeWidth="1" />
    <circle cx="94" cy="94" r="11" stroke="#111111" strokeWidth="1.8" />
    <path d="M94 94 L94 83 M94 94 L103 99 M94 94 L86 100" stroke="#111111" strokeWidth="1.8" />
  </svg>
);

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [activeSegment, setActiveSegment] = useState<'marketing' | 'website_design' | 'ats' | 'proctoring'>('marketing');

  return (
    <div className={`space-y-0 overflow-x-hidden min-h-[100dvh] font-sans antialiased transition-colors duration-200 ${isDark ? 'bg-[#0A0E1A] text-slate-100' : 'text-[#111111]'}`}>

      {/* ── SECTION 1: HERO (Herb Agency Light-Lime Canvas & 3D Tablet Mockup) ── */}
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
                      TALENT
                    </span>{' '}
                    <span className={`inline-block ${
                      isDark ? 'bg-white/10 text-white border border-white/20' : 'bg-white text-[#111111] border border-[#111111]/10'
                    } px-3 sm:px-5 py-1 rounded-2xl md:rounded-3xl shadow-sm align-middle mx-1`}>
                      HUB
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
                      <span>Learn More</span>
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
                        <div className={`flex ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'} p-0.5 rounded-lg text-[10px] font-bold`}>
                          <span className={`px-1.5 py-0.5 ${isDark ? 'bg-slate-700 text-white' : 'bg-white text-slate-900'} rounded shadow-2xs font-black`}>1D</span>
                          <span className="px-1.5 py-0.5">7D</span>
                          <span className="px-1.5 py-0.5">30D</span>
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

      {/* ── SECTION 2: PROCRUIT 4-PILLAR RECRUITMENT CAPABILITIES ── */}
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
                  {/* Title in Light Lime Pill */}
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
                  } flex items-center justify-center font-bold text-sm group-hover:scale-110 transition-transform shadow-sm`}
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
                  {/* Title in White Pill */}
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
                  className="w-8 h-8 rounded-full bg-white text-[#111111] flex items-center justify-center font-bold text-sm group-hover:scale-110 transition-transform shadow-sm"
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
                  {/* Title in Light Lime Pill */}
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
                  } flex items-center justify-center font-bold text-sm group-hover:scale-110 transition-transform shadow-sm`}
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
                  {/* Title in White Pill */}
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
                  } flex items-center justify-center font-bold text-sm group-hover:scale-110 transition-transform shadow-sm`}
                >
                  ↗
                </button>
                <span className="text-xs font-bold text-white uppercase tracking-wider">Learn More</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── SECTION 3: BOTTOM CTA BANNER ── */}
      <section className={`py-16 px-4 ${
        isDark ? 'bg-[#111726] border-slate-800 text-white' : 'bg-[#D4F882] border-[#111111]/10 text-[#111111]'
      } border-t text-center transition-colors duration-200`}>
        <div className="max-w-4xl mx-auto space-y-6">
          <h2 className={`text-3xl sm:text-5xl font-black ${
            isDark ? 'text-white' : 'text-[#111111]'
          } uppercase tracking-tight`}>
            Ready to Experience the Future of Hiring?
          </h2>
          <p className={`text-base sm:text-lg ${
            isDark ? 'text-slate-300' : 'text-[#111111]/80'
          } max-w-xl mx-auto font-medium`}>
            Join hundreds of forward-thinking engineering organizations and candidates building modern teams.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <button
              onClick={() => navigate('/signup')}
              className={`${
                isDark ? 'bg-white text-slate-950 hover:bg-slate-100 shadow-xl' : 'bg-[#111111] text-white hover:bg-black shadow-lg'
              } font-extrabold px-8 py-3.5 rounded-full transition-all text-sm sm:text-base flex items-center gap-2`}
            >
              Get Started Free <ArrowUpRight size={18} />
            </button>
            <button
              onClick={() => navigate('/login')}
              className={`${
                isDark ? 'bg-slate-800 text-white border-slate-700 hover:bg-slate-700' : 'bg-white text-[#111111] border-[#111111]/10 hover:bg-neutral-100'
              } font-extrabold px-8 py-3.5 rounded-full shadow-sm transition-all text-sm sm:text-base border`}
            >
              Sign In Instead
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};

// --- Auth Page Component (Clean Slate styling with role pills) ---
interface AuthPageProps {
  type: 'login' | 'signup';
}

export const AuthPage: React.FC<AuthPageProps> = ({ type }) => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [role, setRole] = useState<UserRole>('CANDIDATE');
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (type === 'signup' && formData.password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      let endpoint = '/auth/login';
      if (type === 'signup') {
        if (role === 'CANDIDATE') endpoint = '/auth/register-candidate';
        else if (role === 'RECRUITER') endpoint = '/auth/register-org';
        else if (role === 'INTERVIEWER') endpoint = '/auth/register-freelancer';
      }

      const payload = type === 'login'
        ? { email: formData.email.toLowerCase(), password: formData.password }
        : { ...formData, email: formData.email.toLowerCase(), role };

      const data = await apiRequest(endpoint, 'POST', payload);

      if (data.role === 'ORG_ADMIN' || data.role === 'org_admin') {
        data.role = 'organization';
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('user', JSON.stringify(data));

      const userRole = data.role;
      if (userRole === 'ADMIN' || userRole === 'admin') {
        navigate('/admin/dashboard');
      } else if (userRole === 'organization') {
        navigate('/organization/dashboard');
      } else if (userRole === 'RECRUITER' || userRole === 'recruiter') {
        navigate('/recruiter/dashboard');
      } else if (userRole === 'CANDIDATE' || userRole === 'candidate') {
        navigate('/candidate/dashboard');
      } else if (userRole === 'INTERVIEWER' || userRole === 'interviewer') {
        navigate('/interviewer');
      } else {
        navigate('/');
      }

    } catch (err: any) {
      console.error('Auth Failed:', err);
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-[100dvh] flex items-center justify-center px-4 py-16 font-sans transition-colors duration-200 ${
      isDark ? 'bg-[#0A0E1A] text-slate-100' : 'bg-[#EDF2F7] text-slate-900'
    }`}>
      <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        <div className="text-center mb-8 flex flex-col items-center">
          <div
            className={`mb-3 cursor-pointer w-12 h-12 rounded-2xl ${
              isDark ? 'bg-blue-600 border border-blue-500 text-white shadow-blue-500/20' : 'bg-[#D4F882] border-2 border-[#111111] text-[#111111]'
            } flex items-center justify-center font-black text-xl shadow-md transition-colors`}
            onClick={() => navigate('/')}
          >
            P
          </div>
          <h2 className={`text-2xl sm:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-[#111111]'}`}>
            {type === 'login' ? 'Sign in to Procruit' : 'Create an Account'}
          </h2>
          <p className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {type === 'login' ? 'Access your intelligence hiring workspace.' : 'Join the next-generation talent platform.'}
          </p>
        </div>

        <div className={`${
          isDark ? 'bg-[#111726] border-slate-800 text-slate-100 shadow-black/60' : 'bg-white border-slate-200/80 text-slate-900'
        } rounded-[28px] p-6 sm:p-8 border shadow-xl transition-colors`}>
          <form onSubmit={handleSubmit} className="space-y-4">

            {type === 'signup' && (
              <div>
                <label className={`block text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-2`}>Select Your Role</label>
                <div className={`grid grid-cols-3 gap-1.5 p-1 rounded-2xl ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'} border transition-colors`}>
                  {(['CANDIDATE', 'RECRUITER', 'INTERVIEWER'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`text-xs font-extrabold py-2 rounded-xl transition-all cursor-pointer ${
                        role === r
                          ? (isDark ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-[#111111] shadow-sm')
                          : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900')
                      }`}
                    >
                      {r === 'INTERVIEWER' ? 'Freelancer' : r === 'RECRUITER' ? 'Organization' : 'Candidate'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {type === 'signup' && (
              <Input
                label="Full Name"
                placeholder="Alex Morgan"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            )}

            <Input
              label="Email Address"
              type="email"
              placeholder="name@company.com"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              endIcon={showPassword ? EyeOff : Eye}
              onEndIconClick={() => setShowPassword(!showPassword)}
            />

            {type === 'signup' && (
              <Input
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                endIcon={showConfirmPassword ? EyeOff : Eye}
                onEndIconClick={() => setShowConfirmPassword(!showConfirmPassword)}
              />
            )}

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full ${
                isDark ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20' : 'bg-[#111111] text-white hover:bg-black shadow-md'
              } font-extrabold py-3 rounded-full transition-all text-sm mt-2 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 cursor-pointer`}
            >
              {loading ? 'Processing...' : (type === 'login' ? 'Sign In ↗' : 'Create Account ↗')}
            </button>
          </form>

          <div className={`mt-6 text-center text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {type === 'login' ? (
              <>Don't have an account? <span onClick={() => navigate('/signup')} className={`${isDark ? 'text-blue-400' : 'text-[#111111]'} font-black cursor-pointer hover:underline`}>Sign up</span></>
            ) : (
              <>Already have an account? <span onClick={() => navigate('/login')} className={`${isDark ? 'text-blue-400' : 'text-[#111111]'} font-black cursor-pointer hover:underline`}>Sign in</span></>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

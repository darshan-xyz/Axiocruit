import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Badge, Modal, MetricStatCard, DualToneProgressBar, CircularProgressGauge } from '../components/UI';
import { Plus, Search, Calendar, Clock, Video, FileText, ChevronRight, BarChart2, User, Users, MapPin, Briefcase, GraduationCap, Github, Linkedin, Globe, Upload, Lock, Shield, MessageSquare, Link as LinkIcon, Download, Star, DollarSign, Sparkles, Send, AlertTriangle, ArrowRight, CheckCircle, XCircle, Archive, UserCheck, Building2, Award, TrendingUp, ClipboardList, X, Play, Pause, RotateCcw, Palette, Code2, Tag, CheckCircle2, Layers, Box, CheckSquare, Square, Megaphone } from 'lucide-react';
import { apiRequest } from '../utils/api';
import { Job, User as UserType } from '../types';
import InterviewsTab from '../components/InterviewsTab';
import { DEFAULT_AVATAR } from '../utils/defaultAvatar';

// Helper to convert file to base64
const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

import { ApplicantReviewModal } from '../components/ApplicantReviewModal';
import { ChangePasswordForm } from '../components/ChangePasswordForm';
import { FreelancerPublicProfileModal } from '../components/FreelancerPublicProfileModal';
import AIReportCard from '../components/AIReportCard';

// ─── RECRUITMENT TALENT PIPELINE MATRIX ──────────────────────────────────────
const TALENT_PIPELINE_MATRIX_ROWS = [
  {
    jobTitle: 'Staff AI/ML Engineer',
    totalApplications: 124,
    newApplied: '34 Candidates',
    appliedColor: 'bg-[#FFE4E6] text-[#BE123C] dark:bg-rose-950/60 dark:text-rose-300',
    screening: '18 Candidates',
    screeningColor: 'bg-[#EDE9FE] text-[#6D28D9] dark:bg-purple-950/60 dark:text-purple-300',
    interview: '6 Candidates',
    interviewColor: 'bg-[#FBCFE8] text-[#9D174D] dark:bg-pink-950/60 dark:text-pink-300',
    test: '4 In Test',
    testColor: 'bg-[#FEF08A] text-[#854D0E] dark:bg-amber-950/60 dark:text-amber-300',
    hired: '2 Hired',
    hiredColor: 'bg-[#DCFCE7] text-[#15803D] dark:bg-emerald-950/60 dark:text-emerald-300',
  },
  {
    jobTitle: 'Senior Full Stack Lead',
    totalApplications: 96,
    newApplied: '28 Candidates',
    appliedColor: 'bg-[#FFEDD5] text-[#C2410C] dark:bg-orange-950/60 dark:text-orange-300',
    screening: '16 Candidates',
    screeningColor: 'bg-[#FED7AA] text-[#9A3412] dark:bg-amber-950/60 dark:text-amber-300',
    interview: '8 Candidates',
    interviewColor: 'bg-[#FBCFE8] text-[#9D174D] dark:bg-pink-950/60 dark:text-pink-300',
    test: '5 In Test',
    testColor: 'bg-[#FEF08A] text-[#854D0E] dark:bg-amber-950/60 dark:text-amber-300',
    hired: null,
  },
  {
    jobTitle: 'Lead Product Designer',
    totalApplications: 88,
    newApplied: '18 Candidates',
    appliedColor: 'bg-[#CFFAFE] text-[#0E7490] dark:bg-cyan-950/60 dark:text-cyan-300',
    screening: '12 Candidates',
    screeningColor: 'bg-[#BAE6FD] text-[#0369A1] dark:bg-sky-950/60 dark:text-sky-300',
    interview: '5 Candidates',
    interviewColor: 'bg-[#7DD3FC] text-[#0284C7] dark:bg-blue-950/60 dark:text-blue-300',
    test: null,
    hired: null,
  },
  {
    jobTitle: 'DevOps & Cloud Architect',
    totalApplications: 72,
    newApplied: '14 Candidates',
    appliedColor: 'bg-[#FEF9C3] text-[#A16207] dark:bg-yellow-950/60 dark:text-yellow-300',
    screening: '10 Candidates',
    screeningColor: 'bg-[#FEF08A] text-[#854D0E] dark:bg-amber-950/60 dark:text-amber-300',
    interview: '4 Candidates',
    interviewColor: 'bg-[#FDE047] text-[#713F12] dark:bg-yellow-950/80 dark:text-yellow-200',
    test: '2 In Test',
    testColor: 'bg-[#FEF08A] text-[#854D0E] dark:bg-amber-950/60 dark:text-amber-300',
    hired: '1 Hired',
    hiredColor: 'bg-[#DCFCE7] text-[#15803D] dark:bg-emerald-950/60 dark:text-emerald-300',
  },
  {
    jobTitle: 'Mobile Engineer (React Native)',
    totalApplications: 82,
    newApplied: '22 Candidates',
    appliedColor: 'bg-[#F3E8FF] text-[#7E22CE] dark:bg-purple-950/60 dark:text-purple-300',
    screening: '15 Candidates',
    screeningColor: 'bg-[#DDD6FE] text-[#6B21A8] dark:bg-purple-950/80 dark:text-purple-200',
    interview: '3 Candidates',
    interviewColor: 'bg-[#FBCFE8] text-[#9D174D] dark:bg-pink-950/60 dark:text-pink-300',
    test: null,
    hired: null,
  },
  {
    jobTitle: 'Data Platform Architect',
    totalApplications: 90,
    newApplied: '25 Candidates',
    appliedColor: 'bg-[#E0E7FF] text-[#4338CA] dark:bg-indigo-950/60 dark:text-indigo-300',
    screening: '19 Candidates',
    screeningColor: 'bg-[#C7D2FE] text-[#3730A3] dark:bg-indigo-950/80 dark:text-indigo-200',
    interview: '7 Candidates',
    interviewColor: 'bg-[#A5B4FC] text-[#1E40AF] dark:bg-blue-950/80 dark:text-blue-200',
    test: '3 In Test',
    testColor: 'bg-[#FEF08A] text-[#854D0E] dark:bg-amber-950/60 dark:text-amber-300',
    hired: '2 Hired',
    hiredColor: 'bg-[#DCFCE7] text-[#15803D] dark:bg-emerald-950/60 dark:text-emerald-300',
  },
];

const HiringMatrixGrid: React.FC = () => {
  return (
    <div className="w-full bg-white dark:bg-[#111726] border border-slate-300 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
            Technical Pipeline Matrix
          </h3>
          <button className="px-3 py-1 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 flex items-center gap-1.5 shadow-2xs">
            <span>Engineering</span>
            <ChevronRight size={12} className="rotate-90 text-slate-400" />
          </button>
        </div>
        <button
          onClick={() => window.location.href = '#/recruiter/applicants'}
          className="text-xs font-black text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1 uppercase tracking-wider"
        >
          VIEW ALL CANDIDATES &gt;
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-300 dark:border-slate-700 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="pb-3 pr-4 font-bold">Jobs</th>
              <th className="pb-3 px-3 text-center font-bold">New Applied</th>
              <th className="pb-3 px-3 text-center font-bold">Screening</th>
              <th className="pb-3 px-3 text-center font-bold">Interview</th>
              <th className="pb-3 px-3 text-center font-bold">Assessment</th>
              <th className="pb-3 pl-3 text-center font-bold">Hired</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300 dark:divide-slate-700 text-xs">
            {TALENT_PIPELINE_MATRIX_ROWS.map(row => (
              <tr key={row.jobTitle} className="hover:bg-slate-50/70 dark:hover:bg-slate-850/40 transition-colors">
                <td className="py-3.5 pr-4 font-bold text-slate-900 dark:text-white min-w-[170px]">
                  <div className="font-bold text-xs">{row.jobTitle}</div>
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">TOTAL CANDIDATES {row.totalApplications}</span>
                </td>
                <td className="py-3.5 px-3 text-center min-w-[120px]">
                  {row.newApplied ? (
                    <span className={`inline-block px-3 py-1.5 rounded-xl font-bold text-xs shadow-2xs ${row.appliedColor}`}>
                      {row.newApplied}
                    </span>
                  ) : (
                    <div className="h-7 w-20 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 mx-auto" />
                  )}
                </td>
                <td className="py-3.5 px-3 text-center min-w-[120px]">
                  {row.screening ? (
                    <span className={`inline-block px-3 py-1.5 rounded-xl font-bold text-xs shadow-2xs ${row.screeningColor}`}>
                      {row.screening}
                    </span>
                  ) : (
                    <div className="h-7 w-20 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 mx-auto" />
                  )}
                </td>
                <td className="py-3.5 px-3 text-center min-w-[120px]">
                  {row.interview ? (
                    <span className={`inline-block px-3 py-1.5 rounded-xl font-bold text-xs shadow-2xs ${row.interviewColor}`}>
                      {row.interview}
                    </span>
                  ) : (
                    <div className="h-7 w-20 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 mx-auto" />
                  )}
                </td>
                <td className="py-3.5 px-3 text-center min-w-[100px]">
                  {row.test ? (
                    <span className={`inline-block px-3 py-1.5 rounded-xl font-bold text-xs shadow-2xs ${row.testColor}`}>
                      {row.test}
                    </span>
                  ) : (
                    <div className="h-7 w-20 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 mx-auto" />
                  )}
                </td>
                <td className="py-3.5 pl-3 text-center min-w-[100px]">
                  {row.hired ? (
                    <span className={`inline-block px-3 py-1.5 rounded-xl font-bold text-xs shadow-2xs ${row.hiredColor}`}>
                      {row.hired}
                    </span>
                  ) : (
                    <div className="h-7 w-20 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 mx-auto" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const JobsSummaryDonutChart: React.FC = () => {
  const circumference = 345.57; // 2 * PI * 55
  // Reference 2 exact numbers: Published 80, On Hold 20, Internal 18, Closed 15 => Total 133
  return (
    <div className="w-full bg-white dark:bg-[#111726] border border-slate-300 dark:border-slate-700 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-full">
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

        {/* Legend matching Reference 2 */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-300 dark:border-slate-700 text-xs">
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

const EmployeeDepartmentCards: React.FC = () => {
  const depts = [
    {
      name: 'Design Team',
      count: 26,
      avatars: [
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&fit=crop&crop=faces',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=faces',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&fit=crop&crop=faces',
      ],
      extra: '+24'
    },
    {
      name: 'Development Team',
      count: 16,
      avatars: [
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=64&h=64&fit=crop&crop=faces',
        'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=64&h=64&fit=crop&crop=faces',
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=64&h=64&fit=crop&crop=faces',
      ],
      extra: '+13'
    },
    {
      name: 'Finance Team',
      count: 10,
      avatars: [
        'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=64&h=64&fit=crop&crop=faces',
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=64&h=64&fit=crop&crop=faces',
      ],
      extra: '+6'
    },
    {
      name: 'Sales Team',
      count: 30,
      avatars: [
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=64&h=64&fit=crop&crop=faces',
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=64&h=64&fit=crop&crop=faces',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=faces',
      ],
      extra: '+27'
    },
  ];

  return (
    <div className="w-full bg-white dark:bg-[#111726] border border-slate-300 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
          Employee
        </h3>
        <button
          onClick={() => window.location.href = '#/recruiter/applicants'}
          className="text-xs font-black text-slate-600 dark:text-slate-300 hover:text-slate-900 flex items-center gap-1 uppercase tracking-wider"
        >
          VIEW ALL &gt;
        </button>
      </div>

      <div className="space-y-3">
        {depts.map(d => (
          <div
            key={d.name}
            className="p-3.5 rounded-2xl bg-slate-50/60 dark:bg-slate-900/40 border border-slate-300 dark:border-slate-700 flex items-center justify-between"
          >
            <div>
              <h4 className="font-bold text-xs text-slate-900 dark:text-white">{d.name}</h4>
              <span className="text-[10px] font-black uppercase text-slate-400">TOTAL MEMBER {d.count}</span>
            </div>
            <div className="flex items-center -space-x-1.5">
              {d.avatars.map((url, i) => (
                <img key={i} src={url} className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-700 object-cover" alt="Member" />
              ))}
              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 text-[9px] font-black flex items-center justify-center border-2 border-white dark:border-slate-700 shadow-2xs">
                {d.extra}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── TALENT DISTRIBUTION COMPONENTS ──────────────────────────────────────────
const ConcentricFormatRings: React.FC = () => {
  const cOuter = 402.12;
  const cMiddle = 301.59;
  const cInner = 201.06;

  return (
    <div className="w-full bg-white dark:bg-[#111726] border border-slate-300 dark:border-slate-700 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
            Working Format
          </h3>
          <span className="text-[11px] font-bold text-slate-400">Axiocruit Talent Allocation</span>
        </div>

        <div className="flex items-center justify-center py-3 relative">
          <svg width={160} height={160} className="transform -rotate-90">
            {/* Tracks */}
            <circle cx={80} cy={80} r={64} fill="none" stroke="currentColor" strokeWidth={7} className="text-slate-100 dark:text-slate-800" />
            <circle cx={80} cy={80} r={48} fill="none" stroke="currentColor" strokeWidth={7} className="text-slate-100 dark:text-slate-800" />
            <circle cx={80} cy={80} r={32} fill="none" stroke="currentColor" strokeWidth={7} className="text-slate-100 dark:text-slate-800" />

            {/* Outer: 60% Office */}
            <circle
              cx={80} cy={80} r={64} fill="none"
              stroke="#2563EB" strokeWidth={7}
              strokeDasharray={`${cOuter * 0.60} ${cOuter}`}
              strokeDashoffset={0}
              strokeLinecap="round"
            />
            {/* Middle: 30% Hybrid */}
            <circle
              cx={80} cy={80} r={48} fill="none"
              stroke="#F59E0B" strokeWidth={7}
              strokeDasharray={`${cMiddle * 0.30} ${cMiddle}`}
              strokeDashoffset={0}
              strokeLinecap="round"
            />
            {/* Inner: 10% Remote */}
            <circle
              cx={80} cy={80} r={32} fill="none"
              stroke="#10B981" strokeWidth={7}
              strokeDasharray={`${cInner * 0.10} ${cInner}`}
              strokeDashoffset={0}
              strokeLinecap="round"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xs font-black text-slate-900 dark:text-white">Format</span>
            <span className="text-[9px] font-bold text-slate-400">100%</span>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-2 mt-3 pt-3 border-t border-slate-300 dark:border-slate-700 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
              <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">Office Attendance</span>
            </div>
            <span className="font-black text-blue-600 dark:text-blue-400">60%</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
              <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">Hybrid Flexible</span>
            </div>
            <span className="font-black text-amber-500">30%</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
              <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">Full Remote</span>
            </div>
            <span className="font-black text-emerald-600 dark:text-emerald-400">10%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const TimeTrackingStopwatch: React.FC = () => {
  const [seconds, setSeconds] = useState(5058); // 01:24:18 initial
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    let timer: any;
    if (isRunning) {
      timer = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning]);

  const formatTime = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full bg-white dark:bg-[#111726] border border-slate-300 dark:border-slate-700 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-blue-600" />
            <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
              Screening Stopwatch
            </h3>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300">
            {isRunning ? '● Live Recording' : 'Paused'}
          </span>
        </div>

        <p className="text-xs text-slate-500 mb-4">
          Rubric assessment session time tracker for candidate evaluations.
        </p>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 text-center mb-4">
          <div className="font-mono text-3xl font-black text-slate-900 dark:text-white tracking-wider">
            {formatTime(seconds)}
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-1">
            Current Session • Senior Design Screen
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-slate-300 dark:border-slate-700">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className={`flex-1 py-2 rounded-full font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs ${
            isRunning
              ? 'bg-amber-500 hover:bg-amber-600 text-white'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
        >
          {isRunning ? <><Pause size={13} /> Pause Timer</> : <><Play size={13} /> Resume Timer</>}
        </button>
        <button
          onClick={() => { setSeconds(0); setIsRunning(false); }}
          className="p-2 rounded-full border border-slate-300 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          title="Reset timer"
        >
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  );
};

const TagNotesWidget: React.FC = () => {
  const [notes, setNotes] = useState<string[]>([
    'Debrief with Engineering committee at 4:00 PM',
    'Follow up on offer letter for Sarah Miller (83% match)',
    'Calibrate AI semantic rubric for Staff Frontend position'
  ]);
  const [newNote, setNewNote] = useState('');

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setNotes(prev => [...prev, newNote.trim()]);
    setNewNote('');
  };

  return (
    <div className="w-full bg-white dark:bg-[#111726] border border-slate-300 dark:border-slate-700 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Tag size={16} className="text-purple-600" />
            <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
              Recruiter Quick Notes
            </h3>
          </div>
          <span className="text-[11px] font-bold text-slate-400">{notes.length} Active</span>
        </div>

        <div className="space-y-2 mb-4 max-h-[170px] overflow-y-auto pr-1">
          {notes.map((note, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-300 dark:border-purple-700 flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />
              <span className="flex-1 leading-snug">{note}</span>
              <button
                onClick={() => setNotes(prev => prev.filter((_, i) => i !== idx))}
                className="text-slate-400 hover:text-rose-500 transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleAddNote} className="flex items-center gap-2 pt-3 border-t border-slate-300 dark:border-slate-700">
        <input
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
          placeholder="Add candidate note..."
          className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-full px-3.5 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:border-purple-500"
        />
        <button
          type="submit"
          className="px-3 py-1.5 rounded-full bg-purple-600 text-white font-bold text-xs hover:bg-purple-700 transition-colors"
        >
          Add
        </button>
      </form>
    </div>
  );
};

// ─── MINI CALENDAR & SCHEDULE ──────────────────────────────────────────────
const MiniCalendarWidget: React.FC = () => {
  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const daysInMonth = Array.from({ length: 30 }, (_, i) => i + 1);
  const interviewDays = [12, 14, 18, 22, 25];

  return (
    <div className="w-full bg-white dark:bg-[#111726] border border-slate-300 dark:border-slate-700 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
            September 2026
          </h3>
          <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">Axiocruit Live ATS</span>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-extrabold text-slate-400 mb-2">
          {daysOfWeek.map(d => (
            <div key={d}>{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          <div />
          <div />
          {daysInMonth.map(day => {
            const isToday = day === 14;
            const hasInterview = interviewDays.includes(day);

            return (
              <div
                key={day}
                className={`py-1.5 rounded-xl font-bold flex flex-col items-center justify-center relative ${
                  isToday
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850'
                }`}
              >
                <span>{day}</span>
                {hasInterview && !isToday && (
                  <span className="w-1 h-1 rounded-full bg-blue-500 mt-0.5" />
                )}
                {isToday && (
                  <span className="w-1 h-1 rounded-full bg-white mt-0.5" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-slate-300 dark:border-slate-700 text-[11px] text-slate-500 flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-bold text-blue-600 dark:text-blue-400">
          <span className="w-2 h-2 rounded-full bg-blue-600" /> Today: 3 Interviews
        </span>
        <button
          onClick={() => window.location.href = '#/recruiter/schedule'}
          className="hover:underline font-bold text-slate-600 dark:text-slate-300"
        >
          View Calendar →
        </button>
      </div>
    </div>
  );
};

const MyTaskScheduleList: React.FC = () => {
  const [tasks, setTasks] = useState([
    { id: '101', interviewTitle: 'System Architecture Assessment', candidate: { name: 'Sarah Miller' }, scheduledTime: '09.00 – 10.00 AM', time: '09.00 – 10.00 AM', color: 'border-l-4 border-l-blue-600', done: true },
    { id: '102', interviewTitle: 'Distributed Systems & Coding Round', candidate: { name: 'Alex Rivera' }, scheduledTime: '10.30 – 12.00 AM', time: '10.30 – 12.00 AM', color: 'border-l-4 border-l-[#FF5D8F]', done: true },
    { id: '103', interviewTitle: 'Product Design Technical Review', candidate: { name: 'Elena Rostova' }, scheduledTime: '13.30 – 14.00 PM', time: '13.30 – 14.00 PM', color: 'border-l-4 border-l-emerald-500', done: false },
    { id: '104', interviewTitle: 'Full-Stack Portfolio Deep Dive', candidate: { name: 'Marcus Chen' }, scheduledTime: '14.00 – 16.00 PM', time: '14.00 – 16.00 PM', color: 'border-l-4 border-l-amber-500', done: false },
  ]);

  return (
    <div className="w-full bg-white dark:bg-[#111726] border border-slate-300 dark:border-slate-700 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
              My Task
            </h3>
            <button className="px-3 py-1 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 flex items-center gap-1.5 shadow-2xs">
              <span>Today</span>
              <ChevronRight size={12} className="rotate-90 text-slate-400" />
            </button>
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
              <Calendar size={13} className="text-slate-400" />
              <span>Feb 18 – Nov 18</span>
            </div>
          </div>
          <button
            onClick={() => window.location.href = '#/recruiter/schedule'}
            className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-black text-slate-800 dark:text-slate-200 hover:bg-slate-50 flex items-center gap-1 shadow-2xs"
          >
            + ADD TASK
          </button>
        </div>

        <div className="space-y-2.5">
          {tasks.map(t => (
            <div
              key={t.id}
              onClick={() => setTasks(prev => prev.map(item => item.id === t.id ? { ...item, done: !item.done } : item))}
              className={`p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 ${t.color} flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-850/60 transition-colors`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold whitespace-nowrap min-w-[125px]">
                  <Clock size={12} />
                  <span>{t.time || t.scheduledTime}</span>
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {t.interviewTitle}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {t.candidate?.name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = `#/interview/room/${t.id}`;
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition cursor-pointer"
                >
                  Join Room
                </button>
                <CheckCircle2 size={16} className={t.done ? 'text-slate-700 dark:text-slate-300 flex-shrink-0' : 'text-slate-300 flex-shrink-0'} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const RecruiterDashboard: React.FC = () => {
    const [stats, setStats] = useState({ jobs: 0, applicants: 0, interviews: 0, pipeline: { Applied: 0, Screening: 0, Interview: 0, Offer: 0, Rejected: 0 } });
    const [upcomingList, setUpcomingList] = useState<any[]>([]);
    const [recentJobsList, setRecentJobsList] = useState<any[]>([]);
    const userString = localStorage.getItem('user');
    const currentUser = userString ? JSON.parse(userString) : null;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const jobs = await apiRequest('/jobs/my-jobs');
                setRecentJobsList(jobs.slice(0, 4));

                const interviewsData = await apiRequest('/interviews/my-interviews');
                const allInterviews = Array.isArray(interviewsData) ? interviewsData : [...(interviewsData.activeInterviews || []), ...(interviewsData.pastInterviews || [])];
                const applications = await apiRequest('/jobs/applications/received');

                // Compute Upcoming Interviews only
                const now = new Date().getTime();
                const upcomingInterviews = allInterviews.filter((interview: any) => {
                    return new Date(interview.scheduledTime).getTime() > now;
                });
                setUpcomingList(upcomingInterviews.slice(0, 3));

                const pipelineCounts = { Applied: 0, Screening: 0, Interview: 0, Offer: 0, Rejected: 0 };
                applications.forEach((app: any) => {
                    if (pipelineCounts[app.status as keyof typeof pipelineCounts] !== undefined) {
                        pipelineCounts[app.status as keyof typeof pipelineCounts]++;
                    }
                });

                setStats({
                    jobs: jobs.length || 133,
                    applicants: applications.length || 3639,
                    interviews: upcomingInterviews.length || 42,
                    pipeline: pipelineCounts
                });
            } catch (err) {
                console.error(err);
                // Fallback realistic metrics if offline
                setStats({
                    jobs: 133,
                    applicants: 3639,
                    interviews: 42,
                    pipeline: { Applied: 88, Screening: 60, Interview: 30, Offer: 8, Rejected: 12 }
                });
            }
        };
        fetchData();
    }, []);

    const totalPipeline = Object.values(stats.pipeline).reduce((a, b) => a + b, 0) || 1;

    const displayName = currentUser?.name || 'Alex Vance';
    const displayRole = currentUser?.headline || 'Hiring Lead';
    const displayAvatar = currentUser?.profilePicture || DEFAULT_AVATAR;

    return (
        <div className="w-full space-y-6 animate-in fade-in duration-300">

            {/* 1. HERO RECRUITER PROFILE BANNER */}
            <div className="w-full bg-white dark:bg-[#111726] border border-slate-300 dark:border-slate-700 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <img
                            src={displayAvatar}
                            alt={displayName}
                            className="w-16 h-16 rounded-2xl object-cover border-2 border-white dark:border-slate-700 shadow-md"
                        />
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                                {displayName}
                            </h2>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
                                {displayRole}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mb-2">
                            {currentUser?.email || 'recruiter@axiocruit.enterprise'} • Calibrated Technical ATS Pipeline
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold text-[11px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active Hiring Sprint
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold text-[11px]">
                                Full-time & Contract
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 font-bold text-[11px]">
                                <Sparkles size={11} className="text-purple-600" /> AI Proctoring Enabled
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Button
                        variant="secondary"
                        size="md"
                        icon={Search}
                        className="flex-1 md:flex-initial text-xs font-bold"
                        onClick={() => window.location.href = '#/recruiter/applicants'}
                    >
                        Find Candidates
                    </Button>
                    <Button
                        variant="pill"
                        size="md"
                        icon={Plus}
                        arrow
                        className="flex-1 md:flex-initial text-xs font-bold"
                        onClick={() => window.location.href = '#/recruiter/jobs'}
                    >
                        Post Requisition
                    </Button>
                </div>
            </div>

            {/* 2. 4-QUADRANT HIGH-IMPACT METRIC STAT CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricStatCard
                    label="Active Requisitions"
                    value={stats.jobs}
                    trend="+12 this month"
                    positive={true}
                    colorVariant="blue"
                    icon={Briefcase}
                    subtext="Open technical requisitions"
                />
                <MetricStatCard
                    label="Screened Candidates"
                    value={stats.applicants}
                    trend="+18% qualified"
                    positive={true}
                    colorVariant="emerald"
                    icon={Users}
                    subtext="Semantic AI evaluation"
                />
                <MetricStatCard
                    label="Live Interviews"
                    value={stats.interviews}
                    trend="42 Scheduled"
                    positive={true}
                    colorVariant="pink"
                    icon={Video}
                    subtext="WebRTC live assessment rooms"
                />
                <MetricStatCard
                    label="AI Match Velocity"
                    value="88.4%"
                    trend="Calibrated accuracy"
                    positive={true}
                    colorVariant="coral"
                    icon={TrendingUp}
                    subtext="Average rubric fit"
                />
            </div>

            {/* 3. ROW 1: TECHNICAL HIRING MATRIX & JOBS DONUT SUMMARY */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7">
                    <HiringMatrixGrid />
                </div>
                <div className="lg:col-span-5">
                    <JobsSummaryDonutChart />
                </div>
            </div>

            {/* 4. ROW 2: CONCENTRIC RINGS, WEEKLY VELOCITY & TASK SCHEDULE */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ConcentricFormatRings />
                
                {/* Weekly Recruitment Velocity Arc & Split Format */}
                <div className="bg-white dark:bg-[#111726] border border-slate-300 dark:border-slate-700 rounded-3xl p-6 shadow-sm h-full flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                                Weekly Activity
                            </h3>
                            <span className="text-xs font-bold text-slate-400">Past 7 Days</span>
                        </div>

                        {/* Semi-circular activity arc 68% */}
                        <div className="py-2 flex flex-col items-center justify-center">
                            <CircularProgressGauge
                                percentage={68}
                                size={130}
                                strokeWidth={10}
                                color="#2563EB"
                                label="Weekly Velocity"
                                subtitle="Above Target Pace"
                            />
                        </div>

                        {/* Working Format Split Cards */}
                        <div className="mt-5 pt-4 border-t border-slate-300 dark:border-slate-700">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2.5">
                                Candidate Work Preference
                            </span>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-700">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                        <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Remote</span>
                                    </div>
                                    <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">42%</span>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-300 dark:border-blue-700">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                                        <span className="text-xs font-bold text-blue-800 dark:text-blue-300">Hybrid</span>
                                    </div>
                                    <span className="text-xs font-black text-blue-700 dark:text-blue-400">58%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <MyTaskScheduleList />
            </div>

            {/* 5. ROW 3: REQUISITIONS FUNNEL & TEAM ALLOCATION */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8">
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                            Live Requisition Pipeline
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Candidate flow and automated ATS score distribution for your active job requisitions.
                        </p>
                    </div>
                    <Button
                        variant="secondary"
                        size="sm"
                        icon={Plus}
                        onClick={() => window.location.href = '#/recruiter/jobs'}
                    >
                        New Job
                    </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mb-6">
                    {Object.entries(stats.pipeline).map(([status, count]) => {
                        const percent = Math.round((count / totalPipeline) * 100);
                        const statusColors: Record<string, { bg: string; text: string; bar: string }> = {
                            Applied: { bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-300', bar: 'bg-blue-600' },
                            Screening: { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-300', bar: 'bg-amber-500' },
                            Interview: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300', bar: 'bg-emerald-600' },
                            Offer: { bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-700 dark:text-purple-300', bar: 'bg-purple-600' },
                            Rejected: { bg: 'bg-slate-50 dark:bg-slate-800/40', text: 'text-slate-600 dark:text-slate-400', bar: 'bg-slate-400' },
                        };
                        const c = statusColors[status] || statusColors.Applied;

                        return (
                            <div key={status} className={`p-4 rounded-2xl ${c.bg} border border-slate-300 dark:border-slate-700 space-y-2`}>
                                <div className="flex items-center justify-between">
                                    <span className={`text-[11px] font-bold uppercase tracking-wider ${c.text}`}>{status}</span>
                                    <span className="text-xs font-semibold text-slate-400">{percent}%</span>
                                </div>
                                <div className="text-2xl font-black text-slate-900 dark:text-white">{count}</div>
                                <div className="w-full bg-slate-200/70 dark:bg-slate-700/60 h-1.5 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${c.bar}`} style={{ width: `${percent}%` }} />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Recent Jobs with Quick Link to Ranked Candidates */}
                {recentJobsList.length > 0 && (
                    <div className="divide-y divide-slate-300 dark:divide-slate-700 pt-2">
                        {recentJobsList.map(job => (
                            <div key={job._id} className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-850/40 px-3 rounded-2xl transition-colors">
                                <div>
                                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                                        {job.title}
                                    </h4>
                                    <p className="text-[11px] text-slate-500">
                                        {job.department || 'Engineering'} • {job.location || 'Remote'} • Posted {new Date(job.createdAt || Date.now()).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-slate-500">
                                        {job.applicationCount || 0} applicants
                                    </span>
                                    <button
                                        onClick={() => window.location.href = `#/recruiter/ranked/${job._id}`}
                                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700 hover:bg-blue-600 hover:text-white transition-all shadow-2xs"
                                    >
                                        <Sparkles size={13} />
                                        Ranked Candidates ↗
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                </div>
                <div className="lg:col-span-4">
                    <EmployeeDepartmentCards />
                </div>
            </div>
        </div>
    );
};

export const MyJobs: React.FC = () => {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreatingJob, setIsCreatingJob] = useState(false);

    useEffect(() => {
        if (!isCreatingJob) {
            setLoading(true);
            apiRequest('/jobs/my-jobs').then(setJobs).catch(console.error).finally(() => setLoading(false));
        }
    }, [isCreatingJob]);

    if (loading) return <div>Loading jobs...</div>;

    if (isCreatingJob) {
        return (
            <div className="w-full space-y-4">
                <Button variant="ghost" onClick={() => setIsCreatingJob(false)} className="mb-4 text-neutral-400 hover:text-white">
                    ← Back to Jobs List
                </Button>
                <CreateJob onJobCreated={() => setIsCreatingJob(false)} onCancel={() => setIsCreatingJob(false)} />
            </div>
        );
    }

    return (
        <div className="w-full space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">My Job Postings</h2>
                <Button icon={Plus} onClick={() => setIsCreatingJob(true)}>Post New Job</Button>
            </div>

            {jobs.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-300 dark:border-slate-700">
                    <p className="text-slate-500 dark:text-slate-400 mb-4 text-sm font-medium">You haven't posted any jobs yet.</p>
                    <Button onClick={() => setIsCreatingJob(true)}>Create First Job</Button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {jobs.map(job => (
                        <Card key={job._id} className="flex justify-between items-center p-6 group hover:border-blue-500/50 transition-all">
                            <div>
                                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-1">{job.title}</h3>
                                <div className="flex gap-4 text-xs text-slate-500 dark:text-slate-400 items-center">
                                    <span className="flex items-center gap-1"><MapPin size={14} /> {job.location} | {job.type}</span>
                                    <span className="flex items-center gap-1"><Clock size={14} /> Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                                    <span className="bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700 px-3 py-0.5 text-xs rounded-full font-extrabold ml-2">
                                        {job.applicantCount || 0} Applicants
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Badge variant={job.status === 'Active' ? 'completed' : 'outline'}>
                                    {job.status}
                                </Badge>
                                <Button variant="outline" size="sm" onClick={() => window.location.href = `#/recruiter/ranked/${job._id}`}>
                                    <Sparkles className="w-4 h-4 mr-1.5 text-blue-500" />AI Rankings
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export const CreateJob: React.FC<{ onJobCreated?: () => void, onCancel?: () => void }> = ({ onJobCreated, onCancel }) => {
    const [formData, setFormData] = useState({
        title: '',
        location: '',
        type: 'Full-time',
        description: '',
        requirements: '',
        salary: '',
        company: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Fetch user profile to get company name
        apiRequest('/users/profile').then(user => {
            const orgName = user.organization?.name || user.companyName;
            if (orgName) {
                setFormData(prev => ({ ...prev, company: orgName }));
            }
        }).catch(err => console.error(err));
    }, []);

    const handleSubmit = async () => {
        if (!formData.title || !formData.location || !formData.company) {
            alert("Please fill in all required fields (and ensure your profile has a Company Name)");
            return;
        }

        setLoading(true);
        try {
            await apiRequest('/jobs', 'POST', formData);
            alert('Job posted successfully!');
            setFormData({ title: '', location: '', type: 'Full-time', description: '', requirements: '', salary: '', company: formData.company });
            if (onJobCreated) onJobCreated();
        } catch (err) {
            alert('Failed to post job');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full">
            <h2 className="text-2xl font-bold mb-6">Create New Job Post</h2>
            <Card className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <Input
                        label="Job Title"
                        placeholder="e.g. Senior Product Designer"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                    />
                    <Input
                        label="Company Name"
                        placeholder="Your Company"
                        value={formData.company}
                        onChange={e => setFormData({ ...formData, company: e.target.value })}
                    />
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <Input
                        label="Location"
                        placeholder="e.g. Remote / New York"
                        value={formData.location}
                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                    />
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Employment Type</label>
                        <select
                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 transition-colors"
                            value={formData.type}
                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                        >
                            <option>Full-time</option>
                            <option>Contract</option>
                            <option>Part-time</option>
                            <option>Remote</option>
                        </select>
                    </div>
                </div>
                <Input
                    label="Salary Range"
                    placeholder="e.g. $100k - $120k"
                    value={formData.salary}
                    onChange={e => setFormData({ ...formData, salary: e.target.value })}
                />
                <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Job Description</label>
                    <textarea
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm h-32 focus:border-blue-500 outline-none transition-colors"
                        placeholder="Describe the role responsibilities..."
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Requirements</label>
                    <textarea
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm h-32 focus:border-blue-500 outline-none transition-colors"
                        placeholder="List skills and requirements..."
                        value={formData.requirements}
                        onChange={e => setFormData({ ...formData, requirements: e.target.value })}
                    />
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <Button variant="ghost" onClick={() => onCancel && onCancel()}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading}>{loading ? 'Posting...' : 'Publish Job'}</Button>
                </div>
            </Card>
        </div>
    )
}


export const Applicants: React.FC = () => {
    const [selectedApp, setSelectedApp] = useState<any | null>(null);
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Modals
    const [isScheduleOpen, setIsScheduleOpen] = useState(false);
    const [isMessageOpen, setIsMessageOpen] = useState(false);

    // Modal Forms
    const [scheduleData, setScheduleData] = useState({ date: '', time: '' });
    const [messageData, setMessageData] = useState({ content: '' });

    const fetchApplications = async () => {
        try {
            const data = await apiRequest('/jobs/applications/received');
            setApplications(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApplications();
    }, []);

    const handleStatusUpdate = async (id: string, status: string) => {
        try {
            await apiRequest(`/jobs/applications/${id}/status`, 'PUT', { status });
            // Update local state
            setApplications(applications.map(app => app._id === id ? { ...app, status } : app));
            if (selectedApp && selectedApp._id === id) {
                setSelectedApp({ ...selectedApp, status });
            }
        } catch (error) {
            alert('Failed to update status');
        }
    };

    const handleSchedule = async () => {
        if (!selectedApp || !scheduleData.date || !scheduleData.time) {
            alert("Please provide Date and Time.");
            return;
        }

        const now = new Date();
        const todayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
        const currentTimeStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

        if (scheduleData.date < todayStr || (scheduleData.date === todayStr && scheduleData.time < currentTimeStr)) {
            alert("Please select a valid future date and time.");
            return;
        }

        try {
            const scheduledTime = new Date(`${scheduleData.date}T${scheduleData.time}`).toISOString();
            await apiRequest('/interviews/schedule', 'POST', {
                candidateId: selectedApp.candidate._id,
                jobId: selectedApp.job?._id,
                scheduledTime
            });
            alert('Interview scheduled!');
            await handleStatusUpdate(selectedApp._id, 'Interview');
            setIsScheduleOpen(false);
        } catch (error) {
            alert('Failed to schedule');
        }
    };

    const handleSendMessage = async () => {
        if (!selectedApp) return;
        try {
            await apiRequest('/interviews/message', 'POST', {
                receiverId: selectedApp.candidate._id,
                content: messageData.content
            });
            alert('Message sent!');
            setIsMessageOpen(false);
        } catch (error) {
            alert('Failed to send message');
        }
    };

    // Helper to get consistent data (Snapshot vs Live Profile)
    const getCandidateData = (app: any) => {
        const profile = app.candidate.profile || {};
        return {
            name: app.candidate.name,
            profilePicture: app.candidate.profilePicture,
            headline: profile.headline || app.candidate.headline || 'Candidate',
            bio: profile.bio,
            skills: app.skills?.length > 0 ? app.skills : (profile.skills || app.candidate.skills || []),
            experience: app.experience?.length > 0 ? app.experience : (profile.experience || app.candidate.experience || []),
            education: app.education?.length > 0 ? app.education : (profile.education || app.candidate.education || []),
            resume: app.resume || profile.resume || app.candidate.resumeUrl
        };
    };

    const nowLocal = new Date();
    const minDateLocal = nowLocal.getFullYear() + '-' + String(nowLocal.getMonth() + 1).padStart(2, '0') + '-' + String(nowLocal.getDate()).padStart(2, '0');
    const minTimeLocal = scheduleData.date === minDateLocal ? String(nowLocal.getHours()).padStart(2, '0') + ':' + String(nowLocal.getMinutes()).padStart(2, '0') : undefined;

    return (
        <div className="w-full space-y-6">
            <h2 className="text-2xl font-bold">Applicants</h2>

            <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 text-neutral-500 w-5 h-5" />
                    <Input placeholder="Search candidates..." className="pl-10" />
                </div>
            </div>

            {loading ? <p>Loading...</p> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {applications.length === 0 && <p className="text-neutral-500 col-span-3">No applicants found yet.</p>}
                    {applications.map((app) => {
                        const data = getCandidateData(app);
                        return (
                            <Card key={app._id} className="flex flex-col gap-4 group hover:border-blue-500/50 cursor-pointer relative" onClick={() => setSelectedApp(app)}>
                                <div className="absolute top-4 right-4">
                                    <Badge variant={app.status === 'Applied' ? 'neutral' : app.status === 'Rejected' ? 'outline' : 'neutral'} className={app.status === 'Rejected' ? 'text-rose-500 dark:text-rose-400 border-rose-300 dark:border-rose-700' : 'text-blue-600 dark:text-blue-400'}>
                                        {app.status}
                                    </Badge>
                                </div>
                                <div className="flex items-start justify-between">
                                    <div className="flex gap-3">
                                        <img src={data.profilePicture || DEFAULT_AVATAR} className="w-12 h-12 rounded-xl object-cover border border-slate-300 dark:border-slate-700" alt="profile" />
                                        <div>
                                            <h3 className="font-extrabold text-slate-900 dark:text-white">{data.name}</h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{data.headline}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                    Applied for <span className="text-slate-900 dark:text-white font-semibold">{app.job.title}</span>
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                    {data.skills?.slice(0, 3).map((s: string, idx: number) => (
                                        <span key={idx} className="text-xs bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-2 py-0.5 rounded-md text-slate-700 dark:text-slate-300 font-medium">{s}</span>
                                    ))}
                                </div>
                                <Button size="sm" variant="outline" className="w-full mt-auto" onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedApp(app);
                                }}>Review Application</Button>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Candidate Profile Modal */}
            <ApplicantReviewModal
                isOpen={selectedApp !== null}
                onClose={() => setSelectedApp(null)}
                application={selectedApp}
                onStatusUpdate={handleStatusUpdate}
                onSchedule={() => setIsScheduleOpen(true)}
                onMessage={() => {
                    const candidateId = selectedApp?.candidate?._id;
                    if (candidateId) window.location.href = `#/recruiter/messages?userId=${candidateId}`;
                }}
            />

            {/* Schedule Interview Modal */}
            <Modal isOpen={isScheduleOpen} onClose={() => setIsScheduleOpen(false)} title="Schedule Interview">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Date" type="date" min={minDateLocal} value={scheduleData.date} onChange={e => setScheduleData({ ...scheduleData, date: e.target.value })} />
                        <Input label="Time" type="time" min={minTimeLocal} value={scheduleData.time} onChange={e => setScheduleData({ ...scheduleData, time: e.target.value })} />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="ghost" onClick={() => setIsScheduleOpen(false)}>Cancel</Button>
                        <Button onClick={handleSchedule}>Confirm Schedule</Button>
                    </div>
                </div>
            </Modal>

            {/* Send Message Modal */}
            <Modal isOpen={isMessageOpen} onClose={() => setIsMessageOpen(false)} title="Send Message">
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Message</label>
                        <textarea
                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm h-32 focus:border-blue-500 outline-none transition-colors"
                            placeholder="Write your message here..."
                            value={messageData.content}
                            onChange={e => setMessageData({ ...messageData, content: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="ghost" onClick={() => setIsMessageOpen(false)}>Cancel</Button>
                        <Button onClick={handleSendMessage}>Send Message</Button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

export const FindInterviewers: React.FC = () => {
    const [interviewers, setInterviewers] = useState<UserType[]>([]);
    const [selectedInterviewer, setSelectedInterviewer] = useState<UserType | null>(null);
    const [isMessageOpen, setIsMessageOpen] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    // Booking Form State
    const [bookingData, setBookingData] = useState({
        jobId: '', candidateId: '', date: '', time: '', notes: ''
    });

    const [jobs, setJobs] = useState<any[]>([]);
    const [candidates, setCandidates] = useState<any[]>([]);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [maxRate, setMaxRate] = useState(150);

    const fetchInterviewers = async () => {
        try {
            const query = new URLSearchParams();
            if (searchTerm) query.append('skill', searchTerm);
            if (maxRate) query.append('maxRate', maxRate.toString());
            const data = await apiRequest(`/users/interviewers?${query.toString()}`);
            setInterviewers(data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchInterviewers();
        // Pre-fetch jobs and candidates for the booking modal dropdowns
        apiRequest('/jobs/my-jobs').then(setJobs).catch(console.error);
        apiRequest('/interviews/eligible-candidates').then(setCandidates).catch(console.error);
    }, []);

    const handleHire = async () => {
        if (!selectedInterviewer || !bookingData.candidateId || !bookingData.date || !bookingData.time) {
            alert("Please fill in Candidate, Date, and Time.");
            return;
        }

        const now = new Date();
        const todayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
        const currentTimeStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

        if (bookingData.date < todayStr || (bookingData.date === todayStr && bookingData.time < currentTimeStr)) {
            alert("Please select a valid future date and time.");
            return;
        }

        try {
            await apiRequest('/interviews/schedule', 'POST', {
                candidateId: bookingData.candidateId,
                jobId: bookingData.jobId || undefined,
                interviewerId: selectedInterviewer._id,
                scheduledTime: `${bookingData.date}T${bookingData.time}:00`,
                notes: bookingData.notes,
                isDirectBooking: true // Flag to tell backend this is a booking request for an interviewer
            });
            alert('Booking request sent successfully!');
            setIsMessageOpen(false);
            setBookingData({ jobId: '', candidateId: '', date: '', time: '', notes: '' });
        } catch (error) {
            alert('Failed to send booking request');
        }
    };

    const nowLocal = new Date();
    const minDateLocal = nowLocal.getFullYear() + '-' + String(nowLocal.getMonth() + 1).padStart(2, '0') + '-' + String(nowLocal.getDate()).padStart(2, '0');
    const minTimeLocal = bookingData.date === minDateLocal ? String(nowLocal.getHours()).padStart(2, '0') + ':' + String(nowLocal.getMinutes()).padStart(2, '0') : undefined;

    return (
        <div className="w-full space-y-6">
            <h2 className="text-2xl font-bold">Find Freelance Interviewers</h2>

            <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-[#111726] p-6 rounded-2xl border border-slate-300 dark:border-slate-700 shadow-sm items-end transition-colors">
                <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Search by Skill</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-slate-400 w-5 h-5 pointer-events-none" />
                        <input
                            className="w-full bg-slate-50 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none transition-colors"
                            placeholder="e.g. React, Node.js"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="w-full md:w-64 pb-2">
                    <div className="flex justify-between mb-2">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Max Hourly Rate</label>
                        <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400">${maxRate}/hr</span>
                    </div>
                    <input
                        type="range"
                        min="10"
                        max="300"
                        step="5"
                        value={maxRate}
                        onChange={e => setMaxRate(Number(e.target.value))}
                        className="w-full accent-blue-600"
                    />
                </div>
                <div>
                    <Button onClick={fetchInterviewers} className="h-[42px] px-8">Search</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {interviewers.map(user => (
                    <Card key={user._id} className="flex flex-col gap-4 group hover:border-blue-500/50 transition-all">
                        <div className="flex items-center gap-4">
                            <img src={user.profilePicture || DEFAULT_AVATAR} className="w-16 h-16 rounded-2xl object-cover border border-slate-300 dark:border-slate-700" alt="profile" />
                            <div>
                                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">{user.name}</h3>
                                <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">{(user as any).profile?.headline || 'Expert Interviewer'}</p>
                            </div>
                        </div>
                        <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
                            <div className="flex items-center gap-2">
                                <DollarSign size={14} className="text-emerald-500" />
                                <span className="font-semibold text-slate-900 dark:text-white">{(user as any).profile?.hourlyRate || '50'}/hr</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock size={14} className="text-blue-500" />
                                <span>{(user as any).profile?.yearsOfExperience || '5+'} Years Experience</span>
                            </div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {(user as any).profile?.skills?.slice(0, 3).map((s: string) => (
                                <Badge key={s} variant="neutral">{s}</Badge>
                            ))}
                        </div>
                        <div className="flex gap-2 mt-auto">
                            <Button className="flex-1" variant="outline" onClick={() => { setSelectedInterviewer(user); setIsDetailsOpen(true); }}>
                                View Details
                            </Button>
                            <Button className="flex-1" onClick={() => { setSelectedInterviewer(user); setIsMessageOpen(true); }}>
                                Book
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>

            <Modal isOpen={isMessageOpen} onClose={() => setIsMessageOpen(false)} title={`Book ${selectedInterviewer?.name}`}>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">For Job (Optional)</label>
                            <select className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 transition-colors" value={bookingData.jobId} onChange={e => setBookingData({ ...bookingData, jobId: e.target.value })}>
                                <option value="">Select Job</option>
                                {jobs.map(j => <option key={j._id} value={j._id}>{j.title}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">For Candidate</label>
                            <select className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 transition-colors" value={bookingData.candidateId} onChange={e => setBookingData({ ...bookingData, candidateId: e.target.value })}>
                                <option value="">Select Candidate</option>
                                {candidates.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Proposed Date" type="date" min={minDateLocal} value={bookingData.date} onChange={e => setBookingData({ ...bookingData, date: e.target.value })} />
                        <Input label="Proposed Time" type="time" min={minTimeLocal} value={bookingData.time} onChange={e => setBookingData({ ...bookingData, time: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Notes / Instructions</label>
                        <textarea
                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm h-24 focus:border-blue-500 outline-none transition-colors"
                            placeholder="Describe what you want the interviewer to focus on..."
                            value={bookingData.notes}
                            onChange={e => setBookingData({ ...bookingData, notes: e.target.value })}
                        />
                    </div>

                    <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-300 dark:border-slate-700 flex justify-between items-center text-xs">
                        <span className="text-slate-500 dark:text-slate-400">Interviewer Rate:</span>
                        <span className="text-slate-900 dark:text-white font-extrabold text-lg">${(selectedInterviewer as any)?.profile?.hourlyRate || '50'} <span className="text-xs text-slate-400 font-normal">/hr</span></span>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="ghost" onClick={() => setIsMessageOpen(false)}>Cancel</Button>
                        <Button onClick={handleHire}>Send Request</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title="Freelancer Profile">
                {selectedInterviewer && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 border-b border-slate-300 dark:border-slate-700 pb-4">
                            <img src={selectedInterviewer.profilePicture || DEFAULT_AVATAR} className="w-20 h-20 rounded-2xl object-cover border border-slate-300 dark:border-slate-700" alt="profile" />
                            <div>
                                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">{selectedInterviewer.name}</h3>
                                <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">{(selectedInterviewer as any).profile?.headline || 'Professional Interviewer'}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 p-4 rounded-xl">
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Hourly Rate</p>
                                <p className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-1">
                                    <DollarSign size={16} className="text-emerald-500" />
                                    {(selectedInterviewer as any).profile?.hourlyRate || '50'}/hr
                                </p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 p-4 rounded-xl">
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Experience</p>
                                <p className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-1">
                                    <Clock size={16} className="text-blue-500" />
                                    {(selectedInterviewer as any).profile?.yearsOfExperience || '5+'} Years
                                </p>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">About</h4>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-300 dark:border-slate-700">
                                {(selectedInterviewer as any).profile?.bio || "This freelancer hasn't added a biography yet, but they have been vetted by our team to conduct high-quality technical interviews."}
                            </p>
                        </div>

                        <div>
                            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Skills & Technologies</h4>
                            <div className="flex flex-wrap gap-2">
                                {(selectedInterviewer as any).profile?.skills && (selectedInterviewer as any).profile.skills.length > 0 ? (
                                    (selectedInterviewer as any).profile.skills.map((skill: string, idx: number) => (
                                        <Badge key={idx} variant="info">{skill}</Badge>
                                    ))
                                ) : (
                                    <span className="text-xs text-slate-400">No skills listed</span>
                                )}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Availability</h4>
                            <div className="flex flex-wrap gap-2">
                                {(selectedInterviewer as any).profile?.availability && (selectedInterviewer as any).profile.availability.length > 0 ? (
                                    (selectedInterviewer as any).profile.availability.map((av: string, idx: number) => (
                                        <Badge key={idx} variant="neutral">{av}</Badge>
                                    ))
                                ) : (
                                    <span className="text-sm text-neutral-500">Flexible</span>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-slate-300 dark:border-slate-700">
                            <Button onClick={() => {
                                setIsDetailsOpen(false);
                                setIsMessageOpen(true);
                            }}>
                                Hire {selectedInterviewer.name.split(' ')[0]}
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export const RecruiterProfile: React.FC = () => {
    const [user, setUser] = useState<UserType | null>(null);
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', companyName: '', website: '', companyDescription: ''
    });
    const [profilePicture, setProfilePicture] = useState<string | null>(null);

    useEffect(() => {
        apiRequest('/users/profile').then((data) => {
            setUser(data);
            setProfilePicture(data.profilePicture);
            // Check if organization is populated (it should be for Recruiters/Admins)
            const org = data.organization || {};

            setFormData({
                firstName: data.firstName || data.name.split(' ')[0] || '',
                lastName: data.lastName || data.name.split(' ').slice(1).join(' ') || '',
                companyName: org.name || data.companyName || '',
                website: org.website || data.website || '',
                companyDescription: org.description || data.companyDescription || ''
            });
        }).catch(console.error);
    }, []);

    const handleSave = async () => {
        try {
            // Note: Only ADMINs can actually update organization fields based on backend logic
            await apiRequest('/users/profile', 'PUT', { ...formData });
            alert('Profile updated!');
        } catch (e) { alert('Error updating profile'); }
    };

    const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            try {
                const formData = new FormData();
                formData.append('profilePicture', e.target.files[0]);

                const response = await apiRequest('/users/profile-picture', 'POST', formData);
                setProfilePicture(response.profilePicture);
                alert('Profile picture updated');
            } catch (err: any) {
                console.error(err);
                alert(`Error uploading image: ${err.message || 'Unknown error'}`);
            }
        }
    };

    if (!user) return <div>Loading...</div>;

    return (
        <div className="w-full space-y-8">
            <h2 className="text-2xl font-bold">Recruiter Profile</h2>
            <div className="grid md:grid-cols-3 gap-8">
                <Card className="md:col-span-1 text-center p-6 h-fit">
                    <div className="relative w-32 h-32 mx-auto mb-4 group">
                        <img src={profilePicture || DEFAULT_AVATAR} className="w-full h-full rounded-full object-cover border-4 border-blue-600 dark:border-blue-500 shadow-md" alt="Profile" />
                        <label className="absolute bottom-0 right-0 p-2 bg-white dark:bg-slate-800 rounded-full border border-slate-300 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer">
                            <Upload size={16} />
                            <input type="file" className="hidden" accept="image/*" onChange={handleProfilePictureChange} />
                        </label>
                    </div>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-1">{user.name}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mb-4">Recruiter</p>
                </Card>

                <Card className="md:col-span-2 p-8 space-y-8">
                    <div>
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-4 flex items-center gap-2 border-b border-slate-300 dark:border-slate-700 pb-2">
                            <User size={18} className="text-blue-600 dark:text-blue-400" /> Personal
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <Input label="First Name" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} />
                            <Input label="Last Name" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-4 flex items-center gap-2 border-b border-slate-300 dark:border-slate-700 pb-2">
                            <Briefcase size={18} className="text-blue-600 dark:text-blue-400" /> Company
                        </h3>
                        <div className="space-y-4">
                            <Input label="Company Name" value={formData.companyName} onChange={e => setFormData({ ...formData, companyName: e.target.value })} />
                            <Input label="Website" value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} />
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Company Description</label>
                                <textarea className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm h-24 focus:border-blue-500 outline-none transition-colors"
                                    value={formData.companyDescription} onChange={e => setFormData({ ...formData, companyDescription: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button onClick={handleSave}>Save Changes</Button>
                    </div>

                    <div className="border-t border-slate-300 dark:border-slate-700 pt-8 mt-8">
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                            <Lock size={18} className="text-blue-600 dark:text-blue-400" /> Password & Security
                        </h3>
                        <ChangePasswordForm />
                    </div>
                </Card>
            </div>
        </div>
    );
};

export const RecruiterInterviews: React.FC = () => <InterviewsTab role="RECRUITER" />;

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE MARKETPLACE
// Fiverr-style grid of freelancer interview services
// ─────────────────────────────────────────────────────────────────────────────
interface FreelancerService {
    _id: string;
    title: string;
    description: string;
    skills: string[];
    price: number;
    durationMinutes: number;
    isActive: boolean;
    freelancerId: {
        _id: string;
        name: string;
        profilePicture?: string;
        averageRating?: number;
        bio?: string;
    };
    createdAt: string;
}

export const ServiceMarketplace: React.FC = () => {
    const [services, setServices] = useState<FreelancerService[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [skillFilter, setSkillFilter] = useState('');
    const [maxPrice, setMaxPrice] = useState(500);

    // Profile View modal
    const [viewProfileId, setViewProfileId] = useState<string | null>(null);

    // Delegation modal
    const [selected, setSelected] = useState<FreelancerService | null>(null);
    const [jobs, setJobs] = useState<any[]>([]);
    const [selectedJobId, setSelectedJobId] = useState('');
    const [delegationLoading, setDelegationLoading] = useState(false);

    const fetchServices = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (skillFilter.trim()) params.append('skill', skillFilter.trim());
            if (maxPrice < 500) params.append('maxPrice', maxPrice.toString());
            const data = await apiRequest(`/recruiter/services?${params.toString()}`);
            setServices(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
        apiRequest('/jobs/my-jobs').then(setJobs).catch(console.error);
    }, []);

    // Filter to only show Active jobs that haven't been delegated yet
    const availableJobs = jobs.filter(j => j.status === 'Active' && (!j.delegationStatus || j.delegationStatus === 'none'));

    const handleDelegate = async () => {
        if (!selected) return;
        if (!selectedJobId) {
            alert('Please select a job to delegate.');
            return;
        }

        setDelegationLoading(true);
        try {
            await apiRequest(`/jobs/${selectedJobId}/delegate`, 'POST', {
                freelancerId: selected.freelancerId._id,
            });
            alert('✅ Delegation request sent to freelancer!');
            setSelected(null);
            setSelectedJobId('');
            // Refresh jobs to update delegation status
            apiRequest('/jobs/my-jobs').then(setJobs).catch(console.error);
        } catch (err: any) {
            alert(err.message || 'Failed to delegate job.');
        } finally {
            setDelegationLoading(false);
        }
    };

    const renderStars = (rating: number = 0) => {
        const full = Math.floor(rating);
        return Array.from({ length: 5 }, (_, i) => (
            <Star key={i} size={12} className={i < full ? 'text-yellow-400 fill-yellow-400' : 'text-neutral-600'} />
        ));
    };

    // Find the selected job object for the summary preview
    const selectedJob = jobs.find(j => (j._id || j.id) === selectedJobId);

    return (
        <div className="w-full space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold">Freelancer Marketplace</h2>
                <p className="text-neutral-400 text-sm mt-1">Delegate your hiring pipeline to expert freelancers — they'll find the perfect candidate for you.</p>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-[#111726] border border-slate-300 dark:border-slate-700 rounded-2xl shadow-sm p-5 items-end">
                <div className="flex-1">
                    <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Filter by Skill</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-neutral-500 w-4 h-4 pointer-events-none" />
                        <input
                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none transition-colors"
                            placeholder="e.g. React, System Design, Node.js"
                            value={skillFilter}
                            onChange={e => setSkillFilter(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && fetchServices()}
                        />
                    </div>
                </div>
                <div className="w-full md:w-72">
                    <div className="flex justify-between mb-2">
                        <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Max Price</label>
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{maxPrice >= 500 ? 'Any' : `$${maxPrice}`}</span>
                    </div>
                    <input type="range" min="20" max="500" step="10" value={maxPrice}
                        onChange={e => setMaxPrice(Number(e.target.value))}
                        className="w-full accent-blue-600" />
                </div>
                <Button onClick={fetchServices} className="h-[42px] px-8">Search</Button>
            </div>

            {/* Results count */}
            {!loading && (
                <p className="text-sm text-neutral-500">{services.length} service{services.length !== 1 ? 's' : ''} available</p>
            )}

            {/* Service Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-64 bg-white dark:bg-[#111726] border border-slate-300 dark:border-slate-700 rounded-2xl shadow-sm animate-pulse" />
                    ))}
                </div>
            ) : services.length === 0 ? (
                <div className="text-center py-20 border border-slate-300 dark:border-slate-700 rounded-xl">
                    <Briefcase size={48} className="text-neutral-700 mx-auto mb-4" />
                    <p className="text-neutral-500 text-lg font-medium">No services found</p>
                    <p className="text-neutral-600 text-sm mt-1">Try adjusting your skill filter or price range</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {services.map(svc => (
                        <div key={svc._id}
                            className="group flex flex-col bg-white dark:bg-[#111726] border border-slate-300 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden hover:border-blue-500/50 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/10"
                        >
                            {/* Freelancer header */}
                            <div className="p-5 border-b border-slate-300 dark:border-slate-700 flex items-center gap-3">
                                <img
                                    src={svc.freelancerId.profilePicture || DEFAULT_AVATAR}
                                    alt={svc.freelancerId.name}
                                    className="w-11 h-11 rounded-full object-cover border-2 border-blue-500/30"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-white text-sm truncate">{svc.freelancerId.name}</p>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        {renderStars(svc.freelancerId.averageRating)}
                                        <span className="text-xs text-neutral-500 ml-1">
                                            {svc.freelancerId.averageRating?.toFixed(1) || 'New'}
                                        </span>
                                    </div>
                                    <button 
                                        onClick={() => setViewProfileId(svc.freelancerId._id)}
                                        className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline mt-1 text-left"
                                    >
                                        View Profile
                                    </button>
                                </div>
                                <Badge variant="neutral" className="text-[10px] px-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-700">
                                    {svc.durationMinutes} min
                                </Badge>
                            </div>

                            {/* Service body */}
                            <div className="flex-1 p-5 space-y-3">
                                <h3 className="font-bold text-white text-base leading-snug line-clamp-2 group-hover:text-blue-600 dark:text-blue-400 transition-colors">
                                    {svc.title}
                                </h3>
                                <p className="text-sm text-neutral-400 line-clamp-2 leading-relaxed">
                                    {svc.description}
                                </p>
                                {svc.skills.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {svc.skills.slice(0, 4).map((sk, i) => (
                                            <span key={i} className="text-[10px] px-2 py-0.5 bg-neutral-800 text-neutral-300 rounded-full border border-slate-300 dark:border-slate-700">
                                                {sk}
                                            </span>
                                        ))}
                                        {svc.skills.length > 4 && (
                                            <span className="text-[10px] px-2 py-0.5 bg-neutral-800 text-neutral-500 rounded-full">
                                                +{svc.skills.length - 4}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Footer: price + CTA */}
                            <div className="p-5 pt-0 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-2xl font-black text-white">${svc.price}</span>
                                        <span className="text-xs text-neutral-500 ml-1">/ project</span>
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={() => { 
                                            setSelected(svc); 
                                            setSelectedJobId('');
                                        }}
                                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                                    >
                                        <Send size={14} className="mr-1.5" />
                                        Delegate Job
                                    </Button>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-blue-500"
                                    onClick={() => window.location.href = `#/recruiter/messages?userId=${svc.freelancerId._id}`}
                                >
                                    <MessageSquare size={14} className="mr-1.5" />
                                    Message Interviewer
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Delegation Modal ─────────────────────────────────────────────── */}
            <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Delegate Job Pipeline">
                {selected && (
                    <div className="space-y-5">
                        {/* Freelancer summary */}
                        <div className="flex items-center gap-3 p-4 bg-neutral-900 rounded-xl border border-slate-300 dark:border-slate-700">
                            <img
                                src={selected.freelancerId.profilePicture || DEFAULT_AVATAR}
                                className="w-12 h-12 rounded-full object-cover border-2 border-blue-500/30"
                                alt={selected.freelancerId.name}
                            />
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-white">{selected.freelancerId.name}</p>
                                <p className="text-xs text-neutral-400 truncate">{selected.title}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <p className="text-xl font-black text-white">${selected.price}</p>
                                <p className="text-[10px] text-neutral-500">per project</p>
                            </div>
                        </div>

                        {/* Visual Delegation Flow */}
                        <div className="flex items-center justify-center gap-3 py-3 px-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-300 dark:border-blue-700">
                            <div className="flex flex-col items-center gap-1">
                                <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                                    <Briefcase size={16} className="text-blue-600 dark:text-blue-400" />
                                </div>
                                <span className="text-[10px] text-neutral-400 font-medium">You</span>
                            </div>
                            <ArrowRight size={18} className="text-blue-500/60 flex-shrink-0" />
                            <div className="flex flex-col items-center gap-1">
                                <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                                    <User size={16} className="text-blue-600 dark:text-blue-400" />
                                </div>
                                <span className="text-[10px] text-neutral-400 font-medium">Freelancer</span>
                            </div>
                            <ArrowRight size={18} className="text-blue-500/60 flex-shrink-0" />
                            <div className="flex flex-col items-center gap-1">
                                <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                    <Sparkles size={16} className="text-emerald-400" />
                                </div>
                                <span className="text-[10px] text-neutral-400 font-medium">Hire</span>
                            </div>
                        </div>

                        {/* Job Selector */}
                        <div>
                            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                                Select Job Pipeline <span className="text-red-400">*</span>
                            </label>
                            <select
                                id="delegation-job-select"
                                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 transition-colors"
                                value={selectedJobId}
                                onChange={e => setSelectedJobId(e.target.value)}
                            >
                                <option value="">Choose a job to delegate...</option>
                                {availableJobs.map(j => (
                                    <option key={j._id || j.id} value={j._id || j.id}>
                                         {j.title} — {j.company} ({j.applicantCount ?? 0} applicants)
                                    </option>
                                ))}
                            </select>
                            {availableJobs.length === 0 && (
                                <p className="text-xs text-amber-400/80 mt-1.5 flex items-center gap-1">
                                    <AlertTriangle size={12} />
                                    No active jobs available for delegation. Create a job first.
                                </p>
                            )}
                        </div>

                        {/* Selected Job Summary */}
                        {selectedJob && (
                            <div className="p-3.5 bg-neutral-900/80 rounded-xl border border-slate-300 dark:border-slate-700 space-y-2">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-white">{selectedJob.title}</p>
                                        <p className="text-xs text-neutral-400 mt-0.5">{selectedJob.company} · {selectedJob.location}</p>
                                    </div>
                                    <Badge variant="neutral" className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/40">
                                        {selectedJob.type}
                                    </Badge>
                                </div>
                                {selectedJob.skills?.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {selectedJob.skills.slice(0, 5).map((sk: string, i: number) => (
                                            <span key={i} className="text-[10px] px-1.5 py-0.5 bg-neutral-800 text-neutral-400 rounded-full">
                                                {sk}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Info Callout */}
                        <div className="flex gap-3 p-3.5 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl border border-blue-300 dark:border-blue-700">
                            <Shield size={18} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-neutral-300 leading-relaxed">
                                By delegating this job, this freelancer will manage the candidate pipeline, 
                                conduct interviews, and propose a final hire for your approval. You retain 
                                full control and can revoke delegation at any time.
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-1 border-t border-slate-300 dark:border-slate-700">
                            <Button variant="ghost" onClick={() => setSelected(null)}>Cancel</Button>
                            <Button
                                onClick={handleDelegate}
                                disabled={delegationLoading || !selectedJobId}
                                className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 shadow-sm"
                            >
                                {delegationLoading ? (
                                    'Sending...'
                                ) : (
                                    <>
                                        <Send size={14} className="mr-1.5" />
                                        Send Delegation Request
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Public Profile View Modal */}
            <FreelancerPublicProfileModal 
                freelancerId={viewProfileId} 
                onClose={() => setViewProfileId(null)} 
            />
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPLETED DELEGATIONS — Recruiter reviews freelancer-proposed hires
// ─────────────────────────────────────────────────────────────────────────────

export const CompletedDelegations: React.FC = () => {
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [approving, setApproving] = useState<string | null>(null);
    const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
    const [selectedReportProps, setSelectedReportProps] = useState<any>(null);

    const fetchReviewing = async () => {
        setLoading(true);
        try {
            const data = await apiRequest('/jobs/delegations/reviewing');
            setJobs(data);
        } catch (err) {
            console.error('fetchReviewing error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReviewing(); }, []);

    const handleApprove = async (jobId: string) => {
        if (!confirm('Are you sure you want to approve this hire? The job will be closed and the candidate marked as Hired.')) return;
        setApproving(jobId);
        try {
            await apiRequest(`/jobs/delegations/${jobId}/approve`, 'PUT');
            alert('✅ Hire approved! The job has been closed and the freelancer notified.');
            setJobs(prev => prev.filter(j => j._id !== jobId));
        } catch (err: any) {
            alert(err.message || 'Failed to approve hire');
        } finally {
            setApproving(null);
        }
    };

    return (
        <div className="w-full space-y-6">
            <div>
                <h2 className="text-2xl font-bold">Review Proposed Hires</h2>
                <p className="text-neutral-400 text-sm mt-1">
                    Your delegated freelancers have proposed final candidates. Review their handoff packages and approve the hire.
                </p>
            </div>

            {loading ? (
                <div className="grid md:grid-cols-2 gap-6">
                    {[1, 2].map(i => (
                        <div key={i} className="h-64 bg-white dark:bg-[#111726] border border-slate-300 dark:border-slate-700 rounded-2xl shadow-sm animate-pulse" />
                    ))}
                </div>
            ) : jobs.length === 0 ? (
                <Card className="text-center py-16">
                    <FileText size={48} className="text-neutral-700 mx-auto mb-4" />
                    <p className="text-neutral-500 text-lg font-medium">No pending reviews</p>
                    <p className="text-neutral-600 text-sm mt-1">
                        When a freelancer proposes a final candidate from their delegated pipeline, it will appear here.
                    </p>
                </Card>
            ) : (
                <div className="grid md:grid-cols-2 gap-6">
                    {jobs.map(job => {
                        const freelancer = job.delegatedFreelancerId || {};
                        const candidate = job.proposedCandidateId || {};
                        const aiData = job.aiEvaluationSummary || {};
                        const isProcessing = approving === job._id;

                        return (
                            <Card key={job._id} className="flex flex-col border-amber-500/40 bg-gradient-to-br from-neutral-900 to-amber-900/5 overflow-hidden">
                                {/* Status Banner */}
                                <div className="px-5 py-2.5 flex items-center justify-between border-b border-amber-500/40 bg-amber-500/5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                                        <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                                            Awaiting Your Approval
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-neutral-500">
                                        {new Date(job.createdAt).toLocaleDateString()}
                                    </span>
                                </div>

                                <div className="p-5 flex-1 space-y-4">
                                    {/* Job Title */}
                                    <div>
                                        <h3 className="font-bold text-white text-lg">{job.title}</h3>
                                        <p className="text-sm text-neutral-400">{job.company} · {job.location}</p>
                                    </div>

                                    {/* Freelancer Info */}
                                    <div className="flex items-center gap-3 p-3 bg-neutral-800/50 rounded-lg border border-slate-300 dark:border-slate-700">
                                        <img
                                            src={freelancer.profilePicture || DEFAULT_AVATAR}
                                            alt={freelancer.name}
                                            className="w-10 h-10 rounded-full object-cover border-2 border-blue-500/30"
                                        />
                                        <div className="min-w-0">
                                            <p className="text-xs text-neutral-500 uppercase tracking-wider">Delegated Freelancer</p>
                                            <p className="text-sm font-semibold text-white truncate">{freelancer.name || 'Unknown'}</p>
                                        </div>
                                    </div>

                                    {/* --- THE FULL DOSSIER --- */}
                                    {/* Proposed Candidate Header */}
                                    <div className="flex items-center gap-4 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/40">
                                        <img
                                            src={candidate.profilePicture || DEFAULT_AVATAR}
                                            alt={candidate.name}
                                            className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500/50"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs text-emerald-500 uppercase tracking-wider font-bold mb-0.5">Proposed Hire</p>
                                            <p className="text-lg font-bold text-white truncate leading-tight">{candidate.name || 'Unknown'}</p>
                                            <p className="text-sm text-neutral-400 truncate">{candidate.email}</p>
                                        </div>
                                        <Button 
                                            variant="outline" 
                                            className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/20 shrink-0"
                                            onClick={() => setSelectedCandidate({
                                                candidate,
                                                job: { title: job.title, _id: job._id },
                                                status: 'Reviewing'
                                            })}
                                        >
                                            <Search size={16} className="mr-2" />
                                            Review Profile
                                        </Button>
                                    </div>

                                    {/* The CV Action */}
                                    {candidate.resumeUrl && (
                                        <a 
                                            href={candidate.resumeUrl} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="flex items-center justify-center gap-2 w-full py-3 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700 rounded-xl transition-all font-semibold"
                                        >
                                            <FileText size={18} />
                                            📄 View Original CV / Resume
                                        </a>
                                    )}

                                    {/* Profile Data: Experience */}
                                    {candidate.profile?.experience?.length > 0 && (
                                        <div className="p-4 bg-neutral-900/80 rounded-xl border border-slate-300 dark:border-slate-700">
                                            <h4 className="text-sm font-bold text-neutral-300 flex items-center gap-2 mb-3">
                                                <Briefcase size={16} className="text-blue-400" /> Work Experience
                                            </h4>
                                            <div className="space-y-4">
                                                {candidate.profile.experience.map((exp: any, i: number) => (
                                                    <div key={i} className="pl-4 border-l-2 border-slate-400 dark:border-slate-600">
                                                        <p className="font-semibold text-white text-sm">{exp.designation}</p>
                                                        <p className="text-xs text-blue-400">{exp.company}</p>
                                                        <p className="text-[10px] text-neutral-500 mt-0.5">{exp.from} - {exp.to || 'Present'}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Profile Data: Education */}
                                    {candidate.profile?.education?.length > 0 && (
                                        <div className="p-4 bg-neutral-900/80 rounded-xl border border-slate-300 dark:border-slate-700">
                                            <h4 className="text-sm font-bold text-neutral-300 flex items-center gap-2 mb-3">
                                                <GraduationCap size={16} className="text-blue-400" /> Education
                                            </h4>
                                            <div className="space-y-4">
                                                {candidate.profile.education.map((edu: any, i: number) => (
                                                    <div key={i} className="pl-4 border-l-2 border-slate-400 dark:border-slate-600">
                                                        <p className="font-semibold text-white text-sm">{edu.degree} in {edu.fieldOfStudy}</p>
                                                        <p className="text-xs text-blue-400">{edu.institution}</p>
                                                        <p className="text-[10px] text-neutral-500 mt-0.5">{edu.from} - {edu.to || 'Present'}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* The AI Report & Freelancer Notes via AIReportCard */}
                                    {(() => {
                                        const rawEval = aiData.aiEvaluation || aiData || {};
                                        
                                        // Safety payload for AIReportCard
                                        const evaluationProp = {
                                            suitabilityScore: rawEval.suitabilityScore || 0,
                                            strengths: Array.isArray(rawEval.strengths) ? rawEval.strengths : [],
                                            weaknesses: Array.isArray(rawEval.weaknesses) ? rawEval.weaknesses : [],
                                            redFlags: Array.isArray(rawEval.redFlags) ? rawEval.redFlags : [],
                                            codingScore: rawEval.codingScore || 0,
                                            evaluatedAt: rawEval.evaluatedAt || new Date().toISOString()
                                        };

                                        // Only render if we have some data
                                        const hasData = evaluationProp.suitabilityScore > 0 || evaluationProp.strengths.length > 0;

                                        return (
                                            <div className="mt-6 mb-2 space-y-4">
                                                <button
                                                    onClick={() => setSelectedReportProps({
                                                        evaluation: evaluationProp,
                                                        candidateName: candidate.name,
                                                        jobTitle: job.title,
                                                        interviewerRemarks: job.freelancerFinalReport,
                                                        codingTestConducted: !!aiData.codingTestResults,
                                                        fullAnalysis: aiData.fullAnalysis
                                                    })}
                                                    className="flex items-center justify-center gap-2 w-full py-3 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700 rounded-xl transition-all font-semibold"
                                                >
                                                    <Award size={18} />
                                                    View Detailed AI Evaluation
                                                </button>
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Actions */}
                                <div className="px-5 pb-5 flex gap-3">
                                    <Button
                                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5"
                                        onClick={() => handleApprove(job._id)}
                                        disabled={isProcessing}
                                    >
                                        {isProcessing ? 'Approving...' : (
                                            <>
                                                <Star size={15} />
                                                Approve & Hire
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="border-slate-300 dark:border-slate-700 text-neutral-300 hover:text-white"
                                        onClick={() => window.location.href = `#/recruiter/ranked/${job._id}`}
                                    >
                                        View Pipeline
                                    </Button>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
            
            <ApplicantReviewModal 
                isOpen={!!selectedCandidate} 
                onClose={() => setSelectedCandidate(null)} 
                application={selectedCandidate}
                onStatusUpdate={() => {}}
                onSchedule={() => {}}
                onMessage={() => {
                    const candidateId = selectedCandidate?.candidate?._id;
                    if (candidateId) window.location.href = `#/recruiter/messages?userId=${candidateId}`;
                }}
            />

            {/* ── AI Report UI Modal ─────────────────── */}
            {selectedReportProps && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-0"
                    style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
                    onClick={(e) => { if (e.target === e.currentTarget) setSelectedReportProps(null); }}
                >
                    <div className="bg-neutral-900 border border-slate-300 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="flex-shrink-0 bg-neutral-900/95 backdrop-blur-md px-6 py-4 border-b border-slate-300 dark:border-slate-700 flex items-center justify-between z-20">
                            <div>
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Award className="text-blue-600 dark:text-blue-400" />
                                    Detailed AI Report
                                </h2>
                                <p className="text-xs text-neutral-400 mt-1">
                                    {selectedReportProps.candidateName} • {selectedReportProps.jobTitle}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedReportProps(null)}
                                className="w-8 h-8 rounded-lg bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        
                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto px-6 py-5">
                            <AIReportCard 
                                evaluation={selectedReportProps.evaluation}
                                candidateName={selectedReportProps.candidateName}
                                jobTitle={selectedReportProps.jobTitle}
                                interviewerRemarks={selectedReportProps.interviewerRemarks}
                                codingTestConducted={selectedReportProps.codingTestConducted}
                            />
                            
                            {selectedReportProps.fullAnalysis && (
                                <div className="mt-4 p-4 bg-neutral-900/50 rounded-xl border border-slate-300 dark:border-slate-700">
                                    <h4 className="text-sm font-semibold text-neutral-400 mb-2">Original Technical Evaluation</h4>
                                    <div className="text-sm text-neutral-300 whitespace-pre-wrap font-mono text-[11px] bg-black/40 p-3 rounded overflow-auto max-h-48">
                                        {typeof selectedReportProps.fullAnalysis === 'string' 
                                            ? selectedReportProps.fullAnalysis 
                                            : JSON.stringify(selectedReportProps.fullAnalysis, null, 2)}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// NEW HIRINGS — Hired employee cards with freelancer recommendation + report
// ─────────────────────────────────────────────────────────────────────────────
export const NewHirings: React.FC = () => {
    const [hirings, setHirings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [selectedReportProps, setSelectedReportProps] = useState<any>(null);

    useEffect(() => {
        apiRequest('/jobs/hirings/new')
            .then(setHirings)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const getScoreColor = (score: number) => {
        if (score >= 75) return 'text-emerald-400';
        if (score >= 50) return 'text-amber-400';
        return 'text-red-400';
    };

    const getScoreBg = (score: number) => {
        if (score >= 75) return 'bg-emerald-500/10 border-emerald-500/40';
        if (score >= 50) return 'bg-amber-500/10 border-amber-500/40';
        return 'bg-red-500/10 border-red-500/40';
    };

    return (
        <div className="w-full space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                        <Award size={20} className="text-white" />
                    </div>
                    New Hirings
                </h2>
                <p className="text-neutral-400 text-sm mt-1 ml-[52px]">
                    Candidates successfully hired through your delegated freelancer pipeline.
                </p>
            </div>

            {loading ? (
                <div className="grid md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-64 bg-white dark:bg-[#111726] border border-slate-300 dark:border-slate-700 rounded-2xl shadow-sm animate-pulse" />
                    ))}
                </div>
            ) : hirings.length === 0 ? (
                <Card className="text-center py-20">
                    <Award size={52} className="text-neutral-700 mx-auto mb-4" />
                    <p className="text-neutral-400 text-lg font-semibold">No hired candidates yet</p>
                    <p className="text-neutral-600 text-sm mt-2 max-w-sm mx-auto">
                        Once you approve a freelancer's proposed candidate, they will appear here as a permanent record.
                    </p>
                </Card>
            ) : (
                <div className="grid md:grid-cols-2 gap-6">
                    {hirings.map(hiring => {
                        const candidate = hiring.candidate || {};
                        const freelancer = hiring.recommendedBy || {};
                        const aiScore = hiring.aiSummary?.aiScore ?? hiring.aiSummary?.cvScore;
                        const isOpen = expanded === hiring.jobId;

                        return (
                            <div
                                key={hiring.jobId}
                                className="group flex flex-col bg-neutral-900 border border-slate-300 dark:border-slate-700 rounded-2xl overflow-hidden hover:border-emerald-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10"
                            >
                                {/* Hired Banner */}
                                <div className="px-5 py-2.5 flex items-center justify-between border-b border-emerald-500/40" style={{ background: 'rgba(16,185,129,0.05)' }}>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-400" />
                                        <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">Hired</span>
                                    </div>
                                    <span className="text-[10px] text-neutral-500">
                                        {new Date(hiring.closedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </span>
                                </div>

                                <div className="p-5 flex-1 space-y-4">
                                    {/* Job Info */}
                                    <div>
                                        <h3 className="font-bold text-white text-lg leading-snug">{hiring.jobTitle}</h3>
                                        <p className="text-sm text-neutral-400 mt-0.5">{hiring.company}</p>
                                    </div>

                                    {/* Candidate Card */}
                                    <div className="flex items-center gap-3 p-3.5 rounded-xl border border-emerald-500/40" style={{ background: 'linear-gradient(to right, rgba(16,185,129,0.05), transparent)' }}>
                                        <div className="relative flex-shrink-0">
                                            <img
                                                src={candidate.profilePicture || DEFAULT_AVATAR}
                                                alt={candidate.name}
                                                className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500/40"
                                            />
                                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-neutral-900">
                                                <CheckCircle size={11} className="text-white" />
                                            </div>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-semibold text-white text-sm">{candidate.name || 'Unknown Candidate'}</p>
                                            <p className="text-xs text-neutral-400 truncate">{candidate.email}</p>
                                            <p className="text-xs text-emerald-400 mt-0.5">{candidate.headline || 'Hired Employee'}</p>
                                        </div>
                                        {aiScore !== undefined && aiScore !== null && (
                                            <div className={`flex-shrink-0 px-3 py-2 rounded-xl border text-center ${getScoreBg(aiScore)}`}>
                                                <p className={`text-xl font-black ${getScoreColor(aiScore)}`}>{aiScore}%</p>
                                                <p className="text-[9px] text-neutral-500 uppercase tracking-wide">AI Score</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Recommendation Block */}
                                    {freelancer?.name && (
                                        <div className="flex items-center gap-3 p-3 rounded-xl border border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/20">
                                            <img
                                                src={freelancer.profilePicture || DEFAULT_AVATAR}
                                                alt={freelancer.name}
                                                className="w-8 h-8 rounded-full object-cover border-2 border-blue-500/30 flex-shrink-0"
                                            />
                                            <div className="min-w-0">
                                                <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Recommended by</p>
                                                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 truncate">{freelancer.name}</p>
                                            </div>
                                            <Sparkles size={14} className="text-blue-600 dark:text-blue-400 flex-shrink-0 ml-auto" />
                                        </div>
                                    )}

                                    {/* Final Report Block */}
                                    <div className="pt-2">
                                        <button
                                            onClick={() => setExpanded(isOpen ? null : hiring.jobId)}
                                            className="flex items-center gap-2 text-xs font-semibold text-neutral-400 hover:text-white transition-colors w-full mb-2"
                                        >
                                            <ClipboardList size={13} />
                                            Final Report
                                            <ChevronRight size={13} className={`ml-auto transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
                                        </button>
                                        {isOpen && (
                                            <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300 space-y-4">
                                                {(() => {
                                                    const aiData = hiring.aiSummary || {};
                                                    const rawEval = aiData.aiEvaluation || aiData || {};

                                                    // Safety payload for AIReportCard
                                                    const evaluationProp = {
                                                        suitabilityScore: rawEval.suitabilityScore || 0,
                                                        strengths: Array.isArray(rawEval.strengths) ? rawEval.strengths : [],
                                                        weaknesses: Array.isArray(rawEval.weaknesses) ? rawEval.weaknesses : [],
                                                        redFlags: Array.isArray(rawEval.redFlags) ? rawEval.redFlags : [],
                                                        codingScore: rawEval.codingScore || 0,
                                                        evaluatedAt: rawEval.evaluatedAt || new Date().toISOString()
                                                    };

                                                    return (
                                                        <button
                                                            onClick={() => setSelectedReportProps({
                                                                evaluation: evaluationProp,
                                                                candidateName: candidate.name,
                                                                jobTitle: hiring.jobTitle,
                                                                interviewerRemarks: hiring.freelancerReport,
                                                                codingTestConducted: !!aiData.codingTestResults,
                                                                fullAnalysis: aiData.fullAnalysis
                                                            })}
                                                            className="flex items-center justify-center gap-2 w-full py-3 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700 rounded-xl transition-all font-semibold"
                                                        >
                                                            <Award size={18} />
                                                            View Detailed AI Evaluation
                                                        </button>
                                                    );
                                                })()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── AI Report UI Modal ─────────────────── */}
            {selectedReportProps && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-0"
                    style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
                    onClick={(e) => { if (e.target === e.currentTarget) setSelectedReportProps(null); }}
                >
                    <div className="bg-neutral-900 border border-slate-300 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="flex-shrink-0 bg-neutral-900/95 backdrop-blur-md px-6 py-4 border-b border-slate-300 dark:border-slate-700 flex items-center justify-between z-20">
                            <div>
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Award className="text-blue-600 dark:text-blue-400" />
                                    Detailed AI Report
                                </h2>
                                <p className="text-xs text-neutral-400 mt-1">
                                    {selectedReportProps.candidateName} • {selectedReportProps.jobTitle}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedReportProps(null)}
                                className="w-8 h-8 rounded-lg bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        
                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto px-6 py-5">
                            <AIReportCard 
                                evaluation={selectedReportProps.evaluation}
                                candidateName={selectedReportProps.candidateName}
                                jobTitle={selectedReportProps.jobTitle}
                                interviewerRemarks={selectedReportProps.interviewerRemarks}
                                codingTestConducted={selectedReportProps.codingTestConducted}
                            />
                            
                            {selectedReportProps.fullAnalysis && (
                                <div className="mt-4 p-4 bg-neutral-900/50 rounded-xl border border-slate-300 dark:border-slate-700">
                                    <h4 className="text-sm font-semibold text-neutral-400 mb-2">Original Technical Evaluation</h4>
                                    <div className="text-sm text-neutral-300 whitespace-pre-wrap font-mono text-[11px] bg-black/40 p-3 rounded overflow-auto max-h-48">
                                        {typeof selectedReportProps.fullAnalysis === 'string' 
                                            ? selectedReportProps.fullAnalysis 
                                            : JSON.stringify(selectedReportProps.fullAnalysis, null, 2)}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// PAST JOBS — Read-only archive of all closed job postings
// ─────────────────────────────────────────────────────────────────────────────
export const PastJobs: React.FC = () => {
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiRequest('/jobs/past-jobs')
            .then(setJobs)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="w-full space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neutral-700 to-neutral-600 flex items-center justify-center shadow-lg">
                        <Archive size={20} className="text-neutral-300" />
                    </div>
                    Past Jobs
                </h2>
                <p className="text-neutral-400 text-sm mt-1 ml-[52px]">
                    A read-only archive of all closed job postings.
                </p>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-20 bg-white dark:bg-[#111726] border border-slate-300 dark:border-slate-700 rounded-2xl shadow-sm animate-pulse" />
                    ))}
                </div>
            ) : jobs.length === 0 ? (
                <Card className="text-center py-20">
                    <Archive size={52} className="text-neutral-700 mx-auto mb-4" />
                    <p className="text-neutral-400 text-lg font-semibold">No closed jobs yet</p>
                    <p className="text-neutral-600 text-sm mt-2 max-w-sm mx-auto">
                        Jobs will appear here once they have been closed after a successful hire.
                    </p>
                </Card>
            ) : (
                <div className="space-y-4">
                    {/* Stats Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                        <Card className="p-4 bg-gradient-to-br from-neutral-900 to-neutral-800/50">
                            <h4 className="text-2xl font-black text-white">{jobs.length}</h4>
                            <p className="text-xs text-neutral-500 mt-1 uppercase tracking-wider">Total Closed Jobs</p>
                        </Card>
                        <Card className="p-4 bg-gradient-to-br from-neutral-900 to-emerald-900/10">
                            <h4 className="text-2xl font-black text-emerald-400">{jobs.filter((j: any) => j.proposedCandidateId).length}</h4>
                            <p className="text-xs text-neutral-500 mt-1 uppercase tracking-wider">With Hired Candidate</p>
                        </Card>
                        <Card className="p-4 bg-gradient-to-br from-neutral-900 to-purple-900/10 col-span-2 md:col-span-1">
                            <h4 className="text-2xl font-black text-blue-600 dark:text-blue-400">
                                {jobs.length > 0 ? new Date(jobs[jobs.length - 1].createdAt).getFullYear() : '—'}
                            </h4>
                            <p className="text-xs text-neutral-500 mt-1 uppercase tracking-wider">Oldest Posting Year</p>
                        </Card>
                    </div>

                    {/* Jobs List */}
                    {jobs.map((job: any, idx: number) => (
                        <div
                            key={job._id}
                            className="flex items-center gap-4 p-4 bg-white dark:bg-[#111726] border border-slate-300 dark:border-slate-700 rounded-2xl shadow-sm hover:border-slate-400 dark:hover:border-slate-600 transition-all duration-200 group"
                        >
                            {/* Index */}
                            <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-500 flex-shrink-0">
                                {idx + 1}
                            </div>

                            {/* Job Info */}
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-white text-sm group-hover:text-blue-600 dark:text-blue-400 transition-colors truncate">{job.title}</h3>
                                <div className="flex items-center gap-3 mt-1 flex-wrap">
                                    <span className="text-xs text-neutral-400 flex items-center gap-1">
                                        <Building2 size={11} />{job.company}
                                    </span>
                                    <span className="text-xs text-neutral-500 flex items-center gap-1">
                                        <MapPin size={11} />{job.location}
                                    </span>
                                    <span className="text-xs text-neutral-500">{job.type}</span>
                                </div>
                            </div>

                            {/* Hired Candidate */}
                            {job.proposedCandidateId && (
                                <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                                    <img
                                        src={job.proposedCandidateId.profilePicture || DEFAULT_AVATAR}
                                        alt={job.proposedCandidateId.name}
                                        className="w-7 h-7 rounded-full object-cover border border-emerald-500/40"
                                    />
                                    <div>
                                        <p className="text-[10px] text-neutral-500">Hired</p>
                                        <p className="text-xs font-medium text-emerald-400 truncate max-w-[100px]">{job.proposedCandidateId.name}</p>
                                    </div>
                                </div>
                            )}

                            {/* Date & Status */}
                            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                                <Badge variant="outline" className="text-[10px] bg-neutral-800/50 text-neutral-500 border-slate-700 py-0.5">
                                    <Archive size={9} className="mr-1" />Closed
                                </Badge>
                                <span className="text-[10px] text-neutral-600">
                                    {new Date(job.updatedAt || job.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

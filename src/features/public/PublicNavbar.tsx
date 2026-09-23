import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useTheme } from '@/core/ThemeContext';
import { ThemeToggle } from '@/core/Layouts';

export const PublicNavbar: React.FC = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  return (
    <nav className="flex items-center justify-between px-6 sm:px-10 pt-6 sm:pt-8 pb-4">
      {/* Brand Logo Badge */}
      <div
        className={`${
          isDark ? 'bg-slate-800 border border-slate-700' : 'bg-[#111111]'
        } text-white px-4 py-1.5 rounded-xl shadow-xs text-center cursor-pointer transition-colors`}
        onClick={() => navigate('/')}
      >
        <span className="text-sm font-black tracking-tight block leading-none">PROCRUIT</span>
        <span className="text-[7px] font-black tracking-[0.2em] uppercase text-lime-300 block">INTELLIGENCE</span>
      </div>

      {/* Navigation Links */}
      <div className={`hidden md:flex items-center space-x-8 text-xs font-black ${
        isDark ? 'text-slate-300' : 'text-[#111111]'
      }`}>
        <a href="#features" className="hover:opacity-75 transition-opacity">ATS Engine</a>
        <a href="#proctoring" className="hover:opacity-75 transition-opacity">AI Proctoring</a>
        <a href="#assessments" className="hover:opacity-75 transition-opacity">Coding Sandbox</a>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        <ThemeToggle />
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
    </nav>
  );
};

export default PublicNavbar;

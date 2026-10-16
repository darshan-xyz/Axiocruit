import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useTheme } from '@/core/ThemeContext';

export const PublicFooterCTA: React.FC = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  return (
    <section id="pricing" className={`py-16 px-4 ${
      isDark ? 'bg-[#111726] border-slate-700 text-white' : 'bg-[#D4F882] border-[#111111]/20 text-[#111111]'
    } border-t text-center transition-colors duration-200 scroll-mt-20`}>
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
            } font-extrabold px-8 py-3.5 rounded-full transition-all text-sm sm:text-base flex items-center gap-2 cursor-pointer`}
          >
            Get Started Free <ArrowUpRight size={18} />
          </button>
          <button
            onClick={() => navigate('/login')}
            className={`${
              isDark ? 'bg-slate-800 text-white border-slate-700 hover:bg-slate-700' : 'bg-white text-[#111111] border-[#111111]/20 hover:bg-neutral-100'
            } font-extrabold px-8 py-3.5 rounded-full shadow-sm transition-all text-sm sm:text-base border cursor-pointer`}
          >
            Sign In Instead
          </button>
        </div>
      </div>
    </section>
  );
};

export default PublicFooterCTA;

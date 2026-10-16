import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  Menu, X, Briefcase, User, LayoutDashboard, Settings,
  Users, Calendar, FileText, LogOut, MessageSquare, Video,
  Sun, Moon, ChevronRight, Bell, Star, Award, Archive, Search,
  Sparkles, CheckCircle2, ArrowUpRight
} from 'lucide-react';
import { Button } from '@ui';
import { useTheme } from './ThemeContext';
import { normalizeRole, getRoleHome } from '@/types';

// Reusable Logo Component (Cobalt Minimalist Engine)
export const BrandLogo: React.FC<{ className?: string }> = ({ className = "w-8 h-8 text-sm" }) => (
  <div className={`${className} rounded-xl bg-blue-600 flex items-center justify-center text-white font-black tracking-tighter shadow-sm shadow-blue-500/30 select-none`}>
    A
  </div>
);

// Theme Toggle Button
export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
        isDark ? 'bg-slate-800 border border-slate-700' : 'bg-slate-200 border border-slate-300'
      } ${className}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full flex items-center justify-center transition-transform duration-200 shadow-sm ${
        isDark ? 'translate-x-5 bg-blue-600 text-white' : 'translate-x-0 bg-white text-slate-700'
      }`}>
        {isDark
          ? <Moon className="w-3 h-3" />
          : <Sun className="w-3 h-3" />
        }
      </span>
    </button>
  );
};

// --- Public Layout (Navbar + Footer) ---
export const PublicLayout: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const location = useLocation();
  const isHomePage = location.pathname === '/' || location.pathname === '';
  const [isScrolled, setIsScrolled] = useState(false);

  const handleScrollTo = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (!isHomePage) {
      navigate('/');
      setTimeout(() => {
        const el = document.getElementById(id);
        el?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(id);
      el?.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={`min-h-[100dvh] flex flex-col ${isHomePage ? (isDark ? 'bg-[#0A0E1A] text-slate-100' : 'bg-[#D4F882] text-[#111111]') : (isDark ? 'bg-[#0A0E1A] text-slate-100' : 'bg-[#F8F9FC] text-slate-900')}`}>
      {/* Floating Island Navbar */}
      <header className={`sticky top-0 z-40 w-full px-4 sm:px-6 lg:px-8 pt-3 pb-2 transition-colors duration-200 ${
        isHomePage ? (isDark ? 'bg-[#0A0E1A]' : 'bg-[#D4F882]') : (isDark ? 'bg-slate-900' : 'bg-white')
      } ${isHomePage && isScrolled ? (isDark ? 'bg-[#0A0E1A]/90 backdrop-blur-md border-b border-slate-800' : 'bg-[#D4F882]/90 backdrop-blur-md border-b border-[#111111]/10') : ''}`}>
        <nav className={`max-w-6xl mx-auto rounded-full px-5 py-2.5 flex items-center justify-between border transition-all shadow-sm ${
          isDark
            ? (isHomePage && !isScrolled
                ? 'bg-[#111726]/90 border-slate-700 backdrop-blur-xl'
                : 'bg-[#111726]/85 border-slate-700 backdrop-blur-xl')
            : 'bg-[#0A0A0A]/95 border-neutral-700 backdrop-blur-xl shadow-xl'
        }`}>
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
            <BrandLogo className="w-8 h-8 text-sm" />
            <span className="font-extrabold text-lg tracking-tight text-white">AXIOCRUIT</span>
          </div>

          <div className="hidden md:flex items-center space-x-7">
            {['Platform', 'AI Proctoring', 'ATS Engine', 'Pricing'].map(item => {
              const id = item.toLowerCase().replace(/ /g, '-');
              return (
                <a
                  key={item}
                  href={`#${id}`}
                  onClick={(e) => handleScrollTo(e, id)}
                  className="text-xs font-semibold text-neutral-300 hover:text-white dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
                >
                  {item}
                </a>
              );
            })}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <Button
              variant={isDark ? 'ghost' : 'outline'}
              size="sm"
              className={!isDark ? 'text-white border-neutral-700 hover:bg-neutral-800 hover:text-white' : ''}
              onClick={() => navigate('/login')}
            >
              Sign In
            </Button>
            <Button variant="primary" size="sm" arrow onClick={() => navigate('/signup')}>
              Get Started
            </Button>
          </div>

          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1.5 rounded-lg text-neutral-300 hover:text-white dark:text-slate-300"
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>

        {/* Mobile Dropdown */}
        {isMenuOpen && (
          <div className={`md:hidden mt-2 max-w-6xl mx-auto rounded-3xl p-4 border shadow-xl ${
            isDark ? 'bg-[#111726] border-slate-700' : 'bg-[#0A0A0A] border-neutral-700 text-white'
          }`}>
            <div className="flex flex-col space-y-3">
              {['Platform', 'AI Proctoring', 'ATS Engine', 'Pricing'].map(item => {
                const id = item.toLowerCase().replace(/ /g, '-');
                return (
                  <a
                    key={item}
                    href={`#${id}`}
                    onClick={(e) => handleScrollTo(e, id)}
                    className="px-3 py-2 text-sm font-medium text-neutral-300 hover:text-white dark:text-slate-300 rounded-xl hover:bg-neutral-800/80 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    {item}
                  </a>
                );
              })}
              <div className="pt-3 border-t border-neutral-700 dark:border-slate-700 flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className={!isDark ? 'text-white border-neutral-700 hover:bg-neutral-800 hover:text-white' : ''}
                  onClick={() => { setIsMenuOpen(false); navigate('/login'); }}
                >
                  Sign In
                </Button>
                <Button variant="primary" size="sm" arrow onClick={() => { setIsMenuOpen(false); navigate('/signup'); }}>
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Enterprise Footer */}
      <footer className={`border-t py-12 ${isDark ? 'border-slate-700 bg-[#0A0E1A]' : 'border-neutral-800 bg-[#050505] text-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <BrandLogo className="w-7 h-7 text-xs" />
              <span className="text-base font-bold text-white tracking-tight">AXIOCRUIT</span>
            </div>
            <p className="text-xs leading-relaxed text-neutral-400 dark:text-slate-400">
              Enterprise hiring and AI proctoring platform delivering calibrated talent matching, verified integrity, and automated assessment scoring.
            </p>
          </div>
          {[
            { title: 'Platform', links: ['Candidates', 'Recruiters', 'Freelance Interviewers', 'Coding Assessments'] },
            { title: 'Technology', links: ['Semantic ATS Matching', 'MediaPipe Proctoring', 'SentenceTransformers', 'WebSockets Signaling'] },
            { title: 'Company', links: ['Documentation', 'Support & Inquiries', 'Privacy Policy', 'Terms of Service'] },
          ].map(section => (
            <div key={section.title}>
              <h4 className="font-bold text-xs uppercase tracking-wider text-white mb-3">
                {section.title}
              </h4>
              <ul className="space-y-2 text-xs text-neutral-400 dark:text-slate-400">
                {section.links.map(link => (
                  <li key={link}>
                    <a href="#" className="hover:text-blue-400 dark:hover:text-white transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 pt-6 border-t border-neutral-700 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-neutral-400 dark:text-slate-400">
          <span>(c) 2026 AXIOCRUIT Platform. Enterprise Recruitment System. All rights reserved.</span>
          <span className="flex items-center gap-1.5 font-medium text-neutral-400 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> All microservices operational
          </span>
        </div>
      </footer>
    </div>
  );
};

// --- Dashboard Layout ---
interface SidebarItem {
  name: string;
  path: string;
  icon: any;
  count?: number;
}

interface DashboardLayoutProps {
  role: string;
  children?: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ role }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { isDark } = useTheme();

  // Verify Role Logic
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;
  const userRole = normalizeRole(user?.role);
  const targetRole = normalizeRole(role);

  React.useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (userRole !== targetRole) {
      navigate(getRoleHome(userRole));
    }
  }, [userRole, targetRole, user, navigate]);

  if (!user || userRole !== targetRole) return null;

  const adminLinks: SidebarItem[] = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Manage Users', path: '/admin/users', icon: Users },
    { name: 'Jobs', path: '/admin/jobs', icon: Briefcase },
    { name: 'Approvals', path: '/admin/approvals', icon: Award },
  ];

  const recruiterLinks: SidebarItem[] = [
    { name: 'Dashboard', path: '/recruiter', icon: LayoutDashboard },
    { name: 'Jobs', path: '/recruiter/jobs', icon: Briefcase },
    { name: 'Applicants', path: '/recruiter/applicants', icon: Users },
    { name: 'Service Marketplace', path: '/recruiter/hire-interviewer', icon: Video },
    { name: 'Review Hires', path: '/recruiter/review-hires', icon: Star },
    { name: 'New Hirings', path: '/recruiter/new-hirings', icon: Award },
    { name: 'Past Jobs', path: '/recruiter/past-jobs', icon: Archive },
    { name: 'Schedule', path: '/recruiter/schedule', icon: Calendar },
    { name: 'Messages', path: '/recruiter/messages', icon: MessageSquare },
    { name: 'Profile', path: '/recruiter/profile', icon: User },
  ];

  const candidateLinks: SidebarItem[] = [
    { name: 'Dashboard', path: '/candidate', icon: LayoutDashboard },
    { name: 'Browse Jobs', path: '/candidate/jobs', icon: Briefcase },
    { name: 'My Applications', path: '/candidate/applications', icon: FileText },
    { name: 'Interviews', path: '/candidate/interviews', icon: Video },
    { name: 'Messages', path: '/candidate/messages', icon: MessageSquare },
    { name: 'My Profile', path: '/candidate/profile', icon: User },
  ];

  const interviewerLinks: SidebarItem[] = [
    { name: 'Dashboard', path: '/interviewer', icon: LayoutDashboard },
    { name: 'Gig Board', path: '/interviewer/gigs', icon: Briefcase },
    { name: 'Candidate Pipeline', path: '/interviewer/pipeline', icon: Users },
    { name: 'My Services', path: '/interviewer/services', icon: Video },
    { name: 'Delegated Projects', path: '/interviewer/projects', icon: Archive },
    { name: 'My Schedule', path: '/interviewer/schedule', icon: Calendar },
    { name: 'Requests', path: '/interviewer/requests', icon: MessageSquare },
    { name: 'Messages', path: '/interviewer/messages', icon: Bell },
    { name: 'My Profile', path: '/interviewer/profile', icon: User },
  ];

  const orgAdminLinks: SidebarItem[] = [
    { name: 'Dashboard', path: '/organization/dashboard', icon: LayoutDashboard },
    { name: 'Company Jobs', path: '/organization/jobs', icon: Briefcase },
    { name: 'Team', path: '/organization/team', icon: Users },
    { name: 'Settings', path: '/organization/settings', icon: Settings },
  ];

  let links = candidateLinks;
  if (targetRole === 'ADMIN') links = adminLinks;
  else if (targetRole === 'ORGANIZATION') links = orgAdminLinks;
  else if (targetRole === 'RECRUITER') links = recruiterLinks;
  else if (targetRole === 'INTERVIEWER') links = interviewerLinks;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    navigate('/login');
  };

  const currentLink = links.find(l => location.pathname === l.path || (location.pathname.startsWith(l.path) && l.path !== `/${targetRole.toLowerCase()}`));
  const pageTitle = currentLink?.name || 'Dashboard';
  const roleLabel = targetRole === 'ORGANIZATION' ? 'Org Admin' : targetRole.charAt(0) + targetRole.slice(1).toLowerCase();
  const userInitial = (user?.name || user?.email || 'U').charAt(0).toUpperCase();

  // Key navigation pills for top bar
  const recruiterTopPills = [
    { name: 'Home', path: '/recruiter' },
    { name: 'Candidates', path: '/recruiter/applicants' },
    { name: 'Jobs', path: '/recruiter/jobs' },
    { name: 'Schedule', path: '/recruiter/schedule' },
    { name: 'Marketplace', path: '/recruiter/hire-interviewer' },
  ];

  const candidateTopPills = [
    { name: 'Home', path: '/candidate' },
    { name: 'Jobs', path: '/candidate/jobs' },
    { name: 'Applications', path: '/candidate/applications' },
    { name: 'Interviews', path: '/candidate/interviews' },
    { name: 'Profile', path: '/candidate/profile' },
  ];

  const interviewerTopPills = [
    { name: 'Home', path: '/interviewer' },
    { name: 'Gig Board', path: '/interviewer/gigs' },
    { name: 'Pipeline', path: '/interviewer/pipeline' },
    { name: 'Services', path: '/interviewer/services' },
    { name: 'Schedule', path: '/interviewer/schedule' },
  ];

  const orgTopPills = [
    { name: 'Dashboard', path: '/organization/dashboard' },
    { name: 'Team', path: '/organization/team' },
    { name: 'Jobs', path: '/organization/jobs' },
  ];

  const topPills = targetRole === 'RECRUITER' ? recruiterTopPills
    : targetRole === 'INTERVIEWER' ? interviewerTopPills
    : targetRole === 'ORGANIZATION' ? orgTopPills
    : candidateTopPills;

  return (
    <div className={`min-h-[100dvh] w-full ${isDark ? 'bg-[#0A0E1A] text-slate-100' : 'bg-[#EBF1F6] text-slate-900'} p-0 transition-colors duration-200 flex flex-col justify-start`}>
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Enterprise Full-Screen Application Container */}
      <div className="w-full flex-1 flex flex-col min-h-screen bg-white dark:bg-[#111726] border-0 rounded-none shadow-none overflow-hidden /* full-screen edge-to-edge layout: w-full max-w-[1540px] mx-auto rounded-[28px] rounded-[36px] shadow-2xl */">
        
        {/* macOS Window Top Chrome & Pill Navigation Bar */}
        <header className="h-16 flex items-center justify-between px-5 md:px-7 border-b border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/60 backdrop-blur-md flex-shrink-0 z-20">
          <div className="flex items-center gap-4">
            {/* Full-screen navigation header */}

            {/* Mobile Sidebar Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-1.5 rounded-lg text-slate-600 hover:text-blue-600 dark:text-slate-400"
            >
              <Menu size={20} />
            </button>

            {/* Platform Logo */}
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate(`/${role.toLowerCase().replace('_', '-')}`)}>
              <BrandLogo className="w-7 h-7 text-xs" />
              <span className="font-black text-sm tracking-tight text-slate-900 dark:text-white">AXIOCRUIT</span>
            </div>

            {/* Top Navigation Pills */}
            <div className="hidden lg:flex items-center gap-1 ml-4 pl-4 border-l border-slate-300 dark:border-slate-700">
              {topPills.map(pill => {
                const isPillActive = location.pathname === pill.path ||
                  (pill.path !== `/${role.toLowerCase().replace('_', '-')}` && location.pathname.startsWith(pill.path));
                return (
                  <button
                    key={pill.path}
                    onClick={() => navigate(pill.path)}
                    className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all ${
                      isPillActive
                        ? 'border border-blue-600 text-blue-600 bg-blue-50/60 dark:bg-blue-950/40 dark:text-blue-400 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800'
                    }`}
                  >
                    {pill.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            {/* Quick Search with shortcut */}
            <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-800 text-slate-400 border border-slate-300 dark:border-slate-600 text-xs shadow-2xs">
              <Search size={14} className="text-slate-400" />
              <input
                type="text"
                placeholder="Search requisitions, candidates..."
                className="bg-transparent border-none outline-none text-xs text-slate-800 dark:text-slate-200 w-44 placeholder:text-slate-400"
              />
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500">
                ⌘K
              </span>
            </div>

            {/* Notification Bell */}
            <button className="relative p-2 rounded-full text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-300 dark:hover:border-slate-700 transition-all">
              <Bell size={17} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white dark:ring-slate-900" />
            </button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Avatar */}
            <div
              onClick={() => navigate(`/${role.toLowerCase().replace('_', '-')}/profile`)}
              className="flex items-center gap-2 pl-1 cursor-pointer group"
              title="View Profile"
            >
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-sm group-hover:ring-2 group-hover:ring-blue-500/30 transition-all">
                {userInitial}
              </div>
            </div>
          </div>
        </header>

        {/* Main Body: Left Sidebar + Content Area */}
        <div className="flex-1 flex min-w-0 overflow-hidden">
          {/* Left Navigation Sidebar */}
          <aside className={`
            fixed inset-y-0 left-0 z-40 w-64 flex flex-col transform transition-transform duration-300 ease-in-out
            ${isDark ? 'bg-[#111726] border-r border-slate-700' : 'bg-white border-r border-slate-300'}
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static
          `}>
            {/* Sidebar Navigation Items */}
            <nav className="flex-1 p-3.5 space-y-1 overflow-y-auto">
              {links.map((link, idx) => {
                const rolePath = `/${role.toLowerCase().replace('_', '-')}`;
                const isActive = location.pathname === link.path ||
                  (link.path !== rolePath && location.pathname.startsWith(link.path));
                
                const badgeCount = link.count !== undefined && link.count !== null ? String(link.count) : null;

                return (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    end={link.path === rolePath}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition-all duration-150 text-xs font-bold
                      ${isActive
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60'}
                    `}
                  >
                    <link.icon size={17} className="flex-shrink-0" />
                    <span>{link.name}</span>
                    {badgeCount && (
                      <span className={`ml-auto text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-white/25 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}>
                        {badgeCount}
                      </span>
                    )}
                    {!badgeCount && isActive && <ChevronRight size={14} className="ml-auto opacity-70" />}
                  </NavLink>
                );
              })}
            </nav>

            {/* Iridescent AI Assistant Card */}
            <div className="p-3.5">
              <div className="rounded-3xl p-4 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white shadow-md relative overflow-hidden group border border-blue-400/30 dark:border-indigo-400/30">
                <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/10 rounded-full blur-xl pointer-events-none" />
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span className="text-xs font-black tracking-tight">AI Assistant Pro</span>
                  </div>
                  <span className="text-[10px] font-extrabold bg-white/20 px-2 py-0.5 rounded-full">Active</span>
                </div>
                <p className="text-[11px] text-blue-100/90 leading-tight mb-3">
                  Autonomous CV parsing, facial proctoring & rubric scoring enabled.
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-white/15 text-[10px] font-bold text-white/90">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" /> Enterprise v3
                  </span>
                  <span className="hover:underline cursor-pointer flex items-center gap-0.5">
                    Explore ↗
                  </span>
                </div>
              </div>
            </div>

            {/* User Profile & Sign Out Footer */}
            <div className="p-3.5 border-t border-slate-300 dark:border-slate-700">
              <div className="flex items-center justify-between px-2 py-1.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {userInitial}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate text-slate-900 dark:text-white">{user?.name || 'User'}</p>
                    <p className="text-[10px] truncate text-slate-500 dark:text-slate-400">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-slate-50/40 dark:bg-slate-900/30 w-full">
            <div className="w-full">
              <Outlet />
            </div>
          </main>
        </div>

      </div>
    </div>
  );
};

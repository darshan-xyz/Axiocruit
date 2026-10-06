import React from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Briefcase, CheckCircle, LogOut, Sun, Moon, ChevronRight, Shield } from 'lucide-react';
import { useTheme } from './ThemeContext';
import { normalizeRole, getRoleHome } from '@/types';

// ThemeToggle (pill style)
const ThemeToggle: React.FC = () => {
    const { isDark, toggleTheme } = useTheme();
    return (
        <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className={`relative w-11 h-6 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cobalt-500/20 ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-slate-200 border border-slate-300'}`}
        >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm ${isDark ? 'translate-x-5 bg-cobalt-600 text-white' : 'translate-x-0 bg-white text-slate-700'}`}>
                {isDark ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
            </span>
        </button>
    );
};

export const AdminLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isDark } = useTheme();

    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : null;
    const userRole = normalizeRole(user?.role);

    React.useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (userRole !== 'ADMIN') {
            navigate(getRoleHome(userRole));
        }
    }, [user, userRole, navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        navigate('/login');
    };

    if (!user || userRole !== 'ADMIN') return null;

    const navItems = [
        { icon: LayoutDashboard, label: 'Overview', path: '/admin/dashboard' },
        { icon: Users, label: 'User Management', path: '/admin/users' },
        { icon: Briefcase, label: 'Jobs', path: '/admin/jobs' },
        { icon: CheckCircle, label: 'Approvals', path: '/admin/approvals' },
    ];

    const sidebarBg = isDark
        ? 'bg-slate-900/90 border-r border-slate-800/80 backdrop-blur-xl'
        : 'bg-white/95 border-r border-slate-200/80 backdrop-blur-xl';
    const mainBg = isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900';
    const textPrimary = isDark ? 'text-slate-100' : 'text-slate-900';
    const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';
    const headerBg = isDark
        ? 'border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl'
        : 'border-b border-slate-200/80 bg-white/80 backdrop-blur-xl';

    const currentItem = navItems.find(i => location.pathname === i.path || (location.pathname.startsWith(i.path) && i.path !== '/admin/dashboard'));
    const pageTitle = currentItem?.label || 'Admin Panel';

    const adminRole = localStorage.getItem('role') || 'Admin';
    const userInitial = (user?.name || user?.email || 'A').charAt(0).toUpperCase();

    return (
        <div className={`flex min-h-[100dvh] ${mainBg} ${textPrimary} font-sans selection:bg-cobalt-500 selection:text-white`}>
            {/* Sidebar */}
            <aside className={`w-64 fixed h-full flex flex-col z-20 ${sidebarBg}`}>
                {/* Brand Area */}
                <div className={`h-16 flex items-center px-5 gap-3 border-b ${isDark ? 'border-slate-800/80' : 'border-slate-200/80'}`}>
                    <div className="w-8 h-8 rounded-xl bg-cobalt-600 flex items-center justify-center text-white font-bold shadow-md shadow-cobalt-500/20">
                        <Shield size={16} />
                    </div>
                    <div>
                        <h1 className="font-extrabold text-sm tracking-tight bg-gradient-to-r from-cobalt-600 to-indigo-600 bg-clip-text text-transparent dark:from-cobalt-400 dark:to-indigo-300">
                            AXIOCRUIT
                        </h1>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 uppercase tracking-wider mt-0.5">
                            Platform Admin
                        </span>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 p-3 space-y-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/admin/dashboard'}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 group text-sm font-medium ${isActive
                                    ? 'bg-cobalt-50 text-cobalt-700 dark:bg-cobalt-950/60 dark:text-cobalt-300 shadow-sm ring-1 ring-cobalt-500/20 font-semibold'
                                    : `${textMuted} hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60`}`
                            }
                        >
                            <item.icon size={17} className="flex-shrink-0 group-hover:scale-105 transition-transform" />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Sidebar Footer */}
                <div className={`p-3 border-t space-y-2 ${isDark ? 'border-slate-800/80' : 'border-slate-200/80'}`}>
                    {/* User info */}
                    <div className={`flex items-center gap-3 px-3 py-2 rounded-xl ${isDark ? 'bg-slate-800/60 border border-slate-700/50' : 'bg-slate-100/80 border border-slate-200/60'}`}>
                        <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm ring-1 ring-slate-300 dark:ring-slate-700">
                            {userInitial}
                        </div>
                        <div className="min-w-0">
                            <p className={`text-xs font-semibold truncate ${textPrimary}`}>{user?.name || 'Admin'}</p>
                            <p className={`text-[10px] truncate ${textMuted}`}>{adminRole}</p>
                        </div>
                    </div>

                    {/* Theme toggle */}
                    <div className={`flex items-center justify-between px-3 py-2 rounded-xl ${isDark ? 'bg-slate-800/60 border border-slate-700/50' : 'bg-slate-100/80 border border-slate-200/60'}`}>
                        <span className={`text-xs font-medium ${textMuted}`}>{isDark ? 'Dark Mode' : 'Light Mode'}</span>
                        <ThemeToggle />
                    </div>

                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all group text-sm font-medium"
                    >
                        <LogOut size={16} className="group-hover:translate-x-0.5 transition-transform" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 ml-64 flex flex-col min-w-0">
                {/* Top Header */}
                <header className={`h-16 flex items-center justify-between px-8 sticky top-0 z-10 ${headerBg}`}>
                    <div className="flex items-center gap-2">
                        <span className={`text-xs ${textMuted}`}>Platform</span>
                        <ChevronRight size={12} className={textMuted} />
                        <span className={`text-sm font-semibold ${textPrimary}`}>{pageTitle}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                        <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center text-xs font-bold shadow-sm ring-1 ring-slate-300 dark:ring-slate-700">
                            {userInitial}
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-8">
                    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

import React from 'react';
import { LucideIcon, X, Sparkles, ArrowUpRight, Check, Calendar, Clock, Video } from 'lucide-react';
import { useTheme } from './ThemeContext';

// --- Button ---
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'pill' | 'dark' | 'sage';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  arrow?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  icon: Icon,
  arrow = false,
  ...props
}) => {
  const baseStyle = "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none select-none";

  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-500/20 rounded-full font-semibold",
    secondary: "bg-white text-slate-800 border border-slate-200/80 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-750 shadow-sm rounded-full",
    outline: "border border-slate-300/80 text-slate-700 hover:bg-slate-100/60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 rounded-full",
    ghost: "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-white rounded-full",
    pill: "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 rounded-full font-semibold shadow-sm",
    dark: "bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full font-semibold",
    sage: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-500/20 rounded-full font-semibold",
  };

  const sizes = {
    sm: "px-3.5 py-1.5 text-xs gap-1.5",
    md: "px-5 py-2.5 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2.5",
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
      <span>{children}</span>
      {arrow && <ArrowUpRight className="w-4 h-4 flex-shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />}
    </button>
  );
};

// --- Card ---
export interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  action?: React.ReactNode;
  onClick?: () => void;
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  action,
  onClick,
  hoverEffect = false
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-[#111726] border border-slate-200/70 dark:border-slate-800/80 rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-sm transition-all duration-200 text-slate-900 dark:text-slate-100 ${
        onClick || hoverEffect ? 'cursor-pointer hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700' : ''
      } ${className}`}
    >
      {(title || action) && (
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100 dark:border-slate-800/80">
          {title && (typeof title === 'string' ? <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{title}</h3> : title)}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

// --- Input ---
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
  endIcon?: LucideIcon;
  onEndIconClick?: () => void;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className = '',
  icon: Icon,
  endIcon: EndIcon,
  onEndIconClick,
  ...props
}) => {
  return (
    <div className="w-full">
      {label && <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider text-slate-600 dark:text-slate-300">{label}</label>}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500">
            <Icon size={17} />
          </div>
        )}
        <input
          className={`w-full rounded-xl py-2.5 text-sm transition-all outline-none border
            bg-white text-slate-900 border-slate-200/90 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 
            dark:bg-slate-900/90 dark:text-white dark:border-slate-700 dark:focus:ring-blue-500/30 dark:focus:border-blue-500 dark:placeholder-slate-500
            ${error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500 dark:border-red-500' : ''}
            ${Icon ? 'pl-10' : 'px-4'} ${EndIcon ? 'pr-10' : 'px-4'}
            ${className}`}
          {...props}
        />
        {EndIcon && (
          <button
            type="button"
            onClick={onEndIconClick}
            className={`absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors ${onEndIconClick ? 'cursor-pointer' : 'pointer-events-none'} text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300`}
          >
            <EndIcon size={17} />
          </button>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs font-medium text-red-500">{error}</p>}
    </div>
  );
};

// --- Badge ---
export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple' | 'outline' | 'error'
    | 'interview' | 'screening' | 'assessment' | 'new' | 'completed' | 'remote' | 'hybrid';
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', className = '', dot = false }) => {
  const styles: Record<string, string> = {
    // Standard Statuses
    success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-800/50',
    warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200/70 dark:border-amber-800/50',
    danger: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200/70 dark:border-rose-800/50',
    error: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200/70 dark:border-rose-800/50',
    info: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200/70 dark:border-blue-800/50',
    neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    purple: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200/70 dark:border-purple-800/50',
    outline: 'bg-transparent text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700',
    
    // Enterprise Pipeline Badges
    interview: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200/60 dark:border-blue-800/40',
    screening: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/40',
    assessment: 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200/60 dark:border-purple-800/40',
    new: 'bg-slate-100 text-slate-600 dark:bg-slate-800/80 dark:text-slate-300 border-slate-200 dark:border-slate-700/80',
    completed: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/40',
    remote: 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400',
    hybrid: 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400',
  };

  const dotColors: Record<string, string> = {
    interview: 'bg-blue-500',
    screening: 'bg-amber-500',
    assessment: 'bg-purple-500',
    new: 'bg-slate-400',
    success: 'bg-emerald-500',
    danger: 'bg-rose-500',
    warning: 'bg-amber-500',
    info: 'bg-blue-500',
    purple: 'bg-purple-500',
    neutral: 'bg-slate-400',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${styles[variant] || styles.neutral} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant] || 'bg-slate-400'}`} />}
      {children}
    </span>
  );
};

// --- Modal ---
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
  size?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, maxWidth, size }) => {
  if (!isOpen) return null;

  const widthClass = maxWidth ? maxWidth : (size === 'lg' ? 'max-w-4xl' : size === 'xl' ? 'max-w-6xl' : 'max-w-2xl');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={onClose} />
      <div className={`relative rounded-3xl w-full ${widthClass} shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh] bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 overflow-hidden`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 rounded-t-3xl flex-shrink-0">
          <div className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            {title}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full transition-colors text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Scrollable body */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// ENTERPRISE DASHBOARD PRIMITIVES
// =========================================================================

// --- 1. MetricStatCard ---
export interface MetricStatCardProps {
  label: string;
  value: string | number;
  trend?: string;
  positive?: boolean;
  colorVariant?: 'pink' | 'emerald' | 'blue' | 'coral' | 'dark' | 'white';
  icon?: LucideIcon;
  subtext?: string;
  className?: string;
  onClick?: () => void;
}

export const MetricStatCard: React.FC<MetricStatCardProps> = ({
  label,
  value,
  trend,
  positive = true,
  colorVariant = 'white',
  icon: Icon,
  subtext,
  className = '',
  onClick
}) => {
  const colorMap = {
    pink: "bg-[#FF5D8F] text-white",
    emerald: "bg-[#10B981] text-white",
    blue: "bg-[#2563EB] text-white",
    coral: "bg-[#FF6B6B] text-white",
    dark: "bg-slate-900 text-white dark:bg-slate-850 border border-slate-800",
    white: "bg-white text-slate-900 dark:bg-[#111726] dark:text-white border border-slate-200/70 dark:border-slate-800/80 shadow-sm",
  };

  const isSolid = colorVariant !== 'white';

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl md:rounded-3xl p-5 md:p-6 transition-all duration-200 relative overflow-hidden ${
        colorMap[colorVariant]
      } ${onClick ? 'cursor-pointer hover:scale-[1.01] hover:shadow-md' : ''} ${className}`}
    >
      <div className="flex justify-between items-start mb-3">
        <span className={`text-xs font-bold uppercase tracking-wider ${isSolid ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`}>
          {label}
        </span>
        {Icon && <Icon className={`w-5 h-5 ${isSolid ? 'text-white/70' : 'text-slate-400 dark:text-slate-500'}`} />}
      </div>
      <div className="flex items-baseline gap-3">
        <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight">{value}</h3>
        {trend && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            isSolid ? 'bg-white/20 text-white' : positive ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400' : 'bg-rose-50 text-rose-600'
          }`}>
            {trend}
          </span>
        )}
      </div>
      {subtext && (
        <p className={`mt-2 text-xs font-medium ${isSolid ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`}>
          {subtext}
        </p>
      )}
    </div>
  );
};

// --- 2. DualToneProgressBar ---
export interface DualToneProgressBarProps {
  score: number;
  label?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const DualToneProgressBar: React.FC<DualToneProgressBarProps> = ({
  score,
  label,
  className = '',
  size = 'md'
}) => {
  const heightClass = size === 'sm' ? 'h-1.5' : 'h-2';
  const barColor = score >= 80 ? 'bg-blue-600 dark:bg-blue-500' : score >= 50 ? 'bg-amber-500' : 'bg-slate-400';

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="flex justify-between items-center text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
          <span>{label}</span>
          <span>{score}%</span>
        </div>
      )}
      <div className={`w-full bg-slate-100 dark:bg-slate-800 rounded-full ${heightClass} overflow-hidden`}>
        <div
          className={`${heightClass} rounded-full transition-all duration-700 ease-out ${barColor}`}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
    </div>
  );
};

// --- 3. CircularProgressGauge (Images 3 & 5: Match Score & Activity) ---
export interface CircularProgressGaugeProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  subtitle?: string;
  color?: string;
  className?: string;
}

export const CircularProgressGauge: React.FC<CircularProgressGaugeProps> = ({
  percentage,
  size = 110,
  strokeWidth = 9,
  label = 'Match Score',
  subtitle,
  color = '#2563EB',
  className = ''
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-100 dark:text-slate-800"
            fill="none"
          />
          {/* Foreground progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="none"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {percentage}%
          </span>
        </div>
      </div>
      {label && (
        <span className="mt-2 text-xs font-bold text-slate-800 dark:text-slate-200">
          {label}
        </span>
      )}
      {subtitle && (
        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
          {subtitle}
        </span>
      )}
    </div>
  );
};

// --- 4. AISummaryCard ---
export interface AISummaryCardProps {
  title?: string;
  summary: string;
  highlights?: string[];
  className?: string;
}

export const AISummaryCard: React.FC<AISummaryCardProps> = ({
  title = "AI Summary",
  summary,
  highlights = [],
  className = ''
}) => {
  return (
    <div className={`rounded-2xl p-4.5 bg-blue-50/70 border border-blue-200/60 dark:bg-blue-950/25 dark:border-blue-800/40 text-slate-900 dark:text-slate-100 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-5 h-5 rounded-md bg-blue-600 flex items-center justify-center text-white">
          <Sparkles className="w-3 h-3" />
        </div>
        <span className="text-xs font-bold text-blue-700 dark:text-blue-300 tracking-wide uppercase">
          {title}
        </span>
      </div>
      <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 mb-3">
        {summary}
      </p>
      {highlights.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-blue-200/40 dark:border-blue-800/30">
          {highlights.map((h, i) => (
            <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/80 dark:bg-slate-900/60 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-700/50">
              {h}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// --- 5. InspectionDrawer / SlideOver Panel ---
export interface InspectionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export const InspectionDrawer: React.FC<InspectionDrawerProps> = ({
  isOpen,
  onClose,
  children,
  className = ''
}) => {
  if (!isOpen) return null;

  return (
    <div className={`rounded-2xl md:rounded-3xl bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 shadow-xl p-6 transition-all duration-300 flex flex-col ${className}`}>
      <div className="flex justify-end mb-2">
        <button
          onClick={onClose}
          className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="overflow-y-auto flex-1">
        {children}
      </div>
    </div>
  );
};

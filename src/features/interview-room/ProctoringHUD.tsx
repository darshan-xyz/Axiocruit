import React, { useState, useRef, useEffect } from 'react';
import { ShieldAlert, Eye, AlertTriangle, Users, Smartphone } from 'lucide-react';

export interface ProctorAlertItem {
    type: string;
    detail: string;
    timestamp: string;
    candidateName?: string;
}

export interface ProctoringHUDProps {
    isRecruiter?: boolean;
    proctorWsConnected?: boolean;
    proctorAlerts?: ProctorAlertItem[];
    alerts?: string[];
    faceDetected?: boolean;
    multipleFaces?: boolean;
    lookingAway?: boolean;
    phoneDetected?: boolean;
    isDark?: boolean;
}

export const ProctoringHUD: React.FC<ProctoringHUDProps> = ({
    isRecruiter = false,
    proctorWsConnected = true,
    proctorAlerts = [],
    alerts = [],
    faceDetected = true,
    multipleFaces = false,
    lookingAway = false,
    phoneDetected = false,
    isDark = true,
}) => {
    const [isAlertDropdownOpen, setIsAlertDropdownOpen] = useState(false);
    const alertDropdownRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (alertDropdownRef.current && !alertDropdownRef.current.contains(e.target as Node)) {
                setIsAlertDropdownOpen(false);
            }
        };
        if (isAlertDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isAlertDropdownOpen]);

    // Candidate view: status badge
    if (!isRecruiter) {
        return (
            <div
                className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                    proctorWsConnected
                        ? 'bg-emerald-500/10 border border-emerald-500/20'
                        : 'bg-amber-500/10 border border-amber-500/20'
                }`}
                title={proctorWsConnected ? 'AI proctoring is active — gaze, tab-switch, and copy/paste are being monitored' : 'AI proctoring is connecting...'}
            >
                <Eye size={13} className={proctorWsConnected ? 'text-emerald-400' : 'text-amber-400'} />
                <span className={`text-xs font-medium ${proctorWsConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
                    AI Monitor {proctorWsConnected ? 'Active' : 'Connecting…'}
                </span>
                <div className={`w-1.5 h-1.5 rounded-full ${proctorWsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            </div>
        );
    }

    // Recruiter view: alert dropdown
    if (proctorAlerts.length === 0) {
        return (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <ShieldAlert size={13} className="text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-400">Proctoring Secure</span>
            </div>
        );
    }

    return (
        <div className="relative" ref={alertDropdownRef}>
            <button
                onClick={() => setIsAlertDropdownOpen((prev) => !prev)}
                className={`flex items-center gap-2 px-3 py-1 rounded-full cursor-pointer transition-all duration-200 ${
                    isAlertDropdownOpen
                        ? 'bg-amber-500/20 border border-amber-500/50 ring-1 ring-amber-500/30'
                        : 'bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/15'
                }`}
                title={`${proctorAlerts.length} proctoring alert(s) — click to ${isAlertDropdownOpen ? 'close' : 'view'}`}
            >
                <ShieldAlert size={13} className="text-amber-400" />
                <span className="text-xs font-semibold text-amber-400">
                    {proctorAlerts.length} Alert{proctorAlerts.length !== 1 ? 's' : ''}
                </span>
            </button>

            {/* Dropdown panel */}
            {isAlertDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-96 max-h-80 overflow-y-auto bg-neutral-900/95 border border-neutral-700 rounded-xl shadow-2xl backdrop-blur-md z-[10000]">
                    {/* Header */}
                    <div className="sticky top-0 bg-neutral-900/95 backdrop-blur-md px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <ShieldAlert size={14} className="text-amber-400" />
                            <span className="text-sm font-semibold text-white">Proctoring Alerts</span>
                        </div>
                        <span className="text-[11px] text-neutral-500">{proctorAlerts.length} total</span>
                    </div>

                    {/* Alert list */}
                    <div className="px-2 py-2 flex flex-col gap-1.5">
                        {[...proctorAlerts].reverse().map((alert, i) => {
                            const icon =
                                alert.type === 'tab_switch'
                                    ? '🔀'
                                    : alert.type === 'copy'
                                    ? '📋'
                                    : alert.type === 'paste'
                                    ? '📌'
                                    : alert.type === 'face_lost'
                                    ? '👤'
                                    : alert.type === 'gaze'
                                    ? '👁️'
                                    : '⚠️';
                            return (
                                <div
                                    key={i}
                                    className="flex items-start gap-2.5 px-3 py-2 rounded-lg hover:bg-neutral-800/60 transition-colors"
                                >
                                    <span className="text-sm mt-0.5 flex-shrink-0">{icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs font-semibold text-amber-300">
                                                {alert.candidateName || 'Candidate'}
                                            </p>
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 font-medium">
                                                {alert.type.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-neutral-300 mt-0.5">{alert.detail}</p>
                                        <p className="text-[10px] text-neutral-500 mt-0.5">
                                            {new Date(alert.timestamp).toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProctoringHUD;

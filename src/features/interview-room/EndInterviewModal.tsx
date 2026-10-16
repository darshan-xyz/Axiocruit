import React from 'react';
import { ClipboardCheck, X, CheckCircle, PhoneOff } from 'lucide-react';

export interface EndInterviewModalProps {
    isOpen: boolean;
    remarks: string;
    completing: boolean;
    onRemarksChange: (val: string) => void;
    onComplete: () => void;
    onJustLeave: () => void;
    onClose: () => void;
}

export const EndInterviewModal: React.FC<EndInterviewModalProps> = ({
    isOpen,
    remarks,
    completing,
    onRemarksChange,
    onComplete,
    onJustLeave,
    onClose,
}) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
        >
            <div
                className="bg-neutral-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in zoom-in-95"
                style={{ animationDuration: '0.2s' }}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <ClipboardCheck size={20} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">End Interview Session</h2>
                            <p className="text-xs text-neutral-500">Choose how to exit this interview</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-5 space-y-5">
                    {/* Final Remarks */}
                    <div>
                        <label className="block text-sm font-semibold text-neutral-300 mb-2">
                            Final Remarks / Candidate Evaluation
                        </label>
                        <p className="text-xs text-neutral-500 mb-2">
                            Your qualitative feedback will be included in the AI-powered interview report.
                        </p>
                        <textarea
                            value={remarks}
                            onChange={(e) => onRemarksChange(e.target.value)}
                            rows={4}
                            placeholder="e.g. Candidate showed strong analytical skills but struggled with system design concepts. Communication was clear and professional..."
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm placeholder-neutral-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none resize-none leading-relaxed"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3">
                        {/* Complete Interview */}
                        <button
                            onClick={onComplete}
                            disabled={completing}
                            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl font-semibold text-sm hover:from-blue-500 hover:to-blue-700 transition-all duration-200 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {completing ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Completing & Generating AI Report...
                                </>
                            ) : (
                                <>
                                    <CheckCircle size={18} />
                                    Complete Interview & Generate AI Report
                                </>
                            )}
                        </button>

                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-px bg-neutral-800" />
                            <span className="text-[10px] text-neutral-600 uppercase tracking-widest font-semibold">
                                or
                            </span>
                            <div className="flex-1 h-px bg-neutral-800" />
                        </div>

                        {/* Just Leave */}
                        <button
                            onClick={onJustLeave}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-slate-700 bg-neutral-800/50 text-neutral-300 rounded-xl font-medium text-sm hover:bg-neutral-800 hover:text-white transition-all duration-200"
                        >
                            <PhoneOff size={16} />
                            Just Leave (Don't Complete)
                        </button>
                    </div>

                    <p className="text-[10px] text-neutral-600 text-center">
                        "Complete Interview" will end the session for all participants, finalize any active coding test,
                        and trigger the AI evaluation report.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default EndInterviewModal;

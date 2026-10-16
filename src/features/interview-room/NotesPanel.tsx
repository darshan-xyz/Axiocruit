import React from 'react';
import { FileText } from 'lucide-react';

export interface NotesPanelProps {
    remarks: string;
    onRemarksChange: (val: string) => void;
    isHost: boolean;
    isDark?: boolean;
}

export const NotesPanel: React.FC<NotesPanelProps> = ({
    remarks,
    onRemarksChange,
    isHost,
    isDark = true,
}) => {
    return (
        <div className={`flex flex-col h-full p-4 ${isDark ? 'bg-neutral-900 text-white' : 'bg-white text-slate-900'}`}>
            <div className="flex items-center gap-2 mb-3">
                <FileText size={16} className="text-blue-500" />
                <h3 className="text-sm font-bold">Interviewer Remarks & Private Scratchpad</h3>
            </div>
            <p className={`text-xs mb-3 ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                {isHost 
                    ? 'Notes entered here will be synced into the final AI candidate evaluation dossier.'
                    : 'Private scratchpad for your interview thoughts. Invisible to the interviewer.'}
            </p>
            <textarea
                value={remarks}
                onChange={(e) => onRemarksChange(e.target.value)}
                placeholder="Type technical observations, behavioral impressions, or quick notes..."
                className={`flex-1 w-full p-3 text-sm rounded-xl border outline-none resize-none transition leading-relaxed ${
                    isDark
                        ? 'bg-neutral-950 border-neutral-700 text-white placeholder-neutral-600 focus:border-blue-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500'
                }`}
            />
        </div>
    );
};

export default NotesPanel;

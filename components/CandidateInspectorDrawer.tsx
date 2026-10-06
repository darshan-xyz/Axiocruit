import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Calendar,
  Briefcase,
  MapPin,
  Clock,
  Mail,
  Phone,
  FileText,
  ExternalLink,
  ChevronRight,
  Send,
  Plus,
  CheckCircle2,
  AlertCircle,
  Video,
  Award,
  Layers
} from 'lucide-react';
import {
  normalizeToSakromeCandidate,
  getDepartmentMeta,
  getStageMeta,
  SakromeCandidate,
  SakromeNote
} from '../utils/sakromeCandidates';
import { DEFAULT_AVATAR } from '../utils/defaultAvatar';

export interface CandidateInspectorDrawerProps {
  candidate: any | null;
  onClose: () => void;
  onSchedule: () => void;
  onSendMessage?: () => void;
  onStatusUpdate?: (id: string, status: string) => void;
  onViewFullProfile?: () => void;
  onRetryAI?: (applicationId: string) => void;
  isRetryingAI?: boolean;
  role?: 'RECRUITER' | 'INTERVIEWER';
  onProposeHire?: (candidate: any) => void;
}

export const CandidateInspectorDrawer: React.FC<CandidateInspectorDrawerProps> = ({
  candidate,
  onClose,
  onSchedule,
  onSendMessage,
  onStatusUpdate,
  onViewFullProfile,
  onRetryAI,
  isRetryingAI = false,
  role = 'RECRUITER',
  onProposeHire
}) => {
  const [activeTab, setActiveTab] = useState<'Overview' | 'Profile' | 'Activity' | 'Notes' | 'Files'>('Overview');
  const [newNoteText, setNewNoteText] = useState('');

  const candidateId = candidate?._id || (candidate as any)?.candidate?._id || (candidate as any)?.candidate || (candidate as any)?.id || '';

  // Dictionary map for notes keyed by candidate ID, persisted in localStorage
  const [notesByCandidate, setNotesByCandidate] = useState<Record<string, SakromeNote[]>>(() => {
    try {
      const saved = localStorage.getItem('candidate_inspector_notes');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const updateCandidateNotes = (candId: string, notes: SakromeNote[]) => {
    if (!candId) return;
    setNotesByCandidate(prev => {
      const next = { ...prev, [candId]: notes };
      try {
        localStorage.setItem('candidate_inspector_notes', JSON.stringify(next));
      } catch (err) {
        console.error('Failed to persist candidate notes:', err);
      }
      return next;
    });
  };

  const [notesList, setNotesList] = useState<SakromeNote[]>([]);

  useEffect(() => {
    setNewNoteText('');
    setNotesList([]);
  }, [candidate?._id, candidate?.candidate?._id]);

  if (!candidate) return null;

  const cand: SakromeCandidate = normalizeToSakromeCandidate(candidate);
  const dept = getDepartmentMeta(cand.candidate?.department || cand.candidate?.headline);
  const DeptIcon = dept.icon;
  const hasScore = cand.aiScore !== null && cand.aiScore !== undefined;
  const score = hasScore ? cand.aiScore : null;
  const matchLabel = cand.matchLabel || (hasScore ? ((score ?? 0) >= 80 ? 'Strong match' : (score ?? 0) >= 60 ? 'Good match' : 'Fair match') : 'Pending AI');

  // SVG Gauge calculations
  const gaugeRadius = 18;
  const gaugeCircumference = 2 * Math.PI * gaugeRadius; // ~113.1
  const gaugeOffset = hasScore
    ? gaugeCircumference - (Math.min(100, Math.max(0, score ?? 0)) / 100) * gaugeCircumference
    : gaugeCircumference;

  const userStr = localStorage.getItem('user');
  const loggedInUser = userStr ? JSON.parse(userStr) : null;
  const currentAuthorName = loggedInUser?.name || (role === 'INTERVIEWER' ? 'Interviewer' : 'Recruiter');

  // Active notes for candidate isolated by candidateId
  const defaultNotes: SakromeNote[] = (cand.candidate?.notes && cand.candidate.notes.length > 0) ? cand.candidate.notes : [];
  const currentNotes = (candidateId && notesByCandidate[candidateId]) ? notesByCandidate[candidateId] : defaultNotes;

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim() || !candidateId) return;
    const newNote: SakromeNote = {
      id: `note-${Date.now()}`,
      author: currentAuthorName,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      content: newNoteText.trim()
    };
    const updated = [newNote, ...currentNotes];
    updateCandidateNotes(candidateId, updated);
    setNewNoteText('');
  };

  const tabs: ('Overview' | 'Profile' | 'Activity' | 'Notes' | 'Files')[] = [
    'Overview',
    'Profile',
    'Activity',
    'Notes',
    'Files'
  ];

  return (
    <div className="bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xl relative sticky top-20 flex flex-col max-h-[calc(100vh-6rem)] overflow-y-auto">
      {/* Top Close Button (X) */}
      <button
        onClick={onClose}
        className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors z-10"
        title="Close Inspector Drawer"
        aria-label="Close drawer"
      >
        <X size={16} />
      </button>

      {/* Candidate Profile Header Card */}
      <div className="text-center pt-1 pb-4">
        <div className="relative inline-block mx-auto mb-3">
          <img
            src={cand.candidate?.profilePicture || DEFAULT_AVATAR}
            alt={cand.candidate?.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-slate-100 dark:border-slate-700 shadow-sm"
          />
          <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
        </div>

        <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
          {cand.candidate?.name}
        </h3>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          {cand.candidate?.headline || 'Lead Technical Candidate'}
        </p>

        {/* Subtitle Row: Left Department Icon / Right Circular Match Gauge (Requirement R2 / F12) */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-left">
          {/* Left: Department Badge */}
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${dept.badgeClass}`}>
              <DeptIcon size={16} />
            </div>
            <div>
              <p className="font-bold text-xs text-slate-900 dark:text-white">
                {cand.candidate?.department}
              </p>
              <span className="text-[10px] text-slate-400 font-medium">Department</span>
            </div>
          </div>

          {/* Right: Circular Match Gauge (83% Strong match) */}
          <div className="flex items-center gap-2.5">
            <div className="relative w-11 h-11 flex items-center justify-center flex-shrink-0">
              <svg width={44} height={44} className="transform -rotate-90">
                <circle
                  cx={22}
                  cy={22}
                  r={gaugeRadius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3.5}
                  className="text-slate-100 dark:text-slate-800"
                />
                <circle
                  cx={22}
                  cy={22}
                  r={gaugeRadius}
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth={3.5}
                  strokeDasharray={gaugeCircumference}
                  strokeDashoffset={gaugeOffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <span className="absolute text-[11px] font-black text-slate-900 dark:text-white">
                {hasScore ? `${score}%` : '—'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Match Score</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block leading-tight">
                {matchLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5 Functional Sub-Navigation Tabs (Requirement R2 / F13) */}
      <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-2 mb-4 text-xs font-bold text-slate-400 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-1.5 transition-colors whitespace-nowrap ${
              activeTab === tab
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 font-black'
                : 'hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW (Requirement R2 / F14) */}
      {activeTab === 'Overview' && (
        <div className="space-y-4 text-xs">
          {/* 2-Column Info Grid */}
          <div>
            <h4 className="text-xs font-black text-slate-900 dark:text-white mb-2.5">Candidate Overview</h4>
            <div className="grid grid-cols-2 gap-2.5 text-xs bg-slate-50/50 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
              {/* Left Column */}
              <div className="space-y-2 text-slate-600 dark:text-slate-300 min-w-0">
                <div className="flex items-center gap-2">
                  <Briefcase size={13} className="text-slate-400 flex-shrink-0" />
                  <span className="truncate">{cand.candidate?.yearsOfExperience ? `${cand.candidate.yearsOfExperience} Years experience` : 'Experience verified'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={13} className="text-slate-400 flex-shrink-0" />
                  <span className="truncate">{cand.candidate?.location || 'Remote'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={13} className="text-slate-400 flex-shrink-0" />
                  <span className="truncate">{cand.candidate?.availability || 'Available'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={13} className="text-slate-400 flex-shrink-0" />
                  <span className="truncate" title={cand.candidate?.email}>{cand.candidate?.email || 'No email provided'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={13} className="text-slate-400 flex-shrink-0" />
                  <span className="truncate">{cand.candidate?.phone || 'Not specified'}</span>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-2.5 pl-2 border-l border-slate-200/80 dark:border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Source</span>
                  <span className="font-bold text-slate-900 dark:text-white truncate block">
                    {cand.candidate?.source || 'Direct Application'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Applied</span>
                  <span className="font-bold text-slate-900 dark:text-white truncate block">
                    {cand.appliedDateFormatted || 'Recently'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Salary Expected</span>
                  <span className="font-bold text-slate-900 dark:text-white truncate block">
                    {cand.candidate?.salaryExpected || 'Negotiable'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Skills Cloud: Matched Keywords & Missing Competencies */}
          <div>
            <h4 className="text-xs font-black text-slate-900 dark:text-white mb-2">Skills Cloud</h4>
            <div className="flex flex-wrap gap-1.5">
              {(cand.matchedKeywords || cand.candidate?.skills || []).map((skill: string) => (
                <span
                  key={skill}
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40"
                >
                  {skill}
                </span>
              ))}
              {(cand.missingKeywords || []).map((missing: string) => (
                <span
                  key={missing}
                  className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50 line-through decoration-slate-400"
                  title="Missing requirement"
                >
                  {missing}
                </span>
              ))}
            </div>
          </div>

          {/* ✦ AI Summary Card (Requirement R2 / F14) */}
          <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40">
            <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-black text-xs mb-1.5">
              <Sparkles size={13} />
              <span>✦ AI Summary</span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {cand.aiSummary || 'Applicant profile evaluated against role requirements.'}
            </p>
          </div>

          {/* Next Interview Slot Card */}
          {cand.nextInterviewSlot ? (
            <div className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <Calendar size={15} />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 font-medium block">Next Interview Slot</span>
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {cand.nextInterviewSlot.date} • {cand.nextInterviewSlot.time}
                  </p>
                  <span className="text-[10px] text-slate-500 truncate block">
                    Interviewer: {cand.nextInterviewSlot.interviewer}
                  </span>
                </div>
              </div>
              <a
                href={cand.nextInterviewSlot.roomLink || '#/recruiter/schedule'}
                className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold text-[11px] shadow-2xs hover:bg-blue-700 transition-colors whitespace-nowrap flex-shrink-0"
              >
                Join Room
              </a>
            </div>
          ) : (
            <div className="p-3 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/20 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center flex-shrink-0">
                  <Calendar size={15} />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 font-medium block">Interview Scheduling</span>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400">No active interview session</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onSchedule}
                className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-700 dark:text-slate-300 font-bold text-[11px] transition-colors whitespace-nowrap flex-shrink-0 cursor-pointer"
              >
                Schedule Now
              </button>
            </div>
          )}

          {/* Actions Deck (Requirement R2 / F15) */}
          <div className="pt-2 space-y-2">
            <div className="flex items-center gap-2">
              <button
                onClick={onSchedule}
                className="flex-1 py-2 px-3 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 font-bold text-xs text-slate-800 dark:text-slate-100 flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              >
                <Calendar size={13} className="text-blue-600" />
                <span>Schedule Interview</span>
              </button>

              {onViewFullProfile && (
                <button
                  onClick={onViewFullProfile}
                  className="flex-1 py-2 px-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm shadow-blue-500/25 cursor-pointer"
                >
                  <span>View Full Profile</span>
                  <span>→</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {cand.resumeUrl && cand.resumeUrl !== '#' ? (
                <a
                  href={cand.resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2 px-3 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <FileText size={13} />
                  <span>View Resume</span>
                </a>
              ) : (
                <button
                  disabled
                  className="flex-1 py-2 px-3 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-400 font-bold text-xs flex items-center justify-center gap-1.5 cursor-not-allowed opacity-60"
                >
                  <FileText size={13} />
                  <span>No Resume Attached</span>
                </button>
              )}

              {onSendMessage && (
                <button
                  onClick={onSendMessage}
                  className="px-3 py-2 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 hover:text-blue-600 transition-all cursor-pointer"
                  title="Send message"
                >
                  <Send size={12} />
                  <span>Message</span>
                </button>
              )}

              {role === 'INTERVIEWER' && onProposeHire && (
                <button
                  onClick={() => onProposeHire(cand)}
                  className="flex-1 py-2 px-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm shadow-emerald-500/20 cursor-pointer"
                >
                  <Award size={13} />
                  <span>Propose Final Hire</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROFILE */}
      {activeTab === 'Profile' && (
        <div className="space-y-4 text-xs">
          <div>
            <h4 className="text-xs font-black text-slate-900 dark:text-white mb-1.5">Executive Bio</h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50/50 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
              {cand.candidate?.bio || 'No bio provided.'}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-black text-slate-900 dark:text-white mb-2">Work Experience</h4>
            <div className="space-y-2.5">
              {(cand.candidate?.experience || []).length === 0 ? (
                <p className="text-slate-400 italic py-2">No work experience listed.</p>
              ) : (
                cand.candidate.experience.map((exp, idx) => (
                  <div key={idx} className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/30">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 dark:text-white">{exp.role}</span>
                      <span className="text-[10px] text-slate-400">{exp.period}</span>
                    </div>
                    <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium block mb-1">{exp.company}</span>
                    <p className="text-[11px] text-slate-500 leading-normal">{exp.description}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-black text-slate-900 dark:text-white mb-2">Education</h4>
            <div className="space-y-2">
              {(cand.candidate?.education || []).length === 0 ? (
                <p className="text-slate-400 italic py-2">No education history listed.</p>
              ) : (
                cand.candidate.education.map((edu, idx) => (
                  <div key={idx} className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/30">
                    <p className="font-bold text-slate-900 dark:text-white">{edu.degree}</p>
                    <p className="text-[11px] text-slate-500">{edu.institution} {edu.year ? `• ${edu.year}` : ''}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ACTIVITY */}
      {activeTab === 'Activity' && (
        <div className="space-y-3 text-xs">
          <h4 className="text-xs font-black text-slate-900 dark:text-white mb-2">Lifecycle Milestones</h4>
          <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            <div className="relative">
              <span className="absolute -left-6 top-0.5 w-3 h-3 rounded-full bg-blue-600 ring-4 ring-white dark:ring-slate-900" />
              <p className="font-bold text-slate-900 dark:text-white">Application Received</p>
              <span className="text-[10px] text-slate-400">{cand.appliedDateFormatted || 'Recently'} • Axiocruit Portal</span>
            </div>
            {cand.aiScore !== null && (
              <div className="relative">
                <span className="absolute -left-6 top-0.5 w-3 h-3 rounded-full bg-purple-600 ring-4 ring-white dark:ring-slate-900" />
                <p className="font-bold text-slate-900 dark:text-white">AI ATS Rubric Evaluation</p>
                <span className="text-[10px] text-slate-400">Score: {score}% • {matchLabel}</span>
              </div>
            )}
            <div className="relative">
              <span className="absolute -left-6 top-0.5 w-3 h-3 rounded-full bg-amber-500 ring-4 ring-white dark:ring-slate-900" />
              <p className="font-bold text-slate-900 dark:text-white">Pipeline Stage: {cand.status}</p>
              <span className="text-[10px] text-slate-400">Active evaluation</span>
            </div>
            {cand.nextInterviewSlot && (
              <div className="relative">
                <span className="absolute -left-6 top-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-slate-900" />
                <p className="font-bold text-slate-900 dark:text-white">Interview Scheduled</p>
                <span className="text-[10px] text-slate-400">{cand.nextInterviewSlot.date} with {cand.nextInterviewSlot.interviewer}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: NOTES */}
      {activeTab === 'Notes' && (
        <div className="space-y-4 text-xs">
          <form onSubmit={handleAddNote} className="space-y-2">
            <textarea
              value={newNoteText}
              onChange={e => setNewNoteText(e.target.value)}
              placeholder="Add recruiter observation note..."
              rows={3}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-500 outline-none transition-all resize-none"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              >
                <Plus size={12} />
                <span>Save Note</span>
              </button>
            </div>
          </form>

          <div className="space-y-2.5 pt-2">
            {currentNotes.length === 0 ? (
              <p className="text-slate-400 italic text-center py-4">No notes added yet for this candidate.</p>
            ) : (
              currentNotes.map(note => (
                <div key={note.id} className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900 dark:text-white">{note.author}</span>
                    <span className="text-[10px] text-slate-400">{note.date}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-normal">{note.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 5: FILES */}
      {activeTab === 'Files' && (
        <div className="space-y-3 text-xs">
          <h4 className="text-xs font-black text-slate-900 dark:text-white mb-2">Attached Documents</h4>
          <div className="space-y-2">
            {(cand.candidate?.files || []).filter(f => f.url && f.url !== '#').length === 0 ? (
              <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400">
                <FileText size={24} className="mx-auto mb-1 text-slate-300 dark:text-slate-600" />
                <p>No documents attached for this applicant.</p>
              </div>
            ) : (
              (cand.candidate?.files || []).filter(f => f.url && f.url !== '#').map((file, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center flex-shrink-0">
                      <FileText size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white truncate">{file.name}</p>
                      <span className="text-[10px] text-slate-400">{file.size} • {file.type}</span>
                    </div>
                  </div>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-600 transition-colors flex-shrink-0"
                    title="View / Download"
                  >
                    <ExternalLink size={13} />
                  </a>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};


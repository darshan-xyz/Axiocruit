import React, { useState, useEffect } from 'react';
import { Card, Badge } from '@ui';
import { Award, CheckCircle, Sparkles, ClipboardList, ChevronRight, X, Archive, Building2, MapPin } from 'lucide-react';
import { apiRequest } from '@core/api';
import AIReportCard from '@/components/AIReportCard';
import { DEFAULT_AVATAR } from '@/utils/defaultAvatar';

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
        if (score >= 75) return 'bg-emerald-500/10 border-emerald-500/20';
        if (score >= 50) return 'bg-amber-500/10 border-amber-500/20';
        return 'bg-red-500/10 border-red-500/20';
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
                        <div key={i} className="h-64 bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm animate-pulse" />
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
                                className="group flex flex-col bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden hover:border-emerald-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10"
                            >
                                {/* Hired Banner */}
                                <div className="px-5 py-2.5 flex items-center justify-between border-b border-emerald-500/15" style={{ background: 'rgba(16,185,129,0.05)' }}>
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
                                    <div className="flex items-center gap-3 p-3.5 rounded-xl border border-emerald-500/15" style={{ background: 'linear-gradient(to right, rgba(16,185,129,0.05), transparent)' }}>
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
                                        <div className="flex items-center gap-3 p-3 rounded-xl border border-blue-200/60 dark:border-blue-800/40 bg-blue-50/50 dark:bg-blue-950/20">
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
                                            className="flex items-center gap-2 text-xs font-semibold text-neutral-400 hover:text-white transition-colors w-full mb-2 cursor-pointer"
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
                                                            className="flex items-center justify-center gap-2 w-full py-3 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-xl transition-all font-semibold cursor-pointer"
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
                    <div className="bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="flex-shrink-0 bg-neutral-900/95 backdrop-blur-md px-6 py-4 border-b border-neutral-800 flex items-center justify-between z-20">
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
                                className="w-8 h-8 rounded-lg bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
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
                                <div className="mt-4 p-4 bg-neutral-900/50 rounded-xl border border-neutral-800">
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
                        <div key={i} className="h-20 bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm animate-pulse" />
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
                            className="flex items-center gap-4 p-4 bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm hover:border-neutral-700 transition-all duration-200 group"
                        >
                            {/* Index */}
                            <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-500 flex-shrink-0">
                                {idx + 1}
                            </div>

                            {/* Job Info */}
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-slate-900 dark:text-white text-sm group-hover:text-blue-600 dark:text-blue-400 transition-colors truncate">{job.title}</h3>
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
                                <Badge variant="outline" className="text-[10px] bg-neutral-800/50 text-neutral-500 border-neutral-700 py-0.5">
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

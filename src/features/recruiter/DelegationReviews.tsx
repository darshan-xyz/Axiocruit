import React, { useState, useEffect } from 'react';
import { Card, Button } from '@ui';
import { FileText, Search, Briefcase, GraduationCap, Award, Star, X } from 'lucide-react';
import { apiRequest } from '@core/api';
import { ApplicantReviewModal } from '@/components/ApplicantReviewModal';
import AIReportCard from '@/components/AIReportCard';
import { DEFAULT_AVATAR } from '@/utils/defaultAvatar';

export const CompletedDelegations: React.FC = () => {
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [approving, setApproving] = useState<string | null>(null);
    const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
    const [selectedReportProps, setSelectedReportProps] = useState<any>(null);

    const fetchReviewing = async () => {
        setLoading(true);
        try {
            const data = await apiRequest('/jobs/delegations/reviewing');
            setJobs(data);
        } catch (err) {
            console.error('fetchReviewing error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReviewing(); }, []);

    const handleApprove = async (jobId: string) => {
        if (!confirm('Are you sure you want to approve this hire? The job will be closed and the candidate marked as Hired.')) return;
        setApproving(jobId);
        try {
            await apiRequest(`/jobs/delegations/${jobId}/approve`, 'PUT');
            alert('✅ Hire approved! The job has been closed and the freelancer notified.');
            setJobs(prev => prev.filter(j => j._id !== jobId));
        } catch (err: any) {
            alert(err.message || 'Failed to approve hire');
        } finally {
            setApproving(null);
        }
    };

    const handleRequestRevision = async (job: any) => {
        const notes = prompt("Enter feedback or revision requirements for the interviewer:") || '';
        if (notes === null) return;
        setApproving(job._id);
        try {
            await apiRequest(`/jobs/${job._id}`, 'PUT', { delegationStatus: 'accepted' });
            const freelancerId = job.delegatedFreelancerId?._id || job.delegatedFreelancerId;
            if (freelancerId) {
                const messageText = `Revision requested for "${job.title}": ${notes || 'Please review other candidates or conduct additional assessments.'}`;
                try {
                    await apiRequest('/interviews/message', 'POST', { receiverId: freelancerId, content: messageText });
                } catch (e) {
                    try {
                        await apiRequest('/messages/send', 'POST', { receiverId: freelancerId, content: messageText });
                    } catch (mErr) {
                        console.error('Failed to send revision message', mErr);
                    }
                }
            }
            alert('Revision requested. The pipeline has been returned to the interviewer.');
            setJobs(prev => prev.filter(j => j._id !== job._id));
        } catch (err: any) {
            alert(err.message || 'Failed to request revision');
        } finally {
            setApproving(null);
        }
    };

    return (
        <div className="w-full space-y-6">
            <div>
                <h2 className="text-2xl font-bold">Review Proposed Hires</h2>
                <p className="text-neutral-400 text-sm mt-1">
                    Your delegated freelancers have proposed final candidates. Review their handoff packages and approve the hire.
                </p>
            </div>

            {loading ? (
                <div className="grid md:grid-cols-2 gap-6">
                    {[1, 2].map(i => (
                        <div key={i} className="h-64 bg-white dark:bg-[#111726] border border-slate-300 dark:border-slate-700 rounded-2xl shadow-sm animate-pulse" />
                    ))}
                </div>
            ) : jobs.length === 0 ? (
                <Card className="text-center py-16">
                    <FileText size={48} className="text-neutral-700 mx-auto mb-4" />
                    <p className="text-neutral-500 text-lg font-medium">No pending reviews</p>
                    <p className="text-neutral-600 text-sm mt-1">
                        When a freelancer proposes a final candidate from their delegated pipeline, it will appear here.
                    </p>
                </Card>
            ) : (
                <div className="grid md:grid-cols-2 gap-6">
                    {jobs.map(job => {
                        const freelancer = job.delegatedFreelancerId || {};
                        const candidate = job.proposedCandidateId || {};
                        const aiData = job.aiEvaluationSummary || {};
                        const isProcessing = approving === job._id;

                        return (
                            <Card key={job._id} className="flex flex-col border-amber-500/20 bg-gradient-to-br from-neutral-900 to-amber-900/5 overflow-hidden">
                                {/* Status Banner */}
                                <div className="px-5 py-2.5 flex items-center justify-between border-b border-amber-500/20 bg-amber-500/5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                                        <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                                            Awaiting Your Approval
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-neutral-500">
                                        {new Date(job.createdAt).toLocaleDateString()}
                                    </span>
                                </div>

                                <div className="p-5 flex-1 space-y-4">
                                    {/* Job Title */}
                                    <div>
                                        <h3 className="font-bold text-white text-lg">{job.title}</h3>
                                        <p className="text-sm text-neutral-400">{job.company} · {job.location}</p>
                                    </div>

                                    {/* Freelancer Info */}
                                    <div className="flex items-center gap-3 p-3 bg-neutral-800/50 rounded-lg border border-slate-300 dark:border-neutral-700">
                                        <img
                                            src={freelancer.profilePicture || DEFAULT_AVATAR}
                                            alt={freelancer.name}
                                            className="w-10 h-10 rounded-full object-cover border-2 border-blue-500/30"
                                        />
                                        <div className="min-w-0">
                                            <p className="text-xs text-neutral-500 uppercase tracking-wider">Delegated Freelancer</p>
                                            <p className="text-sm font-semibold text-white truncate">{freelancer.name || 'Unknown'}</p>
                                        </div>
                                    </div>

                                    {/* --- THE FULL DOSSIER --- */}
                                    {/* Proposed Candidate Header */}
                                    <div className="flex items-center gap-4 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                        <img
                                            src={candidate.profilePicture || DEFAULT_AVATAR}
                                            alt={candidate.name}
                                            className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500/50"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs text-emerald-500 uppercase tracking-wider font-bold mb-0.5">Proposed Hire</p>
                                            <p className="text-lg font-bold text-white truncate leading-tight">{candidate.name || 'Unknown'}</p>
                                            <p className="text-sm text-neutral-400 truncate">{candidate.email}</p>
                                        </div>
                                        <Button 
                                            variant="outline" 
                                            className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/20 shrink-0"
                                            onClick={() => setSelectedCandidate({
                                                candidate,
                                                job: { title: job.title, _id: job._id },
                                                status: 'Reviewing'
                                            })}
                                        >
                                            <Search size={16} className="mr-2" />
                                            Review Profile
                                        </Button>
                                    </div>

                                    {/* The CV Action */}
                                    {candidate.resumeUrl && (
                                        <a 
                                            href={candidate.resumeUrl} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="flex items-center justify-center gap-2 w-full py-3 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-xl transition-all font-semibold"
                                        >
                                            <FileText size={18} />
                                            📄 View Original CV / Resume
                                        </a>
                                    )}

                                    {/* Profile Data: Experience */}
                                    {candidate.profile?.experience?.length > 0 && (
                                        <div className="p-4 bg-neutral-900/80 rounded-xl border border-neutral-800">
                                            <h4 className="text-sm font-bold text-neutral-300 flex items-center gap-2 mb-3">
                                                <Briefcase size={16} className="text-blue-400" /> Work Experience
                                            </h4>
                                            <div className="space-y-4">
                                                {candidate.profile.experience.map((exp: any, i: number) => (
                                                    <div key={i} className="pl-4 border-l-2 border-neutral-700">
                                                        <p className="font-semibold text-white text-sm">{exp.designation}</p>
                                                        <p className="text-xs text-blue-400">{exp.company}</p>
                                                        <p className="text-[10px] text-neutral-500 mt-0.5">{exp.from} - {exp.to || 'Present'}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Profile Data: Education */}
                                    {candidate.profile?.education?.length > 0 && (
                                        <div className="p-4 bg-neutral-900/80 rounded-xl border border-neutral-800">
                                            <h4 className="text-sm font-bold text-neutral-300 flex items-center gap-2 mb-3">
                                                <GraduationCap size={16} className="text-blue-400" /> Education
                                            </h4>
                                            <div className="space-y-4">
                                                {candidate.profile.education.map((edu: any, i: number) => (
                                                    <div key={i} className="pl-4 border-l-2 border-neutral-700">
                                                        <p className="font-semibold text-white text-sm">{edu.degree} in {edu.fieldOfStudy}</p>
                                                        <p className="text-xs text-blue-400">{edu.institution}</p>
                                                        <p className="text-[10px] text-neutral-500 mt-0.5">{edu.from} - {edu.to || 'Present'}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* The AI Report & Freelancer Notes via AIReportCard */}
                                    {(() => {
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
                                            <div className="mt-6 mb-2 space-y-4">
                                                <button
                                                    onClick={() => setSelectedReportProps({
                                                        evaluation: evaluationProp,
                                                        candidateName: candidate.name,
                                                        jobTitle: job.title,
                                                        interviewerRemarks: job.freelancerFinalReport,
                                                        codingTestConducted: !!aiData.codingTestResults,
                                                        fullAnalysis: aiData.fullAnalysis
                                                    })}
                                                    className="flex items-center justify-center gap-2 w-full py-3 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-xl transition-all font-semibold cursor-pointer"
                                                >
                                                    <Award size={18} />
                                                    View Detailed AI Evaluation
                                                </button>
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Actions */}
                                <div className="px-5 pb-5 flex flex-wrap gap-3">
                                    <Button
                                        className="flex-1 min-w-[140px] bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5"
                                        onClick={() => handleApprove(job._id)}
                                        disabled={isProcessing}
                                    >
                                        {isProcessing ? 'Approving...' : (
                                            <>
                                                <Star size={15} />
                                                Approve & Hire
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10 font-semibold"
                                        onClick={() => handleRequestRevision(job)}
                                        disabled={isProcessing}
                                    >
                                        Request Revision
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="border-neutral-700 text-neutral-300 hover:text-white"
                                        onClick={() => window.location.href = `#/recruiter/ranked/${job._id}`}
                                    >
                                        View Pipeline
                                    </Button>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
            
            <ApplicantReviewModal 
                isOpen={!!selectedCandidate} 
                onClose={() => setSelectedCandidate(null)} 
                application={selectedCandidate}
                onStatusUpdate={() => {}}
                onSchedule={() => {}}
                onMessage={() => {
                    const candidateId = selectedCandidate?.candidate?._id;
                    if (candidateId) window.location.href = `#/recruiter/messages?userId=${candidateId}`;
                }}
            />

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

export default CompletedDelegations;

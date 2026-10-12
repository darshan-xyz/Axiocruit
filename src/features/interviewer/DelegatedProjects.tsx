import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@ui';
import { Briefcase, Building2, MapPin, DollarSign, User, Search, CheckCircle2, XCircle, Shield, Star } from 'lucide-react';
import { apiRequest } from '@core/api';
import JobReviewModal from '@/components/JobReviewModal';
import { DEFAULT_AVATAR } from '@/utils/defaultAvatar';

export interface DelegatedJob {
    _id: string;
    title: string;
    description: string;
    company: string;
    location: string;
    type: string;
    skills: string[];
    salary?: string;
    delegationStatus: 'pending' | 'accepted' | 'completed' | 'reviewing';
    applicants: string[];
    postedBy: {
        _id: string;
        name: string;
        companyName?: string;
        profilePicture?: string;
        email?: string;
    };
    createdAt: string;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
    pending:   { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/20',   label: 'Pending Approval' },
    accepted:  { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', label: 'Active Project' },
    reviewing: { bg: 'bg-purple-500/10',  text: 'text-purple-400',  border: 'border-purple-500/20',  label: 'Reviewing Proposed Hire' },
    completed: { bg: 'bg-blue-500/10',    text: 'text-blue-400',    border: 'border-blue-500/20',    label: 'Completed' },
};

export const DelegatedProjects: React.FC = () => {
    const [jobs, setJobs] = useState<DelegatedJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [selectedJobToReview, setSelectedJobToReview] = useState<any>(null);

    const fetchDelegations = async () => {
        setLoading(true);
        try {
            const data = await apiRequest('/freelancers/delegations');
            setJobs(data);
        } catch (err) {
            console.error('fetchDelegations error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDelegations(); }, []);

    const handleAccept = async (jobId: string) => {
        setActionLoading(jobId);
        try {
            await apiRequest(`/freelancers/delegations/${jobId}/accept`, 'PUT');
            alert('✅ Delegation accepted! You can now manage this pipeline.');
            fetchDelegations();
        } catch (err: any) {
            alert(err.message || 'Failed to accept delegation');
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (jobId: string) => {
        if (!confirm('Are you sure you want to decline this delegation?')) return;
        setActionLoading(jobId);
        try {
            await apiRequest(`/freelancers/delegations/${jobId}/reject`, 'PUT');
            alert('Delegation declined.');
            fetchDelegations();
        } catch (err: any) {
            alert(err.message || 'Failed to reject delegation');
        } finally {
            setActionLoading(null);
        }
    };

    const pendingCount = jobs.filter(j => j.delegationStatus === 'pending').length;
    const activeCount = jobs.filter(j => j.delegationStatus === 'accepted').length;
    const reviewingCount = jobs.filter(j => j.delegationStatus === 'reviewing').length;
    const completedCount = jobs.filter(j => j.delegationStatus === 'completed').length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold">Delegated Projects</h2>
                <p className="text-neutral-400 text-sm mt-1">
                    Job pipelines assigned to you by recruiters. Accept to start managing the hiring process.
                </p>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl text-center">
                    <p className="text-2xl font-bold text-amber-400">{pendingCount}</p>
                    <p className="text-xs text-neutral-400 mt-1">Pending</p>
                </div>
                <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl text-center">
                    <p className="text-2xl font-bold text-emerald-400">{activeCount}</p>
                    <p className="text-xs text-neutral-400 mt-1">Active</p>
                </div>
                <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl text-center">
                    <p className="text-2xl font-bold text-purple-400">{reviewingCount}</p>
                    <p className="text-xs text-neutral-400 mt-1">Under Review</p>
                </div>
                <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl text-center">
                    <p className="text-2xl font-bold text-blue-400">{completedCount}</p>
                    <p className="text-xs text-neutral-400 mt-1">Completed</p>
                </div>
            </div>

            {/* Job Cards */}
            {loading ? (
                <div className="grid md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-56 bg-neutral-900 border border-neutral-800 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : jobs.length === 0 ? (
                <div className="text-center py-20 border border-neutral-800 rounded-xl">
                    <Briefcase size={48} className="text-neutral-700 mx-auto mb-4" />
                    <p className="text-neutral-500 text-lg font-medium">No delegated projects yet</p>
                    <p className="text-neutral-600 text-sm mt-1">
                        When a recruiter delegates a job pipeline to you, it will appear here.
                    </p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 gap-6">
                    {jobs.map(job => {
                        const style = STATUS_STYLES[job.delegationStatus] || STATUS_STYLES.pending;
                        const isProcessing = actionLoading === job._id;

                        return (
                            <div
                                key={job._id}
                                className={`flex flex-col bg-neutral-900 border rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg ${
                                    job.delegationStatus === 'pending'
                                        ? 'border-amber-500/30 hover:shadow-amber-900/10'
                                        : job.delegationStatus === 'accepted'
                                            ? 'border-emerald-500/20 hover:shadow-emerald-900/10'
                                            : 'border-neutral-800 hover:shadow-purple-900/10'
                                }`}
                            >
                                {/* Status banner */}
                                <div className={`px-5 py-2.5 flex items-center justify-between ${style.bg} border-b ${style.border}`}>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${job.delegationStatus === 'pending' ? 'bg-amber-400 animate-pulse' : job.delegationStatus === 'accepted' ? 'bg-emerald-400' : 'bg-blue-400'}`} />
                                        <span className={`text-xs font-semibold uppercase tracking-wider ${style.text}`}>
                                            {style.label}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-neutral-500">
                                        {new Date(job.createdAt).toLocaleDateString()}
                                    </span>
                                </div>

                                {/* Job Details */}
                                <div className="p-5 flex-1 space-y-3">
                                    <h3 className="font-bold text-white text-lg leading-snug">{job.title}</h3>

                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-400">
                                        <span className="flex items-center gap-1.5">
                                            <Building2 size={13} className="text-neutral-500" />
                                            {job.company}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <MapPin size={13} className="text-neutral-500" />
                                            {job.location}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Briefcase size={13} className="text-neutral-500" />
                                            {job.type}
                                        </span>
                                    </div>

                                    {job.salary && (
                                        <p className="text-sm text-neutral-300 flex items-center gap-1.5">
                                            <DollarSign size={13} className="text-emerald-500" />
                                            {job.salary}
                                        </p>
                                    )}

                                    {job.skills.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                            {job.skills.slice(0, 5).map((sk, i) => (
                                                <span key={i} className="text-[10px] px-2 py-0.5 bg-neutral-800 text-neutral-300 rounded-full border border-neutral-700">
                                                    {sk}
                                                </span>
                                            ))}
                                            {job.skills.length > 5 && (
                                                <span className="text-[10px] px-2 py-0.5 bg-neutral-800 text-neutral-500 rounded-full">
                                                    +{job.skills.length - 5}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* Recruiter info */}
                                    <div className="flex items-center gap-2.5 pt-2 border-t border-neutral-800">
                                        <img
                                            src={job.postedBy?.profilePicture || DEFAULT_AVATAR}
                                            alt={job.postedBy?.name}
                                            className="w-8 h-8 rounded-full object-cover border border-neutral-700"
                                        />
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold text-white truncate">
                                                {job.postedBy?.name}
                                            </p>
                                            <p className="text-[10px] text-neutral-500 truncate">
                                                {job.postedBy?.companyName || job.postedBy?.email}
                                            </p>
                                        </div>
                                        <span className="ml-auto text-[10px] text-neutral-500 flex items-center gap-1">
                                            <User size={10} />
                                            {job.applicants?.length || 0} applicants
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                {job.delegationStatus === 'pending' && (
                                    <div className="px-5 pb-5">
                                        <Button
                                            variant="secondary"
                                            className="w-full mb-3 gap-1.5 border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400"
                                            onClick={() => setSelectedJobToReview(job)}
                                        >
                                            <Search size={15} />
                                            Review Job Details
                                        </Button>
                                        <div className="flex gap-3">
                                            <Button
                                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                                                onClick={() => handleAccept(job._id)}
                                                disabled={isProcessing}
                                            >
                                                <CheckCircle2 size={15} />
                                                {isProcessing ? 'Accepting...' : 'Accept Project'}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="flex-1 border-red-900/50 text-red-400 hover:bg-red-900/20 gap-1.5"
                                                onClick={() => handleReject(job._id)}
                                                disabled={isProcessing}
                                            >
                                                <XCircle size={15} />
                                                Decline
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {job.delegationStatus === 'accepted' && (
                                    <div className="px-5 pb-5">
                                        <div className="flex items-center gap-2.5 p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/15 mb-3">
                                            <Shield size={16} className="text-emerald-400 flex-shrink-0" />
                                            <p className="text-xs text-neutral-300 leading-relaxed">
                                                You're actively managing this pipeline. Review applicants, conduct interviews, and propose your top hire.
                                            </p>
                                        </div>
                                        <div className="flex gap-3">
                                            <Link 
                                                to="/interviewer/pipeline" 
                                                className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-sm font-semibold transition-colors"
                                            >
                                                Manage Pipeline &rarr;
                                            </Link>
                                            <Link 
                                                to={`/interviewer/ranked/${job._id}`} 
                                                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-blue-500/20"
                                            >
                                                <Star className="w-4 h-4" />
                                                Review AI Rankings
                                            </Link>
                                        </div>
                                    </div>
                                )}

                                {job.delegationStatus === 'reviewing' && (
                                    <div className="px-5 pb-5">
                                        <div className="flex items-center gap-2.5 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20 mb-3">
                                            <Shield size={16} className="text-purple-400 flex-shrink-0" />
                                            <p className="text-xs text-neutral-300 leading-relaxed">
                                                Candidate proposed for hire. The recruiter is currently reviewing your hiring recommendation.
                                            </p>
                                        </div>
                                        <div className="flex gap-3">
                                            <Link 
                                                to="/interviewer/pipeline" 
                                                className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg text-sm font-semibold transition-colors"
                                            >
                                                View Pipeline &rarr;
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
            
            {/* Job Review Modal */}
            <JobReviewModal 
                job={selectedJobToReview} 
                onClose={() => setSelectedJobToReview(null)} 
            />
        </div>
    );
};

export default DelegatedProjects;

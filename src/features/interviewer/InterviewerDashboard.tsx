import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, MetricStatCard } from '@ui';
import { Video, Calendar, DollarSign, Clock, User, Briefcase, Star, Search, TrendingUp } from 'lucide-react';
import { apiRequest } from '@core/api';
import JobReviewModal from '@/components/JobReviewModal';
import { User as UserType, Interview, Message } from '@/types';

export const InterviewerDashboard: React.FC = () => {
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [user, setUser] = useState<UserType | null>(null);
    const [delegatedJobs, setDelegatedJobs] = useState<any[]>([]);
    const [selectedJobToReview, setSelectedJobToReview] = useState<any>(null);

    useEffect(() => {
        apiRequest('/users/profile').then(setUser).catch(console.error);
        apiRequest('/interviews/my-interviews')
            .then(data => {
                setInterviews(Array.isArray(data) ? data : [...(data.activeInterviews || []), ...(data.pastInterviews || [])]);
            })
            .catch(console.error);
        apiRequest('/interviews/my-messages').then(setMessages).catch(console.error);
        apiRequest('/freelancers/delegations')
            .then(data => setDelegatedJobs(data))
            .catch(console.error);
    }, []);

    const pendingDelegations = delegatedJobs.filter(job => job.delegationStatus === 'pending');
    const completedCount = interviews.filter(i => i.status === 'Completed').length;
    const rate = parseFloat(String(user?.hourlyRate || '0').replace(/[^0-9.]/g, '')) || 0;
    const totalEarnings = (completedCount * rate).toFixed(0);

    return (
        <div className="w-full space-y-6 animate-in fade-in duration-300">
            {/* Top Greeting & Status Banner */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2">
                <div>
                    <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 mb-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Domain Expert Active</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                        Welcome, {user?.firstName || 'Interviewer'}!
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                        Conduct technical evaluations, record emotional intelligence ratings, and review client delegations.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-sm">
                        Rate: <span className="text-emerald-600 dark:text-emerald-400 font-black">${user?.hourlyRate || '0'}/hr</span>
                    </div>
                    <Button
                        variant="pill"
                        size="md"
                        arrow
                        onClick={() => window.location.href = '#/interviewer/schedule'}
                    >
                        View Calendar
                    </Button>
                </div>
            </div>

            {/* 4-Quadrant Metric Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricStatCard
                    label="Total Sessions"
                    value={interviews.length}
                    trend="Lifetime interviews"
                    positive={true}
                    colorVariant="coral"
                    icon={Video}
                    subtext="Technical evaluations"
                />
                <MetricStatCard
                    label="Verified Earnings"
                    value={`$${totalEarnings}`}
                    trend="Automated payout"
                    positive={true}
                    colorVariant="emerald"
                    icon={DollarSign}
                    subtext="Completed assessments"
                />
                <MetricStatCard
                    label="Interviewer Rating"
                    value={(user as any)?.rating ? Number((user as any).rating).toFixed(1) : (user as any)?.averageRating ? Number((user as any).averageRating).toFixed(1) : '5.0'}
                    trend="Client feedback avg"
                    positive={true}
                    colorVariant="blue"
                    icon={Star}
                    subtext="Verified rubric evaluations"
                />
                <MetricStatCard
                    label="Punctuality Score"
                    value={interviews.length > 0 ? `${Math.min(100, Math.round((completedCount / interviews.length) * 100))}%` : '100%'}
                    trend={completedCount > 0 ? `${completedCount} sessions completed` : 'Awaiting sessions'}
                    positive={true}
                    colorVariant="white"
                    icon={TrendingUp}
                    subtext="Session completion rate"
                />
            </div>

            <div className="grid xl:grid-cols-2 gap-6">
                {/* Upcoming Schedule Card */}
                <Card className="flex flex-col h-full p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-600" />
                            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Upcoming Sessions</h3>
                        </div>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            {interviews.filter(i => i.status === 'Scheduled').length} Scheduled
                        </span>
                    </div>

                    {interviews.filter(i => i.status === 'Scheduled').length === 0 ? (
                        <div className="text-center py-10">
                            <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                            <p className="text-xs text-slate-500 font-medium">No sessions scheduled right now.</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">Keep your availability open to receive new booking requests.</p>
                        </div>
                    ) : (() => {
                        const scheduled = interviews.filter(i => i.status === 'Scheduled');
                        const visible   = scheduled.slice(0, 3);
                        const overflow  = scheduled.length - visible.length;
                        return (
                            <div className="space-y-3 flex-1 flex flex-col justify-between">
                                <div className="space-y-3">
                                    {visible.map(inv => {
                                        const candidate = (inv.candidateId as any);
                                        const recruiter = (inv.recruiterId as any);
                                        const job = (inv.jobId as any);
                                        const candidateName =
                                            candidate?.name ||
                                            (candidate?.firstName || candidate?.lastName
                                                ? `${candidate?.firstName ?? ''} ${candidate?.lastName ?? ''}`.trim()
                                                : null) ||
                                            'Candidate';
                                        const jobTitle = job?.title || 'Technical Assessment';
                                        const company = job?.company || recruiter?.companyName || recruiter?.name || 'Partner Org';

                                        return (
                                            <div key={inv._id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex justify-between items-center gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm truncate">
                                                        <User size={14} className="text-blue-600 flex-shrink-0" />
                                                        {candidateName}
                                                    </p>
                                                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5 truncate">
                                                        <Briefcase size={12} className="text-slate-400 flex-shrink-0" />
                                                        {jobTitle} • {company}
                                                    </p>
                                                    <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-1">
                                                        <Clock size={11} className="text-blue-500 flex-shrink-0" />
                                                        {inv.scheduledTime ? new Date(inv.scheduledTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : `${(inv as any).date} at ${(inv as any).time}`}
                                                    </p>
                                                </div>
                                                <a
                                                    href={`#/interview/room/${inv.meetingId}`}
                                                    className="inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 px-3.5 py-2 rounded-full transition-colors whitespace-nowrap shadow-sm flex-shrink-0 cursor-pointer"
                                                >
                                                    <Video size={13} /> Join Room
                                                </a>
                                            </div>
                                        );
                                    })}

                                    {overflow > 0 && (
                                        <p className="text-xs text-slate-400 text-center py-1">
                                            +{overflow} more session{overflow > 1 ? 's' : ''} on your schedule
                                        </p>
                                    )}
                                </div>

                                <Link
                                    to="/interviewer/schedule"
                                    className="block w-full text-center text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline pt-3 border-t border-slate-100 dark:border-slate-800 transition-colors"
                                >
                                    Open Full Availability Calendar &rarr;
                                </Link>
                            </div>
                        );
                    })()}
                </Card>

                <Card title="Pending Project Requests" className="border-amber-500/20 bg-amber-500/5">
                    {pendingDelegations.length === 0 ? <p className="text-neutral-500">No pending projects.</p> : (
                        <div className="space-y-3">
                            {pendingDelegations.map(job => (
                                <div key={job._id} className="p-4 border border-amber-500/30 rounded-lg bg-neutral-900/50">
                                    <div className="mb-3">
                                        <p className="font-semibold text-white flex gap-2 items-center">
                                            <Briefcase size={16} className="text-amber-400" />
                                            {job.title}
                                        </p>
                                        <p className="text-sm text-neutral-400 mt-1">
                                            Company: <span className="font-medium text-white">{job.company || job.postedBy?.companyName}</span>
                                        </p>
                                        <p className="text-sm text-neutral-400 mt-1">
                                            Delegated by: <span className="font-medium text-white">{job.postedBy?.name}</span>
                                        </p>
                                    </div>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="w-full mb-2 gap-1.5 border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold"
                                        onClick={() => setSelectedJobToReview(job)}
                                    >
                                        <Search size={14} />
                                        Review Job Details
                                    </Button>
                                    <div className="flex gap-2">
                                        <Button
                                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                                            size="sm"
                                            onClick={async () => {
                                                try {
                                                    await apiRequest(`/freelancers/delegations/${job._id}/accept`, 'PUT');
                                                    alert("✅ Delegation accepted! You can now manage this pipeline in Delegated Projects.");
                                                    setDelegatedJobs(prev => prev.filter(j => j._id !== job._id));
                                                } catch (e: any) { alert(e.message || "Failed to accept"); }
                                            }}
                                        >
                                            Accept Project
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="flex-1 border-rose-500/30 text-rose-500 hover:bg-rose-500/10 font-bold"
                                            size="sm"
                                            onClick={async () => {
                                                if (!confirm('Are you sure you want to decline this delegation?')) return;
                                                try {
                                                    await apiRequest(`/freelancers/delegations/${job._id}/reject`, 'PUT');
                                                    alert("Delegation declined.");
                                                    setDelegatedJobs(prev => prev.filter(j => j._id !== job._id));
                                                } catch (e: any) { alert(e.message || "Failed to reject"); }
                                            }}
                                        >
                                            Reject
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                <Card title="Pending Feedback" className="xl:col-span-2">
                    {interviews.filter(i => (i.status === 'Completed' || i.status === 'Scheduled') && !i.feedback && new Date(i.scheduledTime || Date.now()).getTime() < Date.now()).length === 0 ? (
                        <p className="text-slate-500 text-center py-6 text-xs">No pending feedback right now.</p>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {interviews
                                .filter(i => (i.status === 'Completed' || i.status === 'Scheduled') && !i.feedback && new Date(i.scheduledTime || Date.now()).getTime() < Date.now())
                                .map(inv => (
                                <div key={inv._id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col justify-between h-full bg-slate-50 dark:bg-slate-900/60">
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white mb-1 text-sm">{inv.candidateId?.name || 'Candidate'}</p>
                                        <p className="text-xs text-slate-400 mb-3">
                                            {inv.scheduledTime ? new Date(inv.scheduledTime).toLocaleString() : 'Past Interview'}
                                        </p>
                                    </div>
                                    <a href={`#/interviewer/feedback/${inv._id}`} className="text-xs font-bold text-center bg-blue-600 px-4 py-2 rounded-full text-white hover:bg-blue-700 transition-colors shadow-sm">
                                        Submit Evaluation
                                    </a>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>

            {/* Job Review Modal */}
            <JobReviewModal 
                job={selectedJobToReview} 
                onClose={() => setSelectedJobToReview(null)} 
            />
        </div>
    );
};

export default InterviewerDashboard;

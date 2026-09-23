import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, MetricStatCard, CircularProgressGauge } from '@/components/UI';
import { MapPin, DollarSign, Clock, Video, Briefcase, MessageSquare, Sparkles, ArrowUpRight, TrendingUp } from 'lucide-react';
import { apiRequest } from '@/utils/api';
import { Job, User, Interview, Message } from '@/types';

export const CandidatePortal: React.FC = () => {
    const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);

    useEffect(() => {
        apiRequest('/users/profile').then(setUser).catch(console.error);
        apiRequest('/jobs').then(data => setRecommendedJobs(data.slice(0, 3))).catch(console.error);
        apiRequest('/interviews/my-interviews').then(data => setInterviews(Array.isArray(data) ? data : [...(data.activeInterviews || []), ...(data.pastInterviews || [])])).catch(console.error);
        apiRequest('/interviews/my-messages').then(setMessages).catch(console.error);
    }, []);

    const candidateName = user?.firstName || user?.name || 'Candidate';

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Hero Profile & Readiness Banner */}
            <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="relative z-10 max-w-xl">
                    <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cobalt-50 text-cobalt-700 dark:bg-cobalt-950/60 dark:text-cobalt-300 border border-cobalt-200/60 dark:border-cobalt-800/60 mb-3">
                        <Sparkles size={12} className="text-cobalt-600" />
                        <span>Candidate Talent Portal</span>
                    </div>
                    <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                        Welcome back, {candidateName}!
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                        Explore open positions matching your verified skills, track interview invitations, and monitor AI assessment feedback.
                    </p>
                    <div className="mt-5 flex flex-wrap gap-3">
                        <Button
                            variant="pill"
                            size="md"
                            arrow
                            onClick={() => window.location.href = '#/candidate/jobs'}
                        >
                            Browse Requisitions
                        </Button>
                        <Button
                            variant="secondary"
                            size="md"
                            onClick={() => window.location.href = '#/candidate/profile'}
                        >
                            Update Profile & CV
                        </Button>
                    </div>
                </div>

                {/* Readiness Gauge Widget */}
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 self-start md:self-auto">
                    <CircularProgressGauge
                        percentage={85}
                        size={76}
                        strokeWidth={7}
                        color="#2563EB"
                        label=""
                    />
                    <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Profile Strength</span>
                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">AI Verified</h4>
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Ready for Matching</p>
                    </div>
                </div>
            </div>

            {/* 4-Quadrant Metric Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricStatCard
                    label="Requisitions Available"
                    value={recommendedJobs.length}
                    trend="Active opportunities"
                    positive={true}
                    colorVariant="coral"
                    icon={Briefcase}
                    subtext="Matching skill profile"
                />
                <MetricStatCard
                    label="Live Interviews"
                    value={interviews.length}
                    trend={interviews.length > 0 ? "Upcoming slot" : "Ready to schedule"}
                    positive={true}
                    colorVariant="blue"
                    icon={Video}
                    subtext="Video screenings"
                />
                <MetricStatCard
                    label="Direct Messages"
                    value={messages.length}
                    trend="Recruiter notes"
                    positive={true}
                    colorVariant="emerald"
                    icon={MessageSquare}
                    subtext="Inbox communications"
                />
                <MetricStatCard
                    label="AI Match Precision"
                    value="92%"
                    trend="Top percentile"
                    positive={true}
                    colorVariant="white"
                    icon={TrendingUp}
                    subtext="Based on vector scoring"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Main Column: Recommended Jobs */}
                <div className="lg:col-span-8 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                                Recommended For You
                            </h3>
                            <p className="text-xs text-slate-500">Based on your skills, experience, and preferred roles.</p>
                        </div>
                        <button
                            onClick={() => window.location.href = '#/candidate/jobs'}
                            className="text-xs font-bold text-cobalt-600 dark:text-cobalt-400 hover:underline inline-flex items-center gap-1"
                        >
                            View All <ArrowUpRight size={14} />
                        </button>
                    </div>

                    {recommendedJobs.length === 0 ? (
                        <Card className="text-center py-12">
                            <Briefcase className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">No Active Postings Found</h4>
                            <p className="text-xs text-slate-500 max-w-sm mx-auto">
                                New positions are published daily. Check back soon or refine your profile skills.
                            </p>
                        </Card>
                    ) : (
                        recommendedJobs.map(job => (
                            <Card
                                key={job._id}
                                className="group hover:border-cobalt-500/50 transition-all cursor-pointer p-5"
                                onClick={() => window.location.href = '#/candidate/jobs'}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-black text-slate-800 dark:text-slate-100 text-sm">
                                            {job.company.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-cobalt-600 dark:group-hover:text-cobalt-400 transition-colors">
                                                {job.title}
                                            </h4>
                                            <p className="text-xs text-slate-500">{job.company}</p>
                                        </div>
                                    </div>
                                    <Badge variant="remote">{job.type || 'Full-time'}</Badge>
                                </div>
                                <div className="flex items-center gap-5 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500">
                                    <span className="flex items-center gap-1.5"><MapPin size={13} className="text-slate-400" /> {job.location}</span>
                                    {job.salary && <span className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300"><DollarSign size={13} className="text-emerald-500" /> {job.salary}</span>}
                                    <span className="ml-auto text-[11px] font-bold text-cobalt-600 dark:text-cobalt-400 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                                        Inspect Requisition <ArrowUpRight size={13} />
                                    </span>
                                </div>
                            </Card>
                        ))
                    )}
                </div>

                {/* Side Column: Notifications & Schedule */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Live Interviews Card */}
                    <Card className="p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Video className="w-4 h-4 text-cobalt-600" />
                                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Upcoming Interviews</h3>
                            </div>
                            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                {interviews.length} Scheduled
                            </span>
                        </div>

                        {interviews.length === 0 ? (
                            <div className="text-center py-6">
                                <p className="text-xs text-slate-400">No interviews scheduled yet.</p>
                                <p className="text-[10px] text-slate-400 mt-1">Recruiters will invite you once resume screening is complete.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {interviews.map(inv => (
                                    <div key={inv._id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-900 dark:text-white">Interview Session</span>
                                            <span className="text-[10px] font-semibold text-cobalt-600 dark:text-cobalt-400">{inv.date}</span>
                                        </div>
                                        <p className="text-xs text-slate-500">With: {(inv.recruiterId as any)?.name || 'Technical Team'}</p>
                                        <p className="text-[11px] text-slate-400 flex items-center gap-1"><Clock size={12} /> {inv.time}</p>
                                        {inv.meetingLink && (
                                            <a
                                                href={inv.meetingLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 mt-1 rounded-full bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm"
                                            >
                                                <Video size={13} /> Join Live Room
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    {/* Messages / Inbox Card */}
                    <Card className="p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-cobalt-600" />
                                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Recent Inbox</h3>
                            </div>
                            <span className="text-[11px] font-bold text-slate-400">{messages.length} notes</span>
                        </div>

                        {messages.length === 0 ? (
                            <div className="text-center py-6">
                                <p className="text-xs text-slate-400">No new messages.</p>
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                {messages.slice(0, 3).map(msg => (
                                    <div key={msg._id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50">
                                        <p className="text-xs font-bold text-slate-900 dark:text-white mb-0.5">{(msg.senderId as any)?.name || 'Recruiter'}</p>
                                        <p className="text-xs text-slate-500 line-clamp-2">{msg.content}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export { CandidatePortal as CandidateDashboard };
export default CandidatePortal;

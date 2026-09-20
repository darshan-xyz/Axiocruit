
import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Input, Modal, MetricStatCard, CircularProgressGauge } from '../components/UI';
import { MapPin, DollarSign, Clock, Upload, CheckCircle, Video, Briefcase, FileText, Search, MessageSquare, Download, Trash2, Plus, Sparkles, ArrowUpRight, TrendingUp, Calendar, ExternalLink } from 'lucide-react';
import { apiRequest } from '../utils/api';
import { Job, User, Interview, Message, Experience } from '../types';
import { ChangePasswordForm } from '../components/ChangePasswordForm';
import InterviewsTab from '../components/InterviewsTab';
import { ApplyWithCVModal } from '../components/ApplyWithCVModal';
import { DEFAULT_AVATAR } from '../utils/defaultAvatar';

// Helper for Base64
const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

export const CandidateDashboard: React.FC = () => {
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

export const CandidateJobs: React.FC = () => {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [filters, setFilters] = useState({
        title: '',
        location: '',
        type: ''
    });
    const [applyModalJob, setApplyModalJob] = useState<Job | null>(null);

    const fetchJobs = () => {
        const queryParams = new URLSearchParams();
        if (filters.title) queryParams.append('title', filters.title);
        if (filters.location) queryParams.append('location', filters.location);
        if (filters.type) queryParams.append('type', filters.type);

        apiRequest(`/jobs?${queryParams.toString()}`).then(setJobs).catch(console.error);
    };

    useEffect(() => {
        fetchJobs();
    }, []);

    // Debounce or just search on button click/enter could be better, but effect on deps is easy for now
    // However, to avoid too many calls, let's use a Search button or just rely on "Enter" key or blur.
    // For simplicity, I'll add a "Search" button and run fetchJobs on mount.

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchJobs();
    };

    const handleApply = (job: Job) => {
        setApplyModalJob(job);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-end">
                <h2 className="text-2xl font-bold">Browse Jobs</h2>
                <form onSubmit={handleSearch} className="flex flex-wrap gap-2 w-full md:w-auto items-center">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                        <input
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-900 dark:text-white focus:border-cobalt-500 outline-none"
                            placeholder="Job Title..."
                            value={filters.title}
                            onChange={(e) => setFilters({ ...filters, title: e.target.value })}
                        />
                    </div>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                        <input
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-900 dark:text-white focus:border-cobalt-500 outline-none"
                            placeholder="Location..."
                            value={filters.location}
                            onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                        />
                    </div>
                    <select
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white focus:border-cobalt-500 outline-none"
                        value={filters.type}
                        onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                    >
                        <option value="">All Types</option>
                        <option value="Full-time">Full-time</option>
                        <option value="Contract">Contract</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Remote">Remote</option>
                    </select>
                    <Button type="submit">Search</Button>
                </form>
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {jobs.length === 0 ? (
                    <p className="text-neutral-500 col-span-3 text-center py-12">No jobs found matching your criteria.</p>
                ) : (
                    jobs.map(job => (
                        <Card key={job._id} className="hover:-translate-y-1 transition-transform cursor-pointer flex flex-col h-full relative group" onClick={() => setSelectedJob(job)}>
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                                    <span className="text-slate-900 dark:text-white font-black text-base">{job.company.substring(0, 2).toUpperCase()}</span>
                                </div>
                                <Badge variant="neutral">{job.type}</Badge>
                            </div>
                            <h3 className="font-extrabold text-base mb-1 text-slate-900 dark:text-white">{job.title}</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{job.company} • {job.location}</p>
                            <div className="flex-1"></div>
                            <div className="flex gap-2 flex-wrap mb-4">
                                {job.salary && <span className="text-xs border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-full px-2.5 py-0.5 flex items-center gap-1 font-semibold"><DollarSign size={11} className="text-emerald-500" /> {job.salary}</span>}
                                {job.postedBy && <span className="text-xs text-slate-400 self-center">Posted {new Date(job.createdAt).toLocaleDateString()}</span>}
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" className="flex-1" onClick={(e) => { e.stopPropagation(); setSelectedJob(job); }}>View Details</Button>
                                <Button variant="outline" className="flex-1" onClick={(e) => { e.stopPropagation(); handleApply(job); }}>Apply</Button>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {/* Job Details Modal */}
            <Modal isOpen={selectedJob !== null} onClose={() => setSelectedJob(null)} title="Job Details">
                {selectedJob && (
                    <div className="space-y-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-2xl font-bold mb-1">{selectedJob.title}</h2>
                                <p className="text-cobalt-600 dark:text-cobalt-400 font-bold text-lg">{selectedJob.company}</p>
                            </div>
                            <Badge variant="remote" className="text-sm px-3 py-1">{selectedJob.type}</Badge>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 pb-6">
                            <span className="flex items-center gap-2"><MapPin size={16} className="text-cobalt-500" /> {selectedJob.location}</span>
                            {selectedJob.salary && <span className="flex items-center gap-2"><DollarSign size={16} className="text-emerald-500" /> {selectedJob.salary}</span>}
                            <span className="flex items-center gap-2"><Clock size={16} className="text-slate-400" /> Posted {new Date(selectedJob.createdAt).toLocaleDateString()}</span>
                        </div>

                        <div>
                            <h3 className="text-base font-bold mb-3 flex items-center gap-2 text-slate-900 dark:text-white"><FileText size={18} className="text-cobalt-500" /> Description</h3>
                            <div className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-sm">
                                {selectedJob.description}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-base font-bold mb-3 flex items-center gap-2 text-slate-900 dark:text-white"><CheckCircle size={18} className="text-emerald-500" /> Requirements</h3>
                            <div className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-sm">
                                {selectedJob.requirements}
                            </div>
                        </div>

                        {selectedJob.skills && selectedJob.skills.length > 0 && (
                            <div>
                                <h3 className="text-lg font-bold mb-3">Skills</h3>
                                <div className="flex flex-wrap gap-2">
                                    {selectedJob.skills.map((skill: string, idx: number) => (
                                        <Badge key={idx} variant="neutral">{skill}</Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="pt-6 border-t border-neutral-800 flex justify-end gap-3">
                            <Button variant="ghost" onClick={() => setSelectedJob(null)}>Close</Button>
                            <Button onClick={() => { handleApply(selectedJob); setSelectedJob(null); }}>Apply</Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Apply Modal */}
            <ApplyWithCVModal
                isOpen={applyModalJob !== null}
                onClose={() => setApplyModalJob(null)}
                jobId={applyModalJob?._id || ''}
                jobTitle={applyModalJob?.title || ''}
                onSuccess={() => {
                    setJobs(prev => prev.filter(j => j._id !== applyModalJob?._id));
                    alert("Application submitted! Moved to your Applications tab.");
                }}
            />
        </div>
    )
}

export const CandidateProfile: React.FC = () => {
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', headline: '', bio: '', skills: ''
    });
    const [experience, setExperience] = useState<Experience[]>([]);
    const [education, setEducation] = useState<any[]>([]); // Use appropriate type if imported

    // New Experience Form State
    const [newExp, setNewExp] = useState<Experience>({
        company: '', designation: '', from: '', to: '', work: ''
    });
    const [showExpForm, setShowExpForm] = useState(false);

    // New Education Form State
    const [newEdu, setNewEdu] = useState({
        institution: '', degree: '', fieldOfStudy: '', from: '', to: ''
    });
    const [showEduForm, setShowEduForm] = useState(false);

    const [profilePicture, setProfilePicture] = useState<string | null>(null);
    const [resumeName, setResumeName] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [resumeUrl, setResumeUrl] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const user: any = await apiRequest(`/users/profile?t=${Date.now()}`); // cache busting
                const profileData = user.profile || {};

                setFormData({
                    firstName: user.firstName || user.name.split(' ')[0] || '',
                    lastName: user.lastName || user.name.split(' ').slice(1).join(' ') || '',
                    headline: profileData.headline || '',
                    bio: profileData.bio || user.bio || '',
                    skills: profileData.skills?.length ? profileData.skills.join(', ') : (user.skills?.join(', ') || '')
                });
                // Fallback to reading from the main user object if the profile sub-document is empty
                setExperience(profileData.experience?.length ? profileData.experience : (user.experience || []));
                setEducation(profileData.education || []);
                setProfilePicture(user.profilePicture || null);
                if (user.resumeUrl || profileData.resume) {
                    setResumeName('Resume Uploaded');
                    setResumeUrl(user.resumeUrl || profileData.resume);
                }
            } catch (error) {
                console.error("Failed to fetch profile", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleAddExperience = () => {
        if (!newExp.company || !newExp.designation || !newExp.from) {
            alert("Please fill in Company, Designation, and Start Date");
            return;
        }

        // Date Validation
        const fromDate = new Date(newExp.from);
        const toDate = newExp.to ? new Date(newExp.to) : null;
        const today = new Date();

        if (fromDate.getFullYear() < 1950 || fromDate.getFullYear() > 2100) {
            alert("Start year must be between 1950 and 2100.");
            return;
        }
        if (toDate && (toDate.getFullYear() < 1950 || toDate.getFullYear() > 2100)) {
            alert("End year must be between 1950 and 2100.");
            return;
        }

        if (fromDate > today) {
            alert("Start date cannot be in the future.");
            return;
        }
        if (toDate && toDate > today) {
            alert("End date cannot be in the future.");
            return;
        }
        if (toDate && fromDate > toDate) {
            alert("Start date cannot be after end date.");
            return;
        }

        setExperience([...experience, newExp]);
        setNewExp({ company: '', designation: '', from: '', to: '', work: '' });
        setShowExpForm(false);
    };

    const handleRemoveExperience = (index: number) => {
        const updated = [...experience];
        updated.splice(index, 1);
        setExperience(updated);
    };

    const handleAddEducation = () => {
        if (!newEdu.institution || !newEdu.degree || !newEdu.from) {
            alert("Please fill in Institution, Degree, and Start Date");
            return;
        }

        // Date Validation
        const fromDate = new Date(newEdu.from);
        const toDate = newEdu.to ? new Date(newEdu.to) : null;
        const today = new Date();

        if (fromDate.getFullYear() < 1950 || fromDate.getFullYear() > 2100) {
            alert("Start year must be between 1950 and 2100.");
            return;
        }
        if (toDate && (toDate.getFullYear() < 1950 || toDate.getFullYear() > 2100)) {
            alert("End year must be between 1950 and 2100.");
            return;
        }

        if (fromDate > today) {
            alert("Start date cannot be in the future.");
            return;
        }
        if (toDate && toDate > today) {
            alert("End date cannot be in the future.");
            return;
        }
        if (toDate && fromDate > toDate) {
            alert("Start date cannot be after end date.");
            return;
        }

        setEducation([...education, newEdu]);
        setNewEdu({ institution: '', degree: '', fieldOfStudy: '', from: '', to: '' });
        setShowEduForm(false);
    };

    const handleRemoveEducation = (index: number) => {
        const updated = [...education];
        updated.splice(index, 1);
        setEducation(updated);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Input Sanitization
            const nameRegex = /^[a-zA-Z\s]*$/;
            if (!nameRegex.test(formData.firstName) || !nameRegex.test(formData.lastName)) {
                alert('First Name and Last Name can only contain letters and spaces.');
                setSaving(false);
                return;
            }

            const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(s => s.length > 0);
            await apiRequest('/users/profile', 'PUT', {
                ...formData,
                skills: skillsArray,
                experience: experience,
                education: education
            });
            alert('Profile updated successfully!');
        } catch (error) {
            alert('Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'profilePicture' | 'resume') => {
        if (e.target.files && e.target.files[0]) {
            try {
                const file = e.target.files[0];

                if (type === 'resume') {
                    if (file.type !== 'application/pdf') {
                        alert('Only PDF files are allowed for resumes.');
                        return;
                    }

                    const formData = new FormData();
                    formData.append('resume', file);

                    const data = await apiRequest('/users/resume', 'POST', formData);
                    setResumeName(file.name);
                    setResumeUrl(data.resumeUrl);
                    alert('Resume updated successfully!');

                } else {
                    // Profile Picture Upload
                    const formData = new FormData();
                    formData.append('profilePicture', file);

                    const response = await apiRequest('/users/profile-picture', 'POST', formData);
                    setProfilePicture(response.profilePicture);
                    alert('Photo updated');
                }
            } catch (e: any) {
                console.error(e);
                alert(`Upload failed: ${e.message || 'Unknown error'}`);
            }
        }
    };

    if (loading) return <div>Loading profile...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold">My Profile</h2>

            <Card className="p-8">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-cobalt-500 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            {profilePicture ? (
                                <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <img src={DEFAULT_AVATAR} alt="Profile" className="w-full h-full object-cover" />
                            )}
                        </div>
                        <label className="cursor-pointer inline-flex items-center justify-center rounded-full font-semibold transition-all duration-200 focus:outline-none border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-cobalt-500 hover:text-cobalt-600 bg-transparent px-4 py-1.5 text-xs shadow-sm">
                            <Upload className="w-3.5 h-3.5 mr-2" />
                            Change Photo
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'profilePicture')} />
                        </label>
                    </div>

                    <div className="flex-1 space-y-6 w-full">
                        <div className="grid md:grid-cols-2 gap-6">
                            <Input label="First Name" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} />
                            <Input label="Last Name" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
                        </div>
                        <Input label="Professional Headline" placeholder="e.g. Senior Full Stack Developer" value={formData.headline} onChange={(e) => setFormData({ ...formData, headline: e.target.value })} />
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Bio</label>
                            <textarea className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white h-24 focus:border-cobalt-500 outline-none text-sm"
                                placeholder="Tell recruiters about yourself..." value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            </Card>

            <Card title="Work Experience">
                <div className="space-y-4">
                    {experience.map((exp, idx) => (
                        <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 relative group">
                            <button
                                onClick={() => handleRemoveExperience(idx)}
                                className="absolute top-4 right-4 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 size={16} />
                            </button>
                            <h4 className="font-bold text-slate-900 dark:text-white text-base">{exp.designation}</h4>
                            <p className="text-cobalt-600 dark:text-cobalt-400 font-semibold text-sm">{exp.company}</p>
                            <p className="text-xs text-slate-400 mb-2">{exp.from} - {exp.to || 'Present'}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-300">{exp.work}</p>
                        </div>
                    ))}

                    {showExpForm ? (
                        <div className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-4 animate-in fade-in zoom-in duration-200">
                            <div className="grid md:grid-cols-2 gap-4">
                                <Input label="Company" placeholder="Google" value={newExp.company} onChange={e => setNewExp({ ...newExp, company: e.target.value })} />
                                <Input label="Designation" placeholder="Software Engineer" value={newExp.designation} onChange={e => setNewExp({ ...newExp, designation: e.target.value })} />
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <Input label="From" type="date" value={newExp.from} onChange={e => setNewExp({ ...newExp, from: e.target.value })} />
                                <Input label="To" type="date" value={newExp.to} onChange={e => setNewExp({ ...newExp, to: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
                                <textarea
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white h-20 focus:border-cobalt-500 outline-none text-sm"
                                    placeholder="Describe your role..."
                                    value={newExp.work}
                                    onChange={e => setNewExp({ ...newExp, work: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <Button variant="ghost" size="sm" onClick={() => setShowExpForm(false)}>Cancel</Button>
                                <Button size="sm" onClick={handleAddExperience}>Add Experience</Button>
                            </div>
                        </div>
                    ) : (
                        <Button variant="outline" className="w-full border-dashed" onClick={() => setShowExpForm(true)}>
                            <Plus size={18} className="mr-2" /> Add Position
                        </Button>
                    )}
                </div>
            </Card>

            <Card title="Education">
                <div className="space-y-4">
                    {education.map((edu, idx) => (
                        <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 relative group">
                            <button
                                onClick={() => handleRemoveEducation(idx)}
                                className="absolute top-4 right-4 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 size={16} />
                            </button>
                            <h4 className="font-bold text-slate-900 dark:text-white text-base">{edu.institution}</h4>
                            <p className="text-cobalt-600 dark:text-cobalt-400 font-semibold text-sm">{edu.degree}, {edu.fieldOfStudy}</p>
                            <p className="text-xs text-slate-400 mb-2">{edu.from} - {edu.to || 'Present'}</p>
                        </div>
                    ))}

                    {showEduForm ? (
                        <div className="p-6 bg-neutral-900 border border-neutral-700 rounded-lg space-y-4 animate-in fade-in zoom-in duration-200">
                            <div className="grid md:grid-cols-2 gap-4">
                                <Input label="Institution" placeholder="Stanford University" value={newEdu.institution} onChange={e => setNewEdu({ ...newEdu, institution: e.target.value })} />
                                <Input label="Degree" placeholder="Bachelor's" value={newEdu.degree} onChange={e => setNewEdu({ ...newEdu, degree: e.target.value })} />
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <Input label="Field of Study" placeholder="Computer Science" value={newEdu.fieldOfStudy} onChange={e => setNewEdu({ ...newEdu, fieldOfStudy: e.target.value })} />
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <Input label="From" type="date" value={newEdu.from} onChange={e => setNewEdu({ ...newEdu, from: e.target.value })} />
                                <Input label="To" type="date" value={newEdu.to} onChange={e => setNewEdu({ ...newEdu, to: e.target.value })} />
                            </div>
                            <div className="flex justify-end gap-3">
                                <Button variant="ghost" size="sm" onClick={() => setShowEduForm(false)}>Cancel</Button>
                                <Button size="sm" onClick={handleAddEducation}>Add Education</Button>
                            </div>
                        </div>
                    ) : (
                        <Button variant="outline" className="w-full border-dashed" onClick={() => setShowEduForm(true)}>
                            <Plus size={18} className="mr-2" /> Add Education
                        </Button>
                    )}
                </div>
            </Card>

            <Card title="Skills & Resume">
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-neutral-400 mb-2">Skills (Comma separated)</label>
                        <Input placeholder="React, Node.js, TypeScript..." value={formData.skills} onChange={(e) => setFormData({ ...formData, skills: e.target.value })} />
                        <div className="flex flex-wrap gap-2 mt-3">
                            {formData.skills.split(',').filter(s => s.trim()).map((skill, idx) => (
                                <Badge key={idx} variant="neutral">{skill.trim()}</Badge>
                            ))}
                        </div>
                    </div>

                    <div className="border-t border-neutral-800 pt-6">
                        <label className="block text-sm font-medium text-neutral-400 mb-3">Resume / CV</label>
                        <label className="border-2 border-dashed border-neutral-700 rounded-xl p-8 text-center hover:bg-neutral-800/50 transition-colors cursor-pointer block">
                            <FileText className="w-8 h-8 mx-auto text-neutral-500 mb-2" />
                            <p className="text-neutral-300 font-medium">{resumeName || "Click to upload or drag and drop"}</p>
                            <p className="text-xs text-neutral-500 mt-1">PDF Only (Max 10MB)</p>
                            <input type="file" className="hidden" accept="application/pdf" onChange={(e) => handleFileChange(e, 'resume')} />
                        </label>
                        {resumeUrl && (
                            <div className="mt-4 flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-2">
                                    <FileText size={16} className="text-cobalt-600 dark:text-cobalt-400" />
                                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Resume Uploaded & Verified</span>
                                </div>
                                <a href={resumeUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-cobalt-600 dark:text-cobalt-400 hover:underline flex items-center gap-1 font-bold">
                                    <Download size={12} /> Download
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            <ChangePasswordForm />

            <div className="flex justify-end">
                <Button size="lg" variant="pill" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>
        </div>
    )
}

export const CandidateInterviews: React.FC = () => <InterviewsTab role="CANDIDATE" />;

export const CandidateApplications: React.FC = () => {
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiRequest('/applications/my-applications')
            .then(data => setApplications(data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="text-center p-8 text-slate-500">Loading applications...</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">My Applications</h2>
            {applications.length === 0 ? (
                <div className="text-center p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                    <Briefcase className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">You haven't applied to any positions yet.</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 gap-4">
                    {applications.map(app => (
                        <Card key={app._id} className="flex flex-col p-5">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">{app.job?.title || 'Job Requisition'}</h3>
                                <Badge variant={
                                    app.status === 'Applied' ? 'new' :
                                        app.status === 'Rejected' ? 'outline' :
                                            app.status === 'Pending AI' ? 'assessment' : 'completed'
                                }>
                                    {app.status}
                                </Badge>
                            </div>
                            <p className="text-cobalt-600 dark:text-cobalt-400 text-xs font-semibold mb-4">{app.job?.company || 'Company'} • {app.job?.location || 'Remote'}</p>
                            <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <span className="text-xs text-slate-400">Applied: {new Date(app.appliedAt).toLocaleDateString()}</span>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {app.job?.postedBy && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="px-3 py-1 text-xs hover:border-cobalt-500"
                                            onClick={() => window.location.href = `#/candidate/messages?userId=${app.job.postedBy._id}`}
                                        >
                                            <MessageSquare size={12} className="mr-1 text-cobalt-600" />
                                            Message Recruiter
                                        </Button>
                                    )}
                                    {app.status === 'Pending AI' && (
                                        <Button
                                            size="sm"
                                            onClick={() => window.location.href = `#/coding-test/${app.job?._id}`}
                                            className="px-3 py-1 text-xs"
                                        >
                                            Start Coding Test
                                        </Button>
                                    )}
                                    {app.aiScore !== null && (
                                        <span className="text-xs font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">Score: {app.aiScore}</span>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

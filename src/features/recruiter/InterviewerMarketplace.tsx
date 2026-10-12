import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Badge, Modal } from '@ui';
import { Search, DollarSign, Clock, Briefcase, Star, Send, MessageSquare, ArrowRight, User, Sparkles, AlertTriangle, Shield } from 'lucide-react';
import { apiRequest } from '@core/api';
import { User as UserType } from '@/types';
import { FreelancerPublicProfileModal } from '@/components/FreelancerPublicProfileModal';
import { DEFAULT_AVATAR } from '@/utils/defaultAvatar';

export interface FreelancerService {
    _id: string;
    title: string;
    description: string;
    skills: string[];
    price: number;
    durationMinutes: number;
    isActive: boolean;
    freelancerId: {
        _id: string;
        name: string;
        profilePicture?: string;
        averageRating?: number;
        bio?: string;
    };
    createdAt: string;
}

export const FindInterviewers: React.FC = () => {
    const [interviewers, setInterviewers] = useState<UserType[]>([]);
    const [selectedInterviewer, setSelectedInterviewer] = useState<UserType | null>(null);
    const [isMessageOpen, setIsMessageOpen] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    // Booking Form State
    const [bookingData, setBookingData] = useState({
        jobId: '', candidateId: '', date: '', time: '', notes: ''
    });

    const [jobs, setJobs] = useState<any[]>([]);
    const [candidates, setCandidates] = useState<any[]>([]);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [maxRate, setMaxRate] = useState(150);

    const fetchInterviewers = async () => {
        try {
            const query = new URLSearchParams();
            if (searchTerm) query.append('skill', searchTerm);
            if (maxRate) query.append('maxRate', maxRate.toString());
            const data = await apiRequest(`/users/interviewers?${query.toString()}`);
            setInterviewers(data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchInterviewers();
        // Pre-fetch jobs and candidates for the booking modal dropdowns
        apiRequest('/jobs/my-jobs').then(setJobs).catch(console.error);
        apiRequest('/interviews/eligible-candidates').then(setCandidates).catch(console.error);
    }, []);

    const handleHire = async () => {
        if (!selectedInterviewer || !bookingData.candidateId || !bookingData.date || !bookingData.time) {
            alert("Please fill in Candidate, Date, and Time.");
            return;
        }

        const now = new Date();
        const todayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
        const currentTimeStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

        if (bookingData.date < todayStr || (bookingData.date === todayStr && bookingData.time < currentTimeStr)) {
            alert("Please select a valid future date and time.");
            return;
        }

        try {
            await apiRequest('/interviews/schedule', 'POST', {
                candidateId: bookingData.candidateId,
                jobId: bookingData.jobId || undefined,
                interviewerId: selectedInterviewer._id,
                scheduledTime: `${bookingData.date}T${bookingData.time}:00`,
                notes: bookingData.notes,
                isDirectBooking: true // Flag to tell backend this is a booking request for an interviewer
            });
            alert('Booking request sent successfully!');
            setIsMessageOpen(false);
            setBookingData({ jobId: '', candidateId: '', date: '', time: '', notes: '' });
        } catch (error) {
            alert('Failed to send booking request');
        }
    };

    const nowLocal = new Date();
    const minDateLocal = nowLocal.getFullYear() + '-' + String(nowLocal.getMonth() + 1).padStart(2, '0') + '-' + String(nowLocal.getDate()).padStart(2, '0');
    const minTimeLocal = bookingData.date === minDateLocal ? String(nowLocal.getHours()).padStart(2, '0') + ':' + String(nowLocal.getMinutes()).padStart(2, '0') : undefined;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Find Freelance Interviewers</h2>

            <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-[#111726] p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm items-end transition-colors">
                <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Search by Skill</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-slate-400 w-5 h-5 pointer-events-none" />
                        <input
                            className="w-full bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none transition-colors"
                            placeholder="e.g. React, Node.js"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="w-full md:w-64 pb-2">
                    <div className="flex justify-between mb-2">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Max Hourly Rate</label>
                        <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400">${maxRate}/hr</span>
                    </div>
                    <input
                        type="range"
                        min="10"
                        max="300"
                        step="5"
                        value={maxRate}
                        onChange={e => setMaxRate(Number(e.target.value))}
                        className="w-full accent-blue-600"
                    />
                </div>
                <div>
                    <Button onClick={fetchInterviewers} className="h-[42px] px-8">Search</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {interviewers.map(user => (
                    <Card key={user._id} className="flex flex-col gap-4 group hover:border-blue-500/50 transition-all">
                        <div className="flex items-center gap-4">
                            <img src={user.profilePicture || DEFAULT_AVATAR} className="w-16 h-16 rounded-2xl object-cover border border-slate-200 dark:border-slate-700" alt="profile" />
                            <div>
                                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">{user.name}</h3>
                                <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">{(user as any).profile?.headline || 'Expert Interviewer'}</p>
                            </div>
                        </div>
                        <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
                            <div className="flex items-center gap-2">
                                <DollarSign size={14} className="text-emerald-500" />
                                <span className="font-semibold text-slate-900 dark:text-white">{(user as any).profile?.hourlyRate || '50'}/hr</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock size={14} className="text-blue-500" />
                                <span>{(user as any).profile?.yearsOfExperience || '5+'} Years Experience</span>
                            </div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {(user as any).profile?.skills?.slice(0, 3).map((s: string) => (
                                <Badge key={s} variant="neutral">{s}</Badge>
                            ))}
                        </div>
                        <div className="flex gap-2 mt-auto">
                            <Button className="flex-1" variant="outline" onClick={() => { setSelectedInterviewer(user); setIsDetailsOpen(true); }}>
                                View Details
                            </Button>
                            <Button className="flex-1" onClick={() => { setSelectedInterviewer(user); setIsMessageOpen(true); }}>
                                Book
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>

            <Modal isOpen={isMessageOpen} onClose={() => setIsMessageOpen(false)} title={`Book ${selectedInterviewer?.name}`}>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">For Job (Optional)</label>
                            <select className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 transition-colors" value={bookingData.jobId} onChange={e => setBookingData({ ...bookingData, jobId: e.target.value })}>
                                <option value="">Select Job</option>
                                {jobs.map(j => <option key={j._id} value={j._id}>{j.title}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">For Candidate</label>
                            <select className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 transition-colors" value={bookingData.candidateId} onChange={e => setBookingData({ ...bookingData, candidateId: e.target.value })}>
                                <option value="">Select Candidate</option>
                                {candidates.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Proposed Date" type="date" min={minDateLocal} value={bookingData.date} onChange={e => setBookingData({ ...bookingData, date: e.target.value })} />
                        <Input label="Proposed Time" type="time" min={minTimeLocal} value={bookingData.time} onChange={e => setBookingData({ ...bookingData, time: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Notes / Instructions</label>
                        <textarea
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm h-24 focus:border-blue-500 outline-none transition-colors"
                            placeholder="Describe what you want the interviewer to focus on..."
                            value={bookingData.notes}
                            onChange={e => setBookingData({ ...bookingData, notes: e.target.value })}
                        />
                    </div>

                    <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800 flex justify-between items-center text-xs">
                        <span className="text-slate-500 dark:text-slate-400">Interviewer Rate:</span>
                        <span className="text-slate-900 dark:text-white font-extrabold text-lg">${(selectedInterviewer as any)?.profile?.hourlyRate || '50'} <span className="text-xs text-slate-400 font-normal">/hr</span></span>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="ghost" onClick={() => setIsMessageOpen(false)}>Cancel</Button>
                        <Button onClick={handleHire}>Send Request</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title="Freelancer Profile">
                {selectedInterviewer && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                            <img src={selectedInterviewer.profilePicture || DEFAULT_AVATAR} className="w-20 h-20 rounded-2xl object-cover border border-slate-200 dark:border-slate-700" alt="profile" />
                            <div>
                                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">{selectedInterviewer.name}</h3>
                                <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">{(selectedInterviewer as any).profile?.headline || 'Professional Interviewer'}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 p-4 rounded-xl">
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Hourly Rate</p>
                                <p className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-1">
                                    <DollarSign size={16} className="text-emerald-500" />
                                    {(selectedInterviewer as any).profile?.hourlyRate || '50'}/hr
                                </p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 p-4 rounded-xl">
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Experience</p>
                                <p className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-1">
                                    <Clock size={16} className="text-blue-500" />
                                    {(selectedInterviewer as any).profile?.yearsOfExperience || '5+'} Years
                                </p>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">About</h4>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
                                {(selectedInterviewer as any).profile?.bio || "This freelancer hasn't added a biography yet, but they have been vetted by our team to conduct high-quality technical interviews."}
                            </p>
                        </div>

                        <div>
                            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Skills & Technologies</h4>
                            <div className="flex flex-wrap gap-2">
                                {(selectedInterviewer as any).profile?.skills && (selectedInterviewer as any).profile.skills.length > 0 ? (
                                    (selectedInterviewer as any).profile.skills.map((skill: string, idx: number) => (
                                        <Badge key={idx} variant="neutral">{skill}</Badge>
                                    ))
                                ) : (
                                    <span className="text-xs text-slate-400">No skills listed</span>
                                )}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Availability</h4>
                            <div className="flex flex-wrap gap-2">
                                {(selectedInterviewer as any).profile?.availability && (selectedInterviewer as any).profile.availability.length > 0 ? (
                                    (selectedInterviewer as any).profile.availability.map((av: string, idx: number) => (
                                        <Badge key={idx} variant="neutral">{av}</Badge>
                                    ))
                                ) : (
                                    <span className="text-sm text-neutral-500">Flexible</span>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-neutral-800">
                            <Button onClick={() => {
                                setIsDetailsOpen(false);
                                setIsMessageOpen(true);
                            }}>
                                Hire {selectedInterviewer.name.split(' ')[0]}
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export const ServiceMarketplace: React.FC = () => {
    const [marketplaceMode, setMarketplaceMode] = useState<'delegation' | 'single'>('delegation');
    const [services, setServices] = useState<FreelancerService[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [skillFilter, setSkillFilter] = useState('');
    const [maxPrice, setMaxPrice] = useState(500);

    // Profile View modal
    const [viewProfileId, setViewProfileId] = useState<string | null>(null);

    // Delegation modal
    const [selected, setSelected] = useState<FreelancerService | null>(null);
    const [jobs, setJobs] = useState<any[]>([]);
    const [selectedJobId, setSelectedJobId] = useState('');
    const [delegationLoading, setDelegationLoading] = useState(false);

    const fetchServices = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (skillFilter.trim()) params.append('skill', skillFilter.trim());
            if (maxPrice < 500) params.append('maxPrice', maxPrice.toString());
            const data = await apiRequest(`/recruiter/services?${params.toString()}`);
            setServices(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
        apiRequest('/jobs/my-jobs').then(setJobs).catch(console.error);
    }, []);

    // Filter to only show Active jobs that haven't been delegated yet
    const availableJobs = jobs.filter(j => j.status === 'Active' && (!j.delegationStatus || j.delegationStatus === 'none'));

    const handleDelegate = async () => {
        if (!selected) return;
        if (!selectedJobId) {
            alert('Please select a job to delegate.');
            return;
        }

        setDelegationLoading(true);
        try {
            await apiRequest(`/jobs/${selectedJobId}/delegate`, 'POST', {
                freelancerId: selected.freelancerId._id,
            });
            alert('✅ Delegation request sent to freelancer!');
            setSelected(null);
            setSelectedJobId('');
            // Refresh jobs to update delegation status
            apiRequest('/jobs/my-jobs').then(setJobs).catch(console.error);
        } catch (err: any) {
            alert(err.message || 'Failed to delegate job.');
        } finally {
            setDelegationLoading(false);
        }
    };

    const renderStars = (rating: number = 0) => {
        const full = Math.floor(rating);
        return Array.from({ length: 5 }, (_, i) => (
            <Star key={i} size={12} className={i < full ? 'text-yellow-400 fill-yellow-400' : 'text-neutral-600'} />
        ));
    };

    // Find the selected job object for the summary preview
    const selectedJob = jobs.find(j => (j._id || j.id) === selectedJobId);

    return (
        <div className="space-y-6">
            {/* Header & Segmented Mode Switcher */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Interviewer & Freelancer Marketplace</h2>
                    <p className="text-neutral-400 text-sm mt-1">
                        {marketplaceMode === 'delegation'
                            ? "Delegate your hiring pipeline to expert freelancers — they'll find the perfect candidate for you."
                            : 'Browse verified technical interviewers and book a single interview session.'}
                    </p>
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700/60 self-start md:self-auto">
                    <button
                        type="button"
                        onClick={() => setMarketplaceMode('delegation')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                            marketplaceMode === 'delegation'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        Delegate Job Pipeline
                    </button>
                    <button
                        type="button"
                        onClick={() => setMarketplaceMode('single')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                            marketplaceMode === 'single'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        Book Single Interview
                    </button>
                </div>
            </div>

            {marketplaceMode === 'single' ? (
                <FindInterviewers />
            ) : (
                <>

            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm p-5 items-end">
                <div className="flex-1">
                    <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Filter by Skill</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-neutral-500 w-4 h-4 pointer-events-none" />
                        <input
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none transition-colors"
                            placeholder="e.g. React, System Design, Node.js"
                            value={skillFilter}
                            onChange={e => setSkillFilter(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && fetchServices()}
                        />
                    </div>
                </div>
                <div className="w-full md:w-72">
                    <div className="flex justify-between mb-2">
                        <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Max Price</label>
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{maxPrice >= 500 ? 'Any' : `$${maxPrice}`}</span>
                    </div>
                    <input type="range" min="20" max="500" step="10" value={maxPrice}
                        onChange={e => setMaxPrice(Number(e.target.value))}
                        className="w-full accent-blue-600" />
                </div>
                <Button onClick={fetchServices} className="h-[42px] px-8">Search</Button>
            </div>

            {/* Results count */}
            {!loading && (
                <p className="text-sm text-neutral-500">{services.length} service{services.length !== 1 ? 's' : ''} available</p>
            )}

            {/* Service Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-64 bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm animate-pulse" />
                    ))}
                </div>
            ) : services.length === 0 ? (
                <div className="text-center py-20 border border-neutral-800 rounded-xl">
                    <Briefcase size={48} className="text-neutral-700 mx-auto mb-4" />
                    <p className="text-neutral-500 text-lg font-medium">No services found</p>
                    <p className="text-neutral-600 text-sm mt-1">Try adjusting your skill filter or price range</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {services.map(svc => (
                        <div key={svc._id}
                            className="group flex flex-col bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden hover:border-blue-500/50 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/10"
                        >
                            {/* Freelancer header */}
                            <div className="p-5 border-b border-neutral-800/70 flex items-center gap-3">
                                <img
                                    src={svc.freelancerId.profilePicture || DEFAULT_AVATAR}
                                    alt={svc.freelancerId.name}
                                    className="w-11 h-11 rounded-full object-cover border-2 border-blue-500/30"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{svc.freelancerId.name}</p>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        {renderStars(svc.freelancerId.averageRating)}
                                        <span className="text-xs text-neutral-500 ml-1">
                                            {svc.freelancerId.averageRating?.toFixed(1) || 'New'}
                                        </span>
                                    </div>
                                    <button 
                                        onClick={() => setViewProfileId(svc.freelancerId._id)}
                                        className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline mt-1 text-left cursor-pointer"
                                    >
                                        View Profile
                                    </button>
                                </div>
                                <Badge variant="neutral" className="text-[10px] px-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200/80 dark:border-blue-800/60">
                                    {svc.durationMinutes} min
                                </Badge>
                            </div>

                            {/* Service body */}
                            <div className="flex-1 p-5 space-y-3">
                                <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug line-clamp-2 group-hover:text-blue-600 dark:text-blue-400 transition-colors">
                                    {svc.title}
                                </h3>
                                <p className="text-sm text-neutral-400 line-clamp-2 leading-relaxed">
                                    {svc.description}
                                </p>
                                {svc.skills.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {svc.skills.slice(0, 4).map((sk, i) => (
                                            <span key={i} className="text-[10px] px-2 py-0.5 bg-neutral-800 text-neutral-300 rounded-full border border-neutral-700">
                                                {sk}
                                            </span>
                                        ))}
                                        {svc.skills.length > 4 && (
                                            <span className="text-[10px] px-2 py-0.5 bg-neutral-800 text-neutral-500 rounded-full">
                                                +{svc.skills.length - 4}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Footer: price + CTA */}
                            <div className="p-5 pt-0 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-2xl font-black text-slate-900 dark:text-white">${svc.price}</span>
                                        <span className="text-xs text-neutral-500 ml-1">/ project</span>
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={() => { 
                                            setSelected(svc); 
                                            setSelectedJobId('');
                                        }}
                                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                                    >
                                        <Send size={14} className="mr-1.5" />
                                        Delegate Job
                                    </Button>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-blue-500"
                                    onClick={() => window.location.href = `#/recruiter/messages?userId=${svc.freelancerId._id}`}
                                >
                                    <MessageSquare size={14} className="mr-1.5" />
                                    Message Interviewer
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Delegation Modal ─────────────────────────────────────────────── */}
            <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Delegate Job Pipeline">
                {selected && (
                    <div className="space-y-5">
                        {/* Freelancer summary */}
                        <div className="flex items-center gap-3 p-4 bg-neutral-900 rounded-xl border border-neutral-800">
                            <img
                                src={selected.freelancerId.profilePicture || DEFAULT_AVATAR}
                                className="w-12 h-12 rounded-full object-cover border-2 border-blue-500/30"
                                alt={selected.freelancerId.name}
                            />
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-white">{selected.freelancerId.name}</p>
                                <p className="text-xs text-neutral-400 truncate">{selected.title}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <p className="text-xl font-black text-white">${selected.price}</p>
                                <p className="text-[10px] text-neutral-500">per project</p>
                            </div>
                        </div>

                        {/* Visual Delegation Flow */}
                        <div className="flex items-center justify-center gap-3 py-3 px-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-200/60 dark:border-blue-800/40">
                            <div className="flex flex-col items-center gap-1">
                                <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                                    <Briefcase size={16} className="text-blue-600 dark:text-blue-400" />
                                </div>
                                <span className="text-[10px] text-neutral-400 font-medium">You</span>
                            </div>
                            <ArrowRight size={18} className="text-blue-500/60 flex-shrink-0" />
                            <div className="flex flex-col items-center gap-1">
                                <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                                    <User size={16} className="text-blue-600 dark:text-blue-400" />
                                </div>
                                <span className="text-[10px] text-neutral-400 font-medium">Freelancer</span>
                            </div>
                            <ArrowRight size={18} className="text-blue-500/60 flex-shrink-0" />
                            <div className="flex flex-col items-center gap-1">
                                <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                    <Sparkles size={16} className="text-emerald-400" />
                                </div>
                                <span className="text-[10px] text-neutral-400 font-medium">Hire</span>
                            </div>
                        </div>

                        {/* Job Selector */}
                        <div>
                            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                                Select Job Pipeline <span className="text-red-400">*</span>
                            </label>
                            <select
                                id="delegation-job-select"
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 transition-colors"
                                value={selectedJobId}
                                onChange={e => setSelectedJobId(e.target.value)}
                            >
                                <option value="">Choose a job to delegate...</option>
                                {availableJobs.map(j => (
                                    <option key={j._id || j.id} value={j._id || j.id}>
                                        {j.title} — {j.company} ({j.applicantCount ?? 0} applicants)
                                    </option>
                                ))}
                            </select>
                            {availableJobs.length === 0 && (
                                <p className="text-xs text-amber-400/80 mt-1.5 flex items-center gap-1">
                                    <AlertTriangle size={12} />
                                    No active jobs available for delegation. Create a job first.
                                </p>
                            )}
                        </div>

                        {/* Selected Job Summary */}
                        {selectedJob && (
                            <div className="p-3.5 bg-neutral-900/80 rounded-xl border border-neutral-800 space-y-2">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-white">{selectedJob.title}</p>
                                        <p className="text-xs text-neutral-400 mt-0.5">{selectedJob.company} · {selectedJob.location}</p>
                                    </div>
                                    <Badge variant="neutral" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                                        {selectedJob.type}
                                    </Badge>
                                </div>
                                {selectedJob.skills?.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {selectedJob.skills.slice(0, 5).map((sk: string, i: number) => (
                                            <span key={i} className="text-[10px] px-1.5 py-0.5 bg-neutral-800 text-neutral-400 rounded-full">
                                                {sk}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Info Callout */}
                        <div className="flex gap-3 p-3.5 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl border border-blue-200/60 dark:border-blue-800/50">
                            <Shield size={18} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-neutral-300 leading-relaxed">
                                By delegating this job, this freelancer will manage the candidate pipeline, 
                                conduct interviews, and propose a final hire for your approval. You retain 
                                full control and can revoke delegation at any time.
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-1 border-t border-neutral-800">
                            <Button variant="ghost" onClick={() => setSelected(null)}>Cancel</Button>
                            <Button
                                onClick={handleDelegate}
                                disabled={delegationLoading || !selectedJobId}
                                className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 shadow-sm"
                            >
                                {delegationLoading ? (
                                    'Sending...'
                                ) : (
                                    <>
                                        <Send size={14} className="mr-1.5" />
                                        Send Delegation Request
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Public Profile View Modal */}
            <FreelancerPublicProfileModal 
                freelancerId={viewProfileId} 
                onClose={() => setViewProfileId(null)} 
            />
            </>
            )}
        </div>
    );
};

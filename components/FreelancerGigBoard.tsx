import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from './UI';
import { Briefcase, Calendar, MapPin, Search } from 'lucide-react';
import { apiRequest } from '../utils/api';
import { useToast } from './Toast';
import { DEFAULT_AVATAR } from '../utils/defaultAvatar';

interface Gig {
    _id: string;
    recruiterId: { _id: string; name: string; companyName: string; profilePicture?: string };
    jobId: { _id: string; title: string; company: string; location: string };
    candidateId: { _id: string; name: string };
    requiredSkills: string[];
    proposedDate: string;
    notes?: string;
    status: string;
}

export const FreelancerGigBoard: React.FC = () => {
    const [gigs, setGigs] = useState<Gig[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { addToast, ToastContainer } = useToast();

    useEffect(() => {
        fetchGigs();
    }, []);

    const fetchGigs = async () => {
        try {
            setLoading(true);
            const data = await apiRequest('/freelancers/gigs/open');
            setGigs(data);
        } catch (error: any) {
            addToast('error', error.message || 'Failed to open gigs.');
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptGig = async (gigId: string) => {
        try {
            await apiRequest(`/freelancers/gigs/accept/${gigId}`, 'POST');
            addToast('success', 'Gig accepted perfectly! Check your upcoming interviews.');
            setGigs(gigs.filter(g => g._id !== gigId));
        } catch (error: any) {
            addToast('error', error.message || 'Failed to accept gig.');
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const filteredGigs = gigs.filter(g =>
        g.jobId?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.recruiterId?.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (g.requiredSkills || []).some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            <ToastContainer />
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Open Gigs</h2>
                    <p className="text-slate-500 dark:text-neutral-400">Find and accept interview requests from top companies.</p>
                </div>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-3 text-neutral-500 w-5 h-5 pointer-events-none" />
                <input
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 transition-all outline-none"
                    placeholder="Search gigs by title, company, or skills..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-3 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : filteredGigs.length === 0 ? (
                <Card className="text-center py-16 opacity-70">
                    <Briefcase size={40} className="text-neutral-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-700 dark:text-neutral-300">No open gigs right now</h3>
                    <p className="text-slate-500 dark:text-neutral-500 max-w-sm mx-auto mt-2">Check back later for new interview requests from recruiters.</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                    {filteredGigs.map((gig) => (
                        <Card key={gig._id} className="flex flex-col gap-4 group hover:border-blue-500/30 transition-all">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <img
                                        src={gig.recruiterId?.profilePicture || DEFAULT_AVATAR}
                                        alt="Company"
                                        className="w-12 h-12 rounded-lg bg-neutral-800 object-cover border border-slate-200 dark:border-neutral-800"
                                    />
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-tight">{gig.jobId?.title || 'General Interview'}</h3>
                                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-neutral-400 mt-1">
                                            <span className="font-medium text-blue-600 dark:text-blue-400">{gig.recruiterId?.companyName || gig.recruiterId?.name}</span>
                                            {gig.jobId?.location && (
                                                <>
                                                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-neutral-700"></span>
                                                    <span className="flex items-center gap-1"><MapPin size={12} /> {gig.jobId.location}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <Badge variant="info">Open</Badge>
                            </div>

                            <div className="bg-slate-50 dark:bg-black/30 p-3 rounded-lg border border-slate-200 dark:border-neutral-800/50">
                                <div className="flex items-center gap-2 text-slate-700 dark:text-neutral-300 text-sm mb-2">
                                    <Calendar size={14} className="text-blue-600 dark:text-blue-400" />
                                    <span>Proposed Time: <strong>{formatDate(gig.proposedDate)}</strong></span>
                                </div>
                                {gig.notes && (
                                    <p className="text-xs text-slate-500 dark:text-neutral-500 italic line-clamp-2">"{gig.notes}"</p>
                                )}
                            </div>

                            <div>
                                <h4 className="text-xs font-semibold text-slate-500 dark:text-neutral-500 mb-2 uppercase tracking-wider">Required Technical Skills</h4>
                                <div className="flex flex-wrap gap-2">
                                    {gig.requiredSkills?.length > 0 ? gig.requiredSkills.map((skill, idx) => (
                                        <span key={idx} className="text-xs bg-slate-100 dark:bg-neutral-800/80 border border-slate-200 dark:border-neutral-700/50 px-2 py-1 rounded text-slate-700 dark:text-neutral-300">
                                            {skill}
                                        </span>
                                    )) : (
                                        <span className="text-xs text-slate-400 dark:text-neutral-500">None specified</span>
                                    )}
                                </div>
                            </div>

                            <div className="mt-auto pt-4 border-t border-slate-200 dark:border-neutral-800/50 flex gap-3">
                                <Button
                                    className="w-full flex-1 font-semibold"
                                    onClick={() => handleAcceptGig(gig._id)}
                                >
                                    Accept Gig
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FreelancerGigBoard;

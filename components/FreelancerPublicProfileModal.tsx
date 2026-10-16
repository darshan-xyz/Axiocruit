import React, { useEffect, useState } from 'react';
import { Modal, Badge } from './UI';
import { apiRequest } from '../utils/api';
import { Briefcase, Link as LinkIcon, Star, Calendar } from 'lucide-react';
import { DEFAULT_AVATAR } from '../utils/defaultAvatar';

interface Experience {
    title?: string;
    designation?: string;
    company: string;
    startDate?: string;
    from?: string;
    endDate?: string;
    to?: string;
    description?: string;
    work?: string;
}

interface Project {
    title: string;
    role: string;
    link: string;
    description: string;
}

export const FreelancerPublicProfileModal: React.FC<{
    freelancerId: string | null;
    onClose: () => void;
}> = ({ freelancerId, onClose }) => {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!freelancerId) return;
        
        const fetchProfile = async () => {
            setLoading(true);
            setError('');
            try {
                const data = await apiRequest(`/recruiter/freelancers/${freelancerId}`);
                setProfile(data);
            } catch (err: any) {
                setError(err.message || 'Failed to load profile');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [freelancerId]);

    const renderStars = (rating: number = 0) => {
        const full = Math.floor(rating);
        return Array.from({ length: 5 }, (_, i) => (
            <Star key={i} size={14} className={i < full ? 'text-yellow-400 fill-yellow-400' : 'text-neutral-600'} />
        ));
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Present';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    return (
        <Modal isOpen={!!freelancerId} onClose={onClose} title="Freelancer Profile" size="xl">
            {loading ? (
                <div className="flex justify-center py-10">
                    <div className="w-8 h-8 border-3 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : error ? (
                <div className="py-10 text-center text-red-400">
                    <p>{error}</p>
                </div>
            ) : profile ? (
                <div className="space-y-8 pb-4">
                    {/* Header */}
                    <div className="flex items-center gap-5">
                        <img 
                            src={profile.profilePicture || DEFAULT_AVATAR} 
                            alt={profile.name}
                            className="w-20 h-20 rounded-full border-4 border-slate-300 dark:border-slate-700 object-cover"
                        />
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-1">{profile.name}</h2>
                            <div className="flex items-center gap-3 text-sm text-neutral-400">
                                {profile.hourlyRate && <span className="font-semibold text-green-400">${profile.hourlyRate}/hr</span>}
                                {profile.hourlyRate && <span>•</span>}
                                <div className="flex items-center gap-1">
                                    {renderStars(profile.averageRating)}
                                    <span className="ml-1">{profile.averageRating?.toFixed(1) || '0.0'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bio */}
                    {profile.bio && (
                        <div>
                            <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-2">About</h3>
                            <p className="text-neutral-300 leading-relaxed text-sm bg-neutral-900/50 p-4 rounded-xl border border-slate-300 dark:border-slate-700">
                                {profile.bio}
                            </p>
                        </div>
                    )}

                    {/* Skills */}
                    {profile.skills && profile.skills.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-2">Technical Skills</h3>
                            <div className="flex flex-wrap gap-2">
                                {profile.skills.map((skill: string, i: number) => (
                                    <Badge key={i} variant="neutral" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/40 px-3 py-1 text-xs">
                                        {skill}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Work Experience */}
                    {profile.experience && profile.experience.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Briefcase size={16} /> Work Experience
                            </h3>
                            <div className="space-y-4">
                                {profile.experience.map((exp: Experience, idx: number) => (
                                    <div key={idx} className="relative pl-6 border-l-2 border-slate-300 dark:border-slate-700">
                                        <div className="absolute w-3 h-3 bg-slate-400 dark:bg-slate-600 rounded-full -left-[7px] top-1.5 border-2 border-white dark:border-[#121212]"></div>
                                        <h4 className="text-white font-semibold text-base">{exp.designation || exp.title}</h4>
                                        <div className="flex items-center gap-2 text-sm text-neutral-400 mt-1 mb-2">
                                             <span className="font-medium text-blue-600 dark:text-blue-400">{exp.company}</span>
                                             <span>•</span>
                                             <div className="flex items-center gap-1.5">
                                                 <Calendar size={13} />
                                                 {formatDate(exp.from || exp.startDate)} — {formatDate(exp.to || exp.endDate)}
                                             </div>
                                         </div>
                                         {(exp.work || exp.description) && (
                                             <p className="text-sm text-neutral-500 leading-relaxed">{exp.work || exp.description}</p>
                                         )}
                                     </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Projects */}
                    {profile.projects && profile.projects.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <LinkIcon size={16} /> Notable Projects
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {profile.projects.map((proj: Project, idx: number) => (
                                    <div key={idx} className="bg-neutral-900 border border-slate-300 dark:border-slate-700 p-4 rounded-xl">
                                        <h4 className="text-white font-semibold mb-1 truncate">{proj.title}</h4>
                                        <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">{proj.role}</p>
                                        {proj.description && (
                                            <p className="text-xs text-neutral-400 mb-3 line-clamp-2">{proj.description}</p>
                                        )}
                                        {proj.link && (
                                            <a href={proj.link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline flex items-center gap-1">
                                                <LinkIcon size={10} /> View Project
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            ) : null}
        </Modal>
    );
};

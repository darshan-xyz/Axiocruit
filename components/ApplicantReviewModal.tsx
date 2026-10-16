import React, { useState } from 'react';
import { Modal, Button, Badge } from './UI';
import { User, Briefcase, GraduationCap, FileText, Download, BarChart2, Video, MessageSquare, Code2 } from 'lucide-react';
import { DEFAULT_AVATAR } from '../utils/defaultAvatar';

interface ApplicantReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    application: any;
    onStatusUpdate: (id: string, status: string) => void;
    onSchedule: () => void;
    onMessage: () => void;
    onProposeHire?: () => void;
}

export const ApplicantReviewModal: React.FC<ApplicantReviewModalProps> = ({
    isOpen, onClose, application, onStatusUpdate, onSchedule, onMessage, onProposeHire
}) => {
    const [activeTab, setActiveTab] = useState<'summary' | 'experience' | 'education'>('summary');

    if (!application) return null;

    // Helper to get consistent data (Snapshot vs Live Profile)
    const getCandidateData = (app: any) => {
        const profile = app?.candidate?.profile || {};
        return {
            name: app?.candidate?.name || 'Unknown Candidate',
            profilePicture: app?.candidate?.profilePicture,
            headline: profile?.headline || app?.candidate?.headline || 'Candidate',
            bio: profile?.bio,
            skills: app?.skills?.length > 0 ? app.skills : (profile?.skills || app?.candidate?.skills || []),
            experience: app?.experience?.length > 0 ? app.experience : (profile?.experience || app?.candidate?.experience || []),
            education: app?.education?.length > 0 ? app.education : (profile?.education || app?.candidate?.education || []),
            resume: app?.resume || profile?.resume || app?.candidate?.resumeUrl
        };
    };

    const data = getCandidateData(application);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Application Review" maxWidth="max-w-4xl">
            <div className="flex flex-col h-full max-h-[80vh]">

                {/* Header Section */}
                <div className="flex items-start gap-6 border-b border-slate-300 dark:border-slate-700 pb-6 mb-6">
                    <img
                        src={data.profilePicture || DEFAULT_AVATAR}
                        className="w-24 h-24 rounded-xl object-cover border-2 border-slate-300 dark:border-slate-700"
                        alt="profile"
                    />
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-bold mb-1 text-white">{data.name}</h2>
                                <p className="text-blue-600 dark:text-blue-400 font-medium mb-2">{data.headline}</p>
                                <p className="text-sm text-neutral-500">Applied for <span className="text-white font-medium">{application?.job?.title || 'Position'}</span></p>
                            </div>
                            <div className="flex flex-col items-end gap-3">
                                <select
                                    className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-colors"
                                    value={application?.status || 'Applied'}
                                    onChange={(e) => onStatusUpdate(application?._id, e.target.value)}
                                >
                                    <option value="Applied">Applied</option>
                                    <option value="Screening">Screening</option>
                                    <option value="Interview">Interview</option>
                                    <option value="Offer">Offer</option>
                                    <option value="Rejected">Rejected</option>
                                </select>
                                {data.resume && (
                                    <a
                                        href={data.resume}
                                        target="_blank"
                                        rel="noreferrer" // Security best practice
                                        className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-white transition-colors"
                                    >
                                        <Download className="w-4 h-4 mr-1.5" /> Download Resume
                                    </a>
                                )}
                                <Button
                                    variant="outline"
                                    className="w-full justify-center border-slate-300 dark:border-slate-600 text-neutral-300 hover:text-white"
                                    onClick={() => {
                                        const jobId = application?.job?._id || application?.job || '';
                                        const candidateId = application?.candidate?._id || application?.candidate || application?._id || '';
                                        window.open(`#/recruiter/coding-test-result/${jobId}/candidate/${candidateId}`, '_blank');
                                    }}
                                >
                                    <Code2 className="w-4 h-4 mr-2" />
                                    Coding Test Results
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="flex border-b border-slate-300 dark:border-slate-700 mb-6">
                    <button
                        className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'summary' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-neutral-400 hover:text-white'}`}
                        onClick={() => setActiveTab('summary')}
                    >
                        Summary
                    </button>
                    <button
                        className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'experience' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-neutral-400 hover:text-white'}`}
                        onClick={() => setActiveTab('experience')}
                    >
                        Experience
                    </button>
                    <button
                        className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'education' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-neutral-400 hover:text-white'}`}
                        onClick={() => setActiveTab('education')}
                    >
                        Education
                    </button>
                </div>

                {/* Tabs Content - Scrollable Area */}
                <div className="flex-1 overflow-y-auto pr-2 space-y-6">

                    {activeTab === 'summary' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div>
                                <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-white"><User size={18} className="text-blue-600 dark:text-blue-400" /> About</h3>
                                <p className="text-neutral-300 leading-relaxed text-sm bg-neutral-900/50 p-4 rounded-lg border border-slate-300 dark:border-slate-700">
                                    {data.bio || "No bio provided."}
                                </p>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-white"><BarChart2 size={18} className="text-blue-600 dark:text-blue-400" /> Skills</h3>
                                <div className="flex flex-wrap gap-2">
                                    {data.skills?.map((skill: string, idx: number) => (
                                        <Badge key={idx} variant="neutral" className="bg-neutral-800 border-slate-300 dark:border-slate-600 text-neutral-300">{skill}</Badge>
                                    )) || <p className="text-sm text-neutral-500">No skills listed.</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'experience' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="space-y-4">
                                {data.experience?.map((exp: any, idx: number) => (
                                    <div key={idx} className="relative pl-6 border-l-2 border-slate-300 dark:border-slate-700 hover:border-blue-500 transition-colors pb-6 last:pb-0">
                                        <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-black border-2 border-slate-400 dark:border-slate-600 group-hover:border-blue-500 transition-colors"></div>
                                        <h4 className="font-bold text-white text-lg">{exp.designation}</h4>
                                        <p className="text-blue-600 dark:text-blue-400 font-medium mb-1">{exp.company}</p>
                                        <p className="text-xs text-neutral-500 mb-2 flex items-center gap-1">
                                            <Briefcase size={12} /> {exp.from} - {exp.to || 'Present'}
                                        </p>
                                        {exp.work && <p className="text-sm text-neutral-400 mt-2">{exp.work}</p>}
                                    </div>
                                )) || <p className="text-sm text-neutral-500 italic">No experience added.</p>}
                            </div>
                        </div>
                    )}

                    {activeTab === 'education' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="grid gap-4">
                                {data.education?.map((edu: any, idx: number) => (
                                    <div key={idx} className="bg-neutral-900/30 border border-slate-300 dark:border-slate-700 p-4 rounded-lg flex items-start gap-4">
                                        <div className="p-3 bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400">
                                            <GraduationCap size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white text-lg">{edu.institution}</h4>
                                            <p className="text-blue-600 dark:text-blue-400 font-medium">{edu.degree}</p>
                                            <p className="text-sm text-neutral-400 mt-1">{edu.fieldOfStudy}</p>
                                            <p className="text-xs text-neutral-500 mt-2">{edu.from} - {edu.to || 'Present'}</p>
                                        </div>
                                    </div>
                                )) || <p className="text-sm text-neutral-500 italic">No education added.</p>}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer / Actions */}
                <div className="flex gap-3 pt-6 mt-2 border-t border-slate-300 dark:border-slate-700">
                    <Button className="flex-1" icon={Video} onClick={onSchedule}>Schedule Interview</Button>
                    <Button variant="outline" className="flex-1 border-slate-300 dark:border-slate-600" icon={MessageSquare} onClick={onMessage}>Send Message</Button>
                    {onProposeHire && (
                        <Button className="bg-[#FFD700]/20 text-[#FFD700] hover:bg-[#FFD700]/30 border border-[#FFD700]/50" onClick={onProposeHire}>
                            ⭐ Propose as Final Hire
                        </Button>
                    )}
                    <Button variant="outline" className="border-red-800 dark:border-red-900/60 text-red-400 hover:bg-red-900/20 hover:border-red-900" onClick={() => onStatusUpdate(application?._id, 'Rejected')}>Reject</Button>
                </div>
            </div>
        </Modal>
    );
};

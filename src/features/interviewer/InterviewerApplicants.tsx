import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Badge, Modal } from '@/components/UI';
import { Search } from 'lucide-react';
import { apiRequest } from '@/utils/api';
import { ApplicantReviewModal } from '@/components/ApplicantReviewModal';
import { DEFAULT_AVATAR } from '@/utils/defaultAvatar';

export const InterviewerApplicants: React.FC = () => {
    const [selectedApp, setSelectedApp] = useState<any | null>(null);
    const [applications, setApplications] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    // Modals
    const [isScheduleOpen, setIsScheduleOpen] = useState(false);
    const [isMessageOpen, setIsMessageOpen] = useState(false);

    // Modal Forms
    const [scheduleData, setScheduleData] = useState({ date: '', time: '' });
    const [messageData, setMessageData] = useState({ content: '' });

    const fetchApplications = async () => {
        try {
            const data = await apiRequest('/jobs/applications/received');
            setApplications(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch applications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApplications();
    }, []);

    const handleStatusUpdate = async (id: string, status: string) => {
        try {
            await apiRequest(`/jobs/applications/${id}/status`, 'PUT', { status });
            // Update local state
            setApplications(applications.map(app => app._id === id ? { ...app, status } : app));
            if (selectedApp && selectedApp._id === id) {
                setSelectedApp({ ...selectedApp, status });
            }
        } catch (error) {
            alert('Failed to update status. You may not have authorization for this pipeline.');
        }
    };

    const handleSchedule = async () => {
        if (!selectedApp || !scheduleData.date || !scheduleData.time) {
            alert("Please provide Date and Time.");
            return;
        }

        const now = new Date();
        const todayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
        const currentTimeStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

        if (scheduleData.date < todayStr || (scheduleData.date === todayStr && scheduleData.time < currentTimeStr)) {
            alert("Please select a valid future date and time.");
            return;
        }

        try {
            const scheduledTime = new Date(`${scheduleData.date}T${scheduleData.time}`).toISOString();
            const candidateId = selectedApp.candidate?._id || selectedApp.candidate;
            const jobId = selectedApp.job?._id || selectedApp.job;
            await apiRequest('/interviews/schedule', 'POST', {
                candidateId,
                jobId,
                scheduledTime
            });
            alert('Interview scheduled!');
            await handleStatusUpdate(selectedApp._id, 'Interview');
            setIsScheduleOpen(false);
        } catch (error) {
            alert('Failed to schedule');
        }
    };

    const handleSendMessage = async () => {
        const receiverId = selectedApp?.candidate?._id || selectedApp?.candidate;
        if (!selectedApp || !receiverId) return;
        try {
            await apiRequest('/interviews/message', 'POST', {
                receiverId,
                content: messageData.content
            });
            alert('Message sent!');
            setIsMessageOpen(false);
        } catch (error) {
            alert('Failed to send message');
        }
    };

    const handleProposeHire = async () => {
        if (!selectedApp) return;
        if (!confirm('Are you sure? This will lock the pipeline and send this candidate to the recruiter for final approval.')) return;
        
        const notes = prompt("Enter your final assessment notes for the Recruiter (optional):") || '';

        const aiReportData = {
            aiEvaluation: selectedApp.aiInterviewReport || selectedApp.aiEvaluation || selectedApp.interviewReport || selectedApp.aiReport || {},
            codingTestResults: selectedApp.codingTestResults || null,
            fullAnalysis: selectedApp.aiAnalysis || null
        };

        const jobId = selectedApp.job?._id || selectedApp.job;
        const candidateId = selectedApp.candidate?._id || selectedApp.candidate;

        try {
            await apiRequest(`/freelancers/delegations/${jobId}/propose/${candidateId}`, 'POST', {
                finalNotes: notes,
                aiReportData: aiReportData
            });
            alert('🎉 Candidate successfully proposed to Recruiter! Your pipeline mission is complete.');
            window.location.hash = '#/interviewer';
        } catch (error: any) {
            alert(error.message || 'Failed to propose candidate');
        }
    };

    // Helper to get consistent data safely
    const getCandidateData = (app: any) => {
        const candidate = app.candidate || {};
        const profile = candidate.profile || {};
        return {
            name: candidate.name || 'Candidate',
            profilePicture: candidate.profilePicture,
            headline: profile.headline || candidate.headline || 'Candidate',
            bio: profile.bio,
            skills: app.skills?.length > 0 ? app.skills : (profile.skills || candidate.skills || []),
            experience: app.experience?.length > 0 ? app.experience : (profile.experience || candidate.experience || []),
            education: app.education?.length > 0 ? app.education : (profile.education || candidate.education || []),
            resume: app.resume || profile.resume || candidate.resumeUrl
        };
    };

    const nowLocal = new Date();
    const minDateLocal = nowLocal.getFullYear() + '-' + String(nowLocal.getMonth() + 1).padStart(2, '0') + '-' + String(nowLocal.getDate()).padStart(2, '0');
    const minTimeLocal = scheduleData.date === minDateLocal ? String(nowLocal.getHours()).padStart(2, '0') + ':' + String(nowLocal.getMinutes()).padStart(2, '0') : undefined;

    const filteredApplications = applications.filter((app) => {
        if (!searchQuery.trim()) return true;
        const data = getCandidateData(app);
        const q = searchQuery.toLowerCase();
        const nameMatch = data.name.toLowerCase().includes(q);
        const headlineMatch = data.headline.toLowerCase().includes(q);
        const skillsMatch = Array.isArray(data.skills) && data.skills.some((s: string) => typeof s === 'string' && s.toLowerCase().includes(q));
        const jobMatch = (app.job?.title || '').toLowerCase().includes(q);
        return nameMatch || headlineMatch || skillsMatch || jobMatch;
    });

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">Manage Pipeline</h2>
                <p className="text-neutral-400 text-sm mt-1">
                    Review applicants and schedule interviews for the job pipelines you are managing.
                </p>
            </div>

            <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 text-neutral-500 w-5 h-5" />
                    <Input
                        placeholder="Search candidates by name, skills, headline, or job..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {loading ? <p>Loading pipeline...</p> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredApplications.length === 0 && (
                        <p className="text-neutral-500 col-span-3">
                            {searchQuery ? 'No applicants found matching your search.' : 'No applicants found for your delegated projects yet.'}
                        </p>
                    )}
                    {filteredApplications.map((app) => {
                        const data = getCandidateData(app);
                        const jobTitle = app.job?.title || 'Delegated Project';
                        return (
                            <Card key={app._id} className="flex flex-col gap-4 group hover:border-blue-500/50 cursor-pointer relative" onClick={() => setSelectedApp(app)}>
                                <div className="absolute top-4 right-4">
                                    <Badge variant={app.status === 'Applied' ? 'neutral' : app.status === 'Rejected' ? 'outline' : 'neutral'} className={app.status === 'Rejected' ? 'text-red-400 border-red-900' : 'text-blue-600 dark:text-blue-400'}>
                                        {app.status}
                                    </Badge>
                                </div>
                                <div className="flex items-start justify-between">
                                    <div className="flex gap-3">
                                        <img src={data.profilePicture || DEFAULT_AVATAR} className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700" alt="profile" />
                                        <div>
                                            <h3 className="font-extrabold text-slate-900 dark:text-white">{data.name}</h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{data.headline}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-xs text-neutral-500">
                                    Applied for <span className="text-slate-900 dark:text-white font-semibold">{jobTitle}</span>
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                    {data.skills?.slice(0, 3).map((s: string, idx: number) => (
                                        <span key={idx} className="text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md text-slate-700 dark:text-slate-300 font-medium">{s}</span>
                                    ))}
                                </div>
                                <Button size="sm" variant="outline" className="w-full mt-auto" onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedApp(app);
                                }}>Review Application</Button>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Candidate Profile Modal */}
            <ApplicantReviewModal
                isOpen={selectedApp !== null}
                onClose={() => setSelectedApp(null)}
                application={selectedApp}
                onStatusUpdate={handleStatusUpdate}
                onSchedule={() => setIsScheduleOpen(true)}
                onMessage={() => {
                    const candidateId = selectedApp?.candidate?._id;
                    if (candidateId) window.location.href = `#/interviewer/messages?userId=${candidateId}`;
                }}
                onProposeHire={handleProposeHire}
            />

            {/* Schedule Interview Modal */}
            <Modal isOpen={isScheduleOpen} onClose={() => setIsScheduleOpen(false)} title="Schedule Interview">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Date" type="date" min={minDateLocal} value={scheduleData.date} onChange={e => setScheduleData({ ...scheduleData, date: e.target.value })} />
                        <Input label="Time" type="time" min={minTimeLocal} value={scheduleData.time} onChange={e => setScheduleData({ ...scheduleData, time: e.target.value })} />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="ghost" onClick={() => setIsScheduleOpen(false)}>Cancel</Button>
                        <Button onClick={handleSchedule}>Confirm Schedule</Button>
                    </div>
                </div>
            </Modal>

            {/* Send Message Modal */}
            <Modal isOpen={isMessageOpen} onClose={() => setIsMessageOpen(false)} title="Send Message">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-neutral-400 mb-1.5">Message</label>
                        <textarea
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm h-32 focus:border-blue-500 outline-none transition-colors"
                            placeholder="Type your message to the candidate..."
                            value={messageData.content}
                            onChange={e => setMessageData({ content: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="ghost" onClick={() => setIsMessageOpen(false)}>Cancel</Button>
                        <Button onClick={handleSendMessage}>Send Message</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

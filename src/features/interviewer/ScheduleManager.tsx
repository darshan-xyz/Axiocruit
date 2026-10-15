import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from '@ui';
import { Calendar, Briefcase, Clock } from 'lucide-react';
import { apiRequest } from '@core/api';
import { Interview } from '@/types';
import InterviewsTab from '@/components/InterviewsTab';

export const InterviewerInterviews: React.FC = () => {
    return <InterviewsTab role="INTERVIEWER" />;
};

export const InterviewerRequests: React.FC = () => {
    const [interviews, setInterviews] = useState<Interview[]>([]);

    useEffect(() => {
        const fetchRequests = () => {
            apiRequest('/interviews/my-interviews')
                .then(data => {
                    const list = Array.isArray(data) ? data : [...(data?.activeInterviews || []), ...(data?.pastInterviews || [])];
                    setInterviews(list);
                })
                .catch(console.error);
        };
        fetchRequests();
    }, []);

    const pendingRequests = interviews.filter(i => i.status === 'Pending');

    return (
        <div className="w-full space-y-6">
            <h2 className="text-2xl font-bold">Booking Requests</h2>
            <p className="text-neutral-400">Review and respond to incoming interview requests from recruiters.</p>

            {pendingRequests.length === 0 ? (
                <Card className="text-center py-12">
                    <Calendar size={48} className="text-neutral-700 mx-auto mb-4" />
                    <p className="text-neutral-500 text-lg">No pending booking requests at this time.</p>
                </Card>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pendingRequests.map(inv => (
                        <Card key={inv._id} className="flex flex-col h-full border hover:border-blue-500/40 transition-all">
                            <div className="flex-1 space-y-4">
                                <div className="flex justify-between items-start">
                                    <Badge variant="warning">Pending Request</Badge>
                                    <span className="text-xs text-neutral-500">{new Date(inv.createdAt || Date.now()).toLocaleDateString()}</span>
                                </div>

                                <div>
                                    <h3 className="font-bold text-lg text-white mb-1">
                                        For: {(inv.candidateId as any)?.name || 'Unknown Candidate'}
                                    </h3>
                                    <p className="text-sm text-neutral-400 flex items-center gap-2">
                                        <Briefcase size={14} className="text-blue-600 dark:text-blue-400" />
                                        Requested by: {(inv.recruiterId as any)?.name || 'Unknown Recruiter'}
                                    </p>
                                </div>

                                <div className="p-3 bg-neutral-900 rounded-lg space-y-2">
                                    <p className="text-sm text-white flex items-center gap-2 font-medium">
                                        <Calendar size={14} className="text-blue-600 dark:text-blue-400" />
                                        {inv.scheduledTime ? new Date(inv.scheduledTime).toLocaleDateString() : 'TBD Date'}
                                    </p>
                                    <p className="text-sm text-white flex items-center gap-2 font-medium">
                                        <Clock size={14} className="text-blue-600 dark:text-blue-400" />
                                        {inv.scheduledTime ? new Date(inv.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD Time'}
                                    </p>
                                </div>

                                {inv.notes && (
                                    <div className="text-sm text-neutral-300 bg-neutral-800/50 p-3 rounded-lg border border-neutral-700">
                                        <span className="text-blue-600 dark:text-blue-400 font-bold block mb-1">Notes from Recruiter:</span>
                                        {inv.notes}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 mt-6 pt-4 border-t border-neutral-800">
                                <Button
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                    onClick={async () => {
                                        try {
                                            await apiRequest(`/freelancers/requests/${inv._id}/accept`, 'PUT');
                                            alert("Interview accepted!");
                                            apiRequest('/interviews/my-interviews').then(data => {
                                                setInterviews(Array.isArray(data) ? data : [...(data?.activeInterviews || []), ...(data?.pastInterviews || [])]);
                                            });
                                        } catch (e) { alert("Failed to accept"); }
                                    }}
                                >
                                    Accept
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1 border-red-900/50 text-red-500 hover:bg-red-900/20 hover:text-red-400"
                                    onClick={async () => {
                                        try {
                                            await apiRequest(`/freelancers/requests/${inv._id}/reject`, 'PUT');
                                            alert("Interview rejected");
                                            apiRequest('/interviews/my-interviews').then(data => {
                                                setInterviews(Array.isArray(data) ? data : [...(data?.activeInterviews || []), ...(data?.pastInterviews || [])]);
                                            });
                                        } catch (e) { alert("Failed to reject"); }
                                    }}
                                >
                                    Decline
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from '@/components/UI';
import { Briefcase, MessageSquare } from 'lucide-react';
import { apiRequest } from '@/utils/api';

export const CandidateApplicationsView: React.FC = () => {
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiRequest('/applications/my-applications')
            .then(data => setApplications(Array.isArray(data) ? data : []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="text-center p-8 text-slate-500">Loading applications...</div>;

    return (
        <div className="w-full space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">My Applications</h2>
            {applications.length === 0 ? (
                <div className="text-center p-12 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl">
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
                            <div className="mt-auto pt-4 border-t border-slate-300 dark:border-slate-700 flex justify-between items-center">
                                <span className="text-xs text-slate-400">Applied: {new Date(app.appliedAt).toLocaleDateString()}</span>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {app.job?.postedBy && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="px-3 py-1 text-xs hover:border-cobalt-500"
                                            onClick={() => window.location.href = `#/candidate/messages?userId=${app.job.postedBy._id || app.job.postedBy}`}
                                        >
                                            <MessageSquare size={12} className="mr-1 text-cobalt-600" />
                                            Message Recruiter
                                        </Button>
                                    )}
                                    {app.status === 'Pending AI' && (
                                        <Button
                                            size="sm"
                                            onClick={() => window.location.href = `#/coding-test/${app.job?._id || app.job}`}
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

export { CandidateApplicationsView as CandidateApplications };
export default CandidateApplicationsView;

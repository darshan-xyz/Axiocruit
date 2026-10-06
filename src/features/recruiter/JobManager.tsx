import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Badge } from '@ui';
import { Plus, MapPin, Clock, Sparkles } from 'lucide-react';
import { apiRequest } from '@core/api';
import { Job } from '@/types';

export const MyJobs: React.FC = () => {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreatingJob, setIsCreatingJob] = useState(false);

    useEffect(() => {
        if (!isCreatingJob) {
            setLoading(true);
            apiRequest('/jobs/my-jobs').then(setJobs).catch(console.error).finally(() => setLoading(false));
        }
    }, [isCreatingJob]);

    const toggleJobStatus = async (jobId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'Active' ? 'Closed' : 'Active';
        try {
            await apiRequest(`/jobs/${jobId}`, 'PUT', { status: newStatus });
            setJobs(prev => prev.map(j => j._id === jobId ? { ...j, status: newStatus } : j));
        } catch (err) {
            console.error('Failed to update job status:', err);
            alert('Failed to update job status');
        }
    };

    if (loading) return <div>Loading jobs...</div>;

    if (isCreatingJob) {
        return (
            <div className="space-y-4">
                <Button variant="ghost" onClick={() => setIsCreatingJob(false)} className="mb-4 text-neutral-400 hover:text-white">
                    ← Back to Jobs List
                </Button>
                <CreateJob onJobCreated={() => setIsCreatingJob(false)} onCancel={() => setIsCreatingJob(false)} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">My Job Postings</h2>
                <Button icon={Plus} onClick={() => setIsCreatingJob(true)}>Post New Job</Button>
            </div>

            {jobs.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <p className="text-slate-500 dark:text-slate-400 mb-4 text-sm font-medium">You haven't posted any jobs yet.</p>
                    <Button onClick={() => setIsCreatingJob(true)}>Create First Job</Button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {jobs.map(job => (
                        <Card key={job._id} className="flex justify-between items-center p-6 group hover:border-blue-500/50 transition-all">
                            <div>
                                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-1">{job.title}</h3>
                                <div className="flex gap-4 text-xs text-slate-500 dark:text-slate-400 items-center">
                                    <span className="flex items-center gap-1"><MapPin size={14} /> {job.location} | {job.type}</span>
                                    <span className="flex items-center gap-1"><Clock size={14} /> Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                                    <span className="bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/60 px-3 py-0.5 text-xs rounded-full font-extrabold ml-2">
                                        {job.applicantCount || 0} Applicants
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Badge variant={job.status === 'Active' ? 'completed' : 'outline'}>
                                    {job.status}
                                </Badge>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white"
                                    onClick={() => toggleJobStatus(job._id, job.status)}
                                >
                                    {job.status === 'Active' ? 'Close Job' : 'Reopen'}
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => window.location.href = `#/recruiter/ranked/${job._id}`}>
                                    <Sparkles className="w-4 h-4 mr-1.5 text-blue-500" />AI Rankings
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export const CreateJob: React.FC<{ onJobCreated?: () => void, onCancel?: () => void }> = ({ onJobCreated, onCancel }) => {
    const [formData, setFormData] = useState({
        title: '',
        location: '',
        type: 'Full-time',
        description: '',
        requirements: '',
        salary: '',
        company: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Fetch user profile to get company name
        apiRequest('/users/profile').then(user => {
            const orgName = user.organization?.name || user.companyName;
            if (orgName) {
                setFormData(prev => ({ ...prev, company: orgName }));
            }
        }).catch(err => console.error(err));
    }, []);

    const handleSubmit = async () => {
        if (!formData.title || !formData.location || !formData.company) {
            alert("Please fill in all required fields (and ensure your profile has a Company Name)");
            return;
        }

        setLoading(true);
        try {
            await apiRequest('/jobs', 'POST', formData);
            alert('Job posted successfully!');
            setFormData({ title: '', location: '', type: 'Full-time', description: '', requirements: '', salary: '', company: formData.company });
            if (onJobCreated) onJobCreated();
        } catch (err) {
            alert('Failed to post job');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Create New Job Post</h2>
            <Card className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <Input
                        label="Job Title"
                        placeholder="e.g. Senior Product Designer"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                    />
                    <Input
                        label="Company Name"
                        placeholder="Your Company"
                        value={formData.company}
                        onChange={e => setFormData({ ...formData, company: e.target.value })}
                    />
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <Input
                        label="Location"
                        placeholder="e.g. Remote / New York"
                        value={formData.location}
                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                    />
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Employment Type</label>
                        <select
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 transition-colors"
                            value={formData.type}
                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                        >
                            <option>Full-time</option>
                            <option>Contract</option>
                            <option>Part-time</option>
                            <option>Remote</option>
                        </select>
                    </div>
                </div>
                <Input
                    label="Salary Range"
                    placeholder="e.g. $100k - $120k"
                    value={formData.salary}
                    onChange={e => setFormData({ ...formData, salary: e.target.value })}
                />
                <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Job Description</label>
                    <textarea
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm h-32 focus:border-blue-500 outline-none transition-colors"
                        placeholder="Describe the role responsibilities..."
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Requirements</label>
                    <textarea
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm h-32 focus:border-blue-500 outline-none transition-colors"
                        placeholder="List skills and requirements..."
                        value={formData.requirements}
                        onChange={e => setFormData({ ...formData, requirements: e.target.value })}
                    />
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <Button variant="ghost" onClick={() => onCancel && onCancel()}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading}>{loading ? 'Posting...' : 'Publish Job'}</Button>
                </div>
            </Card>
        </div>
    );
};

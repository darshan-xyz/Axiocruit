import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Modal } from '@/components/UI';
import { MapPin, DollarSign, Clock, CheckCircle, FileText, Search } from 'lucide-react';
import { apiRequest } from '@/utils/api';
import { Job } from '@/types';
import { ApplyWithCVModal } from '@/components/ApplyWithCVModal';

export const CandidateJobsView: React.FC = () => {
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

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchJobs();
    };

    const handleApply = (job: Job) => {
        setApplyModalJob(job);
    };

    return (
        <div className="w-full space-y-6">
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
    );
};

export { CandidateJobsView as CandidateJobs };
export default CandidateJobsView;

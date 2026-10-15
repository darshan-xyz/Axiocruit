import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Input } from '@/components/UI';
import { Upload, Trash2, Plus, Download, FileText } from 'lucide-react';
import { apiRequest } from '@/utils/api';
import { Experience } from '@/types';
import { ChangePasswordForm } from '@/components/ChangePasswordForm';
import { DEFAULT_AVATAR } from '@/utils/defaultAvatar';

export const CandidateProfileView: React.FC = () => {
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', headline: '', bio: '', skills: ''
    });
    const [experience, setExperience] = useState<Experience[]>([]);
    const [education, setEducation] = useState<any[]>([]);

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
                const user: any = await apiRequest(`/users/profile?t=${Date.now()}`);
                const profileData = user.profile || {};

                setFormData({
                    firstName: user.firstName || user.name?.split(' ')[0] || '',
                    lastName: user.lastName || user.name?.split(' ').slice(1).join(' ') || '',
                    headline: profileData.headline || '',
                    bio: profileData.bio || user.bio || '',
                    skills: profileData.skills?.length ? profileData.skills.join(', ') : (user.skills?.join(', ') || '')
                });
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
            if (!formData.firstName.trim()) {
                alert('First Name is required.');
                setSaving(false);
                return;
            }
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
                education: education,
                resume: resumeUrl || undefined,
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

                    const uploadFormData = new FormData();
                    uploadFormData.append('resume', file);

                    const data = await apiRequest('/users/resume', 'POST', uploadFormData);
                    setResumeName(file.name);
                    setResumeUrl(data.resumeUrl);
                    if (data?.parsedData?.skills && data.parsedData.skills.length > 0) {
                        const existingSkills = formData.skills.split(',').map(s => s.trim()).filter(Boolean);
                        const mergedSkills = Array.from(new Set([...existingSkills, ...data.parsedData.skills]));
                        setFormData(prev => ({ ...prev, skills: mergedSkills.join(', ') }));
                        alert('Resume uploaded and skills parsed successfully!');
                    } else {
                        alert('Resume updated successfully!');
                    }

                } else {
                    const uploadFormData = new FormData();
                    uploadFormData.append('profilePicture', file);

                    const response = await apiRequest('/users/profile-picture', 'POST', uploadFormData);
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
        <div className="w-full space-y-6">
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
    );
};

export { CandidateProfileView as CandidateProfile };
export default CandidateProfileView;

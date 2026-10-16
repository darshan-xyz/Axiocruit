import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Badge } from '@ui';
import { User, Briefcase, DollarSign, Upload } from 'lucide-react';
import { apiRequest } from '@core/api';
import { User as UserType } from '@/types';
import { FreelancerProfile } from '@/components/FreelancerProfile';
import { DEFAULT_AVATAR } from '@/utils/defaultAvatar';

export const InterviewerProfile: React.FC = () => {
    const [user, setUser] = useState<UserType | null>(null);
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', headline: '', bio: '', skills: '', hourlyRate: '', yearsOfExperience: '', availability: ''
    });
    const [profilePicture, setProfilePicture] = useState<string | null>(null);

    useEffect(() => {
        apiRequest('/users/profile').then((data) => {
            setUser(data);
            setProfilePicture(data.profilePicture);
            setFormData({
                firstName: data.firstName || (data.name || '').split(' ')[0] || '',
                lastName: data.lastName || (data.name || '').split(' ').slice(1).join(' ') || '',
                headline: data.profile?.headline || '',
                bio: data.profile?.bio || '',
                skills: data.profile?.skills ? data.profile.skills.join(', ') : '',
                hourlyRate: data.profile?.hourlyRate || '',
                yearsOfExperience: data.profile?.yearsOfExperience || '',
                availability: data.profile?.availability ? data.profile.availability.join(', ') : ''
            });
        }).catch(console.error);
    }, []);

    const handleSave = async () => {
        try {
            const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(s => s.length > 0);
            const availabilityArray = formData.availability.split(',').map(s => s.trim()).filter(s => s.length > 0);
            await apiRequest('/users/profile', 'PUT', {
                ...formData,
                skills: skillsArray,
                availability: availabilityArray,
                hourlyRate: parseFloat(formData.hourlyRate) || 0
            });
            alert('Profile updated!');
        } catch (e) { alert('Error updating profile'); }
    };

    const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            try {
                const formData = new FormData();
                formData.append('profilePicture', e.target.files[0]);

                const response = await apiRequest('/users/profile-picture', 'POST', formData);
                setProfilePicture(response.profilePicture);
                alert('Photo updated');
            } catch (err: any) {
                alert(`Error uploading image: ${err.message || 'Unknown error'}`);
            }
        }
    };

    if (!user) return <div>Loading...</div>;

    return (
        <div className="w-full space-y-8">
            <h2 className="text-2xl font-bold">Interviewer Profile</h2>
            <div className="grid md:grid-cols-3 gap-8">
                <Card className="md:col-span-1 text-center p-6 h-fit">
                    <div className="relative w-32 h-32 mx-auto mb-4 group">
                        <img src={profilePicture || DEFAULT_AVATAR} className="w-full h-full rounded-full object-cover border-4 border-blue-600 dark:border-blue-500 shadow-md" alt="Profile" />
                        <label className="absolute bottom-0 right-0 p-2 bg-white dark:bg-slate-800 rounded-full border border-slate-300 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer">
                            <Upload size={16} />
                            <input type="file" className="hidden" accept="image/*" onChange={handleProfilePictureChange} />
                        </label>
                    </div>
                    <h3 className="text-xl font-bold mb-1">{user.name}</h3>
                    <p className="text-neutral-400 text-sm mb-4">Freelance Interviewer</p>
                    <Badge variant="info">{formData.hourlyRate || '0'}/hr</Badge>
                </Card>

                <Card className="md:col-span-2 p-8 space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 border-b border-slate-300 dark:border-slate-700 pb-2">
                            <User size={18} className="text-blue-600 dark:text-blue-400" /> Personal
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <Input label="First Name" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} />
                            <Input label="Last Name" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} />
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 border-b border-slate-300 dark:border-slate-700 pb-2">
                            <Briefcase size={18} className="text-blue-600 dark:text-blue-400" /> Expertise
                        </h3>
                        <div className="space-y-4">
                            <Input label="Professional Headline" placeholder="e.g. Senior System Design Interviewer" value={formData.headline} onChange={e => setFormData({ ...formData, headline: e.target.value })} />
                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-1.5">Bio / Expertise</label>
                                <textarea className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm h-24 focus:border-blue-500 outline-none transition-colors"
                                    placeholder="Describe your technical expertise..."
                                    value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                />
                            </div>
                            <Input label="Skills (Comma separated)" value={formData.skills} onChange={e => setFormData({ ...formData, skills: e.target.value })} />
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 border-b border-slate-300 dark:border-slate-700 pb-2">
                            <DollarSign size={18} className="text-blue-600 dark:text-blue-400" /> Rates & Availability
                        </h3>
                        <div className="grid md:grid-cols-3 gap-4">
                            <Input label="Hourly Rate ($)" placeholder="50" value={formData.hourlyRate} onChange={e => setFormData({ ...formData, hourlyRate: e.target.value.replace(/[^0-9]/g, '') })} />
                            <Input label="Years of Exp" placeholder="5" value={formData.yearsOfExperience} onChange={e => setFormData({ ...formData, yearsOfExperience: e.target.value })} />
                            <Input label="Availability (Comma separated)" placeholder="Weekends, Evenings" value={formData.availability} onChange={e => setFormData({ ...formData, availability: e.target.value })} />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button onClick={handleSave}>Save Changes</Button>
                    </div>
                </Card>
            </div>

            {/* Trust & Verification Portfolio Builder */}
            <div className="mt-8">
                <FreelancerProfile />
            </div>
        </div>
    );
};

export default InterviewerProfile;

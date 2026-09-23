import React, { useState, useEffect } from 'react';
import { Card, Button, Input } from '@ui';
import { User, Briefcase, Lock, Upload } from 'lucide-react';
import { apiRequest } from '@core/api';
import { User as UserType } from '@/types';
import { ChangePasswordForm } from '@/components/ChangePasswordForm';
import { DEFAULT_AVATAR } from '@/utils/defaultAvatar';

export const RecruiterProfile: React.FC = () => {
    const [user, setUser] = useState<UserType | null>(null);
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', companyName: '', website: '', companyDescription: ''
    });
    const [profilePicture, setProfilePicture] = useState<string | null>(null);

    useEffect(() => {
        apiRequest('/users/profile').then((data) => {
            setUser(data);
            setProfilePicture(data.profilePicture);
            // Check if organization is populated (it should be for Recruiters/Admins)
            const org = data.organization || {};

            setFormData({
                firstName: data.firstName || (data.name || '').split(' ')[0] || '',
                lastName: data.lastName || (data.name || '').split(' ').slice(1).join(' ') || '',
                companyName: org.name || data.companyName || '',
                website: org.website || data.website || '',
                companyDescription: org.description || data.companyDescription || ''
            });
        }).catch(console.error);
    }, []);

    const handleSave = async () => {
        try {
            // Note: Only ADMINs can actually update organization fields based on backend logic
            await apiRequest('/users/profile', 'PUT', { ...formData });
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
                alert('Profile picture updated');
            } catch (err: any) {
                console.error(err);
                alert(`Error uploading image: ${err.message || 'Unknown error'}`);
            }
        }
    };

    if (!user) return <div>Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-2xl font-bold">Recruiter Profile</h2>
            <div className="grid md:grid-cols-3 gap-8">
                <Card className="md:col-span-1 text-center p-6 h-fit">
                    <div className="relative w-32 h-32 mx-auto mb-4 group">
                        <img src={profilePicture || DEFAULT_AVATAR} className="w-full h-full rounded-full object-cover border-4 border-blue-600 dark:border-blue-500 shadow-md" alt="Profile" />
                        <label className="absolute bottom-0 right-0 p-2 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer">
                            <Upload size={16} />
                            <input type="file" className="hidden" accept="image/*" onChange={handleProfilePictureChange} />
                        </label>
                    </div>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-1">{user.name}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mb-4">Recruiter</p>
                </Card>

                <Card className="md:col-span-2 p-8 space-y-8">
                    <div>
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-4 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                            <User size={18} className="text-blue-600 dark:text-blue-400" /> Personal
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <Input label="First Name" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} />
                            <Input label="Last Name" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-4 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                            <Briefcase size={18} className="text-blue-600 dark:text-blue-400" /> Company
                        </h3>
                        <div className="space-y-4">
                            <Input label="Company Name" value={formData.companyName} onChange={e => setFormData({ ...formData, companyName: e.target.value })} />
                            <Input label="Website" value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} />
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Company Description</label>
                                <textarea className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm h-24 focus:border-blue-500 outline-none transition-colors"
                                    value={formData.companyDescription} onChange={e => setFormData({ ...formData, companyDescription: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button onClick={handleSave}>Save Changes</Button>
                    </div>

                    <div className="border-t border-slate-200 dark:border-slate-800 pt-8 mt-8">
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                            <Lock size={18} className="text-blue-600 dark:text-blue-400" /> Password & Security
                        </h3>
                        <ChangePasswordForm />
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default RecruiterProfile;

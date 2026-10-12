import React, { useState, useEffect } from 'react';
import { Card, Button, Input } from '@ui';
import { Building2, CheckCircle2 } from 'lucide-react';
import { apiRequest } from '@core/api';
import { ChangePasswordForm } from '@/components/ChangePasswordForm';

export const OrgSettings: React.FC = () => {
    const [details, setDetails] = useState({
        name: '',
        website: '',
        description: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        apiRequest('/organization/details')
            .then(data => {
                if (data) {
                    setDetails({
                        name: data.name || '',
                        website: data.website || '',
                        description: data.description || ''
                    });
                }
            })
            .catch(err => console.error('Failed to load org details:', err))
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSuccessMessage('');
        try {
            await apiRequest('/organization/details', 'PUT', details);
            setSuccessMessage('Organization profile updated successfully.');
            setTimeout(() => setSuccessMessage(''), 4000);
        } catch (err: any) {
            alert(err.message || 'Failed to update organization details');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Organization Settings</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">Manage your organization profile and account credentials.</p>
            </div>

            <Card className="p-6 space-y-5">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Company Profile</h3>
                </div>

                {successMessage && (
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                        <CheckCircle2 size={16} /> {successMessage}
                    </div>
                )}

                <form onSubmit={handleSave} className="space-y-4">
                    <Input
                        label="Organization Name"
                        placeholder="e.g. Acme Corp"
                        value={details.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDetails({ ...details, name: e.target.value })}
                        required
                    />
                    <Input
                        label="Official Website"
                        placeholder="https://example.com"
                        value={details.website}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDetails({ ...details, website: e.target.value })}
                    />
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Company Description</label>
                        <textarea
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm h-28 focus:border-blue-500 outline-none transition-colors"
                            placeholder="Briefly describe your company, culture, and mission..."
                            value={details.description}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDetails({ ...details, description: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end pt-2">
                        <Button type="submit" disabled={saving || loading}>
                            {saving ? 'Saving...' : 'Save Profile'}
                        </Button>
                    </div>
                </form>
            </Card>

            <ChangePasswordForm />
        </div>
    );
};

export default OrgSettings;

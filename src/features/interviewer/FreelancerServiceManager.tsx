import React, { useState, useEffect } from 'react';
import { Button, Input, Modal } from '@ui';
import { Briefcase, Plus, Edit2, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { apiRequest } from '@core/api';

export interface MyService {
    _id: string;
    title: string;
    description: string;
    skills: string[];
    price: number;
    durationMinutes: number;
    isActive: boolean;
}

const EMPTY_FORM = { title: '', description: '', skills: '', price: '', durationMinutes: '60' };

export const FreelancerServiceManager: React.FC = () => {
    const [services, setServices] = useState<MyService[]>([]);
    const [loading, setLoading] = useState(true);
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<MyService | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const fetchServices = async () => {
        setLoading(true);
        try {
            const data = await apiRequest('/freelancers/services');
            setServices(data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchServices(); }, []);

    const openCreate = () => {
        setEditing(null);
        setForm(EMPTY_FORM);
        setFormOpen(true);
    };

    const openEdit = (svc: MyService) => {
        setEditing(svc);
        setForm({
            title: svc.title,
            description: svc.description,
            skills: svc.skills.join(', '),
            price: svc.price.toString(),
            durationMinutes: svc.durationMinutes.toString(),
        });
        setFormOpen(true);
    };

    const handleSave = async () => {
        if (!form.title || !form.description || !form.price) {
            alert('Title, description, and price are required.'); return;
        }
        setSaving(true);
        try {
            const payload = {
                title: form.title,
                description: form.description,
                skills: form.skills,
                price: Number(form.price),
                durationMinutes: Number(form.durationMinutes) || 60,
            };
            if (editing) {
                await apiRequest(`/freelancers/services/${editing._id}`, 'PUT', payload);
            } else {
                await apiRequest('/freelancers/services', 'POST', payload);
            }
            setFormOpen(false);
            fetchServices();
        } catch (err: any) {
            alert(err.message || 'Failed to save service');
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = async (svc: MyService) => {
        try {
            await apiRequest(`/freelancers/services/${svc._id}`, 'PUT', { isActive: !svc.isActive });
            fetchServices();
        } catch (err: any) { alert('Failed to update'); }
    };

    const handleDelete = async (svc: MyService) => {
        if (!confirm(`Delete "${svc.title}"? This cannot be undone.`)) return;
        try {
            await apiRequest(`/freelancers/services/${svc._id}`, 'DELETE');
            fetchServices();
        } catch (err: any) { alert('Failed to delete'); }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">My Services</h2>
                    <p className="text-neutral-400 text-sm mt-1">Publish interview services for recruiters to book.</p>
                </div>
                <Button icon={Plus} onClick={openCreate}>Create Service</Button>
            </div>

            {loading ? (
                <div className="grid md:grid-cols-2 gap-4">
                    {[1, 2].map(i => <div key={i} className="h-36 bg-neutral-900 border border-neutral-800 rounded-xl animate-pulse" />)}
                </div>
            ) : services.length === 0 ? (
                <div className="text-center py-20 border border-neutral-800 rounded-xl">
                    <Briefcase size={48} className="text-neutral-700 mx-auto mb-4" />
                    <p className="text-neutral-500 text-lg font-medium">No services yet</p>
                    <p className="text-neutral-600 text-sm mt-1 mb-6">Create your first service so recruiters can find and book you.</p>
                    <Button icon={Plus} onClick={openCreate}>Create Your First Service</Button>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 gap-4">
                    {services.map(svc => (
                        <div key={svc._id} className={`p-5 rounded-xl border transition-all ${
                            svc.isActive
                                ? 'bg-white dark:bg-[#111726] border-slate-200/80 dark:border-slate-800 hover:border-blue-500/40 shadow-sm'
                                : 'bg-neutral-950 border-neutral-800/50 opacity-60'
                        }`}>
                            <div className="flex justify-between items-start gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-slate-900 dark:text-white truncate">{svc.title}</h3>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                                            svc.isActive ? 'bg-green-500/15 text-green-400' : 'bg-neutral-700 text-neutral-400'
                                        }`}>
                                            {svc.isActive ? 'Live' : 'Paused'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-neutral-400 line-clamp-1">{svc.description}</p>
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {svc.skills.slice(0, 4).map((s, i) => (
                                            <span key={i} className="text-[10px] px-2 py-0.5 bg-neutral-800 text-neutral-400 rounded-full border border-neutral-700">{s}</span>
                                        ))}
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="text-xl font-black text-slate-900 dark:text-white">${svc.price}</p>
                                    <p className="text-xs text-neutral-500">{svc.durationMinutes} min</p>
                                </div>
                            </div>
                            <div className="flex gap-2 mt-4 pt-4 border-t border-neutral-800">
                                <Button size="sm" variant="outline" className="flex-1 gap-1.5" onClick={() => openEdit(svc)}>
                                    <Edit2 size={12} /> Edit
                                </Button>
                                <Button size="sm" variant="outline" className="flex-1 gap-1.5" onClick={() => handleToggle(svc)}>
                                    {svc.isActive ? <ToggleRight size={14} className="text-green-400" /> : <ToggleLeft size={14} />}
                                    {svc.isActive ? 'Pause' : 'Activate'}
                                </Button>
                                <Button size="sm" variant="outline" className="text-red-400 border-red-900/40 hover:bg-red-900/20" onClick={() => handleDelete(svc)}>
                                    <Trash2 size={13} />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create / Edit modal */}
            <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Edit Service' : 'Create New Service'}>
                <div className="space-y-4">
                    <Input label="Service Title *" placeholder='e.g. "Expert React & System Design Interview"'
                        value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                    <div>
                        <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">Description *</label>
                        <textarea
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm h-24 outline-none focus:border-blue-500 resize-none transition-colors"
                            placeholder="Describe what you'll evaluate and your approach..."
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                        />
                    </div>
                    <Input label="Skills (comma separated)" placeholder="React, TypeScript, System Design"
                        value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} />
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Price ($) *" type="number" placeholder="150"
                            value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
                        <div>
                            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">Duration</label>
                            <select className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 transition-colors"
                                value={form.durationMinutes} onChange={e => setForm({ ...form, durationMinutes: e.target.value })}>
                                <option value="30">30 minutes</option>
                                <option value="45">45 minutes</option>
                                <option value="60">60 minutes</option>
                                <option value="90">90 minutes</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2 border-t border-neutral-800">
                        <Button variant="ghost" onClick={() => setFormOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editing ? 'Save Changes' : 'Publish Service'}</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default FreelancerServiceManager;

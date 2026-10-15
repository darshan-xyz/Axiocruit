import React, { useState, useEffect } from 'react';
import { Card, Button } from './UI';
import { Clock, Plus, Trash2, Save } from 'lucide-react';
import { apiRequest } from '../utils/api';
import { useToast } from './Toast';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface TimeSlot {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
}

export const FreelancerAvailability: React.FC = () => {
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Form state
    const [selectedDay, setSelectedDay] = useState(1); // Default Monday
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('17:00');

    const { addToast, ToastContainer } = useToast();

    useEffect(() => {
        fetchAvailability();
    }, []);

    const fetchAvailability = async () => {
        try {
            setLoading(true);
            const data = await apiRequest('/freelancers/availability');
            setTimeSlots(data || []);
        } catch (error: any) {
            addToast('error', error.message || 'Failed to load availability.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddSlot = () => {
        if (!startTime || !endTime) {
            addToast('error', 'Please provide both start and end times.');
            return;
        }

        if (startTime >= endTime) {
            addToast('error', 'Start time must be before end time.');
            return;
        }

        // Prevent exact duplicates
        const exists = timeSlots.some(
            slot => slot.dayOfWeek === selectedDay &&
                    slot.startTime === startTime &&
                    slot.endTime === endTime
        );

        if (exists) {
            addToast('error', 'This specific time slot already exists.');
            return;
        }

        setTimeSlots([...timeSlots, { dayOfWeek: selectedDay, startTime, endTime }]);
    };

    const handleRemoveSlot = (index: number) => {
        setTimeSlots(timeSlots.filter((_, i) => i !== index));
    };

    const handleSaveSchedule = async () => {
        try {
            setSaving(true);
            await apiRequest('/freelancers/availability', 'POST', { timeSlots });
            addToast('success', 'Schedule saved successfully!');
        } catch (error: any) {
            addToast('error', error.message || 'Failed to save schedule.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card className="w-full border border-slate-300 dark:border-neutral-700 dark:bg-neutral-900 shadow-xl">
            <ToastContainer />
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Clock className="text-blue-600 dark:text-blue-400" /> Manage Availability
                </h2>
                <p className="text-gray-500 dark:text-neutral-400 mt-1">
                    Set up the hours when you're available to conduct interviews.
                </p>
            </div>

            {loading ? (
                <div className="flex justify-center py-10">
                    <div className="w-8 h-8 border-4 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Add Slot Control */}
                    <div className="bg-gray-50 dark:bg-neutral-800/50 p-4 rounded-xl border border-slate-300 dark:border-neutral-700">
                        <div className="flex flex-col md:flex-row gap-4 items-end">
                            <div className="w-full md:w-1/3">
                                <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Day of Week</label>
                                <select 
                                    className="w-full rounded-lg py-2.5 px-4 transition-shadow outline-none border bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    value={selectedDay}
                                    onChange={(e) => setSelectedDay(Number(e.target.value))}
                                >
                                    {DAYS_OF_WEEK.map((day, idx) => (
                                        <option key={idx} value={idx}>{day}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="w-full md:w-1/4">
                                <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Start Time</label>
                                <input 
                                    type="time" 
                                    className="w-full rounded-lg py-2.5 px-4 transition-shadow outline-none border bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                />
                            </div>
                            <div className="w-full md:w-1/4">
                                <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">End Time</label>
                                <input 
                                    type="time" 
                                    className="w-full rounded-lg py-2.5 px-4 transition-shadow outline-none border bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                />
                            </div>
                            <div className="w-full md:w-auto mt-4 md:mt-0">
                                <Button 
                                    size="md" 
                                    className="w-full bg-blue-600 hover:bg-blue-700 border-none text-white font-medium"
                                    onClick={handleAddSlot}
                                    icon={Plus}
                                >
                                    Add 
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Slots List */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Your Scheduled Blocks</h3>
                        {timeSlots.length === 0 ? (
                            <p className="text-gray-500 dark:text-neutral-500 italic">No availability blocks established. Add some time slots above.</p>
                        ) : (
                            <div className="grid grid-cols-1 gap-3">
                                {timeSlots.map((slot, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-white dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 p-3 rounded-lg hover:border-blue-500 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold px-3 py-1 rounded w-24 text-center">
                                                {DAYS_OF_WEEK[slot.dayOfWeek].substring(0, 3)}
                                            </div>
                                            <div className="text-gray-700 dark:text-gray-300 font-mono tracking-wider">
                                                {slot.startTime} - {slot.endTime}
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleRemoveSlot(idx)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                            title="Remove Slot"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="pt-6 border-t border-slate-300 dark:border-neutral-700 flex justify-end">
                        <Button 
                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                            size="lg"
                            icon={Save}
                            onClick={handleSaveSchedule}
                            disabled={saving}
                        >
                            {saving ? 'Saving...' : 'Save Schedule'}
                        </Button>
                    </div>
                </div>
            )}
        </Card>
    );
};

export default FreelancerAvailability;

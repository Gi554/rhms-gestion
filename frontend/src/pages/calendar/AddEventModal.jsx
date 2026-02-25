import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import {
    Calendar as CalendarIcon,
    Clock,
    MapPin,
    Video,
    Users,
    AlignLeft,
    ChevronDown,
    Check
} from 'lucide-react';
import { format } from 'date-fns';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import Modal from '@/components/ui/modal';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function AddEventModal({ isOpen, onClose, initialDate }) {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        event_type: 'meeting',
        start_time: '',
        end_time: '',
        location: '',
        link: '',
        attendees: []
    });

    const { data: employees } = useQuery({
        queryKey: ['employees', 'active'],
        queryFn: async () => {
            const res = await api.getEmployees({ status: 'active' });
            return res.data.results || res.data;
        },
        enabled: isOpen
    });

    useEffect(() => {
        if (initialDate && isOpen) {
            const dateStr = format(initialDate, "yyyy-MM-dd");
            const nowTime = format(new Date(), "HH:mm");
            setFormData(prev => ({
                ...prev,
                start_time: `${dateStr}T${nowTime}`,
                end_time: `${dateStr}T18:00`
            }));
        }
    }, [initialDate, isOpen]);

    const mutation = useMutation({
        mutationFn: (data) => api.createEvent(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
            toast.success("Événement créé avec succès");
            onClose();
        },
        onError: (error) => {
            toast.error("Erreur lors de la création : " + (error.response?.data?.message || error.message));
        }
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const toggleAttendee = (userId) => {
        setFormData(prev => {
            const attendees = prev.attendees.includes(userId)
                ? prev.attendees.filter(id => id !== userId)
                : [...prev.attendees, userId];
            return { ...prev, attendees };
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.title || !formData.start_time || !formData.end_time) {
            toast.error("Veuillez remplir les champs obligatoires");
            return;
        }
        mutation.mutate(formData);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Planifier un Événement"
            description="Réunions, formations ou rappels importants"
            maxWidth="max-w-2xl"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Type</label>
                        <div className="relative">
                            <select
                                name="event_type"
                                value={formData.event_type}
                                onChange={handleChange}
                                className="w-full h-12 bg-slate-50 border-transparent rounded-2xl px-4 text-sm font-bold text-slate-900 appearance-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                            >
                                <option value="meeting">Réunion</option>
                                <option value="deadline">Échéance</option>
                                <option value="training">Formation</option>
                                <option value="holiday">Jour férié</option>
                                <option value="other">Autre</option>
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                    <div className="md:col-span-2 space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Titre</label>
                        <input
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="ex: Réunion de projet hebdomadaire"
                            className="w-full h-12 bg-slate-50 border-transparent rounded-2xl px-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-300"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1.5">
                            <Clock className="h-3 w-3" /> Début
                        </label>
                        <input
                            type="datetime-local"
                            name="start_time"
                            value={formData.start_time}
                            onChange={handleChange}
                            className="w-full h-12 bg-slate-50 border-transparent rounded-2xl px-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1.5">
                            <Clock className="h-3 w-3" /> Fin
                        </label>
                        <input
                            type="datetime-local"
                            name="end_time"
                            value={formData.end_time}
                            onChange={handleChange}
                            className="w-full h-12 bg-slate-50 border-transparent rounded-2xl px-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1.5">
                            <MapPin className="h-3 w-3" /> Lieu
                        </label>
                        <input
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            placeholder="ex: Salle de conférence A"
                            className="w-full h-12 bg-slate-50 border-transparent rounded-2xl px-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-300"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1.5">
                            <Video className="h-3 w-3" /> Lien visioconférence
                        </label>
                        <input
                            name="link"
                            value={formData.link}
                            onChange={handleChange}
                            placeholder="ex: zoom.us/j/..."
                            className="w-full h-12 bg-slate-50 border-transparent rounded-2xl px-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-300"
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1.5">
                        <Users className="h-3 w-3" /> Participants ({formData.attendees.length})
                    </label>
                    <div className="bg-slate-50 rounded-[2rem] p-4 max-h-48 overflow-y-auto custom-scrollbar border border-slate-100">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {employees?.map(emp => (
                                <div
                                    key={emp.user}
                                    onClick={() => toggleAttendee(emp.user)}
                                    className={cn(
                                        "flex items-center gap-3 p-2 rounded-xl border-2 transition-all cursor-pointer",
                                        formData.attendees.includes(emp.user)
                                            ? "bg-primary/5 border-primary/20 text-primary"
                                            : "bg-white border-transparent hover:border-slate-100"
                                    )}
                                >
                                    <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-bold shrink-0 text-slate-600">
                                        {(emp.first_name?.[0] || '') + (emp.last_name?.[0] || '')}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[11px] font-black truncate">{emp.first_name} {emp.last_name}</div>
                                        <div className="text-[9px] text-slate-400 truncate uppercase tracking-tighter">{emp.position}</div>
                                    </div>
                                    {formData.attendees.includes(emp.user) && <Check className="h-3.5 w-3.5" />}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1.5">
                        <AlignLeft className="h-3 w-3" /> Description
                    </label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={3}
                        className="w-full bg-slate-50 border-transparent rounded-[1.5rem] p-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-300 resize-none"
                    />
                </div>

                <div className="pt-4 flex items-center justify-end gap-3">
                    <Button variant="ghost" onClick={onClose} className="rounded-xl px-6 font-bold text-slate-500">
                        Annuler
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={mutation.isPending}
                        className="bg-primary text-white hover:bg-primary/90 rounded-xl px-8 font-black uppercase tracking-widest shadow-lg shadow-primary/20"
                    >
                        {mutation.isPending ? "Création..." : "Confirmer"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

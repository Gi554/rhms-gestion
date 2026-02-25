import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Plus,
    Clock,
    MapPin,
    Users,
    Video,
    MoreHorizontal,
    Search,
    Filter
} from 'lucide-react';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    isSameDay,
    addDays,
    eachDayOfInterval,
    parseISO
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import AddEventModal from './AddEventModal';

export default function Calendar() {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Fetch events for current month
    const { data: events, isLoading } = useQuery({
        queryKey: ['events', format(currentMonth, 'yyyy-MM')],
        queryFn: async () => {
            const start = format(startOfWeek(startOfMonth(currentMonth)), 'yyyy-MM-dd');
            const end = format(endOfWeek(endOfMonth(currentMonth)), 'yyyy-MM-dd');
            const res = await api.getEvents({ start_date: start, end_date: end });
            return res.data.results || res.data;
        }
    });

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const renderHeader = () => {
        return (
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10">
                        <CalendarIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Calendrier</h1>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">
                            {format(currentMonth, 'MMMM yyyy', { locale: fr })}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-white rounded-xl border border-slate-100 p-1 shadow-sm">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={prevMonth}
                            className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="px-4 text-[10px] font-black text-slate-600 uppercase tracking-widest min-w-[120px] text-center">
                            {format(currentMonth, 'MMMM yyyy', { locale: fr })}
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={nextMonth}
                            className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    <Button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-primary text-white hover:bg-primary/90 rounded-xl px-4 flex items-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95"
                    >
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">Nouvel Événement</span>
                    </Button>
                </div>
            </div>
        );
    };

    const renderDays = () => {
        const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
        return (
            <div className="grid grid-cols-7 mb-4">
                {days.map((day) => (
                    <div key={day} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                        {day}
                    </div>
                ))}
            </div>
        );
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
        const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

        const rows = [];
        let days = [];
        let day = startDate;
        let formattedDate = "";

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                formattedDate = format(day, "d");
                const cloneDay = day;
                const dayEvents = events?.filter(e => isSameDay(parseISO(e.start_time), cloneDay)) || [];

                days.push(
                    <div
                        key={day.toString()}
                        className={cn(
                            "min-h-[140px] bg-white border border-slate-50 relative group transition-all duration-300 hover:z-10",
                            !isSameMonth(day, monthStart) ? "bg-slate-50/50 opacity-40" : "hover:shadow-2xl hover:shadow-slate-200/50 hover:border-primary/20",
                            isSameDay(day, selectedDate) && "ring-1 ring-inset ring-primary/30 bg-primary/[0.02]"
                        )}
                        onClick={() => setSelectedDate(cloneDay)}
                    >
                        <div className="p-3">
                            <span className={cn(
                                "text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-lg transition-all",
                                isSameDay(day, new Date()) ? "bg-primary text-white shadow-lg shadow-primary/30" : "text-slate-400 group-hover:text-primary"
                            )}>
                                {formattedDate}
                            </span>
                        </div>

                        <div className="px-2 space-y-1 overflow-hidden">
                            {dayEvents.slice(0, 3).map((event) => (
                                <div
                                    key={event.id}
                                    className={cn(
                                        "px-2 py-1 rounded-lg text-[10px] font-bold truncate transition-all cursor-pointer hover:scale-[1.02] active:scale-95 flex items-center gap-1.5",
                                        event.event_type === 'meeting' ? "bg-purple-50 text-purple-700 border border-purple-100" :
                                            event.event_type === 'deadline' ? "bg-rose-50 text-rose-700 border border-rose-100" :
                                                event.event_type === 'holiday' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                                                    "bg-blue-50 text-blue-700 border border-blue-100"
                                    )}
                                >
                                    {event.event_type === 'meeting' && <Video className="h-2.5 w-2.5 shrink-0" />}
                                    {event.title}
                                </div>
                            ))}
                            {dayEvents.length > 3 && (
                                <div className="text-[9px] font-black text-slate-400 pl-2 uppercase tracking-tighter">
                                    + {dayEvents.length - 3} de plus
                                </div>
                            )}
                        </div>

                        {/* Hover Plus Button */}
                        <button className="absolute bottom-2 right-2 h-6 w-6 rounded-lg bg-primary text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 shadow-lg shadow-primary/30"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsAddModalOpen(true);
                                setSelectedDate(cloneDay);
                            }}
                        >
                            <Plus className="h-3 w-3" />
                        </button>
                    </div>
                );
                day = addDays(day, 1);
            }
            rows.push(
                <div className="grid grid-cols-7" key={day.toString()}>
                    {days}
                </div>
            );
            days = [];
        }
        return <div className="rounded-[2rem] border border-slate-100 overflow-hidden bg-white shadow-xl shadow-slate-200/40">{rows}</div>;
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {renderHeader()}

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Main Calendar Space */}
                <div className="flex-1">
                    {renderDays()}
                    {renderCells()}
                </div>

                {/* Sidebar Info */}
                <div className="w-full lg:w-80 space-y-6">
                    <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-xl shadow-slate-200/40">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Événements du jour</h3>
                            <div className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                <Clock className="h-4 w-4" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            {events?.filter(e => isSameDay(parseISO(e.start_time), selectedDate)).length > 0 ? (
                                events.filter(e => isSameDay(parseISO(e.start_time), selectedDate)).map((event) => (
                                    <div key={event.id} className="group p-4 rounded-[1.5rem] bg-slate-50/50 border border-slate-100/50 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 hover:border-primary/20 transition-all">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest",
                                                event.event_type === 'meeting' ? "bg-purple-100 text-purple-700" :
                                                    event.event_type === 'deadline' ? "bg-rose-100 text-rose-700" : "bg-blue-100 text-blue-700"
                                            )}>
                                                {event.event_type}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400">
                                                {format(parseISO(event.start_time), 'HH:mm')}
                                            </span>
                                        </div>
                                        <h4 className="text-sm font-black text-slate-900 leading-tight mb-2 group-hover:text-primary transition-colors">
                                            {event.title}
                                        </h4>
                                        <div className="space-y-1.5">
                                            {event.location && (
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                    <MapPin className="h-3 w-3" />
                                                    <span className="truncate">{event.location}</span>
                                                </div>
                                            )}
                                            {event.attendees?.length > 0 && (
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                    <Users className="h-3 w-3" />
                                                    <span>{event.attendees.length} participants</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-12 text-center text-slate-400 border-2 border-dashed border-slate-100 rounded-[2rem]">
                                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Aucun plan pour aujourd'hui</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {isAddModalOpen && (
                <AddEventModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    initialDate={selectedDate}
                />
            )}
        </div>
    );
}

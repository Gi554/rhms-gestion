import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, Trash2, ExternalLink, Calendar, Briefcase, FileText, Settings, X } from 'lucide-react';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';

export default function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const queryClient = useQueryClient();
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    // Fetch notifications
    const { data: notifications } = useQuery({
        queryKey: ['notifications'],
        queryFn: async () => {
            const res = await api.getNotifications({ page_size: 10 });
            return res.data.results || res.data;
        },
        refetchInterval: 30000, // Polling every 30s
    });

    const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

    // Mutations
    const markReadMutation = useMutation({
        mutationFn: (id) => api.markNotificationRead(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    });

    const markAllReadMutation = useMutation({
        mutationFn: () => api.markAllNotificationsRead(),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    });

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getTypeIcon = (type) => {
        switch (type) {
            case 'leave': return <Calendar className="h-4 w-4 text-blue-500" />;
            case 'payroll': return <Briefcase className="h-4 w-4 text-emerald-500" />;
            case 'document': return <FileText className="h-4 w-4 text-orange-500" />;
            case 'meeting': return <Video className="h-4 w-4 text-purple-500" />;
            case 'system': return <Info className="h-4 w-4 text-slate-500" />;
            default: return <Settings className="h-4 w-4 text-slate-500" />;
        }
    };

    const handleNotificationClick = (notification) => {
        if (!notification.is_read) {
            markReadMutation.mutate(notification.id);
        }
        if (notification.link) {
            navigate(notification.link);
        }
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "h-10 w-10 rounded-full bg-white text-gray-500 hover:text-primary hover:bg-white shadow-sm border border-gray-100 relative transition-all duration-200",
                    isOpen && "ring-2 ring-primary/20 bg-slate-50 border-primary/20 text-primary"
                )}
            >
                <Bell className={cn("h-5 w-5", unreadCount > 0 && "animate-pulse")} />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 border-2 border-white text-[10px] font-bold text-white flex items-center justify-center animate-in zoom-in duration-300">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </Button>

            {isOpen && (
                <div className="absolute right-0 mt-4 w-[380px] bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="p-6 pb-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                        <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Notifications</h3>
                            <p className="text-[10px] text-slate-400 font-bold mt-0.5">{unreadCount} non lues</p>
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={() => markAllReadMutation.mutate()}
                                className="text-[10px] font-black text-primary hover:text-primary/80 uppercase tracking-tighter flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-100 shadow-sm transition-all"
                            >
                                <Check className="h-3 w-3" />
                                Tout lire
                            </button>
                        )}
                    </div>

                    <div className="max-h-[420px] overflow-y-auto custom-scrollbar">
                        {notifications?.length > 0 ? (
                            <div className="divide-y divide-slate-50">
                                {notifications.map((n) => (
                                    <div
                                        key={n.id}
                                        onClick={() => handleNotificationClick(n)}
                                        className={cn(
                                            "p-5 flex gap-4 cursor-pointer transition-all hover:bg-slate-50 relative group",
                                            !n.is_read && "bg-primary/5"
                                        )}
                                    >
                                        {!n.is_read && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-full my-3 ml-1" />
                                        )}
                                        <div className={cn(
                                            "h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 border border-slate-100",
                                            !n.is_read ? "bg-white shadow-sm" : "bg-slate-50 shadow-none"
                                        )}>
                                            {getTypeIcon(n.type)}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{n.type}</span>
                                                <span className="text-[10px] font-bold text-slate-300">
                                                    {format(new Date(n.created_at), 'HH:mm', { locale: fr })}
                                                </span>
                                            </div>
                                            <h4 className={cn(
                                                "text-sm tracking-tight leading-tight",
                                                !n.is_read ? "font-black text-slate-900" : "font-medium text-slate-500"
                                            )}>
                                                {n.title}
                                            </h4>
                                            <p className="text-xs text-slate-400 font-medium line-clamp-2 leading-relaxed">
                                                {n.message}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-20 flex flex-col items-center justify-center text-center px-8">
                                <div className="h-16 w-16 rounded-[2rem] bg-slate-50 border-2 border-slate-100 flex items-center justify-center text-slate-300 mb-4 opacity-50">
                                    <Bell className="h-8 w-8" />
                                </div>
                                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">Le calme avant la tempête</h4>
                                <p className="text-[10px] text-slate-300 font-bold mt-1">Aucune nouvelle notification pour le moment.</p>
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-slate-50 bg-slate-50/30 text-center">
                        <button
                            onClick={() => { navigate('/notifications'); setIsOpen(false); }}
                            className="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"
                        >
                            Voir tout l'historique
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

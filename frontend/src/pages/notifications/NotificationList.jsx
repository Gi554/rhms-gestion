import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, Trash2, Calendar, Briefcase, FileText, Settings, Search, Filter, X, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function NotificationList() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // all, unread
    const [typeFilter, setTypeFilter] = useState('all');

    // Fetch notifications
    const { data: notifications, isLoading } = useQuery({
        queryKey: ['notifications', 'full-list'],
        queryFn: async () => {
            const res = await api.getNotifications({ page_size: 100 });
            return res.data.results || res.data;
        },
    });

    // Mutations
    const markReadMutation = useMutation({
        mutationFn: (id) => api.markNotificationRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications', 'full-list'] });
        },
    });

    const markAllReadMutation = useMutation({
        mutationFn: () => api.markAllNotificationsRead(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications', 'full-list'] });
            toast.success('Toutes les notifications ont été marquées comme lues.');
        },
    });

    const getTypeIcon = (type) => {
        switch (type) {
            case 'leave': return <Calendar className="h-5 w-5 text-blue-500" />;
            case 'payroll': return <Briefcase className="h-5 w-5 text-emerald-500" />;
            case 'document': return <FileText className="h-5 w-5 text-orange-500" />;
            default: return <Settings className="h-5 w-5 text-slate-500" />;
        }
    };

    const handleNotificationClick = (notification) => {
        if (!notification.is_read) {
            markReadMutation.mutate(notification.id);
        }
        if (notification.link) {
            navigate(notification.link);
        }
    };

    const filteredNotifications = useMemo(() => {
        if (!notifications) return [];
        return notifications.filter(n => {
            const matchesSearch = n.title.toLowerCase().includes(search.toLowerCase()) ||
                n.message.toLowerCase().includes(search.toLowerCase());
            const matchesStatus = statusFilter === 'all' || !n.is_read;
            const matchesType = typeFilter === 'all' || n.type === typeFilter;
            return matchesSearch && matchesStatus && matchesType;
        });
    }, [notifications, search, statusFilter, typeFilter]);

    const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

    if (isLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3 uppercase">
                        <Bell className="h-8 w-8 text-primary" />
                        Centre de Notifications
                    </h1>
                    <p className="text-slate-500 font-bold text-sm mt-1 uppercase tracking-tight opacity-70">
                        {unreadCount} notification{unreadCount !== 1 ? 's' : ''} non lue{unreadCount !== 1 ? 's' : ''}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <Button
                        onClick={() => markAllReadMutation.mutate()}
                        className="bg-slate-900 text-white rounded-2xl h-12 px-6 shadow-xl shadow-slate-200 font-black uppercase tracking-widest text-xs"
                    >
                        <Check className="mr-2 h-4 w-4" />
                        Tout marquer comme lu
                    </Button>
                )}
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                        placeholder="Rechercher une notification..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-14 pl-12 rounded-2xl border-none bg-white shadow-sm focus:ring-4 focus:ring-primary/10 font-bold"
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="w-full h-14 pl-10 pr-4 rounded-2xl border-none bg-white shadow-sm focus:ring-4 focus:ring-primary/10 font-bold text-sm appearance-none outline-none cursor-pointer"
                    >
                        <option value="all">Tous les types</option>
                        <option value="leave">Congés</option>
                        <option value="payroll">Paie</option>
                        <option value="document">Documents</option>
                        <option value="system">Système</option>
                    </select>
                </div>
                <div className="relative">
                    <div className="flex p-1 bg-white rounded-2xl shadow-sm h-14 border border-slate-50">
                        <button
                            onClick={() => setStatusFilter('all')}
                            className={cn(
                                "flex-1 rounded-xl text-xs font-black uppercase tracking-tighter transition-all",
                                statusFilter === 'all' ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            Toutes
                        </button>
                        <button
                            onClick={() => setStatusFilter('unread')}
                            className={cn(
                                "flex-1 rounded-xl text-xs font-black uppercase tracking-tighter transition-all",
                                statusFilter === 'unread' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            Non lues
                        </button>
                    </div>
                </div>
            </div>

            {/* List */}
            <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] bg-white overflow-hidden">
                <CardContent className="p-0">
                    {filteredNotifications.length > 0 ? (
                        <div className="divide-y divide-slate-50">
                            {filteredNotifications.map((n) => (
                                <div
                                    key={n.id}
                                    onClick={() => handleNotificationClick(n)}
                                    className={cn(
                                        "p-6 flex flex-col md:flex-row md:items-center gap-6 cursor-pointer transition-all hover:bg-slate-50 relative group",
                                        !n.is_read && "bg-primary/5"
                                    )}
                                >
                                    {!n.is_read && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary rounded-full my-4 ml-1.5" />
                                    )}
                                    <div className={cn(
                                        "h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 border border-slate-100 transition-transform group-hover:scale-110 duration-300",
                                        !n.is_read ? "bg-white shadow-lg" : "bg-slate-50 shadow-none opacity-60"
                                    )}>
                                        {getTypeIcon(n.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="text-[10px] font-black text-primary uppercase tracking-widest">{n.type}</span>
                                            <span className="text-[10px] font-black text-slate-300 uppercase">
                                                {format(new Date(n.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                                            </span>
                                        </div>
                                        <h3 className={cn(
                                            "text-lg tracking-tight leading-tight",
                                            !n.is_read ? "font-black text-slate-900" : "font-bold text-slate-500"
                                        )}>
                                            {n.title}
                                        </h3>
                                        <p className="text-sm text-slate-400 font-bold mt-1 leading-relaxed max-w-2xl">
                                            {n.message}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4 shrink-0">
                                        {n.link && (
                                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 transition-all hover:bg-slate-900 hover:text-white">
                                                <ChevronRight className="h-5 w-5" />
                                            </div>
                                        )}
                                        {!n.is_read && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    markReadMutation.mutate(n.id);
                                                }}
                                                className="h-10 px-4 rounded-xl bg-white border border-slate-100 text-[10px] font-black uppercase tracking-widest shadow-sm hover:border-primary hover:text-primary transition-all"
                                            >
                                                Marquer lu
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-32 flex flex-col items-center justify-center text-center px-8">
                            <div className="h-24 w-24 rounded-[3rem] bg-slate-50 border-4 border-slate-100 flex items-center justify-center text-slate-200 mb-8 animate-in zoom-in duration-500">
                                <Bell className="h-12 w-12" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Aucune notification</h3>
                            <p className="text-sm text-slate-400 font-bold mt-2 max-w-sm uppercase tracking-tighter opacity-60">
                                Nous n'avons trouvé aucune notification correspondant à vos critères de recherche.
                            </p>
                            {(search || statusFilter !== 'all' || typeFilter !== 'all') && (
                                <Button
                                    variant="ghost"
                                    onClick={() => { setSearch(''); setStatusFilter('all'); setTypeFilter('all'); }}
                                    className="mt-6 text-primary font-black uppercase tracking-widest text-xs"
                                >
                                    <X className="mr-2 h-4 w-4" />
                                    Effacer les filtres
                                </Button>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

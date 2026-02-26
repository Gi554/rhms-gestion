import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { api } from '../../lib/api-client';
import { toast } from 'sonner';
import ScheduleConfig from './ScheduleConfig';
import { Camera, AlertTriangle, Search, Trash2, X, Flag, MonitorPlay } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { getMediaUrl, cn } from '@/lib/utils';

export default function MonitoringPage({ userProfile }) {
    const [screenshots, setScreenshots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [filter, setFilter] = useState('all'); // 'all', 'flagged'
    const [employeeSearch, setEmployeeSearch] = useState('');

    // Lightbox state
    const [selectedImage, setSelectedImage] = useState(null);

    const userRole = userProfile?.organizations?.[0]?.role;
    const isOwnerOrAdmin = userRole === 'admin' || userRole === 'owner';

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [screnshotsRes, statsRes] = await Promise.all([
                api.getScreenshots(),
                api.getScreenshotStats()
            ]);
            // DRF returns paginated object {count, next, previous, results} by default
            setScreenshots(screnshotsRes.data?.results || screnshotsRes.data || []);
            setStats(statsRes.data);

        } catch (error) {
            console.error('Failed to fetch monitoring data', error);
            toast.error('Erreur lors du chargement des captures');
        } finally {
            setLoading(false);
        }
    };

    const handleFlag = async (e, id, currentFlagStatus) => {
        e.stopPropagation();
        try {
            await api.flagScreenshot(id, { is_flagged: !currentFlagStatus });
            // Optimistic UI update
            setScreenshots(prev => prev.map(s => s.id === id ? { ...s, is_flagged: !currentFlagStatus } : s));
            toast.success(`Capture marquée comme ${!currentFlagStatus ? 'suspecte' : 'normale'}`);
        } catch (error) {
            console.error('Failed to flag screenshot', error);
            toast.error('Erreur lors de la modification');
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette capture ?")) return;

        try {
            await api.deleteScreenshot(id);
            setScreenshots(prev => prev.filter(s => s.id !== id));
            toast.success('Capture supprimée');
        } catch (error) {
            console.error('Failed to delete screenshot', error);
            toast.error('Erreur lors de la suppression');
        }
    };

    const filteredScreenshots = screenshots.filter(s => {
        if (filter === 'flagged' && !s.is_flagged) return false;
        if (employeeSearch && !s.employee_detail.full_name.toLowerCase().includes(employeeSearch.toLowerCase())) return false;
        return true;
    });

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                        <MonitorPlay className="w-8 h-8 text-primary" />
                        Monitoring d'Activité
                    </h1>
                    <p className="mt-1 text-gray-500">Supervision des captures d'écran des collaborateurs</p>
                </div>

                {stats && (
                    <div className="flex gap-4">
                        <Card className="border-none shadow-sm rounded-xl bg-white flex items-center gap-3 px-4 py-3">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></div>
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Aujourd'hui</p>
                                <p className="text-lg font-bold text-gray-900 leading-tight">{stats.today}</p>
                            </div>
                        </Card>
                        <Card className="border-none shadow-sm rounded-xl bg-white flex items-center gap-3 px-4 py-3">
                            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50"></div>
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Suspects</p>
                                <p className="text-lg font-bold text-rose-600 leading-tight">{stats.flagged}</p>
                            </div>
                        </Card>
                    </div>
                )}
            </div>

            {isOwnerOrAdmin && <ScheduleConfig />}

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                        placeholder="Rechercher par employé..."
                        value={employeeSearch}
                        onChange={(e) => setEmployeeSearch(e.target.value)}
                        className="w-full pl-12 h-12 rounded-xl border-none bg-white shadow-sm focus:ring-2 focus:ring-primary/20 text-base"
                    />
                    {employeeSearch && (
                        <button
                            onClick={() => setEmployeeSearch('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                <div className="flex bg-gray-100/50 p-1 rounded-xl shadow-inner max-w-fit">
                    <button
                        onClick={() => setFilter('all')}
                        className={cn(
                            "px-6 py-2 rounded-lg text-sm font-bold transition-all duration-200",
                            filter === 'all' ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        Toutes
                    </button>
                    <button
                        onClick={() => setFilter('flagged')}
                        className={cn(
                            "px-6 py-2 rounded-lg text-sm font-bold transition-all duration-200 flex items-center gap-2",
                            filter === 'flagged' ? "bg-white shadow-sm text-rose-600" : "text-gray-500 hover:text-rose-600"
                        )}
                    >
                        <AlertTriangle className="w-4 h-4" />
                        Signalées
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex h-64 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                </div>
            ) : filteredScreenshots.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredScreenshots.map((shot) => (
                        <Card
                            key={shot.id}
                            onClick={() => setSelectedImage(shot)}
                            className={cn(
                                "group relative overflow-hidden cursor-pointer border-none shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 rounded-2xl",
                                shot.is_flagged ? "ring-2 ring-rose-500/50" : ""
                            )}
                        >
                            <div className="aspect-video bg-gray-100 relative overflow-hidden group">
                                <img
                                    src={getMediaUrl(shot.image_url)}
                                    alt="Screenshot"
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-gray-900/0 to-gray-900/0 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                    <span className="text-white text-xs font-medium px-2 py-1 bg-white/20 backdrop-blur-md rounded-md">Voir en détail</span>
                                </div>
                                {shot.is_flagged && (
                                    <div className="absolute top-3 right-3 bg-rose-500 text-white p-2 rounded-full shadow-lg shadow-rose-500/30">
                                        <AlertTriangle className="w-4 h-4" />
                                    </div>
                                )}
                            </div>

                            <CardContent className="p-4 bg-white">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-primary font-bold overflow-hidden border border-primary/10 shrink-0">
                                            {shot.employee_detail.profile_photo ? (
                                                <img src={getMediaUrl(shot.employee_detail.profile_photo)} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span>{shot.employee_detail.full_name.charAt(0)}</span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm truncate">{shot.employee_detail.full_name}</p>
                                            <p className="text-[10px] text-primary font-black bg-primary/5 inline-block px-1.5 py-0.5 rounded uppercase mt-0.5 truncate max-w-[120px]">
                                                {shot.employee_detail.department || 'Sans département'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-medium text-gray-400">
                                    <span>{format(new Date(shot.captured_at), "d MMM yyyy, HH:mm", { locale: fr })}</span>

                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost" size="icon"
                                            onClick={(e) => handleFlag(e, shot.id, shot.is_flagged)}
                                            className={cn(
                                                "h-8 w-8 rounded-lg transition-colors",
                                                shot.is_flagged ? "text-rose-600 bg-rose-50 hover:bg-rose-100" : "text-gray-400 hover:text-amber-600 hover:bg-amber-50"
                                            )}
                                            title="Signaler"
                                        >
                                            <Flag className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost" size="icon"
                                            onClick={(e) => handleDelete(e, shot.id)}
                                            className="h-8 w-8 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                            title="Supprimer"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="bg-gray-50 p-4 rounded-full mb-4">
                        <MonitorPlay className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">Aucune capture d'écran</h3>
                    <p className="text-gray-500 max-w-sm">Aucune capture ne correspond à vos critères de recherche.</p>
                </div>
            )}

            {/* Lightbox Modal */}
            {selectedImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-8 animate-in fade-in duration-200" onClick={() => setSelectedImage(null)}>
                    <Button
                        variant="ghost" size="icon"
                        className="absolute top-6 right-6 text-white/50 hover:text-white bg-white/10 hover:bg-white/20 rounded-full h-12 w-12"
                        onClick={() => setSelectedImage(null)}
                    >
                        <X className="w-6 h-6" />
                    </Button>

                    <div className="w-full h-full max-w-6xl max-h-screen flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex-1 min-h-0 relative flex items-center justify-center p-4">
                            <img
                                src={getMediaUrl(selectedImage.image_url)}
                                alt="Full screenshot"
                                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                            />
                        </div>

                        <Card className="border-none shadow-2xl sm:mb-8 mx-auto w-full max-w-2xl flex items-center justify-between shrink-0 p-4 sm:p-6 rounded-3xl">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-primary font-bold overflow-hidden border border-primary/10 shrink-0">
                                    {selectedImage.employee_detail.profile_photo ? (
                                        <img src={getMediaUrl(selectedImage.employee_detail.profile_photo)} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-lg">{selectedImage.employee_detail.full_name.charAt(0)}</span>
                                    )}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 leading-tight">{selectedImage.employee_detail.full_name}</p>
                                    <p className="text-sm font-medium text-gray-500 mt-0.5">{format(new Date(selectedImage.captured_at), "EEEE d MMMM yyyy à HH:mm", { locale: fr })}</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap sm:flex-nowrap items-center justify-end gap-2">
                                <Button
                                    variant="outline"
                                    onClick={(e) => handleFlag(e, selectedImage.id, selectedImage.is_flagged)}
                                    className={cn(
                                        "rounded-xl font-bold border-none",
                                        selectedImage.is_flagged ? "bg-rose-100 text-rose-700 hover:bg-rose-200" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    )}
                                >
                                    <AlertTriangle className="w-4 h-4 mr-2" />
                                    {selectedImage.is_flagged ? 'Suspect' : 'Signaler'}
                                </Button>
                                <Button
                                    variant="ghost" size="icon"
                                    onClick={(e) => {
                                        handleDelete(e, selectedImage.id);
                                        setSelectedImage(null);
                                    }}
                                    className="h-10 w-10 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </Button>
                            </div>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}

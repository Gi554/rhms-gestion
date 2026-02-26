import { useState, useEffect } from 'react';
import { api } from '../../lib/api-client';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ScheduleConfig() {
    const [schedule, setSchedule] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSchedule();
    }, []);

    const fetchSchedule = async () => {
        try {
            const response = await api.getCaptureSchedule();
            setSchedule(response.data);
        } catch (error) {
            console.error('Failed to fetch screen capture config', error);
            toast.error('Erreur lors de la récupération de la configuration');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSchedule(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSave = async () => {
        try {
            await api.updateCaptureSchedule(schedule.id, schedule);
            toast.success('Configuration sauvegardée avec succès');
        } catch (error) {
            console.error('Failed to update screen capture config', error);
            toast.error('Erreur lors de la sauvegarde de la configuration');
        }
    };

    if (loading) return <div>Chargement de la configuration...</div>;
    if (!schedule) return null;

    return (
        <Card className="mb-8 border-none shadow-sm rounded-3xl bg-white overflow-hidden">
            <CardContent className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 tracking-tight">Configuration du monitoring</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Définissez les règles de capture d'écran aléatoire (heures de bureau, fréquence).
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-700">Activer le monitoring</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                name="is_enabled"
                                className="sr-only peer"
                                checked={schedule.is_enabled}
                                onChange={handleChange}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Début journée</label>
                        <Input
                            type="time"
                            name="work_start"
                            value={schedule.work_start}
                            onChange={handleChange}
                            className="w-full h-12 rounded-xl bg-gray-50 border-none shadow-inner focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                            disabled={!schedule.is_enabled}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Fin journée</label>
                        <Input
                            type="time"
                            name="work_end"
                            value={schedule.work_end}
                            onChange={handleChange}
                            className="w-full h-12 rounded-xl bg-gray-50 border-none shadow-inner focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                            disabled={!schedule.is_enabled}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Captures / jour</label>
                        <Input
                            type="number"
                            min="1"
                            max="20"
                            name="captures_per_day"
                            value={schedule.captures_per_day}
                            onChange={handleChange}
                            className="w-full h-12 rounded-xl bg-gray-50 border-none shadow-inner focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                            disabled={!schedule.is_enabled}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Rétention (jours)</label>
                        <Input
                            type="number"
                            min="1"
                            max="365"
                            name="retention_days"
                            value={schedule.retention_days}
                            onChange={handleChange}
                            className="w-full h-12 rounded-xl bg-gray-50 border-none shadow-inner focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                            disabled={!schedule.is_enabled}
                        />
                    </div>
                </div>

                <div className="mt-8 flex justify-end">
                    <Button
                        onClick={handleSave}
                        className="bg-primary hover:bg-primary/90 text-white rounded-xl h-12 px-8 shadow-lg shadow-primary/20 text-base font-bold transition-all hover:scale-105 active:scale-95"
                    >
                        Sauvegarder la configuration
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { User, Lock, Mail, Shield, Camera } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';

export default function Profile() {
    const { userProfile } = useOutletContext();
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordData, setPasswordData] = useState({
        old_password: '',
        new_password: '',
        confirm_password: '',
    });

    const fullName = userProfile?.first_name
        ? `${userProfile.first_name} ${userProfile.last_name || ''}`
        : userProfile?.username;

    const role = userProfile?.organizations?.[0]?.role || 'Employé';

    const handlePasswordChange = async (e) => {
        e.preventDefault();

        if (passwordData.new_password !== passwordData.confirm_password) {
            toast.error("Les nouveaux mots de passe ne correspondent pas.");
            return;
        }

        try {
            await api.changePassword({
                old_password: passwordData.old_password,
                new_password: passwordData.new_password
            });
            toast.success("Mot de passe mis à jour !");
            setIsChangingPassword(false);
            setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
        } catch (error) {
            toast.error(error.response?.data?.detail || "Erreur lors du changement de mot de passe.");
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Mon Profil</h1>
                    <p className="text-gray-500 mt-1">Gérez vos informations personnelles et votre sécurité</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column: Avatar & Basic Info */}
                <div className="space-y-6">
                    <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                        <CardContent className="p-8 flex flex-col items-center text-center">
                            <div className="relative group">
                                <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-50">
                                    <img
                                        src={userProfile?.employee_profile?.profile_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userProfile?.username || 'User'}`}
                                        alt={fullName}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                                <button className="absolute bottom-1 right-1 p-2 bg-primary text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="mt-4">
                                <h2 className="text-xl font-bold text-gray-900">{fullName}</h2>
                                <p className="text-sm font-medium text-primary mt-1">{userProfile?.employee_profile?.position || 'Poste non défini'}</p>
                                <div className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full mt-3 uppercase tracking-wider">
                                    {role}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                Accès
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3 text-sm">
                                <User className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-600 font-medium">@{userProfile?.username}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Mail className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-600 font-medium">{userProfile?.email}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Detailed Info & Security */}
                <div className="md:col-span-2 space-y-8">
                    <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
                        <CardHeader className="p-8 pb-0 flex flex-row items-center justify-between">
                            <CardTitle className="text-xl font-bold flex items-center gap-3">
                                <Lock className="h-5 w-5 text-primary" />
                                Sécurité
                            </CardTitle>
                            {!isChangingPassword && (
                                <Button
                                    variant="outline"
                                    className="rounded-xl border-gray-200"
                                    onClick={() => setIsChangingPassword(true)}
                                >
                                    Changer le mot de passe
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="p-8">
                            {isChangingPassword ? (
                                <form onSubmit={handlePasswordChange} className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Ancien mot de passe</label>
                                        <Input
                                            type="password"
                                            value={passwordData.old_password}
                                            onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">Nouveau mot de passe</label>
                                            <Input
                                                type="password"
                                                value={passwordData.new_password}
                                                onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">Confirmer le nouveau</label>
                                            <Input
                                                type="password"
                                                value={passwordData.confirm_password}
                                                onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-3 pt-4 border-t border-gray-50 mt-6">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            className="rounded-xl"
                                            onClick={() => setIsChangingPassword(false)}
                                        >
                                            Annuler
                                        </Button>
                                        <Button
                                            type="submit"
                                            className="bg-primary text-white rounded-xl px-8 shadow-lg shadow-primary/20"
                                        >
                                            Mettre à jour
                                        </Button>
                                    </div>
                                </form>
                            ) : (
                                <div className="py-2">
                                    <p className="text-gray-500 text-sm">
                                        Il est recommandé de changer votre mot de passe régulièrement pour assurer la sécurité de vos données.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Placeholder for other settings */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 opacity-50 select-none">
                        <div className="p-6 bg-white rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
                            <div className="h-10 w-10 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center">
                                <User className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="font-bold text-gray-900">Préférences</div>
                                <p className="text-xs text-gray-500">Bientôt disponible</p>
                            </div>
                        </div>
                        <div className="p-6 bg-white rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
                            <div className="h-10 w-10 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center">
                                <Mail className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="font-bold text-gray-900">Notifications</div>
                                <p className="text-xs text-gray-500">Bientôt disponible</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

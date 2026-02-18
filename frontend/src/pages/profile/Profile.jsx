import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { User, Lock, Mail, Shield, Camera, Pencil, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function Profile() {
    const { userProfile, onProfileUpdate } = useOutletContext();
    const queryClient = useQueryClient();

    // Password state
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordData, setPasswordData] = useState({
        old_password: '',
        new_password: '',
        confirm_password: '',
    });

    // Edit profile state
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profileForm, setProfileForm] = useState({
        first_name: userProfile?.first_name || '',
        last_name: userProfile?.last_name || '',
        email: userProfile?.email || '',
    });

    const fullName = userProfile?.first_name
        ? `${userProfile.first_name} ${userProfile.last_name || ''}`
        : userProfile?.username;

    const role = userProfile?.organizations?.[0]?.role || 'Employé';

    // Update profile mutation
    const updateProfileMutation = useMutation({
        mutationFn: (data) => api.updateProfile(data),
        onSuccess: (res) => {
            toast.success('Profil mis à jour avec succès !');
            setIsEditingProfile(false);
            // Invalidate profile query to refresh userProfile in App
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            // Force re-fetch profile in App.jsx by triggering a page-level refresh
            window.dispatchEvent(new Event('profile-updated'));
        },
        onError: (err) => {
            toast.error(err.response?.data?.detail || "Erreur lors de la mise à jour.");
        }
    });

    const handleProfileSubmit = (e) => {
        e.preventDefault();
        updateProfileMutation.mutate(profileForm);
    };

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

                {/* Right Column */}
                <div className="md:col-span-2 space-y-8">
                    {/* Personal Info */}
                    <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
                        <CardHeader className="p-8 pb-0 flex flex-row items-center justify-between">
                            <CardTitle className="text-xl font-bold flex items-center gap-3">
                                <User className="h-5 w-5 text-primary" />
                                Informations personnelles
                            </CardTitle>
                            {!isEditingProfile ? (
                                <Button
                                    variant="outline"
                                    className="rounded-xl border-gray-200 gap-2"
                                    onClick={() => {
                                        setProfileForm({
                                            first_name: userProfile?.first_name || '',
                                            last_name: userProfile?.last_name || '',
                                            email: userProfile?.email || '',
                                        });
                                        setIsEditingProfile(true);
                                    }}
                                >
                                    <Pencil className="h-4 w-4" />
                                    Modifier
                                </Button>
                            ) : null}
                        </CardHeader>
                        <CardContent className="p-8">
                            {isEditingProfile ? (
                                <form onSubmit={handleProfileSubmit} className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">Prénom</label>
                                            <Input
                                                value={profileForm.first_name}
                                                onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">Nom</label>
                                            <Input
                                                value={profileForm.last_name}
                                                onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Email</label>
                                        <Input
                                            type="email"
                                            value={profileForm.email}
                                            onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="flex gap-3 pt-4 border-t border-gray-50 mt-6">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            className="rounded-xl gap-2"
                                            onClick={() => setIsEditingProfile(false)}
                                        >
                                            <X className="h-4 w-4" />
                                            Annuler
                                        </Button>
                                        <Button
                                            type="submit"
                                            className="bg-primary text-white rounded-xl px-8 shadow-lg shadow-primary/20 gap-2"
                                            disabled={updateProfileMutation.isPending}
                                        >
                                            <Check className="h-4 w-4" />
                                            {updateProfileMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                                        </Button>
                                    </div>
                                </form>
                            ) : (
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Prénom</p>
                                        <p className="font-semibold text-gray-900">{userProfile?.first_name || '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Nom</p>
                                        <p className="font-semibold text-gray-900">{userProfile?.last_name || '—'}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Email</p>
                                        <p className="font-semibold text-gray-900">{userProfile?.email || '—'}</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Security */}
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
                                <p className="text-gray-500 text-sm">
                                    Il est recommandé de changer votre mot de passe régulièrement pour assurer la sécurité de vos données.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

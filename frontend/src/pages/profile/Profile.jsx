import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
    User, Users, Lock, Mail, Shield, Camera, Pencil, Check, X,
    Upload, Phone, Calendar as CalendarIcon, MapPin,
    Briefcase, CreditCard, ChevronRight, Globe
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cn, getMediaUrl } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function Profile() {
    const { userProfile } = useOutletContext();
    const queryClient = useQueryClient();

    // Sections state
    const [activeSection, setActiveSection] = useState('personal');

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
        first_name: '',
        last_name: '',
        email: '',
        position: '',
        phone: '',
        date_of_birth: '',
        gender: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        postal_code: '',
        country: '',
    });

    // Sync form with userProfile
    useEffect(() => {
        if (userProfile) {
            setProfileForm({
                first_name: userProfile.first_name || '',
                last_name: userProfile.last_name || '',
                email: userProfile.email || '',
                position: userProfile.employee_profile?.position || '',
                phone: userProfile.employee_profile?.phone || '',
                date_of_birth: userProfile.employee_profile?.date_of_birth || '',
                gender: userProfile.employee_profile?.gender || '',
                address_line1: userProfile.employee_profile?.address_line1 || '',
                address_line2: userProfile.employee_profile?.address_line2 || '',
                city: userProfile.employee_profile?.city || '',
                state: userProfile.employee_profile?.state || '',
                postal_code: userProfile.employee_profile?.postal_code || '',
                country: userProfile.employee_profile?.country || '',
            });
        }
    }, [userProfile]);

    const fullName = userProfile?.first_name
        ? `${userProfile.first_name} ${userProfile.last_name || ''}`
        : userProfile?.username;

    const roleName = userProfile?.organizations?.[0]?.role || 'Employé';
    const roleLabels = {
        'owner': 'Propriétaire',
        'admin': 'Administrateur',
        'manager': 'Manager',
        'employee': 'Employé'
    };

    // Update profile mutation
    const updateProfileMutation = useMutation({
        mutationFn: (data) => api.updateProfile(data),
        onSuccess: () => {
            toast.success('Profil mis à jour avec succès !');
            setIsEditingProfile(false);
            queryClient.invalidateQueries({ queryKey: ['profile'] });
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

    // Upload photo mutation
    const uploadPhotoMutation = useMutation({
        mutationFn: (file) => {
            const formData = new FormData();
            formData.append('photo', file);
            return api.uploadPhoto(formData);
        },
        onSuccess: () => {
            toast.success('Photo de profil mise à jour !');
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            window.dispatchEvent(new Event('profile-updated'));
        },
        onError: () => toast.error("Erreur lors de l'upload de la photo.")
    });

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            uploadPhotoMutation.mutate(file);
        }
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

    const sections = [
        { id: 'personal', label: 'Profil Personnel', icon: User },
        { id: 'address', label: 'Adresse & Contact', icon: MapPin },
        { id: 'professional', label: 'Carrière', icon: Briefcase },
        { id: 'security', label: 'Sécurité', icon: Lock },
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header with Glass Effect */}
            <div className="relative p-8 rounded-[2.5rem] bg-gradient-to-r from-primary to-primary/80 text-white shadow-2xl overflow-hidden">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />

                <div className="relative flex flex-col md:flex-row items-center gap-8">
                    <div className="relative group">
                        <div className="h-32 w-32 rounded-[2rem] overflow-hidden border-4 border-white/20 shadow-2xl bg-white/10 backdrop-blur-md">
                            <img
                                src={getMediaUrl(userProfile?.employee_profile?.profile_photo) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userProfile?.username || 'User'}`}
                                alt={fullName}
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                        </div>
                        <label className="absolute -bottom-2 -right-2 p-3 bg-white text-primary rounded-2xl shadow-xl cursor-pointer hover:bg-gray-50 transition-all hover:scale-110 active:scale-95 group-hover:rotate-6">
                            <Camera className="h-5 w-5" />
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handlePhotoChange}
                                disabled={uploadPhotoMutation.isPending}
                            />
                        </label>
                        {uploadPhotoMutation.isPending && (
                            <div className="absolute inset-0 bg-black/40 rounded-[2rem] flex items-center justify-center backdrop-blur-sm">
                                <div className="h-10 w-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
                            </div>
                        )}
                    </div>

                    <div className="text-center md:text-left flex-1">
                        <div className="inline-flex items-center px-3 py-1 bg-white/20 backdrop-blur-md text-white text-[10px] font-black rounded-full mb-3 uppercase tracking-[0.2em]">
                            {roleLabels[roleName] || roleName}
                        </div>
                        <h1 className="text-4xl font-black tracking-tight">{fullName}</h1>
                        <p className="text-white/80 font-medium mt-1 flex items-center justify-center md:justify-start gap-2">
                            <Briefcase className="h-4 w-4" />
                            {userProfile?.employee_profile?.position || 'Poste non défini'}
                        </p>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-6">
                            <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-2xl flex items-center gap-2 text-sm">
                                <Mail className="h-4 w-4 text-emerald-300" />
                                {userProfile?.email}
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-2xl flex items-center gap-2 text-sm">
                                <Phone className="h-4 w-4 text-emerald-300" />
                                {userProfile?.employee_profile?.phone || 'Non renseigné'}
                            </div>
                        </div>
                    </div>

                    <div className="hidden lg:grid grid-cols-2 gap-4">
                        <div className="bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/10 text-center">
                            <div className="text-2xl font-black">{userProfile?.employee_profile?.annual_leave_days || 0}</div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-white/60">Congés annuels</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/10 text-center">
                            <div className="text-2xl font-black">{userProfile?.employee_profile?.sick_leave_days || 0}</div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-white/60">Maladie</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Navigation Menu */}
                <div className="lg:col-span-1">
                    <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden p-3">
                        <div className="space-y-1">
                            {sections.map(section => (
                                <button
                                    key={section.id}
                                    onClick={() => {
                                        setActiveSection(section.id);
                                        setIsEditingProfile(false);
                                        setIsChangingPassword(false);
                                    }}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-bold transition-all duration-300 group",
                                        activeSection === section.id
                                            ? "bg-primary text-white shadow-lg shadow-primary/20"
                                            : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                    )}
                                >
                                    <section.icon className={cn(
                                        "h-5 w-5 transition-transform duration-300 group-hover:scale-110",
                                        activeSection === section.id ? "text-white" : "text-gray-400 group-hover:text-primary"
                                    )} />
                                    {section.label}
                                    {activeSection === section.id && (
                                        <ChevronRight className="ml-auto h-4 w-4 animate-in slide-in-from-left-2" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Content Area */}
                <div className="lg:col-span-3">
                    <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden min-h-[500px]">
                        <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-2xl font-black text-gray-900 tracking-tight">
                                    {sections.find(s => s.id === activeSection)?.label}
                                </CardTitle>
                                <p className="text-sm text-gray-500 mt-1 font-medium">
                                    {activeSection === 'personal' && "Vos informations d'identité de base."}
                                    {activeSection === 'address' && "Coordonnées et adresse de résidence."}
                                    {activeSection === 'professional' && "Détails de votre contrat et poste."}
                                    {activeSection === 'security' && "Gérez votre mot de passe et vos accès."}
                                </p>
                            </div>

                            {activeSection !== 'professional' && activeSection !== 'security' && !isEditingProfile && (
                                <Button
                                    variant="outline"
                                    className="rounded-2xl h-12 px-6 border-gray-100 bg-gray-50 hover:bg-gray-100 font-bold gap-2"
                                    onClick={() => setIsEditingProfile(true)}
                                >
                                    <Pencil className="h-4 w-4" />
                                    Modifier
                                </Button>
                            )}
                        </CardHeader>

                        <CardContent className="p-8">
                            {/* Personal Info Content */}
                            {activeSection === 'personal' && (
                                isEditingProfile ? (
                                    <form onSubmit={handleProfileSubmit} className="space-y-6 animate-in fade-in duration-500">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Prénom</label>
                                                <Input
                                                    className="h-14 rounded-2xl border-none bg-gray-50 font-bold focus:ring-4 focus:ring-primary/10 transition-all"
                                                    value={profileForm.first_name}
                                                    onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Nom</label>
                                                <Input
                                                    className="h-14 rounded-2xl border-none bg-gray-50 font-bold focus:ring-4 focus:ring-primary/10 transition-all"
                                                    value={profileForm.last_name}
                                                    onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Email professionnel</label>
                                            <Input
                                                type="email"
                                                className="h-14 rounded-2xl border-none bg-gray-50 font-bold focus:ring-4 focus:ring-primary/10 transition-all"
                                                value={profileForm.email}
                                                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                                                required
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Genre</label>
                                                <select
                                                    className="w-full h-14 rounded-2xl border-none bg-gray-50 px-4 font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-none appearance-none cursor-pointer"
                                                    value={profileForm.gender}
                                                    onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                                                >
                                                    <option value="">Non spécifié</option>
                                                    <option value="M">Homme</option>
                                                    <option value="F">Femme</option>
                                                    <option value="O">Autre</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Date de naissance</label>
                                                <Input
                                                    type="date"
                                                    className="h-14 rounded-2xl border-none bg-gray-50 font-bold focus:ring-4 focus:ring-primary/10 transition-all"
                                                    value={profileForm.date_of_birth}
                                                    onChange={(e) => setProfileForm({ ...profileForm, date_of_birth: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex gap-4 pt-6">
                                            <Button type="button" variant="ghost" className="h-14 flex-1 rounded-2xl font-bold" onClick={() => setIsEditingProfile(false)}>Annuler</Button>
                                            <Button type="submit" className="h-14 flex-1 rounded-2xl font-bold bg-primary text-white shadow-xl shadow-primary/20" disabled={updateProfileMutation.isPending}>
                                                {updateProfileMutation.isPending ? "Enregistrement..." : "Sauvegarder les modifications"}
                                            </Button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in duration-500">
                                        <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 group hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm transition-transform group-hover:scale-110">
                                                    <User className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prénom & Nom</p>
                                                    <p className="text-base font-bold text-slate-900 mt-0.5">{fullName}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 group hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm transition-transform group-hover:scale-110">
                                                    <Mail className="h-5 w-5" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Pro</p>
                                                    <p className="text-base font-bold text-slate-900 mt-0.5 truncate">{userProfile?.email}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 group hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600 shadow-sm transition-transform group-hover:scale-110">
                                                    <Users className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Genre</p>
                                                    <p className="text-base font-bold text-slate-900 mt-0.5">
                                                        {userProfile?.employee_profile?.gender === 'M' ? 'Homme' :
                                                            userProfile?.employee_profile?.gender === 'F' ? 'Femme' :
                                                                userProfile?.employee_profile?.gender === 'O' ? 'Autre' : 'Non spécifié'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 group hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 lg:col-span-2">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 shadow-sm transition-transform group-hover:scale-110">
                                                    <CalendarIcon className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date de Naissance</p>
                                                    <p className="text-base font-bold text-slate-900 mt-0.5">
                                                        {userProfile?.employee_profile?.date_of_birth ? format(new Date(userProfile.employee_profile.date_of_birth), 'dd MMMM yyyy', { locale: fr }) : 'Non spécifiée'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            )}

                            {/* Address Content */}
                            {activeSection === 'address' && (
                                isEditingProfile ? (
                                    <form onSubmit={handleProfileSubmit} className="space-y-6 animate-in fade-in duration-500">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Téléphone</label>
                                            <Input
                                                className="h-14 rounded-2xl border-none bg-gray-50 font-bold focus:ring-4 focus:ring-primary/10 transition-all"
                                                value={profileForm.phone}
                                                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                                                placeholder="+33 6 12 34 56 78"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Adresse Ligne 1</label>
                                            <Input
                                                className="h-14 rounded-2xl border-none bg-gray-50 font-bold focus:ring-4 focus:ring-primary/10 transition-all"
                                                value={profileForm.address_line1}
                                                onChange={(e) => setProfileForm({ ...profileForm, address_line1: e.target.value })}
                                                placeholder="15 Rue du Commerce"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Ville</label>
                                                <Input
                                                    className="h-14 rounded-2xl border-none bg-gray-50 font-bold focus:ring-4 focus:ring-primary/10 transition-all"
                                                    value={profileForm.city}
                                                    onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                                                    placeholder="Paris"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Code Postal</label>
                                                <Input
                                                    className="h-14 rounded-2xl border-none bg-gray-50 font-bold focus:ring-4 focus:ring-primary/10 transition-all"
                                                    value={profileForm.postal_code}
                                                    onChange={(e) => setProfileForm({ ...profileForm, postal_code: e.target.value })}
                                                    placeholder="75000"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Pays</label>
                                            <Input
                                                className="h-14 rounded-2xl border-none bg-gray-50 font-bold focus:ring-4 focus:ring-primary/10 transition-all"
                                                value={profileForm.country}
                                                onChange={(e) => setProfileForm({ ...profileForm, country: e.target.value })}
                                                placeholder="France"
                                            />
                                        </div>
                                        <div className="flex gap-4 pt-6">
                                            <Button type="button" variant="ghost" className="h-14 flex-1 rounded-2xl font-bold" onClick={() => setIsEditingProfile(false)}>Annuler</Button>
                                            <Button type="submit" className="h-14 flex-1 rounded-2xl font-bold bg-primary text-white shadow-xl shadow-primary/20" disabled={updateProfileMutation.isPending}>
                                                Sauvegarder
                                            </Button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-500">
                                        <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 group hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm transition-transform group-hover:scale-110">
                                                    <Phone className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Téléphone</p>
                                                    <p className="text-base font-bold text-slate-900 mt-0.5">{userProfile?.employee_profile?.phone || 'Non renseigné'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 group hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-2xl bg-sky-100 flex items-center justify-center text-sky-600 shadow-sm transition-transform group-hover:scale-110">
                                                    <Globe className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pays</p>
                                                    <p className="text-base font-bold text-slate-900 mt-0.5">{userProfile?.employee_profile?.country || 'Non renseigné'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 group hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 md:col-span-2">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 shadow-sm transition-transform group-hover:scale-110">
                                                    <MapPin className="h-5 w-5" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Adresse de Résidence</p>
                                                    <p className="text-lg font-black text-slate-900 mt-0.5">
                                                        {userProfile?.employee_profile?.address_line1 || 'Aucune adresse enregistrée'}
                                                        {userProfile?.employee_profile?.address_line2 && `, ${userProfile.employee_profile.address_line2}`}
                                                    </p>
                                                    <p className="text-sm font-bold text-slate-500">
                                                        {userProfile?.employee_profile?.postal_code} {userProfile?.employee_profile?.city}
                                                        {userProfile?.employee_profile?.state && `, ${userProfile.employee_profile.state}`}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            )}

                            {/* Professional Content */}
                            {activeSection === 'professional' && (
                                <div className="space-y-6 animate-in fade-in duration-500">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 group hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                                                    <Briefcase className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID Employé</p>
                                                    <p className="text-base font-black text-slate-900 mt-0.5">#{userProfile?.employee_profile?.employee_id || '---'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 group hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-sm transition-transform group-hover:scale-110">
                                                    <CalendarIcon className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date d'embauche</p>
                                                    <p className="text-base font-bold text-slate-900 mt-0.5">
                                                        {userProfile?.employee_profile?.hire_date ? format(new Date(userProfile.employee_profile.hire_date), 'dd MMMM yyyy', { locale: fr }) : '---'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 group hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-sm transition-transform group-hover:scale-110">
                                                    <CalendarIcon className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ancienneté</p>
                                                    <p className="text-base font-bold text-slate-900 mt-0.5">
                                                        {userProfile?.employee_profile?.hire_date ? Math.floor((new Date() - new Date(userProfile.employee_profile.hire_date)) / (1000 * 60 * 60 * 24 * 365)) : 0} ans
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 group hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-sm transition-transform group-hover:scale-110">
                                                    <CreditCard className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contrat</p>
                                                    <p className="text-base font-bold text-slate-900 mt-0.5">CDI Temps Plein</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 group hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 lg:col-span-2">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center shadow-sm transition-transform group-hover:scale-110">
                                                    <Shield className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rôle Système</p>
                                                    <p className="text-base font-bold text-slate-900 mt-0.5">{roleLabels[roleName] || roleName}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Note administrative</p>
                                        <p className="text-xs text-slate-500 leading-relaxed italic">
                                            "Certaines informations professionnelles ne sont modifiables que par le département RH. Contactez votre manager pour toute correction."
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Security Content */}
                            {activeSection === 'security' && (
                                <div className="space-y-8 animate-in fade-in duration-500">
                                    <div className="p-8 bg-orange-50 rounded-[2rem] border border-orange-100 flex gap-6 items-center">
                                        <div className="h-16 w-16 min-w-[4rem] rounded-2xl bg-white shadow-sm flex items-center justify-center text-orange-500">
                                            <Shield className="h-8 w-8" />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-black text-orange-900">Sécurité du Compte</h4>
                                            <p className="text-orange-700/70 text-sm font-medium">Nous vous recommandons de changer votre mot de passe tous les 90 jours.</p>
                                        </div>
                                    </div>

                                    {!isChangingPassword ? (
                                        <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
                                            <div className="h-24 w-24 rounded-[2rem] bg-gray-50 flex items-center justify-center text-gray-300">
                                                <Lock className="h-10 w-10" />
                                            </div>
                                            <div className="max-w-xs">
                                                <h3 className="text-xl font-black text-gray-900">Mot de passe</h3>
                                                <p className="text-gray-500 text-sm mt-2">Dernière mise à jour : il y a 3 mois</p>
                                            </div>
                                            <Button
                                                className="h-14 px-8 rounded-2xl font-black bg-gray-900 text-white shadow-xl shadow-gray-200"
                                                onClick={() => setIsChangingPassword(true)}
                                            >
                                                Changer mon mot de passe
                                            </Button>
                                        </div>
                                    ) : (
                                        <form onSubmit={handlePasswordChange} className="space-y-6 animate-in slide-in-from-bottom-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Ancien mot de passe</label>
                                                <Input
                                                    type="password"
                                                    className="h-14 rounded-2xl border-none bg-gray-50 font-bold focus:ring-4 focus:ring-primary/10 transition-all"
                                                    value={passwordData.old_password}
                                                    onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Nouveau mot de passe</label>
                                                    <Input
                                                        type="password"
                                                        className="h-14 rounded-2xl border-none bg-gray-50 font-bold focus:ring-4 focus:ring-primary/10 transition-all"
                                                        value={passwordData.new_password}
                                                        onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Confirmer le nouveau</label>
                                                    <Input
                                                        type="password"
                                                        className="h-14 rounded-2xl border-none bg-gray-50 font-bold focus:ring-4 focus:ring-primary/10 transition-all"
                                                        value={passwordData.confirm_password}
                                                        onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex gap-4 pt-6">
                                                <Button type="button" variant="ghost" className="h-14 flex-1 rounded-2xl font-bold" onClick={() => setIsChangingPassword(false)}>Annuler</Button>
                                                <Button type="submit" className="h-14 flex-1 rounded-2xl font-bold bg-gray-900 text-white shadow-xl shadow-gray-200">
                                                    Confirmer le changement
                                                </Button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

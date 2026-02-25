import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Building2, Save, Globe, Phone, Mail, MapPin, Camera, CheckCircle2, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function Settings() {
    const queryClient = useQueryClient()

    // Fetch organizations
    const { data: organizations, isLoading } = useQuery({
        queryKey: ['organizations'],
        queryFn: async () => {
            const res = await api.getOrganizations()
            return res.data.results || res.data
        }
    })

    const organization = organizations?.[0]

    const [formData, setFormData] = useState({
        name: '',
        slogan: '',
        address: '',
        phone: '',
        email: '',
        website: '',
    })

    useEffect(() => {
        if (organization) {
            setFormData({
                name: organization.name || '',
                slogan: organization.slogan || '',
                address: organization.address || '',
                phone: organization.phone || '',
                email: organization.email || '',
                website: organization.website || '',
            })
        }
    }, [organization])

    const updateMutation = useMutation({
        mutationFn: (data) => api.patchOrganization(organization.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organizations'] })
            toast.success('Paramètres de l\'organisation mis à jour !')
        },
        onError: (err) => {
            toast.error(err.response?.data?.detail || 'Erreur lors de la mise à jour')
        }
    })

    const handleSubmit = (e) => {
        e.preventDefault()
        updateMutation.mutate(formData)
    }

    const handleLogoUpload = (e) => {
        const file = e.target.files[0]
        if (file) {
            const data = new FormData()
            data.append('logo', file)
            updateMutation.mutate(data)
        }
    }

    if (isLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
        )
    }

    if (!organization) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <AlertCircle className="h-12 w-12 text-orange-400 mb-4" />
                <h3 className="text-xl font-bold text-gray-900">Organisation non trouvée</h3>
                <p className="text-gray-500 mt-2">Impossible de charger les paramètres de l'organisation.</p>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Paramètres Organisation</h1>
                    <p className="text-gray-500 mt-1">Gérez l'identité et les informations de votre entreprise</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Logo & Identity */}
                <div className="space-y-6">
                    <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
                        <CardContent className="p-8 flex flex-col items-center text-center">
                            <div className="relative group">
                                <div className="h-32 w-32 rounded-3xl overflow-hidden border-4 border-white shadow-xl bg-gray-50 flex items-center justify-center">
                                    {organization.logo ? (
                                        <img
                                            src={organization.logo.startsWith('http') ? organization.logo : `http://localhost:8000${organization.logo}`}
                                            alt={organization.name}
                                            className="h-full w-full object-contain p-4"
                                        />
                                    ) : (
                                        <Building2 className="h-12 w-12 text-gray-300" />
                                    )}
                                </div>
                                <label className="absolute -bottom-2 -right-2 p-3 bg-primary text-white rounded-2xl shadow-lg cursor-pointer hover:bg-primary/90 transition-all hover:scale-110">
                                    <Camera className="h-5 w-5" />
                                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                                </label>
                            </div>
                            <div className="mt-6">
                                <h2 className="text-xl font-extrabold text-gray-900">{organization.name}</h2>
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">#{organization.slug || 'org-id'}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm rounded-[2rem] bg-slate-900 text-white overflow-hidden relative">
                        <CardContent className="p-8 relative z-10">
                            <h3 className="text-sm font-black uppercase tracking-widest text-white/50 mb-4 text-center">Visibilité</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/10">
                                    <Globe className="h-5 w-5 text-emerald-400" />
                                    <div>
                                        <p className="text-xs font-bold text-white/40 uppercase">Site Web</p>
                                        <p className="text-sm font-bold truncate max-w-[160px]">{organization.website || 'Pas de site'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/10">
                                    <Mail className="h-5 w-5 text-blue-400" />
                                    <div>
                                        <p className="text-xs font-bold text-white/40 uppercase">Email Contact</p>
                                        <p className="text-sm font-bold truncate max-w-[160px]">{organization.email || 'Pas d\'email'}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        {/* Abstract background */}
                        <div className="absolute inset-0 opacity-10 pointer-events-none">
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full blur-3xl" />
                            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-emerald-500 rounded-full blur-3xl" />
                        </div>
                    </Card>
                </div>

                {/* Configuration Form */}
                <div className="lg:col-span-2">
                    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] bg-white overflow-hidden">
                        <CardHeader className="p-8 pb-0">
                            <CardTitle className="text-xl font-black text-gray-900 flex items-center gap-3 uppercase tracking-tight">
                                <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Save className="h-4 w-4 text-primary" />
                                </div>
                                Informations Générales
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Nom de l'organisation</label>
                                        <Input
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                            className="h-14 rounded-2xl border-none bg-gray-50 focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Slogan / Devise</label>
                                        <Input
                                            value={formData.slogan}
                                            onChange={(e) => setFormData({ ...formData, slogan: e.target.value })}
                                            className="h-14 rounded-2xl border-none bg-gray-50 focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-bold"
                                            placeholder="Ex: L'innovation au service de l'humain"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Téléphone</label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
                                            <Input
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                className="h-14 pl-12 rounded-2xl border-none bg-gray-50 focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-bold"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Email Professionnel</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
                                            <Input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                required
                                                className="h-14 pl-12 rounded-2xl border-none bg-gray-50 focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-bold"
                                            />
                                        </div>
                                    </div>
                                    <div className="col-span-full space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Site Web</label>
                                        <div className="relative">
                                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
                                            <Input
                                                value={formData.website}
                                                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                                className="h-14 pl-12 rounded-2xl border-none bg-gray-50 focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-bold"
                                                placeholder="https://www.exemple.com"
                                            />
                                        </div>
                                    </div>
                                    <div className="col-span-full space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Adresse Siège Social</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
                                            <textarea
                                                value={formData.address}
                                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                className="w-full min-h-[100px] pl-12 pr-4 py-4 rounded-2xl border-none bg-gray-50 focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-bold resize-none"
                                                placeholder="Rue, Ville, Code Postal, Pays"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 flex justify-end">
                                    <Button
                                        type="submit"
                                        className="h-14 px-10 rounded-2xl bg-primary text-white font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                                        disabled={updateMutation.isPending}
                                    >
                                        {updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer les modifications'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

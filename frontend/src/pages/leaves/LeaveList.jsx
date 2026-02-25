import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useOutletContext } from 'react-router-dom'
import { Plus, Search, Calendar, CheckCircle2, XCircle, Clock, Filter, ChevronRight, X, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import Modal from '@/components/ui/modal'
import { api } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function LeaveList() {
    const { userProfile } = useOutletContext()
    const queryClient = useQueryClient()

    // Tabs & modals
    const [activeTab, setActiveTab] = useState('my')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
    const [selectedLeave, setSelectedLeave] = useState(null)
    const [rejectionReason, setRejectionReason] = useState('')

    // Filters state
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [typeFilter, setTypeFilter] = useState('all')
    const [monthFilter, setMonthFilter] = useState('all')

    // Form state
    const [formData, setFormData] = useState({
        leave_type: '',
        start_date: '',
        end_date: '',
        reason: ''
    })

    // Role detection
    const isAdmin = userProfile?.is_superuser || userProfile?.is_staff
    const userRole = userProfile?.organizations?.[0]?.role
    const isManager = userRole === 'admin' || userRole === 'manager' || userRole === 'owner' || isAdmin

    // Fetch Leave Types
    const { data: leaveTypes } = useQuery({
        queryKey: ['leave-types'],
        queryFn: async () => {
            const res = await api.getLeaveTypes()
            return res.data.results || res.data
        }
    })

    // Fetch Leave Requests
    const { data: leaves, isLoading } = useQuery({
        queryKey: ['leaves', activeTab, userProfile?.id],
        queryFn: async () => {
            const params = activeTab === 'my' ? { role: 'my_requests' } : { role: 'to_approve' }
            const response = await api.getLeaveRequests(params)
            return response.data.results || response.data
        },
    })

    // Client-side filtering
    const filtered = useMemo(() => {
        if (!leaves) return []
        return leaves.filter(leave => {
            // Search
            const q = search.toLowerCase()
            const matchSearch = !q ||
                leave.employee_detail?.full_name?.toLowerCase().includes(q) ||
                leave.leave_type_detail?.name?.toLowerCase().includes(q) ||
                leave.reason?.toLowerCase().includes(q)

            // Status
            const matchStatus = statusFilter === 'all' || leave.status === statusFilter

            // Type
            const matchType = typeFilter === 'all' || String(leave.leave_type) === typeFilter

            // Month
            let matchMonth = true
            if (monthFilter !== 'all') {
                const leaveMonth = leave.start_date?.slice(0, 7) // "YYYY-MM"
                matchMonth = leaveMonth === monthFilter
            }

            return matchSearch && matchStatus && matchType && matchMonth
        })
    }, [leaves, search, statusFilter, typeFilter, monthFilter])

    // Status counters
    const counters = useMemo(() => {
        if (!leaves) return { all: 0, pending: 0, approved: 0, rejected: 0 }
        return {
            all: leaves.length,
            pending: leaves.filter(l => l.status === 'pending').length,
            approved: leaves.filter(l => l.status === 'approved').length,
            rejected: leaves.filter(l => l.status === 'rejected').length,
        }
    }, [leaves])

    // Month options from existing leaves
    const monthOptions = useMemo(() => {
        if (!leaves) return []
        const months = [...new Set(leaves.map(l => l.start_date?.slice(0, 7)).filter(Boolean))]
        return months.sort().reverse().map(m => {
            const [y, mo] = m.split('-')
            const d = new Date(parseInt(y), parseInt(mo) - 1, 1)
            return { value: m, label: format(d, 'MMMM yyyy', { locale: fr }) }
        })
    }, [leaves])

    const hasActiveFilters = statusFilter !== 'all' || typeFilter !== 'all' || monthFilter !== 'all' || search

    const clearFilters = () => {
        setSearch('')
        setStatusFilter('all')
        setTypeFilter('all')
        setMonthFilter('all')
    }

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data) => api.createLeaveRequest(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leaves'] })
            setIsModalOpen(false)
            toast.success("Demande envoyée avec succès !")
            setFormData({ leave_type: '', start_date: '', end_date: '', reason: '' })
        },
        onError: (err) => {
            const errorData = err.response?.data
            if (errorData) {
                const firstError = Object.values(errorData)[0]
                const msg = Array.isArray(firstError) ? firstError[0] : (typeof firstError === 'string' ? firstError : errorData.detail || "Erreur lors de l'envoi")
                toast.error(msg)
            } else {
                toast.error("Erreur de connexion au serveur")
            }
        }
    })

    const approveMutation = useMutation({
        mutationFn: (id) => api.approveLeaveRequest(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leaves'] })
            toast.success("Demande approuvée")
        },
        onError: (err) => toast.error(err.response?.data?.error || "Erreur lors de l'approbation")
    })

    const rejectMutation = useMutation({
        mutationFn: ({ id, reason }) => api.rejectLeaveRequest(id, { reason }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leaves'] })
            setIsRejectModalOpen(false)
            toast.success("Demande rejetée")
            setRejectionReason('')
        },
        onError: (err) => toast.error(err.response?.data?.error || "Erreur lors du rejet")
    })

    const getStatusConfig = (status) => {
        switch (status) {
            case 'approved': return { color: "text-green-600 bg-green-50", label: "Approuvé" }
            case 'rejected': return { color: "text-red-600 bg-red-50", label: "Rejeté" }
            case 'pending': return { color: "text-orange-600 bg-orange-50", label: "En attente" }
            default: return { color: "text-gray-600 bg-gray-50", label: status }
        }
    }

    const handleCreateRequest = (e) => {
        e.preventDefault()
        if (new Date(formData.end_date) < new Date(formData.start_date)) {
            toast.error("La date de fin ne peut pas être avant la date de début.")
            return
        }
        createMutation.mutate(formData)
    }

    if (isLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Gestion des Congés</h1>
                    <p className="text-gray-500 mt-1">
                        {activeTab === 'team' ? "Validez les absences de votre équipe" : "Suivez vos demandes et vos soldes"}
                    </p>
                </div>
                <div className="flex gap-3">
                    {isManager && (
                        <Button
                            variant="outline"
                            onClick={async () => {
                                try {
                                    const params = activeTab === 'my' ? { role: 'my_requests' } : { role: 'to_approve' }
                                    const response = await api.exportLeaves({
                                        ...params,
                                        status: statusFilter !== 'all' ? statusFilter : undefined,
                                        leave_type: typeFilter !== 'all' ? typeFilter : undefined,
                                    })
                                    const url = window.URL.createObjectURL(new Blob([response.data]))
                                    const link = document.createElement('a')
                                    link.href = url
                                    link.setAttribute('download', `conges_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`)
                                    document.body.appendChild(link)
                                    link.click()
                                    link.remove()
                                    toast.success("Exportation réussie !")
                                } catch (error) {
                                    toast.error("Erreur lors de l'exportation")
                                }
                            }}
                            className="bg-white border-gray-200 text-gray-700 rounded-2xl h-12 px-6"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Exporter
                        </Button>
                    )}
                    <Button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-primary hover:bg-primary/90 text-white rounded-2xl h-12 px-8 shadow-xl shadow-primary/20"
                    >
                        <Plus className="mr-2 h-5 w-5" />
                        Nouvelle demande
                    </Button>
                </div>
            </div>

            {/* Tabs for Manager */}
            {isManager && (
                <div className="flex p-1.5 bg-gray-100/50 rounded-2xl w-fit border border-gray-100">
                    {[
                        { key: 'my', label: 'Mes Demandes' },
                        { key: 'team', label: 'Équipe à Valider' }
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={cn(
                                "px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200",
                                activeTab === tab.key
                                    ? "bg-white text-primary shadow-sm ring-1 ring-gray-950/5"
                                    : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Status Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { key: 'all', label: 'Toutes', color: 'bg-gray-50 text-gray-700 border-gray-100', activeColor: 'bg-gray-900 text-white border-gray-900' },
                    { key: 'pending', label: 'En attente', color: 'bg-orange-50 text-orange-700 border-orange-100', activeColor: 'bg-orange-500 text-white border-orange-500' },
                    { key: 'approved', label: 'Approuvées', color: 'bg-green-50 text-green-700 border-green-100', activeColor: 'bg-green-600 text-white border-green-600' },
                    { key: 'rejected', label: 'Rejetées', color: 'bg-red-50 text-red-700 border-red-100', activeColor: 'bg-red-500 text-white border-red-500' },
                ].map(s => (
                    <button
                        key={s.key}
                        onClick={() => setStatusFilter(s.key)}
                        className={cn(
                            "flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 text-left",
                            statusFilter === s.key ? s.activeColor : s.color + ' hover:opacity-80'
                        )}
                    >
                        <span className="text-sm font-bold">{s.label}</span>
                        <span className="text-2xl font-black">{counters[s.key]}</span>
                    </button>
                ))}
            </div>

            {/* Filters Row */}
            <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <Input
                        placeholder={activeTab === 'team' ? "Rechercher un employé..." : "Rechercher un motif ou type..."}
                        className="w-full pl-12 h-12 rounded-xl border-none bg-white shadow-sm focus:ring-2 focus:ring-primary/20"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {/* Type filter */}
                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="h-12 pl-9 pr-4 rounded-xl border-none bg-white shadow-sm text-sm font-medium text-gray-700 focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer appearance-none min-w-[160px]"
                    >
                        <option value="all">Tous les types</option>
                        {leaveTypes?.map(t => (
                            <option key={t.id} value={String(t.id)}>{t.name}</option>
                        ))}
                    </select>
                </div>

                {/* Month filter */}
                {monthOptions.length > 0 && (
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <select
                            value={monthFilter}
                            onChange={(e) => setMonthFilter(e.target.value)}
                            className="h-12 pl-9 pr-4 rounded-xl border-none bg-white shadow-sm text-sm font-medium text-gray-700 focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer appearance-none min-w-[160px]"
                        >
                            <option value="all">Toutes les périodes</option>
                            {monthOptions.map(m => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Clear filters */}
                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        onClick={clearFilters}
                        className="h-12 rounded-xl text-gray-500 hover:text-gray-700 gap-2 whitespace-nowrap"
                    >
                        <X className="h-4 w-4" />
                        Réinitialiser
                    </Button>
                )}
            </div>

            {/* Results count */}
            {hasActiveFilters && (
                <p className="text-sm text-gray-500">
                    <span className="font-bold text-gray-900">{filtered.length}</span> résultat{filtered.length !== 1 ? 's' : ''} sur {leaves?.length || 0}
                </p>
            )}

            {/* Leaves List */}
            <Card className="border-none shadow-xl shadow-gray-200/50 rounded-[2rem] bg-white overflow-hidden">
                <CardContent className="p-0">
                    {filtered.length > 0 ? (
                        <div className="divide-y divide-gray-50">
                            {filtered.map((leave) => {
                                const status = getStatusConfig(leave.status)
                                return (
                                    <div key={leave.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between hover:bg-gray-50/50 transition-all group">
                                        <div className="flex items-center gap-5">
                                            <div className={cn(
                                                "h-14 w-14 rounded-2xl flex items-center justify-center font-bold transition-transform group-hover:scale-110 duration-300",
                                                leave.status === 'approved' ? "bg-green-100 text-green-600" :
                                                    leave.status === 'rejected' ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"
                                            )}>
                                                <Calendar className="h-7 w-7" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <div className="font-extrabold text-gray-900 text-xl tracking-tight">
                                                        {activeTab === 'team' ? (
                                                            <div className="flex flex-col">
                                                                <span>{leave.employee_detail?.full_name || "Inconnu"}</span>
                                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">#{leave.employee_detail?.employee_id || "ID-?"}</span>
                                                            </div>
                                                        ) : (
                                                            leave.leave_type_detail?.name || "Congé"
                                                        )}
                                                    </div>
                                                    <div className={cn("px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-black", status.color)}>
                                                        {status.label}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 text-sm text-gray-500 mt-1.5 font-medium flex-wrap">
                                                    {activeTab === 'team' && (
                                                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                                            {leave.leave_type_detail?.name}
                                                        </span>
                                                    )}
                                                    <span className="text-primary font-bold">{leave.total_days} jours</span>
                                                    <span>•</span>
                                                    <span>Du {format(new Date(leave.start_date), 'dd MMM')} au {format(new Date(leave.end_date), 'dd MMM yyyy')}</span>
                                                </div>
                                                {leave.reason && (
                                                    <p className="text-sm text-gray-400 mt-1.5 italic line-clamp-1 max-w-md">
                                                        "{leave.reason}"
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 mt-4 md:mt-0">
                                            {activeTab === 'team' && leave.status === 'pending' ? (
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => approveMutation.mutate(leave.id)}
                                                        className="bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-lg shadow-green-200"
                                                        disabled={approveMutation.isPending}
                                                    >
                                                        Approuver
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => { setSelectedLeave(leave); setIsRejectModalOpen(true) }}
                                                        className="text-red-600 border-red-200 hover:bg-red-50 rounded-xl"
                                                    >
                                                        Rejeter
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="rounded-xl hover:bg-gray-100 group/btn"
                                                    onClick={() => { setSelectedLeave(leave); setIsDetailModalOpen(true) }}
                                                >
                                                    Détails
                                                    <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="bg-gray-50 p-6 rounded-[2rem] mb-6">
                                <Calendar className="h-12 w-12 text-gray-300" />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                                {hasActiveFilters ? 'Aucun résultat' : 'Aucun congé trouvé'}
                            </h3>
                            <p className="text-gray-500 mt-2 max-w-xs font-medium">
                                {hasActiveFilters
                                    ? "Essayez de modifier vos filtres."
                                    : activeTab === 'team'
                                        ? "Toutes les demandes ont été traitées."
                                        : "Vous n'avez pas encore soumis de demande."}
                            </p>
                            {hasActiveFilters && (
                                <Button variant="outline" onClick={clearFilters} className="mt-4 rounded-xl">
                                    Réinitialiser les filtres
                                </Button>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modal: Nouvelle Demande */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Demande de Congé"
                description="Prévoyez vos prochaines absences et congés payés"
                maxWidth="max-w-xl"
            >
                <form onSubmit={handleCreateRequest} className="space-y-6">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Type de congé</label>
                        <select
                            required
                            className="w-full h-12 rounded-2xl border-transparent bg-slate-50/50 px-4 text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                            value={formData.leave_type}
                            onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
                        >
                            <option value="">Sélectionner un type...</option>
                            {leaveTypes?.map(type => (
                                <option key={type.id} value={type.id}>{type.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Date de début</label>
                            <Input
                                type="date"
                                required
                                className="h-12 rounded-2xl bg-slate-50/50 border-transparent focus:bg-white font-bold"
                                value={formData.start_date}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Date de fin</label>
                            <Input
                                type="date"
                                required
                                className="h-12 rounded-2xl bg-slate-50/50 border-transparent focus:bg-white font-bold"
                                value={formData.end_date}
                                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Motif (Optionnel)</label>
                        <textarea
                            className="w-full rounded-2xl border-transparent bg-slate-50/50 p-4 text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none min-h-[100px] resize-none"
                            placeholder="Raison de votre absence..."
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1 h-12 rounded-2xl font-bold text-slate-400">
                            Annuler
                        </Button>
                        <Button type="submit" className="flex-[2] h-12 rounded-2xl bg-slate-900 text-white shadow-xl shadow-slate-200 font-black" disabled={createMutation.isPending}>
                            {createMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Envoyer la demande"}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Modal: Rejet */}
            <Modal
                isOpen={isRejectModalOpen}
                onClose={() => setIsRejectModalOpen(false)}
                title="Rejeter la demande"
                description={`Action requise pour ${selectedLeave?.employee_detail?.full_name}`}
                maxWidth="max-w-md"
            >
                <div className="space-y-6">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-rose-400 uppercase ml-1">Raison du rejet</label>
                        <textarea
                            className="w-full rounded-2xl border-transparent bg-rose-50/50 p-4 text-sm font-bold text-rose-900 focus:bg-white focus:ring-2 focus:ring-rose-200 transition-all outline-none min-h-[120px] resize-none"
                            placeholder="Indiquez ici pourquoi cette demande ne peut être acceptée..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-3">
                        <Button variant="ghost" onClick={() => setIsRejectModalOpen(false)} className="flex-1 h-12 rounded-2xl font-bold text-slate-400">
                            Annuler
                        </Button>
                        <Button
                            onClick={() => rejectMutation.mutate({ id: selectedLeave.id, reason: rejectionReason })}
                            className="flex-[2] h-12 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white shadow-xl shadow-rose-100 font-black"
                            disabled={!rejectionReason || rejectMutation.isPending}
                        >
                            {rejectMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Confirmer le rejet"}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Modal: Détails */}
            <Modal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                title="Détails du Congé"
                description="Récapitulatif complet de la demande"
                maxWidth="max-w-xl"
            >
                {selectedLeave && (
                    <div className="space-y-8">
                        <div className="flex items-center justify-between p-6 bg-slate-50/50 rounded-[2rem] border border-slate-100">
                            <div className="flex items-center gap-5">
                                <div className={cn(
                                    "h-16 w-16 rounded-[1.5rem] flex items-center justify-center shadow-inner",
                                    selectedLeave.status === 'approved' ? "bg-green-100 text-green-600" :
                                        selectedLeave.status === 'rejected' ? "bg-rose-100 text-rose-600" : "bg-orange-100 text-orange-600"
                                )}>
                                    <Calendar className="h-8 w-8" />
                                </div>
                                <div>
                                    <h4 className="font-black text-slate-900 text-xl tracking-tight">{selectedLeave.leave_type_detail?.name}</h4>
                                    <div className={cn("inline-flex items-center px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.2em] font-black mt-1.5 shadow-sm", getStatusConfig(selectedLeave.status).color)}>
                                        {getStatusConfig(selectedLeave.status).label}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-3xl font-black text-slate-900 tracking-tighter">{selectedLeave.total_days}</div>
                                <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Jours</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8 px-2">
                            <div className="space-y-1.5">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Demandeur</span>
                                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                                    <p className="font-black text-slate-900 text-sm">{selectedLeave.employee_detail?.full_name}</p>
                                    <p className="text-[10px] text-slate-400 font-mono font-bold mt-0.5">#{selectedLeave.employee_detail?.employee_id}</p>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Période</span>
                                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                                    <p className="font-black text-slate-900 text-sm">
                                        {format(new Date(selectedLeave.start_date), 'dd MMM')} → {format(new Date(selectedLeave.end_date), 'dd MMM yyyy')}
                                    </p>
                                    <p className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-tighter">Dates d'absence</p>
                                </div>
                            </div>
                        </div>

                        {selectedLeave.reason && (
                            <div className="space-y-1.5 px-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Note / Motif</span>
                                <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100/50 text-slate-700 italic text-sm leading-relaxed font-medium">
                                    "{selectedLeave.reason}"
                                </div>
                            </div>
                        )}

                        {selectedLeave.status === 'rejected' && (
                            <div className="space-y-1.5 px-2">
                                <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-1">Raison du rejet</span>
                                <div className="bg-rose-50/30 p-5 rounded-2xl border border-rose-100/30 text-rose-700 font-bold text-sm leading-relaxed">
                                    {selectedLeave.rejection_reason || "Aucune raison spécifiée."}
                                </div>
                            </div>
                        )}

                        {selectedLeave.status === 'approved' && selectedLeave.approved_by_detail && (
                            <div className="mx-2 flex items-center gap-3 px-5 py-4 bg-emerald-50/30 rounded-[1.5rem] border border-emerald-100/30">
                                <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
                                    <CheckCircle2 className="h-5 w-5" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Validé par</span>
                                    <span className="text-sm font-black text-emerald-700">{selectedLeave.approved_by_detail.full_name}</span>
                                </div>
                            </div>
                        )}

                        <Button
                            variant="ghost"
                            onClick={() => setIsDetailModalOpen(false)}
                            className="w-full h-14 rounded-2xl font-black text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            Fermer
                        </Button>
                    </div>
                )}
            </Modal>
        </div>
    )
}

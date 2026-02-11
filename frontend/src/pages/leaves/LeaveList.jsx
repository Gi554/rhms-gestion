import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useOutletContext } from 'react-router-dom'
import { Plus, Search, Calendar, CheckCircle2, XCircle, Clock, Filter, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import Modal from '@/components/ui/modal'
import { api } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { format } from 'date-fns'

export default function LeaveList() {
    const { userProfile } = useOutletContext()
    const queryClient = useQueryClient()
    const [activeTab, setActiveTab] = useState('my') // 'my' or 'team'
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
    const [selectedLeave, setSelectedLeave] = useState(null)
    const [rejectionReason, setRejectionReason] = useState('')

    // Form state for new request
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
    const { data: leaves, isLoading, error } = useQuery({
        queryKey: ['leaves', activeTab, userProfile?.id],
        queryFn: async () => {
            const params = activeTab === 'my' ? { role: 'my_requests' } : { role: 'to_approve' }
            const response = await api.getLeaveRequests(params)
            return response.data.results || response.data
        },
    })

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
            const errorData = err.response?.data;
            if (errorData) {
                // Extraire le premier message d'erreur qu'on trouve
                const firstError = Object.values(errorData)[0];
                const msg = Array.isArray(firstError) ? firstError[0] : (typeof firstError === 'string' ? firstError : errorData.detail || "Erreur lors de l'envoi");
                toast.error(msg);
            } else {
                toast.error("Erreur de connexion au serveur");
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
            case 'approved': return { color: "text-green-600 bg-green-50", icon: CheckCircle2, label: "Approuvé" }
            case 'rejected': return { color: "text-red-600 bg-red-50", icon: XCircle, label: "Rejeté" }
            case 'pending': return { color: "text-orange-600 bg-orange-50", icon: Clock, label: "En attente" }
            default: return { color: "text-gray-600 bg-gray-50", icon: parsed => null, label: status }
        }
    }

    const getApprovalMessage = (leave) => {
        if (leave.status !== 'pending') return null;

        const isUserRequest = leave.employee === userProfile?.employee_profile?.id;

        if (isUserRequest) {
            if (userRole === 'manager') {
                return "En attente de l'Administrateur";
            }
            return "En attente du Manager ou Admin";
        }
        return null;
    }

    const handleCreateRequest = (e) => {
        e.preventDefault()

        if (new Date(formData.end_date) < new Date(formData.start_date)) {
            toast.error("La date de fin ne peut pas être avant la date de début.");
            return;
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
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Gestion des Congés</h1>
                    <p className="text-gray-500 mt-1">
                        {activeTab === 'team' ? "Validez les absences de votre équipe" : "Suivez vos demandes et vos soldes"}
                    </p>
                </div>
                <Button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-primary hover:bg-primary/90 text-white rounded-2xl h-12 px-8 shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    <Plus className="mr-2 h-5 w-5" />
                    Nouvelle demande
                </Button>
            </div>

            {/* Tabs for Manager */}
            {isManager && (
                <div className="flex p-1.5 bg-gray-100/50 rounded-2xl w-fit border border-gray-100">
                    <button
                        onClick={() => setActiveTab('my')}
                        className={cn(
                            "px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200",
                            activeTab === 'my'
                                ? "bg-white text-primary shadow-sm ring-1 ring-gray-950/5"
                                : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        Mes Demandes
                    </button>
                    <button
                        onClick={() => setActiveTab('team')}
                        className={cn(
                            "px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200",
                            activeTab === 'team'
                                ? "bg-white text-primary shadow-sm ring-1 ring-gray-950/5"
                                : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        Équipe à Valider
                    </button>
                </div>
            )}

            {/* Search Bar */}
            <div className="relative group">
                <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
                <Input
                    placeholder={activeTab === 'team' ? "Rechercher un employé..." : "Rechercher un motif..."}
                    className="w-full pl-14 h-16 rounded-[1.25rem] border-none bg-white shadow-sm focus:ring-4 focus:ring-primary/10 text-lg placeholder:text-gray-400"
                />
            </div>

            {/* Leaves List */}
            <Card className="border-none shadow-xl shadow-gray-200/50 rounded-[2rem] bg-white overflow-hidden">
                <CardContent className="p-0">
                    {leaves && leaves.length > 0 ? (
                        <div className="divide-y divide-gray-50">
                            {leaves.map((leave) => {
                                const status = getStatusConfig(leave.status)
                                const StatusIcon = status.icon

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
                                                <div className="flex items-center gap-3">
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
                                                <div className="flex items-center gap-3 text-sm text-gray-500 mt-1.5 font-medium">
                                                    {activeTab === 'team' && (
                                                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                                            {leave.leave_type_detail?.name}
                                                        </span>
                                                    )}
                                                    <span className="text-primary font-bold">{leave.total_days} jours</span>
                                                    <span>•</span>
                                                    <span>Du {format(new Date(leave.start_date), 'dd MMM')} au {format(new Date(leave.end_date), 'dd MMM yyyy')}</span>
                                                </div>
                                                {getApprovalMessage(leave) && (
                                                    <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-orange-500 uppercase tracking-wide">
                                                        <Clock className="h-3 w-3" />
                                                        {getApprovalMessage(leave)}
                                                    </div>
                                                )}
                                                {leave.reason && (
                                                    <p className="text-sm text-gray-400 mt-2 italic line-clamp-1 max-w-md">
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
                                                        onClick={() => {
                                                            setSelectedLeave(leave)
                                                            setIsRejectModalOpen(true)
                                                        }}
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
                                                    onClick={() => {
                                                        setSelectedLeave(leave)
                                                        setIsDetailModalOpen(true)
                                                    }}
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
                            <div className="bg-gray-50 p-6 rounded-[2rem] mb-6 animate-pulse">
                                <Calendar className="h-12 w-12 text-gray-300" />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Aucun congé trouvé</h3>
                            <p className="text-gray-500 mt-2 max-w-xs font-medium">
                                {activeTab === 'team'
                                    ? "Toutes les demandes ont été traitées ou l'équipe est au complet."
                                    : "Vous n'avez pas encore soumis de demande de congé."}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modal: Nouvelle Demande */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Demande de Congé"
            >
                <form onSubmit={handleCreateRequest} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 ml-1">Type de congé</label>
                        <select
                            required
                            className="w-full h-14 rounded-2xl border-gray-100 bg-gray-50 px-4 text-gray-900 focus:ring-4 focus:ring-primary/10 transition-all outline-none"
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
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 ml-1">Date de début</label>
                            <Input
                                type="date"
                                required
                                className="h-14 rounded-2xl bg-gray-50 border-none"
                                value={formData.start_date}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 ml-1">Date de fin</label>
                            <Input
                                type="date"
                                required
                                className="h-14 rounded-2xl bg-gray-50 border-none"
                                value={formData.end_date}
                                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 ml-1">Motif (Optionnel)</label>
                        <textarea
                            className="w-full rounded-2xl border-gray-100 bg-gray-50 p-4 text-gray-900 focus:ring-4 focus:ring-primary/10 transition-all outline-none min-h-[100px]"
                            placeholder="Raison de votre absence..."
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 h-14 rounded-2xl"
                        >
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 h-14 rounded-2xl bg-primary text-white shadow-lg shadow-primary/20"
                            disabled={createMutation.isPending}
                        >
                            {createMutation.isPending ? "Envoi..." : "Envoyer la demande"}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Modal: Rejet */}
            <Modal
                isOpen={isRejectModalOpen}
                onClose={() => setIsRejectModalOpen(false)}
                title="Motif du rejet"
            >
                <div className="space-y-6">
                    <p className="text-gray-500 font-medium">
                        Veuillez indiquer pourquoi la demande de <span className="font-bold text-gray-900">{selectedLeave?.employee_detail?.full_name}</span> est rejetée.
                    </p>
                    <textarea
                        className="w-full rounded-2xl border-gray-100 bg-gray-50 p-4 text-gray-900 focus:ring-4 focus:ring-primary/10 transition-all outline-none min-h-[120px]"
                        placeholder="Ex: Besoin de personnel cette semaine-là..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                    />
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setIsRejectModalOpen(false)}
                            className="flex-1 h-14 rounded-2xl"
                        >
                            Annuler
                        </Button>
                        <Button
                            onClick={() => rejectMutation.mutate({ id: selectedLeave.id, reason: rejectionReason })}
                            className="flex-1 h-14 rounded-2xl bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200"
                            disabled={!rejectionReason || rejectMutation.isPending}
                        >
                            Confirmer le rejet
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Modal: Détails du Congé */}
            <Modal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                title="Détails de la demande"
            >
                {selectedLeave && (
                    <div className="space-y-8">
                        {/* Header Status */}
                        <div className="flex items-center justify-between p-6 bg-gray-50 rounded-[2rem]">
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "h-16 w-16 rounded-2xl flex items-center justify-center",
                                    selectedLeave.status === 'approved' ? "bg-green-100 text-green-600" :
                                        selectedLeave.status === 'rejected' ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"
                                )}>
                                    <Calendar className="h-8 w-8" />
                                </div>
                                <div>
                                    <h4 className="font-black text-gray-900 text-xl tracking-tight">
                                        {selectedLeave.leave_type_detail?.name}
                                    </h4>
                                    <div className={cn(
                                        "inline-flex items-center px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-black mt-1",
                                        getStatusConfig(selectedLeave.status).color
                                    )}>
                                        {getStatusConfig(selectedLeave.status).label}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-black text-primary">{selectedLeave.total_days}</div>
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Jours</div>
                            </div>
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-2 gap-6 px-2">
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Demandeur</span>
                                <p className="font-bold text-gray-900 flex flex-col pt-1">
                                    <span>{selectedLeave.employee_detail?.full_name}</span>
                                    <span className="text-[10px] text-gray-400 font-medium tracking-normal mt-0.5 font-mono opacity-80 uppercase">#{selectedLeave.employee_detail?.employee_id}</span>
                                </p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Période</span>
                                <p className="font-bold text-gray-900 pt-1">
                                    {format(new Date(selectedLeave.start_date), 'dd MMM')} → {format(new Date(selectedLeave.end_date), 'dd MMM yyyy')}
                                </p>
                            </div>
                        </div>

                        {/* Reason Section */}
                        <div className="space-y-2 px-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Motif du collaborateur</span>
                            <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50 text-gray-700 italic text-sm leading-relaxed">
                                "{selectedLeave.reason || "Aucun motif fourni"}"
                            </div>
                        </div>

                        {/* Rejection/Approval Details */}
                        {selectedLeave.status === 'rejected' && (
                            <div className="space-y-2 px-2 animate-in slide-in-from-top-2 duration-300">
                                <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Raison du rejet</span>
                                <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100/50 text-red-700 font-medium text-sm leading-relaxed">
                                    {selectedLeave.rejection_reason || "Aucune raison spécifiée par le responsable."}
                                </div>
                            </div>
                        )}

                        {selectedLeave.status === 'approved' && selectedLeave.approved_by_detail && (
                            <div className="flex items-center gap-2 px-2 py-3 bg-green-50/30 rounded-2xl border border-green-100/30">
                                <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                                    <CheckCircle2 className="h-4 w-4" />
                                </div>
                                <span className="text-sm font-medium text-green-700">
                                    Approuvé par <span className="font-bold">{selectedLeave.approved_by_detail.full_name}</span>
                                </span>
                            </div>
                        )}

                        <Button
                            variant="outline"
                            onClick={() => setIsDetailModalOpen(false)}
                            className="w-full h-14 rounded-2xl border-gray-100 bg-gray-50/50 hover:bg-gray-100 transition-colors"
                        >
                            Fermer
                        </Button>
                    </div>
                )}
            </Modal>
        </div>
    )
}

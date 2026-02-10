import { useQuery } from '@tanstack/react-query'
import { Plus, Search, Calendar, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { api } from '@/lib/api-client'
import { cn } from '@/lib/utils'

export default function LeaveList() {
    const { data: leaves, isLoading, error } = useQuery({
        queryKey: ['leaves'],
        queryFn: async () => {
            const response = await api.getLeaveRequests()
            return response.data.results || response.data
        },
    })

    const getStatusConfig = (status) => {
        switch (status) {
            case 'approved': return { color: "text-green-600 bg-green-50", icon: CheckCircle2, label: "Approuvé" }
            case 'rejected': return { color: "text-red-600 bg-red-50", icon: XCircle, label: "Rejeté" }
            case 'pending': return { color: "text-orange-600 bg-orange-50", icon: Clock, label: "En attente" }
            default: return { color: "text-gray-600 bg-gray-50", icon: parsed => null, label: status }
        }
    }

    if (isLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-6 text-center">
                <div className="text-red-500 mb-2">Une erreur est survenue</div>
                <div className="text-sm text-gray-500">{error.message}</div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Demandes de Congés</h1>
                    <p className="text-gray-500 mt-1">
                        Gérez et validez les absences de vos équipes
                    </p>
                </div>
                <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl h-11 px-6 shadow-lg shadow-primary/20">
                    <Plus className="mr-2 h-4 w-4" />
                    Nouvelle demande
                </Button>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                    placeholder="Rechercher par employé..."
                    className="w-full pl-12 h-14 rounded-2xl border-none bg-white shadow-sm focus:ring-2 focus:ring-primary/20 text-base"
                />
            </div>

            {/* Leaves List */}
            <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
                <CardContent className="p-0">
                    {leaves && leaves.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                            {leaves.map((leave) => {
                                const status = getStatusConfig(leave.status)
                                const StatusIcon = status.icon

                                return (
                                    <div key={leave.id} className="p-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors group cursor-pointer">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-500 font-bold">
                                                <Calendar className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900 text-lg">{leave.employee_name || "Employé"}</div>
                                                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                                    <span className="font-medium text-primary">{leave.leave_type_name || leave.leave_type}</span>
                                                    <span>•</span>
                                                    <span>{leave.total_days} jours</span>
                                                    <span>•</span>
                                                    <span>Du {leave.start_date} au {leave.end_date}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium", status.color)}>
                                                {StatusIcon && <StatusIcon className="h-4 w-4" />}
                                                {status.label}
                                            </div>
                                            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                Voir détails
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="bg-gray-50 p-4 rounded-full mb-4">
                                <Calendar className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">Aucune demande</h3>
                            <p className="text-gray-500 mt-1 max-w-sm">Toutes les demandes de congés ont été traitées ou aucune n'a été soumise.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

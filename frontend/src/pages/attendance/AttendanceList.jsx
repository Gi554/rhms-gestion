import { useQuery } from '@tanstack/react-query'
import { Calendar as CalendarIcon, Clock, Filter, Search, Download, MoreHorizontal, User } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useOutletContext } from 'react-router-dom'

export default function AttendanceList() {
    const { userProfile } = useOutletContext()

    // Roles
    const isAdmin = userProfile?.is_superuser || userProfile?.is_staff
    const userRole = userProfile?.organizations?.[0]?.role
    console.log("DEBUG - User Profile:", userProfile)
    console.log("DEBUG - User Role:", userRole)
    const isManager = userRole === 'admin' || userRole === 'manager' || userRole === 'owner' || isAdmin
    console.log("DEBUG - Is Manager:", isManager)

    const { data: attendances, isLoading } = useQuery({
        queryKey: ['attendance-list', userProfile?.id, isManager],
        queryFn: async () => {
            // Si manager/admin, on récupère tout, sinon juste les siennes
            const params = isManager ? {} : { role: 'my_attendance' }
            const res = await api.getAttendances(params)
            return res.data.results || res.data
        }
    })

    if (isLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                        {isManager ? "Présences Globales" : "Mes Présences"}
                    </h1>
                    <p className="text-gray-500 mt-1">
                        {isManager
                            ? "Suivi des entrées et sorties de toute l'organisation."
                            : "Consultez votre historique de pointage et vos heures travaillées."}
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="rounded-xl h-11 bg-white border-gray-200">
                        <Download className="mr-2 h-4 w-4" />
                        Exporter
                    </Button>
                    <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl h-11 px-6 shadow-lg shadow-primary/20">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        Calendrier
                    </Button>
                </div>
            </div>

            {/* Filters Wrap */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <Input
                        placeholder="Rechercher une date, un employé ou un statut..."
                        className="w-full pl-12 h-12 rounded-xl border-none bg-white shadow-sm focus:ring-2 focus:ring-primary/20"
                    />
                </div>
                <Button variant="outline" className="rounded-xl h-12 bg-white border-gray-200 px-6">
                    <Filter className="mr-2 h-4 w-4" />
                    Filtrer par mois
                </Button>
            </div>

            {/* Attendance Table */}
            <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Employé / Date</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Pointage</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Heures</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {attendances?.map((attendance) => (
                                    <tr key={attendance.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors">
                                                    {isManager ? <User className="h-5 w-5" /> : <CalendarIcon className="h-5 w-5" />}
                                                </div>
                                                <div>
                                                    {isManager && (
                                                        <div className="text-sm font-bold text-gray-900 leading-none mb-1">
                                                            {attendance.employee_detail?.full_name || "Inconnu"}
                                                        </div>
                                                    )}
                                                    <div className={cn("text-gray-500 capitalize", isManager ? "text-[10px] font-medium" : "font-bold text-gray-900")}>
                                                        {format(new Date(attendance.date), "EEEE d MMMM", { locale: fr })}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase">Arrivée</span>
                                                    <span className="text-sm font-bold text-gray-700">{attendance.check_in || '--:--'}</span>
                                                </div>
                                                <div className="h-4 w-px bg-gray-100" />
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase">Départ</span>
                                                    <span className="text-sm font-bold text-gray-700">{attendance.check_out || '--:--'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-primary" />
                                                <span className="font-bold text-gray-900">{parseFloat(attendance.hours_worked).toFixed(1)}h</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={cn(
                                                "px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full",
                                                attendance.status === 'present' ? "bg-emerald-100 text-emerald-700" :
                                                    attendance.status === 'late' ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"
                                            )}>
                                                {attendance.status === 'present' ? 'Présent' :
                                                    attendance.status === 'late' ? 'En retard' : 'Absent'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-primary hover:bg-primary/5 rounded-full">
                                                <MoreHorizontal className="h-5 w-5" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {!attendances?.length && (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                                            Aucun enregistrement trouvé pour cette période.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

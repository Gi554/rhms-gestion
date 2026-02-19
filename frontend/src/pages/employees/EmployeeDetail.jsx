import { useQuery } from '@tanstack/react-query'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import {
    Clock, CheckCircle2, XCircle, AlertCircle, Briefcase, Hash,
    ShieldCheck, TrendingUp, ChevronRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function EmployeeDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { userProfile } = useOutletContext()

    // Fetch employee detail
    const { data: employee, isLoading: empLoading } = useQuery({
        queryKey: ['employee', id],
        queryFn: async () => {
            const res = await api.getEmployee(id)
            return res.data
        }
    })

    // Fetch employee's attendance (current month)
    const now = new Date()
    const { data: attendances } = useQuery({
        queryKey: ['employee-attendance', id, now.getMonth()],
        queryFn: async () => {
            const res = await api.getAttendances({
                employee: id,
                date__year: now.getFullYear(),
                date__month: now.getMonth() + 1
            })
            return res.data.results || res.data
        },
        enabled: !!id
    })

    // Fetch employee's leave requests
    const { data: leaves } = useQuery({
        queryKey: ['employee-leaves', id],
        queryFn: async () => {
            const res = await api.getLeaveRequests({ employee: id })
            return res.data.results || res.data
        },
        enabled: !!id
    })

    const getStatusBadge = (status) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-700'
            case 'on_leave': return 'bg-blue-100 text-blue-700'
            case 'inactive': return 'bg-gray-100 text-gray-700'
            case 'terminated': return 'bg-red-100 text-red-700'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    const getStatusLabel = (status) => {
        switch (status) {
            case 'active': return 'Actif'
            case 'on_leave': return 'En congé'
            case 'inactive': return 'Inactif'
            case 'terminated': return 'Licencié'
            default: return status
        }
    }

    const totalHours = attendances
        ? attendances.reduce((sum, a) => sum + (parseFloat(a.hours_worked) || 0), 0).toFixed(1)
        : 0

    const presentDays = attendances
        ? attendances.filter(a => a.status === 'present').length
        : 0

    if (empLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
        )
    }

    if (!employee) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
                <AlertCircle className="h-12 w-12 text-gray-300" />
                <p className="text-gray-500">Employé introuvable.</p>
                <Button variant="outline" onClick={() => navigate('/employees')} className="rounded-xl">
                    Retour à la liste
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Back button + Header */}
            <div className="flex items-start gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/employees')}
                    className="rounded-xl h-10 w-10 mt-1 hover:bg-gray-100"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                        {employee.first_name} {employee.last_name}
                    </h1>
                    <p className="text-gray-500 mt-1">{employee.position} · {employee.department_detail?.name || 'Non assigné'}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Profile Card */}
                <div className="space-y-6">
                    <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
                        <CardContent className="p-8 flex flex-col items-center text-center">
                            <div className="h-28 w-28 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-primary text-3xl font-bold">
                                {employee.profile_photo ? (
                                    <img src={employee.profile_photo} alt={employee.full_name} className="h-full w-full object-cover" />
                                ) : (
                                    <span>{employee.first_name?.[0]}{employee.last_name?.[0]}</span>
                                )}
                            </div>
                            <div className="mt-4">
                                <h2 className="text-xl font-bold text-gray-900">{employee.full_name}</h2>
                                <p className="text-sm text-primary font-medium mt-1">{employee.position}</p>
                                <span className={cn("inline-flex items-center px-3 py-1 rounded-full text-xs font-bold mt-3", getStatusBadge(employee.status))}>
                                    {getStatusLabel(employee.status)}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contact & Info */}
                    <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold text-gray-500 uppercase tracking-widest">Informations</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3 text-sm">
                                <Hash className="h-4 w-4 text-gray-400 shrink-0" />
                                <span className="font-mono font-bold text-gray-700">{employee.employee_id}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                                <span className="text-gray-600 truncate">{employee.email}</span>
                            </div>
                            {employee.phone && (
                                <div className="flex items-center gap-3 text-sm">
                                    <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                                    <span className="text-gray-600">{employee.phone}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-3 text-sm">
                                <Building2 className="h-4 w-4 text-gray-400 shrink-0" />
                                <span className="text-gray-600">{employee.department_detail?.name || 'Non assigné'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
                                <span className="text-gray-600">
                                    Embauché le {employee.hire_date ? format(new Date(employee.hire_date), 'dd MMMM yyyy', { locale: fr }) : '—'}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Briefcase className="h-4 w-4 text-gray-400 shrink-0" />
                                <span className="text-gray-600 capitalize">{employee.employment_type || '—'}</span>
                            </div>

                            {employee.manager_detail && (
                                <div
                                    className="flex items-center gap-3 text-sm cursor-pointer hover:bg-slate-50 p-2 -m-2 rounded-xl transition-colors"
                                    onClick={() => navigate(`/employees/${employee.manager_detail.id}`)}
                                >
                                    <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Manager Direct</span>
                                        <span className="text-gray-900 font-bold">{employee.manager_detail.full_name}</span>
                                    </div>
                                    <ChevronRight className="h-3 w-3 text-slate-300 ml-auto" />
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Hierarchy Stats */}
                    {employee.subordinates_count > 0 && (
                        <Card className="border-none shadow-sm rounded-3xl bg-slate-900 overflow-hidden">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-[1rem] bg-white/10 flex items-center justify-center text-white">
                                        <Users className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-black text-white">{employee.subordinates_count}</div>
                                        <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Subordonnés directs</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* This month stats */}
                    <Card className="border-none shadow-sm rounded-3xl bg-[#032f20] overflow-hidden">
                        <CardContent className="p-6 space-y-4">
                            <p className="text-xs font-bold text-white/50 uppercase tracking-widest">Ce mois-ci</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-3xl font-bold text-white">{totalHours}h</div>
                                    <div className="text-xs text-white/50 mt-1">Heures travaillées</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-white">{presentDays}</div>
                                    <div className="text-xs text-white/50 mt-1">Jours présents</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Attendance History */}
                    <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
                        <CardHeader className="p-6 pb-0">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Clock className="h-5 w-5 text-primary" />
                                Présences — {format(now, 'MMMM yyyy', { locale: fr })}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 mt-4">
                            {attendances && attendances.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50/50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Arrivée</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Départ</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Durée</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {attendances.slice(0, 10).map(a => (
                                                <tr key={a.id} className="hover:bg-gray-50/50">
                                                    <td className="px-6 py-3 text-sm font-medium text-gray-700 capitalize">
                                                        {format(new Date(a.date), 'EEE d MMM', { locale: fr })}
                                                    </td>
                                                    <td className="px-6 py-3 text-sm text-gray-600">{a.check_in || '--:--'}</td>
                                                    <td className="px-6 py-3 text-sm text-gray-600">{a.check_out || '--:--'}</td>
                                                    <td className="px-6 py-3 text-sm font-bold text-gray-900">
                                                        {a.hours_worked ? `${parseFloat(a.hours_worked).toFixed(1)}h` : '--'}
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <span className={cn(
                                                            "px-2 py-1 text-xs font-bold rounded-full",
                                                            a.status === 'present' ? "bg-emerald-100 text-emerald-700" :
                                                                a.status === 'late' ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"
                                                        )}>
                                                            {a.status === 'present' ? 'Présent' : a.status === 'late' ? 'En retard' : 'Absent'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="py-10 text-center text-gray-400 text-sm">
                                    Aucune présence enregistrée ce mois-ci.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Leave History */}
                    <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
                        <CardHeader className="p-6 pb-0">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-primary" />
                                Historique des Congés
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 mt-4">
                            {leaves && leaves.length > 0 ? (
                                <div className="divide-y divide-gray-100">
                                    {leaves.slice(0, 8).map(leave => (
                                        <div key={leave.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50/50">
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "h-10 w-10 rounded-xl flex items-center justify-center",
                                                    leave.status === 'approved' ? "bg-green-100 text-green-600" :
                                                        leave.status === 'rejected' ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"
                                                )}>
                                                    {leave.status === 'approved' ? <CheckCircle2 className="h-5 w-5" /> :
                                                        leave.status === 'rejected' ? <XCircle className="h-5 w-5" /> :
                                                            <Clock className="h-5 w-5" />}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900 text-sm">{leave.leave_type_detail?.name}</div>
                                                    <div className="text-xs text-gray-500 mt-0.5">
                                                        {format(new Date(leave.start_date), 'dd MMM')} → {format(new Date(leave.end_date), 'dd MMM yyyy')}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-bold text-primary">{leave.total_days}j</span>
                                                <span className={cn(
                                                    "px-2 py-1 text-xs font-bold rounded-full",
                                                    leave.status === 'approved' ? "bg-green-100 text-green-700" :
                                                        leave.status === 'rejected' ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
                                                )}>
                                                    {leave.status === 'approved' ? 'Approuvé' : leave.status === 'rejected' ? 'Rejeté' : 'En attente'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-10 text-center text-gray-400 text-sm">
                                    Aucune demande de congé trouvée.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

import { useQuery } from '@tanstack/react-query'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import {
    Clock, CheckCircle2, XCircle, AlertCircle, Briefcase, Hash,
    ShieldCheck, TrendingUp, ChevronRight, ArrowLeft, Mail, Phone,
    Building2, Calendar, Users, MapPin, Cake, Globe, Fingerprint,
    CalendarCheck, Wallet
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
            case 'active': return 'bg-emerald-500/10 text-emerald-600'
            case 'on_leave': return 'bg-blue-500/10 text-blue-600'
            case 'inactive': return 'bg-slate-500/10 text-slate-600'
            case 'terminated': return 'bg-rose-500/10 text-rose-600'
            default: return 'bg-slate-500/10 text-slate-600'
        }
    }

    const getStatusLabel = (status) => {
        switch (status) {
            case 'active': return 'Actif'
            case 'on_leave': return 'En congé'
            case 'inactive': return 'Inactif'
            case 'terminated': return 'Terminé'
            default: return status
        }
    }

    const getRoleLabel = (role) => {
        switch (role) {
            case 'admin': return 'Administrateur'
            case 'manager': return 'Manager'
            case 'owner': return 'Propriétaire'
            default: return 'Employé'
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
                <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-primary border-t-transparent shadow-xl shadow-primary/20" />
            </div>
        )
    }

    if (!employee) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-6 animate-in fade-in zoom-in duration-500">
                <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center">
                    <AlertCircle className="h-10 w-10 text-slate-200" />
                </div>
                <div className="text-center">
                    <h3 className="text-xl font-black text-slate-900">Employé introuvable</h3>
                    <p className="text-slate-500 mt-2 max-w-[200px]">Le profil que vous recherchez n'existe pas ou a été supprimé.</p>
                </div>
                <Button variant="outline" onClick={() => navigate('/employees')} className="rounded-2xl px-8 h-12 font-bold hover:bg-slate-50 transition-all border-slate-200">
                    Retour à la liste
                </Button>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Banner Section */}
            <div className="relative p-8 rounded-[2.5rem] bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-2xl overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none transition-transform duration-700 group-hover:scale-110">
                    <ShieldCheck className="h-64 w-64" />
                </div>

                <div className="relative flex flex-col md:flex-row items-center gap-8">
                    <div className="relative">
                        <div className="h-32 w-32 rounded-[2rem] overflow-hidden border-4 border-white/20 shadow-2xl bg-white/10 flex items-center justify-center text-4xl font-black backdrop-blur-md">
                            {employee.profile_photo ? (
                                <img src={employee.profile_photo} alt={employee.full_name} className="h-full w-full object-cover" />
                            ) : (
                                <span>{employee.first_name?.[0]}{employee.last_name?.[0]}</span>
                            )}
                        </div>
                        <div className={cn(
                            "absolute -bottom-2 -right-2 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg border-2 border-[#0f172a]",
                            getStatusBadge(employee.status).split(' ')[0].replace('10', '100').replace('text', 'bg').replace('500', '600') + " text-white"
                        )}>
                            {getStatusLabel(employee.status)}
                        </div>
                    </div>

                    <div className="text-center md:text-left space-y-2">
                        <div className="flex flex-col md:flex-row md:items-center gap-3">
                            <h1 className="text-4xl font-black tracking-tight">{employee.full_name}</h1>
                            <span className="px-3 py-1 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10 text-[10px] font-bold uppercase tracking-widest text-primary-foreground/80 w-fit mx-auto md:mx-0">
                                {getRoleLabel(employee.role)}
                            </span>
                        </div>
                        <p className="text-slate-400 font-medium flex items-center justify-center md:justify-start gap-2">
                            <Briefcase className="h-4 w-4" />
                            {employee.position} · {employee.department_detail?.name || 'Direction'}
                        </p>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
                            <div className="flex items-center gap-2 text-sm text-slate-300">
                                <Mail className="h-4 w-4" />
                                {employee.email}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-300 border-l border-white/10 pl-4">
                                <Phone className="h-4 w-4" />
                                {employee.phone || 'Non renseigné'}
                            </div>
                        </div>
                    </div>

                    <div className="md:ml-auto flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => navigate('/employees')}
                            className="bg-white/5 border-white/10 hover:bg-white/10 text-white rounded-2xl px-6 h-12 font-bold backdrop-blur-sm"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Retour
                        </Button>
                        {(userProfile?.is_superuser || userProfile?.organizations?.[0]?.role === 'admin') && (
                            <Button className="bg-primary hover:bg-primary/90 text-white rounded-2xl px-8 h-12 font-black shadow-lg shadow-primary/20">
                                Modifier le profil
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Essential Details */}
                <div className="space-y-8">
                    {/* Employment Details */}
                    <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Carrière</h3>
                            <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                <Fingerprint className="h-5 w-5" />
                            </div>
                        </div>

                        <div className="space-y-5">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                    <Hash className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">ID Employé</p>
                                    <p className="font-mono font-black text-slate-900">{employee.employee_id}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                    <CalendarCheck className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Date d'entrée</p>
                                    <p className="font-bold text-slate-900">
                                        {employee.hire_date ? format(new Date(employee.hire_date), 'dd MMMM yyyy', { locale: fr }) : '—'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                                    <Briefcase className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Contrat</p>
                                    <p className="font-bold text-slate-900 capitalize">{employee.employment_type?.replace('_', ' ') || 'CDI'}</p>
                                </div>
                            </div>

                            {employee.manager_detail && (
                                <div
                                    className="flex items-center gap-4 group cursor-pointer p-2 -m-2 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100"
                                    onClick={() => navigate(`/employees/${employee.manager_detail.id}`)}
                                >
                                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                        <ShieldCheck className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Responsable</p>
                                        <p className="font-black text-slate-900">{employee.manager_detail.full_name}</p>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Contact & Personal */}
                    <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden p-6 space-y-6">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Informations Personnelles</h3>

                        <div className="space-y-5">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                    <Cake className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Date de naissance</p>
                                    <p className="font-bold text-slate-900">
                                        {employee.date_of_birth ? format(new Date(employee.date_of_birth), 'dd MMMM yyyy', { locale: fr }) : 'Non renseigné'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                    <MapPin className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Adresse</p>
                                    <p className="font-bold text-slate-900 text-sm leading-snug">
                                        {employee.address_line1 || '—'}<br />
                                        <span className="text-slate-500 font-medium">
                                            {employee.postal_code} {employee.city}{employee.country ? `, ${employee.country}` : ''}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Leave Balances */}
                    <Card className="border-none shadow-sm rounded-[2rem] bg-slate-900 overflow-hidden text-white relative">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Wallet className="h-20 w-20" />
                        </div>
                        <CardContent className="p-8 space-y-6 relative">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Compteur de congés</h3>
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <div className="text-3xl font-black">{employee.annual_leave_days}</div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase mt-1 tracking-tighter">Congés Payés</p>
                                </div>
                                <div>
                                    <div className="text-3xl font-black text-emerald-400">{employee.sick_leave_days}</div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase mt-1 tracking-tighter">Maladie</p>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-white/5">
                                <Button className="w-full bg-white/10 hover:bg-white/20 text-white rounded-xl h-10 text-xs font-bold border border-white/5">
                                    Historique complet
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Dynamic Data (Attendance, Leaves, Subordinates) */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Activity Stats for the month */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="border-none shadow-sm rounded-3xl bg-emerald-600 p-6 text-white overflow-hidden relative group">
                            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                                <Clock className="h-24 w-24" />
                            </div>
                            <p className="text-[10px] font-black uppercase text-emerald-100/50 tracking-widest">Heures travaillées</p>
                            <h4 className="text-4xl font-black mt-2">{totalHours}<span className="text-xl font-medium ml-1">h</span></h4>
                            <p className="text-xs font-bold text-emerald-100/80 mt-2">Mois de {format(now, 'MMMM', { locale: fr })}</p>
                        </Card>

                        <Card className="border-none shadow-sm rounded-3xl bg-blue-600 p-6 text-white overflow-hidden relative group">
                            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                                <Users className="h-24 w-24" />
                            </div>
                            <p className="text-[10px] font-black uppercase text-blue-100/50 tracking-widest">Présences</p>
                            <h4 className="text-4xl font-black mt-2">{presentDays}<span className="text-xl font-medium ml-1">j</span></h4>
                            <p className="text-xs font-bold text-blue-100/80 mt-2">Ponctualité : 98%</p>
                        </Card>

                        <Card className="border-none shadow-sm rounded-3xl bg-slate-100 p-6 text-slate-900 border border-slate-200">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Subordonnés</p>
                            <h4 className="text-4xl font-black mt-2">{employee.subordinates_count}</h4>
                            <p className="text-xs font-bold text-slate-500 mt-2">Équipe directe</p>
                        </Card>
                    </div>

                    {/* Attendance History */}
                    <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
                        <CardHeader className="p-8 pb-4">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-primary">
                                        <Clock className="h-5 w-5" />
                                    </div>
                                    Dernières Présences
                                </CardTitle>
                                <Button variant="ghost" className="text-xs font-bold text-primary hover:bg-primary/5 rounded-xl">
                                    Tout voir
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto px-4 pb-4">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                                            <th className="px-4 py-4 text-left font-black">Date</th>
                                            <th className="px-4 py-4 text-left font-black">Arrivée</th>
                                            <th className="px-4 py-4 text-left font-black">Départ</th>
                                            <th className="px-4 py-4 text-left font-black">Durée</th>
                                            <th className="px-4 py-4 text-left font-black">Statut</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {(attendances || []).slice(0, 5).map(a => (
                                            <tr key={a.id} className="group hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-4 text-sm font-bold text-slate-700 capitalize">
                                                    {format(new Date(a.date), 'EEEE d MMMM', { locale: fr })}
                                                </td>
                                                <td className="px-4 py-4 text-sm font-medium text-slate-500">{a.check_in || '--:--'}</td>
                                                <td className="px-4 py-4 text-sm font-medium text-slate-500">{a.check_out || '--:--'}</td>
                                                <td className="px-4 py-4 text-sm font-black text-slate-900">
                                                    {a.hours_worked ? `${parseFloat(a.hours_worked).toFixed(1)}h` : '--'}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className={cn(
                                                        "px-3 py-1 text-[10px] font-black uppercase tracking-tighter rounded-lg",
                                                        a.status === 'present' ? "bg-emerald-100 text-emerald-700" :
                                                            a.status === 'late' ? "bg-orange-100 text-orange-700" : "bg-rose-100 text-rose-700"
                                                    )}>
                                                        {a.status === 'present' ? 'Présent' : a.status === 'late' ? 'En retard' : 'Absent'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Leaves History */}
                    <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
                        <CardHeader className="p-8 pb-4">
                            <CardTitle className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-primary">
                                    <Calendar className="h-5 w-5" />
                                </div>
                                Derniers Congés
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-50">
                                {(leaves || []).slice(0, 5).map(leave => (
                                    <div key={leave.id} className="px-8 py-5 flex items-center justify-between group hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-5">
                                            <div className={cn(
                                                "h-12 w-12 rounded-2xl flex items-center justify-center border-2 border-white shadow-sm transition-transform group-hover:scale-110",
                                                leave.status === 'approved' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                    leave.status === 'rejected' ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-orange-50 text-orange-600 border-orange-100"
                                            )}>
                                                {leave.status === 'approved' ? <CheckCircle2 className="h-6 w-6" /> :
                                                    leave.status === 'rejected' ? <XCircle className="h-6 w-6" /> :
                                                        <Clock className="h-6 w-6" />}
                                            </div>
                                            <div>
                                                <div className="font-black text-slate-900">{leave.leave_type_detail?.name}</div>
                                                <div className="text-xs font-bold text-slate-400 mt-0.5">
                                                    {format(new Date(leave.start_date), 'dd MMM')} — {format(new Date(leave.end_date), 'dd MMM yyyy')}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <div className="text-lg font-black text-primary">{leave.total_days}j</div>
                                                <div className={cn(
                                                    "text-[10px] font-black uppercase tracking-tighter",
                                                    leave.status === 'approved' ? "text-emerald-600" :
                                                        leave.status === 'rejected' ? "text-rose-600" : "text-orange-600"
                                                )}>
                                                    {leave.status === 'approved' ? 'Approuvé' : leave.status === 'rejected' ? 'Rejeté' : 'En attente'}
                                                </div>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-slate-200 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

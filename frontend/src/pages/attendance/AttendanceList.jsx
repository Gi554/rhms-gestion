import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect, useMemo } from 'react'
import { Calendar as CalendarIcon, Clock, Filter, Search, Download, MoreHorizontal, User, Play, Square, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { format, differenceInSeconds } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useOutletContext } from 'react-router-dom'
import { toast } from 'sonner'

export default function AttendanceList() {
    const { userProfile } = useOutletContext()
    const queryClient = useQueryClient()

    // Roles
    const isAdmin = userProfile?.is_superuser || userProfile?.is_staff
    const userRole = userProfile?.organizations?.[0]?.role
    const isManager = userRole === 'admin' || userRole === 'manager' || userRole === 'owner' || isAdmin

    // Filters state
    const [search, setSearch] = useState('')
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date()
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    })

    // Timer state
    const [elapsedSeconds, setElapsedSeconds] = useState(0)

    // Fetch attendance status (for check-in/out)
    const { data: attendanceStatus } = useQuery({
        queryKey: ['attendance-status', userProfile?.id],
        queryFn: async () => {
            const res = await api.getAttendanceStatus()
            return res.data
        },
        enabled: !!userProfile?.employee_profile
    })

    // Timer effect
    useEffect(() => {
        let interval
        if (attendanceStatus?.is_clocked_in && attendanceStatus.check_in) {
            const startTime = new Date()
            const [hours, minutes, seconds] = attendanceStatus.check_in.split(':')
            startTime.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds))
            const updateTimer = () => {
                const now = new Date()
                const diff = Math.max(0, differenceInSeconds(now, startTime))
                setElapsedSeconds(diff)
            }
            updateTimer()
            interval = setInterval(updateTimer, 1000)
        } else {
            setElapsedSeconds(0)
        }
        return () => clearInterval(interval)
    }, [attendanceStatus])

    const formatTimer = (totalSeconds) => {
        const h = Math.floor(totalSeconds / 3600)
        const m = Math.floor((totalSeconds % 3600) / 60)
        const s = totalSeconds % 60
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    }

    // Check-in / Check-out mutations
    const checkInMutation = useMutation({
        mutationFn: () => api.checkIn({}),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attendance-status'] })
            queryClient.invalidateQueries({ queryKey: ['attendance-list'] })
            toast.success("Pointage à l'arrivée enregistré !")
        },
        onError: (err) => toast.error(err.response?.data?.error || "Erreur lors du pointage")
    })

    const checkOutMutation = useMutation({
        mutationFn: () => api.checkOut({}),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attendance-status'] })
            queryClient.invalidateQueries({ queryKey: ['attendance-list'] })
            toast.success("Pointage au départ enregistré !")
        },
        onError: (err) => toast.error(err.response?.data?.error || "Erreur lors du pointage")
    })

    // Build API params with month filter
    const [year, month] = selectedMonth.split('-')
    const apiParams = isManager
        ? { date__year: year, date__month: month }
        : { date__year: year, date__month: month }

    const { data: attendances, isLoading } = useQuery({
        queryKey: ['attendance-list', userProfile?.id, isManager, selectedMonth],
        queryFn: async () => {
            const res = await api.getAttendances(apiParams)
            return res.data.results || res.data
        }
    })

    // Client-side search filter
    const filtered = useMemo(() => {
        if (!attendances) return []
        if (!search.trim()) return attendances
        const q = search.toLowerCase()
        return attendances.filter(a =>
            a.employee_detail?.full_name?.toLowerCase().includes(q) ||
            a.employee_detail?.employee_id?.toLowerCase().includes(q) ||
            a.date?.includes(q) ||
            a.status?.toLowerCase().includes(q)
        )
    }, [attendances, search])

    // Generate month options (last 12 months)
    const monthOptions = useMemo(() => {
        const options = []
        const now = new Date()
        for (let i = 0; i < 12; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
            const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
            const label = format(d, 'MMMM yyyy', { locale: fr })
            options.push({ value, label })
        }
        return options
    }, [])

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
                </div>
            </div>

            {/* Check-in / Check-out Card (for employees) */}
            {!isManager && (
                <Card className={cn(
                    "border-none shadow-sm rounded-3xl overflow-hidden",
                    attendanceStatus?.is_clocked_in ? "bg-[#032f20]" : "bg-white"
                )}>
                    <CardContent className="p-6">
                        {!userProfile?.employee_profile ? (
                            <div className="flex items-center gap-3 text-orange-600">
                                <AlertCircle className="h-5 w-5" />
                                <span className="text-sm font-medium">Votre compte n'est pas lié à un profil employé. Contactez un administrateur.</span>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between gap-6">
                                <div>
                                    <div className={cn(
                                        "text-sm font-bold uppercase tracking-widest mb-1",
                                        attendanceStatus?.is_clocked_in ? "text-emerald-400" : "text-gray-400"
                                    )}>
                                        {attendanceStatus?.is_clocked_in ? "⬤ En poste" : "○ Hors poste"}
                                    </div>
                                    <div className={cn(
                                        "text-4xl font-mono font-bold tracking-wider",
                                        attendanceStatus?.is_clocked_in ? "text-white" : "text-gray-900"
                                    )}>
                                        {formatTimer(elapsedSeconds)}
                                    </div>
                                    {attendanceStatus?.check_in && (
                                        <div className={cn(
                                            "text-xs mt-1",
                                            attendanceStatus?.is_clocked_in ? "text-white/50" : "text-gray-400"
                                        )}>
                                            Arrivée : {attendanceStatus.check_in}
                                            {attendanceStatus.check_out && ` · Départ : ${attendanceStatus.check_out}`}
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-3">
                                    {attendanceStatus?.is_clocked_in ? (
                                        <Button
                                            size="lg"
                                            className="rounded-2xl bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 h-14 px-8"
                                            onClick={() => checkOutMutation.mutate()}
                                            disabled={checkOutMutation.isPending}
                                        >
                                            <Square className="mr-2 h-5 w-5 fill-current" />
                                            Pointer le départ
                                        </Button>
                                    ) : (
                                        <Button
                                            size="lg"
                                            className="rounded-2xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 h-14 px-8"
                                            onClick={() => checkInMutation.mutate()}
                                            disabled={checkInMutation.isPending || (attendanceStatus?.check_out && !attendanceStatus.is_clocked_in)}
                                        >
                                            <Play className="mr-2 h-5 w-5 fill-current" />
                                            {attendanceStatus?.check_out ? "Journée terminée" : "Pointer l'arrivée"}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <Input
                        placeholder="Rechercher par nom, ID ou statut..."
                        className="w-full pl-12 h-12 rounded-xl border-none bg-white shadow-sm focus:ring-2 focus:ring-primary/20"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="h-12 pl-10 pr-4 rounded-xl border-none bg-white shadow-sm text-sm font-medium text-gray-700 focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer appearance-none min-w-[180px]"
                    >
                        {monthOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
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
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Durée</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered?.map((attendance) => (
                                    <tr key={attendance.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors">
                                                    <User className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-gray-900 leading-none">
                                                        {attendance.employee_detail?.full_name || "Inconnu"}
                                                    </div>
                                                    <div className="text-[10px] text-gray-400 font-bold uppercase mt-1">
                                                        #{attendance.employee_detail?.employee_id || "ID-?"}
                                                    </div>
                                                    <div className="text-gray-500 capitalize text-[10px] font-medium mt-1">
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
                                                <span className="font-bold text-gray-900">
                                                    {attendance.hours_worked ? `${parseFloat(attendance.hours_worked).toFixed(1)}h` : '--'}
                                                </span>
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
                                    </tr>
                                ))}
                                {!filtered?.length && (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-12 text-center text-gray-400">
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

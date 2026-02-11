import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import {
    ArrowUpRight,
    MoreHorizontal,
    Play,
    Pause,
    Plus,
    ArrowRight,
    Video,
    Clock,
    Square,
    Users as UsersIcon,
    Calendar,
    CheckCircle2,
    AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api-client'
import { format, differenceInSeconds } from 'date-fns'
import { fr } from 'date-fns/locale'
import { toast } from 'sonner'

// Composant Carte Statistique
const StatCard = ({ title, value, trend, label, color = "bg-white", textColor = "text-gray-900", loading = false }) => (
    <Card className={cn("border-none shadow-sm rounded-3xl transition-all duration-200 hover:shadow-md", color)}>
        <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
                <h3 className={cn("text-sm font-medium", textColor === "text-white" ? "text-white/80" : "text-gray-500")}>
                    {title}
                </h3>
                <div className={cn("p-2 rounded-full", textColor === "text-white" ? "bg-white/20 text-white" : "border border-gray-100 bg-white")}>
                    <ArrowUpRight className="h-4 w-4" />
                </div>
            </div>
            <div className="mb-2">
                {loading ? (
                    <div className={cn("h-10 w-24 animate-pulse rounded-lg", textColor === "text-white" ? "bg-white/20" : "bg-gray-100")} />
                ) : (
                    <span className={cn("text-4xl font-bold tracking-tight", textColor)}>{value}</span>
                )}
            </div>
            <div className="flex items-center gap-2">
                <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", textColor === "text-white" ? "bg-white/20 text-white" : "bg-green-100 text-green-700")}>
                    {trend}
                </span>
                <span className={cn("text-xs", textColor === "text-white" ? "text-white/60" : "text-gray-400")}>
                    {label}
                </span>
            </div>
        </CardContent>
    </Card>
)

// Composant Barre de Progression Circulaire
const CircularProgress = ({ value, label }) => (
    <div className="relative h-40 w-40 flex items-center justify-center">
        <svg className="h-full w-full transform -rotate-90">
            <circle
                cx="80"
                cy="80"
                r="70"
                stroke="currentColor"
                strokeWidth="15"
                fill="transparent"
                className="text-gray-100"
            />
            <circle
                cx="80"
                cy="80"
                r="70"
                stroke="currentColor"
                strokeWidth="15"
                fill="transparent"
                strokeDasharray={440}
                strokeDashoffset={440 - (440 * value) / 100}
                className="text-primary"
                strokeLinecap="round"
            />
        </svg>
        <div className="absolute flex flex-col items-center">
            <span className="text-3xl font-bold text-gray-900">{value}%</span>
            <span className="text-xs text-gray-400">{label}</span>
        </div>
    </div>
)

export default function Dashboard() {
    const { userProfile } = useOutletContext()
    const queryClient = useQueryClient()
    const [elapsedSeconds, setElapsedSeconds] = useState(0)

    // Rôles
    const isAdmin = userProfile?.is_superuser || userProfile?.is_staff
    const userRole = userProfile?.organizations?.[0]?.role
    const isManager = userRole === 'admin' || userRole === 'manager'
    const isEmployee = !isAdmin && !isManager

    // 1. Fetch user's organizations
    const { data: organizations, isLoading: orgsLoading } = useQuery({
        queryKey: ['organizations'],
        queryFn: async () => {
            const res = await api.getOrganizations()
            return res.data.results || res.data // DRF pagination handling
        }
    })

    // 2. Fetch stats for the first organization if it exists
    const currentOrgId = organizations?.[0]?.id

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['org-stats', currentOrgId],
        queryFn: async () => {
            const res = await api.getOrganizationStats(currentOrgId)
            return res.data
        },
        enabled: !!currentOrgId
    })

    // 3. Fetch Activity Chart Data
    const { data: activityData } = useQuery({
        queryKey: ['org-activity', currentOrgId],
        queryFn: async () => {
            const res = await api.getOrganizationActivityChart(currentOrgId)
            return res.data
        },
        enabled: !!currentOrgId
    })

    // 4. Fetch Projects
    const { data: projects } = useQuery({
        queryKey: ['projects', userProfile?.id],
        queryFn: async () => {
            const res = await api.getProjects()
            const data = res.data.results || res.data
            // If employee, maybe filter or show specific ones? 
            // For now, show all but could be filtered by organization
            return data
        },
        enabled: !!userProfile
    })

    // 5. Fetch Events
    const { data: events } = useQuery({
        queryKey: ['events', userProfile?.id],
        queryFn: async () => {
            const res = await api.getEvents()
            return res.data.results || res.data
        },
        enabled: !!userProfile
    })

    // 6. Fetch latest employees (Only for Admin/Manager)
    const { data: recentEmployees } = useQuery({
        queryKey: ['recent-employees'],
        queryFn: async () => {
            const res = await api.getEmployees()
            return (res.data.results || res.data).slice(0, 3)
        },
        enabled: isManager || isAdmin
    })

    // 7. Time Tracker Logic
    const { data: attendanceStatus, isLoading: statusLoading } = useQuery({
        queryKey: ['attendance-status', userProfile?.id],
        queryFn: async () => {
            const res = await api.getAttendanceStatus()
            return res.data
        }
    })

    const checkInMutation = useMutation({
        mutationFn: () => api.checkIn({}),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attendance-status'] })
            toast.success("Pointage à l'arrivée réussi !")
        },
        onError: (err) => toast.error(err.response?.data?.error || "Erreur lors du pointage")
    })

    const checkOutMutation = useMutation({
        mutationFn: () => api.checkOut({}),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attendance-status'] })
            queryClient.invalidateQueries({ queryKey: ['org-activity'] })
            toast.success("Pointage au départ réussi !")
        },
        onError: (err) => toast.error(err.response?.data?.error || "Erreur lors du pointage")
    })

    useEffect(() => {
        let interval
        if (attendanceStatus?.is_clocked_in && attendanceStatus.check_in) {
            const startTime = new Date()
            const [hours, minutes, seconds] = attendanceStatus.check_in.split(':')
            startTime.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds))

            const updateTimer = () => {
                const now = new Date()
                // Handle case where check_in was today
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
        const hours = Math.floor(totalSeconds / 3600)
        const minutes = Math.floor((totalSeconds % 3600) / 60)
        const seconds = totalSeconds % 60
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }

    const isLoading = orgsLoading || statsLoading

    // Calculate max value for chart scaling
    const maxActivity = activityData ? Math.max(...activityData.data, 5) : 10

    // Get next event
    const nextEvent = events && events.length > 0 ? events[0] : null

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
                    <p className="text-gray-500 mt-1">
                        {organizations?.[0]?.name ? `Vue d'ensemble de ${organizations[0].name}` : 'Planifiez, priorisez et accomplissez vos tâches RH.'}
                    </p>
                </div>
                <div className="flex gap-4">
                    <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl px-6 h-12 shadow-lg shadow-primary/20">
                        <Plus className="mr-2 h-4 w-4" />
                        Nouveau Dossier
                    </Button>
                    <Button variant="outline" className="rounded-xl px-6 h-12 bg-white border-gray-200">
                        Importer Données
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {isManager || isAdmin ? (
                    <>
                        <StatCard
                            title="Total Employés"
                            value={stats?.total_employees || 0}
                            trend="+2%"
                            label="vs dernier mois"
                            color="bg-primary"
                            textColor="text-white"
                            loading={isLoading}
                        />
                        <StatCard
                            title="Départements"
                            value={stats?.total_departments || 0}
                            trend="Stable"
                            label="Total actifs"
                            loading={isLoading}
                        />
                        <StatCard
                            title="Congés en attente"
                            value={stats?.pending_leaves || 0}
                            trend="Action requise"
                            label="À traiter"
                            loading={isLoading}
                        />
                        <StatCard
                            title="Membres Actifs"
                            value={stats?.active_members || 0}
                            trend="En ligne"
                            label="Sur la plateforme"
                            loading={isLoading}
                        />
                    </>
                ) : (
                    <>
                        <StatCard
                            title="Heures ce mois"
                            value="124.5"
                            trend="+12%"
                            label="vs mois précédent"
                            color="bg-primary"
                            textColor="text-white"
                            loading={isLoading}
                        />
                        <StatCard
                            title="Congés restants"
                            value="12"
                            trend="Jours"
                            label="Solde annuel"
                            loading={isLoading}
                        />
                        <StatCard
                            title="Demandes actives"
                            value="1"
                            trend="En attente"
                            label="Congés / Frais"
                            loading={isLoading}
                        />
                        <StatCard
                            title="Performance"
                            value="98%"
                            trend="+1%"
                            label="Objectifs atteints"
                            loading={isLoading}
                        />
                    </>
                )}
            </div>

            {/* Main Grid: 3 columns layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Column 1: Analytics & Team / Personal Status */}
                <div className="space-y-6">
                    {/* Project Analytics (Real Data) */}
                    <Card className="border-none shadow-sm rounded-3xl bg-white">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold">
                                {isManager || isAdmin ? "Activité RH (Présences)" : "Ma Semaine"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {activityData ? (
                                <div className="h-48 flex items-end justify-between gap-2 px-2">
                                    {activityData.data.map((h, i) => (
                                        <div key={i} className="flex flex-col items-center gap-2 w-full h-full group">
                                            <div className="relative w-full flex-1 flex items-end bg-emerald-50/50 rounded-t-xl overflow-hidden">
                                                <div
                                                    className={cn(
                                                        "w-full rounded-t-xl transition-all duration-500 group-hover:brightness-95",
                                                        i === activityData.labels.length - 1 ? "bg-primary" : "bg-emerald-500"
                                                    )}
                                                    style={{ height: `${Math.max((h / (isManager || isAdmin ? maxActivity : 10)) * 100, 2)}%` }}
                                                />
                                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white text-[10px] px-2 py-1 rounded shadow-lg z-20 pointer-events-none whitespace-nowrap">
                                                    {isManager || isAdmin ? `${h} employés` : `${h}h travaillées`}
                                                </div>
                                            </div>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{activityData.labels[i]}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-48 flex items-center justify-center text-gray-400">
                                    Chargement...
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Team Collaboration / My Subordinates if manager, or just My Profile Info */}
                    {(isManager || isAdmin) ? (
                        <Card className="border-none shadow-sm rounded-3xl bg-white">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-lg font-bold">Nouveaux Employés</CardTitle>
                                <Button variant="outline" size="sm" className="rounded-full text-xs h-8">
                                    + Ajouter
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {recentEmployees?.map((employee, i) => (
                                    <div key={employee.id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center text-primary font-bold overflow-hidden">
                                                {employee.profile_photo ? (
                                                    <img src={employee.profile_photo} alt={employee.full_name} className="h-full w-full object-cover" />
                                                ) : (
                                                    <span>{employee.first_name[0]}{employee.last_name[0]}</span>
                                                )}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-gray-900">{employee.full_name}</div>
                                                <div className="text-xs text-gray-400">{employee.position}</div>
                                            </div>
                                        </div>
                                        <span className={cn(
                                            "text-[10px] font-bold px-2 py-1 rounded-full",
                                            employee.status === 'active' ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                                        )}>
                                            {employee.status === 'active' ? 'Actif' : 'Inactif'}
                                        </span>
                                    </div>
                                ))}
                                {!recentEmployees?.length && (
                                    <div className="text-center text-gray-400 text-sm py-4">Aucun employé récent</div>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
                            <div className="h-20 bg-primary/10 relative">
                                <div className="absolute -bottom-10 left-6 h-20 w-20 rounded-2xl border-4 border-white bg-white overflow-hidden shadow-sm">
                                    {userProfile?.employee_profile?.profile_photo ? (
                                        <img src={userProfile.employee_profile.profile_photo} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center bg-primary text-white font-bold text-xl uppercase">
                                            {userProfile?.first_name?.[0]}{userProfile?.last_name?.[0]}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="pt-12 pb-6 px-6">
                                <div className="font-bold text-xl text-gray-900">{userProfile?.first_name} {userProfile?.last_name}</div>
                                <div className="text-sm text-gray-500 mb-4">{userProfile?.employee_profile?.position || 'Membre Organisation'}</div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        Badge de sécurité actif
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <Calendar className="h-4 w-4 text-blue-500" />
                                        Prochain congé : 12 Mars
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>

                {/* Column 2: Reminders & Progress */}
                <div className="space-y-6">
                    {/* Reminders / Next Meeting (Real Data) */}
                    <Card className="border-none shadow-sm rounded-3xl bg-white h-fit">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-bold">Rappels</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {nextEvent ? (
                                <>
                                    <div className="mb-4">
                                        <h4 className="font-bold text-gray-900 mb-1">{nextEvent.title}</h4>
                                        <p className="text-sm text-gray-500">{nextEvent.description}</p>
                                        <div className="mt-2 text-xs font-semibold text-gray-400 bg-gray-50 inline-block px-2 py-1 rounded-md">
                                            {format(new Date(nextEvent.start_time), "HH:mm")} - {nextEvent.end_time ? format(new Date(nextEvent.end_time), "HH:mm") : '...'}
                                        </div>
                                    </div>
                                    <Button className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl h-12 shadow-lg shadow-primary/20" asChild>
                                        <a href={nextEvent.link || '#'} target="_blank" rel="noopener noreferrer">
                                            <Video className="mr-2 h-4 w-4 fill-current" />
                                            Rejoindre la réunion
                                        </a>
                                    </Button>
                                </>
                            ) : (
                                <div className="text-center py-6 text-gray-400">
                                    Aucun rappel à venir
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Project Progress */}
                    <Card className="border-none shadow-sm rounded-3xl bg-white">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold">Taux de Complétion</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center">
                            <CircularProgress value={75} label="Global" />
                            <div className="flex gap-4 mt-6">
                                <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-primary" />
                                    <span className="text-xs text-gray-500">Traité</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-primary/20" />
                                    <span className="text-xs text-gray-500">En cours</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Column 3: Project List & Time Tracker */}
                <div className="space-y-6">
                    {/* Projects List (Real Data) */}
                    <Card className="border-none shadow-sm rounded-3xl bg-white">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-lg font-bold">Projets Clés</CardTitle>
                            <Button variant="outline" size="sm" className="rounded-full text-xs h-8">
                                + Nouveau
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {projects?.map((project, i) => (
                                <div key={i} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer group">
                                    <div className={cn(
                                        "h-10 w-10 rounded-xl flex items-center justify-center text-lg",
                                        project.color === 'blue' && "bg-blue-50 text-blue-500",
                                        project.color === 'green' && "bg-green-50 text-green-500",
                                        project.color === 'orange' && "bg-orange-50 text-orange-500",
                                        project.color === 'purple' && "bg-purple-50 text-purple-500",
                                        project.color === 'pink' && "bg-pink-50 text-pink-500",
                                    )}>
                                        {project.icon_emoji}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-sm text-gray-900 group-hover:text-primary transition-colors">{project.name}</div>
                                        <div className="text-xs text-gray-400">Échéance : {format(new Date(project.due_date), "dd MMM yyyy", { locale: fr })}</div>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            ))}
                            {!projects?.length && (
                                <div className="text-center py-4 text-gray-400 text-sm">Aucun projet en cours</div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Time Tracker (Functional) */}
                    <Card className="border-none shadow-sm rounded-3xl bg-[#032f20] text-white relative overflow-hidden">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-center mb-6 relative z-10">
                                <span className="text-sm font-medium text-white/80">Time Tracker</span>
                                {attendanceStatus?.is_clocked_in ? (
                                    <span className="flex items-center gap-1.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                        EN POSTE
                                    </span>
                                ) : (
                                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">HORS POSTE</span>
                                )}
                            </div>

                            {!userProfile?.employee_profile ? (
                                <div className="relative z-10 py-4">
                                    <div className="flex items-center gap-3 text-orange-300 mb-2">
                                        <AlertCircle className="h-5 w-5" />
                                        <span className="text-xs font-bold uppercase tracking-wide">Profil non lié</span>
                                    </div>
                                    <p className="text-[10px] text-white/60 leading-relaxed">
                                        Votre compte utilisateur n'est pas encore lié à un profil employé. Veuillez contacter un administrateur.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="text-4xl font-mono font-bold tracking-wider mb-8 relative z-10">
                                        {formatTimer(elapsedSeconds)}
                                    </div>
                                    <div className="flex gap-4 relative z-10">
                                        {attendanceStatus?.is_clocked_in ? (
                                            <Button
                                                size="icon"
                                                className="rounded-full bg-red-500 h-12 w-12 text-white hover:bg-red-600 border-none shadow-lg shadow-red-500/20"
                                                onClick={() => checkOutMutation.mutate()}
                                                disabled={checkOutMutation.isPending}
                                            >
                                                <Square className="h-5 w-5 fill-current" />
                                            </Button>
                                        ) : (
                                            <Button
                                                size="icon"
                                                className="rounded-full bg-white h-12 w-12 text-black hover:bg-gray-200 shadow-lg shadow-white/10"
                                                onClick={() => checkInMutation.mutate()}
                                                disabled={checkInMutation.isPending || (attendanceStatus?.check_out && !attendanceStatus.is_clocked_in)}
                                            >
                                                <Play className="h-5 w-5 fill-current ml-1" />
                                            </Button>
                                        )}

                                        {attendanceStatus?.check_in && !attendanceStatus.is_clocked_in && (
                                            <div className="flex flex-col justify-center">
                                                <span className="text-[10px] text-white/40 uppercase font-bold">Journée terminée</span>
                                                <span className="text-xs font-bold text-white/80">Sortie à {attendanceStatus.check_out}</span>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            {/* Abstract waves background */}
                            {/* Abstract waves background */}
                            <div className="absolute inset-0 opacity-20">
                                <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                    <path d="M0 50 Q 25 25 50 50 T 100 50 V 100 H 0 Z" fill="url(#gradient)" />
                                    <defs>
                                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#34d399" />
                                            <stop offset="100%" stopColor="#10b981" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

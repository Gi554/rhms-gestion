import { Link, useLocation } from 'react-router-dom'
import {
    LayoutDashboard,
    Users,
    Building2,
    Calendar,
    Clock,
    FileText,
    CreditCard,
    Settings,
    HelpCircle,
    User,
    LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'

const mainNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Calendrier', href: '/calendar', icon: Calendar },
    { name: 'Employés', href: '/employees', icon: Users }, // Tasks equivalent
    { name: 'Départements', href: '/departments', icon: Building2 },
    { name: 'Congés', href: '/leaves', icon: Calendar },
    { name: 'Présences', href: '/attendance', icon: Clock }, // Analytics equivalent
    { name: 'Paie', href: '/payroll', icon: CreditCard },
    { name: 'Documents', href: '/documents', icon: FileText }, // Team equivalent
]

const generalNavigation = [
    { name: 'Mon Profil', href: '/profile', icon: User },
    { name: 'Paramètres', href: '/settings', icon: Settings },
    { name: 'Aide', href: '/help', icon: HelpCircle },
]

export default function Sidebar({ onLogout, userProfile }) {
    const location = useLocation()

    const isAdmin = userProfile?.is_superuser || userProfile?.is_staff
    const userRole = userProfile?.organizations?.[0]?.role
    const isManager = userRole === 'admin' || userRole === 'manager'

    const filteredNavigation = mainNavigation.filter(item => {
        if (item.href === '/employees' || item.href === '/departments') {
            return isAdmin || isManager
        }
        return true
    })

    return (
        <div className="flex w-64 flex-col bg-white h-screen p-4">
            {/* Logo */}
            <div className="flex items-center gap-3 px-4 py-6 mb-6">
                <div className="h-10 w-10 rounded-full border-2 border-primary/20 flex items-center justify-center">
                    <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-white font-bold text-xs">HR</span>
                    </div>
                </div>
                <span className="text-2xl font-bold text-gray-900 tracking-tight">HRMS</span>
            </div>

            <div className="flex-1 flex flex-col gap-8 overflow-y-auto">
                {/* Menu Section */}
                <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mb-4">
                        Menu
                    </h3>
                    <nav className="space-y-1">
                        {filteredNavigation.map((item) => {
                            const isActive = location.pathname === item.href
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={cn(
                                        'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                                        isActive
                                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                    )}
                                >
                                    <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-gray-400")} />
                                    {item.name}
                                    {item.href === '/employees' && (
                                        <span className={cn(
                                            "ml-auto text-xs py-0.5 px-2 rounded-md font-semibold",
                                            isActive ? "bg-white/20 text-white" : "bg-black text-white"
                                        )}>
                                            12+
                                        </span>
                                    )}
                                </Link>
                            )
                        })}
                    </nav>
                </div>

                {/* General Section */}
                <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mb-4">
                        Général
                    </h3>
                    <nav className="space-y-1">
                        {generalNavigation.map((item) => {
                            const isActive = location.pathname === item.href
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={cn(
                                        'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                                        isActive
                                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                    )}
                                >
                                    <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-gray-400")} />
                                    {item.name}
                                </Link>
                            )
                        })}

                        <button
                            onClick={onLogout}
                            className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors mt-2"
                        >
                            <LogOut className="h-5 w-5" />
                            Déconnexion
                        </button>
                    </nav>
                </div>
            </div>


        </div>
    )
}

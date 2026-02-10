import { Search, Bell, Mail } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

export default function Header({ onLogout }) {
    return (
        <header className="flex h-24 items-center justify-between px-8 bg-transparent">
            {/* Search */}
            <div className="w-1/3">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <Input
                        type="search"
                        placeholder="Rechercher une tâche..."
                        className="w-full pl-12 h-12 rounded-2xl border-gray-200 bg-white shadow-sm focus:ring-primary/20"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1">
                        <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded border border-gray-200 bg-gray-50 px-2 font-mono text-[10px] font-medium text-gray-500">
                            ⌘K
                        </kbd>
                    </div>
                </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-white text-gray-500 hover:text-primary hover:bg-white shadow-sm border border-gray-100">
                        <Mail className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-white text-gray-500 hover:text-primary hover:bg-white shadow-sm border border-gray-100 relative">
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-red-500 border-2 border-white" />
                    </Button>
                </div>

                {/* User Profile */}
                <div className="flex items-center gap-4 pl-4 border-l border-gray-200">
                    <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-white shadow-sm">
                        <img
                            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin"
                            alt="Admin"
                            className="h-full w-full object-cover bg-gray-100"
                        />
                    </div>
                    <div className="text-sm">
                        <div className="font-bold text-gray-900">Admin User</div>
                        <div className="text-gray-500 text-xs">admin@hrms.com</div>
                    </div>
                </div>
            </div>
        </header>
    )
}

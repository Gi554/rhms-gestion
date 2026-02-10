import { Outlet } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import Header from '../components/layout/Header'

export default function DashboardLayout({ onLogout, userProfile }) {
    return (
        <div className="flex h-screen bg-[#f3f4f6]"> {/* Light gray background like mockup */}
            {/* Sidebar */}
            <Sidebar onLogout={onLogout} userProfile={userProfile} />

            {/* Main Content */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Header */}
                <Header onLogout={onLogout} userProfile={userProfile} />

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto px-8 pb-8">
                    <Outlet context={{ userProfile }} />
                </main>
            </div>
        </div>
    )
}

import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
            <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        HRMS SaaS
                    </h1>
                    <p className="mt-2 text-gray-600">
                        Plateforme moderne de gestion RH
                    </p>
                </div>
                <Outlet />
            </div>
        </div>
    )
}

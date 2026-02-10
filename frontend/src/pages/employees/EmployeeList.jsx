import { useQuery } from '@tanstack/react-query'
import { Plus, Search, Filter, MoreHorizontal, Mail, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/lib/api-client'
import { cn } from '@/lib/utils'

export default function EmployeeList() {
    const { data: employees, isLoading, error } = useQuery({
        queryKey: ['employees'],
        queryFn: async () => {
            const response = await api.getEmployees()
            return response.data.results || response.data
        },
    })

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
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Employés</h1>
                    <p className="text-gray-500 mt-1">
                        Gérez vos talents et leurs accès
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="rounded-xl h-11 bg-white border-gray-200">
                        <Filter className="mr-2 h-4 w-4" />
                        Filtres
                    </Button>
                    <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl h-11 px-6 shadow-lg shadow-primary/20">
                        <Plus className="mr-2 h-4 w-4" />
                        Ajouter
                    </Button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                    placeholder="Rechercher par nom, poste ou email..."
                    className="w-full pl-12 h-14 rounded-2xl border-none bg-white shadow-sm focus:ring-2 focus:ring-primary/20 text-base"
                />
            </div>

            {/* Employees Grid/List */}
            <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
                <CardContent className="p-0">
                    {employees && employees.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50/50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Employé</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Poste & Dép.</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {employees.map((employee) => (
                                        <tr key={employee.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-primary font-bold overflow-hidden border border-primary/10">
                                                        {employee.profile_photo ? (
                                                            <img src={employee.profile_photo} alt="" className="h-full w-full object-cover" />
                                                        ) : (
                                                            <span>{employee.first_name[0]}{employee.last_name[0]}</span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-900">{employee.first_name} {employee.last_name}</div>
                                                        <div className="text-xs text-gray-500">ID: {employee.employee_id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <Mail className="h-3.5 w-3.5 text-gray-400" />
                                                        {employee.email}
                                                    </div>
                                                    {employee.phone && (
                                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                                            <Phone className="h-3.5 w-3.5 text-gray-400" />
                                                            {employee.phone}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{employee.position}</div>
                                                <div className="text-xs text-primary font-medium bg-primary/5 inline-block px-2 py-0.5 rounded-full mt-1">
                                                    {employee.department_detail?.name || 'Non assigné'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={cn(
                                                    "px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full",
                                                    employee.status === 'active' ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                                                )}>
                                                    {employee.status === 'active' ? 'Actif' : 'Inactif'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-primary hover:bg-primary/5 rounded-full">
                                                    <MoreHorizontal className="h-5 w-5" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="bg-gray-50 p-4 rounded-full mb-4">
                                <Search className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">Aucun employé trouvé</h3>
                            <p className="text-gray-500 mt-1 max-w-sm">Commencez par ajouter votre premier employé pour voir apparaître les données ici.</p>
                            <Button className="mt-6 bg-primary text-white rounded-xl shadow-lg shadow-primary/20">
                                <Plus className="mr-2 h-4 w-4" />
                                Ajouter un employé
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

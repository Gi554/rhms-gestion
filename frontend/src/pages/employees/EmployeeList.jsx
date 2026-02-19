import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useMemo } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { Plus, Search, Filter, MoreHorizontal, Mail, Phone, Pencil, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { api } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import AddEmployeeModal from './AddEmployeeModal'
import EditEmployeeModal from './EditEmployeeModal'

export default function EmployeeList() {
    const { userProfile } = useOutletContext()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [editEmployee, setEditEmployee] = useState(null)
    const [deleteEmployee, setDeleteEmployee] = useState(null)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')

    const currentOrgId = userProfile?.organizations?.[0]?.id

    const { data: employees, isLoading, error } = useQuery({
        queryKey: ['employees', currentOrgId],
        queryFn: async () => {
            const response = await api.getEmployees({ organization: currentOrgId })
            return response.data.results || response.data
        },
        enabled: !!currentOrgId
    })

    const deleteMutation = useMutation({
        mutationFn: (id) => api.deleteEmployee(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employees'] })
            toast.success('Employé supprimé avec succès.')
            setDeleteEmployee(null)
        },
        onError: () => toast.error("Erreur lors de la suppression.")
    })

    // Client-side filtering
    const filtered = useMemo(() => {
        if (!employees) return []
        return employees.filter(emp => {
            const q = search.toLowerCase()
            const matchSearch = !q ||
                emp.first_name?.toLowerCase().includes(q) ||
                emp.last_name?.toLowerCase().includes(q) ||
                emp.email?.toLowerCase().includes(q) ||
                emp.position?.toLowerCase().includes(q) ||
                emp.employee_id?.toLowerCase().includes(q)
            const matchStatus = statusFilter === 'all' || emp.status === statusFilter
            return matchSearch && matchStatus
        })
    }, [employees, search, statusFilter])

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
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Employés</h1>
                    <p className="text-gray-500 mt-1">
                        {filtered.length} employé{filtered.length !== 1 ? 's' : ''} {search || statusFilter !== 'all' ? 'trouvé(s)' : 'au total'}
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-primary hover:bg-primary/90 text-white rounded-xl h-11 px-6 shadow-lg shadow-primary/20"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Ajouter
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <Input
                        placeholder="Rechercher par nom, poste, email ou ID..."
                        className="w-full pl-12 h-12 rounded-xl border-none bg-white shadow-sm focus:ring-2 focus:ring-primary/20 text-base"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
                <div className="relative">
                    <Filter className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="h-12 pl-10 pr-4 rounded-xl border-none bg-white shadow-sm text-sm font-medium text-gray-700 focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer appearance-none min-w-[160px]"
                    >
                        <option value="all">Tous les statuts</option>
                        <option value="active">Actif</option>
                        <option value="inactive">Inactif</option>
                        <option value="on_leave">En congé</option>
                        <option value="terminated">Licencié</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
                <CardContent className="p-0">
                    {filtered.length > 0 ? (
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
                                    {filtered.map((employee) => (
                                        <tr
                                            key={employee.id}
                                            onClick={() => navigate(`/employees/${employee.id}`)}
                                            className="hover:bg-gray-50/50 transition-colors cursor-pointer group"
                                        >
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
                                                    employee.status === 'active' ? "bg-green-100 text-green-800" :
                                                        employee.status === 'on_leave' ? "bg-blue-100 text-blue-800" :
                                                            employee.status === 'terminated' ? "bg-red-100 text-red-800" :
                                                                "bg-gray-100 text-gray-800"
                                                )}>
                                                    {employee.status === 'active' ? 'Actif' :
                                                        employee.status === 'on_leave' ? 'En congé' :
                                                            employee.status === 'terminated' ? 'Licencié' : 'Inactif'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditEmployee(employee);
                                                        }}
                                                        title="Modifier"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setDeleteEmployee(employee);
                                                        }}
                                                        title="Supprimer"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
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
                            <h3 className="text-lg font-medium text-gray-900">
                                {search || statusFilter !== 'all' ? 'Aucun résultat' : 'Aucun employé trouvé'}
                            </h3>
                            <p className="text-gray-500 mt-1 max-w-sm">
                                {search || statusFilter !== 'all'
                                    ? 'Essayez de modifier vos critères de recherche.'
                                    : 'Commencez par ajouter votre premier employé.'}
                            </p>
                            {!search && statusFilter === 'all' && (
                                <Button
                                    onClick={() => setIsAddModalOpen(true)}
                                    className="mt-6 bg-primary text-white rounded-xl shadow-lg shadow-primary/20"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Ajouter un employé
                                </Button>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation */}
            {deleteEmployee && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="h-14 w-14 rounded-2xl bg-red-100 flex items-center justify-center text-red-600">
                                <Trash2 className="h-7 w-7" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Supprimer l'employé</h3>
                                <p className="text-sm text-gray-500 mt-0.5">Cette action est irréversible.</p>
                            </div>
                        </div>
                        <p className="text-gray-600 mb-8">
                            Êtes-vous sûr de vouloir supprimer <span className="font-bold text-gray-900">{deleteEmployee.first_name} {deleteEmployee.last_name}</span> ? Son compte utilisateur et toutes ses données associées seront supprimés.
                        </p>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1 rounded-xl h-12"
                                onClick={() => setDeleteEmployee(null)}
                            >
                                Annuler
                            </Button>
                            <Button
                                className="flex-1 rounded-xl h-12 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200"
                                onClick={() => deleteMutation.mutate(deleteEmployee.id)}
                                disabled={deleteMutation.isPending}
                            >
                                {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <AddEmployeeModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                organizationId={currentOrgId}
            />

            <EditEmployeeModal
                isOpen={!!editEmployee}
                onClose={() => setEditEmployee(null)}
                employee={editEmployee}
                organizationId={currentOrgId}
            />
        </div>
    )
}

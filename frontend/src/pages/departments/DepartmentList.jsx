import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Building2, Users, ArrowRight, Edit, Trash2, MoreVertical, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import Modal from '@/components/ui/modal'
import { api } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useOutletContext } from 'react-router-dom'

export default function DepartmentList() {
    const { userProfile } = useOutletContext()
    const queryClient = useQueryClient()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [isMemberModalOpen, setIsMemberModalOpen] = useState(false)
    const [selectedDept, setSelectedDept] = useState(null)
    const [isEditMode, setIsEditMode] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [memberSearchQuery, setMemberSearchQuery] = useState('')

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        manager: ''
    })

    // Fetch Departments
    const { data: departments, isLoading, error } = useQuery({
        queryKey: ['departments'],
        queryFn: async () => {
            const response = await api.getDepartments()
            return response.data.results || response.data
        },
    })

    // Fetch Employees (for manager selection)
    const { data: employees } = useQuery({
        queryKey: ['employees-minimal'],
        queryFn: async () => {
            const response = await api.getEmployees({ page_size: 100 })
            return response.data.results || response.data
        }
    })

    // Mutations
    const mutationOptions = {
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['departments'] })
            setIsModalOpen(false)
            setIsDeleteModalOpen(false)
            setSelectedDept(null)
            setFormData({ name: '', code: '', description: '', manager: '' })
        },
        onError: (err) => {
            const msg = err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || "Une erreur est survenue"
            toast.error(msg)
        }
    }

    const createMutation = useMutation({
        mutationFn: (data) => api.createDepartment({ ...data, organization: userProfile?.organizations?.[0]?.id }),
        ...mutationOptions,
        onSuccess: (res) => {
            mutationOptions.onSuccess()
            toast.success("Département créé avec succès")
        }
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => api.updateDepartment(id, { ...data, organization: userProfile?.organizations?.[0]?.id }),
        ...mutationOptions,
        onSuccess: () => {
            mutationOptions.onSuccess()
            toast.success("Département mis à jour")
        }
    })

    const deleteMutation = useMutation({
        mutationFn: (id) => api.deleteDepartment(id),
        ...mutationOptions,
        onSuccess: () => {
            mutationOptions.onSuccess()
            toast.success("Département supprimé")
        }
    })

    const handleSubmit = (e) => {
        e.preventDefault()
        if (isEditMode) {
            updateMutation.mutate({ id: selectedDept.id, data: formData })
        } else {
            createMutation.mutate(formData)
        }
    }

    const handleEdit = (dept) => {
        setSelectedDept(dept)
        setFormData({
            name: dept.name,
            code: dept.code,
            description: dept.description || '',
            manager: dept.manager || ''
        })
        setIsEditMode(true)
        setIsModalOpen(true)
    }

    const openDeleteModal = (dept) => {
        setSelectedDept(dept)
        setIsDeleteModalOpen(true)
    }

    const openMemberModal = (dept) => {
        setSelectedDept(dept)
        setIsMemberModalOpen(true)
    }

    const toggleMemberMutation = useMutation({
        mutationFn: ({ employeeId, departmentId }) =>
            api.patchEmployee(employeeId, { department: departmentId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['departments'] })
            queryClient.invalidateQueries({ queryKey: ['employees-minimal'] })
            toast.success("Liste des membres mise à jour")
        },
        onError: () => toast.error("Erreur lors de la mise à jour")
    })

    const filteredDepartments = departments?.filter(d =>
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.code.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const filteredEmployeesForMembers = employees?.filter(emp =>
        emp.full_name.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
        emp.employee_id.toLowerCase().includes(memberSearchQuery.toLowerCase())
    )

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Départements</h1>
                    <p className="text-gray-500 mt-1">
                        Structurez votre organisation
                    </p>
                </div>
                <Button
                    onClick={() => {
                        setIsEditMode(false)
                        setFormData({ name: '', code: '', description: '', manager: '' })
                        setIsModalOpen(true)
                    }}
                    className="bg-primary hover:bg-primary/90 text-white rounded-2xl h-12 px-8 shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    <Plus className="mr-2 h-5 w-5" />
                    Créer un département
                </Button>
            </div>

            {/* Search Bar */}
            <div className="relative group">
                <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
                <Input
                    placeholder="Rechercher un département (nom, code)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-14 h-16 rounded-[1.25rem] border-none bg-white shadow-sm focus:ring-4 focus:ring-primary/10 text-lg placeholder:text-gray-400"
                />
            </div>

            {/* Departments Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredDepartments && filteredDepartments.length > 0 ? (
                    filteredDepartments.map((dept) => (
                        <Card key={dept.id} className="group border-none shadow-xl shadow-gray-200/40 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 rounded-[2.5rem] bg-white overflow-hidden border-2 border-transparent hover:border-primary/5">
                            <CardContent className="p-8">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="h-16 w-16 rounded-[1.5rem] bg-primary/10 flex items-center justify-center text-primary transition-transform group-hover:scale-110 duration-300">
                                        <Building2 className="h-8 w-8" />
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => openMemberModal(dept)}
                                            className="h-10 w-10 rounded-xl bg-gray-50 text-gray-400 hover:bg-primary/10 hover:text-primary transition-colors flex items-center justify-center"
                                            title="Gérer les membres"
                                        >
                                            <Users className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleEdit(dept)}
                                            className="h-10 w-10 rounded-xl bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center justify-center"
                                            title="Modifier"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => openDeleteModal(dept)}
                                            className="h-10 w-10 rounded-xl bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors flex items-center justify-center"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight group-hover:text-primary transition-colors">{dept.name}</h3>
                                <p className="text-sm text-gray-500 line-clamp-2 mb-6 h-10 font-medium leading-relaxed">
                                    {dept.description || "Aucune description fournie pour ce département."}
                                </p>

                                <div className="flex items-center gap-4 text-sm text-gray-500 border-t border-gray-50 pt-6">
                                    <div className="flex items-center gap-2.5">
                                        <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                                            <Users className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <span className="font-bold text-gray-700">{dept.employees_count || 0} membres</span>
                                    </div>
                                    <div className="ml-auto text-[10px] font-black bg-gray-50 text-gray-400 px-3 py-1.5 rounded-xl uppercase tracking-widest border border-gray-100">
                                        {dept.code}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full flex flex-col items-center justify-center py-24 text-center bg-white rounded-[3rem] shadow-xl shadow-gray-100/50">
                        <div className="bg-gray-50 p-8 rounded-[2rem] mb-6 border border-gray-100">
                            <Building2 className="h-12 w-12 text-gray-300" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight">Aucun département</h3>
                        <p className="text-gray-500 mt-2 max-w-xs font-medium">Structurez votre entreprise en créant votre premier département.</p>
                    </div>
                )}
            </div>

            {/* Modal: Creation/Edition */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={isEditMode ? "Modifier le département" : "Nouveau département"}
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2 space-y-2">
                            <label className="text-sm font-bold text-gray-700 ml-1">Nom du département</label>
                            <Input
                                required
                                placeholder="ex: Ressources Humaines"
                                className="h-14 rounded-2xl bg-gray-50 border-none px-6 font-bold"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 ml-1">Code</label>
                            <Input
                                required
                                placeholder="RH"
                                maxLength={10}
                                className="h-14 rounded-2xl bg-gray-50 border-none px-6 font-bold uppercase"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 ml-1">Responsable (Optionnel)</label>
                        <select
                            className="w-full h-14 rounded-2xl border-none bg-gray-50 px-6 text-gray-900 focus:ring-4 focus:ring-primary/10 transition-all outline-none font-bold"
                            value={formData.manager}
                            onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                        >
                            <option value="">Sélectionner un responsable...</option>
                            {employees?.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 ml-1">Description</label>
                        <textarea
                            className="w-full rounded-2xl border-none bg-gray-50 p-6 text-gray-900 focus:ring-4 focus:ring-primary/10 transition-all outline-none min-h-[120px] font-medium leading-relaxed"
                            placeholder="Décrivez les missions de ce département..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 h-14 rounded-2xl font-bold border-gray-100"
                        >
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 h-14 rounded-2xl bg-primary text-white shadow-lg shadow-primary/20 font-bold"
                            disabled={createMutation.isPending || updateMutation.isPending}
                        >
                            {isEditMode ? "Enregistrer" : "Créer"}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Modal: Suppression */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Supprimer le département ?"
            >
                <div className="space-y-6">
                    <div className="p-6 bg-red-50 rounded-[2rem] flex flex-col items-center text-center">
                        <div className="h-16 w-16 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 mb-4">
                            <Trash2 className="h-8 w-8" />
                        </div>
                        <h4 className="text-xl font-black text-gray-900 mb-2">Action irréversible</h4>
                        <p className="text-sm text-red-600 font-medium">
                            Vous êtes sur le point de supprimer le département <span className="font-bold underline">{selectedDept?.name}</span>.
                            Cette action ne peut pas être annulée.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="flex-1 h-14 rounded-2xl font-bold border-gray-100 text-gray-500"
                        >
                            Annuler
                        </Button>
                        <Button
                            onClick={() => deleteMutation.mutate(selectedDept.id)}
                            className="flex-1 h-14 rounded-2xl bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200 font-bold"
                            disabled={deleteMutation.isPending}
                        >
                            Confirmer
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Modal: Gestion des membres */}
            <Modal
                isOpen={isMemberModalOpen}
                onClose={() => setIsMemberModalOpen(false)}
                title={`Membres - ${selectedDept?.name}`}
            >
                <div className="space-y-6">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                            placeholder="Rechercher un employé..."
                            className="pl-10 h-12 rounded-xl bg-gray-50 border-none"
                            value={memberSearchQuery}
                            onChange={(e) => setMemberSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {filteredEmployeesForMembers?.map(emp => {
                            const isMember = emp.department === selectedDept?.id
                            return (
                                <div key={emp.id} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                            {emp.full_name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">{emp.full_name}</p>
                                            <p className="text-[10px] text-gray-400 font-mono">#{emp.employee_id}</p>
                                        </div>
                                    </div>

                                    <Button
                                        size="sm"
                                        variant={isMember ? "outline" : "default"}
                                        className={cn(
                                            "rounded-xl font-bold h-9 px-4",
                                            isMember ? "border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300" : "bg-primary text-white"
                                        )}
                                        onClick={() => toggleMemberMutation.mutate({
                                            employeeId: emp.id,
                                            departmentId: isMember ? null : selectedDept.id
                                        })}
                                        disabled={toggleMemberMutation.isPending}
                                    >
                                        {isMember ? "Retirer" : "Ajouter"}
                                    </Button>
                                </div>
                            )
                        })}
                    </div>

                    <Button
                        onClick={() => setIsMemberModalOpen(false)}
                        className="w-full h-14 rounded-2xl bg-gray-900 text-white font-bold"
                    >
                        Terminer
                    </Button>
                </div>
            </Modal>
        </div>
    )
}

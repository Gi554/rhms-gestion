import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Building2, Users, ArrowRight, Edit, Trash2, MoreVertical, X, LayoutGrid, Network, ChevronRight, ChevronDown } from 'lucide-react'
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
        manager: '',
        parent: ''
    })
    const [viewMode, setViewMode] = useState('grid') // 'grid' or 'chart'

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
            setFormData({ name: '', code: '', description: '', manager: '', parent: '' })
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
            manager: dept.manager || '',
            parent: dept.parent || ''
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
                <div className="flex items-center gap-3">
                    <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={cn(
                                "h-10 px-4 rounded-xl flex items-center gap-2 text-sm font-bold transition-all",
                                viewMode === 'grid' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-gray-400 hover:text-gray-600"
                            )}
                        >
                            <LayoutGrid className="h-4 w-4" />
                            Grille
                        </button>
                        <button
                            onClick={() => setViewMode('chart')}
                            className={cn(
                                "h-10 px-4 rounded-xl flex items-center gap-2 text-sm font-bold transition-all",
                                viewMode === 'chart' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-gray-400 hover:text-gray-600"
                            )}
                        >
                            <Network className="h-4 w-4" />
                            Organigramme
                        </button>
                    </div>
                    <Button
                        onClick={() => {
                            setIsEditMode(false)
                            setFormData({ name: '', code: '', description: '', manager: '', parent: '' })
                            setIsModalOpen(true)
                        }}
                        className="bg-primary hover:bg-primary/90 text-white rounded-2xl h-12 px-8 shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Plus className="mr-2 h-5 w-5" />
                        Créer un département
                    </Button>
                </div>
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

            {/* Conditional View Rendering */}
            {viewMode === 'grid' ? (
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

                                    {dept.parent_detail && (
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Parent:</div>
                                            <div className="px-2 py-0.5 rounded-lg bg-gray-50 text-[10px] font-black text-gray-600 border border-gray-100">
                                                {dept.parent_detail.name}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-4 text-sm text-gray-500 border-t border-gray-50 pt-6">
                                        <div className="flex items-center gap-2.5">
                                            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                                                <Users className="h-4 w-4 text-gray-400" />
                                            </div>
                                            <span className="font-bold text-gray-700">{dept.employee_count || 0} membres</span>
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
            ) : (
                <div className="bg-white rounded-[3rem] p-10 shadow-xl shadow-gray-100/50 min-h-[500px]">
                    <div className="max-w-4xl mx-auto">
                        <OrgChart
                            departments={departments || []}
                            onEdit={handleEdit}
                            onManageMembers={openMemberModal}
                        />
                    </div>
                </div>
            )}

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
                        <label className="text-sm font-bold text-gray-700 ml-1">Département Parent (Hiérarchie)</label>
                        <select
                            className="w-full h-14 rounded-2xl border-none bg-gray-50 px-6 text-gray-900 focus:ring-4 focus:ring-primary/10 transition-all outline-none font-bold"
                            value={formData.parent}
                            onChange={(e) => setFormData({ ...formData, parent: e.target.value })}
                        >
                            <option value="">Aucun (Département Racine)</option>
                            {departments?.filter(d => isEditMode ? d.id !== selectedDept?.id : true).map(dept => (
                                <option key={dept.id} value={dept.id}>{dept.name}</option>
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

function OrgChart({ departments, onEdit, onManageMembers }) {
    // Build tree structure
    const buildTree = (data) => {
        const map = {}
        const roots = []

        data.forEach(item => {
            map[item.id] = { ...item, children: [] }
        })

        data.forEach(item => {
            if (item.parent && map[item.parent]) {
                map[item.parent].children.push(map[item.id])
            } else {
                roots.push(map[item.id])
            }
        })

        return roots
    }

    const treeData = buildTree(departments)

    if (departments.length === 0) return null

    return (
        <div className="space-y-4">
            {treeData.map(node => (
                <OrgNode
                    key={node.id}
                    node={node}
                    onEdit={onEdit}
                    onManageMembers={onManageMembers}
                />
            ))}
        </div>
    )
}

function OrgNode({ node, onEdit, onManageMembers, level = 0 }) {
    const [isExpanded, setIsExpanded] = useState(true)
    const hasChildren = node.children && node.children.length > 0

    return (
        <div className="select-none">
            <div
                className={cn(
                    "flex items-center gap-4 p-4 rounded-2xl transition-all border border-transparent",
                    level === 0 ? "bg-slate-900 text-white shadow-xl shadow-slate-200" : "bg-slate-50 hover:bg-slate-100 text-slate-900 border-slate-100"
                )}
                style={{ marginLeft: `${level * 40}px` }}
            >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    {hasChildren ? (
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className={cn(
                                "h-6 w-6 flex items-center justify-center rounded-lg transition-colors",
                                level === 0 ? "bg-white/10 hover:bg-white/20" : "bg-white hover:bg-gray-200 shadow-sm"
                            )}
                        >
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>
                    ) : (
                        <div className="w-6" />
                    )}

                    <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                        level === 0 ? "bg-primary text-white" : "bg-white shadow-sm text-primary"
                    )}>
                        <Building2 className="h-5 w-5" />
                    </div>

                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="font-black truncate text-sm tracking-tight">{node.name}</span>
                            <span className={cn(
                                "text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded-md border",
                                level === 0 ? "bg-white/10 border-white/20 text-white/60" : "bg-white border-slate-200 text-slate-400"
                            )}>
                                {node.code}
                            </span>
                        </div>
                        {node.manager_detail && (
                            <span className={cn(
                                "text-[10px] font-medium truncate",
                                level === 0 ? "text-white/40" : "text-slate-400"
                            )}>
                                Responsable: {node.manager_detail.full_name}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1.5">
                    <div className={cn(
                        "px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter flex items-center gap-1.5",
                        level === 0 ? "bg-white/10 text-white/80" : "bg-white shadow-sm text-slate-500 border border-slate-100"
                    )}>
                        <Users className="h-3.5 w-3.5" />
                        {node.employee_count}
                    </div>

                    <div className="flex gap-1 ml-2">
                        <button
                            onClick={() => onManageMembers(node)}
                            className={cn(
                                "h-8 w-8 rounded-lg flex items-center justify-center transition-all",
                                level === 0 ? "hover:bg-white/20 text-white/60 hover:text-white" : "hover:bg-primary/10 text-slate-400 hover:text-primary"
                            )}
                        >
                            <Users className="h-3.5 w-3.5" />
                        </button>
                        <button
                            onClick={() => onEdit(node)}
                            className={cn(
                                "h-8 w-8 rounded-lg flex items-center justify-center transition-all",
                                level === 0 ? "hover:bg-white/20 text-white/60 hover:text-white" : "hover:bg-blue-50 text-slate-400 hover:text-blue-600"
                            )}
                        >
                            <Edit className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            </div>

            {hasChildren && isExpanded && (
                <div className="relative">
                    <div
                        className="absolute left-0 top-0 bottom-0 w-px bg-slate-200"
                        style={{ marginLeft: `${level * 40 + 27}px` }}
                    />
                    <div className="mt-2 space-y-2">
                        {node.children.map(child => (
                            <OrgNode
                                key={child.id}
                                node={child}
                                onEdit={onEdit}
                                onManageMembers={onManageMembers}
                                level={level + 1}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

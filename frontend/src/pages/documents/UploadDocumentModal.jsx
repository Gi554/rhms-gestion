import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload, X, File, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Modal from '@/components/ui/modal'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function UploadDocumentModal({ isOpen, onClose, userProfile }) {
    const queryClient = useQueryClient()
    const [file, setFile] = useState(null)
    const [title, setTitle] = useState('')
    const [category, setCategory] = useState('other')
    const [employeeId, setEmployeeId] = useState('')
    const [description, setDescription] = useState('')

    const isAdmin = userProfile?.is_superuser || userProfile?.is_staff
    const userRole = userProfile?.organizations?.[0]?.role
    const isManager = userRole === 'admin' || userRole === 'manager' || userRole === 'owner' || isAdmin
    const currentOrgId = userProfile?.organizations?.[0]?.id

    // Fetch employees for selection if manager
    const { data: employees } = useQuery({
        queryKey: ['employees', currentOrgId],
        queryFn: async () => {
            const res = await api.getEmployees({ organization: currentOrgId })
            return res.data.results || res.data
        },
        enabled: isManager && isOpen
    })

    const uploadMutation = useMutation({
        mutationFn: (formData) => api.uploadDocument(formData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents'] })
            toast.success('Document mis en ligne avec succès.')
            handleClose()
        },
        onError: (error) => {
            console.error('Upload error:', error)
            toast.error("Erreur lors de l'envoi du document.")
        }
    })

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0]
        if (selectedFile) {
            setFile(selectedFile)
            if (!title) setTitle(selectedFile.name.split('.')[0])
        }
    }

    const handleClose = () => {
        setFile(null)
        setTitle('')
        setCategory('other')
        setEmployeeId('')
        setDescription('')
        onClose()
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!file) return toast.error('Veuillez sélectionner un fichier.')

        const finalEmployeeId = isManager ? employeeId : userProfile?.employee_profile?.id
        if (!finalEmployeeId) return toast.error('Employé non spécifié.')

        const formData = new FormData()
        formData.append('organization', currentOrgId)
        formData.append('employee', finalEmployeeId)
        formData.append('title', title)
        formData.append('category', category)
        formData.append('file', file)
        formData.append('description', description)

        uploadMutation.mutate(formData)
    }

    const categories = [
        { value: 'contract', label: 'Contrat' },
        { value: 'id', label: "Pièce d'identité" },
        { value: 'certificate', label: 'Certificat' },
        { value: 'payslip', label: 'Fiche de paie' },
        { value: 'other', label: 'Autre' },
    ]

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Ajouter un Document"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Drag & Drop Area */}
                <div
                    className={cn(
                        "relative border-2 border-dashed rounded-3xl p-8 transition-all duration-200 text-center",
                        file ? "border-primary bg-primary/5" : "border-gray-200 hover:border-primary/50 hover:bg-gray-50"
                    )}
                >
                    <input
                        type="file"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    />
                    <div className="space-y-4">
                        <div className={cn(
                            "h-16 w-16 mx-auto rounded-2xl flex items-center justify-center transition-transform duration-300",
                            file ? "bg-primary text-white scale-110" : "bg-gray-100 text-gray-400"
                        )}>
                            {file ? <CheckCircle2 className="h-8 w-8" /> : <Upload className="h-8 w-8" />}
                        </div>
                        <div>
                            {file ? (
                                <p className="font-bold text-gray-900">{file.name}</p>
                            ) : (
                                <>
                                    <p className="font-bold text-gray-900">Cliquez ou glissez un fichier ici</p>
                                    <p className="text-sm text-gray-500 mt-1">PDF, DOC, JPG ou PNG (max. 10MB)</p>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Title */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Titre du document</label>
                        <Input
                            placeholder="Ex: Contrat de travail 2024"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            className="h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Category */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Catégorie</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full h-12 px-4 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium"
                            >
                                {categories.map(cat => (
                                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Employee (If Manager) */}
                        {isManager && (
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Employé concerné</label>
                                <select
                                    value={employeeId}
                                    onChange={(e) => setEmployeeId(e.target.value)}
                                    required
                                    className="w-full h-12 px-4 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium"
                                >
                                    <option value="">Sélectionner un employé</option>
                                    {employees?.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Description (optionnel)</label>
                        <textarea
                            placeholder="Ajoutez une note rapide..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full min-h-[100px] p-4 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm resize-none"
                        />
                    </div>
                </div>

                <div className="flex gap-3 pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        className="flex-1 h-12 rounded-xl border-gray-200"
                        onClick={handleClose}
                    >
                        Annuler
                    </Button>
                    <Button
                        type="submit"
                        className="flex-1 h-12 rounded-xl bg-gray-900 text-white hover:bg-black shadow-lg shadow-gray-200"
                        disabled={uploadMutation.isPending}
                    >
                        {uploadMutation.isPending ? 'Envoi...' : 'Mettre en ligne'}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}

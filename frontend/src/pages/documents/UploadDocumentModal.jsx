import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload, CheckCircle2, Loader2 } from 'lucide-react'
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
            toast.success('Document mis en ligne !');
            handleClose()
        },
        onError: (error) => {
            console.error('Upload error:', error)
            toast.error("Erreur lors de l'envoi.")
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
        if (!file) return toast.error('Sélectionnez un fichier.')

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
            title="Nouveau Document"
            description="Partagez un document sécurisé avec l'organisation"
            maxWidth="max-w-xl"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div
                    className={cn(
                        "relative border-2 border-dashed rounded-[2.5rem] p-10 transition-all duration-300 text-center group",
                        file
                            ? "border-emerald-200 bg-emerald-50/30"
                            : "border-slate-100 bg-slate-50/50 hover:border-primary/30 hover:bg-slate-50/80"
                    )}
                >
                    <input
                        type="file"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    />
                    <div className="space-y-4">
                        <div className={cn(
                            "h-20 w-24 mx-auto rounded-[2rem] flex items-center justify-center transition-all duration-500",
                            file
                                ? "bg-emerald-500 text-white shadow-xl shadow-emerald-100 rotate-0 scale-100"
                                : "bg-white text-slate-300 shadow-sm group-hover:scale-110 group-hover:-rotate-3"
                        )}>
                            {file ? <CheckCircle2 className="h-10 w-10" /> : <Upload className="h-10 w-10" />}
                        </div>
                        <div className="px-4">
                            {file ? (
                                <div className="space-y-1">
                                    <p className="font-black text-slate-900 truncate max-w-xs mx-auto">{file.name}</p>
                                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Fichier prêt</p>
                                </div>
                            ) : (
                                <>
                                    <p className="font-black text-slate-900 tracking-tight">Glissez votre fichier ici</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">PDF, DOC, JPG ou PNG (max. 10MB)</p>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Titre du document</label>
                        <Input
                            placeholder="Ex: Contrat de travail 2024"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            className="h-12 rounded-2xl bg-slate-50/50 border-transparent focus:bg-white transition-all shadow-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Catégorie</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full h-12 px-4 rounded-2xl border border-transparent bg-slate-50/50 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer appearance-none"
                            >
                                {categories.map(cat => (
                                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                                ))}
                            </select>
                        </div>

                        {isManager && (
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Employé concerné</label>
                                <select
                                    value={employeeId}
                                    onChange={(e) => setEmployeeId(e.target.value)}
                                    required
                                    className="w-full h-12 px-4 rounded-2xl border border-transparent bg-slate-50/50 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer appearance-none"
                                >
                                    <option value="">Sélectionner...</option>
                                    {employees?.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Description (optionnel)</label>
                        <textarea
                            placeholder="Précisions sur le contenu du document..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full h-24 p-4 rounded-2xl border border-transparent bg-slate-50/50 text-sm font-bold resize-none outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                    </div>
                </div>

                <div className="flex gap-3 pt-4">
                    <Button
                        type="button"
                        variant="ghost"
                        className="flex-1 h-12 rounded-2xl text-slate-400 font-bold"
                        onClick={handleClose}
                    >
                        Annuler
                    </Button>
                    <Button
                        type="submit"
                        className="flex-[2] h-12 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 font-black shadow-xl shadow-slate-200 transition-all"
                        disabled={uploadMutation.isPending}
                    >
                        {uploadMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Mettre en ligne'}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}

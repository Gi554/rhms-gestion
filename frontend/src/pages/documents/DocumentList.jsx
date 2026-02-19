import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useOutletContext } from 'react-router-dom'
import {
    FileText, Search, Filter, Upload, Download, Trash2,
    File, FileArchive, FileImage, MoreVertical, Grid, List,
    Calendar, User, HardDrive, Info
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { api } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { toast } from 'sonner'
import UploadDocumentModal from './UploadDocumentModal'

export default function DocumentList() {
    const { userProfile } = useOutletContext()
    const queryClient = useQueryClient()
    const [search, setSearch] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('all')
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
    const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'

    const currentOrgId = userProfile?.organizations?.[0]?.id
    const isAdmin = userProfile?.is_superuser || userProfile?.is_staff
    const userRole = userProfile?.organizations?.[0]?.role
    const isManager = userRole === 'admin' || userRole === 'manager' || userRole === 'owner' || isAdmin

    // Fetch Documents
    const { data: documents, isLoading } = useQuery({
        queryKey: ['documents', currentOrgId, categoryFilter],
        queryFn: async () => {
            const params = { organization: currentOrgId }
            if (categoryFilter !== 'all') params.category = categoryFilter
            const res = await api.getDocuments(params)
            return res.data.results || res.data
        }
    })

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: (id) => api.deleteDocument(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents'] })
            toast.success('Document supprimé.')
        }
    })

    // Categories config
    const categoryConfig = {
        contract: { label: 'Contrats', color: 'bg-blue-100 text-blue-700', icon: FileText },
        id: { label: 'Identité', color: 'bg-purple-100 text-purple-700', icon: User },
        certificate: { label: 'Certificats', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
        payslip: { label: 'Paie', color: 'bg-amber-100 text-amber-700', icon: FileDigit },
        other: { label: 'Autres', color: 'bg-gray-100 text-gray-700', icon: File },
    }

    const filteredDocs = useMemo(() => {
        if (!documents) return []
        return documents.filter(doc => {
            const matchesSearch = !search ||
                doc.title.toLowerCase().includes(search.toLowerCase()) ||
                doc.employee_detail?.full_name?.toLowerCase().includes(search.toLowerCase())
            return matchesSearch
        })
    }, [documents, search])

    const formatSize = (bytes) => {
        if (!bytes) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
    }

    if (isLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Documents RH</h1>
                    <p className="text-gray-500 mt-1">
                        {isManager ? "Gérez les dossiers numériques de vos collaborateurs" : "Accédez à vos documents personnels"}
                    </p>
                </div>
                <Button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="bg-primary hover:bg-primary/90 text-white rounded-2xl h-12 px-8 shadow-xl shadow-primary/20"
                >
                    <Upload className="mr-2 h-5 w-5" />
                    Ajouter un document
                </Button>
            </div>

            {/* Storage Info (Simulated) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-none shadow-sm rounded-3xl bg-white p-4 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                        <HardDrive className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Utilisation</p>
                        <p className="text-sm font-bold text-gray-900">1.2 GB / 5 GB</p>
                    </div>
                </Card>
                {/* Quick Filters */}
                <div className="md:col-span-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {['all', 'contract', 'id', 'certificate', 'payslip', 'other'].map(cat => (
                        <button
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            className={cn(
                                "px-5 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all duration-200",
                                categoryFilter === cat
                                    ? "bg-gray-900 text-white shadow-lg"
                                    : "bg-white text-gray-500 hover:bg-gray-50"
                            )}
                        >
                            {cat === 'all' ? 'Tous les fichiers' : categoryConfig[cat]?.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <Input
                        placeholder="Rechercher par titre ou employé..."
                        className="w-full pl-12 h-12 rounded-2xl border-none bg-white shadow-sm focus:ring-2 focus:ring-primary/20"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex bg-white p-1 rounded-xl shadow-sm">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={cn("p-2 rounded-lg transition-colors", viewMode === 'grid' ? "bg-gray-100 text-gray-900" : "text-gray-400 hover:text-gray-600")}
                    >
                        <Grid className="h-5 w-5" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={cn("p-2 rounded-lg transition-colors", viewMode === 'list' ? "bg-gray-100 text-gray-900" : "text-gray-400 hover:text-gray-600")}
                    >
                        <List className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Files View */}
            {filteredDocs.length > 0 ? (
                viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredDocs.map(doc => {
                            const Icon = categoryConfig[doc.category]?.icon || File
                            return (
                                <Card key={doc.id} className="group border-none shadow-sm rounded-3xl bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-6", categoryConfig[doc.category]?.color)}>
                                                <Icon className="h-7 w-7" />
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5">
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                                {isManager && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50"
                                                        onClick={() => deleteMutation.mutate(doc.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                        <h3 className="font-bold text-gray-900 line-clamp-1 mb-1" title={doc.title}>{doc.title}</h3>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                                            {categoryConfig[doc.category]?.label} • {formatSize(doc.file_size)}
                                        </p>

                                        <div className="flex items-center gap-2 pt-4 border-t border-gray-50">
                                            <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 overflow-hidden shrink-0">
                                                {doc.employee_detail?.full_name?.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <span className="text-xs font-medium text-gray-600 truncate">{doc.employee_detail?.full_name}</span>
                                            <span className="text-[10px] text-gray-400 ml-auto">{format(new Date(doc.uploaded_at), 'dd MMM yyyy')}</span>
                                        </div>
                                    </div>
                                    <a
                                        href={doc.file}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block p-3 text-center text-[11px] font-black uppercase tracking-[0.2em] bg-gray-50 text-gray-400 hover:bg-primary hover:text-white transition-all border-t border-gray-100"
                                    >
                                        Consulter le fichier
                                    </a>
                                </Card>
                            )
                        })}
                    </div>
                ) : (
                    <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50/50">
                                        <tr>
                                            <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Document</th>
                                            <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Propriétaire</th>
                                            <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Catégorie</th>
                                            <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Taille</th>
                                            <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredDocs.map(doc => (
                                            <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors group">
                                                <td className="px-8 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", categoryConfig[doc.category]?.color)}>
                                                            <FileText className="h-5 w-5" />
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-gray-900 text-sm">{doc.title}</div>
                                                            <div className="text-[10px] text-gray-400 font-medium">Mis en ligne le {format(new Date(doc.uploaded_at), 'dd/MM/yyyy')}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 overflow-hidden">
                                                            {doc.employee_detail?.full_name?.split(' ').map(n => n[0]).join('')}
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-700">{doc.employee_detail?.full_name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-4 whitespace-nowrap">
                                                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] uppercase font-black", categoryConfig[doc.category]?.color)}>
                                                        {categoryConfig[doc.category]?.label}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                                                    {formatSize(doc.file_size)}
                                                </td>
                                                <td className="px-8 py-4 whitespace-nowrap text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/5 hover:text-primary transition-colors">
                                                            <Download className="h-4.5 w-4.5" />
                                                        </Button>
                                                        {isManager && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-9 w-9 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors"
                                                                onClick={() => deleteMutation.mutate(doc.id)}
                                                            >
                                                                <Trash2 className="h-4.5 w-4.5" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )
            ) : (
                <div className="flex flex-col items-center justify-center py-32 text-center">
                    <div className="bg-gray-50 p-8 rounded-[3rem] mb-6">
                        <FileArchive className="h-16 w-16 text-gray-200" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">Aucun document</h3>
                    <p className="text-gray-500 mt-2 max-w-sm font-medium">
                        Cette section est vide pour le moment. Commencez par ajouter votre premier document ou changez vos filtres.
                    </p>
                    <Button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="mt-8 bg-gray-900 text-white rounded-2xl px-10 h-14 font-bold shadow-2xl shadow-gray-200"
                    >
                        <Plus className="mr-2 h-5 w-5" />
                        Importer un fichier
                    </Button>
                </div>
            )}

            <UploadDocumentModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                userProfile={userProfile}
            />
        </div>
    )
}

function Plus(props) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
        </svg>
    )
}

function CheckCircle2(props) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    )
}

function FileDigit(props) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4" />
            <polyline points="14 2 14 8 20 8" />
            <rect width="4" height="6" x="2" y="12" rx="2" />
            <path d="M10 12h2v6" />
            <path d="M10 18h4" />
        </svg>
    )
}

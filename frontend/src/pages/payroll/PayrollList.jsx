import { useState, useMemo, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useOutletContext } from 'react-router-dom'
import jsPDF from 'jsPDF'
import html2canvas from 'html2canvas'
import {
    FileText, Search, Calendar, Filter, Download,
    ChevronRight, CreditCard, PieChart, TrendingUp,
    MoreHorizontal, Eye, FileDigit, DownloadCloud,
    Loader2, Plus, Edit2, Trash2, Building2, User2,
    ShieldCheck, Banknote, Printer, Settings, Upload,
    CheckCircle2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Modal from '@/components/ui/modal'
import { api } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { toast } from 'sonner'
import CreatePayrollModal from './CreatePayrollModal'

export default function PayrollList() {
    const { userProfile } = useOutletContext()
    const queryClient = useQueryClient()
    const [search, setSearch] = useState('')
    const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString())
    const [monthFilter, setMonthFilter] = useState((new Date().getMonth() + 1).toString())
    const [selectedPayroll, setSelectedPayroll] = useState(null)
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
    const [isDownloading, setIsDownloading] = useState(false)
    const payslipRef = useRef(null)

    // Manual Creation/Edition State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [payrollToEdit, setPayrollToEdit] = useState(null)

    // Organization Editing State
    const [isOrgModalOpen, setIsOrgModalOpen] = useState(false)
    const orgId = userProfile?.organizations?.[0]?.id

    // Role detection
    const isAdmin = userProfile?.is_superuser || userProfile?.is_staff
    const userRole = userProfile?.organizations?.[0]?.role
    const isManager = userRole === 'admin' || userRole === 'manager' || userRole === 'owner' || isAdmin

    // Fetch Organization Details
    const { data: organization, isLoading: isOrgLoading } = useQuery({
        queryKey: ['organization', orgId],
        queryFn: async () => {
            if (!orgId) return null
            const res = await api.getOrganization(orgId)
            return res.data
        },
        enabled: !!orgId
    })

    // Fetch Payrolls
    const { data: payrolls, isLoading } = useQuery({
        queryKey: ['payrolls', isManager, yearFilter],
        queryFn: async () => {
            const params = { year: yearFilter }
            const res = isManager
                ? await api.getPayrolls(params)
                : await api.getMyPayrolls()
            return res.data.results || res.data
        }
    })

    // Mutations
    const updateOrgMutation = useMutation({
        mutationFn: (data) => api.patchOrganization(orgId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organization', orgId] })
            toast.success('Informations de l\'entreprise mises à jour.')
            setIsOrgModalOpen(false)
        },
        onError: () => toast.error('Erreur lors de la mise à jour.')
    })

    const generateMutation = useMutation({
        mutationFn: (data) => api.generatePayrolls(data),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['payrolls'] })
            toast.success(res.data.message || 'Génération terminée !')
        },
        onError: () => toast.error('Erreur lors de la génération.')
    })

    const deleteMutation = useMutation({
        mutationFn: (id) => api.deletePayroll(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payrolls'] })
            toast.success('Fiche supprimée.')
        },
        onError: () => toast.error('Erreur suppression.')
    })

    const handleGenerate = () => {
        if (monthFilter === 'all') return toast.error('Mois spécifique requis.')
        const monthName = months.find(m => m.value === monthFilter)?.label
        if (window.confirm(`Générer pour ${monthName} ${yearFilter} ?`)) {
            generateMutation.mutate({ month: parseInt(monthFilter), year: parseInt(yearFilter) })
        }
    }

    const handleDelete = (p) => {
        if (window.confirm(`Supprimer cette fiche ?`)) deleteMutation.mutate(p.id)
    }

    const handleDownloadPDF = async () => {
        if (!selectedPayroll || !payslipRef.current) return
        setIsDownloading(true)
        try {
            const element = payslipRef.current
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            })
            const imgData = canvas.toDataURL('image/png')
            const pdf = new jsPDF('p', 'mm', 'a4')
            const pdfWidth = pdf.internal.pageSize.getWidth()
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
            pdf.save(`Bulletin_${selectedPayroll.employee_detail.last_name}_${selectedPayroll.month}_${selectedPayroll.year}.pdf`)
            toast.success('PDF téléchargé')
        } catch (error) {
            console.error(error)
            toast.error('Erreur PDF')
        } finally {
            setIsDownloading(false)
        }
    }

    const months = [
        { value: '1', label: 'Janvier' }, { value: '2', label: 'Février' },
        { value: '3', label: 'Mars' }, { value: '4', label: 'Avril' },
        { value: '5', label: 'Mai' }, { value: '6', label: 'Juin' },
        { value: '7', label: 'Juillet' }, { value: '8', label: 'Août' },
        { value: '9', label: 'Septembre' }, { value: '10', label: 'Octobre' },
        { value: '11', label: 'Novembre' }, { value: '12', label: 'Décembre' }
    ]

    const filteredPayrolls = useMemo(() => {
        if (!payrolls) return []
        return payrolls.filter(p => {
            const matchesMonth = monthFilter === 'all' || p.month.toString() === monthFilter
            const matchesSearch = !search || p.employee_detail?.full_name?.toLowerCase().includes(search.toLowerCase())
            return matchesMonth && matchesSearch
        })
    }, [payrolls, monthFilter, search])

    const stats = useMemo(() => {
        if (!filteredPayrolls.length) return { totalNet: 0, totalGross: 0, count: 0 }
        return {
            totalNet: filteredPayrolls.reduce((sum, p) => sum + parseFloat(p.net_salary), 0),
            totalGross: filteredPayrolls.reduce((sum, p) => sum + parseFloat(p.base_salary) + parseFloat(p.bonuses), 0),
            count: filteredPayrolls.length
        }
    }, [filteredPayrolls])

    if (isLoading || isOrgLoading) return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20 p-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Gestion de la Paie</h1>
                    <p className="text-sm text-slate-500 font-medium">Configurez vos bulletins et signatures officielles</p>
                </div>
                {isManager && (
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" className="h-10 rounded-xl" onClick={() => setIsOrgModalOpen(true)}>
                            <Settings className="mr-2 h-4 w-4" /> Config
                        </Button>
                        <Button variant="outline" className="h-10 rounded-xl" onClick={() => { setPayrollToEdit(null); setIsCreateModalOpen(true); }}>
                            <Plus className="mr-2 h-4 w-4" /> Ajouter
                        </Button>
                        <Button className="h-10 rounded-xl bg-slate-900 shadow-md shadow-slate-200" onClick={handleGenerate} disabled={generateMutation.isPending}>
                            {generateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TrendingUp className="mr-2 h-4 w-4" />}
                            Générer
                        </Button>
                    </div>
                )}
            </div>

            {/* Stats */}
            {isManager && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    {[
                        { label: 'Masse Salariale Net', val: `${stats.totalNet.toLocaleString()} €`, icon: Banknote, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Fiches ce mois', val: stats.count, icon: FileText, color: 'text-slate-600', bg: 'bg-slate-50' },
                        { label: 'Brut Global', val: `${stats.totalGross.toLocaleString()} €`, icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-50' }
                    ].map((s, i) => (
                        <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className={cn("p-3 rounded-xl", s.bg, s.color)}><s.icon className="h-5 w-5" /></div>
                            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</p><p className="text-xl font-black text-slate-900 tracking-tight">{s.val}</p></div>
                        </div>
                    ))}
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input placeholder="Rechercher par nom..." className="pl-10 h-10 rounded-lg border-slate-100" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <div className="flex gap-2">
                    <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className="h-10 px-3 rounded-lg border border-slate-100 text-sm font-medium focus:ring-1 focus:ring-slate-200 outline-none">
                        {['2024', '2025', '2026'].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className="h-10 px-3 rounded-lg border border-slate-100 text-sm font-medium focus:ring-1 focus:ring-slate-200 outline-none min-w-[140px]">
                        <option value="all">Tous les mois</option>
                        {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4 text-left font-bold text-slate-400 uppercase text-[10px] tracking-widest">Période</th>
                            {isManager && <th className="px-6 py-4 text-left font-bold text-slate-400 uppercase text-[10px] tracking-widest">Employé</th>}
                            <th className="px-6 py-4 text-left font-bold text-slate-400 uppercase text-[10px] tracking-widest">Salaire Net</th>
                            <th className="px-6 py-4 text-left font-bold text-slate-400 uppercase text-[10px] tracking-widest">État</th>
                            <th className="px-6 py-4 text-right font-bold text-slate-400 uppercase text-[10px] tracking-widest">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredPayrolls.map((p) => (
                            <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 font-bold text-slate-700">{months.find(m => m.value === p.month.toString())?.label} {p.year}</td>
                                {isManager && <td className="px-6 py-4 font-medium text-slate-600">{p.employee_detail?.full_name}</td>}
                                <td className="px-6 py-4 font-black text-slate-900">{parseFloat(p.net_salary).toLocaleString()} €</td>
                                <td className="px-6 py-4">
                                    <span className={cn("px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider", p.status === 'paid' ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600")}>
                                        {p.status === 'paid' ? 'Payé' : p.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => { setSelectedPayroll(p); setIsDetailModalOpen(true); }}><Eye className="h-4 w-4" /></Button>
                                        {isManager && p.status === 'draft' && (
                                            <>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => { setPayrollToEdit(p); setIsCreateModalOpen(true); }}><Edit2 className="h-3.5 w-3.5" /></Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(p)}><Trash2 className="h-3.5 w-3.5" /></Button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <CreatePayrollModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} userProfile={userProfile} editData={payrollToEdit} />

            {/* ORG SETTINGS MODAL - COMPACT VERSION */}
            <Modal isOpen={isOrgModalOpen} onClose={() => setIsOrgModalOpen(false)} title="Identité de l'Entreprise" maxWidth="max-w-md">
                <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    updateOrgMutation.mutate(formData);
                }} className="space-y-4 pt-2">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase">Nom</label>
                            <Input name="name" defaultValue={organization?.name} required className="rounded-lg h-10 text-sm" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase">SIRET</label>
                            <Input name="siret" defaultValue={organization?.siret} placeholder="123 456..." className="rounded-lg h-10 text-sm" />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase">Siège Social</label>
                        <textarea name="address" defaultValue={organization?.address} className="w-full h-16 p-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-slate-300 resize-none" />
                    </div>

                    <div className="grid grid-cols-2 gap-3 pb-2">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase">Logo</label>
                            <div className="relative group h-24 rounded-xl border-2 border-dashed border-slate-100 bg-slate-50 flex items-center justify-center overflow-hidden">
                                {organization?.logo ? (
                                    <img src={organization.logo} className="w-full h-full object-contain p-1" alt="Logo" />
                                ) : (
                                    <Upload className="h-5 w-5 text-slate-300" />
                                )}
                                <Input type="file" name="logo" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase">Cachet</label>
                            <div className="relative group h-24 rounded-xl border-2 border-dashed border-slate-100 bg-slate-50 flex items-center justify-center overflow-hidden">
                                {organization?.digital_stamp ? (
                                    <img src={organization.digital_stamp} className="w-full h-full object-contain p-1" alt="Signature" />
                                ) : (
                                    <Edit2 className="h-5 w-5 text-slate-300" />
                                )}
                                <Input type="file" name="digital_stamp" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                            </div>
                        </div>
                    </div>

                    <Button type="submit" className="w-full h-11 rounded-xl bg-slate-900 shadow-lg shadow-slate-100 font-bold" disabled={updateOrgMutation.isPending}>
                        {updateOrgMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Enregistrer'}
                    </Button>
                </form>
            </Modal>

            {/* PAYSLIP MODAL */}
            <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Bulletin de Paie Officiel" maxWidth="max-w-4xl">
                {selectedPayroll && (
                    <div className="flex flex-col gap-4">
                        <div className="max-h-[70vh] overflow-y-auto rounded-xl border border-slate-100 p-1 bg-slate-50/30">
                            <div ref={payslipRef} className="bg-white p-12 mx-auto origin-top" style={{ width: '210mm', minHeight: '290mm', fontSize: '12px', color: '#1a1a1a' }}>
                                {/* Header */}
                                <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-8">
                                    <div className="flex gap-6 items-start">
                                        {organization?.logo ? (
                                            <img src={organization.logo} className="h-14 w-14 object-contain" alt="Logo" />
                                        ) : (
                                            <div className="h-14 w-14 bg-slate-900 rounded flex items-center justify-center text-white text-[10px]">LOGO</div>
                                        )}
                                        <div>
                                            <p className="text-lg font-black uppercase leading-tight">{organization?.name || 'ENTREPRISE'}</p>
                                            <p className="text-gray-500 text-[10px] mt-1 max-w-[250px] whitespace-pre-wrap">{organization?.address || 'Adresse non renseignée'}</p>
                                            <p className="text-gray-900 text-[10px] font-bold mt-2 tracking-tight">SIRET : <span className="font-mono">{organization?.siret || '—'}</span></p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <h2 className="text-2xl font-black uppercase tracking-tighter mb-1 leading-none">Bulletin de Paie</h2>
                                        <div className="inline-block border-2 border-black px-3 py-1 mt-2">
                                            <p className="font-black text-base">{months.find(m => m.value === selectedPayroll.month.toString())?.label} {selectedPayroll.year}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Employee Info */}
                                <div className="grid grid-cols-2 gap-8 mb-10">
                                    <div className="border border-black p-4 relative">
                                        <span className="absolute -top-2.5 left-2 bg-white px-1.5 text-[9px] font-bold uppercase tracking-widest">Salarié</span>
                                        <div className="space-y-0.5">
                                            <p className="text-base font-black uppercase">{selectedPayroll.employee_detail?.full_name}</p>
                                            <p className="text-[11px] font-medium">Matricule : {selectedPayroll.employee_detail?.employee_id}</p>
                                            <p className="text-[11px] font-medium">Position : {selectedPayroll.employee_detail?.position || 'Agent'}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-1 text-right text-[10px]">
                                        <p><span className="text-gray-400 uppercase font-black mr-2">N° Bulletin :</span> <span className="font-mono font-bold tracking-tight">#PAIE-{selectedPayroll.id}</span></p>
                                        <p><span className="text-gray-400 uppercase font-black mr-2">Paiement :</span> <span className="font-bold">30/{selectedPayroll.month}/{selectedPayroll.year}</span></p>
                                        <p><span className="text-gray-400 uppercase font-black mr-2">Méthode :</span> <span className="font-bold">Virement</span></p>
                                    </div>
                                </div>

                                {/* Salary Table */}
                                <div className="mb-12">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="border-y-2 border-black text-[10px] font-black uppercase tracking-widest">
                                                <th className="py-3 text-left w-1/2">Libellé</th>
                                                <th className="py-3 text-center">Quantité</th>
                                                <th className="py-3 text-right">Gains (€)</th>
                                                <th className="py-3 text-right">Retenues (€)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-[11px] divide-y divide-gray-100">
                                            <tr className="font-bold text-gray-800">
                                                <td className="py-4 font-black">Salaire de Base</td>
                                                <td className="py-4 text-center">151.67 H</td>
                                                <td className="py-4 text-right">{parseFloat(selectedPayroll.base_salary).toLocaleString()}</td>
                                                <td className="py-4 text-right">—</td>
                                            </tr>
                                            {selectedPayroll.bonuses > 0 && (
                                                <tr className="text-emerald-700 font-medium">
                                                    <td className="py-4">Primes / Indemnités</td>
                                                    <td className="py-4 text-center">—</td>
                                                    <td className="py-4 text-right">{parseFloat(selectedPayroll.bonuses).toLocaleString()}</td>
                                                    <td className="py-4 text-right">—</td>
                                                </tr>
                                            )}
                                            {selectedPayroll.deductions > 0 && (
                                                <tr className="text-red-700 font-medium">
                                                    <td className="py-4">Cotisations Salariales</td>
                                                    <td className="py-4 text-center">—</td>
                                                    <td className="py-4 text-right">—</td>
                                                    <td className="py-4 text-right">{parseFloat(selectedPayroll.deductions).toLocaleString()}</td>
                                                </tr>
                                            )}
                                        </tbody>
                                        <tfoot>
                                            <tr className="border-t-2 border-black">
                                                <td colSpan="2" className="py-6 text-right font-black uppercase text-xs pr-8 tracking-widest">Net à Payer</td>
                                                <td colSpan="2" className="py-6 text-right">
                                                    <span className="text-3xl font-black border-[3px] border-black px-5 py-1.5 inline-block">
                                                        {parseFloat(selectedPayroll.net_salary).toLocaleString()} <span className="text-xs font-medium ml-1">€</span>
                                                    </span>
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>

                                {/* Footer */}
                                <div className="mt-auto border-t border-gray-100 pt-6 flex justify-between items-start">
                                    <div className="max-w-xs">
                                        <p className="text-[9px] text-gray-400 italic leading-relaxed">
                                            Veuillez conserver ce bulletin sans limitation de durée.
                                            Certification HR numérique active pour l'organisation {organization?.name}.
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        {organization?.digital_stamp && (
                                            <div className="text-center">
                                                <img src={organization.digital_stamp} className="h-16 w-32 object-contain mix-blend-multiply opacity-90" alt="Signature" />
                                                <div className="flex items-center justify-center gap-1 mt-1 text-green-600">
                                                    <CheckCircle2 className="h-2.5 w-2.5" />
                                                    <span className="text-[7px] font-black uppercase tracking-tighter">Signé Numériquement</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Simplified Action Bar */}
                        <div className="flex gap-3 p-1">
                            <Button onClick={handleDownloadPDF} disabled={isDownloading} className="flex-1 h-12 bg-slate-900 hover:bg-black text-white rounded-xl font-black gap-2 text-sm shadow-md">
                                {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <DownloadCloud className="h-4 w-4" />}
                                Télécharger le PDF
                            </Button>
                            <Button variant="outline" className="h-12 px-6 rounded-xl border-slate-200 font-bold text-sm" onClick={() => setIsDetailModalOpen(false)}>Quitter</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    )
}

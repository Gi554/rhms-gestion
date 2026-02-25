import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Modal from '@/components/ui/modal'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'

export default function CreatePayrollModal({ isOpen, onClose, userProfile, editData = null }) {
    const queryClient = useQueryClient()
    const [formData, setFormData] = useState({
        employee: '',
        month: (new Date().getMonth() + 1).toString(),
        year: new Date().getFullYear().toString(),
        base_salary: '0',
        bonuses: '0',
        deductions: '0',
        notes: '',
        status: 'draft'
    })

    const isEditing = !!editData
    const currentOrgId = userProfile?.organizations?.[0]?.id

    useEffect(() => {
        if (editData && isOpen) {
            setFormData({
                employee: editData.employee,
                month: editData.month.toString(),
                year: editData.year.toString(),
                base_salary: editData.base_salary,
                bonuses: editData.bonuses,
                deductions: editData.deductions,
                notes: editData.notes || '',
                status: editData.status
            })
        } else if (isOpen) {
            setFormData({
                employee: '',
                month: (new Date().getMonth() + 1).toString(),
                year: new Date().getFullYear().toString(),
                base_salary: '0',
                bonuses: '0',
                deductions: '0',
                notes: '',
                status: 'draft'
            })
        }
    }, [editData, isOpen])

    const { data: employees } = useQuery({
        queryKey: ['employees', currentOrgId],
        queryFn: async () => {
            const res = await api.getEmployees({ organization: currentOrgId })
            return res.data.results || res.data
        },
        enabled: isOpen && !isEditing
    })

    useEffect(() => {
        if (!isEditing && formData.employee && employees) {
            const emp = employees.find(e => e.id.toString() === formData.employee.toString())
            if (emp && emp.salary) {
                const monthlyBase = (parseFloat(emp.salary) / 12).toFixed(2)
                setFormData(prev => ({ ...prev, base_salary: monthlyBase }))
            }
        }
    }, [formData.employee, employees, isEditing])

    const netSalary = useMemo(() => {
        const base = parseFloat(formData.base_salary) || 0
        const bonus = parseFloat(formData.bonuses) || 0
        const deduc = parseFloat(formData.deductions) || 0
        return (base + bonus - deduc).toFixed(2)
    }, [formData.base_salary, formData.bonuses, formData.deductions])

    const mutation = useMutation({
        mutationFn: (data) => isEditing
            ? api.updatePayroll(editData.id, data)
            : api.createPayroll(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payrolls'] })
            toast.success(isEditing ? 'Fiche mise à jour.' : 'Fiche créée.')
            onClose()
        },
        onError: (err) => {
            const msg = err.response?.data?.error || err.response?.data?.message || "Erreur."
            toast.error(msg)
        }
    })

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!formData.employee) return toast.error('Sélectionnez un employé.')

        const payload = {
            ...formData,
            organization: currentOrgId,
            net_salary: netSalary,
            month: parseInt(formData.month),
            year: parseInt(formData.year)
        }
        mutation.mutate(payload)
    }

    const months = [
        { value: '1', label: 'Janvier' }, { value: '2', label: 'Février' },
        { value: '3', label: 'Mars' }, { value: '4', label: 'Avril' },
        { value: '5', label: 'Mai' }, { value: '6', label: 'Juin' },
        { value: '7', label: 'Juillet' }, { value: '8', label: 'Août' },
        { value: '9', label: 'Septembre' }, { value: '10', label: 'Octobre' },
        { value: '11', label: 'Novembre' }, { value: '12', label: 'Décembre' }
    ]

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? "Modifier la fiche" : "Nouvelle fiche de paie"}
            description="Gestion des salaires et primes"
            maxWidth="max-w-xl"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Employé</label>
                    <select
                        value={formData.employee}
                        onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
                        required
                        disabled={isEditing}
                        className="w-full h-12 px-4 rounded-2xl border border-transparent bg-slate-50/50 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer appearance-none"
                    >
                        <option value="">Choisir un employé...</option>
                        {employees?.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                        ))}
                        {isEditing && editData.employee_detail && (
                            <option value={editData.employee}>{editData.employee_detail.full_name}</option>
                        )}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Mois</label>
                        <select
                            value={formData.month}
                            onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                            className="w-full h-12 px-4 rounded-2xl border border-transparent bg-slate-50/50 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
                        >
                            {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Année</label>
                        <select
                            value={formData.year}
                            onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                            className="w-full h-12 px-4 rounded-2xl border border-transparent bg-slate-50/50 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
                        >
                            {['2024', '2025', '2026'].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-[2rem] border border-slate-100">
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Salaire de Base</label>
                        <Input
                            type="number"
                            step="0.01"
                            value={formData.base_salary}
                            onChange={(e) => setFormData({ ...formData, base_salary: e.target.value })}
                            className="h-10 px-3 rounded-xl border-transparent bg-white text-xs font-bold"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-emerald-600 uppercase ml-1">Primes</label>
                        <Input
                            type="number"
                            step="0.01"
                            value={formData.bonuses}
                            onChange={(e) => setFormData({ ...formData, bonuses: e.target.value })}
                            className="h-10 px-3 rounded-xl border-transparent bg-white text-xs font-bold text-emerald-600 focus:ring-emerald-500/20"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-rose-600 uppercase ml-1">Retenues</label>
                        <Input
                            type="number"
                            step="0.01"
                            value={formData.deductions}
                            onChange={(e) => setFormData({ ...formData, deductions: e.target.value })}
                            className="h-10 px-3 rounded-xl border-transparent bg-white text-xs font-bold text-rose-600 focus:ring-rose-500/20"
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between p-6 bg-slate-900 rounded-[2rem] text-white shadow-xl shadow-slate-200">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Net à payer estimé</p>
                        <p className="text-2xl font-black">{parseFloat(netSalary).toLocaleString()} €</p>
                    </div>
                    <div className="text-right">
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="bg-slate-800 px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest outline-none cursor-pointer border border-slate-700"
                        >
                            <option value="draft">Brouillon</option>
                            <option value="processed">Traité</option>
                            <option value="paid">Payé</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Notes internes</label>
                    <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="w-full h-20 p-4 rounded-2xl border border-transparent bg-slate-50/50 text-sm font-bold resize-none outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder="Détails des primes, régularisations..."
                    />
                </div>

                <div className="flex gap-3 pt-4">
                    <Button
                        type="button"
                        variant="ghost"
                        className="flex-1 h-12 rounded-2xl text-slate-400 font-bold"
                        onClick={onClose}
                    >
                        Annuler
                    </Button>
                    <Button
                        type="submit"
                        disabled={mutation.isPending}
                        className="flex-[2] h-12 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 font-black shadow-xl shadow-slate-200 transition-all"
                    >
                        {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                {isEditing ? 'Mettre à jour' : 'Générer la fiche'}
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}

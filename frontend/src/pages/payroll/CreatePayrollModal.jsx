import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Calculator, Save, X, User, Calendar, CreditCard, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Modal from '@/components/ui/modal'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

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

    // Reset or load data
    useEffect(() => {
        if (editData) {
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
        } else {
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

    // Fetch employees for dropdown
    const { data: employees } = useQuery({
        queryKey: ['employees', currentOrgId],
        queryFn: async () => {
            const res = await api.getEmployees({ organization: currentOrgId })
            return res.data.results || res.data
        },
        enabled: isOpen && !isEditing
    })

    // Update base salary when employee is selected (initial load)
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
            title={isEditing ? "Éditer la fiche" : "Nouvelle fiche"}
            maxWidth="max-w-md"
        >
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                {/* Employee Selection - More Compact */}
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Employé & Période</label>
                    <div className="flex gap-2">
                        <select
                            value={formData.employee}
                            onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
                            required
                            disabled={isEditing}
                            className="flex-1 h-10 px-3 rounded-lg border border-slate-100 bg-slate-50/50 text-sm font-medium outline-none focus:ring-1 focus:ring-slate-300 transition-all"
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
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Mois</label>
                        <select
                            value={formData.month}
                            onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                            className="w-full h-10 px-3 rounded-lg border border-slate-100 bg-slate-50/50 text-sm font-medium outline-none"
                        >
                            {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Année</label>
                        <select
                            value={formData.year}
                            onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                            className="w-full h-10 px-3 rounded-lg border border-slate-100 bg-slate-50/50 text-sm font-medium outline-none"
                        >
                            {['2024', '2025', '2026'].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                </div>

                {/* Money Fields - Grid 3 cols */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Base</label>
                        <Input
                            type="number"
                            step="0.01"
                            value={formData.base_salary}
                            onChange={(e) => setFormData({ ...formData, base_salary: e.target.value })}
                            className="h-9 px-2 rounded-lg border-slate-200 bg-white text-xs"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-bold text-emerald-600 uppercase ml-1">Primes</label>
                        <Input
                            type="number"
                            step="0.01"
                            value={formData.bonuses}
                            onChange={(e) => setFormData({ ...formData, bonuses: e.target.value })}
                            className="h-9 px-2 rounded-lg border-emerald-100 bg-emerald-50/50 text-emerald-700 text-xs"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-bold text-red-500 uppercase ml-1">Retenues</label>
                        <Input
                            type="number"
                            step="0.01"
                            value={formData.deductions}
                            onChange={(e) => setFormData({ ...formData, deductions: e.target.value })}
                            className="h-9 px-2 rounded-lg border-red-100 bg-red-50/50 text-red-700 text-xs"
                        />
                    </div>
                </div>

                {/* Net Summary - Ultra Compact */}
                <div className="flex items-center justify-between p-4 bg-slate-900 rounded-2xl text-white shadow-lg shadow-slate-200">
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Net à payer</p>
                        <p className="text-xl font-black">{parseFloat(netSalary).toLocaleString()} €</p>
                    </div>
                    <div className="text-right">
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="bg-slate-800 px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-tighter outline-none cursor-pointer border border-slate-700"
                        >
                            <option value="draft">Brouillon</option>
                            <option value="processed">Traité</option>
                            <option value="paid">Payé</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Notes internes (facultatif)</label>
                    <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="w-full h-16 p-2 rounded-lg border border-slate-100 bg-slate-50/30 text-xs resize-none outline-none focus:ring-1 focus:ring-slate-200"
                        placeholder="Primes exceptionnelles, etc..."
                    />
                </div>

                <div className="flex gap-2 pt-2">
                    <Button
                        type="button"
                        variant="ghost"
                        className="flex-1 h-11 rounded-xl text-slate-500 font-bold text-sm"
                        onClick={onClose}
                    >
                        Annuler
                    </Button>
                    <Button
                        type="submit"
                        disabled={mutation.isPending}
                        className="flex-[2] h-11 rounded-xl bg-slate-900 text-white hover:bg-black font-black text-sm transition-all"
                    >
                        {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                {isEditing ? 'Mettre à jour' : 'Enregistrer'}
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}

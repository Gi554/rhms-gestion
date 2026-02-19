import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

export default function EditEmployeeModal({ isOpen, onClose, employee, organizationId }) {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        position: '',
        status: 'active',
        department: '',
        manager: '',
        hire_date: '',
    });

    // Populate form when employee changes
    useEffect(() => {
        if (employee) {
            setFormData({
                first_name: employee.first_name || '',
                last_name: employee.last_name || '',
                email: employee.email || '',
                phone: employee.phone || '',
                position: employee.position || '',
                status: employee.status || 'active',
                department: employee.department || '',
                manager: employee.manager || '',
                hire_date: employee.hire_date || '',
            });
        }
    }, [employee]);

    // Fetch departments
    const { data: departments } = useQuery({
        queryKey: ['departments', organizationId],
        queryFn: async () => {
            const res = await api.getDepartments({ organization: organizationId });
            return res.data.results || res.data;
        },
        enabled: !!organizationId && isOpen
    });

    // Fetch employees for manager selection
    const { data: allEmployees } = useQuery({
        queryKey: ['employees-minimal', organizationId],
        queryFn: async () => {
            const res = await api.getEmployees({ organization: organizationId, page_size: 100 });
            return res.data.results || res.data;
        },
        enabled: !!organizationId && isOpen
    });

    const mutation = useMutation({
        mutationFn: (data) => api.patchEmployee(employee.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employees'] });
            queryClient.invalidateQueries({ queryKey: ['employee', employee.id] });
            toast.success('Employé mis à jour !');
            onClose();
        },
        onError: (error) => {
            const data = error.response?.data;
            if (data && typeof data === 'object') {
                const firstError = Object.values(data)[0];
                const message = Array.isArray(firstError) ? firstError[0] : firstError;
                toast.error(message || "Erreur lors de la mise à jour");
            } else {
                toast.error("Erreur lors de la mise à jour");
            }
        },
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = { ...formData };
        if (!payload.department) payload.department = null;
        if (!payload.manager) payload.manager = null;
        mutation.mutate(payload);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Modifier — ${employee?.full_name}`} maxWidth="max-w-xl">
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Prénom</label>
                        <Input name="first_name" value={formData.first_name} onChange={handleChange} required className="h-10 rounded-xl" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nom</label>
                        <Input name="last_name" value={formData.last_name} onChange={handleChange} required className="h-10 rounded-xl" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Email professionnel</label>
                        <Input name="email" type="email" value={formData.email} onChange={handleChange} required className="h-10 rounded-xl" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Téléphone</label>
                        <Input name="phone" value={formData.phone} onChange={handleChange} placeholder="+33 6..." className="h-10 rounded-xl" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Poste</label>
                        <Input name="position" value={formData.position} onChange={handleChange} placeholder="ex: Designer" required className="h-10 rounded-xl" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Date d'embauche</label>
                        <Input name="hire_date" type="date" value={formData.hire_date} onChange={handleChange} className="h-10 rounded-xl" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Département</label>
                        <select
                            name="department"
                            value={formData.department}
                            onChange={handleChange}
                            className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium outline-none focus:ring-1 focus:ring-primary/20 transition-all font-bold"
                        >
                            <option value="">Non assigné</option>
                            {departments?.map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Manager Direct</label>
                        <select
                            name="manager"
                            value={formData.manager}
                            onChange={handleChange}
                            className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium outline-none focus:ring-1 focus:ring-primary/20 transition-all font-bold"
                        >
                            <option value="">Aucun manager</option>
                            {allEmployees?.filter(emp => emp.id !== employee?.id).map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Statut</label>
                    <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-bold outline-none"
                    >
                        <option value="active">Actif</option>
                        <option value="inactive">Inactif</option>
                        <option value="on_leave">En congé</option>
                        <option value="terminated">Licencié</option>
                    </select>
                </div>

                <div className="pt-4 flex gap-3">
                    <Button type="button" variant="ghost" onClick={onClose} className="flex-1 rounded-xl font-bold h-12">
                        Annuler
                    </Button>
                    <Button
                        type="submit"
                        className="flex-[2] bg-slate-900 text-white rounded-xl shadow-lg shadow-slate-200 font-black h-12"
                        disabled={mutation.isPending}
                    >
                        {mutation.isPending ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Enregistrer les modifications'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

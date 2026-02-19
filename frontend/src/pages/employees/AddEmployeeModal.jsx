import React, { useState } from 'react';
import Modal from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Loader2, Check } from 'lucide-react';

export default function AddEmployeeModal({ isOpen, onClose, organizationId }) {
    const queryClient = useQueryClient();
    const [isSuccess, setIsSuccess] = useState(false);
    const [lastEmail, setLastEmail] = useState('');
    const [lastRole, setLastRole] = useState('');
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        position: '',
        role: 'employee',
        department: '',
        manager: '',
        hire_date: new Date().toISOString().split('T')[0],
    });

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
        mutationFn: (data) => api.createEmployee(data),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['employees'] });
            setLastEmail(formData.email);
            setLastRole(formData.role);
            setIsSuccess(true);
            setFormData({
                first_name: '',
                last_name: '',
                email: '',
                position: '',
                role: 'employee',
                department: '',
                manager: '',
                hire_date: new Date().toISOString().split('T')[0],
            });
        },
        onError: (error) => {
            const data = error.response?.data;
            if (data && typeof data === 'object') {
                const firstError = Object.values(data)[0];
                const message = Array.isArray(firstError) ? firstError[0] : firstError;
                toast.error(message || 'Erreur lors de l\'ajout de l\'employé');
            } else {
                toast.error('Erreur lors de l\'ajout de l\'employé');
            }
        },
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = { ...formData, organization: organizationId };
        if (!payload.department) delete payload.department;
        if (!payload.manager || payload.manager === "") delete payload.manager;

        mutation.mutate(payload);
    };

    const handleClose = () => {
        setIsSuccess(false);
        onClose();
    };

    const copyPassword = () => {
        navigator.clipboard.writeText('Hrms2026!');
        toast.success('Mot de passe copié !');
    };

    if (isSuccess) {
        return (
            <Modal isOpen={isOpen} onClose={handleClose} title="Compte créé ! ✨" maxWidth="max-w-md">
                <div className="space-y-6 text-center py-4">
                    <div className="flex justify-center">
                        <div className="h-20 w-24 rounded-[2rem] bg-emerald-50 border-2 border-emerald-100 flex items-center justify-center text-emerald-600 animate-in zoom-in duration-300">
                            <Check className="h-10 w-10 font-bold" />
                        </div>
                    </div>

                    <div className="space-y-2 px-2">
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">C'est prêt !</h3>
                        <p className="text-sm text-gray-400 font-medium">L'employé peut maintenant se connecter.</p>
                        <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 text-left space-y-4 mt-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Email</label>
                                <div className="font-bold text-gray-900 truncate">{lastEmail}</div>
                            </div>
                            <div className="flex justify-between items-end">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Mot de passe provisoire</label>
                                    <div className="font-mono text-sm font-black text-primary">Hrms2026!</div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={copyPassword}
                                    className="h-9 px-4 rounded-xl text-xs font-bold border-slate-200"
                                >
                                    Copier
                                </Button>
                            </div>
                        </div>
                    </div>

                    <Button
                        onClick={handleClose}
                        className="w-full bg-slate-900 text-white rounded-2xl h-14 shadow-xl shadow-slate-200 font-black"
                    >
                        Terminer
                    </Button>
                </div>
            </Modal>
        );
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Nouvel Employé" maxWidth="max-w-xl">
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Prénom</label>
                        <Input name="first_name" value={formData.first_name} onChange={handleChange} placeholder="ex: Jean" required className="h-10 rounded-xl" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nom</label>
                        <Input name="last_name" value={formData.last_name} onChange={handleChange} placeholder="ex: Dupont" required className="h-10 rounded-xl" />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Email professionnel</label>
                    <Input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="jean.dupont@entreprise.com" required className="h-10 rounded-xl" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Poste</label>
                        <Input name="position" value={formData.position} onChange={handleChange} placeholder="ex: Directeur" required className="h-10 rounded-xl" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Role système</label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-bold outline-none"
                        >
                            <option value="employee">Employé</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Administrateur</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Département</label>
                        <select
                            name="department"
                            value={formData.department}
                            onChange={handleChange}
                            className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium outline-none transition-all font-bold"
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
                            className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium outline-none transition-all font-bold"
                        >
                            <option value="">Sélectionner...</option>
                            {allEmployees?.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Date d'embauche</label>
                    <Input name="hire_date" type="date" value={formData.hire_date} onChange={handleChange} required className="h-10 rounded-xl" />
                </div>

                <div className="pt-4 flex gap-3">
                    <Button type="button" variant="ghost" onClick={onClose} className="flex-1 rounded-xl font-bold h-12 text-gray-500">
                        Annuler
                    </Button>
                    <Button
                        type="submit"
                        className="flex-[2] bg-slate-900 text-white rounded-xl shadow-lg shadow-slate-200 font-black h-12"
                        disabled={mutation.isPending}
                    >
                        {mutation.isPending ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Créer le compte employé'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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
                hire_date: employee.hire_date || '',
            });
        }
    }, [employee]);

    // Fetch departments for the select
    const { data: departments } = useQuery({
        queryKey: ['departments', organizationId],
        queryFn: async () => {
            const res = await api.getDepartments({ organization: organizationId });
            return res.data.results || res.data;
        },
        enabled: !!organizationId && isOpen
    });

    const mutation = useMutation({
        mutationFn: (data) => api.patchEmployee(employee.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employees'] });
            toast.success('Employé mis à jour avec succès !');
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
        if (!payload.department) delete payload.department;
        mutation.mutate(payload);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Modifier — ${employee?.first_name} ${employee?.last_name}`}>
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Prénom</label>
                        <Input name="first_name" value={formData.first_name} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Nom</label>
                        <Input name="last_name" value={formData.last_name} onChange={handleChange} required />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <Input name="email" type="email" value={formData.email} onChange={handleChange} required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Téléphone</label>
                        <Input name="phone" value={formData.phone} onChange={handleChange} placeholder="+33 6 00 00 00 00" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Date d'embauche</label>
                        <Input name="hire_date" type="date" value={formData.hire_date} onChange={handleChange} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Poste</label>
                        <Input name="position" value={formData.position} onChange={handleChange} placeholder="Développeur" required />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Département</label>
                        <select
                            name="department"
                            value={formData.department}
                            onChange={handleChange}
                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        >
                            <option value="">Non assigné</option>
                            {departments?.map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Statut</label>
                    <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                        <option value="active">Actif</option>
                        <option value="inactive">Inactif</option>
                        <option value="on_leave">En congé</option>
                        <option value="terminated">Licencié</option>
                    </select>
                </div>

                <div className="pt-4 flex gap-3">
                    <Button type="button" variant="outline" onClick={onClose} className="flex-1 rounded-xl">
                        Annuler
                    </Button>
                    <Button
                        type="submit"
                        className="flex-1 bg-primary text-white rounded-xl shadow-lg shadow-primary/20"
                        disabled={mutation.isPending}
                    >
                        {mutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

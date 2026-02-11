import React, { useState } from 'react';
import Modal from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';

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
        hire_date: new Date().toISOString().split('T')[0],
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
                hire_date: new Date().toISOString().split('T')[0],
            });
        },
        onError: (error) => {
            const data = error.response?.data;
            if (data && typeof data === 'object') {
                // If it's a field error object, show the first error message
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
        mutation.mutate({
            ...formData,
            organization: organizationId,
        });
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
            <Modal isOpen={isOpen} onClose={handleClose} title="Compte créé avec succès ! ✨">
                <div className="space-y-6 text-center py-4">
                    <div className="flex justify-center">
                        <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center text-green-600 animate-bounce">
                            <Plus className="h-10 w-10 rotate-45" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-gray-600">L'employé a été ajouté et son compte utilisateur est prêt.</p>
                        <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100 text-left space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Identifiant (Email)</label>
                                    <div className="font-mono text-sm text-gray-700 truncate">{lastEmail}</div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Rôle Système</label>
                                    <div className="text-sm font-bold text-gray-700 capitalize">{lastRole}</div>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mot de passe provisoire</label>
                                <div className="flex items-center justify-between">
                                    <div className="font-mono text-sm font-bold text-primary">Hrms2026!</div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={copyPassword}
                                        className="h-8 rounded-lg text-xs hover:bg-primary/5 text-primary"
                                    >
                                        Copier
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Button
                        onClick={handleClose}
                        className="w-full bg-primary text-white rounded-xl h-12 shadow-lg shadow-primary/20"
                    >
                        Terminer
                    </Button>
                </div>
            </Modal>
        );
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Ajouter un nouvel employé">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Prénom</label>
                        <Input
                            name="first_name"
                            value={formData.first_name}
                            onChange={handleChange}
                            placeholder="Jean"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Nom</label>
                        <Input
                            name="last_name"
                            value={formData.last_name}
                            onChange={handleChange}
                            placeholder="Dupont"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Email professionnel</label>
                    <Input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="jean.dupont@entreprise.com"
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Poste</label>
                        <Input
                            name="position"
                            value={formData.position}
                            onChange={handleChange}
                            placeholder="Développeur Fullstack"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Rôle système</label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        >
                            <option value="employee">Employé</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Administrateur</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Date d'embauche</label>
                    <Input
                        name="hire_date"
                        type="date"
                        value={formData.hire_date}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="pt-4 flex gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className="flex-1 rounded-xl"
                    >
                        Annuler
                    </Button>
                    <Button
                        type="submit"
                        className="flex-1 bg-primary text-white rounded-xl"
                        disabled={mutation.isPending}
                    >
                        {mutation.isPending ? 'Ajout...' : 'Confirmer'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

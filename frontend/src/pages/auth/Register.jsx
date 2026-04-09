import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/lib/api-client'

export default function Register({ onLogin }) {
    const [formData, setFormData] = useState({
        company_name: '',
        first_name: '',
        last_name: '',
        email: '',
        password: ''
    })
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.id]: e.target.value
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            const response = await api.register(formData)
            await onLogin(response.data.tokens)
            toast.success('Compte créé avec succès ! Bienvenue.')
            // Navigation will be handled by App.jsx
        } catch (error) {
            const msg = error.response?.data?.non_field_errors?.[0]
                || error.response?.data?.email?.[0]
                || 'Erreur lors de la création du compte'
            toast.error(msg)
            console.error('Register error:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>Créer une organisation</CardTitle>
                <CardDescription>
                    Inscrivez votre entreprise sur HRMS
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="company_name" className="text-sm font-medium">Nom de l'entreprise</label>
                        <Input
                            id="company_name"
                            required
                            value={formData.company_name}
                            onChange={handleChange}
                            placeholder="Mon Entreprise SAS"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="first_name" className="text-sm font-medium">Prénom</label>
                            <Input
                                id="first_name"
                                required
                                value={formData.first_name}
                                onChange={handleChange}
                                placeholder="Jean"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="last_name" className="text-sm font-medium">Nom</label>
                            <Input
                                id="last_name"
                                required
                                value={formData.last_name}
                                onChange={handleChange}
                                placeholder="Dupont"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium">Email professionnel</label>
                        <Input
                            id="email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="jean@entreprise.com"
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="password" className="text-sm font-medium">Mot de passe</label>
                        <Input
                            id="password"
                            type="password"
                            required
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            minLength={8}
                        />
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Création...' : 'Créer mon compte'}
                    </Button>

                    <p className="text-sm text-center text-gray-500 mt-4">
                        Vous avez déjà un compte ? <Link to="/login" className="text-blue-600 hover:underline">Se connecter</Link>
                    </p>
                </form>
            </CardContent>
        </Card>
    )
}

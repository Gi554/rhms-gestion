import { useQuery } from '@tanstack/react-query'
import { Plus, Search, Building2, Users, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { api } from '@/lib/api-client'

export default function DepartmentList() {
    const { data: departments, isLoading, error } = useQuery({
        queryKey: ['departments'],
        queryFn: async () => {
            const response = await api.getDepartments()
            return response.data.results || response.data
        },
    })

    if (isLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-6 text-center">
                <div className="text-red-500 mb-2">Une erreur est survenue</div>
                <div className="text-sm text-gray-500">{error.message}</div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Départements</h1>
                    <p className="text-gray-500 mt-1">
                        Structurez votre organisation
                    </p>
                </div>
                <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl h-11 px-6 shadow-lg shadow-primary/20">
                    <Plus className="mr-2 h-4 w-4" />
                    Créer un département
                </Button>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                    placeholder="Rechercher un département..."
                    className="w-full pl-12 h-14 rounded-2xl border-none bg-white shadow-sm focus:ring-2 focus:ring-primary/20 text-base"
                />
            </div>

            {/* Departments Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {departments && departments.length > 0 ? (
                    departments.map((dept) => (
                        <Card key={dept.id} className="group border-none shadow-sm hover:shadow-md transition-all duration-200 rounded-3xl bg-white cursor-pointer relative overflow-hidden">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                        <Building2 className="h-6 w-6" />
                                    </div>
                                    <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                                        <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-white" />
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-gray-900 mb-1">{dept.name}</h3>
                                <p className="text-sm text-gray-500 line-clamp-2 mb-4 h-10">
                                    {dept.description || "Aucune description"}
                                </p>

                                <div className="flex items-center gap-4 text-sm text-gray-500 border-t border-gray-100 pt-4">
                                    <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4" />
                                        <span>{dept.employees_count || 0} employés</span>
                                    </div>
                                    <div className="ml-auto text-xs font-medium bg-gray-100 px-2 py-1 rounded-md">
                                        {dept.code}
                                    </div>
                                </div>
                            </CardContent>
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/40 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full flex flex-col items-center justify-center py-16 text-center bg-white rounded-3xl shadow-sm">
                        <div className="bg-gray-50 p-4 rounded-full mb-4">
                            <Building2 className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">Aucun département</h3>
                        <p className="text-gray-500 mt-1 max-w-sm">Créez votre premier département pour commencer à structurer votre entreprise.</p>
                    </div>
                )}
            </div>
        </div>
    )
}

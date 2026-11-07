'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, PlusCircle, Trash2, CheckSquare, X, Settings2, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";

interface Plan {
    id: string;
    title: string;
    goal: string;
    createdAt: string;
    totalWeeks: number;
}

export default function PlansPage() {
    const { dict } = useLanguage();
    const router = useRouter();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [isManageMode, setIsManageMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isDeleting, setIsDeleting] = useState(false);

    // Modal state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    useEffect(() => {
        fetchPlans();
    }, []);

    async function fetchPlans() {
        try {
            const res = await fetch('/api/plan/list');
            if (res.ok) {
                const data = await res.json();
                setPlans(data.plans || []);
            }
        } catch (error) {
            console.error('[Plans Page] Error fetching plans:', error);
        } finally {
            setLoading(false);
        }
    }

    const toggleSelection = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        setSelectedIds(next);
    };

    const confirmDelete = () => {
        if (selectedIds.size === 0) return;
        setIsDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const res = await fetch('/api/plan/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planIds: Array.from(selectedIds) })
            });

            if (res.ok) {
                // Refresh list locally to look fast
                setPlans(plans.filter(p => !selectedIds.has(p.id)));
                setSelectedIds(new Set());
                setIsManageMode(false);
                setIsDeleteModalOpen(false);
                router.refresh(); // Sync server components if any
            } else {
                alert('Error deleting plans');
            }
        } catch (error) {
            console.error('Delete failed', error);
            alert('Error deleting plans');
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
                <div className="text-slate-600">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 pb-24">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">
                            {dict.plans.title}
                        </h1>
                        <p className="text-slate-600">
                            {dict.plans.createFirst.split('.')[0]}
                        </p>
                    </div>

                    {plans.length > 0 && (
                        <button
                            onClick={() => {
                                setIsManageMode(!isManageMode);
                                setSelectedIds(new Set());
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${isManageMode
                                    ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                    : 'text-blue-600 hover:bg-blue-50'
                                }`}
                        >
                            {isManageMode ? (
                                <>
                                    <X size={18} /> {dict.navigation.plans === "Mis Planes" ? "Cancelar" : "Cancel"}
                                </>
                            ) : (
                                <>
                                    <Settings2 size={18} /> {dict.navigation.plans === "Mis Planes" ? "Gestionar" : "Manage"}
                                </>
                            )}
                        </button>
                    )}
                </div>

                {/* Plans Grid */}
                {plans.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
                        <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-slate-900 mb-2">
                            {dict.plans.noPlans}
                        </h3>
                        <p className="text-slate-600 mb-6 max-w-md mx-auto">
                            {dict.plans.createFirst}
                        </p>
                        <Link
                            href="/coach"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <PlusCircle className="w-5 h-5" />
                            {dict.plans.goToCoach}
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {plans.map((plan) => (
                            <div key={plan.id} className="relative group">
                                <Link
                                    href={isManageMode ? '#' : `/plan/${plan.id}`}
                                    onClick={(e) => {
                                        if (isManageMode) {
                                            e.preventDefault();
                                            toggleSelection(plan.id);
                                        }
                                    }}
                                    className={`block bg-white rounded-xl shadow-sm border p-6 transition-all ${isManageMode
                                            ? 'cursor-pointer hover:border-blue-400'
                                            : 'hover:shadow-md hover:border-blue-300'
                                        } ${selectedIds.has(plan.id) ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50/10' : 'border-gray-200'}`}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <Calendar className={`w-8 h-8 ${selectedIds.has(plan.id) ? 'text-blue-600' : 'text-slate-400'}`} />
                                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
                                            {plan.totalWeeks} {plan.totalWeeks === 1 ? (dict.navigation.plans === "Mis Planes" ? 'Semana' : 'Week') : (dict.navigation.plans === "Mis Planes" ? 'Semanas' : 'Weeks')}
                                        </span>
                                    </div>

                                    <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                                        {plan.title}
                                    </h3>

                                    <p className="text-sm text-slate-500 mb-4">
                                        {dict.navigation.plans === "Mis Planes" ? "Objetivo" : "Goal"}: <span className="font-medium capitalize">{plan.goal.replace('_', ' ')}</span>
                                    </p>

                                    <div className="flex items-center text-xs text-slate-400">
                                        <span>{dict.plans.createdOn} {new Date(plan.createdAt).toLocaleDateString()}</span>
                                    </div>

                                    {/* Selection Overlay Checkbox */}
                                    {isManageMode && (
                                        <div className="absolute top-4 left-4">
                                            <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${selectedIds.has(plan.id)
                                                    ? 'bg-blue-600 border-blue-600'
                                                    : 'bg-white border-slate-300'
                                                }`}>
                                                {selectedIds.has(plan.id) && <CheckSquare className="w-4 h-4 text-white" />}
                                            </div>
                                        </div>
                                    )}
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Floating Action Bar */}
            {isManageMode && selectedIds.size > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-slate-900 text-white px-6 py-3 rounded-full shadow-xl animate-in slide-in-from-bottom-4 duration-200 z-50">
                    <span className="font-medium text-sm">
                        {selectedIds.size} {dict.navigation.plans === "Mis Planes" ? "seleccionados" : "selected"}
                    </span>
                    <div className="h-4 w-px bg-slate-700 mx-1" />
                    <button
                        onClick={confirmDelete}
                        disabled={isDeleting}
                        className="flex items-center gap-2 text-red-300 hover:text-red-200 font-bold text-sm transition-colors disabled:opacity-50"
                    >
                        {isDeleting ? '...' : <><Trash2 size={18} /> {dict.navigation.plans === "Mis Planes" ? "Eliminar" : "Delete"}</>}
                    </button>
                </div>
            )}

            {/* Custom Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title={dict.navigation.plans === "Mis Planes" ? "Eliminar Planes" : "Delete Plans"}
            >
                <div>
                    <div className="flex items-start gap-4 mb-6">
                        <div className="p-3 bg-red-100 rounded-full flex-shrink-0">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <p className="text-slate-600 mb-2">
                                {dict.navigation.plans === "Mis Planes"
                                    ? `¿Estás seguro de que quieres eliminar ${selectedIds.size} plan(es)?`
                                    : `Are you sure you want to delete ${selectedIds.size} plan(s)?`
                                }
                            </p>
                            <p className="text-sm text-slate-500">
                                {dict.navigation.plans === "Mis Planes"
                                    ? "Esta acción no se puede deshacer y perderás todo el historial de estos planes."
                                    : "This action cannot be undone and you will lose all history for these plans."
                                }
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors"
                        >
                            {dict.navigation.plans === "Mis Planes" ? "Cancelar" : "Cancel"}
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {isDeleting && <span className="animate-spin">⏳</span>}
                            {dict.navigation.plans === "Mis Planes" ? "Sí, eliminar" : "Yes, delete"}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

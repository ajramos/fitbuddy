'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, PlusCircle } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";

interface Plan {
    id: string;
    title: string;
    goal: string;
    createdAt: string;
    totalWeeks: number;
}

export default function PlansPage() {
    const { dict } = useLanguage();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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

        fetchPlans();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
                <div className="text-slate-600">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">
                        {dict.plans.title}
                    </h1>
                    <p className="text-slate-600">
                        {dict.plans.createFirst.split('.')[0]}
                    </p>
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
                            <Link
                                key={plan.id}
                                href={`/plan/${plan.id}`}
                                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all group"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <Calendar className="w-8 h-8 text-blue-600" />
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
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { Dumbbell, ArrowLeft } from "lucide-react";
import { ExerciseRow } from "../../../../components/plan/exercise-row";
import { useLanguage } from "@/components/providers/language-provider";
import { TrainingPlanDocument } from "@/lib/db/schema";

export default function PlanPage({ params }: { params: { id: string } }) {
    const { dict } = useLanguage();
    const [plan, setPlan] = useState<TrainingPlanDocument | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPlan() {
            try {
                const res = await fetch(`/api/plan/${params.id}`);
                if (res.ok) {
                    const data = await res.json();
                    setPlan(data.plan);
                } else {
                    setPlan(null);
                }
            } catch (error) {
                console.error('[Plan Page] Error fetching plan:', error);
                setPlan(null);
            } finally {
                setLoading(false);
            }
        }

        fetchPlan();
    }, [params.id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-slate-600">Loading...</div>
            </div>
        );
    }

    if (!plan) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-slate-800">
                <h1 className="text-2xl font-bold mb-4">{dict.planDetail.notFound}</h1>
                <Link href="/coach" className="text-blue-600 hover:underline">{dict.planDetail.goBack}</Link>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50 pb-12">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/coach" className="text-slate-500 hover:text-slate-800 transition">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <div>
                            <div className="flex flex-col gap-2">
                                <h1 className="text-3xl font-bold capitalize text-slate-800">
                                    {plan.title.replace(/_/g, " ")}
                                </h1>
                                {plan.profileSnapshot && (
                                    <div className="text-sm text-slate-500 flex flex-wrap gap-4 items-center bg-slate-100 p-2 rounded-lg w-fit">
                                        <span className="font-medium text-slate-700">{dict.planDetail.planContext}:</span>
                                        {plan.profileSnapshot.age && <span>{plan.profileSnapshot.age} {dict.navigation.plans === "Mis Planes" ? "años" : "years"}</span>}
                                        {plan.profileSnapshot.weight && <span>{plan.profileSnapshot.weight} kg</span>}
                                        {plan.profileSnapshot.height && <span>{plan.profileSnapshot.height} cm</span>}
                                        <span className="capitalize">{plan.profileSnapshot.experienceLevel}</span>
                                    </div>
                                )}
                            </div>
                            <p className="text-sm text-slate-500">
                                {dict.planDetail.weekCycle} • {plan.totalWeeks} {plan.totalWeeks === 1 ? dict.planDetail.week : dict.planDetail.weeks}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Vertical Layout Container */}
            <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
                {plan.days.map((day) => (
                    <div key={day.dayIndex} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        {/* Day Header */}
                        <div className="bg-white border-b border-slate-100 p-5 flex justify-between items-center sticky top-0">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">{day.label}</h2>
                                <p className="text-sm text-blue-600 font-medium mt-1 flex items-center gap-1">
                                    <Dumbbell className="w-4 h-4" /> {day.focus}
                                </p>
                            </div>
                            <div className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide">
                                {dict.navigation.plans === "Mis Planes" ? "Día" : "Day"} {day.dayIndex}
                            </div>
                        </div>

                        <div className="p-5 space-y-8">
                            {day.blocks.map((block, bIdx) => (
                                <div key={bIdx} className="space-y-4">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
                                        {block.label}
                                    </h3>
                                    <ul className="space-y-0">
                                        {block.exercises.map((ex, eIdx) => (
                                            <ExerciseRow key={eIdx} exercise={ex} />
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
}

'use client';

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Dumbbell, ArrowLeft } from "lucide-react";
import { ExerciseRow } from "../../../../components/plan/exercise-row";
import { useLanguage } from "@/components/providers/language-provider";
import { TrainingPlanDocument } from "@/lib/db/schema";
import { TrainingBlock } from "@/components/plan/training-block";

export default function PlanPage({ params }: { params: Promise<{ id: string }> }) {
    const { dict } = useLanguage();
    const { id } = use(params); // Unwrap the Promise
    const [isEditing, setIsEditing] = useState(false);
    const [editedPlan, setEditedPlan] = useState<TrainingPlanDocument | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        async function fetchPlan() {
            try {
                const res = await fetch(`/api/plan/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setPlan(data.plan);
                    setEditedPlan(data.plan);
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
    }, [id]);

    const handleSave = async () => {
        if (!editedPlan) return;
        setIsSaving(true);
        try {
            const res = await fetch(`/api/plan/${id}/update`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: editedPlan.title,
                    userNotes: editedPlan.userNotes,
                    days: editedPlan.days, // Deep update
                })
            });

            if (res.ok) {
                setPlan(editedPlan);
                setIsEditing(false);
            } else {
                alert('Error al guardar el plan');
            }
        } catch (error) {
            console.error('Save failed', error);
            alert('Error al guardar el plan');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setEditedPlan(plan); // Revert
        setIsEditing(false);
    };

    const handleDayUpdate = (dayIndex: number, updatedBlocks: any[]) => {
        if (!editedPlan) return;
        const newDays = [...editedPlan.days];
        const dayIdx = newDays.findIndex(d => d.dayIndex === dayIndex);
        if (dayIdx >= 0) {
            newDays[dayIdx] = { ...newDays[dayIdx], blocks: updatedBlocks };
            setEditedPlan({ ...editedPlan, days: newDays });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-slate-600">Loading...(espere)</div>
            </div>
        );
    }

    if (!plan || !editedPlan) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-slate-800">
                <h1 className="text-2xl font-bold mb-4">{dict.planDetail.notFound}</h1>
                <Link href="/coach" className="text-blue-600 hover:underline">{dict.planDetail.goBack}</Link>
            </div>
        );
    }

    // Use editedPlan for rendering
    const displayPlan = isEditing ? editedPlan : plan;

    return (
        <main className="min-h-screen bg-slate-50 pb-12">
            {/* Header Info - Scrolls away */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                        <Link href={isEditing ? "#" : "/coach"} onClick={e => isEditing && e.preventDefault()} className={`text-slate-500 hover:text-slate-800 transition ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <div className="flex-1">
                            <div className="flex flex-col gap-2">
                                {isEditing ? (
                                    <input
                                        type="text"
                                        className="text-3xl font-bold text-slate-800 border-b-2 border-slate-300 focus:border-blue-500 outline-none bg-transparent w-full"
                                        value={displayPlan.title}
                                        onChange={(e) => setEditedPlan({ ...editedPlan, title: e.target.value })}
                                    />
                                ) : (
                                    <h1 className="text-3xl font-bold capitalize text-slate-800">
                                        {displayPlan.title.replace(/_/g, " ")}
                                    </h1>
                                )}

                                {displayPlan.profileSnapshot && (
                                    <div className="text-sm text-slate-500 flex flex-wrap gap-4 items-center bg-slate-100 p-2 rounded-lg w-fit">
                                        <span className="font-medium text-slate-700">{dict.planDetail.planContext}:</span>
                                        {displayPlan.profileSnapshot.age && <span>{displayPlan.profileSnapshot.age} {dict.navigation.plans === "Mis Planes" ? "años" : "years"}</span>}
                                        {displayPlan.profileSnapshot.weight && <span>{displayPlan.profileSnapshot.weight} kg</span>}
                                        {displayPlan.profileSnapshot.height && <span>{displayPlan.profileSnapshot.height} cm</span>}
                                        <span className="capitalize">
                                            {dict.profile?.options?.[displayPlan.profileSnapshot.experienceLevel as keyof typeof dict.profile.options] || displayPlan.profileSnapshot.experienceLevel}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <p className="text-sm text-slate-500 mt-1">
                                {displayPlan.days.length} {dict.navigation.plans === "Mis Planes" ? "días por semana" : "days per week"}
                            </p>

                            {/* General Notes Section */}
                            {(isEditing || displayPlan.userNotes) && (
                                <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">NOTES</label>
                                    {isEditing ? (
                                        <textarea
                                            className="w-full p-3 border border-slate-300 rounded-xl bg-slate-50 text-sm focus:ring-2 focus:ring-blue-200 outline-none transition"
                                            rows={2}
                                            placeholder="Añade notas generales sobre este plan..."
                                            value={displayPlan.userNotes || ''}
                                            onChange={(e) => setEditedPlan({ ...editedPlan, userNotes: e.target.value })}
                                        />
                                    ) : (
                                        <div className="text-sm text-slate-700 bg-amber-50 border border-amber-100 p-3 rounded-lg">
                                            {displayPlan.userNotes}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="ml-4 flex gap-2">
                        {isEditing ? (
                            <>
                                <button
                                    onClick={handleCancel}
                                    className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 font-medium hover:bg-slate-200 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="px-4 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition shadow-sm disabled:opacity-50"
                                >
                                    {isSaving ? 'Saving...' : 'Save'}
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => {
                                    setEditedPlan(plan);
                                    setIsEditing(true);
                                }}
                                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-medium hover:border-blue-500 hover:text-blue-600 transition bg-white"
                            >
                                Edit
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Sticky Navigation Bar - Stays at top */}
            <div className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur-sm border-b border-slate-200 shadow-sm transition-all duration-200">
                <div className="max-w-3xl mx-auto px-4 py-3">
                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                        {displayPlan.days.map((day) => (
                            <button
                                key={day.dayIndex}
                                onClick={() => {
                                    const element = document.getElementById(`day-${day.dayIndex}`);
                                    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }}
                                className="flex-shrink-0 px-4 py-2 rounded-lg bg-white border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition text-sm font-medium text-slate-700 hover:text-blue-700 shadow-sm"
                            >
                                {day.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Vertical Layout Container */}
            <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
                {displayPlan.days.map((day) => (
                    <div key={day.dayIndex} id={`day-${day.dayIndex}`} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden scroll-mt-32">
                        {/* Day Header - Static to prevent occlusion */}
                        <div className="bg-white border-b border-slate-100 p-5 flex justify-between items-center z-10">
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
                                <TrainingBlock
                                    key={bIdx}
                                    block={block}
                                    defaultOpen={true}
                                    isEditing={isEditing}
                                    onUpdate={(updatedBlock) => {
                                        const newBlocks = [...day.blocks];
                                        newBlocks[bIdx] = updatedBlock;
                                        handleDayUpdate(day.dayIndex, newBlocks);
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
}

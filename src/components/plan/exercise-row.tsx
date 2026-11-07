"use client";

import { useState } from "react";
import { Info, ChevronDown, ChevronUp, StickyNote } from "lucide-react";
import { TrainingBlockExercise } from "@/lib/engine/types";

interface ExerciseProps {
    exercise: TrainingBlockExercise; // Using full type for strictness
    blockLabel?: string;
    exerciseNumber?: number;
    isEditing?: boolean;
    onUpdate?: (updates: Partial<TrainingBlockExercise>) => void;
}

export function ExerciseRow({ exercise, blockLabel, exerciseNumber, isEditing, onUpdate }: ExerciseProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const exDef = exercise.exercise; // The definition inside

    // Helper to format duration
    const formatDuration = (seconds: number) => {
        if (seconds >= 60 && seconds % 60 === 0) {
            const minutes = seconds / 60;
            return `${minutes} min`;
        }
        return `${seconds}s`;
    };

    const isCircuit = blockLabel?.toUpperCase().includes('CIRCUITO') ||
        blockLabel?.toUpperCase().includes('CIRCUIT') ||
        blockLabel?.toUpperCase().includes('RONDAS') ||
        blockLabel?.toUpperCase().includes('ROUNDS');

    return (
        <li className="relative">
            <div
                className="flex gap-3 py-4 px-5 cursor-pointer hover:bg-slate-50 transition"
                onClick={() => !isEditing && setIsExpanded(!isExpanded)}
            >
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        {exerciseNumber && (
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                                {exerciseNumber}
                            </div>
                        )}
                        <div className="font-medium text-slate-800">{exDef.name}</div>
                        <button
                            className="text-slate-400 hover:text-blue-500 transition"
                            aria-label="View details"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsExpanded(!isExpanded);
                            }}
                        >
                            <Info className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="text-slate-500 text-xs mt-1 pl-8">
                        {!isCircuit && `${exercise.sets} ${exercise.sets === 1 ? 'serie' : 'series'} x `}
                        {exercise.reps ? `${exercise.reps} reps` : formatDuration(exercise.durationSeconds || 0)}
                        {exercise.restSeconds ? ` • ${exercise.restSeconds}s descanso` : ''}
                    </div>
                </div>
                <div className="text-slate-400 flex items-center">
                    {isEditing ? (
                        <div className="text-xs font-medium text-blue-600 flex items-center gap-1">
                            <StickyNote size={14} /> Notas
                        </div>
                    ) : (
                        isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                </div>
            </div>

            {/* Expandable Details or Edit Mode */}
            {(isExpanded || isEditing) && (
                <div className="pb-4 px-5 text-sm text-slate-600 bg-slate-50 animate-in fade-in slide-in-from-top-1 duration-200 pl-14">
                    {/* Standard details always shown if expanded */}
                    {isExpanded && !isEditing && (
                        <>
                            <div className="mb-2">
                                <span className="font-semibold text-slate-700">Descripción: </span>
                                {exDef.description || "Sin descripción."}
                            </div>
                            {exercise.notes && (
                                <div className="text-amber-700 bg-amber-50 p-2 rounded text-xs border border-amber-100 mb-2">
                                    <strong>Nota:</strong> {exercise.notes}
                                </div>
                            )}
                        </>
                    )}

                    {/* Edit Mode Notes Input */}
                    {isEditing && (
                        <div className="mt-2">
                            <label className="block text-xs font-bold text-slate-500 mb-1">Nota personalizada (opcional):</label>
                            <textarea
                                className="w-full text-sm p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                rows={2}
                                placeholder="Escribe consejos, pesos, o sensaciones..."
                                value={exercise.notes || ''}
                                onChange={(e) => onUpdate?.({ notes: e.target.value })}
                            />
                        </div>
                    )}

                    {/* Muscles often not needed in quick edit, but good in view */}
                    {isExpanded && !isEditing && Array.isArray(exDef.mainMuscles) && exDef.mainMuscles.length > 0 && (
                        <div className="mt-2 text-xs text-slate-500">
                            <span className="font-medium">Músculos:</span> {exDef.mainMuscles.map(m => m.replace('_', ' ')).join(', ')}
                        </div>
                    )}
                </div>
            )}
        </li>
    );
}

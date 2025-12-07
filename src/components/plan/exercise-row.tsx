"use client";

import { useState } from "react";
import { Info, ChevronDown, ChevronUp } from "lucide-react";

interface ExerciseProps {
    exercise: {
        name: string;
        sets: number;
        reps?: number;
        durationSeconds?: number;
        restSeconds?: number;
        notes?: string;
        description?: string;
        recommmendedLevel?: string;
        mainMuscles?: string[];
    };
}

export function ExerciseRow({ exercise }: ExerciseProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <li className="border-b border-gray-100 last:border-0">
            <div
                className="flex gap-3 py-3 cursor-pointer hover:bg-slate-50 transition px-2 -mx-2 rounded-lg"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <div className="font-medium text-slate-800">{exercise.name}</div>
                        <button
                            className="text-slate-400 hover:text-blue-500 transition"
                            aria-label="View details"
                        >
                            <Info className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="text-slate-500 text-xs mt-1">
                        {exercise.sets} sets x {exercise.reps ? `${exercise.reps} reps` : `${exercise.durationSeconds}s`}
                        {exercise.restSeconds ? ` • ${exercise.restSeconds}s rest` : ''}
                    </div>
                </div>
                <div className="text-slate-400 flex items-center">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
            </div>

            {/* Expandable Details */}
            {isExpanded && (
                <div className="pb-3 px-2 text-sm text-slate-600 bg-slate-50/50 rounded-b-lg animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="mb-2">
                        <span className="font-semibold text-slate-700">Description: </span>
                        {exercise.description || "No description available."}
                    </div>
                    {exercise.notes && (
                        <div className="text-amber-700 bg-amber-50 p-2 rounded text-xs border border-amber-100">
                            <strong>Note:</strong> {exercise.notes}
                        </div>
                    )}
                    {Array.isArray(exercise.mainMuscles) && exercise.mainMuscles.length > 0 && (
                        <div className="mt-2 text-xs text-slate-500">
                            <span className="font-medium">Muscles:</span> {exercise.mainMuscles.map(m => m.replace('_', ' ')).join(', ')}
                        </div>
                    )}
                </div>
            )}
        </li>
    );
}

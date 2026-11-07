'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { TrainingBlock as TrainingBlockType, TrainingBlockExercise } from '@/lib/engine/types';
import { ExerciseRow } from './exercise-row';

interface TrainingBlockProps {
    block: TrainingBlockType;
    defaultOpen?: boolean;
    isEditing?: boolean;
    onUpdate?: (updatedBlock: TrainingBlockType) => void;
}

export function TrainingBlock({ block, defaultOpen = true, isEditing, onUpdate }: TrainingBlockProps) {
    // If editing, force open or manage separately? Let's keep it collapsible but maybe default open.
    const [isOpen, setIsOpen] = useState(defaultOpen);

    const title = block.label || (block.type === 'warm_up' ? 'Calentamiento' : block.type?.replace(/_/g, ' ') || 'Bloque');

    const handleExerciseUpdate = (index: number, changes: Partial<TrainingBlockExercise>) => {
        if (!onUpdate) return;
        const newExercises = [...block.exercises];
        newExercises[index] = { ...newExercises[index], ...changes };
        onUpdate({ ...block, exercises: newExercises });
    };

    return (
        <div className={`bg-white border rounded-xl overflow-hidden shadow-sm transition-all duration-200 ${isEditing ? 'border-blue-300 ring-1 ring-blue-100' : 'border-slate-200'}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between px-5 py-4 text-left transition-colors ${isOpen ? 'bg-slate-50 text-slate-800' : 'bg-white hover:bg-slate-50 text-slate-600'
                    }`}
            >
                <div>
                    <h3 className="text-sm font-bold uppercase tracking-wide flex items-center gap-2">
                        {title}
                    </h3>
                    {!isOpen && (
                        <p className="text-xs text-slate-400 font-medium mt-1">
                            {block.exercises.length} {block.exercises.length === 1 ? 'ejercicio' : 'ejercicios'}
                        </p>
                    )}
                </div>
                <div className={`p-2 rounded-full transition-all duration-200 ${isOpen ? 'bg-blue-100 text-blue-600 rotate-180' : 'text-slate-400 bg-slate-100 hover:bg-slate-200'}`}>
                    <ChevronDown size={20} />
                </div>
            </button>

            {isOpen && (
                <div className="border-t border-slate-100">
                    <ul className="divide-y divide-slate-100">
                        {block.exercises.map((ex, eIdx) => (
                            <ExerciseRow
                                key={eIdx}
                                exercise={ex}
                                blockLabel={block.label}
                                exerciseNumber={eIdx + 1}
                                isEditing={isEditing}
                                onUpdate={(changes) => handleExerciseUpdate(eIdx, changes)}
                            />
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

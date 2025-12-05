
import { ExerciseDefinition, UserProfileInput, TrainingBlock, MovementPattern } from './types';

export const SPLITS: Record<number, string[]> = {
    2: ['Full Body A', 'Full Body B'],
    3: ['Lower + Core', 'Upper Push + Accessory', 'Upper Pull + Hinge'],
    4: [
        'Upper Push + Core',
        'Lower (Quad Focus) + Glutes',
        'Upper Pull + Core',
        'Hinge + Glutes + Optional Cardio',
    ],
    5: [
        'Upper Push',
        'Lower (Quad Focus)',
        'Upper Pull',
        'Lower (Hinge Focus)',
        'Full Body / Conditioning',
    ],
    6: [
        'Push',
        'Pull',
        'Legs',
        'Push',
        'Pull',
        'Legs',
    ],
};

export const DAY_STRUCTURES: Record<string, { focusPatterns: MovementPattern[]; description: string }> = {
    'Upper Push + Core': {
        focusPatterns: ['upper_push', 'core', 'warmup', 'cooldown'],
        description: 'Focus on chest, shoulders, triceps and core stability.',
    },
    'Upper Pull + Core': {
        focusPatterns: ['upper_pull', 'core', 'warmup', 'cooldown'],
        description: 'Focus on back, biceps, rear delts and core anti-rotation.',
    },
    'Lower (Quad Focus) + Glutes': {
        focusPatterns: ['knee_dominant', 'hinge', 'warmup', 'cooldown'],
        description: 'Focus on quads and glutes with squats and lunges.',
    },
    'Hinge + Glutes + Optional Cardio': {
        focusPatterns: ['hinge', 'knee_dominant', 'conditioning', 'warmup', 'cooldown'],
        description: 'Focus on posterior chain (hamstrings, lower back) and conditioning.',
    },
    'Full Body A': {
        focusPatterns: ['full_body', 'upper_push', 'upper_pull', 'knee_dominant', 'hinge', 'core', 'warmup', 'cooldown'],
        description: 'Full body strength session.',
    },
    'Full Body B': {
        focusPatterns: ['full_body', 'upper_push', 'upper_pull', 'knee_dominant', 'hinge', 'core', 'warmup', 'cooldown'],
        description: 'Full body strength session with different variations.',
    },
    // Add others as needed for 3/5/6 day splits mapping
};

export function filterExercises(
    exercises: ExerciseDefinition[],
    criteria: {
        pattern?: MovementPattern;
        equipment: string[];
        level: string;
        limitations: string[];
    }
): ExerciseDefinition[] {
    return exercises.filter((ex) => {
        // 1. Pattern match
        if (criteria.pattern && ex.movementPattern !== criteria.pattern) return false;

        // 2. Equipment check (must have ALL required equipment)
        // Here we check if the user has ALL items required by the exercise
        const hasEquipment = ex.requiredEquipment.every((req) => criteria.equipment.includes(req));
        if (!hasEquipment) return false;

        // 3. Level check (simple hierarchy: beginner can only do beginner, inter can do beg+inter, adv can do all)
        // Actually, usually higher levels can do lower level exercises.
        // But beginners shouldn't do advanced.
        const levels = ['beginner', 'intermediate', 'advanced'];
        const userLevelIdx = levels.indexOf(criteria.level);
        const exLevelIdx = levels.indexOf(ex.recommendedLevel);
        if (exLevelIdx > userLevelIdx) return false;

        // 4. Limitations (very basic keyword matching against description or name for now)
        // In a real app, strict tagging is better.
        // e.g. "knee_pain" -> avoid "knee_dominant" or specific names
        if (criteria.limitations.includes('knee_pain') && ex.movementPattern === 'knee_dominant') {
            // Maybe allow some, but for safety exclude heavy knee stuff
            // Refine later
            return false;
        }
        if (criteria.limitations.includes('shoulder_pain') && ex.movementPattern === 'upper_push') {
            return false;
        }

        return true;
    });
}

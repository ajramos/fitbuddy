
import {
    UserProfileInput,
    WeeklyPlan,
    TrainingDay,
    TrainingBlock,
    ExerciseDefinition,
    MovementPattern
} from './types';
import { SPLITS, DAY_STRUCTURES, filterExercises } from './rules';


export async function generateTrainingPlan(
    profile: UserProfileInput,
    allExercises: ExerciseDefinition[] // Passed in to avoid DB calls inside pure function, or we fetch inside
): Promise<WeeklyPlan> {

    // 1. Determine Sessions
    // Clamp to 2-6
    const sessions = Math.max(2, Math.min(6, profile.sessionsPerWeek));

    // 2. Get Split
    const splitDays = SPLITS[sessions];
    if (!splitDays) {
        throw new Error(`No split defined for ${sessions} days`);
    }

    const days: TrainingDay[] = [];

    for (let i = 0; i < splitDays.length; i++) {
        const dayLabel = splitDays[i];
        const structure = DAY_STRUCTURES[dayLabel] || {
            focusPatterns: ['full_body'],
            description: 'General Strength'
        };

        const blocks: TrainingBlock[] = [];

        // Warmup
        blocks.push({
            type: 'warm_up',
            label: 'Warm Up',
            description: 'General mobility and activation.',
            exercises: selectExercisesForBlock(allExercises, profile, ['warmup'], 3)
        });

        // Main Work
        // Identify the KEY pattern for this day (usually the first one that isn't warmup/cool)
        const mainPattern = structure.focusPatterns.find(p => p !== 'warmup' && p !== 'cooldown' && p !== 'core' && p !== 'conditioning');

        if (mainPattern) {
            blocks.push({
                type: 'main_strength',
                label: 'Main Strength',
                description: `Focus on ${mainPattern.replace('_', ' ')}.`,
                exercises: selectExercisesForBlock(allExercises, profile, [mainPattern], 2, { sets: 3, reps: 10 })
            });
        }

        // Secondary / Accessory
        // Find other patterns
        const secondaryPatterns = structure.focusPatterns.filter(p => p !== mainPattern && p !== 'warmup' && p !== 'cooldown' && p !== 'core');
        if (secondaryPatterns.length > 0) {
            blocks.push({
                type: 'accessory',
                label: 'Accessory Work',
                description: 'Supporting movements.',
                exercises: selectExercisesForBlock(allExercises, profile, secondaryPatterns, 3, { sets: 3, reps: 12 })
            });
        }

        // Core
        if (structure.focusPatterns.includes('core')) {
            blocks.push({
                type: 'core',
                label: 'Core Finisher',
                description: 'Midline stability.',
                exercises: selectExercisesForBlock(allExercises, profile, ['core'], 2, { sets: 3, durationSeconds: 45 })
            });
        }

        // Conditioning / Finisher (conditional)
        const wantsFinisher = profile.stylePreferences.runningFinisherPreference === 'yes' ||
            (profile.stylePreferences.runningFinisherPreference === 'conditional' && profile.minutesPerSession > 45);

        if (structure.focusPatterns.includes('conditioning') || wantsFinisher) {
            // Only add if not already covered or if day allows
            // For now, if day structure says conditioning, we added it in main/secondary.
            // If it is an optional finisher:
            if (!structure.focusPatterns.includes('conditioning')) {
                blocks.push({
                    type: 'finisher',
                    label: 'Cardio Finisher',
                    description: 'Get the heart rate up.',
                    exercises: selectExercisesForBlock(allExercises, profile, ['conditioning'], 1, { durationSeconds: 600 })
                });
            }
        }

        // Cooldown
        blocks.push({
            type: 'cooldown',
            label: 'Cool Down',
            description: 'Static stretching.',
            exercises: selectExercisesForBlock(allExercises, profile, ['cooldown'], 2) // assuming we have cooldown exercises
        });

        days.push({
            dayIndex: i + 1,
            label: dayLabel,
            focus: structure.description,
            blocks
        });
    }

    return {
        totalWeeks: 4,
        days
    };
}

function selectExercisesForBlock(
    pool: ExerciseDefinition[],
    profile: UserProfileInput,
    patterns: MovementPattern[],
    count: number,
    defaults: { sets?: number, reps?: number, durationSeconds?: number } = {}
) {
    // varied selection logic
    let candidates: ExerciseDefinition[] = [];

    for (const p of patterns) {
        const filtered = filterExercises(pool, {
            pattern: p,
            equipment: profile.equipmentKeys,
            level: profile.experienceLevel,
            limitations: profile.limitations
        });
        candidates = [...candidates, ...filtered];
    }

    // Deduplicate
    candidates = Array.from(new Set(candidates));

    // Shuffle (naive)
    candidates.sort(() => Math.random() - 0.5);

    const selected = candidates.slice(0, count);

    return selected.map((ex, idx) => ({
        exercise: ex,
        order: idx + 1,
        sets: defaults.sets || 2,
        reps: defaults.reps || 10,
        durationSeconds: defaults.durationSeconds,
        restSeconds: 60
    }));
}

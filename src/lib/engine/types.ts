
export type Goal = 'fat_loss' | 'muscle_gain' | 'recomposition';
export type SecondaryGoal = 'strength' | 'endurance' | 'mobility' | 'none';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type Environment = 'home' | 'gym';

export interface UserProfileInput {
    primaryGoal: Goal;
    secondaryGoal: SecondaryGoal;
    experienceLevel: ExperienceLevel;
    sessionsPerWeek: number;
    minutesPerSession: number;
    environment: Environment;
    limitations: string[]; // e.g. ["knee_pain"]
    equipmentKeys: string[]; // e.g. ["kettlebell", "dumbbells"]
    stylePreferences: {
        circuitsPreference: 'love' | 'neutral' | 'hate';
        runningFinisherPreference: 'yes' | 'conditional' | 'no';
    };
}

export type MovementPattern =
    | 'upper_push'
    | 'upper_pull'
    | 'hinge'
    | 'knee_dominant'
    | 'core'
    | 'conditioning'
    | 'full_body'
    | 'warmup'
    | 'cooldown';

export interface ExerciseDefinition {
    id: string; // from DB
    name: string;
    movementPattern: MovementPattern;
    requiredEquipment: string[];
    recommendedLevel: ExperienceLevel;
    mainMuscles: string[];
}

export interface TrainingBlock {
    type: 'warm_up' | 'main_strength' | 'accessory' | 'core' | 'finisher' | 'cooldown';
    label: string;
    exercises: TrainingBlockExercise[];
    description?: string;
}

export interface TrainingBlockExercise {
    exercise: ExerciseDefinition;
    sets: number;
    reps?: number; // e.g. 10
    restSeconds?: number;
    durationSeconds?: number;
    notes?: string;
    order: number;
}

export interface TrainingDay {
    dayIndex: number;
    label: string;
    focus: string;
    blocks: TrainingBlock[];
}

export interface WeeklyPlan {
    totalWeeks: number;
    days: TrainingDay[];
}

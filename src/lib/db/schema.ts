
import { Timestamp } from 'firebase-admin/firestore';

export interface UserDocument {
    uid: string;
    email?: string;
    displayName?: string;
    photoURL?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface UserProfileDocument {
    userId: string;
    primaryGoal: 'fat_loss' | 'muscle_gain' | 'recomposition';
    secondaryGoal: 'strength' | 'endurance' | 'mobility' | 'none';
    experienceLevel: 'beginner' | 'intermediate' | 'advanced';
    sessionsPerWeek: number;
    minutesPerSession: number;
    environment: 'home' | 'gym';
    limitations: string[]; // List of strings
    equipmentKeys: string[]; // List of normalized keys
    stylePreferences: {
        circuitsPreference: 'love' | 'neutral' | 'hate';
        runningFinisherPreference: 'yes' | 'conditional' | 'no';
    };
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface ExerciseDocument {
    id: string; // Document ID
    name: string;
    movementPattern: string;
    mainMuscles: string[];
    requiredEquipment: string[];
    recommendedLevel: 'beginner' | 'intermediate' | 'advanced';
    description: string;
    mediaUrl?: string;
    createdAt: Timestamp;
}

// Re-using the structure from the engine but prepared for DB storage
export interface TrainingPlanDocument {
    id: string;
    userId: string;
    title: string;
    totalWeeks: number;
    days: {
        dayIndex: number;
        label: string;
        focus: string;
        blocks: {
            type: string;
            label: string;
            description?: string;
            exercises: {
                exerciseId: string;
                name: string; // Denormalized for easy display
                sets: number;
                reps?: number;
                durationSeconds?: number;
                restSeconds?: number;
                notes?: string;
            }[];
        }[];
    }[];
}[];
profileSnapshot ?: any;
createdAt: Timestamp;
}

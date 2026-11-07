
import { FunctionDeclaration, SchemaType } from '@google-cloud/vertexai';

export const updateUserProfileTool: FunctionDeclaration = {
    name: 'updateUserProfile',
    description: 'Update the user profile with extracted information from the conversation.',
    parameters: {
        type: SchemaType.OBJECT,
        properties: {
            primaryGoal: { type: SchemaType.STRING, enum: ['fat_loss', 'muscle_gain', 'recomposition'] },
            secondaryGoal: { type: SchemaType.STRING, enum: ['strength', 'endurance', 'mobility', 'none'] },
            experienceLevel: { type: SchemaType.STRING, enum: ['beginner', 'intermediate', 'advanced'] },
            sessionsPerWeek: { type: SchemaType.INTEGER, description: 'Number of training sessions per week (2-6)' },
            minutesPerSession: { type: SchemaType.INTEGER, description: 'Minutes available per session' },
            environment: { type: SchemaType.STRING, enum: ['home', 'gym'] },
            limitations: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: 'Physical limitations or injuries (e.g. knee_pain)'
            },
            equipmentKeys: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: 'Available equipment normalized keys (e.g. kettlebell, dumbbell, bodyweight)'
            },
            circuitsPreference: {
                type: SchemaType.STRING,
                enum: ['love', 'neutral', 'hate'],
                description: 'User preference for circuit-style training (multiple exercises back-to-back)'
            },
            runningFinisherPreference: {
                type: SchemaType.STRING,
                enum: ['yes', 'conditional', 'no'],
                description: 'Whether user wants running/cardio finisher at end of sessions'
            },
        },
        // No "required" fields because we update incrementally
    },
};

export const generatePlanTool: FunctionDeclaration = {
    name: 'generatePlan',
    description: 'Signal that the profile is complete and the training plan should be generated.',
    parameters: {
        type: SchemaType.OBJECT,
        properties: {
            ready: { type: SchemaType.BOOLEAN }
        },
        required: ['ready']
    }
};

export const tools = [
    {
        functionDeclarations: [updateUserProfileTool, generatePlanTool],
    },
];

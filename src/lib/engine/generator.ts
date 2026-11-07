
import { UserProfileInput, WeeklyPlan, TrainingDay, TrainingBlock, TrainingBlockExercise } from './types';
import { getPlanModel } from '@/lib/agent/vertex-client';
import { SchemaType } from '@google-cloud/vertexai';
import { db } from '@/lib/db/firestore';
import { Timestamp } from 'firebase-admin/firestore';

// --- Schemas for Structured Output ---

const trainingBlockExerciseSchema = {
    type: SchemaType.OBJECT,
    properties: {
        name: { type: SchemaType.STRING },
        sets: { type: SchemaType.INTEGER },
        reps: { type: SchemaType.INTEGER, nullable: true },
        durationSeconds: { type: SchemaType.INTEGER, nullable: true },
        restSeconds: { type: SchemaType.INTEGER, nullable: true },
        notes: { type: SchemaType.STRING, nullable: true },
        mainMuscles: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING }
        },
        requiredEquipment: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING }
        },
        movementPattern: { type: SchemaType.STRING, nullable: true }, // Optional hints for DB creation
        recommendedLevel: { type: SchemaType.STRING, nullable: true },
        description: { type: SchemaType.STRING, nullable: true }
    },
    required: ['name', 'sets', 'mainMuscles']
};

const trainingBlockSchema = {
    type: SchemaType.OBJECT,
    properties: {
        type: { type: SchemaType.STRING, enum: ['warm_up', 'main_strength', 'accessory', 'core', 'finisher', 'cooldown'] },
        label: { type: SchemaType.STRING },
        exercises: {
            type: SchemaType.ARRAY,
            items: trainingBlockExerciseSchema
        }
    },
    required: ['type', 'label', 'exercises']
};

const singleDaySchema = {
    type: SchemaType.OBJECT,
    properties: {
        blocks: {
            type: SchemaType.ARRAY,
            items: trainingBlockSchema
        }
    },
    required: ['blocks']
};

const skeletonDaySchema = {
    type: SchemaType.OBJECT,
    properties: {
        dayIndex: { type: SchemaType.INTEGER },
        label: { type: SchemaType.STRING },
        focus: { type: SchemaType.STRING }
    },
    required: ['dayIndex', 'label', 'focus']
};

const planSkeletonSchema = {
    type: SchemaType.OBJECT,
    properties: {
        totalWeeks: { type: SchemaType.INTEGER },
        days: {
            type: SchemaType.ARRAY,
            items: skeletonDaySchema
        }
    },
    required: ['totalWeeks', 'days']
};


// --- Generation Functions ---

async function generatePlanSkeleton(profile: UserProfileInput, languageInstruction: string): Promise<{ totalWeeks: number, days: { dayIndex: number, label: string, focus: string }[] }> {
    const model = getPlanModel();

    const prompt = `
        You are an expert strength and conditioning coach.
        Create a 1-week training schedule SKELETON (structure only, no exercises yet) for this user.
        
        ${languageInstruction}
        
        User Profile:
        - Goal: ${profile.primaryGoal}
        - Level: ${profile.experienceLevel}
        - Days Per Week: ${profile.sessionsPerWeek}
        
        Output valid JSON with the days, labels (e.g., "Day 1" or "Lunes"), and primary focus (e.g., "Full Body", "Upper Push").
    `;

    try {
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: 'application/json',
                responseSchema: planSkeletonSchema,
                temperature: 0.4
            }
        });

        return JSON.parse(result.response.candidates?.[0]?.content?.parts?.[0]?.text || "{}");
    } catch (e) {
        console.error("Skeleton Generation Failed", e);
        throw new Error("Failed to generate plan structure");
    }
}

async function generateDayDetails(
    profile: UserProfileInput,
    dayLabel: string,
    dayFocus: string,
    languageInstruction: string,
    dayIndex: number
): Promise<TrainingBlock[]> {
    const model = getPlanModel();
    const userLanguage = profile.language || 'en';

    const prompt = `
    You are an expert coach. Generate the DETAILED WORKOUT BLOCKS for Day ${dayIndex}: "${dayLabel}" - Focus: "${dayFocus}".
    
    ${languageInstruction}

    User: ${profile.name}, ${profile.experienceLevel}, Goal: ${profile.primaryGoal}
    Minutes: ${profile.minutesPerSession}, Equipment: ${profile.equipmentKeys.join(', ')}

    MANDATORY 6-BLOCK STRUCTURE (Adhere Strictly):
    1. CALENTAMIENTO DINÁMICO (5-8 min): 3-4 exercises, 1 set, 60s each, 0 rest.
    2. CIRCUITO TRI-SERIES 1 (15-18 min): 3 exercises, 3-4 rounds. 0s rest between exercises, 90s between rounds.
    3. CIRCUITO TRI-SERIES 2 (15-18 min): 3 exercises, 3-4 rounds. 0s rest between exercises, 90s between rounds.
    4. FINISHER METABÓLICO (6-10 min): 3-5 exercises, 40s work/20s rest (40/20).
    5. TABATA ABDOMINALES (4 min): 2 exercises, Tabata 20s/10s, 8 rounds.
    6. ${profile.stylePreferences?.runningFinisherPreference === 'yes' ? 'FINISHER DE CARRERA' : 'CARDIO FINISHER'} (10-12 min): Intervals or steady.

    INSTRUCTIONS:
    - Language: ${userLanguage === 'es' ? 'SPANISH' : 'ENGLISH'}
    - Descriptions: MAX 8 WORDS.
    - JSON ONLY.
    `;

    try {
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: 'application/json',
                responseSchema: singleDaySchema,
                temperature: 0.4
            }
        });

        const data = JSON.parse(result.response.candidates?.[0]?.content?.parts?.[0]?.text || "{}");
        return data.blocks || [];
    } catch (e) {
        console.error(`Day ${dayIndex} Generation Failed`, e);
        // Return fallback empty blocks on error to allow partial plan? 
        // Or throw to fail fast. Let's throw for now to ensure quality.
        throw new Error(`Failed to generate workout for Day ${dayIndex}`);
    }
}


export async function generateTrainingPlan(
    profile: UserProfileInput
): Promise<WeeklyPlan> {
    const userLanguage = profile.language || 'en';
    const languageInstruction = userLanguage === 'es'
        ? `CRITICAL: You MUST generate ALL content in SPANISH.`
        : `Generate all content in English.`;

    console.log(`Starting Chained Plan Generation for ${profile.name}...`);

    // 1. Generate Skeleton
    const skeleton = await generatePlanSkeleton(profile, languageInstruction);
    console.log(`Skeleton generated: ${skeleton.days?.length} days`);

    if (!skeleton.days || skeleton.days.length === 0) {
        throw new Error("AI generated an empty schedule");
    }

    // 2. Generate Days in Parallel
    const dayPromises = skeleton.days.map(async (daySkeleton) => {
        const blocks = await generateDayDetails(
            profile,
            daySkeleton.label,
            daySkeleton.focus,
            languageInstruction,
            daySkeleton.dayIndex
        );

        return {
            dayIndex: daySkeleton.dayIndex,
            label: daySkeleton.label,
            focus: daySkeleton.focus,
            blocks: blocks
        } as TrainingDay;
    });

    const fullDays = await Promise.all(dayPromises);

    // 3. Post-Process Exercises (DB linking) as before
    const finalPlan: WeeklyPlan = {
        totalWeeks: skeleton.totalWeeks || 1,
        days: fullDays.sort((a, b) => a.dayIndex - b.dayIndex)
    };

    // Reuse existing DB logic here? Ideally refactor to helper function but we can inline for speed
    const processedExercises = new Map<string, string>();

    for (const day of finalPlan.days) {
        for (const block of day.blocks) {
            // Just cast to any for strict schema mismatch with internal type (some optional fields)
            // But schema matches TrainingBlockExercise structure pretty well.
            for (const exData of block.exercises as any[]) {
                const normalizedName = exData.name.trim();
                const id = normalizedName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
                exData.exerciseId = id; // Inject ID

                // Sanitize mainMuscles array
                if (!Array.isArray(exData.mainMuscles)) {
                    exData.mainMuscles = typeof exData.mainMuscles === 'string' ? [exData.mainMuscles] : [];
                }

                if (!processedExercises.has(id)) {
                    const docRef = db.collection('exercises').doc(id);
                    // Minimal check - we can optimize this later
                    const docSnap = await docRef.get();
                    if (!docSnap.exists) {
                        // Note: Schema doesn't strictly force description/level, so we default
                        await docRef.set({
                            id: id,
                            name: exData.name,
                            movementPattern: exData.movementPattern || 'full_body',
                            mainMuscles: exData.mainMuscles || [],
                            requiredEquipment: exData.requiredEquipment || [],
                            recommendedLevel: exData.recommendedLevel || 'beginner',
                            description: exData.description || '',
                            createdAt: Timestamp.now()
                        });
                    }
                    processedExercises.set(id, id);
                }
            }
        }
    }

    return finalPlan;
}

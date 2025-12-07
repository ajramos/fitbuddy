
import { UserProfileInput, WeeklyPlan, ExerciseDefinition } from './types';
import { getModel } from '@/lib/agent/vertex-client';
import { SchemaType } from '@google-cloud/vertexai';
import { db } from '@/lib/db/firestore';
import { Timestamp } from 'firebase-admin/firestore';

export async function generateTrainingPlan(
    profile: UserProfileInput
): Promise<WeeklyPlan> {
    const model = getModel();
    console.log("Generating plan with V2 logic (robust JSON)");

    const prompt = `
    You are an expert strength and conditioning coach.
    Create a 1-week functional training plan (a repeating microcycle) for the following user.
    The plan should be detailed and outputted as pure JSON.
    
    User Profile:
    - Name: ${profile.name || 'User'}
    - Age: ${profile.age || 'N/A'}
    - Weight: ${profile.weight ? profile.weight + 'kg' : 'N/A'}
    - Height: ${profile.height ? profile.height + 'cm' : 'N/A'}
    - Goal: ${profile.primaryGoal}
    - Level: ${profile.experienceLevel}
    - Days Per Week: ${profile.sessionsPerWeek} (You MUST generate exactly ${profile.sessionsPerWeek} workout days)
    - Duration: ${profile.minutesPerSession} mins
    - Equipment: ${profile.equipmentKeys.join(', ')}
    - Limitations: ${profile.limitations.join(', ') || 'None'}
    - Preferences: ${profile.stylePreferences?.circuitsPreference || 'Mixed'} circuits, ${profile.stylePreferences?.runningFinisherPreference || 'occasional'} to running.

    CRITICAL INSTRUCTIONS:
    1. **Real Exercises Only**: Use standard, verifiable exercise names.
    2. **Exact Frequency**: Generate exactly ${profile.sessionsPerWeek} workout days.
    3. **Repeating Cycle**: This 1 week will be repeated.
    4. **CONCISENESS**: Descriptions MUST be short (maximum 15 words). Notes should be empty unless safety-critical.
    5. **Details**: Provide: name, movementPattern, mainMuscles, requiredEquipment, recommendedLevel, description, sets, reps, durationSeconds, restSeconds, notes.

    Output Schema (JSON):
    {
      "totalWeeks": 1,
      "days": [
        {
          "dayIndex": 1,
          "label": "Monday",
          "focus": "Full Body Strength",
          "blocks": [
            {
              "type": "warmup",
              "label": "Warm Up",
              "exercises": [...]
            },
             {
              "type": "main",
              "label": "Strength Block",
              "exercises": [...]
            }
          ]
        }
      ]
    }
    
    Ensure strict valid JSON format. Do not use code blocks.
  `;

    const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
            responseMimeType: 'application/json',
            // No strict schema, let the model generate freeform JSON based on instructions
            maxOutputTokens: 8192,
            temperature: 0.4,
        }
    });

    const responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) throw new Error("Failed to generate plan");

    // Clean response of potential markdown
    let cleanJson = responseText.replace(/```json\n?|\n?```/g, '').trim();

    // Sometimes models output text before json
    const firstBrace = cleanJson.indexOf('{');
    const lastBrace = cleanJson.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1) {
        cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
    }

    let plan: any;
    try {
        plan = JSON.parse(cleanJson);
    } catch (e) {
        // Attempt to fix common JSON issues like unescaped newlines
        try {
            // aggressive cleanup for control characters that might be valid in text but invalid in JSON strings if unescaped
            const fixedJson = cleanJson.replace(/[\u0000-\u001F]+/g, (match) => {
                if (match === '\n' || match === '\r') return ''; // remove line breaks outside strings? No that breaks it.
                // Actually standard JSON parsers hate unescaped newlines in strings.
                // JSON.parse accepts newlines (whitespace) outside strings.
                // The issue is likely unescaped newlines INSIDE strings or just bad characters.
                return '';
            });
            plan = JSON.parse(fixedJson);
        } catch (e2) {
            console.error("Failed to parse JSON. Raw response length:", cleanJson.length);
            console.error("End of response:", cleanJson.substring(cleanJson.length - 200));
            throw new Error("Invalid JSON response from AI");
        }
    }

    if (!plan.days || !Array.isArray(plan.days)) {
        console.error("Invalid plan structure:", plan);
        // Attempt to unwrap if wrapped in a key
        if (plan.plan && Array.isArray(plan.plan.days)) {
            plan = plan.plan;
        } else {
            throw new Error("Generated plan missing 'days' array");
        }
    }

    // Process Exercises: Check existence, Create if new, Link IDs
    const processedExercises = new Map<string, string>(); // Name -> ID

    for (const day of plan.days) {
        for (const block of day.blocks) {
            for (const exData of block.exercises as any[]) {
                const normalizedName = exData.name.trim();
                // Deterministic ID
                const id = normalizedName.toLowerCase().replace(/[^a-z0-9]+/g, '_');

                exData.exerciseId = id; // Link ID to plan object

                // Sanitize mainMuscles to ensure it's always an array (model sometimes returns a string)
                if (!Array.isArray(exData.mainMuscles)) {
                    exData.mainMuscles = typeof exData.mainMuscles === 'string' ? [exData.mainMuscles] : [];
                }

                if (!processedExercises.has(id)) {
                    // Check DB
                    const docRef = db.collection('exercises').doc(id);
                    const docSnap = await docRef.get();

                    if (!docSnap.exists) {
                        // Create new exercise
                        console.log(`Creating new exercise: ${normalizedName} `);
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

    return plan;
}

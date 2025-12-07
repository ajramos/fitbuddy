
import { getModel } from '../src/lib/agent/vertex-client';
import { db } from '../src/lib/db/firestore';
import { SchemaType } from '@google-cloud/vertexai';
import { ExerciseDocument } from '../src/lib/db/schema';
import { Timestamp } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
dotenv.config();

// Ensure we have a project ID for the vertex client if running purely as script
if (!process.env.GOOGLE_CLOUD_PROJECT) {
    console.warn("GOOGLE_CLOUD_PROJECT not set, assuming environment defaults or .env");
}

async function generateExercises(category: string, count: number = 10) {
    const model = getModel();

    const prompt = `
    Generate ${count} distinct functional training exercises for the category: "${category}".
    
    Schema per exercise:
    - name: string
    - movementPattern: one of ['upper_push', 'upper_pull', 'hinge', 'knee_dominant', 'core', 'conditioning', 'full_body', 'warmup', 'cooldown']
    - mainMuscles: array of strings
    - requiredEquipment: array of strings (use normalized keys like 'kettlebell', 'dumbbell', 'barbell', 'bodyweight', 'pullup_bar', 'bands')
    - recommendedLevel: 'beginner' | 'intermediate' | 'advanced'
    - description: string (concise cues)

    Return a JSON array of these objects.
    `;

    const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: SchemaType.ARRAY,
                items: {
                    type: SchemaType.OBJECT,
                    properties: {
                        name: { type: SchemaType.STRING },
                        movementPattern: { type: SchemaType.STRING },
                        mainMuscles: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                        requiredEquipment: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                        recommendedLevel: { type: SchemaType.STRING },
                        description: { type: SchemaType.STRING }
                    }
                }
            }
        }
    });

    const output = result.response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!output) throw new Error("No output from AI");

    const exercises = JSON.parse(output) as Omit<ExerciseDocument, 'id' | 'createdAt'>[];

    console.log(`Generated ${exercises.length} exercises for ${category}. Saving to Firestore...`);

    const batch = db.batch();
    for (const ex of exercises) {
        // Create a deterministic ID from name
        const id = ex.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
        const ref = db.collection('exercises').doc(id);
        batch.set(ref, {
            ...ex,
            createdAt: Timestamp.now()
        }, { merge: true });
    }

    await batch.commit();
    console.log(`Saved ${exercises.length} exercises.`);
}

async function main() {
    const args = process.argv.slice(2);
    const category = args[0] || 'Kettlebell Strength';
    const count = parseInt(args[1] || '20');

    console.log(`Running AI Seeder for: ${category} (${count} items)...`);
    await generateExercises(category, count);
}

main().catch(console.error);

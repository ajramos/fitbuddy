
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
dotenv.config();

// Initialize App (simplified for script usage)
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
let app;

if (getApps().length === 0) {
    if (serviceAccountKey) {
        try {
            app = initializeApp({ credential: cert(JSON.parse(serviceAccountKey)) });
        } catch (e) {
            console.log("Could not parse service account key, trying ADC...");
            app = initializeApp();
        }
    } else {
        app = initializeApp();
    }
} else {
    app = getApps()[0];
}

const db = getFirestore(app);

async function main() {
    console.log('Seeding Firestore...');

    const exercises = [
        // Upper Push
        {
            name: 'Push-up',
            movementPattern: 'upper_push',
            mainMuscles: ['chest', 'shoulders', 'triceps'],
            requiredEquipment: ['bodyweight'],
            recommendedLevel: 'beginner',
            description: 'Standard push-up. Keep core tight.',
        },
        {
            name: 'Dumbbell Floor Press',
            movementPattern: 'upper_push',
            mainMuscles: ['chest', 'triceps'],
            requiredEquipment: ['dumbbell'],
            recommendedLevel: 'beginner',
            description: 'Lie on floor, press dumbbells up. elbows at 45 degrees.',
        },
        {
            name: 'Overhead Press (Dumbbell)',
            movementPattern: 'upper_push',
            mainMuscles: ['shoulders', 'triceps'],
            requiredEquipment: ['dumbbell'],
            recommendedLevel: 'intermediate',
            description: 'Standing or seated. Press weights overhead without arching back.',
        },
        // Upper Pull
        {
            name: 'Pull-up',
            movementPattern: 'upper_pull',
            mainMuscles: ['lats', 'biceps'],
            requiredEquipment: ['pullup_bar'],
            recommendedLevel: 'advanced',
            description: 'Hang from bar, pull chest to bar.',
        },
        {
            name: 'Dumbbell Row',
            movementPattern: 'upper_pull',
            mainMuscles: ['lats', 'rhomboids'],
            requiredEquipment: ['dumbbell'],
            recommendedLevel: 'beginner',
            description: 'Support on bench or knee, pull dumbbell to hip.',
        },
        // Knee Dominant (Squat/Lunge)
        {
            name: 'Goblet Squat',
            movementPattern: 'knee_dominant',
            mainMuscles: ['quads', 'glutes'],
            requiredEquipment: ['kettlebell'], // or dumbbell
            recommendedLevel: 'beginner',
            description: 'Hold weight at chest, squat down keeping chest up.',
        },
        {
            name: 'Bodyweight Squat',
            movementPattern: 'knee_dominant',
            mainMuscles: ['quads', 'glutes'],
            requiredEquipment: ['bodyweight'],
            recommendedLevel: 'beginner',
            description: 'Standard air squat.',
        },
        {
            name: 'Reverse Lunge',
            movementPattern: 'knee_dominant',
            mainMuscles: ['quads', 'glutes'],
            requiredEquipment: ['bodyweight'], // can be loaded
            recommendedLevel: 'beginner',
            description: 'Step back into a lunge, return to start.',
        },
        // Hinge
        {
            name: 'Kettlebell Swing',
            movementPattern: 'hinge',
            mainMuscles: ['glutes', 'hamstrings', 'lower_back'],
            requiredEquipment: ['kettlebell'],
            recommendedLevel: 'intermediate',
            description: 'Explosive hip hinge. Snap hips forward.',
        },
        // Core
        {
            name: 'Plank',
            movementPattern: 'core',
            mainMuscles: ['abs', 'core'],
            requiredEquipment: ['bodyweight'],
            recommendedLevel: 'beginner',
            description: 'Hold plank position on elbows/toes.',
        },
        // Conditioning
        {
            name: 'Burpees',
            movementPattern: 'conditioning',
            mainMuscles: ['full_body'],
            requiredEquipment: ['bodyweight'],
            recommendedLevel: 'intermediate',
            description: 'Chest to floor, jump up.',
        }
    ];

    const batch = db.batch();

    for (const ex of exercises) {
        // ID based on name sanitization
        const id = ex.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
        const ref = db.collection('exercises').doc(id);
        batch.set(ref, {
            ...ex,
            createdAt: Timestamp.now()
        });
    }

    await batch.commit();
    console.log('Seeding complete.');
}

main().catch(console.error);

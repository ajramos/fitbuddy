
import { auth } from "@/auth";
import { db } from "@/lib/db/firestore";
import { generateTrainingPlan } from "@/lib/engine/generator";
import { UserProfileInput, ExerciseDefinition } from "@/lib/engine/types";
import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.email;
    const profileRef = db.collection('profiles').doc(userId);
    const profileSnap = await profileRef.get();

    if (!profileSnap.exists) {
        return NextResponse.json({ error: "Profile not found" }, { status: 400 });
    }

    const profile = profileSnap.data() as UserProfileInput;

    // Fetch all exercises
    const exercisesSnap = await db.collection('exercises').get();
    const allExercises = exercisesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ExerciseDefinition[];

    // Generate Plan
    const plan = await generateTrainingPlan(profile, allExercises);

    // Save Plan
    const planRef = db.collection('plans').doc();
    const planData = {
        id: planRef.id,
        userId,
        title: `Weekly Plan for ${profile.primaryGoal}`, // Better title logic later
        totalWeeks: plan.totalWeeks,
        days: plan.days,
        createdAt: Timestamp.now()
    };

    await planRef.set(planData);

    return NextResponse.json({ planId: planRef.id });
}

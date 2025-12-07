
import { auth } from "@/auth";
import { db } from "@/lib/db/firestore";
import { generateTrainingPlan } from "@/lib/engine/generator";
import { UserProfileInput } from "@/lib/engine/types";
import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.email;

    // Load ALL profile data from users collection
    const userRef = db.collection('users').doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
        return NextResponse.json({ error: "Profile not found" }, { status: 400 });
    }

    const profile: UserProfileInput = {
        ...userSnap.data(),
        name: userSnap.data()?.name || session.user.name || 'User'
    } as UserProfileInput;

    console.log('[Plan Generation] Using profile:', {
        primaryGoal: profile.primaryGoal,
        experienceLevel: profile.experienceLevel,
        sessionsPerWeek: profile.sessionsPerWeek,
        equipmentKeys: profile.equipmentKeys
    });

    // Generate Plan
    const plan = await generateTrainingPlan(profile);

    // Localized plan title
    const goalTitles: Record<string, Record<string, string>> = {
        en: {
            fat_loss: "Fat Loss Plan",
            muscle_gain: "Muscle Gain Plan",
            recomposition: "Body Recomposition Plan",
            strength: "Strength Plan",
            endurance: "Endurance Plan"
        },
        es: {
            fat_loss: "Plan de Pérdida de Grasa",
            muscle_gain: "Plan de Ganancia Muscular",
            recomposition: "Plan de Recomposición",
            strength: "Plan de Fuerza",
            endurance: "Plan de Resistencia"
        }
    };

    const userLanguage = profile.language || 'en';
    const planTitle = goalTitles[userLanguage]?.[profile.primaryGoal] || `Plan: ${profile.primaryGoal}`;

    // Save Plan
    const planRef = db.collection('plans').doc();
    const planData = {
        id: planRef.id,
        userId,
        title: planTitle,
        totalWeeks: plan.totalWeeks,
        days: plan.days,
        profileSnapshot: profile, // Save snapshot for history/validation
        createdAt: Timestamp.now()
    };

    await planRef.set(planData);

    return NextResponse.json({ planId: planRef.id });
}

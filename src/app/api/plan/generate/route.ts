
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
    const profileRef = db.collection('profiles').doc(userId);
    const profileSnap = await profileRef.get(); // Training prefs
    const userRef = db.collection('users').doc(userId);
    const userSnap = await userRef.get(); // Physical stats

    if (!profileSnap.exists) {
        return NextResponse.json({ error: "Profile not found" }, { status: 400 });
    }

    const profileData = profileSnap.exists ? profileSnap.data() : {};
    const userData = userSnap.exists ? userSnap.data() : {};

    // Merge profile data with user data
    // User data (from users collection) should take priority for user-specific fields
    const profile: UserProfileInput = {
        ...profileData, // Plan-specific data from profiles collection
        ...userData,    // User-specific data from users collection (experienceLevel, equipment, etc.)
        // Ensure name is set
        name: userData.name || profileData.name || session.user.name || 'User'
    };

    console.log('[Plan Generation] Using profile:', {
        primaryGoal: profile.primaryGoal,
        experienceLevel: profile.experienceLevel,
        sessionsPerWeek: profile.sessionsPerWeek,
        equipmentKeys: profile.equipmentKeys
    });

    // Generate Plan (Generator handles exercise fetching/creation dynamically)
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

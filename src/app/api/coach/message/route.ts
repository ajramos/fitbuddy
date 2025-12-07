
import { auth } from "@/auth";
import { db } from "@/lib/db/firestore";
import { processUserMessage } from "@/lib/agent/orchestrator";
import { UserProfileInput } from "@/lib/engine/types";
import { Content } from "@google-cloud/vertexai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.email; // Using email as ID for simplicity if uid not available in session easily, but preferably sub
    // Actually, session.user.id is usually available with proper generic config, but let's trust email for unique ID for now or fetch from DB.
    // In a real app we'd map email to uid.

    const { message, history } = await req.json();

    // Fetch user data (persistent: name, language, experienceLevel, equipment, limitations, age, weight, height)
    const userRef = db.collection('users').doc(userId);
    const userSnap = await userRef.get();

    // Fetch profile data (conversation-specific: goal, frequency, preferences, etc.)
    const profileRef = db.collection('profiles').doc(userId);
    const profileSnap = await profileRef.get();

    // Build current profile with USER data taking priority
    let currentProfile: Partial<UserProfileInput> = {};

    // Start with user data (persistent across plans)
    if (userSnap.exists) {
        const userData = userSnap.data();
        currentProfile = {
            name: userData?.name,
            language: userData?.language,
            experienceLevel: userData?.experienceLevel,
            equipmentKeys: userData?.equipmentKeys || [],
            limitations: userData?.limitations || [],
            age: userData?.age,
            weight: userData?.weight,
            height: userData?.height,
        };
    }

    // Merge with conversation/plan-specific data (if exists)
    if (profileSnap.exists) {
        const profileData = profileSnap.data();
        currentProfile = {
            ...currentProfile,
            // Only merge plan-specific fields from profiles collection
            primaryGoal: profileData?.primaryGoal,
            sessionsPerWeek: profileData?.sessionsPerWeek,
            minutesPerSession: profileData?.minutesPerSession,
            stylePreferences: profileData?.stylePreferences,
        };
    }

    console.log('[Coach API] Current profile loaded:', {
        experienceLevel: currentProfile.experienceLevel,
        language: currentProfile.language,
        equipmentKeys: currentProfile.equipmentKeys
    });

    try {
        // Call Agent
        const result = await processUserMessage(
            session.user.email,
            message,
            history,
            currentProfile
        );

        // Auto-save USER profile updates to Firestore (not plan-specific data)
        if (result.updatedProfile && Object.keys(result.updatedProfile).length > 0) {
            try {
                const userRef = db.collection('users').doc(session.user.email);

                // Prepare data for Firestore update
                const updateData: any = {
                    updatedAt: new Date(),
                };

                // USER DATA - Persist these (don't change between plans)
                if (result.updatedProfile.experienceLevel) updateData.experienceLevel = result.updatedProfile.experienceLevel;
                if (result.updatedProfile.equipmentKeys) updateData.equipmentKeys = result.updatedProfile.equipmentKeys;
                if (result.updatedProfile.limitations) updateData.limitations = result.updatedProfile.limitations;
                if (result.updatedProfile.age) updateData.age = result.updatedProfile.age;
                if (result.updatedProfile.weight) updateData.weight = result.updatedProfile.weight;
                if (result.updatedProfile.height) updateData.height = result.updatedProfile.height;

                // PLAN DATA - DO NOT persist (varies per plan):
                // - primaryGoal (user might want fat_loss one time, muscle_gain another)
                // - sessionsPerWeek (might vary by plan)
                // - minutesPerSession (might vary by plan)
                // - stylePreferences (might vary by plan)

                // Only save if we actually have user data to update
                if (Object.keys(updateData).length > 1) { // > 1 because updatedAt always exists
                    await userRef.set(updateData, { merge: true });
                    console.log('[Coach] Auto-saved USER profile updates:', Object.keys(updateData).filter(k => k !== 'updatedAt'));
                }
            } catch (error) {
                console.error('[Coach] Failed to auto-save profile updates:', error);
                // Don't fail the request if save fails
            }
        }

        return NextResponse.json({
            message: result.message,
            state: result.state,
        });
    } catch (error) {
        console.error("Agent Error:", error);
        return NextResponse.json({ error: "Agent process failed", details: String(error) }, { status: 500 });
    }
}

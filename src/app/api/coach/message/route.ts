
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

    // Fetch user data (ALL profile data in one place)
    const userRef = db.collection('users').doc(userId);
    const userSnap = await userRef.get();

    // Build current profile from users collection
    const currentProfile: Partial<UserProfileInput> = userSnap.exists ? (userSnap.data() || {}) : {};

    console.log('[Coach API] Current profile loaded:', {
        experienceLevel: currentProfile.experienceLevel,
        language: currentProfile.language,
        primaryGoal: currentProfile.primaryGoal,
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

        // Auto-save ALL profile updates to users collection
        if (result.updatedProfile && Object.keys(result.updatedProfile).length > 0) {
            try {
                const updateData: any = {
                    updatedAt: new Date(),
                };

                // Save ALL fields (no distinction between "user" and "plan" data anymore)
                if (result.updatedProfile.experienceLevel) updateData.experienceLevel = result.updatedProfile.experienceLevel;
                if (result.updatedProfile.primaryGoal) updateData.primaryGoal = result.updatedProfile.primaryGoal;
                if (result.updatedProfile.sessionsPerWeek) updateData.sessionsPerWeek = result.updatedProfile.sessionsPerWeek;
                if (result.updatedProfile.minutesPerSession) updateData.minutesPerSession = result.updatedProfile.minutesPerSession;
                if (result.updatedProfile.equipmentKeys) updateData.equipmentKeys = result.updatedProfile.equipmentKeys;
                if (result.updatedProfile.limitations) updateData.limitations = result.updatedProfile.limitations;
                if (result.updatedProfile.age) updateData.age = result.updatedProfile.age;
                if (result.updatedProfile.weight) updateData.weight = result.updatedProfile.weight;
                if (result.updatedProfile.height) updateData.height = result.updatedProfile.height;

                // Style preferences
                if (result.updatedProfile.stylePreferences?.circuitsPreference) {
                    updateData.circuitsPreference = result.updatedProfile.stylePreferences.circuitsPreference;
                }
                if (result.updatedProfile.stylePreferences?.runningFinisherPreference) {
                    updateData.runningFinisher = result.updatedProfile.stylePreferences.runningFinisherPreference;
                }

                if (Object.keys(updateData).length > 1) { // > 1 because updatedAt always exists
                    await userRef.set(updateData, { merge: true });
                    console.log('[Coach] Auto-saved profile updates:', Object.keys(updateData).filter(k => k !== 'updatedAt'));
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

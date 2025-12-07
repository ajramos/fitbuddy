
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

    // Fetch current profile (training data)
    const profileRef = db.collection('profiles').doc(userId);
    const profileSnap = await profileRef.get();

    // Fetch user settings (name, language)
    const userRef = db.collection('users').doc(userId);
    const userSnap = await userRef.get();

    let currentProfile: Partial<UserProfileInput> = {};

    if (profileSnap.exists) {
        currentProfile = { ...currentProfile, ...profileSnap.data() as Partial<UserProfileInput> };
    }

    // Merge user settings
    if (userSnap.exists) {
        const userData = userSnap.data();
        if (userData?.name) currentProfile.name = userData.name;
        if (userData?.language) currentProfile.language = userData.language;
    }

    try {
        // Call Agent
        const result = await processUserMessage(userId, message, history as Content[], currentProfile);

        // Update Profile if needed
        if (result.updatedProfile) {
            await profileRef.set({ ...currentProfile, ...result.updatedProfile }, { merge: true });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("Agent Error:", error);
        return NextResponse.json({ error: "Agent process failed", details: String(error) }, { status: 500 });
    }
}

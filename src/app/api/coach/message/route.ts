
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

    // Fetch current profile
    const profileRef = db.collection('profiles').doc(userId);
    const profileSnap = await profileRef.get();

    let currentProfile: Partial<UserProfileInput> = {};
    if (profileSnap.exists) {
        currentProfile = profileSnap.data() as Partial<UserProfileInput>;
    }

    // Call Agent
    const result = await processUserMessage(userId, message, history as Content[], currentProfile);

    // Update Profile if needed
    if (result.updatedProfile) {
        await profileRef.set({ ...currentProfile, ...result.updatedProfile }, { merge: true });
    }

    return NextResponse.json(result);
}

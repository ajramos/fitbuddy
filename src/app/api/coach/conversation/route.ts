
import { auth } from "@/auth";
import { db } from "@/lib/db/firestore";
import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";

// GET - Get active conversation (latest without planId or create new if none exists)
export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.email;

    try {
        // Find most recent conversation (filter planId in code to avoid composite index)
        const conversationsRef = db.collection('conversations');
        const snapshot = await conversationsRef
            .where('userId', '==', userId)
            .orderBy('updatedAt', 'desc')
            .limit(10)  // Get last 10 to filter in code
            .get();

        // Find first conversation without planId
        const activeDoc = snapshot.docs.find(doc => !doc.data().planId);

        if (activeDoc) {
            const data = activeDoc.data();

            // Convert Timestamps to plain objects
            const conversation = {
                id: activeDoc.id,
                userId: data.userId,
                planId: data.planId || null,
                messages: data.messages || [],
                createdAt: data.createdAt?.toDate(),
                updatedAt: data.updatedAt?.toDate(),
            };

            return NextResponse.json({ conversation });
        }

        // No active conversation found, return null
        return NextResponse.json({ conversation: null });
    } catch (error) {
        console.error("[Conversation GET] Error:", error);
        return NextResponse.json({ error: "Failed to fetch conversation" }, { status: 500 });
    }
}

// POST - Create new conversation
export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.email;

    try {
        const conversationRef = db.collection('conversations').doc();
        const now = Timestamp.now();

        const conversationData = {
            id: conversationRef.id,
            userId,
            planId: null,
            messages: [],
            createdAt: now,
            updatedAt: now,
        };

        await conversationRef.set(conversationData);

        console.log(`[Conversation] Created new conversation: ${conversationRef.id} for user: ${userId}`);

        return NextResponse.json({
            conversationId: conversationRef.id,
            conversation: {
                ...conversationData,
                createdAt: now.toDate(),
                updatedAt: now.toDate(),
            }
        });
    } catch (error) {
        console.error("[Conversation POST] Error:", error);
        return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
    }
}

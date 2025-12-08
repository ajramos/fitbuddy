
import { auth } from "@/auth";
import { db } from "@/lib/db/firestore";
import { NextResponse } from "next/server";

// GET - List all plans for the current user
export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.email;

    try {
        const plansRef = db.collection('plans');
        const snapshot = await plansRef
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .get();

        const plans = snapshot.docs
            .filter(doc => !doc.data().deleted)  // Filter deleted in code
            .map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    title: data.title,
                    goal: data.profileSnapshot?.primaryGoal || 'unknown',
                    createdAt: data.createdAt?._seconds ? new Date(data.createdAt._seconds * 1000).toISOString() : null,
                    totalWeeks: data.totalWeeks,
                };
            });

        return NextResponse.json({ plans });
    } catch (error) {
        console.error("[Plan List] Error:", error);
        return NextResponse.json({ error: "Failed to fetch plans" }, { status: 500 });
    }
}

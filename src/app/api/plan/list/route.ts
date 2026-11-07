
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
            .get();

        const plans = snapshot.docs
            .filter(doc => !doc.data().deleted)  // Filter deleted in code
            .map(doc => {
                const data = doc.data();

                // Handle Firestore Timestamp properly
                let createdAtISO = null;
                let createdAtTimestamp = 0;
                if (data.createdAt) {
                    if (typeof data.createdAt.toDate === 'function') {
                        // Firestore Timestamp object
                        const date = data.createdAt.toDate();
                        createdAtISO = date.toISOString();
                        createdAtTimestamp = date.getTime();
                    } else if (data.createdAt._seconds) {
                        // Plain object with _seconds
                        createdAtTimestamp = data.createdAt._seconds * 1000;
                        createdAtISO = new Date(createdAtTimestamp).toISOString();
                    }
                }

                return {
                    id: doc.id,
                    title: data.title,
                    goal: data.profileSnapshot?.primaryGoal || 'unknown',
                    createdAt: createdAtISO,
                    createdAtTimestamp,
                    totalWeeks: data.totalWeeks,
                };
            })
            .sort((a, b) => b.createdAtTimestamp - a.createdAtTimestamp) // Sort in memory (newest first)
            .map(({ createdAtTimestamp, ...plan }) => plan); // Remove timestamp used for sorting

        return NextResponse.json({ plans });
    } catch (error) {
        console.error("[Plan List] Error:", error);
        return NextResponse.json({ error: "Failed to fetch plans" }, { status: 500 });
    }
}

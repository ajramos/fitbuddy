
import { auth } from "@/auth";
import { db } from "@/lib/db/firestore";
import { TrainingPlanDocument } from "@/lib/db/schema";
import { NextResponse } from "next/server";

// GET - Get a specific plan by ID
export async function GET(req: Request, { params }: { params: { id: string } }) {
    const session = await auth();
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.email;
    const planId = params.id;

    try {
        const doc = await db.collection('plans').doc(planId).get();

        if (!doc.exists) {
            return NextResponse.json({ error: "Plan not found" }, { status: 404 });
        }

        const plan = doc.data() as TrainingPlanDocument;

        // Check ownership
        if (plan.userId !== userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        return NextResponse.json({ plan });
    } catch (error) {
        console.error("[Plan GET] Error:", error);
        return NextResponse.json({ error: "Failed to fetch plan" }, { status: 500 });
    }
}

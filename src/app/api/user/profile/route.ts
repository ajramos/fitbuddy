
import { auth } from "@/auth";
import { db } from "@/lib/db/firestore";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const data = await req.json();
        const {
            name,
            language,
            age,
            weight,
            height,
            primaryGoal,
            experienceLevel,
            equipment,
            limitations
        } = data;

        // Basic sanitization/validation could go here.
        // For MVP, we update the specific fields provided.
        // We map "equipment" (string) to "equipmentKeys" (array) if needed,
        // or just store what the form sends if it matches our schema.
        // The current schema expects 'equipmentKeys: string[]'. 
        // Let's assume the client sends processed arrays or strings. 
        // The Coach Prompt uses 'equipmentKeys'.

        const updateData: any = {};
        if (name) updateData.name = name;
        if (language) updateData.language = language;
        if (age) updateData.age = Number(age);
        if (weight) updateData.weight = Number(weight);
        if (height) updateData.height = Number(height);
        if (primaryGoal) updateData.primaryGoal = primaryGoal;
        if (experienceLevel) updateData.experienceLevel = experienceLevel;

        // Handle array fields which might come as comma-separated strings from a simple text area
        if (typeof equipment === 'string') {
            updateData.equipmentKeys = equipment.split(',').map(s => s.trim()).filter(Boolean);
        } else if (Array.isArray(equipment)) {
            updateData.equipmentKeys = equipment;
        }

        if (typeof limitations === 'string') {
            updateData.limitations = limitations.split(',').map(s => s.trim()).filter(Boolean);
        } else if (Array.isArray(limitations)) {
            updateData.limitations = limitations;
        }

        await db.collection('users').doc(session.user.email).set(updateData, { merge: true });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Profile update error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

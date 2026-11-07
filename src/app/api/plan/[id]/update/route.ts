
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth/auth-utils';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/db/firebase-admin';

initAdmin();
const db = getFirestore();

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await getAuth(req);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();

        // Validate that we are only updating allowed fields
        // Allowing title, userNotes, and days (for deep edits)
        const updateData: any = {
            updatedAt: new Date()
        };

        if (typeof body.title === 'string') updateData.title = body.title;
        if (typeof body.userNotes === 'string') updateData.userNotes = body.userNotes;
        if (Array.isArray(body.days)) updateData.days = body.days;

        // Verify ownership
        const docRef = db.collection('plans').doc(id);
        const doc = await docRef.get();

        if (!doc.exists || doc.data()?.userId !== userId) {
            return NextResponse.json({ error: 'Plan not found or unauthorized' }, { status: 404 });
        }

        await docRef.update(updateData);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('[API] Error updating plan:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

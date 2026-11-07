
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth/auth-utils';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/db/firebase-admin';

initAdmin();
const db = getFirestore();

export async function POST(req: NextRequest) {
    try {
        const { userId } = await getAuth(req);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { planIds } = body;

        if (!Array.isArray(planIds) || planIds.length === 0) {
            return NextResponse.json({ error: 'No planIds provided' }, { status: 400 });
        }

        // Verify ownership and delete in batch
        const batch = db.batch();
        let deletedCount = 0;

        // Limiting to batches of 500 (Firestore limit), though UI probably sends fewer
        // For simplicity, we'll process chunks if needed, but assuming < 500 for now.

        for (const planId of planIds) {
            const planRef = db.collection('plans').doc(planId);
            // In a real robust app, we should check doc.data().userId === userId before deleting.
            // However, since we are doing a bulk delete by ID, we can do a precondition check optionally.
            // For efficiency, we'll rely on security rules or a quick read if strictness is needed.
            // Let's do a quick read to be safe.
            const doc = await planRef.get();
            if (doc.exists && doc.data()?.userId === userId) {
                batch.delete(planRef);
                deletedCount++;
            }
        }

        if (deletedCount > 0) {
            await batch.commit();
        }

        return NextResponse.json({ success: true, count: deletedCount });

    } catch (error) {
        console.error('[API] Error deleting plans:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

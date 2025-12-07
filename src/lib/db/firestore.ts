

import { initializeApp, getApps, cert, App, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// In production (Cloud Run), we can use default application credentials (no args).
// For local dev, we might need a service account key or use the emulator.
// Since the user asked for "Google Cloud Serverless", standard ADC is best.

let app: App;

if (getApps().length === 0) {
    // Check if we have a specific service account env var (local dev fallback)
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (serviceAccountJson) {
        try {
            const serviceAccount = JSON.parse(serviceAccountJson) as ServiceAccount;
            app = initializeApp({
                credential: cert(serviceAccount)
            });
        } catch (e) {
            console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY", e);
            // Fallback to ADC
            app = initializeApp();
        }
    } else {
        // Default to ADC (Application Default Credentials)
        // This works on Cloud Run and locally if `gcloud auth application-default login` was run.
        app = initializeApp();
    }
} else {
    app = getApps()[0];
}

export const db = getFirestore(app);

try {
    db.settings({ ignoreUndefinedProperties: true });
} catch (e: any) {
    if (e.code === 'FAILED_PRECONDITION') {
        // Settings can only be applied once. This error is expected in hot-reloading.
        console.warn("Firestore settings already applied.");
    } else {
        // Ignore other double-init errors in dev
        console.warn("Firestore settings warning:", e.message);
    }
}

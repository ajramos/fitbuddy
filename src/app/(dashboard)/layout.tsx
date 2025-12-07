import { DashboardShell } from "@/components/layout/dashboard-shell";
import { LanguageProvider } from "@/components/providers/language-provider";
import { auth } from "@/auth";
import { db } from "@/lib/db/firestore";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    let initialLanguage = 'en';

    if (session?.user?.email) {
        const userDoc = await db.collection('users').doc(session.user.email).get();
        if (userDoc.exists) {
            initialLanguage = userDoc.data()?.language || 'en';
        }
    }

    return (
        <LanguageProvider initialLanguage={initialLanguage}>
            <DashboardShell>
                {children}
            </DashboardShell>
        </LanguageProvider>
    );
}

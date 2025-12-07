
import CoachChat from "@/components/coach/chat";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function CoachPage() {
    const session = await auth();
    if (!session) redirect("/");

    return (
        <main className="flex min-h-screen flex-col items-center bg-slate-50 p-4 pt-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-6">Your AI Coach</h1>
            <CoachChat />
        </main>
    );
}

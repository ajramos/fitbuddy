
import CoachChat from "@/components/coach/chat";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function CoachPage() {
    const session = await auth();
    if (!session) redirect("/");

    return (
        <div className="flex flex-col flex-1 h-full bg-slate-50 p-4 md:p-6 overflow-hidden">
            <h1 className="text-2xl font-bold text-slate-800 mb-4 shrink-0">Your AI Coach</h1>
            <CoachChat />
        </div>
    );
}

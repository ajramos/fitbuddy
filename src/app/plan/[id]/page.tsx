
import { auth } from "@/auth";
import { db } from "@/lib/db/firestore";
import { TrainingPlanDocument } from "@/lib/db/schema";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Clock, Dumbbell, Calendar, ArrowLeft } from "lucide-react";
import { ExerciseRow } from "../../../components/plan/exercise-row";

async function getPlan(userId: string, planId: string): Promise<TrainingPlanDocument | null> {
    const doc = await db.collection('plans').doc(planId).get();
    if (!doc.exists) return null;
    const plan = doc.data() as TrainingPlanDocument;
    if (plan.userId !== userId) return null; // Simple ownership check
    return plan;
}

export default async function PlanPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await auth();
    if (!session?.user?.email) redirect("/");

    const plan = await getPlan(session.user.email, params.id);

    if (!plan) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-slate-800">
                <h1 className="text-2xl font-bold mb-4">Plan not found</h1>
                <Link href="/coach" className="text-blue-600 hover:underline">Go back to Coach</Link>
            </div>
        );
    }

    // Format Title nicely (e.g. "muscle_gain" -> "Muscle Gain")
    const formattedTitle = plan.title.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    return (
        <main className="min-h-screen bg-slate-50 pb-12">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/coach" className="text-slate-500 hover:text-slate-800 transition">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">{formattedTitle} Plan</h1>
                            <p className="text-sm text-slate-500">Weekly Repeating Schedule • {plan.totalWeeks} Week Cycle</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Vertical Layout Container */}
            <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
                {plan.days.map((day) => (
                    <div key={day.dayIndex} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        {/* Day Header */}
                        <div className="bg-white border-b border-slate-100 p-5 flex justify-between items-center sticky top-0">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">{day.label}</h2>
                                <p className="text-sm text-blue-600 font-medium mt-1 flex items-center gap-1">
                                    <Dumbbell className="w-4 h-4" /> {day.focus}
                                </p>
                            </div>
                            <div className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide">
                                Day {day.dayIndex}
                            </div>
                        </div>

                        <div className="p-5 space-y-8">
                            {day.blocks.map((block, bIdx) => (
                                <div key={bIdx} className="space-y-4">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
                                        {block.label}
                                    </h3>
                                    <ul className="space-y-0">
                                        {block.exercises.map((ex, eIdx) => (
                                            <ExerciseRow key={eIdx} exercise={ex} />
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
}

// Import at the top will be added by next step or implied if I assumed I could edit whole file. 
// Since I am doing replace_file_content on a function, I need to make sure imports are there.
// Actually, I should probably do a full replacement of the file content or ensures imports exist.
// I will use replace_file_content for the function and then another call for imports if needed.
// Wait, I haven't imported ExerciseRow yet. I should add the import.


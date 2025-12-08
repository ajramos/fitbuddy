import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Calendar, PlusCircle } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";

interface Plan {
    id: string;
    title: string;
    goal: string;
    createdAt: string;
    totalWeeks: number;
}

async function getPlans(): Promise<Plan[]> {
    const session = await auth();
    if (!session?.user?.email) redirect("/");

    try {
        const res = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'} /api/plan / list`, {
            cache: 'no-store',
            headers: {
                cookie: `next - auth.session - token=${session.user.email} ` // Simplified, adjust for production
            }
        });

        if (!res.ok) throw new Error('Failed to fetch plans');

        const data = await res.json();
        return data.plans || [];
    } catch (error) {
        console.error('[Plans Page] Error fetching plans:', error);
        return [];
    }
}

export default async function PlansPage() {
    const plans = await getPlans();

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">
                        My Training Plans
                    </h1>
                    <p className="text-slate-600">
                        Browse and manage all your personalized training plans
                    </p>
                </div>

                {/* Plans Grid */}
                {plans.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
                        <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-slate-900 mb-2">
                            No plans yet
                        </h3>
                        <p className="text-slate-600 mb-6 max-w-md mx-auto">
                            Start a conversation with your coach to create your first personalized training plan.
                        </p>
                        <Link
                            href="/coach"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <PlusCircle className="w-5 h-5" />
                            Talk to Coach
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {plans.map((plan) => (
                            <Link
                                key={plan.id}
                                href={`/ plan / ${plan.id} `}
                                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all group"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <Calendar className="w-8 h-8 text-blue-600" />
                                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
                                        {plan.totalWeeks} {plan.totalWeeks === 1 ? 'Week' : 'Weeks'}
                                    </span>
                                </div>

                                <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                                    {plan.title}
                                </h3>

                                <p className="text-sm text-slate-500 mb-4">
                                    Goal: <span className="font-medium capitalize">{plan.goal.replace('_', ' ')}</span>
                                </p>

                                <div className="flex items-center text-xs text-slate-400">
                                    <span>Created on {new Date(plan.createdAt).toLocaleDateString()}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

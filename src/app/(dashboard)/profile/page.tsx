
import { auth } from "@/auth";
import { db } from "@/lib/db/firestore";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile/profile-form";
import { User } from "lucide-react";

export default async function ProfilePage() {
    const session = await auth();
    if (!session?.user?.email) redirect("/");

    const userDoc = await db.collection('users').doc(session.user.email).get();
    const rawUserData = userDoc.exists ? userDoc.data() : {};

    // Convert Firestore Timestamps to plain objects (Client Components can't handle Timestamps)
    const userData: any = {};
    for (const [key, value] of Object.entries(rawUserData || {})) {
        if (value && typeof value === 'object' && '_seconds' in value) {
            // Convert Timestamp to Date
            userData[key] = new Date((value as any)._seconds * 1000);
        } else {
            userData[key] = value;
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-3xl mx-auto space-y-8">
                {/* Header Card */}
                <div className="flex items-center gap-6 bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                        {session.user.image ? (
                            <img src={session.user.image} alt="Profile" className="w-full h-full rounded-full object-cover" />
                        ) : (
                            <User className="w-10 h-10" />
                        )}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{userData?.name || session.user.name || "User"}</h1>
                        <p className="text-slate-500">{session.user.email}</p>
                        <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Free Membership
                        </div>
                    </div>
                </div>

                <ProfileForm initialData={{ ...userData, name: userData?.name || session.user.name }} />
            </div>
        </div>
    );
}

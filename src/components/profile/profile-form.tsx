"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { useLanguage } from "@/components/providers/language-provider";

interface ProfileFormProps {
    initialData: any; // Using any for MVP flexibility, ideally strictly typed
}

export function ProfileForm({ initialData }: ProfileFormProps) {
    const router = useRouter();
    const { dict } = useLanguage();
    const [isLoading, setIsLoading] = useState(false);

    // Flatten initial data for the form
    const [formData, setFormData] = useState({
        name: initialData.name || "",
        language: initialData.language || (typeof navigator !== 'undefined' ? (navigator.language.startsWith('es') ? 'es' : 'en') : 'en'),
        age: initialData.age || "",
        weight: initialData.weight || "",
        height: initialData.height || "",
        primaryGoal: initialData.primaryGoal || "muscle_gain",
        experienceLevel: initialData.experienceLevel || "beginner",
        equipment: initialData.equipmentKeys?.join(", ") || "",
        limitations: initialData.limitations?.join(", ") || "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch("/api/user/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) throw new Error("Failed to update profile");

            router.refresh(); // Refresh server data
            alert(dict.profile.success); // Simple feedback for MVP
        } catch (error) {
            console.error(error);
            alert(dict.profile.error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
                {/* Personal Info Section */}
                <div className="border-b border-gray-100 pb-4 mb-4">
                    <h2 className="text-xl font-bold text-slate-800">{dict.profile.personalTitle}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">{dict.profile.name}</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. Alex"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">{dict.profile.language}</label>
                        <select
                            name="language"
                            value={formData.language}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="en">English (English)</option>
                            <option value="es">Español (Spanish)</option>
                        </select>
                    </div>
                </div>

                {/* Physical Stats Section Header */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-4 pt-4">
                    <h2 className="text-xl font-bold text-slate-800">{dict.profile.statsTitle}</h2>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {dict.profile.save}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">{dict.profile.age}</label>
                        <input
                            type="number"
                            name="age"
                            value={formData.age}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. 30"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">{dict.profile.weight}</label>
                        <input
                            type="number"
                            name="weight"
                            value={formData.weight}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. 75"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">{dict.profile.height}</label>
                        <input
                            type="number"
                            name="height"
                            value={formData.height}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. 175"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">{dict.profile.experience}</label>
                        <select
                            name="experienceLevel"
                            value={formData.experienceLevel}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="beginner">{dict.profile.options.beginner}</option>
                            <option value="intermediate">{dict.profile.options.intermediate}</option>
                            <option value="advanced">{dict.profile.options.advanced}</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">{dict.profile.goal}</label>
                        <select
                            name="primaryGoal"
                            value={formData.primaryGoal}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="muscle_gain">{dict.profile.options.muscle_gain}</option>
                            <option value="fat_loss">{dict.profile.options.fat_loss}</option>
                            <option value="recomposition">{dict.profile.options.recomposition}</option>
                            <option value="strength">{dict.profile.options.strength}</option>
                            <option value="endurance">{dict.profile.options.endurance}</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">{dict.profile.equipment}</label>
                    <textarea
                        name="equipment"
                        value={formData.equipment}
                        onChange={handleChange}
                        rows={2}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="e.g. Dumbbells, Bench, Pull-up Bar"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">{dict.profile.limitations}</label>
                    <textarea
                        name="limitations"
                        value={formData.limitations}
                        onChange={handleChange}
                        rows={2}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="e.g. Lower back pain, Left shoulder click"
                    />
                </div>
            </form>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-red-100 flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">{dict.profile.accountTitle}</h3>
                    <p className="text-sm text-slate-500">{dict.profile.signOutDesc}</p>
                </div>
                <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="flex items-center gap-2 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition"
                >
                    <LogOut className="w-4 h-4" />
                    {dict.sidebar.signOut}
                </button>
            </div>
        </div>
    );
}

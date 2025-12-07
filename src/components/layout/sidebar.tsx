"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
    MessageSquare,
    Calendar,
    User,
    LogOut,
    Menu,
    X,
    Dumbbell,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

// If we don't have this util yet, I'll inline a simple version or create it later.
// For now, I'll assume standard Shadcn/Tailwind usage or inline common `clsx/tailwind-merge` logic pattern 
// but since I don't recall creating `lib/utils` specifically, I will use standard string template for now to avoid errors,
// or just create the util file if missing. 
// Actually, `clsx` and `tailwind-merge` are in package.json, so I should probably create `lib/utils.ts` if it doesn't exist.

const items = [
    { label: "Coach", icon: MessageSquare, href: "/coach" },
    { label: "My Plan", icon: Calendar, href: "/plan/latest" }, // We'll need a way to resolve "latest" or just link to generic plan page logic
    { label: "Profile", icon: User, href: "/profile" },
];

export function Sidebar() {
    const pathname = usePathname();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Mock logic for "My Plan" - in reality we might want to fetch the active plan ID
    // For now, we will handle the "latest" logic in the /plan/latest page stub if needed, 
    // or just let the user go to /coach if no plan.

    return (
        <>
            {/* Mobile Header / Hamburger */}
            <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 p-4 z-50 flex justify-between items-center">
                <div className="flex items-center gap-2 font-bold text-blue-600">
                    <Dumbbell className="w-6 h-6" />
                    <span>FitBuddy</span>
                </div>
                <button onClick={() => setIsMobileOpen(!isMobileOpen)}>
                    {isMobileOpen ? <X className="w-6 h-6 text-slate-800" /> : <Menu className="w-6 h-6 text-slate-800" />}
                </button>
            </div>

            {/* Overlay for Mobile */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <aside
                className={cn(
                    "fixed top-0 left-0 bottom-0 bg-white border-r border-gray-200 z-50 transition-all duration-300 md:translate-x-0 w-64",
                    isCollapsed ? "md:w-20" : "md:w-64",
                    isMobileOpen ? "translate-x-0" : "-translate-x-full",
                    "mt-[57px] md:mt-0" // Offset for mobile header
                )}
            >
                {/* Desktop Header */}
                <div className={cn("hidden md:flex items-center h-16 border-b border-gray-100 px-4", isCollapsed ? "justify-center" : "justify-between")}>
                    {!isCollapsed && (
                        <div className="flex items-center gap-2 font-bold text-blue-600">
                            <Dumbbell className="w-6 h-6" />
                            <span>FitBuddy</span>
                        </div>
                    )}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"
                    >
                        {isCollapsed ? <Dumbbell className="w-6 h-6 text-blue-600" /> : <ChevronLeft className="w-5 h-5" />}
                    </button>
                </div>

                {/* Nav Items */}
                <nav className="p-4 space-y-2">
                    {items.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname.startsWith(item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsMobileOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-3 rounded-xl transition-all",
                                    isActive
                                        ? "bg-blue-50 text-blue-600 font-medium"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                                    isCollapsed && "justify-center px-2"
                                )}
                            >
                                <Icon className="w-5 h-5 flex-shrink-0" />
                                {!isCollapsed && <span>{item.label}</span>}
                            </Link>
                        )
                    })}
                </nav>

                {/* Footer / Logout */}
                <div className="absolute bottom-4 left-4 right-4">
                    <button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className={cn(
                            "flex items-center w-full gap-3 px-3 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all",
                            isCollapsed && "justify-center px-2"
                        )}
                    >
                        <LogOut className="w-5 h-5 flex-shrink-0" />
                        {!isCollapsed && <span>Sign Out</span>}
                    </button>
                </div>
            </aside>
        </>
    );
}

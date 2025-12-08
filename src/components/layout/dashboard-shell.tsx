"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    MessageSquare,
    Calendar,
    User,
    LogOut,
    Menu,
    X,
    Dumbbell,
    ChevronLeft,
    CalendarDaysIcon,
    ChevronRight
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/providers/language-provider";



export function DashboardShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { dict } = useLanguage();

    const navItems = [
        { label: dict.sidebar.coach, icon: MessageSquare, href: "/coach" },
        { label: dict.sidebar.plan, icon: Calendar, href: "/plan/latest" },
        { label: dict.navigation.plans, icon: CalendarDaysIcon, href: "/plans" },
        { label: dict.sidebar.profile, icon: User, href: "/profile" },
    ];

    return (
        <div className="h-screen bg-slate-50 flex flex-col md:flex-row overflow-hidden">
            {/* Mobile Header */}
            <div className="md:hidden bg-white border-b border-gray-200 p-4 shrink-0 z-50 flex justify-between items-center h-[57px]">
                <div className="flex items-center gap-2 font-bold text-blue-600">
                    <Dumbbell className="w-6 h-6" />
                    <span>{dict.sidebar.title}</span>
                </div>
                <button onClick={() => setIsMobileOpen(!isMobileOpen)}>
                    {isMobileOpen ? <X className="w-6 h-6 text-slate-800" /> : <Menu className="w-6 h-6 text-slate-800" />}
                </button>
            </div>

            {/* Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed md:static inset-y-0 left-0 bg-white border-r border-gray-200 z-50 transition-all duration-300 flex flex-col pt-[57px] md:pt-0",
                    isCollapsed ? "md:w-20" : "md:w-64",
                    isMobileOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0"
                )}
            >
                {/* Desktop Header Toggle */}
                <div className={cn("hidden md:flex items-center h-16 border-b border-gray-100 px-4 shrink-0", isCollapsed ? "justify-center" : "justify-between")}>
                    {!isCollapsed && (
                        <div className="flex items-center gap-2 font-bold text-blue-600">
                            <Dumbbell className="w-6 h-6" />
                            <span>{dict.sidebar.title}</span>
                        </div>
                    )}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"
                    >
                        {isCollapsed ? <Dumbbell className="w-6 h-6 text-blue-600" /> : <ChevronLeft className="w-5 h-5" />}
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname.startsWith(item.href) || (item.href === '/plan/latest' && pathname.startsWith('/plan/'));

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
                                title={isCollapsed ? item.label : undefined}
                            >
                                <Icon className="w-5 h-5 flex-shrink-0" />
                                {!isCollapsed && <span>{item.label}</span>}
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 border-t border-gray-100 shrink-0">
                    <button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className={cn(
                            "flex items-center w-full gap-3 px-3 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all",
                            isCollapsed && "justify-center px-2"
                        )}
                        title={isCollapsed ? "Sign Out" : undefined}
                    >
                        <LogOut className="w-5 h-5 flex-shrink-0" />
                        {!isCollapsed && <span>{dict.sidebar.signOut}</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0 flex flex-col h-full overflow-y-auto">
                {children}
            </main>
        </div>
    );
}

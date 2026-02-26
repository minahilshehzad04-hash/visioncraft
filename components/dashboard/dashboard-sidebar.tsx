"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
    Layout,
    PlayCircle,
    BookOpen,
    CreditCard,
    Settings,
    Plus,
    Zap,
    User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const menuItems = [
    { name: "Series", icon: Layout, href: "/dashboard" },
    { name: "Videos", icon: PlayCircle, href: "/dashboard/videos" },
    { name: "Guides", icon: BookOpen, href: "/dashboard/guides" },
    { name: "Billing", icon: CreditCard, href: "/dashboard/billing" },
    { name: "Settings", icon: Settings, href: "/dashboard/settings" },
];

const footerItems = [
    { name: "Upgrade", icon: Zap, href: "/dashboard/upgrade" },
    { name: "Profile setting", icon: User, href: "/dashboard/profile" },
];

export function DashboardSidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-gray-200 bg-white flex flex-col pt-6">
            {/* Header with Logo */}
            <div className="px-6 mb-8 flex items-center gap-3">
                <div className="relative h-8 w-8 overflow-hidden rounded-lg">
                    <Image
                        src="/logo1.jpg"
                        alt="VidMaxx Logo"
                        fill
                        className="object-cover"
                        onError={(e) => {
                            // Fallback logo if logo.png is missing
                            const target = e.target as HTMLImageElement;
                            target.src = "https://ui-avatars.com/api/?name=V&background=020617&color=fff&bold=true";
                        }}
                    />
                </div>
                <span className="text-xl font-bold text-blue-600 tracking-tight">VidMaxx</span>
            </div>

            {/* Create New Series Action */}
            <div className="px-4 mb-8">
                <Link href="/dashboard/create">
                    <Button className="w-full flex items-center justify-center gap-2 py-6 text-base font-semibold shadow-sm bg-blue-600 hover:bg-blue-700 text-white hover:scale-[1.02] transition-all">
                        <Plus className="h-5 w-5" />
                        Create new series
                    </Button>
                </Link>
            </div>

            {/* Navigation Menu */}

            <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-4 px-3 py-3 rounded-lg transition-colors group",
                                isActive
                                    ? "bg-blue-100 text-gray-900 font-medium"
                                    : "text-gray-600 hover:bg-blue-50 hover:text-blue-900"
                            )}
                        >
                            <item.icon className={cn(
                                "h-6 w-6 transition-colors",
                                isActive ? "text-gray-900" : "text-gray-400 group-hover:text-blue-600"
                            )} />
                            <span className="text-[17px]">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Footer Menu */}
            <div className="px-4 py-8 border-t border-gray-100 space-y-2">
                {footerItems.map((item) => (
                    <Link
                        key={item.name}
                        href={item.href}
                        className="flex items-center gap-4 px-3 py-3 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors group"
                    >
                        <item.icon className="h-6 w-6 text-blue-400 group-hover:text-blue-600 transition-colors" />
                        <span className="text-[17px]">{item.name}</span>
                    </Link>
                ))}
            </div>
        </aside>
    );
}

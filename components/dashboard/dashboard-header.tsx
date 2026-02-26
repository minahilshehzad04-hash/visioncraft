"use client";

import { UserButton } from "@clerk/nextjs";

export function DashboardHeader() {
    return (
        <header className="h-16 border-b border-gray-200 bg-white sticky top-0 z-30 flex items-center justify-between px-8">
            <div className="flex items-center gap-4">
                {/* Placeholder for any left-side header content like breadcrumbs */}
            </div>

            <div className="flex items-center gap-4">
                <UserButton
                    afterSignOutUrl="/"
                    appearance={{
                        elements: {
                            avatarBox: "h-9 w-9"
                        }
                    }}
                />
            </div>
        </header>
    );
}

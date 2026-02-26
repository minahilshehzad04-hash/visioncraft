import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { syncUser } from "@/actions/user";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    // Run syncUser logic on every dashboard load
    try {
        const result = await syncUser();
        if (!result.success && result.error !== "User already synced") {
            console.error("[DashboardLayout] Sync failed:", result.error);
        }
    } catch (err) {
        console.error("[DashboardLayout] Unexpected error during sync:", err);
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            <DashboardSidebar />

            <div className="flex-1 flex flex-col ml-64">
                <DashboardHeader />
                <main className="p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}

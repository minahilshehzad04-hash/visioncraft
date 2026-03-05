import { SeriesList } from "@/components/dashboard/series-list";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getSeries } from "@/actions/series";

export default async function DashboardPage() {
    const { data: initialSeries = [] } = await getSeries();

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                <div>
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Your Series</h1>
                    <p className="text-gray-500 font-medium mt-1">Manage and monitor your automated video content.</p>
                </div>
                <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-6 rounded-2xl shadow-xl shadow-blue-100 transition-all hover:scale-105 active:scale-95 group">
                    <Link href="/dashboard/create" className="flex items-center gap-2">
                        <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform" />
                        Create New Series
                    </Link>
                </Button>
            </div>

            <SeriesList initialSeries={initialSeries} />

            <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Dashboard Stats */}
                <div className="p-8 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Series</h3>
                    <p className="text-4xl font-black text-gray-900">{initialSeries.length}</p>
                </div>
                <div className="p-8 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Videos Generated</h3>
                    <p className="text-4xl font-black text-gray-900">
                        {initialSeries.reduce((acc, s) => acc + (s.video_count || 0), 0)}
                    </p>
                </div>
                <div className="p-8 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Credits Remaining</h3>
                    <p className="text-4xl font-black text-gray-900 text-blue-600">100</p>
                </div>
            </div>
        </div>
    );
}

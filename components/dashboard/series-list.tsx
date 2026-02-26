"use client";

import { useEffect, useState, useCallback } from "react";
import { SeriesCard } from "./series-card";
import { getSeries, deleteSeries, toggleSeriesStatus, requestVideoGeneration } from "@/actions/series";
import { toast } from "sonner";
import { Loader2, Video, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface SeriesListProps {
    initialSeries: any[];
}

export function SeriesList({ initialSeries }: SeriesListProps) {
    const [series, setSeries] = useState<any[]>(initialSeries);
    const [isLoading, setIsLoading] = useState(false);

    const fetchSeries = useCallback(async () => {
        // Only fetch if we need to refresh (e.g. after a big change)
        const result = await getSeries();
        if (result.success) {
            setSeries(result.data || []);
        } else {
            toast.error("Failed to refresh series: " + result.error);
        }
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this series? All its generated videos will be lost.")) {
            return;
        }

        const result = await deleteSeries(id);
        if (result.success) {
            setSeries(series.filter((s) => s.id !== id));
            toast.success("Series deleted successfully");
        } else {
            toast.error("Delete failed: " + result.error);
        }
    };

    const handleToggleStatus = async (id: string, currentStatus: string) => {
        const result = await toggleSeriesStatus(id, currentStatus);
        if (result.success) {
            setSeries(series.map(s =>
                s.id === id ? { ...s, status: currentStatus === "paused" ? "active" : "paused" } : s
            ));
            toast.success(`Series ${currentStatus === "paused" ? "resumed" : "paused"}`);
        } else {
            toast.error("Update failed: " + result.error);
        }
    };

    const handleGenerateNow = async (id: string) => {
        try {
            await requestVideoGeneration(id);
        } catch (error) {
            console.error("Failed to trigger generation:", error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-4 animate-in fade-in duration-500">
                <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
                <p className="text-gray-500 font-medium">Fetching your video series...</p>
            </div>
        );
    }

    if (series.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center bg-white border border-dashed border-gray-200 rounded-[2.5rem] p-12 animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-sm">
                <div className="h-20 w-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mb-6 shadow-glow">
                    <Plus className="h-10 w-10" />
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900 mb-3 tracking-tight">No Series Found</h2>
                <p className="text-gray-500 text-lg font-medium max-w-sm mb-10 leading-relaxed">
                    You haven't created any automated video series yet. Start now and let AI grow your social media.
                </p>
                <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-6 rounded-2xl shadow-xl shadow-blue-200 transition-all hover:scale-105 active:scale-95 group">
                    <Link href="/dashboard/create" className="flex items-center gap-2">
                        Create your first series
                        <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform" />
                    </Link>
                </Button>

                <style jsx>{`
                    .shadow-glow {
                        box-shadow: 0 0 40px rgba(37, 99, 235, 0.1);
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-12 animate-in fade-in duration-700">
            {series.map((item) => (
                <SeriesCard
                    key={item.id}
                    series={item}
                    onDelete={handleDelete}
                    onToggleStatus={handleToggleStatus}
                    onGenerateNow={handleGenerateNow}
                    onEdit={(id) => {
                        window.location.href = `/dashboard/create?id=${id}`;
                    }}
                />
            ))}
        </div>
    );
}

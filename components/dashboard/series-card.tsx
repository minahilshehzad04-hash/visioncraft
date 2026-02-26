"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
    MoreHorizontal,
    Play,
    Pause,
    Trash2,
    Edit2,
    Calendar,
    Video,
    ExternalLink,
    ChevronRight,
    Sparkles
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { videoStyles } from "@/lib/constants";

interface SeriesCardProps {
    series: {
        id: string;
        series_name: string;
        video_style: string;
        status: "scheduled" | "generating" | "completed" | "failed" | "paused";
        created_at: string;
        platform: string;
        publish_time: string;
    };
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
    onToggleStatus?: (id: string, currentStatus: string) => void;
    onGenerateNow?: (id: string) => void;
}

export function SeriesCard({
    series,
    onEdit,
    onDelete,
    onToggleStatus,
    onGenerateNow,
}: SeriesCardProps) {
    const router = useRouter();
    const styleInfo = videoStyles.find(s => s.id === series.video_style);
    const isPaused = series.status === "paused";

    return (
        <div className="group relative bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-blue-50/50 transition-all duration-500 overflow-hidden flex flex-col">
            {/* Thumbnail Header */}
            <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                    src={styleInfo?.image || "/video-style/cinematic.png"}
                    alt={series.series_name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-100" />

                {/* Platform Badge */}
                <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 transparent-blur rounded-full text-[10px] font-bold text-white uppercase tracking-wider border border-white/20">
                        {series.platform}
                    </span>
                </div>

                {/* Edit Icon Overlay */}
                <button
                    onClick={() => onEdit?.(series.id)}
                    className="absolute top-4 right-4 h-10 w-10 bg-white/10 hover:bg-white/20 transparent-blur rounded-xl flex items-center justify-center text-white transition-all duration-300 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
                >
                    <Edit2 className="h-4 w-4" />
                </button>

                {/* Status Indicator */}
                <div className="absolute bottom-4 left-4 flex items-center gap-2">
                    <div className={cn(
                        "h-2 w-2 rounded-full animate-pulse",
                        isPaused ? "bg-amber-500" : "bg-emerald-500"
                    )} />
                    <span className="text-xs font-bold text-white/90 uppercase tracking-widest">
                        {series.status}
                    </span>
                </div>
            </div>

            {/* Content Area */}
            <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-xl font-extrabold text-gray-900 tracking-tight line-clamp-1 group-hover:text-blue-600 transition-colors">
                            {series.series_name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-gray-400">
                            <Calendar className="h-3.5 w-3.5" />
                            <span className="text-xs font-medium">
                                Created {format(new Date(series.created_at), "MMM d, yyyy")}
                            </span>
                        </div>
                    </div>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-gray-50">
                                <MoreHorizontal className="h-5 w-5 text-gray-400" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-48 p-2 rounded-2xl shadow-2xl border-gray-100">
                            <div className="space-y-1">
                                <button
                                    onClick={() => onEdit?.(series.id)}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                >
                                    <Edit2 className="h-4 w-4" />
                                    Edit Series
                                </button>
                                <button
                                    onClick={() => onToggleStatus?.(series.id, series.status)}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                >
                                    {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                                    {isPaused ? "Resume Series" : "Pause Series"}
                                </button>
                                <div className="h-px bg-gray-100 my-1" />
                                <button
                                    onClick={() => onDelete?.(series.id)}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                    Delete Series
                                </button>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Internal Actions */}
                <div className="mt-auto pt-6 flex flex-col gap-3 border-t border-gray-50">
                    <div className="flex items-center justify-between text-sm text-gray-500 font-medium px-1">
                        <div className="flex items-center gap-2">
                            <Video className="h-4 w-4 text-blue-500/60" />
                            <span>0 Videos</span>
                        </div>
                        <button className="flex items-center gap-1.5 text-blue-600 hover:underline">
                            View all
                            <ExternalLink className="h-3 w-3" />
                        </button>
                    </div>

                    <Button
                        onClick={() => {
                            onGenerateNow?.(series.id);
                            router.push("/dashboard/videos");
                        }}
                        className="w-full bg-gray-900 hover:bg-indigo-600 text-white font-bold py-5 rounded-2xl shadow-lg shadow-gray-200 transition-all hover:scale-[1.02] active:scale-[0.98] group/btn"
                    >
                        <Sparkles className="mr-2 h-4 w-4 text-indigo-400 group-hover/btn:text-white" />
                        Generate Video
                        <ChevronRight className="ml-auto h-4 w-4 opacity-40 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all" />
                    </Button>
                </div>
            </div>

            <style jsx>{`
                .transparent-blur {
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(8px);
                    -webkit-backdrop-filter: blur(8px);
                }
            `}</style>
        </div>
    );
}

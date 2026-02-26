"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CalendarClock, Clock, Film, Globe, Sparkles, ChevronDown, Loader2 } from "lucide-react";

const platforms = [
    { id: "tiktok", name: "TikTok", icon: "🎵" },
    { id: "youtube", name: "YouTube", icon: "▶️" },
    { id: "instagram", name: "Instagram", icon: "📸" },
    { id: "email", name: "Email", icon: "📧" },
];

const durations = [
    { value: "30-50", label: "30 – 50 seconds" },
    { value: "60-70", label: "60 – 70 seconds" },
];

interface SeriesDetailsProps {
    onSchedule: (details: {
        seriesName: string;
        duration: string;
        platform: string;
        publishTime: string;
    }) => void;
    onBack: () => void;
    isSubmitting?: boolean;
}

export function SeriesDetails({ onSchedule, onBack, isSubmitting }: SeriesDetailsProps) {
    const [seriesName, setSeriesName] = useState("");
    const [duration, setDuration] = useState("");
    const [platform, setPlatform] = useState("");
    const [publishTime, setPublishTime] = useState("");

    const isValid = seriesName.trim() && duration && platform && publishTime;

    return (
        <div className="w-full animate-in fade-in slide-in-from-right-8 duration-700 ease-out">
            <div className="mb-10">
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Series Details</h2>
                <p className="text-gray-500 text-lg font-medium">Finalize your series configuration and schedule it.</p>
            </div>

            <div className="max-w-2xl mx-auto space-y-8">
                {/* Series Name */}
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-blue-500" />
                        Series Name
                    </label>
                    <input
                        type="text"
                        value={seriesName}
                        onChange={(e) => setSeriesName(e.target.value)}
                        placeholder="e.g. Daily Tech Insights"
                        className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 bg-white text-gray-900 font-semibold text-lg placeholder:text-gray-300 placeholder:font-medium focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all"
                    />
                </div>

                {/* Video Duration */}
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Film className="h-4 w-4 text-blue-500" />
                        Video Duration
                    </label>
                    <div className="relative">
                        <select
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 bg-white text-gray-900 font-semibold text-lg appearance-none focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all cursor-pointer"
                        >
                            <option value="" disabled>Select duration</option>
                            {durations.map((d) => (
                                <option key={d.value} value={d.value}>{d.label}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                {/* Platform Selection */}
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Globe className="h-4 w-4 text-blue-500" />
                        Platform
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {platforms.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => setPlatform(p.id)}
                                className={cn(
                                    "flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all duration-300 cursor-pointer",
                                    platform === p.id
                                        ? "bg-blue-50 border-blue-600 ring-4 ring-blue-50 shadow-lg shadow-blue-100/50"
                                        : "bg-white border-gray-200 hover:border-blue-200 hover:shadow-md"
                                )}
                            >
                                <span className="text-3xl">{p.icon}</span>
                                <span className={cn(
                                    "font-bold text-sm tracking-tight",
                                    platform === p.id ? "text-blue-900" : "text-gray-700"
                                )}>
                                    {p.name}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Time to Publish */}
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-500" />
                        Time to Publish
                    </label>
                    <input
                        type="time"
                        value={publishTime}
                        onChange={(e) => setPublishTime(e.target.value)}
                        className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 bg-white text-gray-900 font-semibold text-lg focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all cursor-pointer"
                    />
                    <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                        <CalendarClock className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                        <p className="text-sm text-amber-700 font-medium">
                            Video will generate 3–6 hours before video publish
                        </p>
                    </div>
                </div>
            </div>

            {/* Premium Actions Bar */}
            <div className="mt-12 flex justify-between items-center bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-gray-600 hover:text-gray-900 hover:bg-white rounded-xl transition-all border border-transparent hover:border-gray-200 hover:shadow-sm"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Previous Step
                </button>
                <Button
                    disabled={!isValid || isSubmitting}
                    onClick={() => onSchedule({ seriesName, duration, platform, publishTime })}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-12 py-7 rounded-2xl text-lg font-extrabold shadow-xl shadow-blue-200 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 group"
                >
                    {isSubmitting ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                        <CalendarClock className="mr-2 h-5 w-5" />
                    )}
                    {isSubmitting ? "Scheduling..." : "Schedule Series"}
                </Button>
            </div>
        </div>
    );
}

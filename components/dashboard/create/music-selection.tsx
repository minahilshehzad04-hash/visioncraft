"use client";

import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { backgroundMusic } from "@/lib/constants";
import { ArrowRight, ArrowLeft, Play, Pause, Check, Music, ListMusic } from "lucide-react";

interface MusicSelectionProps {
    onContinue: (musicIds: string[]) => void;
    onBack: () => void;
}

export function MusicSelection({ onContinue, onBack }: MusicSelectionProps) {
    const [selectedMusic, setSelectedMusic] = useState<string[]>([]);
    const [playingMusic, setPlayingMusic] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const toggleMusic = (id: string) => {
        setSelectedMusic((prev) =>
            prev.includes(id)
                ? prev.filter(m => m !== id)
                : [...prev, id]
        );
    };

    const handlePlayPreview = (url: string, id: string) => {
        if (playingMusic === id) {
            audioRef.current?.pause();
            setPlayingMusic(null);
            return;
        }

        if (audioRef.current) {
            audioRef.current.src = url;
            audioRef.current.play().catch(err => console.error("Audio play failed:", err));
            setPlayingMusic(id);
        }
    };

    const handleAudioEnd = () => {
        setPlayingMusic(null);
    };

    return (
        <div className="w-full animate-in fade-in slide-in-from-right-8 duration-700 ease-out">
            <div className="mb-10">
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Background Music</h2>
                <p className="text-gray-500 text-lg font-medium">Select one or more tracks to set the mood of your videos.</p>
            </div>

            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <ListMusic className="h-4 w-4 text-blue-500" />
                        Available Tracks
                        <span className="ml-2 px-2.5 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] tracking-normal font-bold">
                            {selectedMusic.length} Selected
                        </span>
                    </h3>
                    <button
                        onClick={() => setSelectedMusic([])}
                        className="text-[10px] uppercase tracking-widest font-bold text-gray-400 hover:text-red-500 transition-colors"
                    >
                        Clear All
                    </button>
                </div>

                <div className="space-y-4 max-h-[550px] overflow-y-auto pr-4 custom-scrollbar rounded-[2rem] border border-gray-100 bg-gray-50/40 p-6 shadow-inner">
                    {backgroundMusic.map((track) => (
                        <div
                            key={track.id}
                            onClick={() => toggleMusic(track.id)}
                            className={cn(
                                "relative flex items-center justify-between p-5 rounded-2xl border-2 transition-all duration-300 cursor-pointer group",
                                selectedMusic.includes(track.id)
                                    ? "bg-blue-50/50 border-blue-600 ring-4 ring-blue-50/50 shadow-lg shadow-blue-100/50"
                                    : "bg-white border-transparent hover:border-blue-200 shadow-sm hover:shadow-md"
                            )}
                        >
                            <div className="flex items-center gap-5 flex-1">
                                <div className={cn(
                                    "h-12 w-12 rounded-xl flex items-center justify-center transition-all duration-300",
                                    selectedMusic.includes(track.id) ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400"
                                )}>
                                    <Music className="h-6 w-6" />
                                </div>
                                <div>
                                    <h4 className={cn(
                                        "font-bold text-lg tracking-tight transition-colors",
                                        selectedMusic.includes(track.id) ? "text-blue-900" : "text-gray-900"
                                    )}>
                                        {track.name}
                                    </h4>
                                    <p className="text-sm text-gray-500 font-medium line-clamp-1">
                                        {track.description}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handlePlayPreview(track.url, track.id);
                                    }}
                                    className={cn(
                                        "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg shrink-0",
                                        playingMusic === track.id
                                            ? "bg-gray-900 text-white animate-pulse"
                                            : "bg-white text-blue-600 hover:bg-blue-50 border border-gray-100"
                                    )}
                                >
                                    {playingMusic === track.id ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 ml-1 fill-current" />}
                                </button>
                                <div className={cn(
                                    "h-8 w-8 rounded-full flex items-center justify-center transition-all duration-300",
                                    selectedMusic.includes(track.id) ? "bg-blue-600 text-white scale-100" : "bg-gray-100 text-transparent scale-75"
                                )}>
                                    <Check className="h-5 w-5 stroke-[3px]" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <audio
                ref={audioRef}
                onEnded={handleAudioEnd}
                className="hidden"
            />

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
                    disabled={selectedMusic.length === 0}
                    onClick={() => onContinue(selectedMusic)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-7 rounded-2xl text-lg font-extrabold shadow-xl shadow-blue-200 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 group"
                >
                    Continue Selection
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
            </div>
        </div>
    );
}

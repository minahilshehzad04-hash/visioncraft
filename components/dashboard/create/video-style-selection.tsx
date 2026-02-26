"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { videoStyles } from "@/lib/constants";
import { ArrowRight, ArrowLeft, Check, Palette } from "lucide-react";
import Image from "next/image";

interface VideoStyleSelectionProps {
    onContinue: (styleId: string) => void;
    onBack: () => void;
}

export function VideoStyleSelection({ onContinue, onBack }: VideoStyleSelectionProps) {
    const [selectedStyle, setSelectedStyle] = useState<string | null>(null);

    return (
        <div className="w-full animate-in fade-in slide-in-from-right-8 duration-700 ease-out">
            <div className="mb-10">
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Video Style</h2>
                <p className="text-gray-500 text-lg font-medium">Choose the visual style for your AI-generated video.</p>
            </div>

            <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                    <Palette className="h-4 w-4 text-blue-500" />
                    Available Styles
                    {selectedStyle && (
                        <span className="ml-2 px-2.5 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] tracking-normal font-bold lowercase">
                            {videoStyles.find(s => s.id === selectedStyle)?.name}
                        </span>
                    )}
                </h3>

                {/* Horizontal Scroll Container */}
                <div className="overflow-x-auto pb-6 -mx-2 px-2 custom-scrollbar">
                    <div className="flex gap-6 w-max">
                        {videoStyles.map((style) => (
                            <div
                                key={style.id}
                                onClick={() => setSelectedStyle(style.id)}
                                className={cn(
                                    "relative flex-shrink-0 w-[220px] rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 group",
                                    selectedStyle === style.id
                                        ? "ring-4 ring-blue-600 ring-offset-4 shadow-2xl shadow-blue-200/50 scale-[1.02]"
                                        : "ring-1 ring-gray-100 shadow-md hover:shadow-xl hover:scale-[1.02] hover:ring-blue-200"
                                )}
                            >
                                {/* 9:16 Aspect Ratio Image */}
                                <div className="relative aspect-[9/16] w-full">
                                    <Image
                                        src={style.image}
                                        alt={style.name}
                                        fill
                                        className="object-cover"
                                        sizes="220px"
                                    />

                                    {/* Gradient Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                                    {/* Selected Check */}
                                    {selectedStyle === style.id && (
                                        <div className="absolute top-3 right-3 bg-blue-600 rounded-full p-1.5 shadow-lg animate-in zoom-in duration-200">
                                            <Check className="h-4 w-4 text-white stroke-[3px]" />
                                        </div>
                                    )}

                                    {/* Label at Bottom */}
                                    <div className="absolute bottom-0 left-0 right-0 p-4">
                                        <h4 className="text-white font-extrabold text-lg tracking-tight drop-shadow-lg">
                                            {style.name}
                                        </h4>
                                        <p className="text-white/70 text-xs font-medium mt-1 line-clamp-2 leading-relaxed">
                                            {style.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
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
                    disabled={!selectedStyle}
                    onClick={() => selectedStyle && onContinue(selectedStyle)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-7 rounded-2xl text-lg font-extrabold shadow-xl shadow-blue-200 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 group"
                >
                    Continue
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
            </div>
        </div>
    );
}

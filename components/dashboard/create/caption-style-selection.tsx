"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { captionStyles, type CaptionStyle } from "@/lib/caption-styles";
import { ArrowRight, ArrowLeft, Type, Check } from "lucide-react";

interface CaptionStyleSelectionProps {
    onContinue: (captionStyleId: string) => void;
    onBack: () => void;
}

/**
 * Animated Caption Preview
 * Renders the preview text word-by-word with the specified animation.
 * Loops automatically for a continuous preview effect.
 */
function CaptionPreview({ style }: { style: CaptionStyle }) {
    const words = style.previewText.split(" ");
    const [visibleCount, setVisibleCount] = useState(0);

    const totalDuration = words.length * style.staggerDelay + style.animationDuration + 1200;

    const resetAndPlay = useCallback(() => {
        setVisibleCount(0);
        let i = 0;
        const interval = setInterval(() => {
            i++;
            setVisibleCount(i);
            if (i >= words.length) {
                clearInterval(interval);
            }
        }, style.staggerDelay);
        return interval;
    }, [words.length, style.staggerDelay]);

    useEffect(() => {
        const interval = resetAndPlay();
        const loopTimer = setInterval(() => {
            clearInterval(interval);
            resetAndPlay();
        }, totalDuration);

        return () => {
            clearInterval(interval);
            clearInterval(loopTimer);
        };
    }, [resetAndPlay, totalDuration]);

    return (
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 min-h-[80px] px-4">
            {words.map((word, i) => (
                <span
                    key={`${word}-${i}`}
                    style={{
                        fontSize: style.fontSize * 0.85,
                        fontWeight: style.fontWeight,
                        fontFamily: style.fontFamily,
                        color: style.color,
                        WebkitTextStroke: style.textStroke,
                        textShadow: style.textShadow,
                        background: style.wordBackground,
                        borderRadius: style.wordBorderRadius,
                        padding: style.wordPadding,
                        opacity: i < visibleCount ? 1 : 0,
                        animation: i < visibleCount
                            ? `${style.animationName} ${style.animationDuration}ms ease-out forwards`
                            : "none",
                        display: "inline-block",
                    }}
                >
                    {word}
                </span>
            ))}
        </div>
    );
}

export function CaptionStyleSelection({ onContinue, onBack }: CaptionStyleSelectionProps) {
    const [selectedStyle, setSelectedStyle] = useState<string | null>(null);

    return (
        <div className="w-full animate-in fade-in slide-in-from-right-8 duration-700 ease-out">
            <div className="mb-10">
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Caption Style</h2>
                <p className="text-gray-500 text-lg font-medium">Choose how your captions will animate in the video.</p>
            </div>

            <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Type className="h-4 w-4 text-blue-500" />
                    Caption Animations
                    {selectedStyle && (
                        <span className="ml-2 px-2.5 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] tracking-normal font-bold">
                            {captionStyles.find(s => s.id === selectedStyle)?.name}
                        </span>
                    )}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-h-[550px] overflow-y-auto pr-2 custom-scrollbar">
                    {captionStyles.map((style) => (
                        <div
                            key={style.id}
                            onClick={() => setSelectedStyle(style.id)}
                            className={cn(
                                "relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 group",
                                selectedStyle === style.id
                                    ? "ring-4 ring-blue-600 ring-offset-2 shadow-2xl shadow-blue-200/50 scale-[1.02]"
                                    : "ring-1 ring-gray-200 shadow-md hover:shadow-xl hover:scale-[1.01] hover:ring-blue-200"
                            )}
                        >
                            {/* Dark preview area */}
                            <div className="bg-gray-900 rounded-t-2xl h-[160px] flex items-center justify-center overflow-hidden relative">
                                <CaptionPreview style={style} />

                                {/* Selected Check */}
                                {selectedStyle === style.id && (
                                    <div className="absolute top-3 right-3 bg-blue-600 rounded-full p-1.5 shadow-lg animate-in zoom-in duration-200">
                                        <Check className="h-4 w-4 text-white stroke-[3px]" />
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className={cn(
                                "p-4 transition-colors duration-300",
                                selectedStyle === style.id ? "bg-blue-50" : "bg-white"
                            )}>
                                <h4 className={cn(
                                    "font-bold text-base tracking-tight",
                                    selectedStyle === style.id ? "text-blue-900" : "text-gray-900"
                                )}>
                                    {style.name}
                                </h4>
                                <p className="text-sm text-gray-500 font-medium mt-0.5">
                                    {style.description}
                                </p>
                            </div>
                        </div>
                    ))}
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

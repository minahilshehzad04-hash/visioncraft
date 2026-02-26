"use client";

import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { languages, deepgramVoices, fonadalabVoices } from "@/lib/constants";
import { ArrowRight, ArrowLeft, Play, Pause, Check, Globe } from "lucide-react";

interface LanguageVoiceSelectionProps {
    onContinue: (data: {
        language: string;
        voice: string;
        modelName: string;
        modelLangCode: string;
    }) => void;
    onBack: () => void;
}

export function LanguageVoiceSelection({ onContinue, onBack }: LanguageVoiceSelectionProps) {
    const [selectedLanguage, setSelectedLanguage] = useState(languages[0]);
    const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
    const [playingVoice, setPlayingVoice] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const getVoices = () => {
        return selectedLanguage.modelName === "deepgram"
            ? deepgramVoices
            : fonadalabVoices;
    };

    const currentVoices = getVoices();

    const handlePlayPreview = (previewPath: string, voiceName: string) => {
        if (playingVoice === voiceName) {
            audioRef.current?.pause();
            setPlayingVoice(null);
            return;
        }

        if (audioRef.current) {
            audioRef.current.src = previewPath;
            audioRef.current.play().catch(err => console.error("Audio play failed:", err));
            setPlayingVoice(voiceName);
        }
    };

    const handleAudioEnd = () => {
        setPlayingVoice(null);
    };

    return (
        <div className="w-full animate-in fade-in slide-in-from-right-8 duration-700 ease-out">
            <div className="mb-10">
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Language & Voice</h2>
                <p className="text-gray-500 text-lg font-medium">Configure the perfect narrative tone for your series.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
                {/* Language Selection Sidebar */}
                <div className="lg:col-span-1 border-r border-gray-100 pr-0 lg:pr-8 space-y-6">
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Globe className="h-4 w-4 text-blue-500" />
                            Target Language
                        </h3>
                        <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {languages.map((lang) => (
                                <button
                                    key={lang.language}
                                    onClick={() => {
                                        setSelectedLanguage(lang);
                                        setSelectedVoice(null);
                                    }}
                                    className={cn(
                                        "w-full flex items-center justify-between p-3.5 rounded-xl transition-all duration-300 group text-left",
                                        selectedLanguage.language === lang.language
                                            ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                                            : "bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border border-transparent hover:border-blue-100"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl transform group-hover:scale-110 transition-transform">{lang.countryFlag}</span>
                                        <span className="font-semibold text-sm">
                                            {lang.language}
                                        </span>
                                    </div>
                                    {selectedLanguage.language === lang.language && (
                                        <div className="bg-white/20 rounded-full p-1">
                                            <Check className="h-4 w-4 text-white" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Voice Selection Main Area */}
                <div className="lg:col-span-3">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            Available Voices
                            <span className="ml-2 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full lowercase text-[10px] tracking-normal font-bold">
                                {selectedLanguage.language} • {selectedLanguage.modelName}
                            </span>
                        </h3>
                    </div>

                    <div className="h-[520px] overflow-y-auto pr-4 custom-scrollbar rounded-[2rem] border border-gray-100 bg-gray-50/40 p-6 shadow-inner">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {currentVoices.map((voice) => (
                                <div
                                    key={voice.modelName}
                                    onClick={() => setSelectedVoice(voice.modelName)}
                                    className={cn(
                                        "relative p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer group bg-white",
                                        selectedVoice === voice.modelName
                                            ? "border-blue-600 ring-4 ring-blue-50 shadow-xl shadow-blue-100/50 translate-y-[-2px]"
                                            : "border-gray-50 hover:border-blue-200 shadow-sm hover:shadow-md hover:translate-y-[-2px]"
                                    )}
                                >
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-gray-900 text-lg tracking-tight capitalize group-hover:text-blue-600 transition-colors">
                                                    {voice.modelName.replace(/-/g, ' ')}
                                                </h4>
                                            </div>
                                            <div className="flex flex-wrap gap-2 mt-2.5">
                                                <span className={cn(
                                                    "text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-lg font-bold",
                                                    voice.gender === "male"
                                                        ? "bg-blue-50 text-blue-700 border border-blue-100"
                                                        : "bg-rose-50 text-rose-700 border border-rose-100"
                                                )}>
                                                    {voice.gender}
                                                </span>
                                                <span className="text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-lg font-bold bg-gray-50 text-gray-500 border border-gray-100">
                                                    {voice.model}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handlePlayPreview(voice.preview, voice.modelName);
                                            }}
                                            className={cn(
                                                "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg shrink-0",
                                                playingVoice === voice.modelName
                                                    ? "bg-gray-900 text-white animate-pulse"
                                                    : "bg-blue-600 text-white hover:bg-blue-700 hover:scale-105"
                                            )}
                                        >
                                            {playingVoice === voice.modelName ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 ml-1 fill-current" />}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
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
                    disabled={!selectedVoice}
                    onClick={() => selectedVoice && onContinue({
                        language: selectedLanguage.language,
                        voice: selectedVoice,
                        modelName: selectedLanguage.modelName,
                        modelLangCode: selectedLanguage.modelLangCode
                    })}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-7 rounded-2xl text-lg font-extrabold shadow-xl shadow-blue-200 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 group"
                >
                    Proceed to Step 3
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
            </div>
        </div>
    );
}

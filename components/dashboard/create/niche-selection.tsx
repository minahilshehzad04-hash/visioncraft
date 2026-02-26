"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowRight, Ghost, Brain, Sun, Sparkles, BookOpen, Smile, Cpu, ChefHat, Dumbbell, Landmark } from "lucide-react";

interface Niche {
    id: string;
    title: string;
    description: string;
    icon: any;
}

const availableNiches: Niche[] = [
    { id: "scary", title: "Scary Stories", description: "Uncover urban legends and chilling horror tales.", icon: Ghost },
    { id: "motivational", title: "Motivational", description: "Inspiring speeches and quotes to fuel your ambition.", icon: Sun },
    { id: "facts", title: "Fun Facts", description: "Mind-blowing trivia and strange but true stories.", icon: Brain },
    { id: "bedtime", title: "Bedtime Stories", description: "Soothing tales for a peaceful night's sleep.", icon: BookOpen },
    { id: "growth", title: "Self Growth", description: "Tips and strategies for personal development.", icon: Sparkles },
    { id: "jokes", title: "Daily Jokes", description: "Laugh out loud with hilarious comedy snippets.", icon: Smile },
    { id: "ai-tech", title: "AI & Tech", description: "Latest in artificial intelligence and tech innovation.", icon: Cpu },
    { id: "cooking", title: "Cooking Recipes", description: "Quick and delicious recipes for food lovers.", icon: ChefHat },
    { id: "fitness", title: "Fitness Tips", description: "Workout routines and health advice to stay fit.", icon: Dumbbell },
    { id: "history", title: "History Unveiled", description: "Fascinating stories from ancient and modern history.", icon: Landmark },
];

interface NicheSelectionProps {
    onContinue: (niche: string) => void;
}

export function NicheSelection({ onContinue }: NicheSelectionProps) {
    const [activeTab, setActiveTab] = useState<"available" | "custom">("available");
    const [selectedNiche, setSelectedNiche] = useState<string | null>(null);
    const [customNiche, setCustomNiche] = useState("");

    const handleContinue = () => {
        if (activeTab === "available" && selectedNiche) {
            onContinue(selectedNiche);
        } else if (activeTab === "custom" && customNiche.trim()) {
            onContinue(customNiche.trim());
        }
    };

    const isContinueDisabled =
        (activeTab === "available" && !selectedNiche) ||
        (activeTab === "custom" && !customNiche.trim());

    return (
        <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Select your niche</h2>
                <p className="text-gray-500 text-lg">Choose a style that best fits your video series.</p>
            </div>

            {/* Tabs */}
            <div className="flex bg-gray-100 p-1.5 rounded-xl mb-8 w-fit">
                <button
                    onClick={() => setActiveTab("available")}
                    className={cn(
                        "px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200",
                        activeTab === "available"
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                    )}
                >
                    Available Niche
                </button>
                <button
                    onClick={() => setActiveTab("custom")}
                    className={cn(
                        "px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200",
                        activeTab === "custom"
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                    )}
                >
                    Custom Niche
                </button>
            </div>

            {/* Content */}
            {activeTab === "available" ? (
                <div className="h-[400px] overflow-y-auto pr-4 custom-scrollbar rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {availableNiches.map((niche) => {
                            const Icon = niche.icon;
                            const isSelected = selectedNiche === niche.id;

                            return (
                                <div
                                    key={niche.id}
                                    onClick={() => setSelectedNiche(niche.id)}
                                    className={cn(
                                        "cursor-pointer p-5 rounded-xl border-2 transition-all duration-200",
                                        isSelected
                                            ? "bg-blue-50 border-blue-600 ring-4 ring-blue-50"
                                            : "bg-white border-gray-200 hover:border-blue-300 shadow-sm"
                                    )}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={cn(
                                            "p-3 rounded-lg",
                                            isSelected ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-600"
                                        )}>
                                            <Icon className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">{niche.title}</h3>
                                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{niche.description}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="h-[400px] flex flex-col p-8 bg-white border border-gray-200 rounded-xl shadow-sm text-left">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                            <Sparkles className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Custom Niche</h3>
                            <p className="text-sm text-gray-500">Describe the specific niche or topic for your AI videos.</p>
                        </div>
                    </div>

                    <textarea
                        value={customNiche}
                        onChange={(e) => setCustomNiche(e.target.value)}
                        placeholder="e.g., Unsolved space mysteries, Ancient Roman engineering, Quick vegan recipes for beginners..."
                        className="flex-1 w-full p-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all resize-none text-gray-900 placeholder:text-gray-400"
                    />
                </div>
            )}

            {/* Actions */}
            <div className="mt-12 flex justify-end">
                <Button
                    disabled={isContinueDisabled}
                    onClick={handleContinue}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 rounded-xl text-lg font-bold group"
                >
                    Continue
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
            </div>
        </div>
    );
}

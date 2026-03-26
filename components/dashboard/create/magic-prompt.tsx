"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";

interface MagicPromptProps {
    onMagicComplete: (config: any) => void;
}

export function MagicPrompt({ onMagicComplete }: MagicPromptProps) {
    const [prompt, setPrompt] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleMagicGenerate = async () => {
        if (!prompt.trim()) {
            toast.error("Please enter a prompt first!");
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch("/api/ai/expand-prompt", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt }),
            });

            if (!response.ok) {
                throw new Error("Failed to expand prompt");
            }

            const config = await response.json();
            toast.success("AI Magic applied! ✨ Configured your video.");
            onMagicComplete(config);
        } catch (error: any) {
            console.error("Magic Error:", error);
            toast.error("AI Magic failed: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-[400px] flex flex-col p-8 bg-white border border-gray-200 rounded-2xl shadow-sm text-left animate-in fade-in zoom-in duration-300">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shadow-inner">
                    <Sparkles className="h-6 w-6" />
                </div>
                <div>
                    <h3 className="text-xl font-extrabold text-gray-900 tracking-tight">AI Magic Prompt</h3>
                    <p className="text-sm text-gray-500 font-medium">Describe your video in one sentence, and we'll configure everything for you.</p>
                </div>
            </div>

            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., Create a 30-second motivational video about overcoming failure with cinematic style and deep voiceover..."
                className="flex-1 w-full p-5 rounded-2xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all resize-none text-gray-900 placeholder:text-gray-400 font-medium leading-relaxed"
            />

            <div className="mt-6 flex justify-center">
                <Button
                    onClick={handleMagicGenerate}
                    disabled={isLoading || !prompt.trim()}
                    className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white px-10 py-7 rounded-2xl text-lg font-bold shadow-xl shadow-indigo-200 flex items-center gap-3 transition-all hover:scale-[1.03] active:scale-[0.97]"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="h-6 w-6 animate-spin" />
                            Brewing Magic...
                        </>
                    ) : (
                        <>
                            <Wand2 className="h-6 w-6" />
                            Apply Magic
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}

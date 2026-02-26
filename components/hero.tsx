"use client";

import { Button } from "@/components/ui/button";
import { PlayCircle, ArrowRight } from "lucide-react";
import Image from "next/image";
import { useAuth, SignInButton } from "@clerk/nextjs";
import Link from "next/link";

export function Hero() {
    const { isSignedIn } = useAuth();
    return (
        <section className="relative overflow-hidden bg-white pt-16 pb-24 dark:bg-black md:pt-24 md:pb-32">
            <div className="container relative z-10 mx-auto px-4 md:px-6">
                <div className="flex flex-col items-center text-center">
                    <div className="mb-6 inline-flex items-center rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-900/30 dark:text-indigo-400">
                        <span className="mr-2">✨</span>
                        AI-Powered Video Generation is here
                    </div>
                    <h1 className="max-w-4xl text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-6xl md:text-7xl">
                        Transform Ideas into <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Viral Shorts</span> in Seconds
                    </h1>
                    <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-400 md:text-xl">
                        The ultimate AI video generator and auto-scheduler for YouTube, Instagram, and TikTok. Grow your audience on autopilot while you sleep.
                    </p>
                    <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
                        {isSignedIn ? (
                            <Button asChild size="lg" className="h-14 rounded-full bg-indigo-600 px-8 text-lg hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600">
                                <Link href="/dashboard">Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" /></Link>
                            </Button>
                        ) : (
                            <SignInButton mode="modal">
                                <Button size="lg" className="h-14 rounded-full bg-indigo-600 px-8 text-lg hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600">
                                    Start Creating for Free <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </SignInButton>
                        )}
                        <Button size="lg" variant="outline" className="h-14 rounded-full border-zinc-200 px-8 text-lg dark:border-white/10 dark:hover:bg-white/5">
                            <PlayCircle className="mr-2 h-5 w-5" /> Watch Demo
                        </Button>
                    </div>
                </div>
            </div>
            {/* Decorative elements */}
            <div className="absolute top-0 left-1/2 -z-10 h-[1000px] w-[1000px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-50/50 blur-3xl dark:bg-indigo-900/10" />
        </section>
    );
}

"use client";

import Link from "next/link";
import { navItems } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Video } from "lucide-react";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export function Navbar() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-zinc-200/50 bg-white/80 backdrop-blur-md dark:border-white/10 dark:bg-black/80">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
                <Link href="/" className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 dark:bg-indigo-500">
                        <Video className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                        VisionCraft
                    </span>
                </Link>
                <nav className="hidden md:flex md:gap-8">
                    {navItems.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className="text-sm font-medium text-zinc-600 transition-colors hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400"
                        >
                            {item.name}
                        </Link>
                    ))}
                </nav>
                <div className="flex items-center gap-4">
                    <SignedOut>
                        <Link
                            href="/sign-in"
                            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                        >
                            Log in
                        </Link>
                        <Button asChild className="rounded-full bg-indigo-600 px-6 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600">
                            <Link href="/sign-up">Get Started</Link>
                        </Button>
                    </SignedOut>
                    <SignedIn>
                        <Link
                            href="/dashboard"
                            className="mr-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                        >
                            Dashboard
                        </Link>
                        <UserButton afterSignOutUrl="/" />
                    </SignedIn>
                </div>
            </div>
        </header>
    );
}

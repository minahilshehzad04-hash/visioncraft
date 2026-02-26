import Link from "next/link";
import { Video, Youtube, Instagram, Twitter } from "lucide-react";

export function Footer() {
    return (
        <footer className="w-full border-t border-zinc-200 bg-zinc-50 py-12 dark:border-white/10 dark:bg-black">
            <div className="container mx-auto px-4 md:px-6">
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                    <div className="flex flex-col gap-4">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 dark:bg-indigo-500">
                                <Video className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                                VisionCraft
                            </span>
                        </Link>
                        <p className="max-w-xs text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                            Transform your ideas into viral short videos in seconds with our AI engine. Schedule and automate your content across YouTube, Instagram, and TikTok.
                        </p>
                        <div className="flex gap-4">
                            <Link href="#" className="text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                                <Youtube className="h-5 w-5" />
                            </Link>
                            <Link href="#" className="text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                                <Instagram className="h-5 w-5" />
                            </Link>
                            <Link href="#" className="text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                                <Twitter className="h-5 w-5" />
                            </Link>
                        </div>
                    </div>
                    <div>
                        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-900 dark:text-white">Product</h3>
                        <ul className="flex flex-col gap-2">
                            <li><Link href="#features" className="text-sm text-zinc-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400">AI Video Gen</Link></li>
                            <li><Link href="#how-it-works" className="text-sm text-zinc-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400">Auto-Scheduler</Link></li>
                            <li><Link href="#pricing" className="text-sm text-zinc-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400">Pricing</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-900 dark:text-white">Company</h3>
                        <ul className="flex flex-col gap-2">
                            <li><Link href="#" className="text-sm text-zinc-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400">About Us</Link></li>
                            <li><Link href="#" className="text-sm text-zinc-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400">Privacy Policy</Link></li>
                            <li><Link href="#" className="text-sm text-zinc-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400">Terms of Service</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-900 dark:text-white">Contact</h3>
                        <ul className="flex flex-col gap-2">
                            <li><Link href="mailto:support@visioncraft.ai" className="text-sm text-zinc-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400">support@visioncraft.ai</Link></li>
                            <li className="text-sm text-zinc-600 dark:text-zinc-400">Based in Silicon Valley, CA</li>
                        </ul>
                    </div>
                </div>
                <div className="mt-12 border-t border-zinc-200 pt-8 dark:border-white/10">
                    <p className="text-center text-xs text-zinc-500 dark:text-zinc-500">
                        © {new Date().getFullYear()} VisionCraft AI Inc. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}

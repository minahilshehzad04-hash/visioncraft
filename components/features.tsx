import {
    Zap,
    Calendar,
    Share2,
    Mail,
    BarChart3,
    ShieldCheck
} from "lucide-react";

const features = [
    {
        title: "AI Video Generation",
        description: "Turn scripts or prompts into high-quality vertical videos with realistic AI avatars and voiceovers.",
        icon: Zap,
        color: "text-amber-500",
        bg: "bg-amber-50"
    },
    {
        title: "Auto-Scheduling",
        description: "Connect your YouTube, Instagram, and TikTok accounts to automatically post videos at peak times.",
        icon: Calendar,
        color: "text-blue-500",
        bg: "bg-blue-50"
    },
    {
        title: "Cross-Platform Sync",
        description: "One-click distribution across all major short-form video platforms with platform-specific optimizations.",
        icon: Share2,
        color: "text-purple-500",
        bg: "bg-purple-50"
    },
    {
        title: "Email Automation",
        description: "Nurture your audience with automated email sequences triggered by video engagement.",
        icon: Mail,
        color: "text-rose-500",
        bg: "bg-rose-50"
    },
    {
        title: "Smart Analytics",
        description: "Track performance across all platforms in one unified dashboard with actionable insights.",
        icon: BarChart3,
        color: "text-emerald-500",
        bg: "bg-emerald-50"
    },
    {
        title: "Brand Safety",
        description: "Enterprise-grade security and content moderation to ensure your brand's reputation is protected.",
        icon: ShieldCheck,
        color: "text-indigo-500",
        bg: "bg-indigo-50"
    }
];

export function Features() {
    return (
        <section id="features" className="bg-zinc-50 py-24 dark:bg-zinc-950">
            <div className="container mx-auto px-4 md:px-6">
                <div className="mb-16 flex flex-col items-center text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-5xl">
                        Everything you need for content scale
                    </h2>
                    <p className="mt-4 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
                        VisionCraft combines powerful AI generation with smart automation to handle your entire content workflow.
                    </p>
                </div>
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {features.map((feature) => (
                        <div
                            key={feature.title}
                            className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-8 transition-all hover:border-indigo-500/50 hover:shadow-xl dark:border-white/10 dark:bg-black"
                        >
                            <div className={`mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.bg} dark:bg-white/5`}>
                                <feature.icon className={`h-6 w-6 ${feature.color}`} />
                            </div>
                            <h3 className="mb-3 text-xl font-bold text-zinc-900 dark:text-white">
                                {feature.title}
                            </h3>
                            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

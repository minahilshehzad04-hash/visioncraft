"use client";

import { useState, useEffect } from "react";
import {
    Youtube,
    Instagram,
    Music2,
    Trash2,
    AlertTriangle,
    CheckCircle2,
    ArrowRight,
    CircleDashed,
    Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
    getSocialConnections,
    connectSocialAccount,
    disconnectSocialAccount,
    deleteUserAccount
} from "@/actions/settings";
import { cn } from "@/lib/utils";

const PLATFORMS = [
    {
        id: "youtube",
        name: "YouTube",
        icon: Youtube,
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-100"
    },
    {
        id: "instagram",
        name: "Instagram",
        icon: Instagram,
        color: "text-pink-600",
        bgColor: "bg-pink-50",
        borderColor: "border-pink-100"
    },
    {
        id: "tiktok",
        name: "TikTok",
        icon: Music2,
        color: "text-black",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-100"
    }
];

import { useUser } from "@clerk/nextjs";
import { getUserPlan, PLAN_LIMITS } from "@/lib/plans";
import { UpgradeDialog } from "@/components/dashboard/upgrade-dialog";

export default function SettingsPage() {
    const { user, isLoaded } = useUser();
    const [connections, setConnections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState<string | null>(null);
    const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
    const [planNeeded, setPlanNeeded] = useState<"Basic" | "Advanced">("Basic");

    const plan = getUserPlan(user);
    const limits = PLAN_LIMITS[plan];

    useEffect(() => {
        loadConnections();

        // Check for success/error from OAuth redirect
        const params = new URLSearchParams(window.location.search);
        const success = params.get("success");
        const error = params.get("error");

        if (success === "instagram_connected") {
            toast.success("Instagram account connected successfully!");
            // Clean up URL
            window.history.replaceState({}, "", "/dashboard/settings");
        } else if (success === "youtube_connected") {
            toast.success("YouTube channel connected successfully!");
            window.history.replaceState({}, "", "/dashboard/settings");
        } else if (success === "tiktok_connected") {
            toast.success("TikTok account connected successfully!");
            window.history.replaceState({}, "", "/dashboard/settings");
        } else if (error) {
            toast.error(decodeURIComponent(error));
            window.history.replaceState({}, "", "/dashboard/settings");
        }
    }, []);

    const loadConnections = async () => {
        setLoading(true);
        const res = await getSocialConnections();
        if (res.success) {
            setConnections(res.data || []);
        }
        setLoading(false);
    };

    const handleConnect = async (platform: string) => {
        if (!limits.allowedPlatforms.includes(platform.toLowerCase())) {
            setPlanNeeded(platform === "youtube" ? "Basic" : "Advanced");
            setIsUpgradeOpen(true);
            return;
        }

        if (platform === "youtube") {
            setConnecting(platform);
            try {
                const { getYoutubeAuthUrl } = await import("@/actions/youtube");
                const res = await getYoutubeAuthUrl();
                if (res.success && res.url) {
                    window.location.href = res.url;
                    return;
                }
            } catch (err: any) {
                toast.error(err.message || "Failed to initiate YouTube connection");
                setConnecting(null);
                return;
            }
        }

        if (platform === "instagram") {
            // Let's keep the option for actual Instagram if they ever click it, 
            // but previously users asked for Instagram on Youtube button.
            // Now we've separated them correctly.
            try {
                const { getInstagramAuthUrl } = await import("@/actions/instagram");
                const res = await getInstagramAuthUrl();
                if (res.success && res.url) {
                    window.location.href = res.url;
                    return;
                }
            } catch (err: any) {
                toast.error(err.message || "Failed to initiate Instagram connection");
                return;
            }
        }

        if (platform === "tiktok") {
            setConnecting(platform);
            try {
                const { getTikTokAuthUrl } = await import("@/actions/tiktok");
                const res = await getTikTokAuthUrl();
                if (res.success && res.url) {
                    window.location.href = res.url;
                    return;
                }
            } catch (err: any) {
                toast.error(err.message || "Failed to initiate TikTok connection");
                setConnecting(null);
                return;
            }
        }

        setConnecting(platform);
        const res = await connectSocialAccount(platform);
        if (res.success) {
            toast.success(`Successfully connected to ${platform}!`);
            loadConnections();
        } else {
            toast.error(res.error || `Failed to connect to ${platform}`);
        }
        setConnecting(null);
    };

    const handleDisconnect = async (id: string, platform: string) => {
        const res = await disconnectSocialAccount(id);
        if (res.success) {
            toast.success(`Disconnected from ${platform}`);
            loadConnections();
        } else {
            toast.error(res.error || "Failed to disconnect");
        }
    };

    const handleDeleteAccount = async () => {
        const res = await deleteUserAccount();
        if (res.success) {
            toast.success("Account deleted successfully. Logging out...");
            window.location.href = "/";
        } else {
            toast.error(res.error || "Failed to delete account");
        }
    };

    return (
        <div className="max-w-5xl mx-auto py-10 px-6 space-y-12">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Settings</h1>
                <p className="text-gray-500 mt-2 text-lg">Manage your account preferences and social connections.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Social Connections */}
                <Card className="border-gray-100 shadow-sm rounded-[2rem] overflow-hidden">
                    <CardHeader className="bg-gray-50/50 border-b border-gray-100 p-8">
                        <div className="flex items-center gap-3 mb-1">
                            <Shield className="h-6 w-6 text-blue-600" />
                            <CardTitle className="text-2xl font-bold">Social Connections</CardTitle>
                        </div>
                        <CardDescription className="text-gray-500 text-base">
                            Connect your accounts to enable automated video publishing.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        {PLATFORMS.map((platform) => {
                            const connection = connections.find(c => c.platform === platform.id);
                            return (
                                <div key={platform.id} className={cn(
                                    "flex items-center justify-between p-5 rounded-2xl border transition-all duration-300",
                                    connection ? "bg-white border-gray-200" : cn(platform.bgColor, platform.borderColor)
                                )}>
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "h-12 w-12 rounded-xl flex items-center justify-center shadow-sm border border-white/50",
                                            platform.bgColor
                                        )}>
                                            <platform.icon className={cn("h-6 w-6", platform.color)} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-lg">{platform.name}</p>
                                            {connection ? (
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1.5 text-emerald-600 font-semibold text-sm">
                                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                                        Connected
                                                    </div>
                                                    {connection.account_name && (
                                                        <p className="text-gray-500 text-xs font-medium truncate max-w-[150px]">
                                                            {connection.account_name}
                                                        </p>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-gray-500 text-sm">Not connected</p>
                                            )}
                                        </div>
                                    </div>

                                    {connection ? (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDisconnect(connection.id, platform.name)}
                                            className="text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl font-bold"
                                        >
                                            Disconnect
                                        </Button>
                                    ) : (
                                        <div className="flex flex-col items-end gap-2">
                                            {!limits.allowedPlatforms.includes(platform.id) && (
                                                <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-bold border-blue-100 text-blue-600 bg-blue-50/50">
                                                    {platform.id === "youtube" ? "Basic+" : "Advanced"}
                                                </Badge>
                                            )}
                                            <Button
                                                size="sm"
                                                onClick={() => handleConnect(platform.id)}
                                                disabled={connecting === platform.id || loading}
                                                className={cn(
                                                    "rounded-xl font-bold px-6 shadow-md transition-all hover:scale-[1.05]",
                                                    !limits.allowedPlatforms.includes(platform.id)
                                                        ? "bg-gray-100 text-gray-400 hover:bg-gray-200"
                                                        : "bg-gray-900 hover:bg-blue-600 text-white"
                                                )}
                                            >
                                                {connecting === platform.id ? (
                                                    <CircleDashed className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        Connect
                                                        <ArrowRight className="ml-2 h-4 w-4" />
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        <UpgradeDialog
                            isOpen={isUpgradeOpen}
                            onOpenChange={setIsUpgradeOpen}
                            planNeeded={planNeeded}
                            description={`Connecting to ${planNeeded === "Advanced" ? "Instagram & TikTok" : "YouTube"} requires a ${planNeeded} plan.`}
                        />
                    </CardContent>
                </Card>

                {/* Profile Info Placeholder */}
                <Card className="border-gray-100 shadow-sm rounded-[2rem] overflow-hidden">
                    <CardHeader className="bg-gray-50/50 border-b border-gray-100 p-8">
                        <CardTitle className="text-2xl font-bold">Account Security</CardTitle>
                        <CardDescription className="text-gray-500 text-base">
                            Security settings and account protection.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 space-y-4">
                        <div className="p-6 bg-blue-50/50 border border-blue-100 rounded-2xl flex items-start gap-4 text-blue-800">
                            <Shield className="h-6 w-6 mt-0.5" />
                            <div>
                                <h4 className="font-bold">Two-Factor Authentication</h4>
                                <p className="text-sm opacity-80 mt-1">Manage your 2FA settings in the identity dashboard below.</p>
                                <Button variant="link" className="p-0 h-auto text-blue-700 font-bold mt-2">Manage Profile →</Button>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="px-8 pb-8 pt-0">
                        {/* This could link to Clerk's UserProfile component or similar */}
                    </CardFooter>
                </Card>
            </div>

            {/* Danger Zone */}
            <div className="pt-8">
                <div className="flex items-center gap-3 mb-6">
                    <AlertTriangle className="h-7 w-7 text-red-600" />
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Danger Zone</h2>
                </div>

                <Card className="border-red-100 bg-red-50/20 shadow-sm rounded-[2rem] overflow-hidden">
                    <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="space-y-1">
                            <h3 className="text-xl font-bold text-gray-900">Delete Account</h3>
                            <p className="text-gray-600">
                                Permanently delete your account and all associated data, including generated videos and series.
                            </p>
                            <p className="text-red-600 font-bold text-sm mt-1">This action cannot be undone.</p>
                        </div>

                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="destructive" className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-6 rounded-2xl shadow-lg shadow-red-200 transition-all hover:scale-[1.02]">
                                    <Trash2 className="mr-2 h-5 w-5" />
                                    Delete Account
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="rounded-[2rem] p-8 border-gray-100 shadow-2xl">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-extrabold text-gray-900 mb-2">Are you absolutely sure?</DialogTitle>
                                    <DialogDescription className="text-gray-500 text-lg leading-relaxed">
                                        This will permanently delete your **VisionCraft** account and remove all of your data from our servers.
                                        Your subscription will be canceled immediately.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3 my-4">
                                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                                    <p className="text-sm text-amber-800 font-medium leading-relaxed">
                                        Warning: This does not automatically delete your login account in our identity provider.
                                        Please contact support if you need full data scrub.
                                    </p>
                                </div>
                                <DialogFooter className="mt-8 flex gap-3">
                                    <Button variant="outline" className="flex-1 rounded-xl py-6 font-bold text-gray-600 border-gray-200">
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={handleDeleteAccount}
                                        className="flex-[1.5] rounded-xl py-6 font-bold bg-red-600 hover:bg-red-700"
                                    >
                                        Delete Permanently
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

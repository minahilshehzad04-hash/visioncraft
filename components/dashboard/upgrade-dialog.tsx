"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Zap, Shield, AlertCircle } from "lucide-react";
import Link from "next/link";

interface UpgradeDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    description?: string;
    planNeeded?: "Basic" | "Advanced";
}

export function UpgradeDialog({
    isOpen,
    onOpenChange,
    title = "Upgrade Your Plan",
    description = "You've reached the limit of your current plan. Upgrade to continue creating and connecting more platforms.",
    planNeeded = "Basic"
}: UpgradeDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px] rounded-[2rem] p-8 border-gray-100 shadow-2xl">
                <DialogHeader className="flex flex-col items-center text-center">
                    <div className="h-16 w-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                        <Zap className="h-8 w-8 text-blue-600 animate-pulse" />
                    </div>
                    <DialogTitle className="text-3xl font-black text-gray-900 tracking-tight">
                        {title}
                    </DialogTitle>
                    <DialogDescription className="text-gray-500 text-lg mt-4 leading-relaxed">
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <div className="my-8 p-5 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                    <div className="flex items-start gap-3">
                        <Shield className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                        <div>
                            <p className="font-bold text-gray-900">Unlock {planNeeded} Features</p>
                            <p className="text-sm text-gray-500 mt-1">
                                {planNeeded === "Basic"
                                    ? "Create up to 3 series and connect more accounts."
                                    : "Create unlimited series and connect Instagram & TikTok."}
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex flex-col sm:flex-row gap-3">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="flex-1 rounded-xl py-6 font-bold text-gray-600 border-gray-200"
                    >
                        Maybe Later
                    </Button>
                    <Link href="/dashboard/billing" className="flex-1">
                        <Button className="w-full rounded-xl py-6 font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-100 transition-all hover:scale-[1.02]">
                            View Plans
                        </Button>
                    </Link>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

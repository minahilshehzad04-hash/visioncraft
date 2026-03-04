"use client";

import { useUser, PricingTable } from "@clerk/nextjs";
import { Check, Zap, Shield, Rocket, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getUserPlan, PLAN_LIMITS } from "@/lib/plans";

export default function BillingPage() {
    const { user, isLoaded } = useUser();

    if (!isLoaded) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    const planKey = getUserPlan(user);
    const currentPlanName = PLAN_LIMITS[planKey].name;

    return (
        <div className="max-w-6xl mx-auto space-y-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 bg-white border border-gray-100 rounded-3xl shadow-sm">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-gray-900">Subscription Overview</h2>
                    <p className="text-gray-500">Manage your billing and subscription details.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-gray-500">Current Plan</p>
                        <p className="text-lg font-bold text-blue-600">{currentPlanName}</p>
                    </div>
                    <Button variant="outline" className="rounded-xl border-gray-200 gap-2 h-12 px-6 font-semibold">
                        <ExternalLink className="h-4 w-4" />
                        Billing Portal
                    </Button>
                </div>
            </div>

            <div className="text-center space-y-4">
                <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
                    Choose Your Plan
                </h1>
                <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                    Simple, transparent pricing to help you create stunning AI videos at scale.
                </p>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <PricingTable />
            </div>

            <div className="mt-16 bg-white border border-gray-100 rounded-3xl p-8 md:p-12 shadow-sm text-center max-w-4xl mx-auto space-y-6">
                <h3 className="text-2xl font-bold text-gray-900">Need more power?</h3>
                <p className="text-gray-600 text-lg">
                    Contact us for custom quotas, volume discounts, and white-labeled solutions tailored to your business needs.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                    <Button variant="outline" className="px-8 py-6 rounded-xl border-gray-200 hover:bg-gray-50 transition-colors">
                        View Full Features
                    </Button>
                    <Button className="px-8 py-6 rounded-xl bg-gray-900 hover:bg-black text-white transition-all shadow-md">
                        Talk to an Expert
                    </Button>
                </div>
            </div>
        </div>
    );
}

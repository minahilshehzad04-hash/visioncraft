export const PLAN_LIMITS = {
    free: {
        name: "Free",
        maxSeries: 1,
        allowedPlatforms: ["email", "youtube"],
    },
    basic: {
        name: "Basic",
        maxSeries: 3,
        allowedPlatforms: ["email", "youtube"],
    },
    advanced: {
        name: "Advanced",
        maxSeries: Infinity,
        allowedPlatforms: ["email", "youtube", "instagram", "tiktok"],
    },
};

export type PlanType = keyof typeof PLAN_LIMITS;

export function getUserPlan(user: any): PlanType {
    if (process.env.NODE_ENV === 'development') {
        return "advanced";
    }

    // Check Clerk publicMetadata or subscription data
    const plan = (user?.publicMetadata?.plan as string)?.toLowerCase();
    if (plan === "basic" || plan === "advanced") {
        return plan as PlanType;
    }
    return "free";
}

export function canConnectPlatform(plan: PlanType, platform: string) {
    const limits = PLAN_LIMITS[plan];
    return limits.allowedPlatforms.includes(platform.toLowerCase());
}

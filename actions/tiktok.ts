"use server";

import { auth } from "@clerk/nextjs/server";

export async function getTikTokAuthUrl() {
    const { userId } = await auth();
    if (!userId) {
        throw new Error("Unauthorized");
    }

    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const redirectUri = process.env.TIKTOK_REDIRECT_URI;

    if (!clientKey || !redirectUri) {
        throw new Error("TikTok API credentials (TIKTOK_CLIENT_KEY, TIKTOK_REDIRECT_URI) not configured in .env.local");
    }

    // TikTok v2 OAuth URL
    // Scopes for basic info and content posting
    const scopes = [
        "user.info.basic",
        "video.upload",
        "video.publish"
    ].join(",");

    // Note: TikTok uses 'client_key' instead of 'client_id' in v2
    const url = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&scope=${encodeURIComponent(scopes)}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=${userId}`;

    return { success: true, url };
}

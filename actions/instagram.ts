"use server";

import { auth } from "@clerk/nextjs/server";

export async function getInstagramAuthUrl() {
    const { userId } = await auth();
    if (!userId) {
        throw new Error("Unauthorized");
    }

    const clientId = process.env.INSTAGRAM_CLIENT_ID;
    const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;

    if (!clientId || !redirectUri) {
        throw new Error("Instagram API credentials not configured in .env.local");
    }

    // Standard Facebook Login for Business / Instagram Graph API OAuth URL
    // Scopes required for video publishing and basic info
    const scopes = [
        "instagram_basic",
        "instagram_content_publish",
        "pages_read_engagement",
        "pages_show_list",
        "public_profile"
    ].join(",");

    const url = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&response_type=code&state=${userId}`;

    return { success: true, url };
}

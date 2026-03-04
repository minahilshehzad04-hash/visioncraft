"use server";

import { auth } from "@clerk/nextjs/server";

export async function getYoutubeAuthUrl() {
    const { userId } = await auth();
    if (!userId) {
        throw new Error("Unauthorized");
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !redirectUri) {
        throw new Error("YouTube API credentials (GOOGLE_CLIENT_ID, GOOGLE_REDIRECT_URI) not configured in .env.local");
    }

    // Google OAuth 2.0 URL
    const scopes = [
        "https://www.googleapis.com/auth/youtube.upload",
        "https://www.googleapis.com/auth/youtube.readonly",
        "https://www.googleapis.com/auth/userinfo.profile",
        "openid"
    ].join(" ");

    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&access_type=offline&prompt=consent&state=${userId}`;

    return { success: true, url };
}

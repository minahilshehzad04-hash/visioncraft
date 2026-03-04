import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/utils/supabase/service";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // Our userId
    const error = searchParams.get("error");

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    if (error || !code) {
        console.error("YouTube Auth Error:", error);
        return NextResponse.redirect(`${appUrl}/dashboard/settings?error=youtube_auth_failed`);
    }

    try {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const redirectUri = process.env.GOOGLE_REDIRECT_URI;

        // 1. Exchange code for tokens
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                code,
                client_id: clientId!,
                client_secret: clientSecret!,
                redirect_uri: redirectUri!,
                grant_type: "authorization_code",
            }),
        });

        const tokenData = await tokenRes.json();
        if (tokenData.error) {
            throw new Error(tokenData.error_description || tokenData.error);
        }

        const accessToken = tokenData.access_token;
        const refreshToken = tokenData.refresh_token; // Received because of access_type=offline

        // 2. Fetch Channel Info
        const channelRes = await fetch(
            "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
            {
                headers: { Authorization: `Bearer ${accessToken}` },
            }
        );
        const channelData = await channelRes.json();
        const channel = channelData.items?.[0];
        const accountName = channel?.snippet?.title || "YouTube Channel";

        // 3. Save to Supabase - Manual UPSERT as the unique constraint might be missing
        const supabase = createServiceRoleClient();

        // Check if connection already exists
        const { data: existingConnection } = await supabase
            .from("social_connections")
            .select("id")
            .eq("user_id", state)
            .eq("platform", "youtube")
            .single();

        const connectionData = {
            user_id: state,
            platform: "youtube",
            account_name: accountName,
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_at: new Date(Date.now() + (tokenData.expires_in || 3600) * 1000).toISOString(),
            updated_at: new Date().toISOString()
        };

        let dbError;
        if (existingConnection) {
            const { error } = await supabase
                .from("social_connections")
                .update(connectionData)
                .eq("id", existingConnection.id);
            dbError = error;
        } else {
            const { error } = await supabase
                .from("social_connections")
                .insert(connectionData);
            dbError = error;
        }

        if (dbError) throw dbError;

        return NextResponse.redirect(`${appUrl}/dashboard/settings?success=youtube_connected`);
    } catch (err: any) {
        console.error("YouTube Callback Error:", err);
        return NextResponse.redirect(`${appUrl}/dashboard/settings?error=${encodeURIComponent(err.message)}`);
    }
}

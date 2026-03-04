import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/utils/supabase/service";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // Our userId
    const error = searchParams.get("error");
    const error_description = searchParams.get("error_description");

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    if (error || !code) {
        console.error("TikTok Auth Error:", error, error_description);
        return NextResponse.redirect(`${appUrl}/dashboard/settings?error=tiktok_auth_failed`);
    }

    try {
        const clientKey = process.env.TIKTOK_CLIENT_KEY;
        const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
        const redirectUri = process.env.TIKTOK_REDIRECT_URI;

        // 1. Exchange code for tokens
        const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Cache-Control": "no-cache"
            },
            body: new URLSearchParams({
                client_key: clientKey!,
                client_secret: clientSecret!,
                code: code,
                grant_type: "authorization_code",
                redirect_uri: redirectUri!,
            }),
        });

        const tokenData = await tokenRes.json();
        if (tokenData.error) {
            throw new Error(tokenData.error_description || tokenData.error);
        }

        const accessToken = tokenData.access_token;
        const refreshToken = tokenData.refresh_token;

        // 2. Fetch Basic User Info
        const userRes = await fetch(
            "https://open.tiktokapis.com/v2/user/info/?fields=display_name,username",
            {
                headers: { Authorization: `Bearer ${accessToken}` },
            }
        );
        const userData = await userRes.json();
        const user = userData.data?.user;
        const accountName = user?.display_name || user?.username || "TikTok Account";

        // 3. Save to Supabase (Manual UPSERT Resilience logic)
        const supabase = createServiceRoleClient();

        // Check if connection already exists
        const { data: existingConnection } = await supabase
            .from("social_connections")
            .select("id")
            .eq("user_id", state)
            .eq("platform", "tiktok")
            .single();

        const connectionData = {
            user_id: state,
            platform: "tiktok",
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

        return NextResponse.redirect(`${appUrl}/dashboard/settings?success=tiktok_connected`);
    } catch (err: any) {
        console.error("TikTok Callback Error:", err);
        return NextResponse.redirect(`${appUrl}/dashboard/settings?error=${encodeURIComponent(err.message)}`);
    }
}

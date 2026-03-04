import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/utils/supabase/service";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // This is our userId passed in the 'state' param
    const error = searchParams.get("error");

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    if (error || !code) {
        console.error("Instagram Auth Error:", error);
        return NextResponse.redirect(`${appUrl}/dashboard/settings?error=instagram_auth_failed`);
    }

    try {
        const clientId = process.env.INSTAGRAM_CLIENT_ID;
        const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;
        const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;

        // 1. Exchange code for short-lived access token
        const tokenRes = await fetch(
            `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${clientId}&client_secret=${clientSecret}&redirect_uri=${encodeURIComponent(redirectUri!)}&code=${code}`
        );
        const tokenData = await tokenRes.json();

        if (tokenData.error) {
            throw new Error(tokenData.error.message);
        }

        const accessToken = tokenData.access_token;

        // 2. (Optional but recommended) Exchange for long-lived token (60 days)
        const longLivedRes = await fetch(
            `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${accessToken}`
        );
        const longLivedData = await longLivedRes.json();
        const finalToken = longLivedData.access_token || accessToken;

        // 3. Get the User's Pages and linked Instagram Business Accounts
        const pagesRes = await fetch(
            `https://graph.api.facebook.com/v19.0/me/accounts?access_token=${finalToken}`
        );
        const pagesData = await pagesRes.json();

        // Find a page with a linked IG Business Account
        let instagramAccountId = null;
        let accountName = "Instagram Business Account";

        for (const page of pagesData.data || []) {
            const igRes = await fetch(
                `https://graph.api.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${finalToken}`
            );
            const igData = await igRes.json();
            if (igData.instagram_business_account) {
                instagramAccountId = igData.instagram_business_account.id;
                // Get IG account handle
                const igInfoRes = await fetch(
                    `https://graph.api.facebook.com/v19.0/${instagramAccountId}?fields=username&access_token=${finalToken}`
                );
                const igInfo = await igInfoRes.json();
                accountName = igInfo.username || accountName;
                break;
            }
        }

        if (!instagramAccountId) {
            // If no business account found, we might still save the token or error out
            console.warn("No Instagram Business Account linked to this Facebook account.");
        }

        // 4. Save to Supabase - Manual UPSERT as the unique constraint might be missing
        const supabase = createServiceRoleClient();

        // Check if connection already exists
        const { data: existingConnection } = await supabase
            .from("social_connections")
            .select("id")
            .eq("user_id", state)
            .eq("platform", "instagram")
            .single();

        const connectionData = {
            user_id: state,
            platform: "instagram",
            account_name: accountName,
            access_token: finalToken,
            expires_at: new Date(Date.now() + (longLivedData.expires_in || 3600) * 1000).toISOString(),
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

        return NextResponse.redirect(`${appUrl}/dashboard/settings?success=instagram_connected`);
    } catch (err: any) {
        console.error("IG Callback Error:", err);
        return NextResponse.redirect(`${appUrl}/dashboard/settings?error=${encodeURIComponent(err.message)}`);
    }
}

import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createServiceRoleClient } from "@/utils/supabase/service";
import { PLAN_LIMITS, getUserPlan } from "@/lib/plans";

export async function POST(req: Request) {
    console.log("POST /api/series - Received request");
    try {
        const { userId } = await auth();
        console.log("POST /api/series - UserId:", userId);

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        console.log("POST /api/series - Body parsed:", !!body);

        // Destructure and map camelCase from frontend to snake_case for Postgres
        const {
            seriesName,
            niche,
            captionStyle,
            language,
            voice,
            musicIds,
            videoStyle,
            duration,
            platform,
            publishTime,
            modelName,
            modelLangCode
        } = body;

        const supabase = createServiceRoleClient();

        // --- PLAN LIMIT CHECK ---
        const user = await currentUser();
        const plan = getUserPlan(user);
        const limits = PLAN_LIMITS[plan];

        // 1. Check Series Count
        const { count, error: countError } = await supabase
            .from("video_series")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId);

        if (countError) throw countError;

        if ((count || 0) >= limits.maxSeries) {
            return NextResponse.json({
                error: "Plan limit reached",
                code: "LIMIT_REACHED",
                limit: limits.maxSeries,
                current: count
            }, { status: 403 });
        }

        // 2. Check Platform Access
        if (platform && !limits.allowedPlatforms.includes(platform.toLowerCase())) {
            return NextResponse.json({
                error: `Your '${plan}' plan does not allow publishing to ${platform}.`,
                code: "PLATFORM_RESTRICTED"
            }, { status: 403 });
        }
        // -------------------------

        const { data, error } = await supabase
            .from("video_series")
            .insert({
                user_id: userId,
                series_name: seriesName,
                niche,
                caption_style: captionStyle,
                language,
                voice,
                music_ids: musicIds,
                video_style: videoStyle,
                duration,
                platform,
                publish_time: publishTime,
                model_name: modelName,
                model_lang_code: modelLangCode,
                status: 'active'
            })
            .select()
            .single();

        if (error) {
            console.error("Supabase Error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error("API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

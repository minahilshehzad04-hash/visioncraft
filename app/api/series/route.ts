import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServiceRoleClient } from "@/utils/supabase/service";

export async function POST(req: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();

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

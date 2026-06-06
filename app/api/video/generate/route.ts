import { NextRequest, NextResponse } from "next/server";
import { inngest } from "@/lib/inngest/client";
import { createServiceRoleClient } from "@/utils/supabase/service";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
    try {
        const { seriesId } = await req.json();

        if (!seriesId) {
            return NextResponse.json({ error: "seriesId is required" }, { status: 400 });
        }

        const supabase = createServiceRoleClient();

        // Create a placeholder video record before triggering the job
        const { data: videoRecord, error: insertError } = await supabase
            .from("generated_videos")
            .insert({
                series_id: seriesId,
                title: "Generating...",
                script: "",
                voice_url: "",
                voice_model: "aura-asteria-en",
                captions: [],
                image_urls: [],
                status: "generating",
                created_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (insertError) {
            throw new Error(`Failed to create video record: ${insertError.message}`);
        }

        // Send the Inngest event to kick off the background workflow
        await inngest.send({
            name: "video/generate.requested",
            data: {
                seriesId,
                videoId: videoRecord.id,
            },
        });

        return NextResponse.json({
            success: true,
            videoId: videoRecord.id,
            message: "Video generation started",
        });
    } catch (error: any) {
        console.error("Error triggering video generation:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
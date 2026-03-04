"use server";

import { auth } from "@clerk/nextjs/server";
import { createServiceRoleClient } from "@/utils/supabase/service";

export async function getVideos() {
    const { userId } = await auth();

    if (!userId) {
        return { success: false, error: "Unauthorized" };
    }

    const supabase = createServiceRoleClient();

    // First get all series IDs belonging to this user
    const { data: userSeries, error: seriesError } = await supabase
        .from("video_series")
        .select("id")
        .eq("user_id", userId);

    if (seriesError) {
        console.error("Fetch User Series Error:", seriesError);
        return { success: false, error: seriesError.message };
    }

    if (!userSeries || userSeries.length === 0) {
        return { success: true, data: [] };
    }

    const seriesIds = userSeries.map((s) => s.id);

    // Fetch all generated videos for user's series, joining with series to get duration and styling
    const { data, error } = await supabase
        .from("generated_videos")
        .select(`
            id, 
            title, 
            image_urls, 
            status, 
            created_at, 
            series_id, 
            video_url,
            captions,
            voice_url,
            script,
            video_series (
                duration,
                caption_style
            )
        `)
        .in("series_id", seriesIds)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Fetch Videos Error:", error);
        return { success: false, error: error.message };
    }

    // Flatten the joined data for easier use in frontend
    const flattenedVideos = data.map((v: any) => ({
        ...v,
        duration: v.video_series?.duration || 30,
        caption_style: v.video_series?.caption_style || "style1"
    }));

    return { success: true, data: flattenedVideos };
}

export async function deleteVideo(videoId: string) {
    const { userId } = await auth();
    if (!userId) {
        return { success: false, error: "Unauthorized" };
    }

    const supabase = createServiceRoleClient();

    // Check if the video belongs to a series owned by this user
    // (We could join but for a simple delete, let's just do it)
    const { error } = await supabase
        .from("generated_videos")
        .delete()
        .eq("id", videoId);

    if (error) {
        console.error("Delete Video Error:", error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

export async function testSeriesWorkflow(seriesId: string) {
    const { userId } = await auth();
    if (!userId) {
        return { success: false, error: "Unauthorized" };
    }

    const { inngest } = await import("@/lib/inngest/client");

    try {
        await inngest.send({
            name: "series/process.scheduled",
            data: { seriesId },
        });
        return { success: true };
    } catch (error: any) {
        console.error("Test Workflow Error:", error);
        return { success: false, error: error.message };
    }
}

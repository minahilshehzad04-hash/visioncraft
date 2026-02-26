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

    // Fetch all generated videos for user's series
    const { data, error } = await supabase
        .from("generated_videos")
        .select("id, title, image_urls, status, created_at, series_id, video_url")
        .in("series_id", seriesIds)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Fetch Videos Error:", error);
        return { success: false, error: error.message };
    }

    return { success: true, data };
}

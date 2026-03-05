"use server";

import { auth } from "@clerk/nextjs/server";
import { createServiceRoleClient } from "@/utils/supabase/service";
import { inngest } from "@/lib/inngest/client";

export async function getSeries() {
    const { userId } = await auth();

    if (!userId) {
        return { success: false, error: "Unauthorized" };
    }

    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
        .from("video_series")
        .select("*, generated_videos(count)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Fetch Series Error:", error);
        return { success: false, error: error.message };
    }

    const dataWithCounts = data.map((s: any) => ({
        ...s,
        video_count: s.generated_videos?.[0]?.count || 0
    }));

    return { success: true, data: dataWithCounts };
}

export async function getSeriesById(id: string) {
    const { userId } = await auth();

    if (!userId) {
        return { success: false, error: "Unauthorized" };
    }

    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
        .from("video_series")
        .select("*")
        .eq("id", id)
        .eq("user_id", userId)
        .single();

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true, data };
}

export async function updateSeries(id: string, updates: any) {
    const { userId } = await auth();

    if (!userId) {
        return { success: false, error: "Unauthorized" };
    }

    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
        .from("video_series")
        .update(updates)
        .eq("id", id)
        .eq("user_id", userId)
        .select()
        .single();

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true, data };
}

export async function deleteSeries(id: string) {
    const { userId } = await auth();

    if (!userId) {
        return { success: false, error: "Unauthorized" };
    }

    const supabase = createServiceRoleClient();

    const { error } = await supabase
        .from("video_series")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}

export async function toggleSeriesStatus(id: string, currentStatus: string) {
    const { userId } = await auth();

    if (!userId) {
        return { success: false, error: "Unauthorized" };
    }

    const newStatus = currentStatus === "paused" ? "active" : "paused";

    const supabase = createServiceRoleClient();

    const { error } = await supabase
        .from("video_series")
        .update({ status: newStatus })
        .eq("id", id)
        .eq("user_id", userId);

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}

export async function requestVideoGeneration(seriesId: string) {
    const { userId } = await auth();

    if (!userId) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const supabase = createServiceRoleClient();

        // 1. Fetch series name for the placeholder
        const { data: series } = await supabase
            .from("video_series")
            .select("series_name")
            .eq("id", seriesId)
            .single();

        // 2. Create a placeholder record so it shows up in the UI immediately
        const videoId = crypto.randomUUID();
        const { error: insertError } = await supabase.from("generated_videos").insert({
            id: videoId,
            series_id: seriesId,
            title: series?.series_name ? `Creating ${series.series_name}...` : "Generating...",
            status: "generating",
        });

        if (insertError) {
            console.error("Placeholder Insert Error:", insertError);
            return { success: false, error: insertError.message };
        }

        // 3. Trigger the heavy lifting via Inngest
        await inngest.send({
            name: "video/generate.requested",
            data: { seriesId, videoId },
            user: { id: userId }
        });

        return { success: true };
    } catch (error: any) {
        console.error("Inngest Event Error:", error);
        return { success: false, error: error.message };
    }
}

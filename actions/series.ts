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
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Fetch Series Error:", error);
        return { success: false, error: error.message };
    }

    return { success: true, data };
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
        await inngest.send({
            name: "video/generate.requested",
            data: { seriesId },
            user: { id: userId }
        });

        return { success: true };
    } catch (error: any) {
        console.error("Inngest Event Error:", error);
        return { success: false, error: error.message };
    }
}

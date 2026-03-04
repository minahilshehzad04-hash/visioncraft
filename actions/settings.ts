"use server";

import { auth } from "@clerk/nextjs/server";
import { createServiceRoleClient } from "@/utils/supabase/service";
import { revalidatePath } from "next/cache";

export async function getSocialConnections() {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
        .from("social_connections")
        .select("*")
        .eq("user_id", userId);

    if (error) {
        console.error("Fetch Social Connections Error:", error);
        return { success: false, error: error.message };
    }

    return { success: true, data };
}

export async function connectSocialAccount(platform: string) {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const supabase = createServiceRoleClient();

    // Check if connection already exists
    const { data: existingConnection } = await supabase
        .from("social_connections")
        .select("id")
        .eq("user_id", userId)
        .eq("platform", platform)
        .single();

    const connectionData = {
        user_id: userId,
        platform,
        account_name: `Connected ${platform.charAt(0).toUpperCase() + platform.slice(1)} User`,
        access_token: "mock_access_token",
        refresh_token: "mock_refresh_token",
        expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
        updated_at: new Date().toISOString()
    };

    let result;
    if (existingConnection) {
        result = await supabase
            .from("social_connections")
            .update(connectionData)
            .eq("id", existingConnection.id)
            .select()
            .single();
    } else {
        result = await supabase
            .from("social_connections")
            .insert(connectionData)
            .select()
            .single();
    }

    if (result.error) {
        console.error(`Connect ${platform} Error:`, result.error);
        return { success: false, error: result.error.message };
    }

    revalidatePath("/dashboard/settings");
    return { success: true, data: result.data };
}

export async function disconnectSocialAccount(connectionId: string) {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const supabase = createServiceRoleClient();
    const { error } = await supabase
        .from("social_connections")
        .delete()
        .eq("id", connectionId)
        .eq("user_id", userId); // Security check

    if (error) {
        console.error("Disconnect Social Account Error:", error);
        return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/settings");
    return { success: true };
}

export async function deleteUserAccount() {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const supabase = createServiceRoleClient();

    // 1. Delete user from Supabase (this will cascade delete series, videos, and social connections if RLS/Foreign keys are set)
    const { error } = await supabase
        .from("users")
        .delete()
        .eq("user_id", userId);

    if (error) {
        console.error("Delete Account Error:", error);
        return { success: false, error: error.message };
    }

    // Note: Clerk user deletion should ideally be done via Clerk SDK here or via webhook from the DB delete.
    // For now, we return success so the UI can redirect.
    return { success: true };
}

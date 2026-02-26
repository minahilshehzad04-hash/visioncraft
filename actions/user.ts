"use server";

import { currentUser } from "@clerk/nextjs/server";
import { createServiceRoleClient } from "@/utils/supabase/service";

export async function syncUser() {
    const user = await currentUser();

    if (!user) {
        return { success: false, error: "No user found" };
    }

    const { id, emailAddresses, firstName, lastName } = user;
    const email = emailAddresses[0]?.emailAddress;
    const full_name = `${firstName ?? ""} ${lastName ?? ""}`.trim();

    if (!email) {
        return { success: false, error: "User has no email" };
    }

    const supabase = createServiceRoleClient();

    const { error } = await supabase.from("users").upsert({
        user_id: id,
        email,
        name: full_name,
    }, { onConflict: 'user_id' });

    if (error) {
        console.error("Supabase Sync Error:", error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

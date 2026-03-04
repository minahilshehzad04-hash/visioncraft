import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetVideos() {
    console.log("Searching for videos with local fallback URLs...");

    // We look for videos that are 'completed' but have a URL starting with /renders/
    const { data: videos, error } = await supabase
        .from("generated_videos")
        .select("id, title, video_url")
        .eq("status", "completed")
        .like("video_url", "/renders/%");

    if (error) {
        console.error("Error fetching videos:", error.message);
        return;
    }

    if (!videos || videos.length === 0) {
        console.log("No videos found with local fallback URLs.");
        return;
    }

    console.log(`Found ${videos.length} videos to reset.`);

    for (const video of videos) {
        console.log(`Resetting: ${video.title} (${video.id})`);
        const { error: updateError } = await supabase
            .from("generated_videos")
            .update({
                status: "ready_for_local_render",
                video_url: null
            })
            .eq("id", video.id);

        if (updateError) {
            console.error(`Failed to reset ${video.id}:`, updateError.message);
        }
    }

    console.log("Reset operation completed.");
}

resetVideos().catch(console.error);

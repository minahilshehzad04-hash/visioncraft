import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLatestVideo() {
    const { data: videos, error } = await supabase
        .from("generated_videos")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1);

    if (error) {
        console.error("Error fetching video:", error);
        return;
    }

    if (!videos || videos.length === 0) {
        console.log("No videos found.");
        return;
    }

    const video = videos[0];
    console.log("Video ID:", video.id);
    console.log("Title:", video.title);
    console.log("Status:", video.status);
    console.log("Captions:", JSON.stringify(video.captions, null, 2));
}

checkLatestVideo();

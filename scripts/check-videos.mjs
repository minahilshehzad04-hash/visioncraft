import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: "d:/VideoGenerator/visioncraft/.env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVideos() {
    const { data, error } = await supabase
        .from("generated_videos")
        .select("id, title, status, video_url")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching videos:", error.message);
        return;
    }

    console.log("Videos Status:");
    data.forEach(v => {
        console.log(`- ${v.title} (${v.id}): ${v.status} | URL: ${v.video_url}`);
    });
}

checkVideos().catch(console.error);

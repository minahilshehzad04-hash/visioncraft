import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function repairCaptions() {
    console.log("Fetching videos with null captions timestamps...");

    // We fetch all videos and manually check if timestamps are null in JSONB
    const { data: videos, error } = await supabase
        .from("generated_videos")
        .select("*, video_series(duration)")
        .eq("status", "completed");

    if (error) {
        console.error("Error fetching videos:", error);
        return;
    }

    console.log(`Found ${videos.length} completed videos. Checking for null timestamps...`);

    for (const video of videos) {
        if (!video.captions || !Array.isArray(video.captions) || video.captions.length === 0) continue;

        const needsRepair = video.captions.some(c => c.start === null || c.end === null);

        if (needsRepair) {
            console.log(`Repairing video ${video.id}: ${video.title}`);

            const durationStr = video.video_series?.duration || "30";
            const durationParts = String(durationStr).split("-").map(d => parseInt(d.trim()));
            const durationNum = durationParts.length > 1
                ? Math.floor((durationParts[0] + durationParts[1]) / 2)
                : (durationParts[0] || 30);

            const totalDuration = durationNum * 1000;
            const sceneDuration = totalDuration / video.captions.length;

            const repairedCaptions = video.captions.map((c, i) => ({
                ...c,
                start: Math.floor(i * sceneDuration),
                end: Math.floor((i + 1) * sceneDuration),
            }));

            const { error: updateError } = await supabase
                .from("generated_videos")
                .update({ captions: repairedCaptions })
                .eq("id", video.id);

            if (updateError) {
                console.error(`Failed to repair ${video.id}:`, updateError.message);
            } else {
                console.log(`Successfully repaired ${video.id}`);
            }
        }
    }

    console.log("Repair process finished.");
}

repairCaptions();

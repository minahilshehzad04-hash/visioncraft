import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSeries() {
    const { data: video } = await supabase
        .from("generated_videos")
        .select("series_id")
        .eq("id", "d272db92-bf9f-4294-bde1-26df2fb9a3b7")
        .single();

    if (!video) return;

    const { data: series, error } = await supabase
        .from("video_series")
        .select("*")
        .eq("id", video.series_id)
        .single();

    if (error) {
        console.error("Error fetching series:", error);
        return;
    }

    console.log("Series ID:", series.id);
    console.log("Duration:", series.duration);
    console.log("All keys:", Object.keys(series));
}

checkSeries();

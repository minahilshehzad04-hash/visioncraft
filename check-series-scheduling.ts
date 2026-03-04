import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSeries() {
    console.log("🔍 Checking Active Series for Scheduling...");

    const { data: series, error } = await supabase
        .from("video_series")
        .select("*")
        .eq("status", "Active");

    if (error) {
        console.error("❌ Error fetching series:", error.message);
        return;
    }

    if (!series || series.length === 0) {
        console.log("📭 No active series found.");
        return;
    }

    console.log(`✅ Found ${series.length} active series:`);
    series.forEach(s => {
        console.log(`- ID: ${s.id}, Name: ${s.series_name}, Publish Time: ${s.publish_time}, Platform: ${s.platform}`);
    });
}

checkSeries();

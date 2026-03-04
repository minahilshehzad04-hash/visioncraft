import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function checkYoutubeConnection() {
    console.log("🔍 Checking for YouTube connections in 'social_connections' table...");

    const { data, error } = await supabase
        .from("social_connections")
        .select("*")
        .eq("platform", "youtube");

    if (error) {
        console.error("❌ Error fetching connections:", error.message);
        return;
    }

    if (data && data.length > 0) {
        console.log(`✅ Found ${data.length} YouTube connection(s):`);
        data.forEach(conn => {
            console.log(`- User ID: ${conn.user_id}`);
            console.log(`  Account Name: ${conn.account_name}`);
            console.log(`  Connected At: ${conn.created_at}`);
        });
    } else {
        console.log("ℹ️ No YouTube connections found.");
    }
}

checkYoutubeConnection();

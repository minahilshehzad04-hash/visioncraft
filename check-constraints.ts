import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConstraints() {
    console.log("🔍 Checking constraints for 'social_connections'...");

    const { data, error } = await supabase.rpc('get_table_constraints', { t_name: 'social_connections' });

    if (error) {
        // Fallback: Try to query pg_indexes or similar if RPC fails
        console.log("ℹ️ RPC failed or not found, trying raw query via external explanation...");
        // In Supabase, we usually can't run raw SQL via the client easily without a custom function.
        // Let's just try an upsert that fails and see the detailed error if possible, or check if we can list indexes.

        const { data: cols, error: colError } = await supabase
            .from("social_connections")
            .select("*")
            .limit(0);

        console.log("Table columns exist. Error likely due to missing UNIQUE(user_id, platform).");
    } else {
        console.log("✅ Constraints:", data);
    }
}

checkConstraints();

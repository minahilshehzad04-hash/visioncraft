import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

// Load env from the project root
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupBucket() {
    console.log("Checking for 'videos' bucket...");

    try {
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();

        if (listError) {
            console.error("Error listing buckets:", listError.message);
            return;
        }

        const bucketExists = buckets.find(b => b.name === "videos");

        if (!bucketExists) {
            console.log("Bucket 'videos' not found. Creating...");
            const { data, error } = await supabase.storage.createBucket("videos", {
                public: true,
                allowedMimeTypes: ["video/mp4"],
                // fileSizeLimit: 104857600 // 100MB
            });

            if (error) {
                console.error("Error creating bucket:", error.message);
            } else {
                console.log("Bucket 'videos' created successfully!");
            }
        } else {
            console.log("Bucket 'videos' already exists.");
            console.log("Bucket properties:", {
                public: bucketExists.public,
                id: bucketExists.id
            });
            // Ensure it's public if it wasn't
            if (!bucketExists.public) {
                console.log("Updating bucket to be public...");
                const { error } = await supabase.storage.updateBucket("videos", { public: true });
                if (error) {
                    console.error("Error updating bucket:", error.message);
                } else {
                    console.log("Bucket 'videos' updated to public.");
                }
            }
        }

        // Test upload
        console.log("Performing test upload...");
        const testContent = "test";
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from("videos")
            .upload("test.txt", testContent, { upsert: true });

        if (uploadError) {
            console.error("Test upload failed:", uploadError.message);
        } else {
            console.log("Test upload successful!");
            const { data: urlData } = supabase.storage.from("videos").getPublicUrl("test.txt");
            console.log("Test public URL:", urlData.publicUrl);
        }
    } catch (err) {
        console.error("Unexpected error:", err.message);
    }
}

setupBucket().catch(console.error);

import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
import { Inngest } from "inngest";

const envPath = fs.existsSync(".env.local") ? ".env.local" : ".env";
dotenv.config({ path: envPath });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const isWatchMode = process.argv.includes("--watch");
const inngest = new Inngest({ id: "visioncraft" });

async function uploadToSupabase(filePath, fileName) {
    console.log(`\n📤 Uploading ${fileName} to Supabase Storage...`);
    const fileBuffer = fs.readFileSync(filePath);

    const { data, error } = await supabase.storage
        .from("videos")
        .upload(fileName, fileBuffer, {
            contentType: "video/mp4",
            upsert: true,
        });

    if (error) {
        throw new Error(`Upload failed: ${error.message}`);
    }

    const { data: publicUrlData } = supabase.storage
        .from("videos")
        .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
}

async function renderNextVideo() {
    // 1. Fetch the latest video ready for local render or completed but missing url
    const { data: video, error } = await supabase
        .from("generated_videos")
        .select("*, video_series(*)")
        .or(`status.eq.ready_for_local_render,and(status.eq.completed,or(video_url.is.null,video_url.like./renders/%))`)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

    if (error || !video) {
        return false; // No video found
    }

    console.log(`🎬 Processing: ${video.title} (ID: ${video.id})`);

    const compositionId = "VideoComposition";
    const entry = path.resolve("remotion/index.ts");
    const outputDir = path.join(process.cwd(), "public", "renders");
    const outputFileName = `video-${video.id}.mp4`;
    const outputLocation = path.join(outputDir, outputFileName);

    // Ensure public/renders directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const inputProps = {
        images: video.image_urls || [],
        captions: video.captions || [],
        voiceUrl: video.voice_url || "",
        captionStyleId: video.caption_style || "pop",
        durationInSeconds: Number(video.video_series?.duration) || 30,
    };

    // Check if local render already exists to avoid re-rendering
    if (fs.existsSync(outputLocation)) {
        console.log(`✨ Local render found for ${video.title}. Skipping render and proceeding to upload.`);
    } else {
        console.log("📦 Bundling video...");
        const bundleLocation = await bundle({ entryPoint: entry });

        const composition = await selectComposition({
            serveUrl: bundleLocation,
            id: compositionId,
            inputProps,
        });

        console.log("🎥 Rendering...");
        await renderMedia({
            composition,
            serveUrl: bundleLocation,
            codec: "h264",
            outputLocation,
            inputProps,
            onProgress: ({ progress }) => {
                process.stdout.write(`\r⏳ Progress: ${(progress * 100).toFixed(1)}%`);
            },
        });
        console.log(`\n✅ Render completed: ${outputLocation}`);
    }

    // 2. Upload to Supabase Storage
    let videoUrl = `/renders/${outputFileName}`; // Fallback to local
    try {
        const cloudUrl = await uploadToSupabase(outputLocation, outputFileName);
        videoUrl = cloudUrl;
        console.log("✨ Uploaded to Supabase Storage!");

        // Cleanup local file after successful upload
        // fs.unlinkSync(outputLocation); 
        // console.log("🧹 Cleaned up local render file.");
    } catch (uploadError) {
        console.error("⚠️ Cloud upload failed, using local URL as fallback:", uploadError.message);
    }

    // 3. Update status and video_url in Supabase
    const { error: updateError } = await supabase
        .from("generated_videos")
        .update({
            status: "completed",
            video_url: videoUrl,
        })
        .eq("id", video.id);

    if (updateError) {
        console.error("❌ Failed to update database:", updateError.message);
    } else {
        console.log("🚀 Updated video status to 'completed'.");

        // 4. Trigger Video Rendered event for notification
        try {
            console.log(`📡 Sending 'video/rendered' event for ID: ${video.id} to trigger Plunk email...`);
            const eventData = {
                videoId: video.id,
                userId: video.video_series?.user_id || video.user_id,
            };
            console.log("📊 Event data:", JSON.stringify(eventData, null, 2));

            await inngest.send({
                name: "video/rendered",
                data: eventData
            });
            console.log("✅ Successfully triggered Inngest notification workflow.");
        } catch (eventError) {
            console.error("⚠️ Failed to trigger notification event:", eventError.message);
        }
    }

    return true;
}

async function main() {
    if (isWatchMode) {
        console.log("👀 Watch mode enabled. Waiting for new videos...");
        while (true) {
            const processed = await renderNextVideo();
            if (!processed) {
                // Wait 10 seconds before polling again
                await new Promise((resolve) => setTimeout(resolve, 10000));
            } else {
                console.log("\n--- Ready for next task ---");
            }
        }
    } else {
        const processed = await renderNextVideo();
        if (!processed) {
            console.log("📭 No videos waiting for render.");
        }
    }
}

main().catch((err) => {
    console.error("❌ Fatal Error:", err);
    process.exit(1);
});

import { google } from "googleapis";
import { createServiceRoleClient } from "@/utils/supabase/service";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import os from "os";

export async function publishToYouTube(videoId: string) {
    const supabase = createServiceRoleClient();

    // 1. Get video and series details
    const { data: video, error: videoError } = await supabase
        .from("generated_videos")
        .select("*, video_series(*)")
        .eq("id", videoId)
        .single();

    if (videoError || !video) {
        throw new Error(`Video not found: ${videoError?.message || "Unknown error"}`);
    }

    if (!video.video_url) {
        throw new Error("Video URL not found. Video might not be rendered yet.");
    }

    const userId = video.video_series.user_id;

    // 2. Get YouTube connection
    const { data: connection, error: connError } = await supabase
        .from("social_connections")
        .select("*")
        .eq("user_id", userId)
        .eq("platform", "youtube")
        .single();

    if (connError || !connection) {
        throw new Error(`YouTube connection not found for user ${userId}`);
    }

    // 3. Setup YouTube Auth
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
        access_token: connection.access_token,
        refresh_token: connection.refresh_token,
        expiry_date: connection.expires_at ? new Date(connection.expires_at).getTime() : undefined,
    });

    // Check if token needs refresh
    oauth2Client.on("tokens", async (tokens) => {
        if (tokens.refresh_token) {
            // Update both tokens if refresh_token is provided
            await supabase
                .from("social_connections")
                .update({
                    access_token: tokens.access_token,
                    refresh_token: tokens.refresh_token,
                    expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
                    updated_at: new Date().toISOString()
                })
                .eq("id", connection.id);
        } else {
            // Update only access token and expiry
            await supabase
                .from("social_connections")
                .update({
                    access_token: tokens.access_token,
                    expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
                    updated_at: new Date().toISOString()
                })
                .eq("id", connection.id);
        }
    });

    const youtube = google.youtube({ version: "v3", auth: oauth2Client });

    // 4. Download video to temporary file
    const tempFilePath = path.join(os.tmpdir(), `youtube-upload-${videoId}.mp4`);
    const response = await fetch(video.video_url);
    if (!response.ok) throw new Error(`Failed to download video from ${video.video_url}`);

    const fileStream = fs.createWriteStream(tempFilePath);
    await new Promise((resolve, reject) => {
        response.body!.pipe(fileStream);
        response.body!.on("error", reject);
        fileStream.on("finish", resolve);
    });

    try {
        // 5. Upload to YouTube
        console.log(`Uploading video to YouTube: ${video.title}`);

        const res = await youtube.videos.insert({
            part: ["snippet", "status"],
            requestBody: {
                snippet: {
                    title: video.title || "Untitled Video",
                    description: `Automatically generated video from VisionCraft.\n\n#VisionCraft #AI #Shorts`,
                    tags: ["VisionCraft", "AI", "Video"],
                    categoryId: "22", // People & Blogs
                },
                status: {
                    privacyStatus: "public",
                    selfDeclaredMadeForKids: false,
                },
            },
            media: {
                body: fs.createReadStream(tempFilePath),
            },
        });

        console.log("YouTube upload successful:", res.data.id);

        // 6. Update video record with YouTube ID
        await supabase
            .from("generated_videos")
            .update({
                youtube_id: res.data.id,
                status: "published" // Optional: track if it's published
            })
            .eq("id", videoId);

        return { success: true, youtubeId: res.data.id };

    } finally {
        // Cleanup temp file
        if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
        }
    }
}

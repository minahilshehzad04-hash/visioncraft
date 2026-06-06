import { inngest } from "./client";
import { createServiceRoleClient } from "@/utils/supabase/service";
import { sendVideoReadyEmail } from "@/utils/email";

/**
 * 1. Daily Cron Job
 * Runs every day at midnight to find all active series and trigger their processing.
 */
export const scheduleSeriesDaily = inngest.createFunction(
    { id: "schedule-series-daily" },
    { cron: "0 0 * * *" },
    async ({ step }) => {
        const series = await step.run("fetch-active-series", async () => {
            const supabase = createServiceRoleClient();
            const { data, error } = await supabase
                .from("video_series")
                .select("id")
                .eq("status", "scheduled");

            if (error) throw error;
            return data || [];
        });

        const events = series.map((s) => ({
            name: "series/process.scheduled",
            data: { seriesId: s.id },
        }));

        if (events.length > 0) {
            await step.sendEvent("trigger-series-workflows", events);
        }

        return { triggered: events.length };
    }
);

/**
 * 2. Series Processing Workflow
 * Handles the individual timeline for a scheduled series.
 */
export const processScheduledSeries = inngest.createFunction(
    { id: "process-scheduled-series", concurrency: 5 },
    { event: "series/process.scheduled" },
    async ({ event, step }) => {
        const { seriesId } = event.data;

        // 1. Fetch Series Details
        const series = await step.run("fetch-series-details", async () => {
            const supabase = createServiceRoleClient();
            const { data, error } = await supabase
                .from("video_series")
                .select("*")
                .eq("id", seriesId)
                .single();
            if (error) throw error;
            return data;
        });

        if (series.status !== "scheduled") {
            return { skipped: true, reason: "Series is not scheduled" };
        }

        const publishTime = series.publish_time; // Format "HH:mm"
        const [hours, minutes] = publishTime.split(":").map(Number);

        // Calculate publication time for today
        const now = new Date();
        const publishTarget = new Date(now);
        publishTarget.setHours(hours, minutes, 0, 0);

        // If publish target has already passed today (e.g. running manually late), 
        // we might want to still run it or skip. For now, let's just proceed.

        // 2. Wait until 2 hours before publish time
        const generationTarget = new Date(publishTarget.getTime() - 2 * 60 * 60 * 1000);

        if (generationTarget > new Date()) {
            await step.sleepUntil("wait-for-gen-time", generationTarget);
        }

        // 3. Create Video Record and Trigger Generation
        const video = await step.run("create-video-and-generate", async () => {
            const supabase = createServiceRoleClient();

            const { data: video, error } = await supabase
                .from("generated_videos")
                .insert({
                    series_id: seriesId,
                    title: "Generating...",
                    status: "generating",
                    created_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (error) throw error;

            // Trigger the main generation workflow
            await inngest.send({
                name: "video/generate.requested",
                data: {
                    seriesId: series.id,
                    videoId: video.id,
                },
            });

            return video;
        });

        // 4. Wait for Render to Complete
        await step.waitForEvent("wait-for-render", {
            event: "video/rendered",
            timeout: "30m",
            match: "data.videoId",
        });

        // 5. Wait until specific Publish Time
        if (publishTarget > new Date()) {
            await step.sleepUntil("wait-for-publish-time", publishTarget);
        }

        // 6. Execute Publication
        await step.run("publish-platforms", async () => {
            const supabase = createServiceRoleClient();

            // Get latest video data (with URL)
            const { data: finalVideo } = await supabase
                .from("generated_videos")
                .select("*, video_series(*)")
                .eq("id", video.id)
                .single();

            const platforms = series.platform?.toLowerCase() || "";
            const publishResults: any = {};

            // A. Email Distribution
            if (platforms.includes("email")) {
                const { data: user } = await supabase
                    .from("users")
                    .select("email")
                    .eq("user_id", series.user_id)
                    .single();

                if (user?.email) {
                    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
                    await sendVideoReadyEmail({
                        email: user.email,
                        videoTitle: finalVideo.title,
                        seriesName: series.series_name,
                        thumbnailUrl: finalVideo.image_urls?.[0] || "",
                        videoPageUrl: `${appUrl}/dashboard/videos`,
                        downloadUrl: finalVideo.video_url?.startsWith('http') ? finalVideo.video_url : undefined
                    });
                    publishResults.email = "sent";
                }
            }

            // B. Social Media Publication
            if (platforms.includes("youtube")) {
                try {
                    const { publishToYouTube } = await import("@/lib/video/youtube-upload");
                    const result = await publishToYouTube(video.id);
                    publishResults.youtube = result.success ? `published (YouTube ID: ${result.youtubeId})` : "failed";
                } catch (err: any) {
                    console.error("YouTube Publish Error:", err);
                    publishResults.youtube = `error: ${err.message}`;
                }
            }
            if (platforms.includes("instagram")) {
                console.log(`[PLACEHOLDER] Publishing ${finalVideo.id} to Instagram...`);
                publishResults.instagram = "queued (placeholder)";
            }
            if (platforms.includes("tiktok")) {
                console.log(`[PLACEHOLDER] Publishing ${finalVideo.id} to TikTok...`);
                publishResults.tiktok = "queued (placeholder)";
            }

            return publishResults;
        });

        return { success: true, videoId: video.id };
    }
);

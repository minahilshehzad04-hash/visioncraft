import { inngest } from "./client";
import { createServiceRoleClient } from "@/utils/supabase/service";
import { sendVideoReadyEmail } from "@/utils/email";

export const sendVideoEmailNotification = inngest.createFunction(
    { id: "send-video-notification", retries: 3 },
    { event: "video/rendered" },
    async ({ event, step }) => {
        const { videoId, userId } = event.data;

        // 1. Fetch Video, Series, and User data
        const data = await step.run("fetch-notification-details", async () => {
            const supabase = createServiceRoleClient();

            // Get Video and Series
            const { data: video, error: videoError } = await supabase
                .from("generated_videos")
                .select("*, video_series(*)")
                .eq("id", videoId)
                .single();

            if (videoError || !video) throw new Error("Video not found");

            // Get User Email from Supabase (synced via Clerk webhook)
            const { data: user, error: userError } = await supabase
                .from("users")
                .select("email")
                .eq("user_id", userId)
                .single();

            if (userError || !user) throw new Error(`User not found: ${userId}`);

            // Skip notification if the series is scheduled.
            // Scheduled series handle their own emails at the exact publish time
            // via the processScheduledSeries workflow.
            if (video.video_series?.status === "scheduled") {
                console.log(`⏭️ Skipping immediate notification for scheduled video: ${videoId}`);
                return {
                    video,
                    email: user.email,
                    skip: true
                };
            }

            return {
                video,
                email: user.email,
                skip: false
            };
        });

        if (data.skip) return { skipped: true, reason: "Scheduled series" };

        // 2. Send the Email
        await step.run("send-plunk-email", async () => {
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

            await sendVideoReadyEmail({
                email: data.email,
                videoTitle: data.video.title,
                seriesName: data.video.video_series?.series_name || "Video Series",
                thumbnailUrl: data.video.image_urls?.[0] || "",
                videoPageUrl: `${appUrl}/dashboard/videos`,
                downloadUrl: data.video.video_url?.startsWith('http') ? data.video.video_url : undefined
            });

            return { success: true };
        });

        return { success: true, userId, email: data.email };
    }
);

import { inngest } from "./client";
import { createServiceRoleClient } from "@/utils/supabase/service";
import fetch from "node-fetch";

export const generateVideo = inngest.createFunction(
    { id: "generate-video", retries: 0 },
    { event: "video/generate.requested" },
    async ({ event, step }) => {
        const { seriesId, videoId } = event.data;

        try {
            // 1. Fetch Series data
            const seriesData = await step.run("fetch-series-data", async () => {
                const supabase = createServiceRoleClient();
                const { data, error } = await supabase
                    .from("video_series")
                    .select("*")
                    .eq("id", seriesId)
                    .single();
                if (error) throw new Error(`Failed to fetch series: ${error.message}`);
                return data;
            });

            // 2. Generate Script
            const scriptData = await step.run("generate-script", async () => {
                const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${process.env.GROQ_API_KEY!}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        model: "llama-3.1-8b-instant",
                        messages: [
                            {
                                role: "system",
                                content: "You are a professional short-form video script writer. Return ONLY valid JSON, no markdown, no code fences. Keep the narration script concise (under 1500 characters) to fit short-form constraints.",
                            },
                            {
                                role: "user",
                                content: `
Video Niche: ${seriesData.niche}
Duration: ${seriesData.duration} seconds
Video Style: ${seriesData.video_style}

Return valid JSON:
{
  "title": "string",
  "script": "full narration script",
  "scenes": [
    { "text": "string", "image_prompt": "string" }
  ]
}`,
                            },
                        ],
                        response_format: { type: "json_object" },
                    }),
                });

                const data = await response.json() as any;
                const content = data.choices?.[0]?.message?.content;
                if (!content) throw new Error("No content from Groq");

                const parsed = JSON.parse(content);

                // Update title as soon as script is ready
                const supabase = createServiceRoleClient();
                await supabase.from("generated_videos").update({
                    title: parsed.title,
                    script: parsed.script
                }).eq("id", videoId);

                return parsed;
            });

            // 3. Generate Voice
            const voiceUrl = await step.run("generate-voice", async () => {
                const { createClient } = await import("@deepgram/sdk");
                const supabase = createServiceRoleClient();

                const deepgram = createClient(process.env.DEEPGRAM_API_KEY!);

                // Deepgram character limit guard (2000 chars)
                const safeText = scriptData.script.slice(0, 1950);

                const response = await deepgram.speak.request(
                    { text: safeText },
                    { model: "aura-asteria-en", encoding: "mp3" }
                );

                const stream = await response.getStream();
                if (!stream) throw new Error("Deepgram returned empty stream");

                const reader = stream.getReader();
                const chunks: Uint8Array[] = [];
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    if (value) chunks.push(value);
                }

                const finalBuffer = Buffer.concat(chunks.map((c) => Buffer.from(c)));
                if (finalBuffer.length === 0) throw new Error("Deepgram returned empty audio");

                const fileName = `voice-${seriesData.id}-${Date.now()}.mp3`;
                const { error: uploadError } = await supabase.storage
                    .from("voiceovers")
                    .upload(fileName, finalBuffer, { contentType: "audio/mpeg" });
                if (uploadError) throw uploadError;

                const { data: publicUrl } = supabase.storage
                    .from("voiceovers")
                    .getPublicUrl(fileName);

                // Partial update
                await supabase.from("generated_videos").update({ voice_url: publicUrl.publicUrl }).eq("id", videoId);

                return publicUrl.publicUrl;
            });

            // 4. Generate Images (Resilient & Checkpointed)
            const uploadedImages: string[] = [];
            for (let i = 0; i < scriptData.scenes.length; i++) {
                const scene = scriptData.scenes[i];
                const publicUrl = await step.run(`generate-image-${i}`, async () => {
                    const { generateResilientImage } = await import("@/lib/video/image-gen");
                    const supabase = createServiceRoleClient();
                    const hfApiKey = process.env.HF_API_KEY!;

                    const imageBuffer = await generateResilientImage(scene.image_prompt, hfApiKey);
                    const fileName = `scene-${seriesData.id}-${Date.now()}-${i}-${Math.random()}.png`;

                    const { error } = await supabase.storage
                        .from("images")
                        .upload(fileName, imageBuffer, { contentType: "image/png" });

                    if (error) throw error;

                    const { data } = supabase.storage.from("images").getPublicUrl(fileName);
                    return data.publicUrl;
                });

                if (publicUrl) {
                    uploadedImages.push(publicUrl);
                    // Update database progressively to show progress in UI
                    await step.run(`update-db-image-${i}`, async () => {
                        const supabase = createServiceRoleClient();
                        await supabase.from("generated_videos").update({
                            image_urls: [...uploadedImages]
                        }).eq("id", videoId);
                    });
                }
            }

            // 5. Generate Captions
            const captions = await step.run("generate-captions", async () => {
                // Parse duration safely (handles "30-50" or "60")
                const durationParts = String(seriesData.duration).split("-").map(d => parseInt(d.trim()));
                const durationNum = durationParts.length > 1
                    ? Math.floor((durationParts[0] + durationParts[1]) / 2)
                    : (durationParts[0] || 30);

                const totalDuration = durationNum * 1000;
                const sceneDuration = totalDuration / scriptData.scenes.length;
                return scriptData.scenes.map((scene: any, i: number) => ({
                    text: scene.text,
                    start: Math.floor(i * sceneDuration),
                    end: Math.floor((i + 1) * sceneDuration),
                }));
            });

            // 6. Final mark as completed
            await step.run("finalize-video", async () => {
                const supabase = createServiceRoleClient();
                const { error } = await supabase.from("generated_videos").update({
                    captions,
                    status: "completed",
                }).eq("id", videoId);
                if (error) throw error;
                return true;
            });

            return { success: true, message: "Video generation workflow completed", seriesId, videoId };

        } catch (error: any) {
            console.error("Workflow Error:", error);

            // Safety net: update status to failed in database
            const supabase = createServiceRoleClient();
            await supabase.from("generated_videos").update({
                status: "failed",
            }).eq("id", videoId);

            throw error; // Re-throw for Inngest retry logic
        }
    }
);

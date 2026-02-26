import { inngest } from "./client";
import { createServiceRoleClient } from "@/utils/supabase/service";
import fetch from "node-fetch";

export const generateVideo = inngest.createFunction(
    { id: "generate-video", retries: 0 },
    { event: "video/generate.requested" },
    async ({ event, step }) => {
        const { seriesId } = event.data;

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
                            content: "You are a professional short-form video script writer. Return ONLY valid JSON, no markdown, no code fences.",
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
            return JSON.parse(content);
        });

        // 3. Generate Voice with Deepgram
        const voiceUrl = await step.run("generate-voice", async () => {
            const { createClient } = await import("@deepgram/sdk");
            const supabase = createServiceRoleClient();

            const deepgram = createClient(process.env.DEEPGRAM_API_KEY!);
            const response = await deepgram.speak.request(
                { text: scriptData.script },
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
            return publicUrl.publicUrl;
        });

        // 4. Generate Captions
        const captions = await step.run("generate-captions", async () => {
            const totalDuration = seriesData.duration * 1000;
            const sceneDuration = totalDuration / scriptData.scenes.length;
            return scriptData.scenes.map((scene: any, i: number) => ({
                text: scene.text,
                start: Math.floor(i * sceneDuration),
                end: Math.floor((i + 1) * sceneDuration),
            }));
        });

        // 5. Generate Images with Hugging Face
        const imageUrls = await step.run("generate-images", async () => {
            const supabase = createServiceRoleClient();
            const hfApiKey = process.env.HF_API_KEY!;

            const uploadedImages: string[] = [];

            for (const scene of scriptData.scenes) {
                const response = await fetch(
                    "https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0",
                    {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${hfApiKey}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ inputs: scene.image_prompt }),
                    }
                );

                if (!response.ok) {
                    const err = await response.text();
                    throw new Error(`HF image error: ${response.status} - ${err}`);
                }

                // Returns raw binary, not JSON
                const arrayBuffer = await response.arrayBuffer();
                const imageBuffer = Buffer.from(arrayBuffer);

                if (imageBuffer.length === 0) {
                    throw new Error(`Empty image returned for scene: ${scene.text}`);
                }

                const fileName = `scene-${seriesData.id}-${Date.now()}-${Math.random()}.png`;
                const { error } = await supabase.storage
                    .from("images")
                    .upload(fileName, imageBuffer, { contentType: "image/png" });
                if (error) throw error;

                const { data } = supabase.storage.from("images").getPublicUrl(fileName);
                uploadedImages.push(data.publicUrl);
            }

            return uploadedImages;
        });

        // 6. Save to database
        await step.run("save-results", async () => {
            const supabase = createServiceRoleClient();
            const { error } = await supabase.from("generated_videos").insert({
                series_id: seriesData.id,
                title: scriptData.title,
                script: scriptData.script,
                voice_url: voiceUrl,
                captions,
                image_urls: imageUrls,
                status: "completed",
            });
            if (error) throw error;
            return true;
        });

        return { success: true, message: "Video generation workflow completed", seriesId };
    }
);
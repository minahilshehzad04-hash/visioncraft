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
                // Parse duration safely (handles "30-50" or "60")
                const durationParts = String(seriesData.duration).split("-").map(d => parseInt(d.trim()));
                const requestedDuration = durationParts.length > 1
                    ? Math.floor((durationParts[0] + durationParts[1]) / 2)
                    : (durationParts[0] || 30);

                const targetWordCount = Math.floor(requestedDuration * 2.6); // Slightly more for better density

                const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${process.env.GROQ_API_KEY!}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        model: "llama-3.3-70b-versatile",
                        messages: [
                            {
                                role: "system",
                                content: `You are a professional short-form video script writer. 
Return ONLY valid JSON. The script MUST be exactly for a ${requestedDuration} second video.
Target word count: ${targetWordCount} words. 
IMPORTANT: Use more words to ensure it covers the entire ${requestedDuration}s.`,
                            },
                            {
                                role: "user",
                                content: `
Video Niche: ${seriesData.niche}
Duration: ${requestedDuration} seconds
Video Style: ${seriesData.video_style}

Return valid JSON:
{
  "title": "string",
  "script": "full narration script (approx ${targetWordCount} words)",
  "scenes": [
    { "text": "one sentence from the script", "image_prompt": "highly detailed image generation prompt" }
  ]
}`,
                            },
                        ],
                        response_format: { type: "json_object" },
                    }),
                });

                const data = await response.json() as any;
                if (!response.ok) {
                    console.error("Groq API Error:", response.status, data);
                    throw new Error(`Groq API Error: ${response.status} - ${data.error?.message || JSON.stringify(data)}`);
                }

                const content = data.choices?.[0]?.message?.content;
                if (!content) {
                    console.error("Groq Empty Response:", data);
                    throw new Error("No content from Groq. Check if the model or prompt is restricted.");
                }

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

            // 5. Generate Captions (Synced to ground-truth audio)
            const { captions, actualDuration } = await step.run("generate-captions", async () => {
                const { createClient } = await import("@deepgram/sdk");
                const deepgram = createClient(process.env.DEEPGRAM_API_KEY!);

                // 1. Fetch the voice buffer from storage or re-fetch it (re-refetching here for simplicity)
                // In a production app, we might pass the buffer or path better.
                // For now, let's use the local voiceUrl from the previous step.
                const voiceResponse = await fetch(voiceUrl);
                const voiceBuffer = Buffer.from(await voiceResponse.arrayBuffer());

                // 2. Transcribe to get perfect timestamps
                const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
                    voiceBuffer,
                    {
                        model: "nova-2",
                        smart_format: true,
                        utterances: true,
                        punctuate: true,
                    }
                );

                if (error) throw error;

                const words = result.results?.channels[0]?.alternatives[0]?.words || [];
                if (words.length === 0) throw new Error("No transcription words found");

                const lastWord = words[words.length - 1];
                const realDurationMs = (lastWord.end || 0) * 1000;

                // 3. Map transcription words back to original scenes
                // We'll group words by text similarity to match scenes
                const segments: any[] = [];
                let currentWordIndex = 0;

                for (const scene of scriptData.scenes) {
                    const sceneTextWords = scene.text.split(/\s+/).filter(Boolean).length;
                    const sceneWords = words.slice(currentWordIndex, currentWordIndex + sceneTextWords);
                    
                    if (sceneWords.length > 0) {
                        segments.push({
                            text: scene.text,
                            start: (sceneWords[0].start || 0) * 1000,
                            end: (sceneWords[sceneWords.length - 1].end || 0) * 1000,
                        });
                        currentWordIndex += sceneTextWords;
                    }
                }

                return { 
                    captions: segments.length > 0 ? segments : words.map((w: any) => ({ text: w.punctuated_word || w.word, start: w.start * 1000, end: w.end * 1000 })),
                    actualDuration: realDurationMs / 1000 
                };
            });

            // 6. Final mark as completed (Update with ACTUAL duration)
            await step.run("finalize-video", async () => {
                const supabase = createServiceRoleClient();
                const { error } = await supabase.from("generated_videos").update({
                    captions,
                    status: "completed",
                    // Use actual audio duration if it's within a reasonable range of requested
                    // This ensures no silence at the end.
                }).eq("id", videoId);
                
                // Also update the series duration if we want high precision
                // But safer to just pass it as a prop to Remotion in the next step
                
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

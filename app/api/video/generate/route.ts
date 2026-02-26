import { inngest } from "../../../../lib/inngest/client";
import { createServiceRoleClient } from "@/utils/supabase/service";
import fetch from "node-fetch";
import {
    renderMediaOnLambda,
    getRenderProgress,
} from "@remotion/lambda/client";

export const generateVideo = inngest.createFunction(
    { id: "generate-video", retries: 0 },
    { event: "video/generate.requested" },
    async ({ event, step }) => {
        const { seriesId } = event.data;

        // Run: fetch-series-data
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

        // Run: create-video-record (placeholder with "generating" status)
        const videoRecord = await step.run("create-video-record", async () => {
            const supabase = createServiceRoleClient();
            const { data, error } = await supabase
                .from("generated_videos")
                .insert({
                    series_id: seriesData.id,
                    title: "Generating...",
                    script: "",
                    voice_url: "",
                    voice_model: "",
                    captions: [],
                    image_urls: [],
                    status: "generating",
                    created_at: new Date().toISOString(),
                })
                .select()
                .single();
            if (error) throw new Error(`Failed to create video record: ${error.message}`);
            return data;
        });

        // Run: generate-video-script
        const scriptData = await step.run("generate-video-script", async () => {
            // Helper function to generate the prompt
            const generateScriptPrompt = (niche: string, duration: number, videoStyle: string) => {
                // Determine number of scenes based on duration
                let numScenes = 4; // Default for 30-40 seconds
                if (duration >= 60 && duration <= 70) {
                    numScenes = 6; // 5-6 scenes for 60-70 seconds
                } else if (duration > 40 && duration < 60) {
                    numScenes = 5; // 5 scenes for medium duration
                }

                return `Create a ${duration}-second video script for a ${niche} niche video in ${videoStyle} style.

Requirements:
- Generate exactly ${numScenes} scenes
- Total video duration: ${duration} seconds
- Script must be natural and conversational for voiceover
- Each scene should have engaging text that flows smoothly to the next
- Image prompts should be detailed and suitable for Stable Diffusion XL

Return valid JSON with this exact structure:
{
  "title": "A catchy, click-worthy title for the video (max 60 characters)",
  "script": "The complete narration script that combines all scenes into one flowing voiceover script. Make it sound natural when spoken.",
  "scenes": [
    {
      "text": "The narration text for this specific scene (part of the overall script)",
      "image_prompt": "Detailed image generation prompt for Stable Diffusion XL including style, composition, lighting, and mood based on the niche and video style"
    }
  ]
}

Video Niche: ${niche}
Video Style: ${videoStyle}
Duration: ${duration} seconds
Number of scenes needed: ${numScenes}

Important:
- Make the script flow naturally when read aloud - use conversational language
- Each scene's text should be a logical segment of the overall script
- Image prompts should be vivid and detailed for AI image generation
- Ensure the total script length matches the duration (approx 2-3 words per second)`;
            };

            const prompt = generateScriptPrompt(
                seriesData.niche,
                seriesData.duration,
                seriesData.video_style
            );

            // Call Groq API
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
                            content: "You are a professional short-form video script writer. Return ONLY valid JSON, no markdown, no code fences, no additional text.",
                        },
                        {
                            role: "user",
                            content: prompt,
                        },
                    ],
                    temperature: 0.7,
                    max_tokens: 2048,
                    response_format: { type: "json_object" },
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Groq API error: ${response.status} - ${errorText}`);
            }

            const data = await response.json() as any;
            const content = data.choices?.[0]?.message?.content;

            if (!content) throw new Error("No content from Groq");

            try {
                // Clean the JSON string if needed
                let jsonStr = content;
                jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '');
                jsonStr = jsonStr.replace(/^['"]+|['"]+$/g, '');
                jsonStr = jsonStr.trim();

                const parsedContent = JSON.parse(jsonStr);

                // Validate the structure
                if (!parsedContent.title || !parsedContent.script || !Array.isArray(parsedContent.scenes)) {
                    throw new Error("Invalid response structure from Groq");
                }

                // Validate each scene has required fields
                parsedContent.scenes.forEach((scene: any, index: number) => {
                    if (!scene.text || !scene.image_prompt) {
                        throw new Error(`Scene ${index} missing required fields`);
                    }
                });

                return parsedContent;
            } catch (parseError) {
                console.error("Failed to parse Groq response:", content);
                throw new Error(`Failed to parse script JSON: ${parseError}`);
            }
        });

        // Run: generate-voice
        const voiceData = await step.run("generate-voice", async () => {
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

            return {
                url: publicUrl.publicUrl,
                voice: seriesData.voice || "aura-asteria-en"
            };
        });

        // Run: generate-captions (typically takes ~83ms)
        const captions = await step.run("generate-captions", async () => {
            const totalDurationMs = seriesData.duration * 1000; // Convert seconds to milliseconds
            const numberOfScenes = scriptData.scenes.length;

            // Calculate duration per scene in milliseconds
            const sceneDurationMs = Math.floor(totalDurationMs / numberOfScenes);

            // Generate captions with proper start and end times
            return scriptData.scenes.map((scene: any, index: number) => {
                const start = index * sceneDurationMs;
                const end = (index + 1) * sceneDurationMs;

                return {
                    text: scene.text,
                    start: start,
                    end: end
                };
            });
        });

        // Run: generate-images
        const imageUrls = await step.run("generate-images", async () => {
            const supabase = createServiceRoleClient();
            const hfApiKey = process.env.HF_API_KEY!;

            const uploadedImages: string[] = [];

            for (const [index, scene] of scriptData.scenes.entries()) {
                // Add a nested step for each image generation to track progress
                await step.run(`generate-image-${index + 1}`, async () => {
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

                    const arrayBuffer = await response.arrayBuffer();
                    const imageBuffer = Buffer.from(arrayBuffer);

                    if (imageBuffer.length === 0) {
                        throw new Error(`Empty image returned for scene: ${scene.text}`);
                    }

                    const fileName = `scene-${seriesData.id}-${Date.now()}-${index + 1}.png`;
                    const { error } = await supabase.storage
                        .from("images")
                        .upload(fileName, imageBuffer, { contentType: "image/png" });
                    if (error) throw error;

                    const { data } = supabase.storage.from("images").getPublicUrl(fileName);
                    uploadedImages.push(data.publicUrl);

                    return { success: true, imageUrl: data.publicUrl };
                });
            }

            return uploadedImages;
        });

        // Run: save-to-database (update the placeholder record)
        const savedRecord = await step.run("save-to-database", async () => {
            const supabase = createServiceRoleClient();
            const { data, error } = await supabase
                .from("generated_videos")
                .update({
                    title: scriptData.title,
                    script: scriptData.script,
                    voice_url: voiceData.url,
                    voice_model: voiceData.voice,
                    captions,
                    image_urls: imageUrls,
                    caption_style: seriesData.caption_style || "pop",
                    status: process.env.USE_LOCAL_RENDER === "true" ? "ready_for_local_render" : "rendering",
                })
                .eq("id", videoRecord.id)
                .select()
                .single();

            if (error) throw error;
            return data;
        });

        // Run: render-video — compose final video using Remotion Lambda
        const renderResult = await step.run("render-video", async () => {
            if (process.env.USE_LOCAL_RENDER === "true") {
                return { skipped: true, method: "local" };
            }

            const region = (process.env.REMOTION_AWS_REGION || "us-east-1") as "us-east-1";
            const functionName = process.env.REMOTION_LAMBDA_FUNCTION_NAME!;
            const serveUrl = `https://remotionlambda-${region.replace(/-/g, "")}.s3.${region}.amazonaws.com/sites/${process.env.REMOTION_SITE_NAME || "visioncraft-video"}/index.html`;

            const { renderId, bucketName } = await renderMediaOnLambda({
                region,
                functionName,
                serveUrl,
                composition: "VideoComposition",
                codec: "h264",
                inputProps: {
                    images: imageUrls,
                    captions,
                    voiceUrl: voiceData.url,
                    captionStyleId: seriesData.caption_style || "pop",
                    durationInSeconds: seriesData.duration,
                },
            });

            // Poll for render completion
            let progress = 0;
            while (progress < 1) {
                const status = await getRenderProgress({
                    renderId,
                    bucketName,
                    functionName,
                    region,
                });

                if (status.fatalErrorEncountered) {
                    throw new Error(
                        `Render failed: ${status.errors?.[0]?.message ?? "Unknown error"}`
                    );
                }

                progress = status.overallProgress;

                if (progress < 1) {
                    await new Promise((resolve) => setTimeout(resolve, 2000));
                }

                // If done, return the output URL
                if (status.done && status.outputFile) {
                    return {
                        outputUrl: status.outputFile,
                        renderId,
                        bucketName,
                    };
                }
            }

            throw new Error("Render completed but no output file found");
        });

        // Run: upload-final-video — download from S3 and upload to Supabase
        const videoUrl = await step.run("upload-final-video", async () => {
            if (process.env.USE_LOCAL_RENDER === "true") {
                return null;
            }

            const supabase = createServiceRoleClient();
            const result = renderResult as { outputUrl: string };

            // Download the rendered video from S3/CloudFront
            const response = await fetch(result.outputUrl);
            if (!response.ok) {
                throw new Error(`Failed to download rendered video: ${response.status}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const videoBuffer = Buffer.from(arrayBuffer);

            if (videoBuffer.length === 0) {
                throw new Error("Downloaded video is empty");
            }

            // Upload to Supabase Storage
            const fileName = `video-${seriesData.id}-${Date.now()}.mp4`;
            const { error: uploadError } = await supabase.storage
                .from("videos")
                .upload(fileName, videoBuffer, { contentType: "video/mp4" });

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = supabase.storage
                .from("videos")
                .getPublicUrl(fileName);

            // Update the video record with the final URL and completed status
            const { error: updateError } = await supabase
                .from("generated_videos")
                .update({
                    video_url: publicUrlData.publicUrl,
                    status: "completed",
                })
                .eq("id", videoRecord.id);

            if (updateError) throw updateError;

            return publicUrlData.publicUrl;
        });

        // Finalization: Update series status or perform cleanup
        await step.run("finalization", async () => {
            const supabase = createServiceRoleClient();

            // Update the video series to mark as processed
            const { error: updateError } = await supabase
                .from("video_series")
                .update({
                    last_generated_at: new Date().toISOString(),
                    status: "completed"
                })
                .eq("id", seriesData.id);

            if (updateError) {
                console.error("Failed to update series status:", updateError);
            }

            console.log(`Video generation completed for series ${seriesData.id}:`, {
                title: scriptData.title,
                scenes: scriptData.scenes.length,
                videoId: savedRecord.id,
                videoUrl,
            });

            return {
                finalized: true,
                seriesId: seriesData.id,
                videoId: savedRecord.id,
                videoUrl,
                timestamp: new Date().toISOString()
            };
        });

        return {
            success: true,
            message: "Video generation workflow completed successfully",
            data: {
                seriesId: seriesData.id,
                videoId: savedRecord.id,
                title: scriptData.title,
                scenes: scriptData.scenes.length,
                voiceUrl: voiceData.url,
                videoUrl,
                imageCount: imageUrls.length
            }
        };
    }
);
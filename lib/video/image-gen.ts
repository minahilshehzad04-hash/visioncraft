import fetch from "node-fetch";

export async function generateResilientImage(prompt: string, hfApiKey: string): Promise<Buffer> {
    console.log(`Attempting to generate image for prompt: "${prompt}"`);

    // 1. Attempt Hugging Face (Primary)
    try {
        const hfResponse = await fetch(
            "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${hfApiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ inputs: prompt }),
            }
        );

        if (hfResponse.ok) {
            const arrayBuffer = await hfResponse.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            if (buffer.length > 0) {
                console.log("Successfully generated image via HF (FLUX.1-schnell)");
                return buffer;
            }
        } else {
            const err = await hfResponse.text();
            console.warn(`HF Primary failed (${hfResponse.status}): ${err}`);
            
            // If it's a credit issue, we fall back
            if (hfResponse.status === 402 || hfResponse.status === 403 || hfResponse.status === 429) {
                console.log("Credit/Quota issue detected, falling back...");
            } else {
                // For other errors, maybe try next provider anyway
            }
        }
    } catch (e: any) {
        console.error("HF Primary error:", e.message);
    }

    // 2. Fallback to Pollinations.ai (Free/Unauthenticated)
    // Note: Pollinations can be flaky, so we try it but have a final fallback
    try {
        console.log("Attempting fallback to Pollinations.ai...");
        const encodedPrompt = encodeURIComponent(prompt);
        const pollResponse = await fetch(`https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
        });

        if (pollResponse.ok) {
            const arrayBuffer = await pollResponse.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            if (buffer.length > 0) {
                console.log("Successfully generated image via Pollinations.ai");
                return buffer;
            }
        } else {
            console.warn(`Pollinations failed (${pollResponse.status})`);
        }
    } catch (e: any) {
        console.error("Pollinations fallback error:", e.message);
    }

    // 3. Final Fallback: Static High-Quality Placeholder or LoremFlickr
    // This ensures the video can ALWAYS render even if all AI generation is down.
    try {
        console.log("All AI generation failed. Using high-quality placeholder fallback...");
        const fallbackResponse = await fetch(`https://loremflickr.com/1024/1024/abstract,technology?lock=${Math.floor(Math.random() * 1000)}`);
        if (fallbackResponse.ok) {
             const arrayBuffer = await fallbackResponse.arrayBuffer();
             const buffer = Buffer.from(arrayBuffer);
             console.log("Successfully retrieved fallback image from LoremFlickr");
             return buffer;
        }
    } catch (e: any) {
        console.error("Final fallback error:", e.message);
    }

    throw new Error("Failed to generate image through all available providers.");
}

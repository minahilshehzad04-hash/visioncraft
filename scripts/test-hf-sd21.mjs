import fetch from "node-fetch";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config({ path: ".env.local" });

const hfApiKey = process.env.HF_API_KEY;

async function testHFSD21() {
    console.log("Testing HF with stabilityai/stable-diffusion-2-1...");
    try {
        const response = await fetch(
            "https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-2-1",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${hfApiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ inputs: "A beautiful sunset over a cyberpunk city" }),
            }
        );

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`HF image error: ${response.status} - ${err}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        fs.writeFileSync("test-hf-sd21.png", buffer);
        console.log("Image saved to test-hf-sd21.png");
    } catch (error) {
        console.error("HF Test Error:", error.message);
    }
}

testHFSD21();

import fetch from "node-fetch";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config({ path: ".env.local" });

const hfApiKey = process.env.HF_API_KEY;

async function testHFSDv15() {
    console.log("Testing HF with runwayml/stable-diffusion-v1-5...");
    try {
        const response = await fetch(
            "https://router.huggingface.co/hf-inference/models/runwayml/stable-diffusion-v1-5",
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
        fs.writeFileSync("test-hf-sd15.png", buffer);
        console.log("Image saved to test-hf-sd15.png");
    } catch (error) {
        console.error("HF Test Error:", error.message);
    }
}

testHFSDv15();

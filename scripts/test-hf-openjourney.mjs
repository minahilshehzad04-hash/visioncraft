import fetch from "node-fetch";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config({ path: ".env.local" });

const hfApiKey = process.env.HF_API_KEY;

async function testOpenJourney() {
    console.log("Testing HF with prompthero/openjourney...");
    try {
        const response = await fetch(
            "https://router.huggingface.co/hf-inference/models/prompthero/openjourney",
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
        fs.writeFileSync("test-hf-openjourney.png", buffer);
        console.log("Image saved to test-hf-openjourney.png");
    } catch (error) {
        console.error("HF Test Error:", error.message);
    }
}

testOpenJourney();

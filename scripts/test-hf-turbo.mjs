import fetch from "node-fetch";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config({ path: ".env.local" });

const hfApiKey = process.env.HF_API_KEY;

async function testSDTurbo() {
    console.log("Testing HF with stabilityai/sd-turbo...");
    try {
        const response = await fetch(
            "https://router.huggingface.co/hf-inference/models/stabilityai/sd-turbo",
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
        fs.writeFileSync("test-hf-turbo.png", buffer);
        console.log("Image saved to test-hf-turbo.png");
    } catch (error) {
        console.error("HF Test Error:", error.message);
    }
}

testSDTurbo();

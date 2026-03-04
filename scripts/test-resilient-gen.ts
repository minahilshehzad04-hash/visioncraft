import { generateResilientImage } from "../lib/video/image-gen.ts";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config({ path: ".env.local" });

const hfApiKey = process.env.HF_API_KEY;

async function testResilience() {
    console.log("Testing Resilient Image Generation...");
    try {
        const prompt = "A futuristic city in the clouds";
        const buffer = await generateResilientImage(prompt, hfApiKey || "");
        
        if (buffer && buffer.length > 0) {
            fs.writeFileSync("test-resilient-output.png", buffer);
            console.log("SUCCESS: Image captured and saved to test-resilient-output.png");
        } else {
            console.error("FAILURE: Returned buffer is empty");
        }
    } catch (error) {
        console.error("Verification Script Error:", error.message);
    }
}

testResilience();

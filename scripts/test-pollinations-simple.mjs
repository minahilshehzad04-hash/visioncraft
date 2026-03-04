import fetch from "node-fetch";
import fs from "fs";

async function testPollinations() {
    console.log("Testing Pollinations.ai (simple)...");
    try {
        const prompt = "cyan_dream_landscape";
        const url = `https://image.pollinations.ai/prompt/${prompt}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Pollinations error: ${response.status} ${response.statusText}`);
        }

        const buffer = await response.buffer();
        fs.writeFileSync("test-pollinations-simple.png", buffer);
        console.log("Image saved to test-pollinations-simple.png");
    } catch (error) {
        console.error("Pollinations Test Error:", error.message);
    }
}

testPollinations();

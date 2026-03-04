import fetch from "node-fetch";
import fs from "fs";

async function testPollinations() {
    console.log("Testing Pollinations.ai with User-Agent...");
    try {
        const prompt = encodeURIComponent("A beautiful sunset over a cyberpunk city");
        const response = await fetch(`https://image.pollinations.ai/prompt/${prompt}?width=1024&height=1024&nologo=true`, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
        });
        
        if (!response.ok) {
            throw new Error(`Pollinations error: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        fs.writeFileSync("test-pollinations.png", buffer);
        console.log("Image saved to test-pollinations.png");
    } catch (error) {
        console.error("Pollinations Test Error:", error.message);
    }
}

testPollinations();

import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
    console.error("OPENAI_API_KEY not found in .env.local");
    process.exit(1);
}

const openai = new OpenAI({ apiKey });

async function testOpenAI() {
    console.log("Testing OpenAI DALL-E 3...");
    try {
        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: "A beautiful sunset over a cyberpunk city",
            n: 1,
            size: "1024x1024",
        });

        console.log("Image URL:", response.data[0].url);
    } catch (error) {
        console.error("OpenAI Test Error:", error.message);
    }
}

testOpenAI();

import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

async function listModels() {
    try {
        // The SDK doesn't have a direct listModels, we might need to use fetch or a different approach
        // But let's check what's available under common names
        const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro-vision"];
        for (const m of models) {
             try {
                const model = genAI.getGenerativeModel({ model: m });
                console.log(`Model ${m} check...`);
                // just a dummy call
             } catch (e) {}
        }
        
        // Actually, let's use the REST API to list models
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await resp.json();
        console.log("Available Models:", JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("List Models Error:", error);
    }
}

listModels();

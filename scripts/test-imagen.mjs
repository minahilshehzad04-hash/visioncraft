import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config({ path: ".env.local" });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

async function testImagen() {
    console.log("Testing Imagen 3...");
    try {
        const model = genAI.getGenerativeModel({ model: "imagen-3.0-generate-001" });
        const result = await model.generateContent("A beautiful sunset over a cyberpunk city");
        
        console.log("Result received.");
        const imagePart = result.response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        
        if (imagePart) {
            console.log("Image data found!");
            const buffer = Buffer.from(imagePart.inlineData.data, "base64");
            fs.writeFileSync("test-gemini-image.png", buffer);
            console.log("Image saved to test-gemini-image.png");
        } else {
            console.log("No image data in response.");
            console.log("Full response:", JSON.stringify(result.response, null, 2));
        }
    } catch (error) {
        console.error("Imagen Test Error:", error);
    }
}

testImagen();

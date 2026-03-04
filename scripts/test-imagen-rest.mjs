import fetch from "node-fetch";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config({ path: ".env.local" });

const apiKey = process.env.GEMINI_API_KEY;

async function testImagen() {
    console.log("Testing Imagen 3 (002) with predict...");
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                instances: [
                    { prompt: "A beautiful sunset over a cyberpunk city" }
                ],
                parameters: {
                    sampleCount: 1
                }
            })
        });

        const data = await response.json();
        if (data.predictions && data.predictions[0]) {
            console.log("Image data found!");
            const buffer = Buffer.from(data.predictions[0].bytesBase64Encoded, "base64");
            fs.writeFileSync("test-gemini-image.png", buffer);
            console.log("Image saved to test-gemini-image.png");
        } else {
            console.log("No image data in response.");
            console.log("Full response:", JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error("Imagen Test Error:", error);
    }
}

testImagen();

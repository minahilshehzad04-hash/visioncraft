import fetch from "node-fetch";
import fs from "fs";

async function testLexica() {
    console.log("Testing Lexica.art search...");
    try {
        const prompt = "A beautiful sunset over a cyberpunk city";
        const response = await fetch(`https://lexica.art/api/v1/search?q=${encodeURIComponent(prompt)}`);
        
        if (!response.ok) {
            throw new Error(`Lexica error: ${response.status}`);
        }

        const data = await response.json();
        if (data.images && data.images.length > 0) {
            console.log(`Found ${data.images.length} images matches.`);
            console.log("Top image URL:", data.images[0].src);
            
            // Download the top image
            const imgResponse = await fetch(data.images[0].src);
            const buffer = await imgResponse.buffer();
            fs.writeFileSync("test-lexica-image.jpg", buffer);
            console.log("Image saved to test-lexica-image.jpg");
        } else {
            console.log("No images found for prompt.");
        }
    } catch (error) {
        console.error("Lexica Test Error:", error.message);
    }
}

testLexica();

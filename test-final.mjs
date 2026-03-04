import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function test() {
    const apiKey = process.env.PLUNK_API_KEY;
    console.log("🚀 Testing Plunk with API Key:", apiKey?.substring(0, 10) + "...");

    const response = await fetch("https://api.useplunk.com/v1/track", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            event: "test-notification",
            email: "fa22-bse-089@cuilahore.edu.pk",
            data: { message: "System integration test successful" }
        })
    });

    const body = await response.json();
    console.log("Result:", body);
}

test().catch(console.error);

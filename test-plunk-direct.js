const fetch = require("node-fetch");
const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

async function test() {
    const PLUNK_API_KEY = process.env.PLUNK_API_KEY;
    console.log("🚀 Testing Plunk API Key directly...");

    if (!PLUNK_API_KEY) {
        console.error("❌ PLUNK_API_KEY is missing in .env.local");
        return;
    }

    try {
        const response = await fetch("https://api.useplunk.com/v1/track", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${PLUNK_API_KEY}`
            },
            body: JSON.stringify({
                event: "test-notification",
                email: "fa22-bse-089@cuilahore.edu.pk",
                data: {
                    videoTitle: "Direct Test Video",
                    seriesName: "Stability Test"
                }
            })
        });

        const text = await response.text();
        if (response.ok) {
            console.log("✅ Plunk API accepted the event!", text);
        } else {
            console.error(`❌ Plunk API responded with ${response.status}:`, text);
        }
    } catch (error) {
        console.error("❌ Network error:", error.message);
    }
}

test();

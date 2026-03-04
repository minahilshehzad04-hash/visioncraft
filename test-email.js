const { sendVideoReadyEmail } = require("./utils/email");
const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

async function test() {
    console.log("🚀 Testing Plunk Email Integration...");
    try {
        const result = await sendVideoReadyEmail({
            email: "fa22-bse-089@cuilahore.edu.pk",
            videoTitle: "Test Video",
            seriesName: "Test Series",
            thumbnailUrl: "https://fmfcjzifyqexhzwafjea.supabase.co/storage/v1/object/public/images/placeholder.png",
            videoPageUrl: "http://localhost:3000/dashboard/videos"
        });
        console.log("✅ Email sent successfully!", result);
    } catch (error) {
        console.error("❌ Failed to send email:", error);
    }
}

test();

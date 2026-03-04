import Plunk from "@plunk/node";

interface SendEmailProps {
    email: string;
    videoTitle: string;
    seriesName: string;
    thumbnailUrl: string;
    videoPageUrl: string;
    downloadUrl?: string;
}

export async function sendVideoReadyEmail({
    email,
    videoTitle,
    seriesName,
    thumbnailUrl,
    videoPageUrl,
    downloadUrl
}: SendEmailProps) {
    const apiKey = process.env.PLUNK_API_KEY?.trim();

    if (!apiKey) {
        console.error("❌ PLUNK_API_KEY is missing or empty");
        throw new Error("PLUNK_API_KEY is not configured");
    }

    const plunk = new Plunk(apiKey);

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Video is Ready!</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e5e7eb; }
            .header { background: linear-gradient(135deg, #2563eb, #7c3aed); padding: 40px 20px; text-align: center; color: white; }
            .content { padding: 32px; text-align: center; }
            .thumbnail-container { margin: 24px 0; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb; line-height: 0; }
            .thumbnail { width: 100%; height: auto; display: block; }
            .title { font-size: 24px; font-weight: 800; color: #111827; margin-bottom: 8px; }
            .subtitle { font-size: 16px; color: #6b7280; margin-bottom: 24px; }
            .button-container { display: flex; flex-direction: column; gap: 12px; align-items: center; }
            .btn { display: inline-block; padding: 12px 32px; border-radius: 12px; font-weight: 700; text-decoration: none; transition: all 0.2s; text-align: center; width: 80%; }
            .btn-primary { background-color: #2563eb; color: white; box-shadow: 0 4px 14px 0 rgba(37, 99, 235, 0.39); }
            .btn-secondary { background-color: #f3f4f6; color: #374151; border: 1px solid #e5e7eb; }
            .footer { padding: 24px; text-align: center; font-size: 12px; color: #9ca3af; background-color: #f9fafb; border-top: 1px solid #e5e7eb; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="margin:0; font-size: 28px; font-weight: 900; letter-spacing: -0.025em;">VisionCraft</h1>
            </div>
            <div class="content">
                <div class="title">Your video is ready to view</div>
                <div class="subtitle">"${videoTitle}" from your <b>${seriesName}</b> series is now complete and ready for download.</div>
                
                <div class="thumbnail-container">
                    <img src="${thumbnailUrl}" alt="Video Thumbnail" class="thumbnail" />
                </div>

                <div class="button-container">
                    <a href="${videoPageUrl}" class="btn btn-primary">View in Dashboard</a>
                    ${downloadUrl ? `<a href="${downloadUrl}" class="btn btn-secondary">Download MP4</a>` : ''}
                </div>
            </div>
            <div class="footer">
                &copy; ${new Date().getFullYear()} VisionCraft AI. All rights reserved.<br>
                This is an automated notification from your VisionCraft workspace.
            </div>
        </div>
    </body>
    </html>
    `;

    console.log(`📡 Sending Plunk email to: ${email} for video: ${videoTitle}`);

    try {
        const response = await plunk.emails.send({
            to: email,
            subject: `🎬 Video Ready: ${videoTitle}`,
            body: html,
        });
        console.log(`✅ Plunk email sent successfully to ${email}`);
        return response;
    } catch (error) {
        console.error(`❌ Plunk email failed for ${email}:`, error);
        throw error;
    }
}

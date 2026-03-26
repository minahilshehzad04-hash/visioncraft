import { NextResponse } from "next/server";
import { languages, videoStyles, backgroundMusic } from "@/lib/constants";
import { captionStyles } from "@/lib/caption-styles";

export async function POST(req: Request) {
    try {
        const { prompt } = await req.json();

        if (!prompt) {
            return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
        }

        const groqPrompt = `
You are an expert video producer. Your task is to take a user's prompt and extract/generate a complete video series configuration.

USER PROMPT: "${prompt}"

Available Configuration Options:
- Video Styles: ${videoStyles.map(s => `${s.id} (${s.name}: ${s.description})`).join(", ")}
- Languages: ${languages.map(l => l.language).join(", ")}
- Caption Styles: ${captionStyles.map(s => `${s.id} (${s.name}: ${s.description})`).join(", ")}
- Background Music: ${backgroundMusic.map(m => `${m.id} (${m.name})`).join(", ")}

Task:
1. Extract or infer the best "niche" (a short 1-3 word topic).
2. Choose the most suitable "videoStyle" from the list above.
3. Choose the "language" (default to English if not specified).
4. Extract or infer the "duration" in seconds (as a string, e.g., "30-40" or "60").
5. Choose a "captionStyle" from the list above.
6. Generate a catchy "seriesName" (max 30 characters).
7. Determine the "platform" (shorts, tiktok, instagram, youtube - default to shorts).
8. Pick up to 2 "musicIds" from the list above.

Return ONLY valid JSON with this structure:
{
  "niche": "string",
  "videoStyle": "string",
  "language": "string",
  "duration": "string",
  "captionStyle": "string",
  "seriesName": "string",
  "platform": "string",
  "musicIds": ["string"]
}

Rule: If details are missing, use your best creative judgment based on the prompt.
Return ONLY JSON. No other text.
`;

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.GROQ_API_KEY!}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                messages: [
                    {
                        role: "system",
                        content: "You are a professional video configuration agent. Return ONLY valid JSON.",
                    },
                    {
                        role: "user",
                        content: groqPrompt,
                    },
                ],
                temperature: 0.5,
                max_tokens: 1024,
                response_format: { type: "json_object" },
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json({ error: `Groq error: ${errorText}` }, { status: 500 });
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            return NextResponse.json({ error: "No response from AI" }, { status: 500 });
        }

        return NextResponse.json(JSON.parse(content));
    } catch (error: any) {
        console.error("Expand Prompt Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

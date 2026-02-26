/**
 * Reusable Caption Style Definitions
 * Used in both the creation wizard (preview) and Remotion (video rendering).
 *
 * Each style defines:
 *  - Visual properties (colors, fonts, shadows)
 *  - Animation keyframes (CSS-based for preview, mapped to Remotion spring/interpolate for rendering)
 */

export interface CaptionStyle {
    id: string;
    name: string;
    description: string;
    /** Base text styles */
    fontSize: number;
    fontWeight: number;
    fontFamily: string;
    color: string;
    /** Optional text stroke / outline */
    textStroke?: string;
    /** Optional text shadow for depth */
    textShadow?: string;
    /** Optional background behind each word */
    wordBackground?: string;
    wordBorderRadius?: number;
    wordPadding?: string;
    /** CSS animation name (defined in caption-animations.css) */
    animationName: string;
    /** Base animation duration in ms per word */
    animationDuration: number;
    /** Stagger delay between words in ms */
    staggerDelay: number;
    /** Preview sentence shown in the wizard */
    previewText: string;
}

export const captionStyles: CaptionStyle[] = [
    {
        id: "pop",
        name: "Pop",
        description: "Words pop in with a punchy scale effect",
        fontSize: 28,
        fontWeight: 900,
        fontFamily: "'Inter', sans-serif",
        color: "#FFFFFF",
        textStroke: "2px #000000",
        textShadow: "0 4px 12px rgba(0,0,0,0.5)",
        animationName: "captionPop",
        animationDuration: 400,
        staggerDelay: 150,
        previewText: "This is how pop looks",
    },
    {
        id: "karaoke",
        name: "Karaoke",
        description: "Words highlight with a colorful fill sweep",
        fontSize: 28,
        fontWeight: 800,
        fontFamily: "'Inter', sans-serif",
        color: "#FFFFFF",
        wordBackground: "linear-gradient(135deg, #6366f1, #8b5cf6)",
        wordBorderRadius: 8,
        wordPadding: "4px 12px",
        textShadow: "0 2px 8px rgba(99,102,241,0.4)",
        animationName: "captionKaraoke",
        animationDuration: 500,
        staggerDelay: 200,
        previewText: "Sing along with me",
    },
    {
        id: "bounce",
        name: "Bounce",
        description: "Words bounce up from below with spring energy",
        fontSize: 28,
        fontWeight: 800,
        fontFamily: "'Inter', sans-serif",
        color: "#FACC15",
        textStroke: "2px #000000",
        textShadow: "0 4px 16px rgba(250,204,21,0.3)",
        animationName: "captionBounce",
        animationDuration: 600,
        staggerDelay: 120,
        previewText: "Bouncing words here",
    },
    {
        id: "glow",
        name: "Neon Glow",
        description: "Words fade in with a vibrant neon glow",
        fontSize: 28,
        fontWeight: 700,
        fontFamily: "'Inter', sans-serif",
        color: "#22D3EE",
        textShadow: "0 0 8px #22D3EE, 0 0 20px #06B6D4, 0 0 40px #0891B2",
        animationName: "captionGlow",
        animationDuration: 500,
        staggerDelay: 180,
        previewText: "Glowing in the dark",
    },
    {
        id: "typewriter",
        name: "Typewriter",
        description: "Words appear one-by-one like being typed",
        fontSize: 26,
        fontWeight: 600,
        fontFamily: "'Courier New', monospace",
        color: "#F0FDF4",
        wordBackground: "rgba(0,0,0,0.6)",
        wordBorderRadius: 4,
        wordPadding: "4px 10px",
        animationName: "captionTypewriter",
        animationDuration: 300,
        staggerDelay: 250,
        previewText: "Typing each word out",
    },
    {
        id: "wave",
        name: "Wave",
        description: "Words ripple in with a smooth wave motion",
        fontSize: 28,
        fontWeight: 800,
        fontFamily: "'Inter', sans-serif",
        color: "#F472B6",
        textStroke: "1.5px #000000",
        textShadow: "0 4px 12px rgba(244,114,182,0.4)",
        animationName: "captionWave",
        animationDuration: 700,
        staggerDelay: 100,
        previewText: "Riding the wave now",
    },
];

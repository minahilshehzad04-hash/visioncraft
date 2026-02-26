import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { captionStyles, type CaptionStyle } from "../lib/caption-styles";

export interface CaptionSegment {
    text: string;
    start: number; // ms
    end: number;   // ms
}

interface CaptionOverlayProps {
    captions: CaptionSegment[];
    captionStyleId: string;
}

/**
 * Splits text into chunks of 2–3 words each.
 */
function splitIntoWordChunks(text: string, chunkSize: number = 3): string[] {
    const words = text.split(/\s+/).filter(Boolean);
    const chunks: string[] = [];
    for (let i = 0; i < words.length; i += chunkSize) {
        chunks.push(words.slice(i, i + chunkSize).join(" "));
    }
    return chunks;
}

export const CaptionOverlay: React.FC<CaptionOverlayProps> = ({
    captions,
    captionStyleId,
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Find the matching style (default to "pop")
    const style: CaptionStyle =
        captionStyles.find((s) => s.id === captionStyleId) ?? captionStyles[0];

    const currentTimeMs = (frame / fps) * 1000;

    // Find active caption segment
    const activeCaption = captions.find(
        (c) => currentTimeMs >= c.start && currentTimeMs < c.end
    );

    if (!activeCaption) return null;

    const segmentDurationMs = activeCaption.end - activeCaption.start;
    const timeIntoSegmentMs = currentTimeMs - activeCaption.start;

    // Split caption text into 2–3 word chunks
    const chunks = splitIntoWordChunks(activeCaption.text, 3);
    const chunkDurationMs = segmentDurationMs / chunks.length;

    // Find active chunk
    const activeChunkIndex = Math.min(
        Math.floor(timeIntoSegmentMs / chunkDurationMs),
        chunks.length - 1
    );
    const activeChunk = chunks[activeChunkIndex];

    // Animate the chunk entrance
    const chunkStartMs = activeCaption.start + activeChunkIndex * chunkDurationMs;
    const chunkFrame = Math.max(0, (currentTimeMs - chunkStartMs) / 1000 * fps);

    const entryProgress = spring({
        frame: Math.floor(chunkFrame),
        fps,
        config: { damping: 40, stiffness: 200, mass: 0.6 },
        durationInFrames: Math.ceil((style.animationDuration / 1000) * fps),
    });

    // Build animation styles based on the caption style animation type
    const animationStyles = getAnimationStyles(style.animationName, entryProgress, chunkFrame, fps);

    return (
        <div
            style={{
                position: "absolute",
                bottom: 120,
                left: 0,
                right: 0,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 10,
            }}
        >
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 8,
                    ...animationStyles,
                }}
            >
                {activeChunk.split(" ").map((word, wordIndex) => (
                    <span
                        key={`${activeChunkIndex}-${wordIndex}`}
                        style={{
                            fontSize: style.fontSize * 1.8,
                            fontWeight: style.fontWeight,
                            fontFamily: style.fontFamily,
                            color: style.color,
                            WebkitTextStroke: style.textStroke,
                            textShadow: style.textShadow,
                            ...(style.wordBackground
                                ? {
                                    background: style.wordBackground,
                                    borderRadius: style.wordBorderRadius ?? 0,
                                    padding: style.wordPadding ?? "0",
                                }
                                : {}),
                            display: "inline-block",
                            marginRight: 6,
                            textTransform: "uppercase" as const,
                        }}
                    >
                        {word}
                    </span>
                ))}
            </div>
        </div>
    );
};

function getAnimationStyles(
    animationName: string,
    progress: number,
    frame: number,
    fps: number
): React.CSSProperties {
    switch (animationName) {
        case "captionPop": {
            const scale = interpolate(progress, [0, 1], [0.3, 1]);
            return {
                opacity: progress,
                transform: `scale(${scale})`,
            };
        }
        case "captionKaraoke": {
            return {
                opacity: progress,
                transform: `translateX(${interpolate(progress, [0, 1], [-20, 0])}px)`,
            };
        }
        case "captionBounce": {
            const bounce = interpolate(progress, [0, 1], [40, 0]);
            return {
                opacity: progress,
                transform: `translateY(${bounce}px)`,
            };
        }
        case "captionGlow": {
            return {
                opacity: progress,
                filter: `brightness(${interpolate(progress, [0, 1], [2, 1])})`,
            };
        }
        case "captionTypewriter": {
            return {
                opacity: Math.round(progress),
            };
        }
        case "captionWave": {
            const wave = Math.sin(frame / fps * Math.PI * 2) * interpolate(progress, [0, 1], [8, 0]);
            return {
                opacity: progress,
                transform: `translateY(${wave}px)`,
            };
        }
        default:
            return { opacity: progress };
    }
}

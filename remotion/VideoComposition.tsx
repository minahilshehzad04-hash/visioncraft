import React from "react";
import {
    AbsoluteFill,
    Audio,
    Img,
    Sequence,
    useCurrentFrame,
    useVideoConfig,
} from "remotion";
import { CaptionOverlay, type CaptionSegment } from "./CaptionOverlay";
import {
    applyEntryAnimation,
    getEffectForScene,
    kenBurnsDrift,
} from "./animations";

export interface VideoCompositionProps {
    images: string[];
    captions: CaptionSegment[];
    voiceUrl: string;
    captionStyleId: string;
    durationInSeconds: number;
}

/** A single scene that displays one image with entry animation + Ken Burns drift. */
const SceneImage: React.FC<{
    src: string;
    sceneIndex: number;
    durationInFrames: number;
}> = ({ src, sceneIndex, durationInFrames }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const effect = getEffectForScene(sceneIndex);
    const entryStyle = applyEntryAnimation(effect, frame, fps, durationInFrames);
    const driftStyle = kenBurnsDrift(frame, fps, durationInFrames);

    // Merge styles — entry animation for first ~1s, then Ken Burns for entire duration
    const mergedTransform = [
        entryStyle.transform ?? "",
        driftStyle.transform ?? "",
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <AbsoluteFill
            style={{
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#000",
                overflow: "hidden",
            }}
        >
            <Img
                src={src}
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    opacity: entryStyle.opacity ?? 1,
                    transform: mergedTransform || undefined,
                }}
            />
        </AbsoluteFill>
    );
};

export const VideoComposition: React.FC<VideoCompositionProps> = ({
    images,
    captions,
    voiceUrl,
    captionStyleId,
    durationInSeconds,
}) => {
    const { fps } = useVideoConfig();
    const totalFrames = Math.ceil(durationInSeconds * fps);
    const sceneCount = images.length;
    const framesPerScene = Math.floor(totalFrames / sceneCount);

    return (
        <AbsoluteFill style={{ backgroundColor: "#000" }}>
            {/* Image Sequences */}
            {images.map((src, index) => {
                const from = index * framesPerScene;
                const dur =
                    index === sceneCount - 1
                        ? totalFrames - from // Last scene gets remaining frames
                        : framesPerScene;

                return (
                    <Sequence key={index} from={from} durationInFrames={dur}>
                        <SceneImage
                            src={src}
                            sceneIndex={index}
                            durationInFrames={dur}
                        />
                    </Sequence>
                );
            })}

            {/* Voiceover Audio */}
            {voiceUrl && <Audio src={voiceUrl} volume={1} />}

            {/* Caption Overlay */}
            <CaptionOverlay
                captions={captions}
                captionStyleId={captionStyleId}
            />
        </AbsoluteFill>
    );
};

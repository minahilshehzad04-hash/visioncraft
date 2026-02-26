import React from "react";
import { Composition } from "remotion";
import { VideoComposition, type VideoCompositionProps } from "./VideoComposition";

const FPS = 30;

export const RemotionRoot: React.FC = () => {
    return (
        <>
            <Composition
                id="VideoComposition"
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                component={VideoComposition as any}
                fps={FPS}
                width={1080}
                height={1920}
                durationInFrames={FPS * 30}
                defaultProps={{
                    images: [] as string[],
                    captions: [] as { text: string; start: number; end: number }[],
                    voiceUrl: "",
                    captionStyleId: "pop",
                    durationInSeconds: 30,
                }}
                calculateMetadata={({ props }) => {
                    const p = props as unknown as VideoCompositionProps;
                    const durationInSeconds = Number(p.durationInSeconds) || 30;
                    return {
                        durationInFrames: Math.ceil(durationInSeconds * FPS),
                    };
                }}
            />
        </>
    );
};


import { interpolate, spring } from "remotion";

/**
 * Animation utility functions for Remotion compositions.
 * Each function returns a CSS style object for the given frame.
 */

export function fadeIn(frame: number, fps: number, durationInFrames: number) {
    const opacity = interpolate(frame, [0, Math.min(fps * 0.8, durationInFrames)], [0, 1], {
        extrapolateRight: "clamp",
    });
    return { opacity };
}

export function zoomIn(frame: number, fps: number, durationInFrames: number) {
    const progress = spring({
        frame,
        fps,
        config: { damping: 80, stiffness: 200, mass: 0.5 },
        durationInFrames: Math.min(fps * 1.2, durationInFrames),
    });
    const scale = interpolate(progress, [0, 1], [1.3, 1]);
    const opacity = interpolate(frame, [0, fps * 0.3], [0, 1], {
        extrapolateRight: "clamp",
    });
    return { transform: `scale(${scale})`, opacity };
}

export function slideUp(frame: number, fps: number, durationInFrames: number) {
    const progress = spring({
        frame,
        fps,
        config: { damping: 60, stiffness: 150, mass: 0.8 },
        durationInFrames: Math.min(fps * 1, durationInFrames),
    });
    const translateY = interpolate(progress, [0, 1], [60, 0]);
    const opacity = interpolate(frame, [0, fps * 0.4], [0, 1], {
        extrapolateRight: "clamp",
    });
    return { transform: `translateY(${translateY}px)`, opacity };
}

export function slideDown(frame: number, fps: number, durationInFrames: number) {
    const progress = spring({
        frame,
        fps,
        config: { damping: 60, stiffness: 150, mass: 0.8 },
        durationInFrames: Math.min(fps * 1, durationInFrames),
    });
    const translateY = interpolate(progress, [0, 1], [-60, 0]);
    const opacity = interpolate(frame, [0, fps * 0.4], [0, 1], {
        extrapolateRight: "clamp",
    });
    return { transform: `translateY(${translateY}px)`, opacity };
}

/** Slow Ken Burns drift effect to keep images alive during their scene. */
export function kenBurnsDrift(frame: number, fps: number, durationInFrames: number) {
    const progress = frame / durationInFrames;
    const scale = interpolate(progress, [0, 1], [1, 1.08]);
    const x = interpolate(progress, [0, 1], [0, -10]);
    const y = interpolate(progress, [0, 1], [0, -5]);
    return { transform: `scale(${scale}) translate(${x}px, ${y}px)` };
}

/** Pick a random animation effect based on a seed index */
export type AnimationEffect = "fadeIn" | "zoomIn" | "slideUp" | "slideDown";

const effects: AnimationEffect[] = ["fadeIn", "zoomIn", "slideUp", "slideDown"];

export function getEffectForScene(sceneIndex: number): AnimationEffect {
    return effects[sceneIndex % effects.length];
}

export function applyEntryAnimation(
    effect: AnimationEffect,
    frame: number,
    fps: number,
    durationInFrames: number
): React.CSSProperties {
    switch (effect) {
        case "fadeIn":
            return fadeIn(frame, fps, durationInFrames);
        case "zoomIn":
            return zoomIn(frame, fps, durationInFrames);
        case "slideUp":
            return slideUp(frame, fps, durationInFrames);
        case "slideDown":
            return slideDown(frame, fps, durationInFrames);
        default:
            return fadeIn(frame, fps, durationInFrames);
    }
}

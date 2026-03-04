"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { Video, Calendar, PlayCircle, Film, Loader2, Download, Sparkles, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getVideos, deleteVideo } from "@/actions/video";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Player } from "@remotion/player";
import { VideoComposition } from "@/remotion/VideoComposition";

interface VideoItem {
    id: string;
    title: string;
    image_urls: string[];
    status: string;
    created_at: string;
    series_id: string;
    video_url?: string;
    captions?: any[];
    voice_url?: string;
    duration?: string | number;
    caption_style?: string;
}

interface VideoListProps {
    initialVideos: VideoItem[];
}

export function VideoList({ initialVideos }: VideoListProps) {
    const [videos, setVideos] = useState<VideoItem[]>(initialVideos);
    const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const isProcessing = videos.some((v) =>
        v.status === "generating" ||
        (v.status === "completed" && !v.video_url)
    );

    useEffect(() => {
        // Start polling if any video is still processing (generating or pending MP4)
        if (isProcessing) {
            intervalRef.current = setInterval(async () => {
                const result = await getVideos();
                if (result.success && result.data) {
                    setVideos(result.data as VideoItem[]);
                }
            }, 2000);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [isProcessing]);

    // Also sync when initialVideos changes (e.g. navigating back)
    useEffect(() => {
        setVideos(initialVideos);
    }, [initialVideos]);

    const handleDownload = (video: VideoItem) => {
        if (!video.video_url) return;

        const link = document.createElement("a");
        link.href = video.video_url;
        link.download = `${video.title || "video"}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Download started");
    };

    const handleVideoDelete = async (videoId: string) => {
        if (!confirm("Are you sure you want to delete this video?")) return;

        try {
            const result = await deleteVideo(videoId);
            if (result.success) {
                setVideos(prev => prev.filter(v => v.id !== videoId));
                toast.success("Video deleted");
            } else {
                toast.error(result.error || "Failed to delete video");
            }
        } catch (error) {
            toast.error("An error occurred while deleting");
        }
    };

    if (videos.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center bg-white border border-dashed border-gray-200 rounded-[2.5rem] p-12 animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-sm">
                <div className="h-20 w-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mb-6 shadow-glow">
                    <Film className="h-10 w-10" />
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900 mb-3 tracking-tight">No Videos Yet</h2>
                <p className="text-gray-500 text-lg font-medium max-w-sm mb-4 leading-relaxed">
                    You haven&apos;t generated any videos yet. Go to your series and click &quot;Generate Video&quot; to get started.
                </p>

                <style jsx>{`
                    .shadow-glow {
                        box-shadow: 0 0 40px rgba(37, 99, 235, 0.1);
                    }
                `}</style>
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-12 animate-in fade-in duration-700">
                {videos.map((video) => (
                    <div
                        key={video.id}
                        className="group relative bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-blue-50/50 transition-all duration-500 overflow-hidden flex flex-col"
                    >
                        {/* Thumbnail / Generating Skeleton */}
                        <div className="relative aspect-[16/10] overflow-hidden">
                            {(video.status === "failed") ? (
                                /* Failed State overlay */
                                <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center gap-4 relative">
                                    <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 via-transparent to-orange-600/20" />
                                    <div className="relative z-10 flex flex-col items-center gap-4 text-center px-6">
                                        <div className="h-16 w-16 bg-red-500/10 backdrop-blur-xl rounded-[1.5rem] flex items-center justify-center border border-red-500/20 shadow-2xl ring-1 ring-red-500/30">
                                            <div className="h-8 w-8 text-red-400 font-bold text-2xl">!</div>
                                        </div>
                                        <div className="flex flex-col items-center gap-1">
                                            <span className="text-sm font-black text-red-400 tracking-[0.2em] uppercase">
                                                Generation Failed
                                            </span>
                                            <p className="text-[10px] font-medium text-red-500/60 max-w-[150px]">
                                                Technical error occurred during processing.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (video.status === "generating" && (!video.image_urls || video.image_urls.length === 0)) ? (
                                /* Generating shimmer skeleton - only if no images yet */
                                <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center gap-4 relative">
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-purple-600/20 animate-pulse" />
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.15),transparent_70%)]" />
                                    <div className="relative z-10 flex flex-col items-center gap-4">
                                        <div className="h-16 w-16 bg-white/5 backdrop-blur-xl rounded-[1.5rem] flex items-center justify-center border border-white/10 shadow-2xl ring-1 ring-white/20">
                                            <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
                                        </div>
                                        <div className="flex flex-col items-center gap-1">
                                            <span className="text-sm font-black text-white tracking-[0.2em] uppercase">
                                                Initializing
                                            </span>
                                            <div className="flex gap-1 mb-3">
                                                <div className="h-1 w-8 bg-blue-500 rounded-full animate-pulse" />
                                                <div className="h-1 w-4 bg-white/20 rounded-full" />
                                                <div className="h-1 w-4 bg-white/20 rounded-full" />
                                            </div>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="h-7 px-3 rounded-full bg-white/10 hover:bg-red-500/20 text-white/60 hover:text-red-400 border border-white/10 backdrop-blur-md text-[10px] font-black uppercase tracking-widest transition-all"
                                                onClick={() => handleVideoDelete(video.id)}
                                            >
                                                <Trash2 className="h-3 w-3 mr-1.5" />
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ) : video.image_urls && video.image_urls.length > 0 ? (
                                <>
                                    <Image
                                        src={video.image_urls[0]}
                                        alt={video.title}
                                        fill
                                        className="object-cover group-hover:scale-110 transition-transform duration-700 brightness-[0.85]"
                                    />
                                    {video.status === "generating" && (
                                        <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] flex items-center justify-center">
                                            <div className="px-4 py-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2">
                                                <Loader2 className="h-3 w-3 text-blue-400 animate-spin" />
                                                <span className="text-[10px] font-black text-white uppercase tracking-widest">Live Rendering</span>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                                    <Video className="h-12 w-12 text-blue-300" />
                                </div>
                            )}

                            {video.status !== "generating" && (
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-100" />
                            )}

                            {/* Play Icon Overlay — only for completed with URL */}
                            {video.status === "completed" && video.video_url && (
                                <div
                                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                                    onClick={() => setSelectedVideo(video)}
                                >
                                    <div className="h-14 w-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
                                        <PlayCircle className="h-8 w-8 text-white" />
                                    </div>
                                </div>
                            )}

                            {/* Instant Preview Icon Overlay — for completed OR partial generating with metadata */}
                            {(video.status === "completed" || (video.status === "generating" && video.voice_url)) && !video.video_url && video.image_urls?.length > 0 && (
                                <div
                                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                                    onClick={() => setSelectedVideo(video)}
                                >
                                    <div className="h-14 w-14 bg-blue-600/40 backdrop-blur-sm rounded-full flex items-center justify-center border border-blue-400/30 shadow-glow-blue">
                                        <Sparkles className="h-8 w-8 text-white animate-pulse" />
                                    </div>
                                </div>
                            )}

                            {/* Needs Render Overlay — for completed without URL or ready_for_local_render */}
                            {(video.status === "ready_for_local_render" || (video.status === "completed" && !video.video_url)) && (
                                <div
                                    className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] opacity-100 group-hover:bg-black/60 transition-all duration-300"
                                >
                                    <div className="h-14 w-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl mb-3">
                                        <Film className="h-7 w-7 text-white" />
                                    </div>
                                    <span className="text-xs font-black text-white uppercase tracking-widest px-4 py-2 bg-blue-600 rounded-full shadow-lg shadow-blue-900/40">
                                        Ready to Preview
                                    </span>
                                    <p className="text-[10px] font-bold text-white/70 mt-3 tracking-tight">
                                        Instant Player Ready
                                    </p>
                                </div>
                            )}

                            <div className="absolute bottom-4 left-4 flex items-center gap-2">
                                <div className={cn(
                                    "h-2 w-2 rounded-full",
                                    video.status === "completed" && video.video_url ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" :
                                        video.status === "failed" ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]" :
                                            (video.status === "ready_for_local_render" || (video.status === "completed" && !video.video_url)) ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" :
                                                "bg-blue-400 animate-pulse shadow-[0_0_10px_rgba(96,165,250,0.8)]"
                                )} />
                                <span className="text-[10px] font-black text-white uppercase tracking-[0.15em] drop-shadow-[0_2px_4px_rgba(0,0,0,1)] bg-black/40 px-2 py-0.5 rounded-md backdrop-blur-sm">
                                    {video.status === "completed" && !video.video_url ? "Completed" :
                                        video.status === "failed" ? "Failed" :
                                            video.status === "generating" && video.image_urls?.length > 0 ? (
                                                `Cooking (${video.image_urls.length} images)...`
                                            ) :
                                                video.status === "generating" ? "Initializing..." : video.status}
                                </span>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-5 flex-1 flex flex-col">
                            {(video.status === "generating" && (!video.title || video.title === "Generating..." || video.title === "Creating...")) ? (
                                <div className="space-y-3">
                                    <div className="h-4 bg-gray-100 rounded-full w-3/4 animate-pulse" />
                                    <div className="h-3 bg-gray-50 rounded-full w-1/2 animate-pulse" />
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-between items-start gap-3 mb-2">
                                        <h3 className="text-base font-extrabold text-gray-900 tracking-tight line-clamp-2 group-hover:text-blue-600 transition-colors">
                                            {video.title}
                                        </h3>
                                        {video.status === "generating" && (
                                            <Loader2 className="h-4 w-4 text-blue-500 animate-spin shrink-0 mt-1" />
                                        )}
                                        {video.status === "failed" && (
                                            <div className="h-4 w-4 text-red-500 shrink-0 mt-1">⚠️</div>
                                        )}
                                    </div>

                                    <div className="flex gap-2 mt-auto pt-4">
                                        {(video.status === "completed" || (video.status === "generating" && video.voice_url)) && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className={cn(
                                                    "flex-1 rounded-xl h-9 text-xs font-bold",
                                                    video.status === "generating" && "border-blue-200 text-blue-600 bg-blue-50/50"
                                                )}
                                                onClick={() => setSelectedVideo(video)}
                                            >
                                                <PlayCircle className="h-3.5 w-3.5 mr-2" />
                                                {video.video_url ? "Preview" : "Instant Preview"}
                                            </Button>
                                        )}

                                        {video.video_url && (
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="rounded-xl h-9 w-9 p-0"
                                                onClick={() => handleDownload(video)}
                                            >
                                                <Download className="h-3.5 w-3.5" />
                                            </Button>
                                        )}

                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className={cn(
                                                "rounded-xl h-9 p-0 transition-all duration-300",
                                                video.status === "failed" ? "flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 border-none" : "w-9 hover:bg-red-50 hover:text-red-600 transition-colors"
                                            )}
                                            onClick={() => handleVideoDelete(video.id)}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            {video.status === "failed" && <span className="ml-2">Delete Failed Video</span>}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Video Preview Modal */}
            <Dialog open={!!selectedVideo} onOpenChange={(open) => !open && setSelectedVideo(null)}>
                <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black border-none rounded-[2rem] shadow-2xl">
                    {selectedVideo && (
                        <div className="flex flex-col">
                            <div className="aspect-video w-full bg-black relative">
                                {selectedVideo.video_url ? (
                                    <video
                                        src={selectedVideo.video_url}
                                        controls
                                        autoPlay
                                        className="w-full h-full"
                                    />
                                ) : (
                                    <Player
                                        component={VideoComposition}
                                        inputProps={{
                                            images: selectedVideo.image_urls,
                                            captions: selectedVideo.captions || [],
                                            voiceUrl: selectedVideo.voice_url || "",
                                            captionStyleId: selectedVideo.caption_style || "pop",
                                            durationInSeconds: Number(selectedVideo.duration) || 30,
                                        }}
                                        durationInFrames={Math.ceil((Number(selectedVideo.duration) || 30) * 30)}
                                        fps={30}
                                        compositionWidth={1080}
                                        compositionHeight={1920}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                        }}
                                        controls
                                        autoPlay
                                    />
                                )}
                            </div>
                            <div className="p-6 bg-white flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">{selectedVideo.title}</h2>
                                    <p className="text-sm font-medium text-gray-500 mt-1">
                                        {format(new Date(selectedVideo.created_at), "MMMM d, yyyy")}
                                    </p>
                                </div>
                                {selectedVideo.video_url ? (
                                    <Button
                                        className="rounded-2xl px-6 font-bold shadow-lg shadow-blue-100"
                                        onClick={() => selectedVideo && handleDownload(selectedVideo)}
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Download Video
                                    </Button>
                                ) : (
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Rendering Required for Download</span>
                                        <Button
                                            disabled
                                            variant="outline"
                                            className="rounded-2xl px-6 font-bold border-dashed"
                                        >
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            MP4 Unavailable
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                .animate-shimmer {
                    animation: shimmer 2s ease-in-out infinite;
                }
                .shadow-glow-emerald {
                    box-shadow: 0 0 20px rgba(52, 211, 153, 0.4);
                }
            ` }} />
        </>
    );
}

"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { Video, Calendar, PlayCircle, Film, Loader2, Download, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { getVideos } from "@/actions/video";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface VideoItem {
    id: string;
    title: string;
    image_urls: string[];
    status: string;
    created_at: string;
    series_id: string;
    video_url?: string;
}

interface VideoListProps {
    initialVideos: VideoItem[];
}

export function VideoList({ initialVideos }: VideoListProps) {
    const [videos, setVideos] = useState<VideoItem[]>(initialVideos);
    const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const hasGenerating = videos.some((v) => v.status === "generating");

    useEffect(() => {
        // Start polling if any video is generating
        if (hasGenerating) {
            intervalRef.current = setInterval(async () => {
                const result = await getVideos();
                if (result.success && result.data) {
                    setVideos(result.data as VideoItem[]);
                }
            }, 5000);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [hasGenerating]);

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-12 animate-in fade-in duration-700">
            {videos.map((video) => (
                <div
                    key={video.id}
                    className="group relative bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-blue-50/50 transition-all duration-500 overflow-hidden flex flex-col"
                >
                    {/* Thumbnail / Generating Skeleton */}
                    <div className="relative aspect-[16/10] overflow-hidden">
                        {video.status === "generating" ? (
                            /* Generating shimmer skeleton */
                            <div className="w-full h-full bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 flex flex-col items-center justify-center gap-3 relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                                <div className="relative z-10 flex flex-col items-center gap-3">
                                    <div className="h-14 w-14 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100/50">
                                        <Loader2 className="h-7 w-7 text-blue-600 animate-spin" />
                                    </div>
                                    <span className="text-sm font-bold text-blue-600/80 tracking-wide">
                                        Generating video...
                                    </span>
                                </div>
                            </div>
                        ) : video.image_urls && video.image_urls.length > 0 ? (
                            <Image
                                src={video.image_urls[0]}
                                alt={video.title}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-700"
                            />
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

                        {/* Needs Render Overlay — for completed without URL or ready_for_local_render */}
                        {(video.status === "ready_for_local_render" || (video.status === "completed" && !video.video_url)) && (
                            <div
                                className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] opacity-100 group-hover:bg-black/60 transition-all duration-300"
                            >
                                <div className="h-14 w-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl mb-3">
                                    <Film className="h-7 w-7 text-white" />
                                </div>
                                <span className="text-xs font-black text-white uppercase tracking-widest px-4 py-2 bg-blue-600 rounded-full shadow-lg shadow-blue-900/40">
                                    Ready to Render
                                </span>
                                <p className="text-[10px] font-bold text-white/70 mt-3 tracking-tight">
                                    Run npm run remotion:render-local
                                </p>
                            </div>
                        )}

                        {/* Status Badge */}
                        <div className="absolute bottom-4 left-4 flex items-center gap-2">
                            <div className={cn(
                                "h-2 w-2 rounded-full",
                                video.status === "completed" && video.video_url ? "bg-emerald-500" :
                                    video.status === "failed" ? "bg-red-500" :
                                        (video.status === "ready_for_local_render" || (video.status === "completed" && !video.video_url)) ? "bg-blue-400" :
                                            "bg-blue-500 animate-pulse"
                            )} />
                            <span className="text-xs font-bold text-white/90 uppercase tracking-widest">
                                {video.status === "completed" && !video.video_url ? "Needs Render" : video.status}
                            </span>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 flex-1 flex flex-col">
                        {video.status === "generating" ? (
                            <div className="space-y-3">
                                <div className="h-4 bg-gray-100 rounded-full w-3/4 animate-pulse" />
                                <div className="h-3 bg-gray-50 rounded-full w-1/2 animate-pulse" />
                            </div>
                        ) : (
                            <>
                                <h3 className="text-base font-extrabold text-gray-900 tracking-tight line-clamp-2 group-hover:text-blue-600 transition-colors mb-2">
                                    {video.title}
                                </h3>
                                <div className="flex items-center gap-2 mt-auto text-gray-400">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span className="text-xs font-medium">
                                        {format(new Date(video.created_at), "MMM d, yyyy")}
                                    </span>
                                </div>

                                {video.status === "completed" && video.video_url && (
                                    <div className="flex gap-2 mt-4">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 rounded-xl h-9 text-xs font-bold"
                                            onClick={() => setSelectedVideo(video)}
                                        >
                                            <PlayCircle className="h-3.5 w-3.5 mr-2" />
                                            Preview
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="rounded-xl h-9 w-9 p-0"
                                            onClick={() => handleDownload(video)}
                                        >
                                            <Download className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            ))}

            {/* Video Preview Modal */}
            <Dialog open={!!selectedVideo} onOpenChange={(open) => !open && setSelectedVideo(null)}>
                <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black border-none rounded-[2rem] shadow-2xl">
                    {selectedVideo && (
                        <div className="flex flex-col">
                            <div className="aspect-video w-full bg-black relative">
                                <video
                                    src={selectedVideo.video_url}
                                    controls
                                    autoPlay
                                    className="w-full h-full"
                                />
                            </div>
                            <div className="p-6 bg-white flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">{selectedVideo.title}</h2>
                                    <p className="text-sm font-medium text-gray-500 mt-1">
                                        {format(new Date(selectedVideo.created_at), "MMMM d, yyyy")}
                                    </p>
                                </div>
                                <Button
                                    className="rounded-2xl px-6 font-bold shadow-lg shadow-blue-100"
                                    onClick={() => handleDownload(selectedVideo)}
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download Video
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <style jsx>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                .animate-shimmer {
                    animation: shimmer 2s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}

import { VideoList } from "@/components/dashboard/video-list";
import { getVideos } from "@/actions/video";

export default async function VideosPage() {
    const { data: initialVideos = [] } = await getVideos();

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                <div>
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Your Videos</h1>
                    <p className="text-gray-500 font-medium mt-1">Browse and manage your generated videos.</p>
                </div>
            </div>

            <VideoList initialVideos={initialVideos} />
        </div>
    );
}

"use client";

import { useEffect, useState, Suspense } from "react";
import { FormStepper } from "@/components/dashboard/create/form-stepper";
import { NicheSelection } from "@/components/dashboard/create/niche-selection";
import { LanguageVoiceSelection } from "@/components/dashboard/create/language-voice-selection";
import { VideoStyleSelection } from "@/components/dashboard/create/video-style-selection";
import { MusicSelection } from "@/components/dashboard/create/music-selection";
import { CaptionStyleSelection } from "@/components/dashboard/create/caption-style-selection";
import { SeriesDetails } from "@/components/dashboard/create/series-details";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSeriesById, updateSeries } from "@/actions/series";
import { useUser } from "@clerk/nextjs";
import { UpgradeDialog } from "@/components/dashboard/upgrade-dialog";
import { getUserPlan } from "@/lib/plans";

function CreateVideoForm() {
    const { user, isLoaded: isUserLoaded } = useUser();
    const router = useRouter();
    const searchParams = useSearchParams();
    const seriesId = searchParams.get("id");
    const mode = searchParams.get("mode");

    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(!!seriesId);
    const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
    const [upgradeTitle, setUpgradeTitle] = useState("");
    const [upgradeDesc, setUpgradeDesc] = useState("");
    const [planNeeded, setPlanNeeded] = useState<"Basic" | "Advanced">("Basic");
    const [formData, setFormData] = useState({
        niche: "",
        language: "",
        voice: "",
        videoStyle: "",
        musicIds: [] as string[],
        captionStyle: "",
        seriesName: "",
        duration: "",
        platform: "",
        publishTime: "",
        modelName: "",
        modelLangCode: "",
    });

    useEffect(() => {
        if (seriesId) {
            const fetchSeriesData = async () => {
                const result = await getSeriesById(seriesId);
                if (result.success && result.data) {
                    const data = result.data;
                    setFormData({
                        niche: data.niche || "",
                        language: data.language || "",
                        voice: data.voice || "",
                        videoStyle: data.video_style || "",
                        musicIds: data.music_ids || [],
                        captionStyle: data.caption_style || "",
                        seriesName: data.series_name || "",
                        duration: data.duration || "",
                        platform: data.platform || "",
                        publishTime: data.publish_time || "",
                        modelName: data.model_name || "",
                        modelLangCode: data.model_lang_code || "",
                    });
                } else {
                    toast.error("Failed to load series data: " + result.error);
                    router.push("/dashboard/create");
                }
                setIsLoading(false);
            };
            fetchSeriesData();
        }
    }, [seriesId, router]);

    const handleNext = (data: Partial<typeof formData>) => {
        setFormData((prev) => ({ ...prev, ...data }));
        setStep((prev) => prev + 1);
    };

    const handleBack = () => {
        setStep((prev) => Math.max(1, prev - 1));
    };

    const handleSchedule = async (details: {
        seriesName: string;
        duration: string;
        platform: string;
        publishTime: string;
    }) => {
        setIsSubmitting(true);
        const finalData = { ...formData, ...details };

        try {
            if (seriesId) {
                // Update existing series
                const result = await updateSeries(seriesId, {
                    series_name: finalData.seriesName,
                    niche: finalData.niche,
                    caption_style: finalData.captionStyle,
                    language: finalData.language,
                    voice: finalData.voice,
                    music_ids: finalData.musicIds,
                    video_style: finalData.videoStyle,
                    duration: finalData.duration,
                    platform: finalData.platform,
                    publish_time: finalData.publishTime,
                    model_name: finalData.modelName,
                    model_lang_code: finalData.modelLangCode,
                });

                if (!result.success) {
                    throw new Error(result.error || "Failed to update series");
                }
                toast.success("Series updated successfully!");
            } else {
                // Create new series
                const response = await fetch("/api/series", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(finalData),
                });

                if (!response.ok) {
                    const errorData = await response.json();

                    if (errorData.code === "LIMIT_REACHED") {
                        const currentPlan = getUserPlan(user);
                        setPlanNeeded(currentPlan === "free" ? "Basic" : "Advanced");
                        setUpgradeTitle("Series Limit Reached");
                        setUpgradeDesc(`You've reached the ${errorData.limit} series limit of your ${currentPlan} plan. Upgrade to create more!`);
                        setIsUpgradeOpen(true);
                        setIsSubmitting(false);
                        return;
                    }

                    if (errorData.code === "PLATFORM_RESTRICTED") {
                        const currentPlan = getUserPlan(user);
                        setPlanNeeded(finalData.platform === "youtube" ? "Basic" : "Advanced");
                        setUpgradeTitle("Platform Restricted");
                        setUpgradeDesc(errorData.error);
                        setIsUpgradeOpen(true);
                        setIsSubmitting(false);
                        return;
                    }

                    throw new Error(errorData.error || "Failed to schedule series");
                }
                toast.success("Series scheduled successfully!");
            }

            // Redirect to dashboard after a short delay to let the toast be seen
            setTimeout(() => {
                router.push("/dashboard");
            }, 1000);
        } catch (error: any) {
            console.error("Submission error:", error);
            toast.error(error.message || "An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleMagicComplete = (config: any) => {
        setFormData((prev) => ({
            ...prev,
            niche: config.niche,
            videoStyle: config.videoStyle,
            language: config.language,
            duration: config.duration,
            captionStyle: config.captionStyle,
            seriesName: config.seriesName,
            platform: config.platform,
            musicIds: config.musicIds || [],
        }));
        // Jump to the last step for review
        setStep(6);
    };

    if (isLoading || !isUserLoaded) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
                <p className="text-gray-500 font-medium">Loading...</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto py-8">
            <UpgradeDialog
                isOpen={isUpgradeOpen}
                onOpenChange={setIsUpgradeOpen}
                title={upgradeTitle}
                description={upgradeDesc}
                planNeeded={planNeeded}
            />
            {/* Stepper Header */}
            <div className="mb-12">
                <FormStepper currentStep={step} />
            </div>

            {/* Step Content */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm min-h-[600px] flex flex-col">
                {step === 1 && (
                    <NicheSelection
                        defaultTab={(mode === "magic" ? "magic" : "available") as "available" | "custom" | "magic"}
                        onContinue={(niche) => handleNext({ niche })}
                        onMagicComplete={handleMagicComplete}
                    />
                )}

                {step === 2 && (
                    <LanguageVoiceSelection
                        onBack={handleBack}
                        onContinue={(data) => handleNext(data)}
                    />
                )}

                {step === 3 && (
                    <VideoStyleSelection
                        onBack={handleBack}
                        onContinue={(videoStyle) => handleNext({ videoStyle })}
                    />
                )}

                {step === 4 && (
                    <MusicSelection
                        onBack={handleBack}
                        onContinue={(musicIds) => handleNext({ musicIds })}
                    />
                )}

                {step === 5 && (
                    <CaptionStyleSelection
                        onBack={handleBack}
                        onContinue={(captionStyle) => handleNext({ captionStyle })}
                    />
                )}

                {step === 6 && (
                    <SeriesDetails
                        initialData={{
                            seriesName: formData.seriesName,
                            duration: formData.duration,
                            platform: formData.platform,
                        }}
                        onBack={handleBack}
                        onSchedule={handleSchedule}
                        isSubmitting={isSubmitting}
                    />
                )}

                {step > 6 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-16 animate-in fade-in zoom-in duration-500">
                        <div className="bg-green-50 text-green-600 p-5 rounded-full mb-6 shadow-lg shadow-green-100">
                            <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Series Scheduled! 🎉</h2>
                        <p className="text-gray-500 text-lg font-medium mb-8">Your video series is queued and will start generating automatically.</p>
                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-8 max-w-md w-full">
                            <p className="text-sm text-gray-400 uppercase font-bold tracking-wider mb-4">Configuration Summary</p>
                            <div className="space-y-2 text-left">
                                <p className="text-gray-700">Series: <span className="font-semibold text-blue-600">"{formData.seriesName}"</span></p>
                                <p className="text-gray-700">Niche: <span className="font-semibold text-blue-600">{formData.niche}</span></p>
                                <p className="text-gray-700">Language: <span className="font-semibold text-blue-600">{formData.language}</span></p>
                                <p className="text-gray-700">Voice: <span className="font-semibold text-blue-600">{formData.voice}</span></p>
                                <p className="text-gray-700">Style: <span className="font-semibold text-blue-600">{formData.videoStyle}</span></p>
                                <p className="text-gray-700">Caption: <span className="font-semibold text-blue-600">{formData.captionStyle}</span></p>
                                <p className="text-gray-700">Music: <span className="font-semibold text-blue-600">{formData.musicIds.length} tracks</span></p>
                                <p className="text-gray-700">Duration: <span className="font-semibold text-blue-600">{formData.duration}s</span></p>
                                <p className="text-gray-700">Platform: <span className="font-semibold text-blue-600 capitalize">{formData.platform}</span></p>
                                <p className="text-gray-700">Publish at: <span className="font-semibold text-blue-600">{formData.publishTime}</span></p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setStep(1);
                                setFormData({
                                    niche: "", language: "", voice: "", videoStyle: "",
                                    musicIds: [], captionStyle: "", seriesName: "",
                                    duration: "", platform: "", publishTime: "",
                                    modelName: "", modelLangCode: "",
                                });
                            }}
                            className="text-blue-600 font-semibold hover:underline"
                        >
                            Create another series
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function CreateVideoPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
            </div>
        }>
            <CreateVideoForm />
        </Suspense>
    );
}




"use client";

import { cn } from "@/lib/utils";

interface FormStepperProps {
    currentStep: number;
    totalSteps?: number;
}

export function FormStepper({ currentStep, totalSteps = 6 }: FormStepperProps) {
    return (
        <div className="w-full mb-12">
            <div className="flex gap-2 w-full justify-between items-center">
                {Array.from({ length: totalSteps }).map((_, index) => {
                    const stepNumber = index + 1;
                    const isActive = stepNumber === currentStep;
                    const isCompleted = stepNumber < currentStep;

                    return (
                        <div
                            key={stepNumber}
                            className={cn(
                                "h-2 flex-1 rounded-full transition-all duration-300",
                                isActive ? "bg-blue-600 scale-y-125" :
                                    isCompleted ? "bg-blue-300" : "bg-gray-200"
                            )}
                        />
                    );
                })}
            </div>
            <div className="flex justify-between mt-3 px-1">
                <span className="text-sm font-medium text-blue-600">
                    Step {currentStep} of {totalSteps}
                </span>
                <span className="text-sm text-gray-400">
                    {Math.round((currentStep / totalSteps) * 100)}% Complete
                </span>
            </div>
        </div>
    );
}

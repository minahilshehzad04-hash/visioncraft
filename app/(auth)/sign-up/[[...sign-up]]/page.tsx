import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
            <SignUp appearance={{
                elements: {
                    formButtonPrimary: "bg-indigo-600 hover:bg-indigo-700 text-sm normal-case",
                    card: "shadow-none border border-zinc-200 dark:border-white/10 dark:bg-zinc-900",
                    headerTitle: "text-zinc-900 dark:text-white",
                    headerSubtitle: "text-zinc-600 dark:text-zinc-400 font-normal",
                }
            }} />
        </div>
    );
}

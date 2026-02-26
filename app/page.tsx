import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { Features } from "@/components/features";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white font-sans selection:bg-indigo-100 selection:text-indigo-900 dark:bg-black dark:selection:bg-indigo-500/30 dark:selection:text-indigo-200">
      <Navbar />
      <main className="flex-grow">
        <Hero />
        <Features />
        {/* Additional sections like How it Works or CTA can go here */}
        <section className="py-24">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <div className="rounded-3xl bg-indigo-600 py-16 px-6 text-white dark:bg-indigo-500">
              <h2 className="text-3xl font-bold sm:text-5xl">Ready to scale your content?</h2>
              <p className="mx-auto mt-6 max-w-xl text-lg text-indigo-100">
                Join thousands of creators using VisionCraft to dominate their niche with AI.
              </p>
              <button className="mt-10 inline-flex h-14 items-center justify-center rounded-full bg-white px-10 text-lg font-bold text-indigo-600 transition-transform hover:scale-105">
                Get Started Now — It's Free
              </button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

import { LoginButton } from "@/components/auth/login-button";
import { auth } from "@/auth";
import Link from "next/link";
import { Dumbbell, MessageSquare, Calendar, TrendingUp } from "lucide-react";

export default async function Home() {
  const session = await auth();

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold text-2xl">
            <Dumbbell className="w-8 h-8 text-blue-400" />
            <span>FitBuddy AI</span>
          </div>
          {session && (
            <Link
              href="/coach"
              className="text-white/80 hover:text-white transition"
            >
              Go to Dashboard →
            </Link>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-6 pt-20">
        {/* Gradient blob effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-700" />

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Your Personal AI
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">
              Training Coach
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-3xl mx-auto">
            Get a fully personalized functional training plan by just talking to your coach.
            <br className="hidden md:block" />
            Tailored to your equipment, goals, and schedule.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {session ? (
              <Link
                href="/coach"
                className="group bg-gradient-to-r from-blue-600 to-blue-700 text-white px-10 py-4 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 transform"
              >
                Talk to Coach
                <MessageSquare className="inline-block ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <>
                <LoginButton />
                <Link
                  href="#features"
                  className="bg-white/10 backdrop-blur text-white px-10 py-4 rounded-xl font-semibold text-lg hover:bg-white/20 transition border border-white/20"
                >
                  Learn More
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-16">
            How It Works
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-blue-500/50 transition-all hover:scale-105 transform">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Tell Your Goals
              </h3>
              <p className="text-slate-300 leading-relaxed">
                "I want to lose fat and use my kettlebells at home 3 times a week."
                Just chat naturally with your AI coach.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-purple-500/50 transition-all hover:scale-105 transform">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Get a Plan
              </h3>
              <p className="text-slate-300 leading-relaxed">
                Receive a detailed weekly training split with exercises, sets, reps,
                and rest periods. Perfectly tailored to you.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-green-500/50 transition-all hover:scale-105 transform">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Track Progress
              </h3>
              <p className="text-slate-300 leading-relaxed">
                Adapt your plan as you improve or change goals. Your coach evolves
                with you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto text-center text-slate-400">
          <p>© 2024 FitBuddy AI. Your personal training companion.</p>
        </div>
      </footer>
    </main>
  );
}

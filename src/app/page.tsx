
import { LoginButton } from "@/components/auth/login-button";
import { auth } from "@/auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function Home({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const session = await auth();

  // If already logged in, maybe show "Go to Coach" instead of Login
  // Or redirect if desired? Let's show a "Go to Coach" button.

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-slate-50">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          FitBuddy AI
        </p>
      </div>

      <div className="relative flex place-items-center before:absolute before:h-[300px] before:w-[480px] before:-translate-x-1/2 before:rounded-full before:bg-gradient-to-br before:from-transparent before:to-blue-500 before:opacity-10 before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-[240px] after:translate-x-1/3 after:bg-gradient-to-t after:from-sky-900 after:via-[#0141ff] after:opacity-40 after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700 before:dark:opacity-10 after:dark:from-sky-900 after:dark:via-[#0141ff] after:dark:opacity-40 before:lg:h-[360px] z-[-1]">
        <h1 className="text-5xl font-bold text-slate-900 mb-4 text-center">
          Your Personal AI <br /> Training Coach
        </h1>
      </div>

      <p className="mb-8 text-xl text-slate-600 max-w-2xl text-center">
        Get a fully personalized functional training plan by just talking to your coach.
        Tailored to your equipment, goals, and schedule.
      </p>

      <div className="flex gap-4">
        {session ? (
          <Link href="/coach" className="bg-green-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700 transition">
            Talk to Coach
          </Link>
        ) : (
          <LoginButton />
        )}
      </div>

      <div className="mt-16 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-3 lg:text-left gap-8">
        <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100/50">
          <h2 className={`mb-3 text-2xl font-semibold`}>
            Tell your goals
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            "I want to lose fat and use my kettlebells at home."
          </p>
        </div>
        <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100/50">
          <h2 className={`mb-3 text-2xl font-semibold`}>
            Get a Plan
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            Receive a detailed weekly training split with exercises.
          </p>
        </div>
        <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100/50">
          <h2 className={`mb-3 text-2xl font-semibold`}>
            Track Progress
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            Adapt the plan as you improve or get bored.
          </p>
        </div>
      </div>
    </main>
  );
}

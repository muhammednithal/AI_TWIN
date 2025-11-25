import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-4xl flex flex-col md:flex-row items-center gap-10">
        {/* LEFT */}
        <div className="flex-1 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/70 border border-slate-700 text-xs uppercase tracking-wide text-slate-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>AI Twin MVP</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            Build your{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400 bg-clip-text text-transparent">
              digital twin
            </span>
            .
          </h1>

          <p className="text-slate-300 text-sm md:text-base max-w-xl">
            Your AI Twin learns your voice, remembers your stories, and chats
            like you.
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/30 text-sm font-semibold transition"
              onClick={() => navigate("/register")}
            >
              Get Started
            </button>
            <button
              className="px-5 py-2.5 rounded-lg border border-slate-600 text-sm font-semibold text-slate-100 hover:border-slate-400"
              onClick={() => navigate("/login")}
            >
              Login
            </button>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex-1 w-full">
          <div className="relative bg-slate-900/70 border border-slate-700 rounded-2xl p-6 shadow-2xl backdrop-blur-xl overflow-hidden">
            <div className="absolute inset-x-10 -top-10 h-24 bg-gradient-to-r from-indigo-500/40 via-sky-500/40 to-emerald-500/40 blur-3xl opacity-60 pointer-events-none" />
            <div className="relative space-y-3 text-xs">
              <h2 className="text-sm font-semibold mb-1 text-slate-100">
                Twin Preview
              </h2>
              <div className="text-left bg-slate-800/80 p-3 rounded-lg border border-slate-700 text-slate-100">
                Ready to chat with your future self?
              </div>
              <div className="text-left bg-slate-800/80 p-3 rounded-lg border border-slate-700 text-slate-100">
                Create your twin and I’ll mirror your tone, vibe and quirks.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

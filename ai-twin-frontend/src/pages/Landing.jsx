import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 overflow-hidden">
      {/* Background Animated Blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/30 rounded-full mix-blend-screen filter blur-3xl opacity-50 animate-blob"></div>
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-sky-500/30 rounded-full mix-blend-screen filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-emerald-500/30 rounded-full mix-blend-screen filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>

      <div className="relative z-10 w-full max-w-5xl flex flex-col md:flex-row items-center gap-16 md:gap-10 animate-fade-in-up">
        {/* LEFT */}
        <div className="flex-1 space-y-8 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel text-xs uppercase tracking-wider text-slate-300 shadow-indigo-500/10">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium text-slate-200">AI Twin MVP</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight tracking-tight">
            Build your{" "}
            <span className="text-gradient">
              digital twin
            </span>
            .
          </h1>

          <p className="text-slate-300 text-base md:text-lg max-w-xl mx-auto md:mx-0 leading-relaxed">
            Your AI Twin learns your voice, remembers your stories, and chats
            just like you. It's the future of personal memory.
          </p>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
            <button
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 hover:from-indigo-500 hover:to-sky-400 shadow-lg shadow-indigo-500/30 text-white font-semibold transition-all duration-300 hover:scale-105 hover:shadow-indigo-500/50"
              onClick={() => navigate("/register")}
            >
              Get Started
            </button>
            <button
              className="px-8 py-3.5 rounded-xl glass-panel text-sm font-semibold text-slate-100 hover:bg-white/10 transition-all duration-300"
              onClick={() => navigate("/login")}
            >
              Login
            </button>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex-1 w-full max-w-md mx-auto relative animate-float">
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 via-purple-500 to-emerald-500 rounded-3xl blur-2xl opacity-20"></div>
          <div className="relative glass-panel rounded-3xl p-8 border border-white/10">
            <div className="space-y-6">
              <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/30">
                  T
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-100">
                    Twin Preview
                  </h2>
                  <p className="text-xs text-slate-400">Online and ready</p>
                </div>
              </div>
              <div className="space-y-4 text-sm">
                <div className="flex justify-start">
                  <div className="max-w-[85%] bg-indigo-600/20 text-indigo-100 p-4 rounded-2xl rounded-tl-sm border border-indigo-500/20 backdrop-blur-md">
                    Ready to chat with your future self?
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="max-w-[85%] bg-white/5 text-slate-200 p-4 rounded-2xl rounded-tl-sm border border-white/10 backdrop-blur-md">
                    Create your twin and I’ll mirror your tone, vibe and quirks perfectly.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

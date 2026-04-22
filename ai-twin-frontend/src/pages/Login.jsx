import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { login } from "../api/auth";

export default function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("ai_twin_token")) navigate("/personality");
  }, []);

  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("pass1234");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await login(email, password);
      localStorage.setItem("ai_twin_token", res.data.token);
      navigate("/personality");
    } catch (err) {
      console.error(err);
      setError("Invalid email or password");
    }

    setLoading(false);
  };

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/20 rounded-full mix-blend-screen filter blur-3xl animate-blob"></div>

      <div className="w-full max-w-md glass-panel p-8 rounded-3xl relative z-10 animate-fade-in-up">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-3xl"></div>
        <div className="relative">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-500/30">
              T
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-center mb-8 tracking-tight">
            Welcome <span className="text-gradient">Back</span>
          </h1>

          <form className="space-y-5" onSubmit={handleLogin}>
            {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-xl">{error}</p>}

            <div>
              <input
                type="email"
                className="w-full px-5 py-3.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-300 backdrop-blur-sm"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <input
                type="password"
                className="w-full px-5 py-3.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-300 backdrop-blur-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 hover:from-indigo-500 hover:to-sky-400 shadow-lg shadow-indigo-500/30 text-white font-semibold transition-all duration-300 hover:scale-[1.02]"
              disabled={loading}
            >
              {loading ? "Authenticating..." : "Sign In"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-8">
            Don't have an account?{" "}
            <Link to="/register" className="text-indigo-400 font-medium hover:text-indigo-300 transition-colors">
              Create one now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

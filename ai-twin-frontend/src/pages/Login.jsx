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
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-900/70 border border-slate-700/50 backdrop-blur-xl p-8 rounded-2xl shadow-2xl shadow-black/60">
        <h1 className="text-2xl font-semibold text-center mb-6">
          Welcome Back
        </h1>

        <form className="space-y-5" onSubmit={handleLogin}>
          {error && <p className="text-sm text-red-400">{error}</p>}

          <input
            type="email"
            className="w-full px-4 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-sm"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            className="w-full px-4 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-sm"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-semibold text-sm"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-6">
          No account?{" "}
          <Link to="/register" className="text-indigo-400 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("ai_twin_token");

  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const saved = localStorage.getItem("ai_twin_theme") || "dark";
    setTheme(saved);
    document.body.dataset.theme = saved;
  }, []);

  useEffect(() => {
    document.body.dataset.theme = theme;
    localStorage.setItem("ai_twin_theme", theme);
  }, [theme]);

  const logout = () => {
    localStorage.removeItem("ai_twin_token");
    localStorage.removeItem("ai_twin_session_id");
    localStorage.removeItem("ai_twin_personality_id");
    navigate("/login");
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const isActive = (path) =>
    location.pathname === path ? "text-indigo-400" : "text-slate-300";

  return (
    <nav className="h-16 glass-panel border-b border-white/10 px-6 lg:px-10 flex items-center justify-between sticky top-0 z-50 backdrop-blur-xl bg-slate-950/60">
      <div className="flex items-center gap-8 text-sm font-medium">
        <Link 
          className={`relative group px-1 py-2 transition-colors ${location.pathname === "/" ? "text-indigo-400" : "text-slate-300 hover:text-indigo-300"}`} 
          to="/"
        >
          Home
          <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500 transform origin-left transition-transform duration-300 ${location.pathname === "/" ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`}></span>
        </Link>
        {token && (
          <>
            <Link
              className={`relative group px-1 py-2 transition-colors ${location.pathname === "/chat" ? "text-indigo-400" : "text-slate-300 hover:text-indigo-300"}`}
              to="/chat"
            >
              Chat
              <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500 transform origin-left transition-transform duration-300 ${location.pathname === "/chat" ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`}></span>
            </Link>
            <Link
              className={`relative group px-1 py-2 transition-colors ${location.pathname === "/memory" ? "text-indigo-400" : "text-slate-300 hover:text-indigo-300"}`}
              to="/memory"
            >
              Memory
              <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500 transform origin-left transition-transform duration-300 ${location.pathname === "/memory" ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`}></span>
            </Link>
            <Link
              className={`relative group px-1 py-2 transition-colors ${location.pathname === "/profile" ? "text-indigo-400" : "text-slate-300 hover:text-indigo-300"}`}
              to="/profile"
            >
              Profile
              <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500 transform origin-left transition-transform duration-300 ${location.pathname === "/profile" ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`}></span>
            </Link>
          </>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className="text-xs font-medium px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10 hover:border-indigo-400/50 hover:text-indigo-300 transition-all shadow-lg"
        >
          {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
        </button>
        {token && (
          <button
            onClick={logout}
            className="text-xs font-medium px-4 py-2 rounded-lg border border-red-500/30 text-red-400 bg-red-500/10 hover:bg-red-500/20 hover:border-red-500/50 transition-all shadow-lg shadow-red-500/10"
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}

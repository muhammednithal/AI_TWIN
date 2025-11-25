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
    <nav className="h-14 bg-slate-950/90 border-b border-slate-800 px-6 flex items-center justify-between backdrop-blur-md sticky top-0 z-20">
      <div className="flex items-center gap-6 text-sm">
        <Link className={`hover:text-indigo-400 ${isActive("/")}`} to="/">
          Home
        </Link>
        {token && (
          <>
            <Link
              className={`hover:text-indigo-400 ${isActive("/chat")}`}
              to="/chat"
            >
              Chat
            </Link>
            <Link
              className={`hover:text-indigo-400 ${isActive("/memory")}`}
              to="/memory"
            >
              Memory
            </Link>
            <Link
              className={`hover:text-indigo-400 ${isActive("/profile")}`}
              to="/profile"
            >
              Profile
            </Link>
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={toggleTheme}
          className="text-xs px-3 py-1 rounded-md border border-slate-600 text-slate-200 hover:border-indigo-400 hover:text-indigo-300"
        >
          {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
        </button>
        {token && (
          <button
            onClick={logout}
            className="text-xs px-3 py-1 rounded-md border border-red-500/50 text-red-300 hover:bg-red-500/10"
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}

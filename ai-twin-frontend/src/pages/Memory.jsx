import { useEffect, useState } from "react";
import { addMemory, deleteMemory, listMemories } from "../api/memory";

export default function Memory() {
  const personalityId = localStorage.getItem("ai_twin_personality_id");

  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const [content, setContent] = useState("");
  const [tags, setTags] = useState("coffee,food");

  useEffect(() => {
    if (personalityId) {
      fetchMemories();
    }
  }, [personalityId]);

  const fetchMemories = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await listMemories(personalityId);
      setMemories(res.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load memories.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      setAdding(true);
      setError("");
      const res = await addMemory(personalityId, content.trim(), tags.trim());
      // backend might return full memory or just status
      if (res.data && res.data.id) {
        setMemories((prev) => [res.data, ...prev]);
      } else {
        fetchMemories();
      }
      setContent("");
      setTags("");
    } catch (err) {
      console.error(err);
      setError("Failed to add memory.");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteMemory(id);
      setMemories((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error(err);
      setError("Failed to delete memory.");
    }
  };

  if (!personalityId) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center animate-fade-in-up">
        <div className="glass-panel p-8 rounded-3xl text-center max-w-md">
          <div className="w-16 h-16 mx-auto bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center text-2xl mb-4">
            ⚠️
          </div>
          <h2 className="text-xl font-bold text-slate-100 mb-2">No Personality Found</h2>
          <p className="text-sm text-slate-400">
            You need to create your AI twin's personality before adding memories.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 py-8 overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full mix-blend-screen filter blur-3xl animate-blob"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full mix-blend-screen filter blur-3xl animate-blob animation-delay-2000"></div>

      <div className="w-full max-w-4xl glass-panel rounded-3xl p-6 md:p-8 lg:p-10 relative z-10 animate-fade-in-up">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight mb-2 flex items-center gap-3">
              Memories <span className="text-3xl">🧠</span>
            </h1>
            <p className="text-sm text-slate-300">
              Build your twin's knowledge base. These are facts, preferences, and details they can recall during chat.
            </p>
          </div>
          <button
            onClick={fetchMemories}
            className="self-start md:self-auto text-sm px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-2 border border-slate-700 hover:border-slate-500"
          >
            <span className={loading ? "animate-spin" : ""}>↻</span>
            Refresh
          </button>
        </div>

        <form onSubmit={handleAdd} className="space-y-4 mb-8 bg-slate-900/40 p-6 rounded-2xl border border-white/5 backdrop-blur-md">
          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 animate-fade-in-up">
              {error}
            </p>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide">New Memory</label>
            <textarea
              className="w-full px-4 py-3 bg-slate-900/60 border border-slate-700/50 rounded-xl text-sm text-slate-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all resize-none placeholder:text-slate-500"
              rows={3}
              placeholder="e.g. I love dark roast coffee in the morning, and I'm currently learning Rust."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide">Tags</label>
              <input
                className="w-full px-4 py-3 bg-slate-900/60 border border-slate-700/50 rounded-xl text-sm text-slate-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-500"
                placeholder="Comma separated (e.g. coffee, food, code)"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={adding}
                className="w-full md:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 hover:from-indigo-500 hover:to-sky-400 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
              >
                {adding ? "Saving..." : "Add Memory +"}
              </button>
            </div>
          </div>
        </form>

        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar relative">
          {loading && (
            <div className="flex justify-center py-10">
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce delay-150"></div>
                <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce delay-300"></div>
              </div>
            </div>
          )}
          
          {!loading && memories.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-2xl">
              <p className="text-slate-400">No memories yet.</p>
              <p className="text-sm text-slate-500 mt-1">Chat with your twin or add some manually!</p>
            </div>
          )}

          {memories.map((m) => (
            <div
              key={m.id}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors group flex flex-col md:flex-row gap-4 items-start md:items-center justify-between animate-fade-in-up"
            >
              <div className="flex-1">
                <p className="text-slate-200 text-sm leading-relaxed">{m.content}</p>
                {m.tags && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {m.tags
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean)
                      .map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium text-indigo-300"
                        >
                          #{t}
                        </span>
                      ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => handleDelete(m.id)}
                className="opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity text-sm px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-transparent hover:border-red-500/30 whitespace-nowrap"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

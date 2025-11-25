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
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <p className="text-sm text-slate-300">
          No personality found. Create your twin first.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-4xl bg-slate-950/60 border border-slate-800 rounded-2xl p-6 shadow-2xl shadow-black/60 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-semibold text-slate-100">
              Memories 🧠
            </h1>
            <p className="text-xs text-slate-400">
              These are facts, preferences and details your twin can recall.
            </p>
          </div>
          <button
            onClick={fetchMemories}
            className="text-xs px-3 py-1 rounded border border-slate-700 text-slate-200 hover:border-indigo-400"
          >
            Refresh
          </button>
        </div>

        <form onSubmit={handleAdd} className="space-y-3 mb-6">
          {error && (
            <p className="text-xs text-red-400 bg-red-950/40 border border-red-800/60 rounded px-3 py-2">
              {error}
            </p>
          )}

          <textarea
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 focus:border-indigo-500 focus:ring-1 outline-none"
            rows={2}
            placeholder="Add something your twin should remember (e.g. I love pizza, I'm learning Go)..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <input
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:border-indigo-500 focus:ring-1 outline-none"
            placeholder="Tags (comma separated, e.g. coffee,food)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />

          <button
            type="submit"
            disabled={adding}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white disabled:opacity-50"
          >
            {adding ? "Saving..." : "Add Memory"}
          </button>
        </form>

        <div className="space-y-3 max-h-80 overflow-y-auto">
          {loading && (
            <p className="text-xs text-slate-400">Loading memories…</p>
          )}
          {!loading && memories.length === 0 && (
            <p className="text-xs text-slate-500">
              No memories yet. Chat with your twin or add some manually!
            </p>
          )}

          {memories.map((m) => (
            <div
              key={m.id}
              className="bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-2 text-xs flex items-start justify-between gap-3"
            >
              <div>
                <p className="text-slate-100">{m.content}</p>
                {m.tags && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {m.tags
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean)
                      .map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-300"
                        >
                          #{t}
                        </span>
                      ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => handleDelete(m.id)}
                className="text-[10px] text-red-400 hover:text-red-300"
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

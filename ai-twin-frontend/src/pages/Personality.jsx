import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPersonality } from "../api/personalities";

export default function Personality() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [language, setLanguage] = useState("english"); // matches your curl
  const [samples, setSamples] = useState(["", "", ""]);

  const [sliders, setSliders] = useState({
    humor: 5,
    formality: 5,
    emotional: 5,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const existing = localStorage.getItem("ai_twin_personality_id");
    // if (existing) navigate("/chat");
  }, []);

  const handleSampleChange = (index, value) => {
    const next = [...samples];
    next[index] = value;
    setSamples(next);
  };

  const addSampleField = () => {
    setSamples([...samples, ""]);
  };

  const handleSlider = (key, value) => {
    setSliders((prev) => ({ ...prev, [key]: Number(value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const trimmedSamples = samples.map((s) => s.trim()).filter(Boolean);

    if (!name.trim()) {
      setError("Please give your twin a name.");
      return;
    }
    // if (trimmedSamples.length < 3) {
    //   setError("Please provide at least 3 text samples.");
    //   return;
    // }

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        language,
        samples: trimmedSamples.map((t) => ({ text: t })), // matches curl
        sliders: {
          humor: sliders.humor / 10,
          formality: sliders.formality / 10,
          emotional: sliders.emotional / 10,
        },
      };

      const res = await createPersonality(payload);
      console.log("Create personality response:", res.data);

      const personalityId =
        res.data.id || res.data.personality_id || res.data.personality?.id;

      if (!personalityId) {
        setError("Personality created but no ID returned from backend.");
        setLoading(false);
        return;
      }

      localStorage.setItem("ai_twin_personality_id", personalityId);

      navigate("/chat");
    } catch (err) {
      console.error(err);
      setError("Failed to create personality. Check backend logs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-10 bg-slate-950/60 border border-slate-800/70 rounded-2xl p-8 shadow-2xl shadow-black/60 backdrop-blur-xl">
        {/* LEFT DESCRIPTION */}
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700 text-xs uppercase tracking-wide text-slate-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Step 1 · Personality</span>
          </div>

          <h1 className="text-3xl font-bold">
            Shape your{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400 bg-clip-text text-transparent">
              AI Twin
            </span>
            .
          </h1>

          <p className="text-sm text-slate-300">
            Provide a name, language & a few text samples. We embed your tone,
            generate a personality profile, and your twin learns to speak like
            you.
          </p>

          <ul className="text-xs text-slate-400 space-y-1">
            <li>• Paste real messages, chats, or posts.</li>
            <li>• Use sliders to control humor, formality, emotion.</li>
            <li>• You can improve personality later.</li>
          </ul>
        </div>

        {/* RIGHT FORM */}
        <div>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <p className="text-sm text-red-400 bg-red-950/40 border border-red-800/50 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            {success && (
              <p className="text-sm text-emerald-300 bg-emerald-950/40 border border-emerald-700/50 rounded-lg px-3 py-2">
                {success}
              </p>
            )}

            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Twin Name
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-slate-100 focus:border-indigo-500 focus:ring-1 outline-none"
                placeholder="e.g. Future You"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Language */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Language
              </label>
              <select
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-slate-100 focus:border-indigo-500"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="english">English</option>
                <option value="hindi">Hindi</option>
                <option value="tamil">Tamil</option>
                <option value="malayalam">Malayalam</option>
              </select>
            </div>

            {/* Samples */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300">
                  Text Samples (min 3)
                </label>
                <button
                  type="button"
                  className="text-[11px] text-indigo-400 hover:text-indigo-300"
                  onClick={addSampleField}
                >
                  + Add sample
                </button>
              </div>

              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {samples.map((s, idx) => (
                  <textarea
                    key={idx}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    rows={2}
                    placeholder={`Sample #${idx + 1}`}
                    value={s}
                    onChange={(e) => handleSampleChange(idx, e.target.value)}
                  />
                ))}
              </div>
            </div>

            {/* Sliders */}
            <div className="grid grid-cols-3 gap-3 text-xs">
              <SliderField
                label="Humor"
                value={sliders.humor}
                onChange={(v) => handleSlider("humor", v)}
              />
              <SliderField
                label="Formality"
                value={sliders.formality}
                onChange={(v) => handleSlider("formality", v)}
              />
              <SliderField
                label="Emotional"
                value={sliders.emotional}
                onChange={(v) => handleSlider("emotional", v)}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold shadow-md shadow-indigo-500/40 disabled:opacity-50"
            >
              {loading ? "Creating your twin..." : "Create My Twin 🤖"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function SliderField({ label, value, onChange }) {
  return (
    <div className="bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-slate-300">{label}</span>
        <span className="text-slate-400 font-semibold">{value}/10</span>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        value={value}
        className="w-full accent-indigo-500"
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

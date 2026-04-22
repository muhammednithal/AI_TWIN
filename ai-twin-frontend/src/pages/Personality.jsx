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
    <div className="relative min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 py-8 overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full mix-blend-screen filter blur-3xl animate-blob"></div>
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full mix-blend-screen filter blur-3xl animate-blob animation-delay-4000"></div>

      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-10 lg:gap-16 glass-panel rounded-3xl p-8 lg:p-12 relative z-10 animate-fade-in-up">
        {/* LEFT DESCRIPTION */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs uppercase tracking-wider text-slate-300 backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium">Step 1 · Personality</span>
          </div>

          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight">
            Shape your{" "}
            <span className="text-gradient">
              AI Twin
            </span>
            .
          </h1>

          <p className="text-base text-slate-300 leading-relaxed">
            Provide a name, language & a few text samples. We embed your tone,
            generate a personality profile, and your twin learns to speak just like
            you.
          </p>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
            <ul className="text-sm text-slate-300 space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-indigo-400 mt-0.5">✦</span>
                <span>Paste real messages, chats, or social media posts.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-indigo-400 mt-0.5">✦</span>
                <span>Use sliders to control humor, formality, and emotion.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-indigo-400 mt-0.5">✦</span>
                <span>You can always adjust and improve the personality later.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* RIGHT FORM */}
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 lg:p-8 backdrop-blur-md">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 animate-fade-in-up">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}
            {success && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 animate-fade-in-up">
                <p className="text-sm text-emerald-400">{success}</p>
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">
                Twin Name
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700/50 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                placeholder="e.g. Future You"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">
                Language
              </label>
              <select
                className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700/50 text-sm text-slate-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
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
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-slate-200">
                  Text Samples (min 3)
                </label>
                <button
                  type="button"
                  className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/10 px-3 py-1 rounded-lg"
                  onClick={addSampleField}
                >
                  + Add Sample
                </button>
              </div>

              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                {samples.map((s, idx) => (
                  <textarea
                    key={idx}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700/50 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all resize-none"
                    rows={2}
                    placeholder={`Sample #${idx + 1}`}
                    value={s}
                    onChange={(e) => handleSampleChange(idx, e.target.value)}
                  />
                ))}
              </div>
            </div>

            {/* Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
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
              className="w-full mt-6 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 hover:from-indigo-500 hover:to-sky-400 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
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
    <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-300">{label}</span>
        <span className="text-xs font-bold text-indigo-400">{value}/10</span>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        value={value}
        className="w-full accent-indigo-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

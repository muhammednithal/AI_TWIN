import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendChatMessage } from "../api/chat";

export default function Chat() {
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]); // {fromUser, text}[]
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [sessionId, setSessionId] = useState(
    localStorage.getItem("ai_twin_session_id") || ""
  );

  const bottomRef = useRef(null);

  useEffect(() => {
    const personalityId = localStorage.getItem("ai_twin_personality_id");
    if (!personalityId) navigate("/personality");
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;

    const personalityId = localStorage.getItem("ai_twin_personality_id");
    if (!personalityId) {
      navigate("/personality");
      return;
    }

    setInput("");
    setMessages((prev) => [...prev, { fromUser: true, text }]);
    setLoading(true);

    try {
      const res = await sendChatMessage(personalityId, text, sessionId);

      const reply = res.data.reply || "";
      const newSessionId = res.data.session_id || sessionId;

      if (newSessionId && newSessionId !== sessionId) {
        setSessionId(newSessionId);
        localStorage.setItem("ai_twin_session_id", newSessionId);
      }

      setMessages((prev) => [...prev, { fromUser: false, text: reply }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { fromUser: false, text: "⚠️ Error contacting your AI Twin." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] flex flex-col overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-1/4 left-0 w-72 h-72 bg-indigo-600/10 rounded-full mix-blend-screen filter blur-3xl animate-blob pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-0 w-72 h-72 bg-emerald-500/10 rounded-full mix-blend-screen filter blur-3xl animate-blob animation-delay-4000 pointer-events-none"></div>

      {/* Header */}
      <header className="h-16 glass-panel border-b border-white/10 flex items-center justify-between px-6 sticky top-0 z-10 backdrop-blur-xl bg-slate-950/80">
        <div className="flex items-center gap-4 text-sm">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-25"></div>
            <div className="relative h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          </div>
          <span className="text-slate-100 font-semibold tracking-wide">Chat with your AI Twin</span>
        </div>
        <button
          onClick={() => navigate("/personality")}
          className="text-xs px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:border-indigo-400 hover:text-indigo-300 transition-colors bg-slate-900/50"
        >
          Edit Personality
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6 relative z-0">
        {messages.length === 0 && !loading && (
          <div className="text-center mt-20 text-slate-400 animate-fade-in-up">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-tr from-indigo-500/20 to-sky-500/20 flex items-center justify-center border border-indigo-500/20">
              👋
            </div>
            <p className="text-sm">Say hi to your twin and see how they respond</p>
          </div>
        )}

        {messages.map((m, idx) => (
          <ChatBubble key={idx} fromUser={m.fromUser} text={m.text} />
        ))}

        {loading && (
          <div className="flex justify-start animate-fade-in-up">
            <div className="px-5 py-4 max-w-[70%] text-sm rounded-2xl bg-white/5 border border-white/10 text-slate-200 rounded-bl-sm backdrop-blur-md shadow-lg flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" />
              <div className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce delay-150" />
              <div className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce delay-300" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <footer className="border-t border-white/10 glass-panel p-4 bg-slate-950/80 sticky bottom-0 z-10 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto flex gap-3 relative">
          <textarea
            className="flex-1 bg-slate-900/60 border border-slate-700/50 rounded-2xl px-5 py-3.5 text-sm text-slate-100 resize-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-500"
            rows={1}
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          <button
            onClick={handleSend}
            disabled={loading}
            className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-sky-500 hover:from-indigo-500 hover:to-sky-400 rounded-2xl shadow-lg shadow-indigo-500/30 font-semibold text-sm text-white disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Send
          </button>
        </div>
      </footer>
    </div>
  );
}

function ChatBubble({ fromUser, text }) {
  return (
    <div className={`flex ${fromUser ? "justify-end" : "justify-start"} animate-fade-in-up`}>
      <div
        className={`px-5 py-4 max-w-[75%] sm:max-w-[65%] text-sm rounded-2xl leading-relaxed whitespace-pre-wrap shadow-lg ${
          fromUser
            ? "bg-gradient-to-br from-indigo-600 to-sky-500 text-white rounded-br-sm shadow-indigo-500/20"
            : "glass-panel bg-white/5 border border-white/10 text-slate-200 rounded-bl-sm"
        }`}
      >
        {text}
      </div>
    </div>
  );
}

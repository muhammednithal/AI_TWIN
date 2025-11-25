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
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col">
      {/* Header */}
      <header className="h-11 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between px-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-200">Chat with your AI Twin</span>
        </div>
        <button
          onClick={() => navigate("/personality")}
          className="text-xs text-slate-300 hover:text-indigo-300"
        >
          Edit Personality
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && !loading && (
          <div className="text-center mt-10 text-sm text-slate-400">
            Say hi to your twin and see how they respond 👋
          </div>
        )}

        {messages.map((m, idx) => (
          <ChatBubble key={idx} fromUser={m.fromUser} text={m.text} />
        ))}

        {loading && (
          <div className="flex items-center space-x-2 px-4 py-2 bg-slate-900/70 border border-slate-700 rounded-xl max-w-[60%]">
            <div className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" />
            <div className="h-2 w-2 rounded-full bg-slate-400 animate-bounce delay-150" />
            <div className="h-2 w-2 rounded-full bg-slate-400 animate-bounce delay-300" />
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <footer className="border-t border-slate-800 bg-slate-950/90 p-3">
        <div className="max-w-3xl mx-auto flex gap-3">
          <textarea
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 resize-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            rows={1}
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          <button
            onClick={handleSend}
            disabled={loading}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-500/30 font-semibold text-sm disabled:opacity-50"
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
    <div className={`flex ${fromUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`px-4 py-3 max-w-[70%] shadow-xl text-sm rounded-xl whitespace-pre-wrap ${
          fromUser
            ? "bg-indigo-600 text-white rounded-br-none"
            : "bg-slate-900/70 text-slate-200 border border-slate-700 rounded-bl-none"
        }`}
      >
        {text}
      </div>
    </div>
  );
}

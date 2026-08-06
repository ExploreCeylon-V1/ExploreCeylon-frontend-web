import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Headset, Sparkles } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useChat } from "../hooks/useChat";

function formatTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ChatWidget() {
  const { isAuthenticated } = useAuth();
  const { isOpen, toggleChat, closeChat, messages, sendMessage, sending, loading, unreadCount } = useChat();
  const [draft, setDraft] = useState("");
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  if (!isAuthenticated) return null;

  const handleSend = (e) => {
    e.preventDefault();
    if (!draft.trim() || sending) return;
    const content = draft;
    setDraft("");
    sendMessage(content);
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end pointer-events-none">
      {/* ── Chat Panel (Image 1) ─────────────────────────── */}
      <div
        className={`mb-2 flex w-[calc(100vw-2rem)] sm:w-[360px] md:w-[380px] max-h-[75vh] flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-2xl shadow-emerald-950/20 transition-all duration-300 origin-bottom-right ${
          isOpen
            ? "scale-100 opacity-100 pointer-events-auto"
            : "scale-95 opacity-0 pointer-events-none hidden"
        }`}
        style={{ height: "30rem" }}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between bg-gradient-to-r from-emerald-800 via-teal-800 to-green-900 px-4 py-3.5 text-white shadow-md">
          <div className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/15 backdrop-blur-md ring-1 ring-white/20">
              <Headset size={18} className="text-white" />
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-900" />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight tracking-wide text-white">ExploreCeylon Support</p>
              <p className="flex items-center gap-1.5 text-2xs font-medium text-emerald-100/90 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                We usually reply in a few minutes
              </p>
            </div>
          </div>
          {/* Header Close Button (Image 1 Close Button) */}
          <button
            onClick={closeChat}
            aria-label="Close chat"
            className="rounded-full p-1.5 text-emerald-100/80 transition-colors hover:bg-white/15 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Messages Body */}
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50/70 px-3.5 py-4">
          {loading ? (
            <div className="flex h-full items-center justify-center text-xs font-medium text-gray-400">
              Loading conversation…
            </div>
          ) : messages.length === 0 ? (
            <div className="mx-auto max-w-[90%] rounded-2xl rounded-tl-sm bg-white p-3.5 text-xs leading-relaxed text-gray-700 shadow-sm border border-gray-100/80">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-800 mb-1">
                <Sparkles size={14} /> Welcome to Support!
              </div>
              👋 Hi there! Ask us anything about your trip, bookings, or the platform — a real
              support agent will get back to you here.
            </div>
          ) : (
            messages.map((m) => {
              if (m.senderRole === "SYSTEM") {
                return (
                  <div key={m.id} className="mx-auto max-w-[90%] rounded-2xl border border-emerald-100 bg-emerald-50/80 px-3.5 py-2.5 text-center text-xs text-emerald-900 shadow-sm">
                    <p className="whitespace-pre-wrap break-words leading-relaxed">{m.content}</p>
                    <p className="mt-1 text-3xs text-emerald-700/60 font-medium">{formatTime(m.createdAt)}</p>
                  </div>
                );
              }
              const mine = m.senderRole === "TRAVELER";
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[82%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-sm ${
                      mine
                        ? "rounded-br-xs bg-gradient-to-r from-emerald-800 to-teal-800 text-white font-medium"
                        : "rounded-bl-xs bg-white text-gray-800 border border-gray-100"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{m.content}</p>
                    <p className={`mt-1 text-3xs ${mine ? "text-emerald-200/80 text-right" : "text-gray-400"}`}>
                      {formatTime(m.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input Composer */}
        <form onSubmit={handleSend} className="flex shrink-0 items-center gap-2 border-t border-gray-100 bg-white p-2.5">
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type your message…"
            className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-xs text-gray-800 outline-none transition-all focus:border-emerald-700 focus:bg-white focus:ring-2 focus:ring-emerald-700/10"
          />
          <button
            type="submit"
            disabled={!draft.trim() || sending}
            aria-label="Send message"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-white transition-all hover:bg-emerald-900 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send size={15} />
          </button>
        </form>
      </div>

      {/* ── Compact Floating Toggle Button (Image 2) ───────────────────────── */}
      {/* Note: Rendered ONLY when chat is closed (!isOpen). When chat is open, the floating close button (Image 3) is removed! */}
      {!isOpen && (
        <button
          onClick={toggleChat}
          aria-label="Open support chat"
          className="pointer-events-auto relative flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-gradient-to-r from-emerald-800 to-teal-800 text-white shadow-lg shadow-emerald-950/30 transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95"
        >
          <MessageCircle size={20} />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-purple-700 px-1 text-3xs font-bold text-white ring-2 ring-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      )}
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Headset } from "lucide-react";
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
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end pointer-events-none">
      {/* ── Panel ─────────────────────────────────────────── */}
      <div
        className={`mb-3 flex w-[min(23rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-black/5 bg-white shadow-2xl shadow-black/20 transition-all duration-200 origin-bottom-right ${
          isOpen
            ? "scale-100 opacity-100 pointer-events-auto"
            : "scale-95 opacity-0 pointer-events-none hidden"
        }`}
        style={{ height: "30rem" }}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between bg-[#2D6A4F] px-4 py-3.5 text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
              <Headset size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">ExploreCeylon Support</p>
              <p className="flex items-center gap-1.5 text-2xs text-white/80">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                We usually reply in a few minutes
              </p>
            </div>
          </div>
          <button
            onClick={closeChat}
            aria-label="Close chat"
            className="rounded-full p-1.5 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-[#f6faf8] px-3.5 py-4">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">
              Loading conversation…
            </div>
          ) : messages.length === 0 ? (
            <div className="mx-auto max-w-[85%] rounded-2xl rounded-bl-sm bg-white px-3.5 py-2.5 text-sm text-gray-600 shadow-sm">
              👋 Hi there! Ask us anything about your trip, bookings, or the platform — a real
              support agent will get back to you here.
            </div>
          ) : (
            messages.map((m) => {
              if (m.senderRole === "SYSTEM") {
                return (
                  <div key={m.id} className="mx-auto max-w-[90%] rounded-2xl border border-emerald-100 bg-emerald-50/70 px-3.5 py-2.5 text-center text-xs text-emerald-900 shadow-sm">
                    <p className="whitespace-pre-wrap break-words">{m.content}</p>
                    <p className="mt-1 text-3xs text-emerald-700/60">{formatTime(m.createdAt)}</p>
                  </div>
                );
              }
              const mine = m.senderRole === "TRAVELER";
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${
                      mine
                        ? "rounded-br-sm bg-[#2D6A4F] text-white"
                        : "rounded-bl-sm bg-white text-gray-800"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{m.content}</p>
                    <p className={`mt-1 text-2xs ${mine ? "text-white/70" : "text-gray-400"}`}>
                      {formatTime(m.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Composer */}
        <form onSubmit={handleSend} className="flex shrink-0 items-center gap-2 border-t border-gray-100 bg-white p-2.5">
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type your message…"
            className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-800 outline-none transition-colors focus:border-[#2D6A4F] focus:bg-white"
          />
          <button
            type="submit"
            disabled={!draft.trim() || sending}
            aria-label="Send message"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2D6A4F] text-white transition-all hover:bg-[#235C42] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send size={16} />
          </button>
        </form>
      </div>

      {/* ── Floating toggle button ───────────────────────── */}
      <button
        onClick={toggleChat}
        aria-label={isOpen ? "Close support chat" : "Open support chat"}
        className="pointer-events-auto relative flex h-14 w-14 items-center justify-center rounded-full bg-[#2D6A4F] text-white shadow-lg shadow-black/20 transition-all hover:-translate-y-0.5 hover:bg-[#235C42] hover:shadow-xl"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
        {!isOpen && unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#7B2D8B] px-1 text-2xs font-bold text-white ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}

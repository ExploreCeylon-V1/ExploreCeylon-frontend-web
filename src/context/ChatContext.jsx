import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";
import {
  getMyConversation,
  getMyMessages,
  sendMyMessage,
  markMyConversationRead,
} from "../services/chatService";
import { connectChatSocket } from "../services/chatSocket";

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const socketRef = useRef(null);
  const isOpenRef = useRef(false);
  useEffect(() => { isOpenRef.current = isOpen; }, [isOpen]);

  const addMessage = useCallback((msg) => {
    setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
  }, []);

  // Load (or lazily create) the traveler's single conversation + history once logged in.
  useEffect(() => {
    if (!isAuthenticated) {
      setConversation(null);
      setMessages([]);
      setUnreadCount(0);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const conv = await getMyConversation();
        if (cancelled) return;
        setConversation(conv);
        if (conv.unreadByTraveler) setUnreadCount(1);
        const msgs = await getMyMessages();
        if (!cancelled) setMessages(msgs);
      } catch {
        // support chat is best-effort; a load failure shouldn't break the page
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  // Live push once we know the conversation id.
  useEffect(() => {
    if (!isAuthenticated || !conversation?.id) return;
    const client = connectChatSocket({
      conversationId: conversation.id,
      onMessage: (msg) => {
        addMessage(msg);
        if (msg.senderRole === "ADMIN") {
          if (isOpenRef.current) {
            markMyConversationRead().catch(() => {});
          } else {
            setUnreadCount((c) => c + 1);
          }
        }
      },
    });
    socketRef.current = client;
    return () => client.deactivate();
  }, [isAuthenticated, conversation?.id, addMessage]);

  const openChat = useCallback(() => {
    setIsOpen(true);
    setUnreadCount(0);
    markMyConversationRead().catch(() => {});
  }, []);

  const closeChat = useCallback(() => setIsOpen(false), []);
  const toggleChat = useCallback(() => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
        setUnreadCount(0);
        markMyConversationRead().catch(() => {});
      }
      return next;
    });
  }, []);

  const sendMessage = useCallback(async (content) => {
    const trimmed = content.trim();
    if (!trimmed) return;
    setSending(true);
    try {
      const msg = await sendMyMessage(trimmed);
      addMessage(msg);
    } finally {
      setSending(false);
    }
  }, [addMessage]);

  return (
    <ChatContext.Provider
      value={{
        isOpen, openChat, closeChat, toggleChat,
        messages, sendMessage, sending, loading, unreadCount,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChat must be used within ChatProvider");
  return context;
}

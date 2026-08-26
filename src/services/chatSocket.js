import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { getToken } from "../utils/authStorage";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

/**
 * Opens a STOMP-over-SockJS connection authenticated via the traveler's JWT
 * (passed as a query param since the initial SockJS handshake can't carry
 * custom headers) and subscribes to live updates for one conversation.
 * Returns the Client — caller must call client.deactivate() on cleanup.
 */
export function connectChatSocket({ conversationId, onMessage }) {
  const token = getToken();
  if (!token) {
    return null;
  }

  const client = new Client({
    webSocketFactory: () =>
      new SockJS(`${API_BASE}/ws-chat?token=${encodeURIComponent(token)}`, null, {
        // Restrict to modern transports — prevents legacy iframe.html 404s and jsonp MIME errors
        transports: ["websocket", "xhr-streaming", "xhr-polling"],
      }),
    reconnectDelay: 5000,
    onConnect: () => {
      client.subscribe(`/topic/chat.${conversationId}`, (frame) => {
        onMessage(JSON.parse(frame.body));
      });
    },
    onStompError: (frame) => {
      console.warn("Chat STOMP broker error:", frame?.headers?.["message"] || "Unknown STOMP error");
    },
  });

  client.activate();
  return client;
}

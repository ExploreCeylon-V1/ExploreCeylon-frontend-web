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

  const client = new Client({
    webSocketFactory: () => new SockJS(`${API_BASE}/ws-chat?token=${encodeURIComponent(token)}`),
    reconnectDelay: 4000,
    onConnect: () => {
      client.subscribe(`/topic/chat.${conversationId}`, (frame) => {
        onMessage(JSON.parse(frame.body));
      });
    },
  });

  client.activate();
  return client;
}

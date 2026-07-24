import apiClient from "./api";

export const getMyConversation = () =>
  apiClient.get("/api/v1/chat/my-conversation").then((r) => r.data);

export const getMyMessages = () =>
  apiClient.get("/api/v1/chat/my-conversation/messages").then((r) => r.data);

export const sendMyMessage = (content) =>
  apiClient
    .post("/api/v1/chat/my-conversation/messages", { content })
    .then((r) => r.data);

export const markMyConversationRead = () =>
  apiClient.patch("/api/v1/chat/my-conversation/read");

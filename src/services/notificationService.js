import apiClient from "./api";

export async function getMyNotifications() {
  const response = await apiClient.get("/api/v1/notifications/my");
  return response.data;
}

export async function getUnreadCount() {
  const response = await apiClient.get("/api/v1/notifications/unread-count");
  return response.data.count;
}

export async function markNotificationRead(id) {
  await apiClient.patch(`/api/v1/notifications/${id}/read`);
}

export async function markAllNotificationsRead() {
  await apiClient.patch("/api/v1/notifications/read-all");
}

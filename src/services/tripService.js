import apiClient from "./api";

// ── Get all trips for current user ────────────────────────
export async function getMyTrips() {
  const res = await apiClient.get("/api/v1/trips/my");
  return res.data;
}

// ── Get single trip by ID ──────────────────────────────────
export async function getTripById(id) {
  const res = await apiClient.get(`/api/v1/trips/${id}`);
  return res.data;
}

// ── Create new trip ────────────────────────────────────────
export async function createTrip(data) {
  const res = await apiClient.post("/api/v1/trips", data);
  return res.data;
}

// ── Generate AI itinerary ──────────────────────────────────
export async function generateAiItinerary(tripId, data) {
  try {
    const res = await apiClient.post(`/api/v1/trips/${tripId}/generate-ai`, {
      tripId,
      ...data,
    });
    return res.data;
  } catch (err) {
    const detail =
      err.response?.data?.message ||
      err.response?.data?.error ||
      err.response?.data?.detail;
    throw new Error(detail || `AI generation failed (HTTP ${err.response?.status || 500})`);
  }
}

// ── Update trip title ──────────────────────────────────────
export async function updateTripTitle(tripId, title) {
  const res = await apiClient.patch(`/api/v1/trips/${tripId}/title`, { title });
  return res.data;
}

// ── Update trip status ─────────────────────────────────────
export async function updateTripStatus(tripId, status) {
  const res = await apiClient.patch(
    `/api/v1/trips/${tripId}/status?status=${status}`
  );
  return res.data;
}

// ── Delete trip ────────────────────────────────────────────
export async function deleteTrip(tripId) {
  await apiClient.delete(`/api/v1/trips/${tripId}`);
}

// ── Get trip by share token (public) ──────────────────────
export async function getTripByShareToken(token) {
  const res = await apiClient.get(`/api/v1/trips/share/${token}`);
  return res.data;
}

// ── Update trip day ────────────────────────────────────────
export async function updateTripDay(tripId, dayId, data) {
  const res = await apiClient.put(
    `/api/v1/trips/${tripId}/days/${dayId}`,
    data
  );
  return res.data;
}

// ── Add item to day ────────────────────────────────────────
export async function addItemToDay(tripId, dayId, item) {
  const res = await apiClient.post(
    `/api/v1/trips/${tripId}/days/${dayId}/items`,
    item
  );
  return res.data;
}

// ── Remove item from day ───────────────────────────────────
export async function removeItemFromDay(tripId, dayId, itemId) {
  await apiClient.delete(
    `/api/v1/trips/${tripId}/days/${dayId}/items/${itemId}`
  );
}

// ── Add Day to Trip (Append Only) ──────────────────────────
export async function addDayToTrip(tripId, data) {
  try {
    const res = await apiClient.post(`/api/v1/trips/${tripId}/days`, data);
    return res.data;
  } catch (err) {
    const detail =
      err.response?.data?.message ||
      err.response?.data?.error ||
      err.response?.data?.detail;
    throw new Error(detail || `Failed to add day (HTTP ${err.response?.status || 500})`);
  }
}

// ── Remove Last Day from Trip ──────────────────────────────
export async function removeDayFromTrip(tripId, dayId) {
  try {
    const res = await apiClient.delete(`/api/v1/trips/${tripId}/days/${dayId}`);
    return res.data;
  } catch (err) {
    const detail =
      err.response?.data?.message ||
      err.response?.data?.error ||
      err.response?.data?.detail;
    throw new Error(detail || `Failed to remove day (HTTP ${err.response?.status || 500})`);
  }
}

// ── Get Syncable Bookings for Trip ─────────────────────────
export async function getSyncableBookings(tripId) {
  const res = await apiClient.get(`/api/v1/trips/${tripId}/syncable-bookings`);
  return res.data;
}

// ── Sync Booking to Trip Budget ────────────────────────────
export async function syncBookingToBudget(tripId, type, bookingId) {
  const res = await apiClient.post(`/api/v1/trips/${tripId}/budget/sync-booking/${type}/${bookingId}`);
  return res.data;
}

// ── Helpers ────────────────────────────────────────────────
export function formatDateRange(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  const opts = { month: "short", day: "numeric" };
  const full = { month: "short", day: "numeric", year: "numeric" };
  if (s.getFullYear() === e.getFullYear()) {
    return `${s.toLocaleDateString("en-US", opts)} – ${e.toLocaleDateString("en-US", full)}`;
  }
  return `${s.toLocaleDateString("en-US", full)} – ${e.toLocaleDateString("en-US", full)}`;
}

export function countDays(start, end) {
  return Math.round(Math.abs(new Date(end) - new Date(start)) / 86400000) + 1;
}

export function getRoutePreview(trip) {
  if (trip.fromLocation && trip.toLocation) {
    return `${trip.fromLocation} → ${trip.toLocation}`;
  }
  if (trip.regions) {
    return trip.regions.split(",").slice(0, 3).map(r => r.trim()).join(" → ");
  }
  return null;
}

export function getPlannedDays(trip) {
  if (!trip.days) return 0;
  return trip.days.filter(d => d.items && d.items.length > 0).length;
}

export const STATUS_META = {
  DRAFT: {
    label: "Draft", emoji: "📝",
    textColor: "text-gray-600", bgColor: "bg-gray-100",
  },
  CONFIRMED: {
    label: "Confirmed", emoji: "✅",
    textColor: "text-green-800", bgColor: "bg-green-100",
  },
  COMPLETED: {
    label: "Completed", emoji: "✔️",
    textColor: "text-blue-800", bgColor: "bg-blue-100",
  },
};

export const STYLE_EMOJI = {
  ADVENTURE: "🏔️",
  CULTURE_HERITAGE: "🏛️",
  RELIGIOUS: "🛕",
  WILDLIFE_NATURE: "🦁",
  BEACH_COAST: "🏖️",
  HILL_COUNTRY: "⛰️",
  SCENIC_VIEWS: "🌄",
  CITY_URBAN: "🏙️",
};

export const BUDGET_EMOJI = {
  BUDGET: "💚", MID_RANGE: "🔥", LUXURY: "👑",
};
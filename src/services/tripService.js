const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

function getAuthHeader() {
  const token =
    localStorage.getItem("travelerToken") ||
    localStorage.getItem("ec_traveler_token") ||
    localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── Get all trips for current user ────────────────────────
export async function getMyTrips() {
  const res = await fetch(`${API_BASE}/api/v1/trips/my`, {
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) throw new Error("Failed to load trips");
  return res.json();
}

// ── Get single trip by ID ──────────────────────────────────
export async function getTripById(id) {
  const res = await fetch(`${API_BASE}/api/v1/trips/${id}`, {
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) throw new Error("Trip not found");
  return res.json();
}

// ── Create new trip ────────────────────────────────────────
export async function createTrip(data) {
  const res = await fetch(`${API_BASE}/api/v1/trips`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to create trip");
  }
  return res.json();
}

// ── Generate AI itinerary ──────────────────────────────────
export async function generateAiItinerary(tripId, data) {
  const res = await fetch(`${API_BASE}/api/v1/trips/${tripId}/generate-ai`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify({ tripId, ...data }),
  });
  if (!res.ok) throw new Error("AI generation failed");
  return res.json();
}

// ── Update trip title ──────────────────────────────────────
export async function updateTripTitle(tripId, title) {
  const res = await fetch(`${API_BASE}/api/v1/trips/${tripId}/title`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error("Failed to update title");
  return res.json();
}

// ── Update trip status ─────────────────────────────────────
export async function updateTripStatus(tripId, status) {
  const res = await fetch(
    `${API_BASE}/api/v1/trips/${tripId}/status?status=${status}`,
    { method: "PATCH", headers: { ...getAuthHeader() } }
  );
  if (!res.ok) throw new Error("Failed to update status");
  return res.json();
}

// ── Delete trip ────────────────────────────────────────────
export async function deleteTrip(tripId) {
  const res = await fetch(`${API_BASE}/api/v1/trips/${tripId}`, {
    method: "DELETE",
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) throw new Error("Failed to delete trip");
}

// ── Get trip by share token (public) ──────────────────────
export async function getTripByShareToken(token) {
  const res = await fetch(`${API_BASE}/api/v1/trips/share/${token}`);
  if (!res.ok) throw new Error("Trip not found");
  return res.json();
}

// ── Update trip day ────────────────────────────────────────
export async function updateTripDay(tripId, dayId, data) {
  const res = await fetch(
    `${API_BASE}/api/v1/trips/${tripId}/days/${dayId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(data),
    }
  );
  if (!res.ok) throw new Error("Failed to update day");
  return res.json();
}

// ── Add item to day ────────────────────────────────────────
export async function addItemToDay(tripId, dayId, item) {
  const res = await fetch(
    `${API_BASE}/api/v1/trips/${tripId}/days/${dayId}/items`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(item),
    }
  );
  if (!res.ok) throw new Error("Failed to add item");
  return res.json();
}

// ── Remove item from day ───────────────────────────────────
export async function removeItemFromDay(tripId, dayId, itemId) {
  const res = await fetch(
    `${API_BASE}/api/v1/trips/${tripId}/days/${dayId}/items/${itemId}`,
    { method: "DELETE", headers: { ...getAuthHeader() } }
  );
  if (!res.ok) throw new Error("Failed to remove item");
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
  ADVENTURE: "🏔️", CULTURAL: "🏛️", RELAXATION: "🌴",
  FAMILY: "👨‍👩‍👧", HONEYMOON: "💑", PILGRIMAGE: "🛕",
  WILDLIFE: "🦁", PHOTOGRAPHY: "📸",
};

export const BUDGET_EMOJI = {
  BUDGET: "💚", MID_RANGE: "🔥", LUXURY: "👑",
};
import apiClient from "./api";

// ─── Trip CRUD ────────────────────────────────────────────────────────────────

export async function fetchMyTrips() {
  const res = await apiClient.get("/api/v1/trips/my");
  return res.data;
}

export async function deleteTrip(tripId) {
  await apiClient.delete(`/api/v1/trips/${tripId}`);
  return true;
}

export async function updateTripStatus(tripId, newStatus) {
  const res = await apiClient.patch(
    `/api/v1/trips/${tripId}/status?status=${newStatus}`
  );
  return res.data;
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────

export function formatDateRange(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  const opts = { month: "short", day: "numeric" };
  const yearOpts = { month: "short", day: "numeric", year: "numeric" };
  if (s.getFullYear() === e.getFullYear()) {
    return `${s.toLocaleDateString("en-US", opts)} – ${e.toLocaleDateString("en-US", yearOpts)}`;
  }
  return `${s.toLocaleDateString("en-US", yearOpts)} – ${e.toLocaleDateString("en-US", yearOpts)}`;
}

export function countDays(start, end) {
  const diff = Math.abs(new Date(end) - new Date(start));
  return Math.round(diff / (1000 * 60 * 60 * 24)) + 1;
}

export function getRoutePreview(trip) {
  if (trip.fromLocation && trip.toLocation) {
    return `${trip.fromLocation} → ${trip.toLocation}`;
  }
  if (trip.regions) {
    return trip.regions
      .split(",")
      .slice(0, 3)
      .map((r) => r.trim())
      .join(" → ");
  }
  return null;
}

export function getPlannedDays(trip) {
  if (!trip.days) return 0;
  return trip.days.filter((d) => d.items && d.items.length > 0).length;
}

export function buildShareUrl(shareToken) {
  return `${window.location.origin}/trips/share/${shareToken}`;
}

export function filterTrips(trips, { activeFilter, search }) {
  return trips.filter((t) => {
    const matchFilter = activeFilter === "All" || t.status === activeFilter;
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      (t.title || "").toLowerCase().includes(q) ||
      (t.fromLocation || "").toLowerCase().includes(q) ||
      (t.toLocation || "").toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });
}

export function countByStatus(trips) {
  if (!trips) return {};
  return {
    All: trips.length,
    DRAFT: trips.filter((t) => t.status === "DRAFT").length,
    GENERATED: trips.filter((t) => t.status === "GENERATED").length,
    PLANNING: trips.filter((t) => t.status === "PLANNING").length,
    CONFIRMED: trips.filter((t) => t.status === "CONFIRMED").length,
    ACTIVE: trips.filter((t) => t.status === "ACTIVE").length,
    COMPLETED: trips.filter((t) => t.status === "COMPLETED").length,
    CANCELLED: trips.filter((t) => t.status === "CANCELLED").length,
  };
}

// ─── Static lookup maps ───────────────────────────────────────────────────────

export const STATUS_FILTERS = ["All", "DRAFT", "GENERATED", "PLANNING", "CONFIRMED", "ACTIVE", "COMPLETED", "CANCELLED"];

export const STATUS_META = {
  DRAFT:     { label: "Draft",     emoji: "📝", color: "text-gray-600",  bg: "bg-gray-100"  },
  GENERATED: { label: "Generated", emoji: "⚡", color: "text-amber-800", bg: "bg-amber-100" },
  PLANNING:  { label: "Planning",  emoji: "✏️", color: "text-emerald-800", bg: "bg-emerald-100" },
  CONFIRMED: { label: "Confirmed", emoji: "✅", color: "text-green-800", bg: "bg-green-100" },
  STARTED:   { label: "Started",   emoji: "🚗", color: "text-purple-800", bg: "bg-purple-100" },
  ACTIVE:    { label: "Active",    emoji: "🚗", color: "text-purple-800", bg: "bg-purple-100" },
  COMPLETED: { label: "Completed", emoji: "🏁", color: "text-blue-800",  bg: "bg-blue-100"  },
  CANCELLED: { label: "Cancelled", emoji: "🚫", color: "text-red-800",   bg: "bg-red-100"   },
  ARCHIVED:  { label: "Archived",  emoji: "📦", color: "text-gray-500",  bg: "bg-gray-100"  },
};

export const FILTER_LABEL = {
  DRAFT: "Draft",
  GENERATED: "Generated",
  PLANNING: "Planning",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export async function restoreTrip(tripId) {
  const res = await apiClient.post(`/api/v1/planner/${tripId}/restore`);
  return res.data;
}

export async function fetchTripActivityLogs(tripId) {
  try {
    const res = await apiClient.get(`/api/v1/planner/${tripId}/activity-logs`);
    return res.data;
  } catch {
    return [];
  }
}

export async function revokeShareToken(tripId) {
  const res = await apiClient.post(`/api/v1/planner/${tripId}/share/revoke`);
  return res.data;
}

export async function regenerateShareToken(tripId) {
  const res = await apiClient.post(`/api/v1/planner/${tripId}/share/regenerate`);
  return res.data;
}

export const STYLE_EMOJI = {
  ADVENTURE:   "🏔️",
  CULTURAL:    "🏛️",
  RELAXATION:  "🌴",
  FAMILY:      "👨‍👩‍👧",
  HONEYMOON:   "💑",
  PILGRIMAGE:  "🛕",
  WILDLIFE:    "🦁",
  PHOTOGRAPHY: "📸",
};

export const BUDGET_EMOJI = {
  BUDGET:    "💚",
  MID_RANGE: "🔥",
  LUXURY:    "👑",
};
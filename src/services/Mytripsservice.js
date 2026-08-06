// MyTripsService.js
// All API calls and pure utility functions for the My Trips feature

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// ─── Trip CRUD ────────────────────────────────────────────────────────────────

export async function fetchMyTrips(token) {
  const res = await fetch(`${API_BASE}/api/v1/trips/my`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to load trips");
  return res.json();
}

export async function deleteTrip(tripId, token) {
  const res = await fetch(`${API_BASE}/api/v1/trips/${tripId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Delete failed");
  return true;
}

export async function updateTripStatus(tripId, newStatus, token) {
  const res = await fetch(
    `${API_BASE}/api/v1/trips/${tripId}/status?status=${newStatus}`,
    { method: "PATCH", headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) throw new Error("Status update failed");
  return res.json();
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
  return {
    All: trips.length,
    DRAFT: trips.filter((t) => t.status === "DRAFT").length,
    CONFIRMED: trips.filter((t) => t.status === "CONFIRMED").length,
    COMPLETED: trips.filter((t) => t.status === "COMPLETED").length,
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

export async function restoreTrip(tripId, token) {
  const res = await fetch(`${API_BASE}/api/v1/planner/${tripId}/restore`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Restore trip failed");
  return res.json();
}

export async function fetchTripActivityLogs(tripId, token) {
  const res = await fetch(`${API_BASE}/api/v1/planner/${tripId}/activity-logs`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  return res.json();
}

export async function revokeShareToken(tripId, token) {
  const res = await fetch(`${API_BASE}/api/v1/planner/${tripId}/share/revoke`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Revoke share failed");
  return res.json();
}

export async function regenerateShareToken(tripId, token) {
  const res = await fetch(`${API_BASE}/api/v1/planner/${tripId}/share/regenerate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Regenerate share failed");
  return res.json();
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
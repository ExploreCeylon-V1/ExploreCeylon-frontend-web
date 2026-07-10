// MyTripsPage.jsx
// Pure UI layer — all API calls and helpers live in MyTripsService.js

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  fetchMyTrips,
  deleteTrip,
  updateTripStatus,
  buildShareUrl,
  formatDateRange,
  countDays,
  getRoutePreview,
  getPlannedDays,
  filterTrips,
  countByStatus,
  STATUS_FILTERS,
  STATUS_META,
  FILTER_LABEL,
  STYLE_EMOJI,
  BUDGET_EMOJI,
} from "../services/Mytripsservice";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

// ─── TripCard ─────────────────────────────────────────────────────────────────

function TripCard({ trip, onDelete, onStatusChange }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const navigate  = useNavigate();
  const { token } = useAuth();

  const meta      = STATUS_META[trip.status] || STATUS_META.DRAFT;
  const days      = countDays(trip.startDate, trip.endDate);
  const route     = getRoutePreview(trip);
  const planned   = getPlannedDays(trip);
  const progress  = days > 0 ? Math.round((planned / days) * 100) : 0;
  const budgetPct = trip.totalBudget
    ? Math.min(100, Math.round(((trip.spentAmount || 0) / trip.totalBudget) * 100))
    : 0;

  async function handleDelete() {
    if (!window.confirm(`Delete "${trip.title}"?`)) return;
    setDeleting(true);
    try {
      await deleteTrip(trip.id, token);
      onDelete(trip.id);
    } catch {
      alert("Delete failed");
    } finally {
      setDeleting(false);
      setMenuOpen(false);
    }
  }

  async function handleStatusChange(newStatus) {
    try {
      const updated = await updateTripStatus(trip.id, newStatus, token);
      onStatusChange(updated);
    } catch {
      alert("Status update failed");
    }
    setMenuOpen(false);
  }

  function handleShare() {
    navigator.clipboard
      .writeText(buildShareUrl(trip.shareToken))
      .then(() => alert("Share link copied!"))
      .catch(() => alert(`Share link: ${buildShareUrl(trip.shareToken)}`));
    setMenuOpen(false);
  }

  // style / budget label helpers
  const styleLabel = trip.travelStyle
    ? trip.travelStyle.charAt(0) + trip.travelStyle.slice(1).toLowerCase()
    : null;
  const budgetLabel = trip.budgetRange
    ? trip.budgetRange.replace("_", "-").charAt(0) +
      trip.budgetRange.replace("_", "-").slice(1).toLowerCase()
    : null;

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm
                    hover:shadow-md transition-shadow duration-150 relative">

      {/* ── Header row ── */}
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-semibold px-3 py-1 rounded-full
                          ${meta.color} ${meta.bg}`}>
          {meta.label} {meta.emoji}
        </span>

        {/* Overflow menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="text-gray-400 hover:bg-gray-100 rounded-md px-2 py-0.5
                       text-xl leading-none transition-colors"
            title="More options"
          >
            ⋮
          </button>

          {menuOpen && (
            <>
              {/* backdrop */}
              <div className="fixed inset-0 z-40"
                   onClick={() => setMenuOpen(false)} />

              <div className="absolute right-0 top-full mt-1 bg-white border
                              border-gray-200 rounded-xl shadow-lg z-50
                              min-w-[180px] overflow-hidden">
                {[
                  {
                    label: "👁 View Trip",
                    onClick: () => { navigate(`/trips/${trip.id}`); setMenuOpen(false); },
                  },
                  trip.status === "DRAFT" && {
                    label: "✅ Mark Confirmed",
                    onClick: () => handleStatusChange("CONFIRMED"),
                  },
                  trip.status === "CONFIRMED" && {
                    label: "🏁 Mark Completed",
                    onClick: () => handleStatusChange("COMPLETED"),
                  },
                  { label: "🔗 Copy Share Link", onClick: handleShare },
                  {
                    label: deleting ? "🗑 Deleting…" : "🗑 Delete",
                    onClick: handleDelete,
                    danger: true,
                    disabled: deleting,
                  },
                ]
                  .filter(Boolean)
                  .map((item, i) => (
                    <button
                      key={i}
                      onClick={item.onClick}
                      disabled={item.disabled}
                      className={`w-full text-left px-4 py-2.5 text-sm
                                  hover:bg-gray-50 transition-colors
                                  disabled:opacity-50
                                  ${item.danger ? "text-red-600" : "text-gray-700"}`}
                    >
                      {item.label}
                    </button>
                  ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Title ── */}
      <h3 className="text-base font-bold text-gray-900 mb-2 leading-snug">
        🗺️ {trip.title || `${days}-Day Sri Lanka Trip`}
      </h3>

      {/* ── Meta info ── */}
      <div className="space-y-1 text-sm text-gray-500 mb-2">
        <div>📅 {formatDateRange(trip.startDate, trip.endDate)}</div>

        <div className="flex items-center gap-2">
          <span>🕐 {days} Days</span>
          <span className="text-gray-300">|</span>
          <span>👥 {trip.groupSize || 1} Traveler{trip.groupSize > 1 ? "s" : ""}</span>
        </div>

        {route && <div>📍 {route}</div>}

        {(styleLabel || budgetLabel) && (
          <div className="flex items-center gap-2">
            {styleLabel && (
              <span>{STYLE_EMOJI[trip.travelStyle] || "🌏"} {styleLabel}</span>
            )}
            {styleLabel && budgetLabel && (
              <span className="text-gray-300">|</span>
            )}
            {budgetLabel && (
              <span>{BUDGET_EMOJI[trip.budgetRange] || "💰"} {budgetLabel}</span>
            )}
          </div>
        )}
      </div>

      {/* ── AI badge ── */}
      {trip.aiGenerated && (
        <span className="inline-flex items-center gap-1 text-xs font-semibold
                         text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full mb-3">
          🤖 ✨ AI Generated
        </span>
      )}

      {/* ── Progress bar — DRAFT ── */}
      {trip.status === "DRAFT" && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-400 mb-1.5">
            <span>Progress</span>
            <span>{planned}/{days} days planned</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-700 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Budget bar — CONFIRMED ── */}
      {trip.status === "CONFIRMED" && trip.totalBudget && (
        <div className="mt-3">
          <div className="text-xs text-gray-400 mb-1.5">
            Budget: ${trip.totalBudget} set | ${trip.spentAmount || 0} spent ({budgetPct}%)
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-700 rounded-full transition-all duration-500"
              style={{ width: `${budgetPct}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Spent note — COMPLETED ── */}
      {trip.status === "COMPLETED" && trip.totalBudget && (
        <p className="mt-3 text-sm font-medium text-gray-700">
          Total spent: ${trip.spentAmount || 0} of ${trip.totalBudget}
        </p>
      )}

      {/* ── Review prompt — COMPLETED ── */}
      {trip.status === "COMPLETED" && (
        <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg
                        px-3 py-2 text-xs text-yellow-800">
          ⭐{" "}
          <Link
            to={`/trips/${trip.id}/review`}
            className="font-semibold text-yellow-700 hover:underline"
          >
            Leave a review for guides/vehicles
          </Link>
        </div>
      )}

      {/* ── Action buttons ── */}
      <div className="flex gap-2 mt-4 flex-wrap">
        {trip.status === "DRAFT" && (
          <>
            <ActionBtn onClick={() => navigate(`/trips/${trip.id}`)}>👁 View</ActionBtn>
            <ActionBtn onClick={() => navigate(`/trips/${trip.id}/edit`)}>✏️ Edit</ActionBtn>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 min-w-[80px] px-3 py-2 rounded-lg border
                         border-red-200 bg-white text-red-600 text-sm font-medium
                         hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              🗑 {deleting ? "…" : "Delete"}
            </button>
          </>
        )}

        {trip.status === "CONFIRMED" && (
          <>
            <ActionBtn onClick={() => navigate(`/trips/${trip.id}`)}>👁 View</ActionBtn>
            <ActionBtn onClick={handleShare}>🔗 Share</ActionBtn>
            <ActionBtn onClick={() => navigate("/budget")}>💲 Budget</ActionBtn>
          </>
        )}

        {trip.status === "COMPLETED" && (
          <>
            <ActionBtn onClick={() => navigate(`/trips/${trip.id}`)}>👁 View</ActionBtn>
            <ActionBtn onClick={() => navigate(`/trips/${trip.id}/summary`)}>📋 Summary</ActionBtn>
            <ActionBtn onClick={() => navigate(`/trips/${trip.id}/review`)}>⭐ Review</ActionBtn>
          </>
        )}
      </div>
    </div>
  );
}

function ActionBtn({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 min-w-[80px] px-3 py-2 rounded-lg border border-gray-200
                 bg-white text-gray-600 text-sm font-medium hover:border-green-700
                 hover:text-green-700 hover:bg-green-50 transition-colors whitespace-nowrap"
    >
      {children}
    </button>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

function EmptyState({ icon, title, body, children }) {
  return (
    <div className="flex flex-col items-center justify-center mt-20 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-800 mb-1">{title}</h3>
      <p className="text-sm text-gray-500">{body}</p>
      {children}
    </div>
  );
}

// ─── MyTripsPage ──────────────────────────────────────────────────────────────

export default function MyTripsPage() {
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [trips,        setTrips]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [activeFilter, setActiveFilter] = useState("All");
  const [search,       setSearch]       = useState("");

  useEffect(() => {
    if (!isAuthenticated) { navigate("/login"); return; }
    loadTrips();
  }, [isAuthenticated]);

  async function loadTrips() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMyTrips(token);
      setTrips(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const counts   = countByStatus(trips);
  const filtered = filterTrips(trips, { activeFilter, search });

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gray-50 px-6 py-8 pb-16">
        <div className="max-w-6xl mx-auto">

          {/* ── Top bar ── */}
          <div className="flex items-center justify-between flex-wrap gap-3 mb-7">
            <h1 className="text-2xl font-bold text-gray-900">My Trips</h1>
            <Link
              to="/trips/new"
              className="inline-flex items-center gap-1.5 bg-green-800
                         hover:bg-green-900 text-white text-sm font-semibold
                         px-5 py-2.5 rounded-xl transition-colors shadow-sm"
            >
              + Create New Trip
            </Link>
          </div>

          {/* ── Filter tabs ── */}
          <div className="flex gap-2 flex-wrap mb-4">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium
                            border transition-colors
                            ${activeFilter === f
                              ? "bg-green-800 border-green-800 text-white"
                              : "bg-white border-gray-200 text-gray-600 hover:border-green-700 hover:text-green-700"
                            }`}
              >
                {f === "All"
                  ? `All Trips (${counts.All})`
                  : `${FILTER_LABEL[f]} (${counts[f]})`}
              </button>
            ))}
          </div>

          {/* ── Search ── */}
          <input
            type="text"
            placeholder="Search trips by name or location…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full mb-6 px-4 py-3 rounded-xl border border-gray-200
                       bg-white text-sm text-gray-900 placeholder-gray-400
                       outline-none focus:border-green-700 focus:ring-2
                       focus:ring-green-100 transition-colors"
          />

          {/* ── States ── */}
          {loading ? (
            <div className="flex flex-col items-center justify-center mt-24
                            text-gray-400 text-sm gap-3">
              <div className="w-9 h-9 border-4 border-green-100
                              border-t-green-700 rounded-full animate-spin" />
              Loading your trips…
            </div>

          ) : error ? (
            <EmptyState icon="⚠️" title="Failed to load trips" body={error}>
              <button
                onClick={loadTrips}
                className="mt-4 px-5 py-2 rounded-lg border border-gray-200
                           text-sm font-medium text-gray-700
                           hover:border-green-700 hover:text-green-700 transition-colors"
              >
                Try Again
              </button>
            </EmptyState>

          ) : filtered.length === 0 ? (
            <EmptyState
              icon="🗺️"
              title={search ? "No trips match your search" : "No trips yet"}
              body={
                search
                  ? "Try a different search term."
                  : "Start planning your Sri Lanka adventure!"
              }
            >
              {!search && (
                <Link
                  to="/trips/new"
                  className="mt-4 inline-flex items-center gap-1 bg-green-800
                             hover:bg-green-900 text-white text-sm font-semibold
                             px-5 py-2.5 rounded-xl transition-colors"
                >
                  + Create Your First Trip
                </Link>
              )}
            </EmptyState>

          ) : (
            <div className="grid gap-5 sm:grid-cols-1 lg:grid-cols-2">
              {filtered.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  onDelete={(id) =>
                    setTrips((p) => p.filter((t) => t.id !== id))
                  }
                  onStatusChange={(updated) =>
                    setTrips((p) =>
                      p.map((t) => (t.id === updated.id ? updated : t))
                    )
                  }
                />
              ))}
            </div>
          )}

        </div>
      </div>

      <Footer />
    </>
  );
}
// MyTripsPage.jsx
// Pure UI layer — all API calls and helpers live in MyTripsService.js

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  fetchMyTrips,
  deleteTrip,
  updateTripStatus,
  restoreTrip,
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
import { MapPin, Calendar, Clock, Users, Sparkles, Plus, Search, MoreVertical, Eye, CheckCircle2, RotateCcw, Ban, Copy, Trash2 } from "lucide-react";

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
      await deleteTrip(trip.id);
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
      const updated = await updateTripStatus(trip.id, newStatus);
      onStatusChange(updated);
    } catch {
      alert("Status update failed");
    }
    setMenuOpen(false);
  }

  async function handleRestore() {
    try {
      const updated = await restoreTrip(trip.id);
      onStatusChange(updated);
    } catch {
      alert("Restore trip failed");
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

  const styleLabel = trip.travelStyle
    ? trip.travelStyle.charAt(0) + trip.travelStyle.slice(1).toLowerCase()
    : null;
  const budgetLabel = trip.budgetRange
    ? trip.budgetRange.replace("_", "-").charAt(0) +
      trip.budgetRange.replace("_", "-").slice(1).toLowerCase()
    : null;

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-950/10">

      <div>
        {/* Header row */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase shadow-2xs ${meta.color} ${meta.bg}`}>
            <span>{meta.emoji}</span>
            <span>{meta.label}</span>
          </span>

          {/* Menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
              title="Trip Options"
            >
              <MoreVertical size={18} />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1.5 w-48 overflow-hidden rounded-2xl border border-gray-100 bg-white p-1.5 shadow-xl shadow-gray-900/10 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {[
                    {
                      label: "View Trip",
                      icon: <Eye size={15} />,
                      onClick: () => { navigate(`/trips/${trip.id}`); setMenuOpen(false); },
                    },
                    (trip.status === "DRAFT" || trip.status === "GENERATED" || trip.status === "PLANNING") && {
                      label: "Mark Confirmed",
                      icon: <CheckCircle2 size={15} />,
                      onClick: () => handleStatusChange("CONFIRMED"),
                    },
                    trip.status === "CONFIRMED" && {
                      label: "Mark Completed",
                      icon: <CheckCircle2 size={15} />,
                      onClick: () => handleStatusChange("COMPLETED"),
                    },
                    trip.status === "CANCELLED" && {
                      label: "Restore Trip",
                      icon: <RotateCcw size={15} />,
                      onClick: handleRestore,
                    },
                    (trip.status !== "CANCELLED" && trip.status !== "COMPLETED") && {
                      label: "Cancel Trip",
                      icon: <Ban size={15} />,
                      onClick: () => handleStatusChange("CANCELLED"),
                    },
                    { label: "Copy Share Link", icon: <Copy size={15} />, onClick: handleShare },
                    {
                      label: deleting ? "Deleting…" : "Delete Trip",
                      icon: <Trash2 size={15} />,
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
                        className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-50 ${
                          item.danger
                            ? "text-red-600 hover:bg-red-50"
                            : "text-gray-700 hover:bg-emerald-50/70 hover:text-emerald-800"
                        }`}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </button>
                    ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-gray-900 group-hover:text-emerald-800 transition-colors mb-2 leading-snug">
          🗺️ {trip.title || `${days}-Day Sri Lanka Trip`}
        </h3>

        {/* Metadata Details */}
        <div className="space-y-1.5 text-xs text-gray-500 mb-4">
          <div className="flex items-center gap-1.5 font-medium text-gray-700">
            <Calendar size={14} className="text-emerald-700 shrink-0" />
            <span>{formatDateRange(trip.startDate, trip.endDate)}</span>
          </div>

          <div className="flex items-center gap-2.5 font-medium">
            <span className="flex items-center gap-1"><Clock size={13} className="text-slate-400" /> {days} Days</span>
            <span className="text-gray-300">|</span>
            <span className="flex items-center gap-1"><Users size={13} className="text-slate-400" /> {trip.groupSize || 1} Traveler{trip.groupSize > 1 ? "s" : ""}</span>
          </div>

          {route && (
            <div className="flex items-center gap-1.5 text-gray-600">
              <MapPin size={14} className="text-rose-500 shrink-0" />
              <span className="truncate">{route}</span>
            </div>
          )}

          {(styleLabel || budgetLabel) && (
            <div className="flex items-center gap-2 pt-1">
              {styleLabel && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-3xs font-semibold text-slate-700">
                  {STYLE_EMOJI[trip.travelStyle] || "🌏"} {styleLabel}
                </span>
              )}
              {budgetLabel && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-3xs font-semibold text-amber-800 border border-amber-200/50">
                  {BUDGET_EMOJI[trip.budgetRange] || "💰"} {budgetLabel}
                </span>
              )}
            </div>
          )}
        </div>

        {/* AI Badge */}
        {trip.aiGenerated && (
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-3xs font-bold text-emerald-800">
            <Sparkles size={13} className="text-emerald-600" /> AI Generated Itinerary
          </div>
        )}
      </div>

      {/* Footer Bars & Action Buttons */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        {trip.status === "DRAFT" && (
          <div className="mb-3">
            <div className="flex justify-between text-3xs font-semibold text-gray-500 mb-1">
              <span>Planning Progress</span>
              <span>{planned}/{days} days planned ({progress}%)</span>
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-700 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {trip.status === "CONFIRMED" && trip.totalBudget && (
          <div className="mb-3">
            <div className="flex justify-between text-3xs font-semibold text-gray-500 mb-1">
              <span>Budget Usage</span>
              <span>${trip.spentAmount || 0} / ${trip.totalBudget} ({budgetPct}%)</span>
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-700 rounded-full transition-all duration-500" style={{ width: `${budgetPct}%` }} />
            </div>
          </div>
        )}

        {/* Action Button Strip */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => navigate(`/trips/${trip.id}`)}
            className="flex-1 min-w-[90px] inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white py-2 px-3 text-xs font-semibold text-gray-700 transition-colors hover:border-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
          >
            <Eye size={14} /> View Trip
          </button>

          {trip.status === "CONFIRMED" && (
            <button
              onClick={handleShare}
              className="inline-flex items-center justify-center gap-1 rounded-xl border border-gray-200 bg-white py-2 px-3 text-xs font-semibold text-gray-700 transition-colors hover:border-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
            >
              <Copy size={13} /> Share
            </button>
          )}

          {trip.status === "CANCELLED" && (
            <button
              onClick={handleRestore}
              className="inline-flex items-center justify-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 py-2 px-3 text-xs font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
            >
              <RotateCcw size={13} /> Restore
            </button>
          )}
        </div>
      </div>

    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

function EmptyState({ icon, title, body, children }) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-12 bg-white rounded-3xl border border-gray-200/80 shadow-sm max-w-lg mx-auto my-8">
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
      <p className="text-xs text-gray-500 max-w-xs mb-4 leading-relaxed">{body}</p>
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
  }, [isAuthenticated, navigate]);

  async function loadTrips() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMyTrips();
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

      <div className="min-h-screen bg-slate-50 px-4 sm:px-6 py-8 pb-16">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* Hero Top Bar */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-900 to-green-950 p-6 sm:p-8 text-white shadow-xl">
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1 text-3xs font-semibold uppercase tracking-widest text-emerald-300 mb-2">
                  <Sparkles size={12} /> Traveler Dashboard
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">My Trips</h1>
                <p className="text-xs sm:text-sm text-emerald-100/80 mt-1 max-w-md">
                  Manage, track, and share your AI-generated Sri Lanka itineraries and travel plans.
                </p>
              </div>

              <Link
                to="/trips/new"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs sm:text-sm font-bold px-5 py-3 rounded-2xl transition-all shadow-lg hover:shadow-emerald-500/20 active:scale-95 shrink-0"
              >
                <Plus size={16} /> Create New Trip
              </Link>
            </div>
          </div>

          {/* Filter Bar & Search */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Filter Tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-semibold border transition-all whitespace-nowrap ${
                    activeFilter === f
                      ? "bg-emerald-800 border-emerald-800 text-white shadow-sm"
                      : "bg-white border-gray-200 text-gray-600 hover:border-emerald-600 hover:text-emerald-800"
                  }`}
                >
                  {f === "All"
                    ? `All Trips (${counts.All || 0})`
                    : `${FILTER_LABEL[f]} (${counts[f] || 0})`}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search trips by name or location…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-xs text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10"
              />
            </div>
          </div>

          {/* States */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-xs gap-3">
              <div className="w-8 h-8 border-3 border-emerald-200 border-t-emerald-800 rounded-full animate-spin" />
              Loading your trips…
            </div>
          ) : error ? (
            <EmptyState icon="⚠️" title="Failed to load trips" body={error}>
              <button
                onClick={loadTrips}
                className="mt-4 px-5 py-2.5 rounded-2xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:border-emerald-700 hover:text-emerald-800 transition-colors"
              >
                Try Again
              </button>
            </EmptyState>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon="🗺️"
              title={search ? "No trips match your search" : "No trips found"}
              body={
                search
                  ? "Try searching for a different keyword or location."
                  : "Start planning your Sri Lanka adventure today!"
              }
            >
              {!search && (
                <Link
                  to="/trips/new"
                  className="mt-4 inline-flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold px-5 py-2.5 rounded-2xl transition-colors shadow-sm"
                >
                  <Plus size={15} /> Create Your First Trip
                </Link>
              )}
            </EmptyState>
          ) : (
            <div className="grid gap-5 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
              {filtered.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  onDelete={(id) => setTrips((p) => p.filter((t) => t.id !== id))}
                  onStatusChange={(updated) => {
                    const targetId = updated.id || updated.tripId;
                    setTrips((p) =>
                      p.map((t) =>
                        t.id === targetId
                          ? { ...t, status: updated.status || t.status }
                          : t
                      )
                    );
                    loadTrips();
                  }}
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
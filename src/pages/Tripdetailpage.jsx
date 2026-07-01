// TripDetailPage.jsx
// Shows full AI-generated itinerary with day cards, map sidebar, stats

import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import TripMapPanel from "../components/TripMapPanel";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// ── Item type config ───────────────────────────────────────
const ITEM_TYPE_META = {
  ACTIVITY:  { label: "Activity",   color: "bg-blue-100 text-blue-700",   icon: "🎯" },
  TRANSPORT: { label: "Transport",  color: "bg-orange-100 text-orange-700", icon: "🚗" },
  GEM:       { label: "Hidden Gem", color: "bg-purple-100 text-purple-700", icon: "💎" },
  HOTEL:     { label: "Hotel",      color: "bg-green-100 text-green-700",  icon: "🏨" },
  FOOD:      { label: "Food",       color: "bg-yellow-100 text-yellow-700", icon: "🍽️" },
  GUIDE:     { label: "Guide",      color: "bg-teal-100 text-teal-700",    icon: "👤" },
};

const ADD_TYPES = [
  { value: "HOTEL",     label: "Hotel",      icon: "🏨" },
  { value: "TRANSPORT", label: "Transport",  icon: "🚗" },
  { value: "ACTIVITY",  label: "Activity",   icon: "🎯" },
  { value: "GEM",       label: "Attraction", icon: "💎" },
  { value: "FOOD",      label: "Food",       icon: "🍽️" },
  { value: "GUIDE",     label: "Other",      icon: "📌" },
];

const STATUS_META = {
  DRAFT:     { label: "DRAFT",     color: "text-gray-500 bg-gray-100" },
  CONFIRMED: { label: "CONFIRMED", color: "text-green-700 bg-green-100" },
  COMPLETED: { label: "COMPLETED", color: "text-blue-700 bg-blue-100" },
};

// ── Helpers ────────────────────────────────────────────────
function formatDate(d) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });
}
function formatDateShort(d) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}
function countDays(start, end) {
  return Math.round(Math.abs(new Date(end) - new Date(start)) / 86400000) + 1;
}
function getTotalItems(trip) {
  return (trip.days || []).reduce((s, d) => s + (d.items || []).length, 0);
}
function getUniqueRegions(trip) {
  const regions = (trip.days || [])
    .map(d => d.region)
    .filter(Boolean);
  return [...new Set(regions)].length;
}

// ── Add Item Modal ─────────────────────────────────────────
function AddItemModal({ dayId, tripId, token, onClose, onAdded }) {
  const [type,  setType]  = useState("ACTIVITY");
  const [title, setTitle] = useState("");
  const [cost,  setCost]  = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/v1/trips/${tripId}/days/${dayId}/items`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            type,
            title: title.trim(),
            cost: parseFloat(cost) || 0,
            currency: "USD",
            notes: notes.trim() || null,
            orderIndex: 99,
          }),
        }
      );
      if (!res.ok) throw new Error();
      const item = await res.json();
      onAdded(dayId, item);
      onClose();
    } catch {
      alert("Failed to add item");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center
                    bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-gray-900">Add Item to Day</h3>
          <button onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        {/* Type selector */}
        <div className="flex flex-wrap gap-2 mb-4">
          {ADD_TYPES.map(t => (
            <button key={t.value} onClick={() => setType(t.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold
                          border transition-colors
                          ${type === t.value
                            ? "bg-green-800 border-green-800 text-white"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                          }`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div className="space-y-3 mb-5">
          <input type="text" placeholder="Title *" value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5
                       text-sm outline-none focus:border-green-700
                       focus:ring-2 focus:ring-green-100"/>
          <input type="number" placeholder="Cost (USD)" value={cost}
            onChange={e => setCost(e.target.value)} min="0"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5
                       text-sm outline-none focus:border-green-700
                       focus:ring-2 focus:ring-green-100"/>
          <textarea placeholder="Notes (optional)" value={notes}
            onChange={e => setNotes(e.target.value)} rows={2}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5
                       text-sm outline-none focus:border-green-700
                       focus:ring-2 focus:ring-green-100 resize-none"/>
        </div>

        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl
                       text-sm text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleAdd} disabled={!title.trim() || saving}
            className="flex-1 py-2.5 bg-green-800 hover:bg-green-900 text-white
                       rounded-xl text-sm font-semibold disabled:opacity-50
                       transition-colors">
            {saving ? "Adding…" : "Add Item"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Day Card ───────────────────────────────────────────────
function DayCard({ day, tripId, token, onItemAdded, onItemDeleted,
                   isActive, onClick }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingId,   setDeletingId]   = useState(null);

  const dayTotal = (day.items || []).reduce((s, i) => s + (i.cost || 0), 0);

  async function handleDeleteItem(itemId) {
    setDeletingId(itemId);
    try {
      await fetch(
        `${API_BASE}/api/v1/trips/${tripId}/days/${day.id}/items/${itemId}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      );
      onItemDeleted(day.id, itemId);
    } catch {
      alert("Failed to delete item");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <div className={`border rounded-2xl overflow-hidden transition-all
                       ${isActive ? "border-green-700 shadow-md" : "border-gray-200"}`}>

        {/* ── Day header ── */}
        <button
          onClick={onClick}
          className="w-full flex items-center justify-between px-5 py-4
                     hover:bg-gray-50 transition-colors text-left"
        >
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-green-800">
              DAY {day.dayNumber}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span>📅</span>
              <span>{formatDateShort(day.date)}</span>
            </div>
            {day.region && (
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <span>📍</span>
                <span className="font-medium">{day.region}</span>
              </div>
            )}
            {day.theme && (
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <span>⭐</span>
                <span>{day.theme}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs text-gray-400">
              {(day.items || []).length} items •{" "}
              Day total: ${dayTotal.toFixed(2)}
            </span>
            <span className={`text-gray-400 transition-transform text-sm
                              ${isActive ? "rotate-180" : ""}`}>
              ▼
            </span>
          </div>
        </button>

        {/* ── Day body (expanded) ── */}
        {isActive && (
          <div className="px-5 pb-5 border-t border-gray-100">

            {/* Festival banner */}
            {day.items?.some(i => i.title?.startsWith("Festival:")) && (
              <div className="mt-3 mb-3 bg-yellow-50 border border-yellow-200
                              rounded-lg px-3 py-2 text-xs text-yellow-800 font-medium">
                🎉{" "}
                {day.items.find(i => i.title?.startsWith("Festival:"))?.title
                  .replace("Festival: ", "")} nearby!
              </div>
            )}

            {/* Tips */}
            {day.tips && (
              <p className="mt-3 mb-4 text-xs text-gray-400 italic">
                💡 {day.tips}
              </p>
            )}

            {/* Items list */}
            {(day.items || []).length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-400 uppercase
                              tracking-wide mb-2">
                  Items in this day
                </p>
                <div className="space-y-2">
                  {day.items.map(item => {
                    const meta = ITEM_TYPE_META[item.type] || ITEM_TYPE_META.ACTIVITY;
                    return (
                      <div key={item.id}
                        className="flex items-center gap-3 bg-gray-50
                                   rounded-xl px-4 py-3">
                        {/* Type icon */}
                        <div className={`w-8 h-8 rounded-lg flex items-center
                                         justify-center text-sm flex-shrink-0
                                         ${meta.color}`}>
                          {meta.icon}
                        </div>

                        {/* Title + type */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {item.title}
                          </p>
                          <p className="text-xs text-gray-400">{meta.label}</p>
                          {item.notes && (
                            <p className="text-xs text-gray-400 mt-0.5 italic">
                              {item.notes}
                            </p>
                          )}
                        </div>

                        {/* Cost */}
                        <span className="text-sm font-medium text-gray-700
                                         whitespace-nowrap">
                          {item.cost > 0 ? `$${item.cost.toFixed(2)}` : "Free"}
                        </span>

                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          disabled={deletingId === item.id}
                          className="w-7 h-7 flex items-center justify-center
                                     rounded-lg text-gray-400 hover:bg-red-50
                                     hover:text-red-500 transition-colors
                                     disabled:opacity-40 flex-shrink-0"
                          title="Remove item"
                        >
                          {deletingId === item.id ? "…" : "🗑"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Add item row */}
            <div className="flex items-center gap-2 flex-wrap mt-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="text-xs font-semibold text-green-800
                           hover:text-green-900 flex items-center gap-1"
              >
                + ADD ITEM TO THIS DAY
              </button>
              <div className="flex gap-1.5 flex-wrap">
                {ADD_TYPES.map(t => (
                  <button key={t.value}
                    onClick={() => setShowAddModal(true)}
                    className="px-2.5 py-1 rounded-full border border-gray-200
                               text-xs text-gray-500 hover:border-green-700
                               hover:text-green-800 transition-colors bg-white">
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Day total footer */}
            <div className="mt-4 pt-3 border-t border-gray-100 flex
                            justify-between items-center">
              <span className="text-sm font-semibold text-gray-700">
                Day Total:
              </span>
              <span className="text-base font-bold text-green-800">
                ${dayTotal.toFixed(2)} 🔥
              </span>
            </div>
          </div>
        )}
      </div>

      {showAddModal && (
        <AddItemModal
          dayId={day.id}
          tripId={tripId}
          token={token}
          onClose={() => setShowAddModal(false)}
          onAdded={onItemAdded}
        />
      )}
    </>
  );
}

// ── AI Tips Panel ──────────────────────────────────────────
function AiTipsPanel({ trip }) {
  const festivalDay = (trip.days || []).find(d =>
    d.items?.some(i => i.title?.startsWith("Festival:"))
  );
  const gemDays = (trip.days || []).filter(d =>
    d.items?.some(i => i.type === "GEM")
  );

  const tips = [
    festivalDay && `Day ${festivalDay.dayNumber} is a festival day! 
      Consider staying an extra night in ${festivalDay.region} 
      to experience the celebrations.`,
    gemDays.length > 0 && `${gemDays.length} hidden gem${gemDays.length > 1 ? "s" : ""} 
      discovered on your route — locals love these spots!`,
    trip.travelStyle === "RELAXATION" &&
      "Your relaxation trip is optimized for slower paced days. Enjoy!",
    trip.aiGenerated &&
      "This itinerary was AI-optimized for minimal backtracking.",
  ].filter(Boolean);

  const tip = tips[0] || "Your AI itinerary is ready to explore!";

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">✨</span>
        <span className="text-sm font-bold text-gray-800">AI Travel Tip</span>
      </div>
      <p className="text-sm text-gray-600 leading-relaxed mb-4">{tip}</p>
      <button className="w-full py-2.5 bg-green-800 hover:bg-green-900
                         text-white rounded-xl text-sm font-semibold
                         transition-colors">
        Apply Suggestion
      </button>
    </div>
  );
}

// ── Share Panel ────────────────────────────────────────────
function SharePanel({ trip }) {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/trips/share/${trip.shareToken}`;

  function handleCopy() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <p className="text-sm font-bold text-gray-800 mb-3">Share this trip</p>
      <div className="flex gap-2 mb-4">
        <input readOnly value={shareUrl}
          className="flex-1 min-w-0 text-xs border border-gray-200 rounded-lg
                     px-3 py-2 text-gray-500 bg-gray-50 outline-none truncate"/>
        <button onClick={handleCopy}
          className="px-3 py-2 bg-green-800 hover:bg-green-900 text-white
                     rounded-lg text-xs font-semibold transition-colors whitespace-nowrap">
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <p className="text-xs font-semibold text-gray-500 mb-2">Export Options</p>
      <div className="grid grid-cols-2 gap-2">
        <button className="flex items-center justify-center gap-1.5 py-2
                           border border-gray-200 rounded-xl text-xs font-medium
                           text-gray-600 hover:bg-gray-50 transition-colors">
          📄 PDF Itinerary
        </button>
        <button className="flex items-center justify-center gap-1.5 py-2
                           border border-gray-200 rounded-xl text-xs font-medium
                           text-gray-600 hover:bg-gray-50 transition-colors">
          🗺️ Google Maps
        </button>
      </div>
    </div>
  );
}

// ── Map Placeholder ────────────────────────────────────────
function MapPanel({ trip }) {
  const regions = [...new Set(
    (trip.days || []).map(d => d.region).filter(Boolean)
  )];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm
                    overflow-hidden">
      {/* Map placeholder */}
      <div className="relative h-72 bg-gradient-to-br from-green-50 to-blue-50
                      flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-2">🗺️</div>
          <p className="text-xs text-gray-400 font-medium">Route Map</p>
        </div>

        {/* Region markers */}
        <div className="absolute bottom-3 left-3 flex flex-col gap-1.5">
          {regions.map((r, i) => (
            <div key={r}
              className="flex items-center gap-1.5 bg-white rounded-full
                         px-2.5 py-1 shadow-sm border border-gray-200">
              <span className="w-5 h-5 rounded-full bg-green-800 text-white
                               text-[10px] font-bold flex items-center
                               justify-center flex-shrink-0">
                {i + 1}
              </span>
              <span className="text-xs font-medium text-gray-700">{r}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────
export default function TripDetailPage() {
  const { id }        = useParams();
  const navigate      = useNavigate();
  const { token, isAuthenticated } = useAuth();

  const [trip,       setTrip]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [activeDay,  setActiveDay]  = useState(null);
  const [activeTab,  setActiveTab]  = useState("itinerary");
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { navigate("/login"); return; }
    loadTrip();
  }, [id, isAuthenticated]);

  async function loadTrip() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/trips/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Trip not found");
      const data = await res.json();
      setTrip(data);
      // Auto-open day 1
      if (data.days?.length > 0) setActiveDay(data.days[0].id);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    setConfirming(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/v1/trips/${id}/status?status=CONFIRMED`,
        { method: "PATCH", headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setTrip(updated);
    } catch {
      alert("Failed to confirm trip");
    } finally {
      setConfirming(false);
    }
  }

  function handleItemAdded(dayId, newItem) {
    setTrip(prev => ({
      ...prev,
      days: prev.days.map(d =>
        d.id === dayId
          ? { ...d, items: [...(d.items || []), newItem] }
          : d
      ),
    }));
  }

  function handleItemDeleted(dayId, itemId) {
    setTrip(prev => ({
      ...prev,
      days: prev.days.map(d =>
        d.id === dayId
          ? { ...d, items: (d.items || []).filter(i => i.id !== itemId) }
          : d
      ),
    }));
  }

  // ── Loading ────────────────────────────────────────────
  if (loading) return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 flex items-center
                      justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <div className="w-10 h-10 border-4 border-green-100
                          border-t-green-700 rounded-full animate-spin" />
          <p className="text-sm">Loading trip…</p>
        </div>
      </div>
      <Footer />
    </>
  );

  // ── Error ──────────────────────────────────────────────
  if (error || !trip) return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 flex items-center
                      justify-center">
        <div className="text-center">
          <p className="text-4xl mb-3">⚠️</p>
          <p className="text-gray-700 font-medium mb-4">{error || "Trip not found"}</p>
          <Link to="/trips"
            className="px-5 py-2.5 bg-green-800 text-white rounded-xl
                       text-sm font-semibold hover:bg-green-900 transition-colors">
            ← Back to My Trips
          </Link>
        </div>
      </div>
      <Footer />
    </>
  );

  const days       = countDays(trip.startDate, trip.endDate);
  const totalItems = getTotalItems(trip);
  const locations  = getUniqueRegions(trip);
  const totalCost  = (trip.days || []).reduce((s, d) =>
    s + (d.estimatedDayCost || 0), 0);
  const statusMeta = STATUS_META[trip.status] || STATUS_META.DRAFT;

  // ── Render ─────────────────────────────────────────────
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

          {/* ── Page header ── */}
          <div className="flex items-start justify-between gap-4 mb-6
                          flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">
                  {trip.title}
                </h1>
                <span className={`text-xs font-semibold px-2.5 py-1
                                  rounded-full ${statusMeta.color}`}>
                  {statusMeta.label}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
                {" "}• {trip.groupSize || 1} Traveler{trip.groupSize > 1 ? "s" : ""}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => {
                  const url = `${window.location.origin}/trips/share/${trip.shareToken}`;
                  navigator.clipboard.writeText(url)
                    .then(() => alert("Share link copied!"));
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 border
                           border-gray-200 rounded-xl text-sm font-medium
                           text-gray-700 hover:bg-gray-50 transition-colors"
              >
                🔗 Share
              </button>

              {trip.status === "DRAFT" && (
                <button
                  onClick={handleConfirm}
                  disabled={confirming}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-green-800
                             hover:bg-green-900 text-white rounded-xl text-sm
                             font-semibold transition-colors disabled:opacity-60"
                >
                  {confirming ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30
                                        border-t-white rounded-full animate-spin"/>
                      Confirming…
                    </>
                  ) : "✅ Confirm Trip"}
                </button>
              )}

              <Link to="/trips"
                className="px-4 py-2.5 border border-gray-200 rounded-xl
                           text-sm font-medium text-gray-600 hover:bg-gray-50
                           transition-colors">
                ← Back
              </Link>
            </div>
          </div>

          {/* ── Tabs ── */}
          <div className="flex gap-0 mb-6 border-b border-gray-200">
            {[
              { key: "itinerary", label: "📅 Itinerary" },
              { key: "budget",    label: "💰 Budget Tracker" },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-3 text-sm font-medium border-b-2
                            transition-colors -mb-px
                            ${activeTab === tab.key
                              ? "border-green-800 text-green-800"
                              : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Stats row ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { icon: "📅", value: days,       label: "Days" },
              { icon: "💰", value: `$${totalCost.toFixed(0)}`, label: "Budgeted" },
              { icon: "📍", value: locations,  label: "Locations" },
              { icon: "✅", value: totalItems, label: "Items Added" },
            ].map(s => (
              <div key={s.label}
                className="bg-white rounded-2xl border border-gray-200 p-4
                           shadow-sm flex items-center gap-3">
                <span className="text-2xl">{s.icon}</span>
                <div>
                  <p className="text-xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-400">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {activeTab === "itinerary" && (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">

              {/* ── Left: Day cards ── */}
              <div className="space-y-3">
                {(trip.days || []).map(day => (
                  <DayCard
                    key={day.id}
                    day={day}
                    tripId={trip.id}
                    token={token}
                    isActive={activeDay === day.id}
                    onClick={() =>
                      setActiveDay(activeDay === day.id ? null : day.id)
                    }
                    onItemAdded={handleItemAdded}
                    onItemDeleted={handleItemDeleted}
                  />
                ))}
              </div>

              {/* ── Right: Map + AI Tips + Share ── */}
              <div className="space-y-4">
                <TripMapPanel trip={trip} />
                <AiTipsPanel trip={trip} />
                <SharePanel trip={trip} />
              </div>
            </div>
          )}

          {activeTab === "budget" && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6
                            shadow-sm text-center py-16">
              <p className="text-4xl mb-3">💰</p>
              <p className="text-gray-700 font-semibold mb-1">Budget Tracker</p>
              <p className="text-sm text-gray-400 mb-4">
                Track your spending across this trip
              </p>
              <Link to="/budget"
                className="inline-flex items-center gap-1.5 px-5 py-2.5
                           bg-green-800 text-white rounded-xl text-sm
                           font-semibold hover:bg-green-900 transition-colors">
                Open Budget Tracker
              </Link>
            </div>
          )}

        </div>
      </div>
      <Footer />
    </>
  );
}
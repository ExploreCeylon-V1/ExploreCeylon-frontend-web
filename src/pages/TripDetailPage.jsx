// TripDetailPage.jsx
// Shows full AI-generated itinerary with day cards, map sidebar, stats

import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import TripMapPanel from "../components/TripMapPanel";
import BudgetTracker from "../components/BudgetTracker";
import TripGenerationLoader from "../components/TripGenerationLoader";
import { getTripById, updateTripTitle, updateTripStatus, generateAiItinerary, removeItemFromDay } from "../services/tripService";
import budgetService from "../services/budgetService";
import destinationsService from "../services/destinationsService";
import hiddenGemsService from "../services/Hiddengemsservice";
import eventService from "../services/eventService";
import guidesService from "../services/guidesService";
import { vehicleService } from "../services/vehicleService";
import { getDistanceKm } from "../utils/geo";
import { downloadTripPdf } from "../utils/tripPdf";
import { fetchTripActivityLogs } from "../services/Mytripsservice";
import {
  Calendar, Wallet, MapPin, FileText, ChevronDown,
  ArrowLeft, Share2, CheckCircle2, Sparkles, UserPlus,
  PartyPopper, Lightbulb, Sunrise, Sun, Moon,
  Pencil, RefreshCw, Check, X, Gem, Compass, Route, Download, History,
  Users, Trash2,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// Per-day accent colors, cycled by day index — mirrors the marker colors
// TripMapPanel already uses, so a day's color means the same thing on
// both the itinerary list and the map.
const DAY_BADGE_COLORS = [
  { text: "text-green-800",  border: "border-green-700",  bg: "bg-green-700"  },
  { text: "text-blue-700",   border: "border-blue-600",   bg: "bg-blue-600"   },
  { text: "text-orange-700", border: "border-orange-500", bg: "bg-orange-500" },
  { text: "text-purple-700", border: "border-purple-600", bg: "bg-purple-600" },
  { text: "text-cyan-700",   border: "border-cyan-600",   bg: "bg-cyan-600"   },
  { text: "text-pink-700",   border: "border-pink-600",   bg: "bg-pink-600"   },
  { text: "text-teal-700",   border: "border-teal-600",   bg: "bg-teal-600"   },
];

//  Item type config 
const ITEM_TYPE_META = {
  ACTIVITY:  { label: "Activity",   color: "bg-blue-100 text-blue-700",   icon: "" },
  TRANSPORT: { label: "Transport",  color: "bg-orange-100 text-orange-700", icon: "" },
  GEM:       { label: "Hidden Gem", color: "bg-purple-100 text-purple-700", icon: "" },
  HOTEL:     { label: "Hotel",      color: "bg-green-100 text-green-700",  icon: "" },
  FOOD:      { label: "Food",       color: "bg-yellow-100 text-yellow-700", icon: "" },
  GUIDE:     { label: "Guide",      color: "bg-teal-100 text-teal-700",    icon: "" },
};

const NEARBY_CATEGORIES = [
  { value: "DESTINATION", label: "Destination" },
  { value: "GEM",         label: "Hidden Gem" },
  { value: "EVENT",       label: "Event" },
];

// §2 — time-of-day slots. There's no slot field on the backend TripDayItem,
// so we bucket each day's already-ordered items into three consecutive
// groups (Morning / Afternoon / Evening). Empty slots are omitted (§6).
const TIME_SLOTS = [
  { key: "morning",   label: "Morning",   time: "Start of day",  Icon: Sunrise },
  { key: "afternoon", label: "Afternoon", time: "Midday",        Icon: Sun },
  { key: "evening",   label: "Evening",   time: "Later",         Icon: Moon },
];

function bucketItemsIntoSlots(items) {
  const groups = [[], [], []];
  const n = items.length;
  if (n === 0) return groups;
  const per = Math.ceil(n / 3);
  items.forEach((item, i) => {
    groups[Math.min(2, Math.floor(i / per))].push(item);
  });
  return groups;
}

const STATUS_META = {
  DRAFT:     { label: "DRAFT",     color: "text-gray-500 bg-gray-100" },
  GENERATED: { label: "GENERATED", color: "text-purple-700 bg-purple-100" },
  CONFIRMED: { label: "CONFIRMED", color: "text-green-700 bg-green-100" },
  ACTIVE:    { label: "ACTIVE",    color: "text-amber-700 bg-amber-100" },
  COMPLETED: { label: "COMPLETED", color: "text-blue-700 bg-blue-100" },
  CANCELLED: { label: "CANCELLED", color: "text-red-700 bg-red-100" },
};

//  Helpers 
function formatDate(d) {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });
}
function formatDateShort(d) {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}
function countDays(start, end) {
  if (!start || !end) return 1;
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return 1;
  return Math.max(1, Math.round(Math.abs(e - s) / 86400000) + 1);
}
function getTotalItems(trip) {
  return ((trip && trip.days) || []).reduce((s, d) => s + ((d && d.items) || []).length, 0);
}
function getUniqueRegions(trip) {
  const regions = ((trip && trip.days) || [])
    .map(d => d && d.region)
    .filter(Boolean);
  return [...new Set(regions)].length;
}
function normalizeName(value) {
  if (!value) return "";
  return String(value)
    .toLowerCase()
    .replace(/^hidden gem:\s*/i, "")
    .replace(/^festival:\s*/i, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanItemTitle(title) {
  if (!title) return "";
  return String(title)
    .replace(/^Hidden Gem:\s*/i, "")
    .replace(/^Festival:\s*/i, "")
    .split(" - ")[0]
    .trim();
}

function tokenScore(a, b) {
  const aTokens = new Set(normalizeName(a).split(" ").filter(t => t.length > 2));
  const bTokens = new Set(normalizeName(b).split(" ").filter(t => t.length > 2));
  if (!aTokens.size || !bTokens.size) return 0;
  let hits = 0;
  aTokens.forEach(token => { if (bTokens.has(token)) hits += 1; });
  return hits / Math.min(aTokens.size, bTokens.size);
}

function findCatalogMatch(title, records, nameKey) {
  const itemName = normalizeName(cleanItemTitle(title));
  if (!itemName) return null;

  let best = null;
  let bestScore = 0;
  records.forEach(record => {
    const recordName = normalizeName(record[nameKey]);
    if (!recordName) return;
    const direct = itemName === recordName || itemName.includes(recordName) || recordName.includes(itemName);
    const score = direct ? 1 : tokenScore(itemName, recordName);
    if (score > bestScore) {
      best = record;
      bestScore = score;
    }
  });
  return bestScore >= 0.45 ? best : null;
}

const PLACEHOLDER_ITEM_IMAGE =
  "https://images.unsplash.com/photo-1546484959-f9a381d1330d?auto=format&fit=crop&w=400&q=60";

const DETAIL_LINK_BY_KIND = {
  GEM:         record => `/hidden-gems/${record.id}`,
  EVENT:       record => `/events/${record.id}`,
  DESTINATION: record => `/destinations/${record.id}`,
  GUIDE:       record => `/guides/${record.id}`,
  VEHICLE:     record => `/vehicles?selected=${record.id}`,
};

function getItemImage(kind, record) {
  switch (kind) {
    case "DESTINATION": return record.coverImageUrl || record.imageUrls?.[0] || null;
    case "GUIDE":        return record.photoUrl || record.imageUrls?.[0] || null;
    default:              return record.imageUrls?.[0] || null;
  }
}

function buildItemMatch(kind, record) {
  return {
    kind,
    record,
    link: DETAIL_LINK_BY_KIND[kind](record),
    image: getItemImage(kind, record),
  };
}

// Resolves an itinerary item to its real destination/gem/event/guide/vehicle
// row (for a detail link + photo), preferring the backend-resolved
// referenceId and falling back to fuzzy text matching against the loaded
// catalogs. Festival items are type ACTIVITY but must resolve against the
// events catalog, not destinations — checked before the generic ACTIVITY
// branch so a festival's referenceId (an Event id) is never mistaken for
// a Destination id.
function resolveItemMatch(item, catalog = {}) {
  const isFestival = item.title?.startsWith("Festival:");

  if (item.referenceId) {
    if (item.type === "GEM") {
      const record = (catalog.gems || []).find(g => String(g.id) === String(item.referenceId));
      if (record) return buildItemMatch("GEM", record);
    } else if (isFestival) {
      const record = (catalog.events || []).find(e => String(e.id) === String(item.referenceId));
      if (record) return buildItemMatch("EVENT", record);
    } else if (item.type === "GUIDE") {
      const record = (catalog.guides || []).find(g => String(g.id) === String(item.referenceId));
      if (record) return buildItemMatch("GUIDE", record);
    } else if (item.type === "VEHICLE" || item.type === "TRANSPORT") {
      const record = (catalog.vehicles || []).find(v => String(v.id) === String(item.referenceId));
      if (record) return buildItemMatch("VEHICLE", record);
    } else if (item.type === "ACTIVITY") {
      const record = (catalog.destinations || []).find(d => String(d.id) === String(item.referenceId));
      if (record) return buildItemMatch("DESTINATION", record);
    }
  }

  if (isFestival) {
    const record = findCatalogMatch(item.title, catalog.events || [], "title");
    return record ? buildItemMatch("EVENT", record) : null;
  }
  if (item.type === "GEM") {
    const record = findCatalogMatch(item.title, catalog.gems || [], "title");
    return record ? buildItemMatch("GEM", record) : null;
  }
  if (item.type === "ACTIVITY") {
    const record = findCatalogMatch(item.title, catalog.destinations || [], "name");
    return record ? buildItemMatch("DESTINATION", record) : null;
  }
  if (item.type === "GUIDE") {
    const record = findCatalogMatch(item.title, catalog.guides || [], "fullName");
    return record ? buildItemMatch("GUIDE", record) : null;
  }
  if (item.type === "VEHICLE" || item.type === "TRANSPORT") {
    const record = findCatalogMatch(item.title, catalog.vehicles || [], "name");
    return record ? buildItemMatch("VEHICLE", record) : null;
  }
  return null;
}

async function loadDetailCatalog(startDate, endDate) {
  const [destinations, gems, events, guides, vehicles] = await Promise.all([
    destinationsService.getAllDestinations().catch(() => []),
    hiddenGemsService.getAllGems().catch(() => []),
    eventService.getTripSyncEvents(startDate, endDate).catch(() => []),
    guidesService.getAllGuides().catch(() => []),
    vehicleService.getAllVehicles().catch(() => []),
  ]);
  return { destinations, gems, events, guides, vehicles };
}

//  Nearby suggestions (Destination / Hidden Gem / Event)

// Picks a lat/lng center to rank "nearby" suggestions from: the average
// position of the day's own resolved items, falling back to a destination
// matching the day's region (or the trip's destination) when the day is
// still empty.
function resolveDayCenter(day, trip, catalog) {
  const coords = (day.items || [])
    .map(item => resolveItemMatch(item, catalog)?.record)
    .filter(r => r && r.latitude != null && r.longitude != null);

  if (coords.length > 0) {
    return {
      lat: coords.reduce((s, r) => s + r.latitude, 0) / coords.length,
      lng: coords.reduce((s, r) => s + r.longitude, 0) / coords.length,
    };
  }

  const regionQuery = day.region || trip?.toLocation;
  if (regionQuery) {
    const q = regionQuery.toLowerCase();
    const match = (catalog.destinations || []).find(d =>
      d.latitude != null && d.longitude != null && (
        d.district?.toLowerCase().includes(q) ||
        d.province?.toLowerCase().includes(q) ||
        d.name?.toLowerCase().includes(q)
      )
    );
    if (match) return { lat: match.latitude, lng: match.longitude };
  }

  return null;
}

function AddNearbySection({ day, trip, tripId, token, detailCatalog, onItemAdded }) {
  const [category, setCategory] = useState("DESTINATION");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const rowRef = useRef(null);

  const center = resolveDayCenter(day, trip, detailCatalog);
  const centerKey = center ? `${center.lat.toFixed(4)},${center.lng.toFixed(4)}` : null;

  function updateScrollArrows() {
    const el = rowRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }

  function scrollByPage(direction) {
    const el = rowRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth, behavior: "smooth" });
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- early-exit guard clearing suggestions when there's no map center; not derivable at render time
    if (!center) { setSuggestions([]); return; }
    let cancelled = false;
    setLoading(true);

    const addedRefIds = new Set(
      (day.items || [])
        .filter(i => category === "GEM" ? i.type === "GEM" : i.type === "ACTIVITY")
        .filter(i => category === "EVENT" ? i.title?.startsWith("Festival:") : true)
        .filter(i => category === "DESTINATION" ? !i.title?.startsWith("Festival:") : true)
        .map(i => i.referenceId)
        .filter(Boolean)
    );

    async function load() {
      try {
        let results = [];
        if (category === "DESTINATION") {
          const data = await destinationsService.getNearby(center.lat, center.lng, 9);
          results = data.filter(d => !addedRefIds.has(String(d.id)));
        } else if (category === "GEM") {
          const data = await hiddenGemsService.getNearby(center.lat, center.lng, 9);
          results = data.filter(g => !addedRefIds.has(String(g.id)));
        } else {
          const data = await eventService.getTripSyncEvents(trip.startDate, trip.endDate);
          results = data
            .filter(e => e.latitude != null && e.longitude != null)
            .filter(e => !addedRefIds.has(String(e.id)));
        }
        const withDistance = results
          .map(r => ({ ...r, distanceKm: getDistanceKm(center.lat, center.lng, r.latitude, r.longitude) }))
          .sort((a, b) => a.distanceKm - b.distanceKm)
          .slice(0, 6);
        if (!cancelled) setSuggestions(withDistance);
      } catch {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, centerKey, day.items?.length]);

  useEffect(() => {
    if (rowRef.current) rowRef.current.scrollLeft = 0;
    updateScrollArrows();
  }, [suggestions]);

  async function handleAdd(suggestion) {
    setAddingId(suggestion.id);
    const payload = category === "EVENT"
      ? { type: "ACTIVITY", referenceId: String(suggestion.id),
          title: `Festival: ${suggestion.title}`, cost: 0, currency: "USD",
          notes: suggestion.region }
      : category === "GEM"
      ? { type: "GEM", referenceId: String(suggestion.id),
          title: suggestion.title, cost: 0, currency: "USD",
          notes: suggestion.district }
      : { type: "ACTIVITY", referenceId: String(suggestion.id),
          title: suggestion.name, cost: 0, currency: "USD",
          notes: suggestion.district };

    try {
      const res = await fetch(
        `${API_BASE}/api/v1/trips/${tripId}/days/${day.id}/items`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error();
      const newItem = await res.json();
      onItemAdded(day.id, newItem);
      setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    } catch {
      alert("Failed to add item");
    } finally {
      setAddingId(null);
    }
  }

  const categoryLabel = NEARBY_CATEGORIES.find(c => c.value === category)?.label;

  return (
    <div className="mt-3">
      <p className="text-xs font-semibold text-gray-400 uppercase
                    tracking-wide mb-2">
        + Add to this day:
      </p>
      <div className="flex gap-1.5 flex-wrap mb-3">
        {NEARBY_CATEGORIES.map(c => (
          <button key={c.value}
            onClick={() => setCategory(c.value)}
            className={`px-3 py-1.5 rounded-full border text-xs font-semibold
                        transition-colors
                        ${category === c.value
                          ? "bg-green-50 border-green-700 text-green-800"
                          : "border-gray-200 text-gray-600 hover:border-gray-300 bg-white"
                        }`}>
            {c.label}
          </button>
        ))}
      </div>

      {!center && (
        <p className="text-xs text-gray-400">
          Add a region to this day (or a first item) to see nearby suggestions.
        </p>
      )}

      {center && (
        <>
          <p className="text-2xs font-semibold text-gray-400 uppercase
                        tracking-wide mb-2">
            Suggested {categoryLabel}s Nearby:
          </p>

          {loading && (
            <p className="text-xs text-gray-400">Loading suggestions...</p>
          )}

          {!loading && suggestions.length === 0 && (
            <p className="text-xs text-gray-400">No nearby suggestions found.</p>
          )}

          {!loading && suggestions.length > 0 && (
            <div className="relative">
              {canScrollLeft && (
                <button
                  onClick={() => scrollByPage(-1)}
                  aria-label="Show previous"
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2
                             z-10 w-7 h-7 rounded-full bg-white border border-gray-200
                             shadow-md flex items-center justify-center text-gray-600
                             hover:bg-gray-50"
                >
                  ‹
                </button>
              )}

              <div ref={rowRef} onScroll={updateScrollArrows}
                className="flex gap-3 overflow-x-auto snap-x snap-mandatory
                           pb-2 scroll-smooth">
                {suggestions.map(s => {
                  const name = category === "DESTINATION" ? s.name : s.title;
                  const image = category === "DESTINATION"
                    ? (s.coverImageUrl || s.imageUrls?.[0])
                    : s.imageUrls?.[0];
                  const subtitle = category === "EVENT" ? s.region : s.district;
                  return (
                    <div key={s.id}
                      className="border border-gray-200 rounded-xl overflow-hidden
                                 bg-white flex-shrink-0 snap-start
                                 w-[calc((100%-1.5rem)/3)]">
                      <div className="relative h-24">
                        <img
                          src={image || PLACEHOLDER_ITEM_IMAGE}
                          alt={name}
                          className="w-full h-full object-cover"
                          onError={e => { e.currentTarget.src = PLACEHOLDER_ITEM_IMAGE; }}
                        />
                        <span className="absolute top-1.5 right-1.5 bg-white/90
                                         text-3xs font-semibold text-gray-700
                                         px-1.5 py-0.5 rounded-full">
                          {s.distanceKm.toFixed(1)} km
                        </span>
                      </div>
                      <div className="p-2.5">
                        <p className="text-xs font-semibold text-gray-800 truncate">
                          {name}
                        </p>
                        {subtitle && (
                          <p className="text-2xs text-gray-400 truncate mb-2">
                            {subtitle}
                          </p>
                        )}
                        <button
                          onClick={() => handleAdd(s)}
                          disabled={addingId === s.id}
                          className="w-full text-2xs font-semibold text-green-800
                                     border border-green-700 rounded-lg py-1.5
                                     hover:bg-green-50 transition-colors
                                     disabled:opacity-50"
                        >
                          {addingId === s.id ? "Adding..." : `+ Add to Day ${day.dayNumber}`}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {canScrollRight && (
                <button
                  onClick={() => scrollByPage(1)}
                  aria-label="Show more"
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2
                             z-10 w-7 h-7 rounded-full bg-white border border-gray-200
                             shadow-md flex items-center justify-center text-gray-600
                             hover:bg-gray-50"
                >
                  ›
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function DayCard({ day, trip, tripId, token, onItemAdded, onItemDeleted,
                   isActive, onClick, detailCatalog, dayIndex }) {
  const [deletingId, setDeletingId] = useState(null);

  const dayTotal = (day.items || []).reduce((s, i) => s + (i.cost || 0), 0);
  const color = DAY_BADGE_COLORS[dayIndex % DAY_BADGE_COLORS.length];
  const slotGroups = bucketItemsIntoSlots(day.items || []);

  async function handleDeleteItem(itemId) {
    setDeletingId(itemId);
    try {
      await removeItemFromDay(tripId, day.id, itemId);
      onItemDeleted(day.id, itemId);
    } catch {
      alert("Failed to delete item");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div
      className={`bg-white rounded-3xl border overflow-hidden transition-all duration-300 ${
        isActive ? `${color.border} shadow-md ring-1 ring-emerald-500/20` : "border-slate-200/90 hover:border-slate-300 shadow-2xs"
      }`}
    >
      {/*  Day header  */}
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50/80 transition-colors text-left"
      >
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap min-w-0">
          <span
            className={`text-xs font-black text-white px-3 py-1 rounded-full shadow-2xs ${color.bg}`}
          >
            DAY {day.dayNumber}
          </span>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <Calendar size={13} className="text-emerald-700" />
            <span>{formatDateShort(day.date)}</span>
          </div>
          {day.region && (
            <div className="flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200/60">
              <MapPin size={13} className="text-emerald-700" />
              <span>{day.region}</span>
            </div>
          )}
          {day.theme && (
            <span className="text-xs font-medium text-slate-400 hidden sm:inline-block">
              • {day.theme}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-2">
          <span className="text-xs font-extrabold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
            ${dayTotal.toFixed(2)}
          </span>
          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-emerald-100 transition-colors">
            <ChevronDown
              size={16}
              className={`transition-transform duration-300 ${
                isActive ? "rotate-180 text-emerald-800" : ""
              }`}
            />
          </div>
        </div>
      </button>

      {/*  Day body (expanded)  */}
      {isActive && (
        <div className="px-4 sm:px-6 pb-6 pt-2 border-t border-slate-100 bg-slate-50/40">

          {/* Festival banner */}
          {day.items?.some(i => i.title?.startsWith("Festival:")) && (
            <div className="mt-3 mb-4 flex items-center gap-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 rounded-2xl p-3 text-xs text-amber-950 font-bold shadow-2xs">
              <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shrink-0">
                <PartyPopper size={16} />
              </div>
              <div className="min-w-0">
                <p className="font-extrabold text-amber-950 text-xs sm:text-sm">
                  {(day.items.find(i => i.title?.startsWith("Festival:"))?.title || "").replace(/^Festival:\s*/i, "")} nearby!
                </p>
                <p className="text-3xs text-amber-800/90 font-medium">
                  Special cultural festival integrated into today's itinerary.
                </p>
              </div>
            </div>
          )}

          {/* Tips */}
          {day.tips && (
            <div className="mt-3 mb-4 flex items-start gap-2 text-xs text-slate-600 bg-emerald-50/80 border border-emerald-100 rounded-xl p-3">
              <Lightbulb size={15} className="text-emerald-700 shrink-0 mt-0.5" />
              <p className="italic font-medium leading-relaxed">{day.tips}</p>
            </div>
          )}

          {/* Time-slotted items (§2): Morning / Afternoon / Evening */}
          {(day.items || []).length > 0 && (
            <div className="mb-5 space-y-5">
              {TIME_SLOTS.map((slot, slotIdx) => {
                const slotItems = slotGroups[slotIdx] || [];
                if (!slotItems.length) return null;
                return (
                  <div key={slot.key}>
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className={`p-1 rounded-lg bg-white shadow-2xs border border-slate-100 ${color.text}`}>
                        <slot.Icon size={14} />
                      </div>
                      <p className="text-xs font-black text-slate-800 uppercase tracking-wider">
                        {slot.label}
                      </p>
                      <span className="text-3xs font-semibold text-slate-400">
                        • {slot.time}
                      </span>
                    </div>
                    <div className="space-y-2.5">
                      {slotItems.map(item => {
                        const meta = ITEM_TYPE_META[item.type] || ITEM_TYPE_META.ACTIVITY;
                        const match = resolveItemMatch(item, detailCatalog);
                        const detailLink = match?.link || null;
                        const image = match?.image || PLACEHOLDER_ITEM_IMAGE;
                        const isFestivalItem = item.title?.startsWith("Festival:") || match?.kind === "EVENT";
                        const displayTitle = cleanItemTitle(item.title);

                        return (
                          <div
                            key={item.id}
                            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-slate-100 rounded-2xl p-3.5 shadow-2xs hover:shadow-md transition-all group"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-xl overflow-hidden bg-slate-100 relative shadow-2xs">
                                <img
                                  src={image}
                                  alt={item.title}
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                  onError={e => { e.currentTarget.src = PLACEHOLDER_ITEM_IMAGE; }}
                                />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  {isFestivalItem ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-3xs font-extrabold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200/80">
                                      <PartyPopper size={11} /> Festival & Event
                                    </span>
                                  ) : match?.kind === "GEM" ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-3xs font-extrabold uppercase tracking-wider bg-purple-100 text-purple-900 border border-purple-200/80">
                                      <Gem size={11} /> Hidden Gem
                                    </span>
                                  ) : match?.kind === "DESTINATION" ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-3xs font-extrabold uppercase tracking-wider bg-sky-100 text-sky-900 border border-sky-200/80">
                                      <Compass size={11} /> Destination
                                    </span>
                                  ) : (
                                    <span className={`inline-block px-2.5 py-0.5 rounded-md text-3xs font-extrabold uppercase tracking-wider ${meta.color}`}>
                                      {meta.label}
                                    </span>
                                  )}
                                </div>

                                <h4 className="font-extrabold text-slate-900 text-sm sm:text-base group-hover:text-emerald-800 transition-colors line-clamp-1">
                                  {displayTitle}
                                </h4>

                                {item.notes && (
                                  <p className="text-xs font-semibold text-slate-500 flex items-center gap-1 mt-0.5 line-clamp-1">
                                    <MapPin size={12} className="text-emerald-700 shrink-0" /> {item.notes}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-center shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto justify-between sm:justify-end border-slate-100">
                              <span className="text-xs sm:text-sm font-extrabold text-slate-800 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 whitespace-nowrap">
                                {item.cost > 0 ? `$${item.cost.toFixed(2)}` : "Included"}
                              </span>

                              {detailLink && (
                                <Link
                                  to={detailLink}
                                  className="text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-3 py-1.5 rounded-xl hover:bg-emerald-100 transition-all whitespace-nowrap"
                                >
                                  View Details →
                                </Link>
                              )}

                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                disabled={deletingId === item.id}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                                title="Remove Item"
                              >
                                {deletingId === item.id ? (
                                  <div className="w-4 h-4 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Trash2 size={16} />
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Nearby suggestions to add */}
          <AddNearbySection
            day={day}
            trip={trip}
            tripId={tripId}
            token={token}
            detailCatalog={detailCatalog}
            onItemAdded={onItemAdded}
          />

          {/* Day total footer */}
          <div className="mt-4 pt-3 border-t border-slate-200/80 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Day {day.dayNumber} Subtotal
            </span>
            <span className={`text-base font-black ${color.text}`}>
              ${dayTotal.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

//  Editable Trip Intelligence Panel (Phase 8 & 10 Integration)
function EditableTripIntelligencePanel({ onApplyEdit, disabled }) {
  const [customPrompt, setCustomPrompt] = useState("");

  const presets = [
    { label: "✏️ Replace Stop", prompt: "Replace Temple of the Tooth with Ambuluwawa" },
    { label: "➕ Add Sigiriya", prompt: "Add Sigiriya on Day 2" },
    { label: "➖ Remove Pinnawala", prompt: "Remove Pinnawala" },
    { label: "📅 Shift Schedule", prompt: "Move Gregory Lake to Day 3" },
    { label: "⏰ Start 9:00 AM", prompt: "Start the trip at 9:00 AM instead of 8:00 AM" },
    { label: "🚗 Less Driving", prompt: "Reduce driving time and optimize route" },
    { label: "👨‍👩‍👧 Family Friendly", prompt: "Make the trip family friendly with light walking" },
    { label: "💰 Reduce Budget", prompt: "Reduce budget target to LKR 50,000" },
  ];

  function handleSubmit(e) {
    e.preventDefault();
    if (!customPrompt.trim()) return;
    onApplyEdit(customPrompt);
    setCustomPrompt("");
  }

  return (
    <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-900 rounded-3xl p-6 shadow-md text-white h-full flex flex-col justify-between border border-emerald-800/50">
      <div>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Sparkles size={18} className="text-amber-300 animate-pulse" />
          <h2 className="text-base sm:text-lg font-black text-white">AI Itinerary Intelligence</h2>
          <span className="ml-auto text-3xs font-extrabold uppercase tracking-wider bg-white/10 border border-white/20 px-3 py-1 rounded-full text-emerald-200">
            Pipeline 13.0
          </span>
        </div>
        <p className="text-xs text-emerald-100/90 mb-4 leading-relaxed font-medium">
          Customize &amp; adapt your Sri Lanka journey in real time. Pick a preset or type custom edits to re-generate affected days.
        </p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {presets.map((p) => (
            <button
              key={p.label}
              onClick={() => setCustomPrompt(p.prompt)}
              disabled={disabled}
              className="text-3xs font-bold px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-emerald-100 transition-all disabled:opacity-50 text-left"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 flex-wrap sm:flex-nowrap pt-2">
        <input
          type="text"
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder="e.g. Replace Temple of Tooth with Ambuluwawa..."
          disabled={disabled}
          className="flex-1 px-4 py-2.5 rounded-xl bg-white text-slate-900 placeholder-slate-400 text-xs font-semibold outline-none focus:ring-2 focus:ring-amber-400 border-none min-w-[200px]"
        />
        <button
          type="submit"
          disabled={disabled || !customPrompt.trim()}
          className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs transition-all disabled:opacity-50 flex items-center gap-1.5 shrink-0 shadow-sm"
        >
          <Sparkles size={14} /> Apply Edits
        </button>
      </form>
    </div>
  );
}

//  Share Panel
function SharePanel({ trip }) {
  function handleShare() {
    const url = `${window.location.origin}/trips/share/${trip.shareToken}`;
    navigator.clipboard.writeText(url).then(() => alert("Share link copied to clipboard!"));
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 font-bold">
          <UserPlus size={16} />
        </div>
        <span className="text-base font-extrabold text-slate-900">Share Your Journey</span>
      </div>
      <p className="text-xs text-slate-500 mb-4 font-medium leading-relaxed">
        Invite travel companions or family members to view your live interactive itinerary.
      </p>
      <button
        onClick={handleShare}
        className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 rounded-2xl text-xs font-extrabold transition-all shadow-2xs"
      >
        <Share2 size={15} /> Copy Shareable Link
      </button>
    </div>
  );
}

function classifyItem(item) {
  if (item.type === "GEM") return "GEM";
  if (item.title?.startsWith("Festival:")) return "EVENT";
  return "DESTINATION";
}

const OVERVIEW_KIND_META = {
  DESTINATION: { label: "Destination", Icon: Compass,     dot: "bg-green-600"  },
  GEM:         { label: "Hidden Gem",  Icon: Gem,          dot: "bg-purple-600" },
  EVENT:       { label: "Event",       Icon: PartyPopper,  dot: "bg-yellow-500" },
};

function buildTripSummary(trip, stops) {
  const from = trip.fromLocation || trip.startingPoint;
  const to = trip.toLocation;
  const dayCount = countDays(trip.startDate, trip.endDate);
  const regionSequence = [...new Set((trip.days || []).map(d => d.region).filter(Boolean))];
  const destCount = stops.filter(s => s.kind === "DESTINATION").length;
  const gemCount = stops.filter(s => s.kind === "GEM").length;
  const eventCount = stops.filter(s => s.kind === "EVENT").length;

  const routeText = from && to
    ? (regionSequence.length > 2
        ? `from ${from}, through ${regionSequence.slice(0, -1).join(", ")}, and on to ${to}`
        : `from ${from} to ${to}`)
    : (to ? `to ${to}` : "across Sri Lanka");

  const parts = [];
  parts.push(`This ${dayCount}-day journey takes you ${routeText}.`);

  const highlights = [];
  if (destCount > 0) highlights.push(`${destCount} destination${destCount > 1 ? "s" : ""}`);
  if (gemCount > 0) highlights.push(`${gemCount} hidden gem${gemCount > 1 ? "s" : ""}`);
  if (eventCount > 0) highlights.push(`${eventCount} local event${eventCount > 1 ? "s" : ""}`);
  if (highlights.length > 0) {
    const last = highlights.pop();
    const joined = highlights.length > 0 ? `${highlights.join(", ")} and ${last}` : last;
    parts.push(`Along the way you'll experience ${joined}${regionSequence.length > 1 ? ` across ${regionSequence.length} regions` : ""}.`);
  }
  return parts.join(" ");
}

function TripOverviewSection({ trip, detailCatalog }) {
  const stops = (trip.days || []).flatMap((day) =>
    (day.items || []).map((item) => ({
      ...item,
      kind: classifyItem(item),
      dayNumber: day.dayNumber,
      date: day.date,
      region: day.region,
      match: resolveItemMatch(item, detailCatalog),
    }))
  );

  if (stops.length === 0) return null;

  const summary = buildTripSummary(trip, stops);
  const destCount = stops.filter((s) => s.kind === "DESTINATION").length;
  const gemCount = stops.filter((s) => s.kind === "GEM").length;
  const eventCount = stops.filter((s) => s.kind === "EVENT").length;

  const byDay = [];
  stops.forEach((s) => {
    let bucket = byDay.find((b) => b.dayNumber === s.dayNumber);
    if (!bucket) {
      bucket = { dayNumber: s.dayNumber, date: s.date, region: s.region, stops: [] };
      byDay.push(bucket);
    }
    bucket.stops.push(s);
  });
  byDay.sort((a, b) => a.dayNumber - b.dayNumber);

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 font-bold">
            <Route size={18} />
          </div>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900">Trip Overview & Timeline</h2>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4 font-medium">{summary}</p>

        <div className="flex flex-wrap gap-2 mb-5">
          {[
            { count: destCount, label: "Destinations", meta: OVERVIEW_KIND_META.DESTINATION },
            { count: gemCount, label: "Hidden Gems", meta: OVERVIEW_KIND_META.GEM },
            { count: eventCount, label: "Events", meta: OVERVIEW_KIND_META.EVENT },
          ].filter((c) => c.count > 0).map((c) => (
            <span
              key={c.label}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700"
            >
              <c.meta.Icon size={13} className="text-emerald-700" />
              {c.count} {c.label}
            </span>
          ))}
        </div>
      </div>

      {/* Timeline preview */}
      <div className="space-y-4 pt-2 border-t border-slate-100 max-h-[220px] overflow-y-auto pr-1">
        {byDay.map((bucket) => (
          <div key={bucket.dayNumber} className="flex gap-3">
            <div className="flex flex-col items-center flex-shrink-0 w-14 pt-0.5">
              <span className="text-3xs font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                Day {bucket.dayNumber}
              </span>
              <span className="text-3xs text-slate-400 text-center mt-0.5">
                {formatDateShort(bucket.date)}
              </span>
            </div>
            <div className="flex-1 min-w-0 pb-1 border-l-2 border-slate-100 pl-3">
              {bucket.region && (
                <p className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <MapPin size={10} className="text-emerald-700" /> {bucket.region}
                </p>
              )}
              <ul className="space-y-1.5">
                {bucket.stops.map((s) => {
                  const meta = OVERVIEW_KIND_META[s.kind];
                  const title = cleanItemTitle(s.title);
                  const content = (
                    <span className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-emerald-800 transition-colors">
                      <meta.Icon size={12} className="text-emerald-700 shrink-0" />
                      <span className="truncate">{title}</span>
                    </span>
                  );
                  return (
                    <li key={s.id}>
                      {s.match?.link ? (
                        <Link to={s.match.link}>{content}</Link>
                      ) : (
                        content
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

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
  const [budgetTotal, setBudgetTotal] = useState(null);
  const [detailCatalog, setDetailCatalog] = useState({
    destinations: [], gems: [], events: [], guides: [], vehicles: []
  });
  const [mobileView, setMobileView] = useState("itinerary");
  const dayRefs = useRef({});
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft]     = useState("");
  const [savingTitle, setSavingTitle]   = useState(false);
  const [regenOpen,     setRegenOpen]     = useState(false);
  const [regenFeedback, setRegenFeedback] = useState("");
  const [regenerating,  setRegenerating]  = useState(false);
  const [regenError,    setRegenError]    = useState(null);

  const [timelineOpen, setTimelineOpen] = useState(false);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loadingLogs,  setLoadingLogs]  = useState(false);

  async function toggleTimeline() {
    if (!timelineOpen) {
      setLoadingLogs(true);
      setTimelineOpen(true);
      try {
        const logs = await fetchTripActivityLogs(id, token);
        setActivityLogs(logs);
      } catch (err) {
        console.error("Failed loading activity logs", err);
      } finally {
        setLoadingLogs(false);
      }
    } else {
      setTimelineOpen(false);
    }
  }

  async function loadTrip() {
    setLoading(true);
    setError(null);
    try {
      const data = await getTripById(id);
      setTrip(data);
      if (data.startDate && data.endDate) {
        loadDetailCatalog(data.startDate, data.endDate).then(setDetailCatalog);
      }
      budgetService.getBudgetByTrip(data.id)
        .then(b => setBudgetTotal(b?.totalBudget ?? null))
        .catch(() => setBudgetTotal(null));
      if (data.days?.length > 0) setActiveDay(data.days[0].id);
    } catch (e) {
      setError(e.message || "Trip not found");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isAuthenticated) { navigate("/login"); return; }
    loadTrip();
  }, [id, isAuthenticated, navigate]);

  async function handleConfirm() {
    setConfirming(true);
    try {
      const updated = await updateTripStatus(id, "CONFIRMED");
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

  const activeDayNumber =
    (trip?.days || []).find(d => d.id === activeDay)?.dayNumber ?? null;

  function handleMarkerDayClick(dayNum) {
    const day = (trip?.days || []).find(d => d.dayNumber === dayNum);
    if (!day) return;
    setActiveDay(day.id);
    setMobileView("itinerary");
    requestAnimationFrame(() => {
      dayRefs.current[day.id]?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  function beginEditTitle() {
    setTitleDraft(trip.title || "");
    setEditingTitle(true);
  }
  async function saveTitle() {
    const next = titleDraft.trim();
    if (!next || next === trip.title) { setEditingTitle(false); return; }
    setSavingTitle(true);
    try {
      await updateTripTitle(trip.id, next);
      setTrip(prev => ({ ...prev, title: next }));
      setEditingTitle(false);
    } catch {
      alert("Couldn't update the title. Please try again.");
    } finally {
      setSavingTitle(false);
    }
  }

  async function refreshTrip() {
    try {
      const data = await getTripById(id);
      setTrip(data);
      if (data.days?.length) setActiveDay(data.days[0].id);
      if (data.startDate && data.endDate) {
        loadDetailCatalog(data.startDate, data.endDate).then(setDetailCatalog);
      }
      budgetService.getBudgetByTrip(data.id)
        .then(b => setBudgetTotal(b?.totalBudget ?? null))
        .catch(() => {});
    } catch (err) {
      console.error("Failed to refresh trip", err);
    }
  }

  async function doRegenerateWithPrompt(overridePrompt) {
    setRegenError(null);
    setRegenerating(true);
    try {
      const feedback = (overridePrompt || regenFeedback).trim();
      await generateAiItinerary(trip.id, {
        startDate:     trip.startDate,
        endDate:       trip.endDate,
        travelStyle:   trip.travelStyle,
        travelStyles:  trip.travelStyle ? [trip.travelStyle] : [],
        budgetRange:   trip.budgetRange,
        groupSize:     trip.groupSize,
        regions:       trip.toLocation ? [trip.toLocation] : [],
        interests:     trip.interests
          ? trip.interests.split(",").map(s => s.trim()).filter(Boolean)
          : [],
        startingPoint: trip.startingPoint || trip.fromLocation,
        fromLocation:  trip.fromLocation,
        toLocation:    trip.toLocation,
        specialNotes:  feedback
          ? `Traveler edit request: ${feedback}`
          : null,
      });
      await refreshTrip();
      setRegenerating(false);
    } catch (e) {
      setRegenError(e.message || "Regeneration failed. Please try again.");
    }
  }

  async function doRegenerate() {
    return doRegenerateWithPrompt(regenFeedback);
  }

  if (loading) return (
    <>
      <Navbar />
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-800 rounded-full animate-spin" />
          <p className="text-sm font-bold text-slate-600">Loading your Ceylon journey...</p>
        </div>
      </div>
      <Footer />
    </>
  );

  if (error || !trip) return (
    <>
      <Navbar />
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-3xl p-8 border border-slate-200 shadow-sm max-w-md">
          <p className="text-xs font-bold uppercase tracking-wider text-rose-600 mb-2">Error Loading Trip</p>
          <p className="text-slate-700 font-medium mb-6">{error || "Trip not found"}</p>
          <Link to="/trips"
            className="px-6 py-3 bg-emerald-800 text-white rounded-xl text-sm font-bold hover:bg-emerald-900 transition-all shadow-sm">
             Back to My Trips
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

  return (
    <>
      <Navbar />

      {/* Regeneration overlay */}
      {regenerating && (
        <TripGenerationLoader
          destination={trip.toLocation}
          travelStyleLabel={trip.travelStyle}
          error={regenError}
          onRetry={doRegenerate}
          onDismiss={() => { setRegenerating(false); setRegenError(null); }}
        />
      )}

      {/* Regeneration prompt modal */}
      {regenOpen && (
        <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
               onClick={() => setRegenOpen(false)} />
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw size={18} className="text-emerald-800" />
              <h2 className="text-lg font-black text-slate-900">Regenerate Itinerary</h2>
            </div>
            <p className="text-xs text-slate-500 mb-4 font-medium leading-relaxed">
              Tell the AI what to update and it will re-plan your days with your custom preferences.
            </p>
            <textarea
              autoFocus
              value={regenFeedback}
              onChange={e => setRegenFeedback(e.target.value)}
              rows={3}
              maxLength={300}
              placeholder="e.g. Add Sigiriya, more hidden gems, slower pace..."
              className="w-full border border-slate-200 rounded-2xl p-3.5 text-xs font-semibold
                         outline-none focus:border-emerald-700 focus:ring-2
                         focus:ring-emerald-100 resize-none"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setRegenOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600
                           hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { setRegenOpen(false); doRegenerate(); }}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-800
                           hover:bg-emerald-900 text-white text-xs font-extrabold
                           transition-all shadow-sm"
              >
                <Sparkles size={14} /> Regenerate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════ HERO HEADER ══════════════════════════ */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-900 text-white py-10 sm:py-14 px-4 sm:px-6 lg:px-8 shadow-xl border-b-4 border-amber-400">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            {/* Title & Info */}
            <div className="space-y-3 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to="/trips"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/20 bg-white/10 text-3xs font-extrabold uppercase tracking-widest text-emerald-200 hover:bg-white/20 transition-all"
                >
                  <ArrowLeft size={12} /> My Trips
                </Link>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-3xs font-extrabold uppercase tracking-wider shadow-2xs ${statusMeta.color}`}>
                  ● {statusMeta.label}
                </span>
                {trip.aiGenerated && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-3xs font-extrabold uppercase tracking-wider shadow-2xs">
                    <Sparkles size={12} /> AI Generated
                  </span>
                )}
              </div>

              {/* Editable Title */}
              {editingTitle ? (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    autoFocus
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveTitle();
                      if (e.key === "Escape") setEditingTitle(false);
                    }}
                    maxLength={120}
                    className="text-2xl sm:text-3xl font-extrabold text-white bg-emerald-950/80 border-b-2 border-amber-400 outline-none px-3 py-1 rounded-t-xl w-full"
                  />
                  <button
                    onClick={saveTitle}
                    disabled={savingTitle}
                    className="p-2.5 rounded-xl bg-amber-400 text-slate-950 hover:bg-amber-300 font-bold transition-all shrink-0"
                    title="Save Title"
                  >
                    <Check size={18} />
                  </button>
                  <button
                    onClick={() => setEditingTitle(false)}
                    className="p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all shrink-0"
                    title="Cancel"
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 group">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight tracking-tight">
                    {trip.title}
                  </h1>
                  <button
                    onClick={beginEditTitle}
                    className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-200 transition-all opacity-80 group-hover:opacity-100 shrink-0"
                    title="Edit Trip Title"
                  >
                    <Pencil size={16} />
                  </button>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm font-semibold text-emerald-100/90">
                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                  <Calendar size={14} className="text-amber-300" />
                  {formatDate(trip.startDate)} – {formatDate(trip.endDate)} ({days} Days)
                </span>
                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                  <Users size={14} className="text-amber-300" />
                  {trip.groupSize || 1} Traveler{trip.groupSize > 1 ? "s" : ""}
                </span>
                {(trip.fromLocation || trip.toLocation) && (
                  <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                    <MapPin size={14} className="text-amber-300" />
                    {trip.fromLocation || "Sri Lanka"} → {trip.toLocation || "Sri Lanka"}
                  </span>
                )}
              </div>
            </div>

            {/* Hero Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              <button
                onClick={() => {
                  const url = `${window.location.origin}/trips/share/${trip.shareToken}`;
                  navigator.clipboard.writeText(url).then(() => alert("Share link copied to clipboard!"));
                }}
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 backdrop-blur-xs"
              >
                <Share2 size={15} /> Share
              </button>

              <button
                onClick={() => downloadTripPdf(trip)}
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 backdrop-blur-xs"
              >
                <Download size={15} /> PDF
              </button>

              <button
                onClick={toggleTimeline}
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 backdrop-blur-xs"
              >
                <History size={15} /> Timeline
              </button>

              {trip.aiGenerated && (
                <button
                  onClick={() => {
                    setRegenFeedback("");
                    setRegenOpen(true);
                  }}
                  className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 backdrop-blur-xs"
                >
                  <RefreshCw size={15} /> Regenerate
                </button>
              )}

              {trip.status !== "CONFIRMED" && trip.status !== "COMPLETED" && trip.status !== "CANCELLED" && (
                <button
                  onClick={handleConfirm}
                  disabled={confirming}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
                >
                  {confirming ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      Confirming...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={15} /> Confirm Trip
                    </>
                  )}
                </button>
              )}
            </div>

          </div>
        </div>
      </div>

      <div className="min-h-screen bg-slate-50/70 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

          {/*  Tabs  */}
          <div className="flex gap-2 mb-6 border-b border-slate-200">
            {[
              { key: "itinerary", label: "Itinerary & Overview", Icon: FileText },
              { key: "budget",    label: "Budget Tracker",     Icon: Wallet },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-3 text-sm
                            font-extrabold border-b-2 transition-all -mb-px rounded-t-xl
                            ${activeTab === tab.key
                              ? "border-emerald-800 text-emerald-800 bg-emerald-50/50"
                              : "border-transparent text-slate-500 hover:text-slate-800"
                            }`}
              >
                <tab.Icon size={16} /> {tab.label}
              </button>
            ))}
          </div>

          {/*  Stats row (itinerary tab only) */}
          {activeTab === "itinerary" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            {[
              { value: `${days} Days`, label: "Trip Duration", Icon: Calendar, color: "text-emerald-700 bg-emerald-50 border-emerald-100" },
              { value: `$${Number(budgetTotal ?? (totalCost || 0)).toFixed(0)}`, label: "Estimated Budget", Icon: Wallet, color: "text-amber-700 bg-amber-50 border-amber-100" },
              { value: `${locations} Regions`, label: "Destinations Covered", Icon: MapPin, color: "text-sky-700 bg-sky-50 border-sky-100" },
              { value: `${totalItems} Activities`, label: "Itinerary Items", Icon: Compass, color: "text-purple-700 bg-purple-50 border-purple-100" },
            ].map(s => (
              <div key={s.label}
                className="bg-white rounded-2xl border border-slate-100 p-4
                           shadow-2xs hover:shadow-md transition-all flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${s.color}`}>
                  <s.Icon size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-base sm:text-lg font-black text-slate-900 truncate">{s.value}</p>
                  <p className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider truncate">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
          )}

          {activeTab === "itinerary" && (
            <>
              {/* Responsive 2-column layout on desktop (lg), 1-column on mobile & tablet */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 items-stretch">
                <EditableTripIntelligencePanel
                  onApplyEdit={(promptText) => {
                    setRegenFeedback(promptText);
                    doRegenerateWithPrompt(promptText);
                  }}
                  disabled={regenerating}
                />
                <TripOverviewSection trip={trip} detailCatalog={detailCatalog} />
              </div>

              {/*  Mobile Itinerary/Map switch — hidden on desktop  */}
              <div className="lg:hidden sticky top-[60px] z-30 -mx-4 sm:-mx-6
                              mb-4 bg-slate-50/95 backdrop-blur-md px-4 sm:px-6 py-2.5 border-y border-slate-200/80">
                <div className="grid grid-cols-2 gap-1 p-1 bg-slate-200/80 rounded-xl">
                  {[
                    { key: "itinerary", label: "Itinerary Days", Icon: FileText },
                    { key: "map",       label: "Interactive Map", Icon: MapPin },
                  ].map(v => (
                    <button
                      key={v.key}
                      onClick={() => setMobileView(v.key)}
                      className={`flex items-center justify-center gap-1.5 py-2.5
                                  rounded-lg text-xs font-bold transition-all
                                  ${mobileView === v.key
                                    ? "bg-white text-emerald-900 shadow-2xs font-extrabold"
                                    : "text-slate-600 hover:text-slate-900"}`}
                    >
                      <v.Icon size={15} /> {v.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

                {/*  Left: Day cards  */}
                <div className={`space-y-4 ${mobileView === "itinerary" ? "" : "hidden"} lg:block`}>
                  {(trip.days || []).map((day, dayIndex) => (
                    <div
                      key={day.id}
                      ref={el => { dayRefs.current[day.id] = el; }}
                      className="scroll-mt-[120px]"
                    >
                      <DayCard
                        day={day}
                        dayIndex={dayIndex}
                        trip={trip}
                        tripId={trip.id}
                        token={token}
                        isActive={activeDay === day.id}
                        onClick={() =>
                          setActiveDay(activeDay === day.id ? null : day.id)
                        }
                        onItemAdded={handleItemAdded}
                        onItemDeleted={handleItemDeleted}
                        detailCatalog={detailCatalog}
                      />
                    </div>
                  ))}
                </div>

                {/*  Right: Leaflet Map (sticky on desktop) + Share  */}
                <div className={`space-y-6 ${mobileView === "map" ? "" : "hidden"}
                                lg:block lg:sticky lg:top-20 lg:self-start`}>
                  <TripMapPanel
                    trip={trip}
                    activeDayNumber={activeDayNumber}
                    onMarkerDayClick={handleMarkerDayClick}
                    catalog={detailCatalog}
                  />
                  <SharePanel trip={trip} />
                </div>
              </div>
            </>
          )}

          {activeTab === "budget" && (
            <BudgetTracker trip={trip} onBudgetChange={setBudgetTotal} />
          )}

        </div>
      </div>

      {/* Activity Timeline Modal */}
      {timelineOpen && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setTimelineOpen(false)} />
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl max-h-[80vh] flex flex-col border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <History size={18} />
                </div>
                <h2 className="text-lg font-extrabold text-slate-900">Trip Activity Timeline</h2>
              </div>
              <button
                onClick={() => setTimelineOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-3 pr-1">
              {loadingLogs ? (
                <p className="text-xs font-bold text-slate-500 text-center py-6">Loading activity history...</p>
              ) : activityLogs.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <p className="text-xs font-semibold">No activity recorded yet for this trip.</p>
                </div>
              ) : (
                activityLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                      ⚡
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-3xs font-extrabold text-slate-800 uppercase tracking-wider">
                          {(log.actionType || "").replace(/_/g, " ")}
                        </span>
                        <span className="text-3xs text-slate-400 font-semibold">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-snug font-medium">{log.description}</p>
                      {log.performedBy && (
                        <p className="text-3xs text-slate-400 mt-1 font-semibold">By: {log.performedBy}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}







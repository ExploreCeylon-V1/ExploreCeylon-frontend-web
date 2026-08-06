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
import { updateTripTitle, generateAiItinerary } from "../services/tripService";
import budgetService from "../services/budgetService";
import destinationsService from "../services/destinationsService";
import hiddenGemsService from "../services/Hiddengemsservice";
import eventService from "../services/eventService";
import guidesService from "../services/guidesService";
import { vehicleService } from "../services/vehicleService";
import { getDistanceKm } from "../utils/geo";
import { downloadTripPdf } from "../utils/tripPdf";
import {
  Calendar, Wallet, MapPin, FileText, ChevronDown,
  ArrowLeft, Share2, CheckCircle2, Sparkles, UserPlus,
  PartyPopper, Lightbulb, Sunrise, Sun, Moon,
  Pencil, RefreshCw, Check, X, Gem, Compass, Route, Download,
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
function normalizeName(value = "") {
  return value
    .toLowerCase()
    .replace(/^hidden gem:\s*/i, "")
    .replace(/^festival:\s*/i, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanItemTitle(title = "") {
  return title
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

//  Day Card 
function DayCard({ day, trip, tripId, token, onItemAdded, onItemDeleted,
                   isActive, onClick, detailCatalog, dayIndex }) {
  const [deletingId, setDeletingId] = useState(null);

  const dayTotal = (day.items || []).reduce((s, i) => s + (i.cost || 0), 0);
  const color = DAY_BADGE_COLORS[dayIndex % DAY_BADGE_COLORS.length];
  const slotGroups = bucketItemsIntoSlots(day.items || []);

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
                       ${isActive ? `${color.border} shadow-md` : "border-gray-200"}`}>

        {/*  Day header  */}
        <button
          onClick={onClick}
          className="w-full flex items-center justify-between px-5 py-4
                     hover:bg-gray-50 transition-colors text-left"
        >
          <div className="flex items-center gap-4 flex-wrap">
            {isActive ? (
              <span className={`text-sm font-bold ${color.text}`}>
                DAY {day.dayNumber}
              </span>
            ) : (
              <span className={`text-xs font-bold text-white px-2.5 py-1
                                rounded-full ${color.bg}`}>
                DAY {day.dayNumber}
              </span>
            )}
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Calendar size={13} className="text-gray-400" />
              <span>{formatDateShort(day.date)}</span>
            </div>
            {day.region && (
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <MapPin size={13} className="text-gray-400" />
                <span className="font-medium">{day.region}</span>
              </div>
            )}
            {day.theme && (
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <span>{day.theme}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs text-gray-400">
              {(day.items || []).length} items -{" "}
              Day total: ${dayTotal.toFixed(2)}
            </span>
            <ChevronDown size={16}
              className={`text-gray-400 transition-transform
                         ${isActive ? "rotate-180" : ""}`} />
          </div>
        </button>

        {/*  Day body (expanded)  */}
        {isActive && (
          <div className="px-5 pb-5 border-t border-gray-100">

            {/* Festival banner */}
            {day.items?.some(i => i.title?.startsWith("Festival:")) && (
              <div className="mt-3 mb-3 flex items-center gap-1.5 bg-yellow-50
                              border border-yellow-200 rounded-lg px-3 py-2
                              text-xs text-yellow-800 font-medium">
                <PartyPopper size={13} className="flex-shrink-0" />
                {day.items.find(i => i.title?.startsWith("Festival:"))?.title
                  .replace("Festival: ", "")} nearby!
              </div>
            )}

            {/* Tips */}
            {day.tips && (
              <p className="mt-3 mb-4 flex items-start gap-1.5 text-xs
                            text-gray-400 italic">
                <Lightbulb size={13} className="flex-shrink-0 mt-0.5" />
                <span>{day.tips}</span>
              </p>
            )}

            {/* Time-slotted items (§2): Morning / Afternoon / Evening */}
            {(day.items || []).length > 0 && (
              <div className="mb-4 space-y-4">
                {TIME_SLOTS.map((slot, slotIdx) => {
                  const slotItems = slotGroups[slotIdx] || [];
                  if (!slotItems.length) return null;
                  return (
                    <div key={slot.key}>
                      <div className="flex items-center gap-2 mb-2">
                        <slot.Icon size={14} className={color.text} />
                        <p className="text-xs font-bold text-gray-600 uppercase
                                      tracking-wide">
                          {slot.label}
                        </p>
                        <span className="text-2xs text-gray-300">
                          {slot.time}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {slotItems.map(item => {
                          const meta = ITEM_TYPE_META[item.type] || ITEM_TYPE_META.ACTIVITY;
                          const match = resolveItemMatch(item, detailCatalog);
                          const detailLink = match?.link || null;
                          const image = match?.image || PLACEHOLDER_ITEM_IMAGE;
                          return (
                            <div key={item.id}
                              className="flex items-center gap-3 bg-gray-50
                                         rounded-xl px-4 py-3">
                              {/* Photo */}
                              <img
                                src={image}
                                alt={item.title}
                                className="w-14 h-14 rounded-lg object-cover
                                           flex-shrink-0 bg-gray-200"
                                onError={e => { e.currentTarget.src = PLACEHOLDER_ITEM_IMAGE; }}
                              />

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

                              {/* Cost + details link */}
                              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                <span className="text-sm font-medium text-gray-700
                                                 whitespace-nowrap">
                                  {item.cost > 0 ? `$${item.cost.toFixed(2)}` : "Free"}
                                </span>
                                {detailLink && (
                                  <Link
                                    to={detailLink}
                                    className="text-2xs font-semibold text-green-800
                                               hover:text-green-900 hover:underline
                                               whitespace-nowrap"
                                  >
                                    View Details
                                  </Link>
                                )}
                              </div>

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
                                {deletingId === item.id ? "..." : "x"}
                              </button>
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
            <div className="mt-4 pt-3 border-t border-gray-100 flex
                            justify-between items-center">
              <span className="text-sm font-semibold text-gray-700">
                Day Total:
              </span>
              <span className={`text-base font-bold ${color.text}`}>
                ${dayTotal.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}



//  Share Panel
function SharePanel({ trip }) {
  function handleShare() {
    const url = `${window.location.origin}/trips/share/${trip.shareToken}`;
    navigator.clipboard.writeText(url).then(() => alert("Share link copied!"));
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <UserPlus size={16} className="text-green-700" />
        <span className="text-sm font-bold text-gray-800">Share Your Trip</span>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Invite friends or family to view this itinerary.
      </p>
      <button onClick={handleShare}
        className="w-full flex items-center justify-center gap-1.5 py-2.5
                   bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl
                   text-sm font-semibold transition-colors">
        <Share2 size={15} /> Share Trip
      </button>
    </div>
  );
}

//  Trip Overview
// Classifies every item across all days into destination / hidden gem /
// event, then builds (a) a one-paragraph narrative summary of the whole
// journey and (b) a flat, date-ordered list for the timeline below.
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
  const stops = (trip.days || []).flatMap(day =>
    (day.items || []).map(item => ({
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
  const destCount = stops.filter(s => s.kind === "DESTINATION").length;
  const gemCount = stops.filter(s => s.kind === "GEM").length;
  const eventCount = stops.filter(s => s.kind === "EVENT").length;

  // Group the already date-ordered stops by day for the timeline.
  const byDay = [];
  stops.forEach(s => {
    let bucket = byDay.find(b => b.dayNumber === s.dayNumber);
    if (!bucket) {
      bucket = { dayNumber: s.dayNumber, date: s.date, region: s.region, stops: [] };
      byDay.push(bucket);
    }
    bucket.stops.push(s);
  });
  byDay.sort((a, b) => a.dayNumber - b.dayNumber);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Route size={17} className="text-green-700" />
        <h2 className="text-base font-bold text-gray-900">Trip Overview</h2>
      </div>

      <p className="text-sm text-gray-600 leading-relaxed mb-4">{summary}</p>

      <div className="flex flex-wrap gap-2 mb-5">
        {[
          { count: destCount,  label: "Destinations", meta: OVERVIEW_KIND_META.DESTINATION },
          { count: gemCount,   label: "Hidden Gems",   meta: OVERVIEW_KIND_META.GEM },
          { count: eventCount, label: "Events",        meta: OVERVIEW_KIND_META.EVENT },
        ].filter(c => c.count > 0).map(c => (
          <span key={c.label}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
                       bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700">
            <c.meta.Icon size={13} className="text-gray-500" />
            {c.count} {c.label}
          </span>
        ))}
      </div>

      {/* Chronological timeline of every stop, grouped by day/date */}
      <div className="space-y-4">
        {byDay.map(bucket => (
          <div key={bucket.dayNumber} className="flex gap-3">
            <div className="flex flex-col items-center flex-shrink-0 w-16 pt-0.5">
              <span className="text-2xs font-bold text-gray-400 uppercase tracking-wide">
                Day {bucket.dayNumber}
              </span>
              <span className="text-2xs text-gray-400 text-center">
                {formatDateShort(bucket.date)}
              </span>
            </div>
            <div className="flex-1 min-w-0 pb-1 border-l border-gray-100 pl-4">
              {bucket.region && (
                <p className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1">
                  <MapPin size={11} className="text-gray-400" /> {bucket.region}
                </p>
              )}
              <ul className="space-y-2">
                {bucket.stops.map(s => {
                  const meta = OVERVIEW_KIND_META[s.kind];
                  const title = cleanItemTitle(s.title);
                  const notesText = (s.notes || "") + " " + (s.title || "");
                  let slotBadge = <span className="text-3xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full shrink-0">⏰ SCHEDULED</span>;
                  if (notesText.toLowerCase().includes("[morning]") || notesText.toLowerCase().includes("morning")) {
                    slotBadge = <span className="text-3xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full shrink-0">🌅 MORNING</span>;
                  } else if (notesText.toLowerCase().includes("[afternoon]") || notesText.toLowerCase().includes("afternoon")) {
                    slotBadge = <span className="text-3xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full shrink-0">☀️ AFTERNOON</span>;
                  } else if (notesText.toLowerCase().includes("[evening]") || notesText.toLowerCase().includes("evening")) {
                    slotBadge = <span className="text-3xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full shrink-0">🌙 EVENING</span>;
                  }

                  const content = (
                    <span className="flex items-center gap-2 text-sm text-gray-700" title={meta.label}>
                      {slotBadge}
                      <meta.Icon size={13} className={`flex-shrink-0 ${meta.dot.replace("bg-", "text-")}`} />
                      <span className="truncate font-medium">{title}</span>
                    </span>
                  );
                  return (
                    <li key={s.id}>
                      {s.match?.link ? (
                        <Link to={s.match.link} className="hover:text-green-800 transition-colors">
                          {content}
                        </Link>
                      ) : content}
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

//  Main Page
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
  // Real budget total from the Budget API (null = no budget yet, so the
  // stats row falls back to the AI-estimated trip cost).
  const [budgetTotal, setBudgetTotal] = useState(null);
  const [detailCatalog, setDetailCatalog] = useState({
    destinations: [], gems: [], events: [], guides: [], vehicles: []
  });
  // Mobile-only Itinerary/Map tab (§1). Desktop shows both panels.
  const [mobileView, setMobileView] = useState("itinerary");
  // Refs to each day card so a map-marker click can scroll to it (§3).
  const dayRefs = useRef({});
  // Inline title edit (§4)
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft]     = useState("");
  const [savingTitle, setSavingTitle]   = useState(false);
  // Regenerate-with-feedback (§4 / §15)
  const [regenOpen,     setRegenOpen]     = useState(false);
  const [regenFeedback, setRegenFeedback] = useState("");
  const [regenerating,  setRegenerating]  = useState(false);
  const [regenError,    setRegenError]    = useState(null);

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
      loadDetailCatalog(data.startDate, data.endDate).then(setDetailCatalog);
      budgetService.getBudgetByTrip(data.id)
        .then(b => setBudgetTotal(b.totalBudget))
        .catch(() => setBudgetTotal(null));
      if (data.days?.length > 0) setActiveDay(data.days[0].id);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isAuthenticated) { navigate("/login"); return; }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loadTrip sets loading state synchronously before its await; intentional fetch-on-id-change pattern
    loadTrip();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadTrip is a plain function redefined every render; adding it would refetch the trip on every render
  }, [id, isAuthenticated, navigate]);

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

  // The currently-expanded day drives the map focus (§3). Clicking a marker
  // selects that day, switches the mobile view to the itinerary, and scrolls
  // the matching day card into view.
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

  // ── Inline title (§4) ──────────────────────────────────
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

  // ── Regenerate with feedback (§4 / §15) ────────────────
  // Refetch the itinerary in place without flipping the whole page back to
  // its loading state (which would unmount the generation overlay).
  async function refreshTrip() {
    const res = await fetch(`${API_BASE}/api/v1/trips/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    setTrip(data);
    if (data.days?.length) setActiveDay(data.days[0].id);
    loadDetailCatalog(data.startDate, data.endDate).then(setDetailCatalog);
    budgetService.getBudgetByTrip(data.id)
      .then(b => setBudgetTotal(b.totalBudget))
      .catch(() => {});
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <div className="w-10 h-10 border-4 border-green-100 border-t-green-700 rounded-full animate-spin" />
          <p className="text-sm">Loading trip...</p>
        </div>
      </div>
      <Footer />
    </>
  );
  //  Error 
  if (error || !trip) return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 flex items-center
                      justify-center">
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-700 mb-3">Notice</p>
          <p className="text-gray-700 font-medium mb-4">{error || "Trip not found"}</p>
          <Link to="/trips"
            className="px-5 py-2.5 bg-green-800 text-white rounded-xl
                       text-sm font-semibold hover:bg-green-900 transition-colors">
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

  //  Render 
  return (
    <>
      <Navbar />

      {/* §4/§15 — regeneration overlay (reuses the generation loader) */}
      {regenerating && (
        <TripGenerationLoader
          destination={trip.toLocation}
          travelStyleLabel={trip.travelStyle}
          error={regenError}
          onRetry={doRegenerate}
          onDismiss={() => { setRegenerating(false); setRegenError(null); }}
        />
      )}

      {/* §15 — "what would you like to change?" before regenerating */}
      {regenOpen && (
        <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50"
               onClick={() => setRegenOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-2 mb-1.5">
              <RefreshCw size={17} className="text-green-700" />
              <h2 className="text-lg font-bold text-gray-900">Regenerate itinerary</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Tell the AI what to change and it'll re-plan with your feedback.
              Leave blank for a fresh take.
            </p>
            <textarea
              autoFocus
              value={regenFeedback}
              onChange={e => setRegenFeedback(e.target.value)}
              rows={3}
              maxLength={300}
              placeholder="e.g. more hidden gems, fewer temples, slower pace, add a beach day…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                         outline-none focus:border-green-600 focus:ring-2
                         focus:ring-green-100 resize-none"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setRegenOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-500
                           hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { setRegenOpen(false); doRegenerate(); }}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-green-800
                           hover:bg-green-900 text-white text-sm font-semibold
                           transition-colors"
              >
                <Sparkles size={15} /> Regenerate
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gray-50 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

          {/*  Page header  */}
          <div className="flex items-start justify-between gap-4 mb-6
                          flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                {editingTitle ? (
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      value={titleDraft}
                      onChange={e => setTitleDraft(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter") saveTitle();
                        if (e.key === "Escape") setEditingTitle(false);
                      }}
                      maxLength={120}
                      className="text-2xl font-bold text-gray-900 border-b-2
                                 border-green-700 outline-none bg-transparent
                                 min-w-[220px]"
                    />
                    <button
                      onClick={saveTitle}
                      disabled={savingTitle}
                      className="w-8 h-8 flex items-center justify-center rounded-lg
                                 bg-green-700 text-white hover:bg-green-800
                                 disabled:opacity-50"
                      title="Save title"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={() => setEditingTitle(false)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg
                                 text-gray-400 hover:bg-gray-100"
                      title="Cancel"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group">
                    <h1 className="text-2xl font-bold text-gray-900">
                      {trip.title}
                    </h1>
                    <button
                      onClick={beginEditTitle}
                      className="w-7 h-7 flex items-center justify-center rounded-lg
                                 text-gray-300 hover:text-green-700 hover:bg-green-50
                                 transition-colors"
                      title="Rename trip"
                    >
                      <Pencil size={14} />
                    </button>
                  </div>
                )}
                <span className={`text-xs font-semibold px-2.5 py-1
                                  rounded-full ${statusMeta.color}`}>
                  {statusMeta.label}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                {" - "}{trip.groupSize || 1} Traveler{trip.groupSize > 1 ? "s" : ""}
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
                <Share2 size={15} /> Share
              </button>

              <button
                onClick={() => downloadTripPdf(trip)}
                className="flex items-center gap-1.5 px-4 py-2.5 border
                           border-gray-200 rounded-xl text-sm font-medium
                           text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Download size={15} /> Download PDF
              </button>

              {trip.aiGenerated && (
                <button
                  onClick={() => { setRegenFeedback(""); setRegenOpen(true); }}
                  className="flex items-center gap-1.5 px-4 py-2.5 border
                             border-gray-200 rounded-xl text-sm font-medium
                             text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <RefreshCw size={15} /> Regenerate
                </button>
              )}

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
                      Confirming...</>
                  ) : <><CheckCircle2 size={15} /> Confirm Trip</>}
                </button>
              )}

              <Link to="/trips"
                className="flex items-center gap-1.5 px-4 py-2.5 border
                           border-gray-200 rounded-xl text-sm font-medium
                           text-gray-600 hover:bg-gray-50 transition-colors">
                <ArrowLeft size={15} /> Back
              </Link>
            </div>
          </div>

          {/*  Tabs  */}
          <div className="flex gap-0 mb-6 border-b border-gray-200">
            {[
              { key: "itinerary", label: "Itinerary",      Icon: FileText },
              { key: "budget",    label: "Budget Tracker", Icon: Wallet },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-5 py-3 text-sm
                            font-medium border-b-2 transition-colors -mb-px
                            ${activeTab === tab.key
                              ? "border-green-800 text-green-800"
                              : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
              >
                <tab.Icon size={15} /> {tab.label}
              </button>
            ))}
          </div>

          {/*  Stats row (itinerary tab only — the budget tab has its own) */}
          {activeTab === "itinerary" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { value: days,       label: "Days",          Icon: Calendar },
              { value: `${(budgetTotal ?? totalCost).toFixed(0)}`,
                label: "Budgeted (USD)", Icon: Wallet },
              { value: locations,  label: "Locations",      Icon: MapPin },
              { value: totalItems, label: "Items Added",    Icon: FileText },
            ].map(s => (
              <div key={s.label}
                className="bg-white rounded-2xl border border-gray-200 p-4
                           shadow-sm flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-green-50 text-green-800
                                flex items-center justify-center flex-shrink-0">
                  <s.Icon size={18} />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-400">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
          )}

          {activeTab === "itinerary" && (
            <>


              {/* Updated Trip Overview Section */}
              <TripOverviewSection trip={trip} detailCatalog={detailCatalog} />

              {/*  Mobile Itinerary/Map switch — hidden on desktop  */}
              <div className="lg:hidden sticky top-[60px] z-30 -mx-4 sm:-mx-6
                              mb-4 bg-gray-50/95 backdrop-blur px-4 sm:px-6 py-2">
                <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100 rounded-xl">
                  {[
                    { key: "itinerary", label: "Itinerary", Icon: FileText },
                    { key: "map",       label: "Map",       Icon: MapPin },
                  ].map(v => (
                    <button
                      key={v.key}
                      onClick={() => setMobileView(v.key)}
                      className={`flex items-center justify-center gap-1.5 py-2
                                  rounded-lg text-sm font-medium transition-colors
                                  ${mobileView === v.key
                                    ? "bg-white text-green-800 shadow-sm"
                                    : "text-gray-500"}`}
                    >
                      <v.Icon size={15} /> {v.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

                {/*  Left: Day cards  */}
                <div className={`space-y-3 ${mobileView === "itinerary" ? "" : "hidden"} lg:block`}>
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
                <div className={`space-y-4 ${mobileView === "map" ? "" : "hidden"}
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
      <Footer />
    </>
  );
}







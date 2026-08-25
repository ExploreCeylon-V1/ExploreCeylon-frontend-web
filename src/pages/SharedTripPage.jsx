// SharedTripPage.jsx
// Read-only public shared trip viewer — accessible without authentication.
// Displays the AI/curated itinerary, interactive map, and embedded budget summary.

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import TripMapPanel from "../components/TripMapPanel";
import { getTripByShareToken } from "../services/tripService";
import destinationsService from "../services/destinationsService";
import hiddenGemsService from "../services/Hiddengemsservice";
import eventService from "../services/eventService";
import guidesService from "../services/guidesService";
import { vehicleService } from "../services/vehicleService";
import { downloadTripPdf } from "../utils/tripPdf";
import {
  Calendar, Wallet, MapPin, FileText, ChevronDown,
  Eye, CheckCircle2, AlertTriangle, AlertCircle,
  PartyPopper, Lightbulb, Sunrise, Sun, Moon,
  Gem, Compass, Route, Download, Users,
  Layers, Check, Sparkles, ArrowRight, ShieldCheck,
} from "lucide-react";

// Per-day accent colors, cycled by day index
const DAY_BADGE_COLORS = [
  { text: "text-green-800",  border: "border-green-700",  bg: "bg-green-700"  },
  { text: "text-blue-700",   border: "border-blue-600",   bg: "bg-blue-600"   },
  { text: "text-orange-700", border: "border-orange-500", bg: "bg-orange-500" },
  { text: "text-purple-700", border: "border-purple-600", bg: "bg-purple-600" },
  { text: "text-cyan-700",   border: "border-cyan-600",   bg: "bg-cyan-600"   },
  { text: "text-pink-700",   border: "border-pink-600",   bg: "bg-pink-600"   },
  { text: "text-teal-700",   border: "border-teal-600",   bg: "bg-teal-600"   },
];

const ITEM_TYPE_META = {
  ACTIVITY:  { label: "Activity",   color: "bg-blue-100 text-blue-700" },
  TRANSPORT: { label: "Transport",  color: "bg-orange-100 text-orange-700" },
  GEM:       { label: "Hidden Gem", color: "bg-purple-100 text-purple-700" },
  HOTEL:     { label: "Hotel",      color: "bg-green-100 text-green-700" },
  FOOD:      { label: "Food",       color: "bg-yellow-100 text-yellow-700" },
  GUIDE:     { label: "Guide",      color: "bg-teal-100 text-teal-700" },
  VEHICLE:   { label: "Vehicle",    color: "bg-amber-100 text-amber-700" },
};

const CATEGORIES = [
  { key: "HOTEL",     label: "Hotels",     emoji: "🏨", color: "#1e3a5f" },
  { key: "VEHICLE",   label: "Vehicles",   emoji: "🚗", color: "#f59e0b" },
  { key: "GUIDE",     label: "Guides",     emoji: "👤", color: "#7c3aed" },
  { key: "ACTIVITY",  label: "Activities", emoji: "🎟️", color: "#059669" },
  { key: "FOOD",      label: "Food",       emoji: "🍜", color: "#e11d48" },
  { key: "TRANSPORT", label: "Transport",  emoji: "🚌", color: "#2563eb" },
  { key: "OTHER",     label: "Other",      emoji: "📦", color: "#6b7280" },
];

const TIME_SLOTS = [
  { key: "morning",   label: "Morning",   time: "Start of day",  Icon: Sunrise },
  { key: "afternoon", label: "Afternoon", time: "Midday",        Icon: Sun },
  { key: "evening",   label: "Evening",   time: "Later",         Icon: Moon },
];

const STATUS_META = {
  DRAFT:     { label: "DRAFT",     color: "text-gray-500 bg-gray-100" },
  GENERATED: { label: "GENERATED", color: "text-purple-700 bg-purple-100" },
  CONFIRMED: { label: "CONFIRMED", color: "text-green-700 bg-green-100" },
  ACTIVE:    { label: "ACTIVE",    color: "text-amber-700 bg-amber-100" },
  COMPLETED: { label: "COMPLETED", color: "text-blue-700 bg-blue-100" },
  CANCELLED: { label: "CANCELLED", color: "text-red-700 bg-red-100" },
};

const PLACEHOLDER_ITEM_IMAGE = "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=600&q=80";

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
    month: "short", day: "numeric",
  });
}

function countDays(startDate, endDate) {
  if (!startDate || !endDate) return 1;
  const start = new Date(startDate);
  const end   = new Date(endDate);
  const diff  = Math.round((end - start) / (1000 * 60 * 60 * 24));
  return diff >= 0 ? diff + 1 : 1;
}

function bucketItemsIntoSlots(items) {
  const groups = [[], [], []];
  const list = items || [];
  const n = list.length;
  if (n === 0) return groups;
  const per = Math.ceil(n / 3);
  list.forEach((item, i) => {
    groups[Math.min(2, Math.floor(i / per))].push(item);
  });
  return groups;
}

function cleanItemTitle(title) {
  if (!title) return "";
  return String(title)
    .replace(/^Hidden Gem:\s*/i, "")
    .replace(/^Festival:\s*/i, "")
    .split(" - ")[0]
    .trim();
}

function getItemImage(kind, record) {
  if (!record) return PLACEHOLDER_ITEM_IMAGE;
  if (kind === "DESTINATION") return record.coverImageUrl || record.imageUrls?.[0] || PLACEHOLDER_ITEM_IMAGE;
  if (kind === "GEM") return record.imageUrls?.[0] || PLACEHOLDER_ITEM_IMAGE;
  if (kind === "EVENT") return record.imageUrls?.[0] || record.coverImageUrl || PLACEHOLDER_ITEM_IMAGE;
  if (kind === "GUIDE") return record.profileImageUrl || record.imageUrls?.[0] || PLACEHOLDER_ITEM_IMAGE;
  if (kind === "VEHICLE") return record.imageUrls?.[0] || PLACEHOLDER_ITEM_IMAGE;
  return PLACEHOLDER_ITEM_IMAGE;
}

function findCatalogMatch(rawTitle, records, textField = "name") {
  const cleaned = cleanItemTitle(rawTitle).toLowerCase();
  if (!cleaned) return null;
  return records.find(r => {
    const target = (r?.[textField] || "").toLowerCase();
    return target && (target.includes(cleaned) || cleaned.includes(target));
  });
}

function buildItemMatch(kind, record) {
  if (!record) return null;
  const linkFns = {
    DESTINATION: (r) => `/destinations/${r.id}`,
    GEM:         (r) => `/hidden-gems/${r.id}`,
    EVENT:       (r) => `/events/${r.id}`,
    GUIDE:       (r) => `/guides/${r.id}`,
    VEHICLE:     (r) => `/vehicles`,
  };
  const linkFn = linkFns[kind];
  return {
    kind,
    record,
    link: typeof linkFn === "function" ? linkFn(record) : null,
    image: getItemImage(kind, record),
  };
}

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

// ── Read-Only Day Card ───────────────────────────────────────
function ReadOnlyDayCard({ day, trip, detailCatalog, dayIndex, isActive, onToggle }) {
  const dayTotal = (day?.items || []).reduce((s, i) => s + (Number(i?.cost) || 0), 0);
  const color = DAY_BADGE_COLORS[dayIndex % DAY_BADGE_COLORS.length] || DAY_BADGE_COLORS[0];
  const slotGroups = bucketItemsIntoSlots(day?.items || []);

  return (
    <div className={`bg-white rounded-3xl border transition-all duration-300 overflow-hidden shadow-2xs ${
      isActive ? "border-emerald-200 ring-2 ring-emerald-600/10 shadow-md" : "border-slate-100 hover:border-slate-200"
    }`}>
      {/* Day header toggle */}
      <button
        onClick={onToggle}
        className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-xs text-white shrink-0 shadow-2xs ${color.bg}`}>
            {day?.dayNumber || dayIndex + 1}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={`text-2xs font-extrabold tracking-wider uppercase ${color.text}`}>
                DAY {day?.dayNumber || dayIndex + 1}
              </span>
              {day?.date && (
                <span className="text-3xs font-semibold text-slate-400">
                  • {formatDateShort(day.date)}
                </span>
              )}
            </div>
            <h3 className="font-extrabold text-slate-900 text-base sm:text-lg truncate">
              {day?.region ? `${day.region}` : `Day ${day?.dayNumber || dayIndex + 1} Itinerary`}
            </h3>
          </div>
          {day?.theme && (
            <span className="text-xs font-medium text-slate-400 hidden md:inline-block">
              • {day.theme}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0 ml-2">
          <span className="text-xs font-extrabold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
            ${Number(dayTotal || 0).toFixed(2)}
          </span>
          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 transition-colors">
            <ChevronDown
              size={16}
              className={`transition-transform duration-300 ${isActive ? "rotate-180 text-emerald-800" : ""}`}
            />
          </div>
        </div>
      </button>

      {/* Expanded day body */}
      {isActive && (
        <div className="px-4 sm:px-6 pb-6 pt-2 border-t border-slate-100 bg-slate-50/40">
          {/* Festival banner */}
          {day?.items?.some(i => i?.title?.startsWith("Festival:")) && (
            <div className="mt-3 mb-4 flex items-center gap-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 rounded-2xl p-3 text-xs text-amber-950 font-bold shadow-2xs">
              <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shrink-0">
                <PartyPopper size={16} />
              </div>
              <div className="min-w-0">
                <p className="font-extrabold text-amber-950 text-xs sm:text-sm">
                  {((day?.items || []).find(i => i?.title?.startsWith("Festival:"))?.title || "").replace(/^Festival:\s*/i, "")} nearby!
                </p>
                <p className="text-3xs text-amber-800/90 font-medium">
                  Special cultural festival integrated into today's itinerary.
                </p>
              </div>
            </div>
          )}

          {/* Tips */}
          {day?.tips && (
            <div className="mt-3 mb-4 flex items-start gap-2 text-xs text-slate-600 bg-emerald-50/80 border border-emerald-100 rounded-xl p-3">
              <Lightbulb size={15} className="text-emerald-700 shrink-0 mt-0.5" />
              <p className="italic font-medium leading-relaxed">{day.tips}</p>
            </div>
          )}

          {/* Empty items state */}
          {(day?.items || []).length === 0 && (
            <div className="text-center py-8 px-4 bg-white rounded-2xl border border-dashed border-slate-200 my-3">
              <Compass className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-600">No scheduled activities for Day {day?.dayNumber}</p>
            </div>
          )}

          {/* Morning / Afternoon / Evening slots */}
          {(day?.items || []).length > 0 && (
            <div className="my-3 space-y-5">
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
                                {Number(item?.cost) > 0 ? `$${Number(item.cost).toFixed(2)}` : "Included"}
                              </span>

                              {detailLink && (
                                <Link
                                  to={detailLink}
                                  className="text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-3 py-1.5 rounded-xl hover:bg-emerald-100 transition-all whitespace-nowrap"
                                >
                                  View Details →
                                </Link>
                              )}
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

          {/* Subtotal */}
          <div className="mt-4 pt-3 border-t border-slate-200/80 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Day {day?.dayNumber} Subtotal
            </span>
            <span className={`text-base font-black ${color.text}`}>
              ${Number(dayTotal || 0).toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Read-Only Budget View ────────────────────────────────────
function ReadOnlyBudgetSection({ budgetSummary, daysCount }) {
  if (!budgetSummary) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-2xs max-w-2xl mx-auto my-8">
        <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-4">
          <Wallet size={28} />
        </div>
        <h3 className="text-lg font-extrabold text-slate-900 mb-2">No Budget Recorded</h3>
        <p className="text-sm font-medium text-slate-500 leading-relaxed">
          The traveler has not published a live expense budget tracker for this trip yet.
        </p>
      </div>
    );
  }

  const totalBudget = Number(budgetSummary.totalBudget || 0);
  const totalSpent = Number(budgetSummary.totalSpent || 0);
  const remaining = Number(budgetSummary.remaining || (totalBudget - totalSpent));
  const usedPercentage = Number(budgetSummary.usedPercentage || (totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0));
  const dailyAverage = daysCount > 0 ? totalSpent / daysCount : 0;

  const categoryBudgets = budgetSummary.categoryBudgets || {};
  const categorySpent = budgetSummary.categorySpent || {};
  const items = budgetSummary.items || [];

  const isOver = totalSpent > totalBudget;
  const isWarning = !isOver && usedPercentage >= 80;

  return (
    <div className="space-y-6">
      {/* Top summary grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-2xs">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Budget</p>
          <p className="text-2xl font-black text-slate-900">${totalBudget.toFixed(2)}</p>
          <p className="text-3xs font-semibold text-slate-400 mt-1">Planned allocation</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-2xs">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Spent</p>
          <p className="text-2xl font-black text-slate-900">${totalSpent.toFixed(2)}</p>
          <p className="text-3xs font-semibold text-slate-400 mt-1">Avg ${dailyAverage.toFixed(2)} / day</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-2xs">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Remaining</p>
          <p className={`text-2xl font-black ${remaining >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
            ${remaining.toFixed(2)}
          </p>
          <p className="text-3xs font-semibold text-slate-400 mt-1">
            {remaining >= 0 ? "Under budget" : "Over budget"}
          </p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-2xs">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Budget Health</p>
          <div className="flex items-center gap-2 mt-0.5">
            {isOver ? (
              <span className="inline-flex items-center gap-1 text-xs font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg">
                <AlertCircle size={14} /> Over Budget
              </span>
            ) : isWarning ? (
              <span className="inline-flex items-center gap-1 text-xs font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">
                <AlertTriangle size={14} /> Warning (80%+)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                <CheckCircle2 size={14} /> On Track
              </span>
            )}
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                isOver ? "bg-rose-500" : isWarning ? "bg-amber-500" : "bg-emerald-600"
              }`}
              style={{ width: `${Math.min(100, usedPercentage)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-2xs">
        <h3 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
          <Layers size={18} className="text-emerald-700" /> Category Breakdown
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CATEGORIES.map(cat => {
            const allocated = Number(categoryBudgets[cat.key] || 0);
            const spent = Number(categorySpent[cat.key] || 0);
            const catPct = allocated > 0 ? (spent / allocated) * 100 : 0;
            return (
              <div key={cat.key} className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>{cat.emoji}</span> {cat.label}
                  </span>
                  <span className="text-xs font-extrabold text-slate-900">${spent.toFixed(0)}</span>
                </div>
                <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden mb-1">
                  <div
                    className="h-full rounded-full bg-emerald-700 transition-all"
                    style={{ width: `${Math.min(100, catPct)}%` }}
                  />
                </div>
                <div className="flex justify-between text-3xs font-semibold text-slate-400">
                  <span>Allocated: ${allocated.toFixed(0)}</span>
                  <span>{catPct.toFixed(0)}% used</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Expense line items (sanitized, read-only) */}
      {items.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-2xs">
          <h3 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
            <FileText size={18} className="text-emerald-700" /> Published Expenses ({items.length})
          </h3>
          <div className="divide-y divide-slate-100">
            {items.map(item => {
              const cat = CATEGORIES.find(c => c.key === item.category) || CATEGORIES[CATEGORIES.length - 1];
              return (
                <div key={item.id} className="py-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xl shrink-0">{cat.emoji}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-extrabold text-slate-800 truncate">{item.title}</p>
                        {item.autoAdded && (
                          <span className="bg-blue-50 text-blue-700 text-3xs font-extrabold px-1.5 py-0.5 rounded">
                            AUTO
                          </span>
                        )}
                      </div>
                      <p className="text-3xs font-medium text-slate-400">
                        {item.date ? formatDateShort(item.date) : "Unscheduled"} {item.notes ? `• ${item.notes}` : ""}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-slate-900 shrink-0">
                    ${Number(item.amount || 0).toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Shared Trip Page Component ──────────────────────────
export default function SharedTripPage() {
  const { token } = useParams();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("itinerary");
  const [activeDay, setActiveDay] = useState(null);
  const [detailCatalog, setDetailCatalog] = useState({
    destinations: [], gems: [], events: [], guides: [], vehicles: []
  });

  useEffect(() => {
    let isMounted = true;
    async function loadShared() {
      if (!token) {
        setError("Invalid link");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await getTripByShareToken(token);
        if (!isMounted) return;
        setTrip(data);
        if (data?.days?.length > 0) {
          setActiveDay(data.days[0].id);
        }
        if (data?.startDate && data?.endDate) {
          loadDetailCatalog(data.startDate, data.endDate).then(cat => {
            if (isMounted) setDetailCatalog(cat);
          });
        }
      } catch (err) {
        if (!isMounted) return;
        setError("Trip link not found or expired");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadShared();
    return () => { isMounted = false; };
  }, [token]);

  const days = countDays(trip?.startDate, trip?.endDate);
  const statusMeta = STATUS_META[trip?.status] || STATUS_META.DRAFT;

  const totalCost = (trip?.days || []).reduce((sum, d) => {
    return sum + (d.items || []).reduce((itemSum, item) => itemSum + (Number(item?.cost) || 0), 0);
  }, 0);

  const totalItems = (trip?.days || []).reduce((sum, d) => sum + (d.items?.length || 0), 0);
  const uniqueRegions = new Set((trip?.days || []).map(d => d.region).filter(Boolean));
  const locationsCount = uniqueRegions.size || (trip?.fromLocation && trip?.toLocation ? 2 : 1);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 border-4 border-emerald-800 border-t-transparent rounded-full animate-spin mb-4" />
          <h2 className="text-lg font-extrabold text-slate-800">Loading Shared Trip...</h2>
          <p className="text-xs font-semibold text-slate-400 mt-1">Retrieving verified travel plan</p>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !trip) {
    return (
      <>
        <Navbar />
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center bg-slate-50/50">
          <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 shadow-sm border border-rose-100">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Trip Link Unavailable</h2>
          <p className="text-sm font-medium text-slate-500 max-w-md mb-6 leading-relaxed">
            This trip link is invalid or no longer available. The link may have been revoked or expired. Please ask the organizer for an updated link.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/destinations"
              className="bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs px-5 py-3 rounded-xl transition-all shadow-md"
            >
              Explore Sri Lanka
            </Link>
            <Link
              to="/"
              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-extrabold text-xs px-5 py-3 rounded-xl transition-all"
            >
              Go to Home
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      {/* ══════════════════════════ HERO HEADER ══════════════════════════ */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-900 text-white py-10 sm:py-14 px-4 sm:px-6 lg:px-8 shadow-xl border-b-4 border-amber-400">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800/80 text-emerald-200 border border-emerald-600/40 text-3xs font-extrabold uppercase tracking-widest">
                  <Eye size={12} /> Shared Trip • View Only
                </span>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-3xs font-extrabold uppercase tracking-wider shadow-2xs ${statusMeta.color}`}>
                  ● {statusMeta.label}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight tracking-tight">
                {trip.title}
              </h1>

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

            {/* Quick action: Download PDF if desired */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => downloadTripPdf(trip)}
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 backdrop-blur-xs"
              >
                <Download size={15} /> Download PDF Itinerary
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════ BODY CONTENT ══════════════════════════ */}
      <div className="min-h-screen bg-slate-50/70 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

          {/* Navigation Tabs */}
          <div className="flex gap-2 mb-6 border-b border-slate-200">
            {[
              { key: "itinerary", label: "Itinerary & Overview", Icon: FileText },
              { key: "budget",    label: "Budget Tracker",     Icon: Wallet },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-extrabold border-b-2 transition-all -mb-px rounded-t-xl ${
                  activeTab === tab.key
                    ? "border-emerald-800 text-emerald-800 bg-emerald-50/50"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <tab.Icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab 1: Itinerary */}
          {activeTab === "itinerary" && (
            <>
              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
                {[
                  { value: `${days} Days`, label: "Trip Duration", Icon: Calendar, color: "text-emerald-700 bg-emerald-50 border-emerald-100" },
                  { value: `$${Number(totalCost > 0 ? totalCost : (trip?.budgetSummary?.totalBudget || 0)).toFixed(0)}`, label: "Estimated Budget", Icon: Wallet, color: "text-amber-700 bg-amber-50 border-amber-100" },
                  { value: `${locationsCount} Regions`, label: "Destinations Covered", Icon: MapPin, color: "text-sky-700 bg-sky-50 border-sky-100" },
                  { value: `${totalItems} Activities`, label: "Itinerary Items", Icon: Compass, color: "text-purple-700 bg-purple-50 border-purple-100" },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-2xs flex items-center gap-3.5">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 border ${s.color}`}>
                      <s.Icon size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-base sm:text-xl font-black text-slate-900 leading-tight">{s.value}</p>
                      <p className="text-3xs sm:text-2xs font-bold text-slate-400 mt-0.5 truncate">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Split layout: Day cards + Map sidebar */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left column: Itinerary days (7 cols) */}
                <div className="lg:col-span-7 space-y-4">
                  {(trip.days || []).map((day, dayIndex) => (
                    <ReadOnlyDayCard
                      key={day.id}
                      day={day}
                      trip={trip}
                      detailCatalog={detailCatalog}
                      dayIndex={dayIndex}
                      isActive={activeDay === day.id}
                      onToggle={() => setActiveDay(activeDay === day.id ? null : day.id)}
                    />
                  ))}
                </div>

                {/* Right column: Interactive map & trip overview (5 cols) */}
                <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
                  <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-2xs overflow-hidden">
                    <h3 className="text-sm font-extrabold text-slate-900 mb-3 flex items-center gap-2">
                      <Route size={16} className="text-emerald-700" /> Interactive Route Map
                    </h3>
                    <TripMapPanel
                      trip={trip}
                      activeDayId={activeDay}
                      onSelectDay={setActiveDay}
                      detailCatalog={detailCatalog}
                    />
                  </div>

                  <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-2xs">
                    <h3 className="text-sm font-extrabold text-slate-900 mb-3 flex items-center gap-2">
                      <Compass size={16} className="text-emerald-700" /> Trip Highlights & Style
                    </h3>
                    <div className="space-y-2.5 text-xs">
                      <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                        <span className="font-semibold text-slate-400">Travel Style</span>
                        <span className="font-extrabold text-slate-800">{trip.travelStyle || "Cultural & Leisure"}</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                        <span className="font-semibold text-slate-400">Budget Range</span>
                        <span className="font-extrabold text-slate-800">{trip.budgetRange || "Flexible"}</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5">
                        <span className="font-semibold text-slate-400">Total Activities</span>
                        <span className="font-extrabold text-emerald-800">{totalItems} planned stops</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Tab 2: Budget */}
          {activeTab === "budget" && (
            <ReadOnlyBudgetSection
              budgetSummary={trip.budgetSummary}
              daysCount={days}
            />
          )}

        </div>
      </div>

      <Footer />
    </>
  );
}

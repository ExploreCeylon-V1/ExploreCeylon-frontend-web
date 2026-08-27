// BudgetTracker.jsx
// Budget Tracker tab for the trip detail page. "Live" mode (default) is
// wired to the backend Budget/BudgetItem API; the demo pills swap in mock
// data so each visual state (On Track / Warning / Over / Empty) can still
// be previewed without real expenses.

import { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2, AlertTriangle, AlertCircle, Plus, RefreshCw, Pencil,
  Trash2, Search, TrendingUp, Download, Copy, Share2, X,
  BarChart3, ArrowLeftRight, Lightbulb, Ban, Database, Car, Users as UsersIcon,
} from "lucide-react";
import budgetService from "../services/budgetService";
import { DEFAULT_USD_TO_LKR_RATE } from "../utils/currencyUtils";
import { downloadBudgetPdf } from "../utils/budgetPdf";

const LKR_RATE = DEFAULT_USD_TO_LKR_RATE;

// Category definitions for Budget Tracker.
const CATEGORIES = [
  { key: "HOTEL",     label: "Hotels",     emoji: "🏨", color: "#1e3a5f" },
  { key: "VEHICLE",   label: "Vehicles",   emoji: "🚗", color: "#f59e0b" },
  { key: "GUIDE",     label: "Guides",     emoji: "👤", color: "#7c3aed" },
  { key: "ACTIVITY",  label: "Activities", emoji: "🎟️", color: "#059669" },
  { key: "FOOD",      label: "Food",       emoji: "🍜", color: "#e11d48" },
  { key: "TRANSPORT", label: "Transport",  emoji: "🚌", color: "#2563eb" },
  { key: "OTHER",     label: "Other",      emoji: "📦", color: "#6b7280" },
];

function isSameCategory(cat1, cat2) {
  if (cat1 === cat2) return true;
  if ((cat1 === "OTHER" || cat1 === "MISC") && (cat2 === "OTHER" || cat2 === "MISC")) return true;
  return false;
}

const catMeta = key =>
  CATEGORIES.find(c => isSameCategory(c.key, key)) || CATEGORIES[CATEGORIES.length - 1];

// Fixed default allocation percentages (must sum to 100%)
const DEFAULT_CATEGORY_PERCENTAGES = [
  { key: "HOTEL",     pct: 0.40 },
  { key: "VEHICLE",   pct: 0.20 },
  { key: "GUIDE",     pct: 0.00 },
  { key: "ACTIVITY",  pct: 0.10 },
  { key: "FOOD",      pct: 0.10 },
  { key: "TRANSPORT", pct: 0.10 },
  { key: "OTHER",     pct: 0.10 },
];

export function computeDefaultCategoryBudgets(totalBudget) {
  const tb = Math.max(0, Math.round(totalBudget || 0));
  if (tb === 0) {
    return Object.fromEntries(DEFAULT_CATEGORY_PERCENTAGES.map(c => [c.key, 0]));
  }

  const result = {};
  let currentSum = 0;

  DEFAULT_CATEGORY_PERCENTAGES.forEach(c => {
    const allocated = Math.round(tb * c.pct);
    result[c.key] = allocated;
    currentSum += allocated;
  });

  const remainder = tb - currentSum;
  if (remainder !== 0) {
    result["OTHER"] = (result["OTHER"] || 0) + remainder;
  }
  return result;
}

const DEMO_STATES = [
  { key: "ON_TRACK", label: "On Track",    hint: "(43% used)",    Icon: CheckCircle2 },
  { key: "WARNING",  label: "Warning",     hint: "(85% used)",    Icon: AlertTriangle },
  { key: "OVER",     label: "Over Budget", hint: "(110% used)",   Icon: AlertCircle },
  { key: "EMPTY",    label: "Empty",       hint: "(No expenses)", Icon: Plus },
];

// ── Demo data ──────────────────────────────────────────────
const AUTO_BASE = [
  { id: "a1", auto: true, category: "HOTEL",   title: "Cinnamon Grand Colombo",
    amount: 120, date: "Jun 4, 2026",   note: '"Day 1 — Colombo"', reference: "#VB-001" },
  { id: "a2", auto: true, category: "HOTEL",   title: "Taj Samudra Colombo",
    amount: 120, date: "Jun 5, 2026",   note: '"Day 2 — Colombo"' },
  { id: "a3", auto: true, category: "VEHICLE", title: "Colombo City Tuk-Tuk (3 days)",
    amount: 45,  date: "Jun 4–6, 2026", note: "Driver: Kamal Silva", reference: "#VB-002" },
  { id: "a4", auto: true, category: "VEHICLE", title: "Colombo City Van (1 day)",
    amount: 60,  date: "Jun 4, 2026",   note: "Driver: Nimal Perera" },
];

const GUIDE_AUTO = { id: "a5", auto: true, category: "GUIDE",
  title: "Wildlife Guide — Yala (2 days)", amount: 130,
  date: "Jun 7–8, 2026", note: "Guide: Ruwan Jayasuriya", reference: "#GB-014" };

const WARNING_MANUAL = [
  { id: "m1", auto: false, category: "ACTIVITY", title: "Sigiriya entrance tickets",
    amount: 60, date: "Jun 5, 2026", note: "2 adults" },
  { id: "m2", auto: false, category: "FOOD",       title: "Rice & curry lunches",
    amount: 75, date: "Jun 4–7, 2026" },
  { id: "m3", auto: false, category: "TRANSPORT",  title: "Ella scenic train tickets",
    amount: 40, date: "Jun 6, 2026" },
  { id: "m4", auto: false, category: "MISC",       title: "Souvenirs — Kandy market",
    amount: 30, date: "Jun 6, 2026" },
];

const OVER_MANUAL = [
  ...WARNING_MANUAL,
  { id: "m5", auto: false, category: "ACTIVITY", title: "Ayurveda spa afternoon",
    amount: 95,  date: "Jun 7, 2026" },
  { id: "m6", auto: false, category: "FOOD",       title: "Seafood dinner — Mirissa",
    amount: 45,  date: "Jun 7, 2026" },
  { id: "m7", auto: false, category: "MISC",       title: "Extra gifts & tips",
    amount: 60,  date: "Jun 8, 2026" },
];

const DEMO_EXPENSES = {
  EMPTY:    [],
  ON_TRACK: AUTO_BASE,
  WARNING:  [...AUTO_BASE, GUIDE_AUTO, ...WARNING_MANUAL],
  OVER:     [...AUTO_BASE, GUIDE_AUTO, ...OVER_MANUAL],
};

const DEMO_DAILY = {
  EMPTY:    [0, 0, 0, 0, 0, 0, 0],
  ON_TRACK: [52, 40, 56, 45, 41, 50, 61],
  WARNING:  [102, 79, 110, 89, 81, 99, 120],
  OVER:     [130, 102, 143, 115, 105, 128, 157],
};

const money = v => `$${v.toFixed(2)}`;
const lkr = v => `Rs. ${(v * LKR_RATE).toLocaleString()}`;

function countDays(start, end) {
  if (!start || !end) return 7;
  return Math.round(Math.abs(new Date(end) - new Date(start)) / 86400000) + 1;
}

// Backend dates are ISO (yyyy-MM-dd); demo dates are already display
// strings like "Jun 4–6, 2026" — format the former, pass the latter through.
function formatItemDate(d) {
  if (!d) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    return new Date(d).toLocaleDateString("en-US",
      { month: "short", day: "numeric", year: "numeric" });
  }
  return d;
}

// Maps a backend BudgetItemResponse to the UI's expense shape.
function mapApiItem(item) {
  return {
    id: item.id,
    auto: !!item.autoAdded,
    category: item.category,
    title: item.title,
    amount: item.amount,
    date: item.date,
    note: item.notes,
    reference: item.referenceId,
  };
}

// ── Donut chart (pure SVG, no chart lib) ───────────────────
function CategoryDonut({ perCategory, totalSpent }) {
  const R = 70, STROKE = 30;
  const C = 2 * Math.PI * R;

  const segments = perCategory
    .filter(c => c.spent > 0)
    .reduce((acc, c) => {
      const frac = totalSpent > 0 ? c.spent / totalSpent : 0;
      const dash = frac * C;
      acc.segments.push({ color: c.color, dash, offset: acc.offset });
      return { segments: acc.segments, offset: acc.offset + dash };
    }, { segments: [], offset: 0 }).segments;

  return (
    <div className="relative w-48 h-48 flex-shrink-0">
      <svg viewBox="0 0 180 180" className="w-full h-full -rotate-90">
        <circle cx="90" cy="90" r={R} fill="none"
          stroke="#f3f4f6" strokeWidth={STROKE} />
        {segments.map((s, i) => (
          <circle key={i} cx="90" cy="90" r={R} fill="none"
            stroke={s.color} strokeWidth={STROKE}
            strokeDasharray={`${s.dash} ${C - s.dash}`}
            strokeDashoffset={-s.offset} />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-gray-900">{money(totalSpent)}</span>
        <span className="text-2xs text-gray-400">Total Spent</span>
      </div>
    </div>
  );
}

// ── Daily bar chart (pure divs) ────────────────────────────
function DailyBarChart({ daily }) {
  const max = Math.max(...daily, 1);
  const niceMax = Math.ceil(max / 20) * 20 || 20;
  const ticks = [1, 0.75, 0.5, 0.25, 0];

  return (
    <div className="flex gap-3">
      <div className="h-40 flex flex-col justify-between text-3xs
                      text-gray-400">
        {ticks.map(t => <span key={t}>${Math.round(niceMax * t)}</span>)}
      </div>
      {/* Fixed-height row so each column's percentage-height bar has a
          definite height to resolve against (justify-end anchors bars
          to the baseline). */}
      <div className="flex-1 flex gap-2 h-40 border-b border-gray-100">
        {daily.map((v, i) => (
          <div key={i}
            className="flex-1 h-full flex flex-col justify-end items-center">
            <div className="w-full max-w-[48px] bg-[#1e3a5f] rounded-t
                            transition-all"
              style={{ height: `${Math.max((v / niceMax) * 100, v > 0 ? 2 : 0)}%` }}
              title={`Day ${i + 1}: ${money(v)}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Add-expense inline form ────────────────────────────────
function ExpenseForm({ trip, presetCategory, onSave, onCancel }) {
  const [category, setCategory] = useState(presetCategory || "");
  const [title, setTitle]       = useState("");
  const [amount, setAmount]     = useState("");
  // Default to the trip's first day, not today's real-world date — an
  // expense dated outside the trip's range would silently disappear
  // from the Daily Spending Breakdown chart.
  const [date, setDate] = useState(
    trip?.startDate || new Date().toISOString().slice(0, 10));
  const [tripDayId, setTripDayId] = useState("");
  const [notes, setNotes]       = useState("");

  const valid = category && title.trim() && parseFloat(amount) > 0;

  function handleTripDayChange(id) {
    setTripDayId(id);
    const day = (trip?.days || []).find(d => String(d.id) === id);
    if (day?.date) setDate(day.date);
  }

  function handleSave() {
    if (!valid) return;
    const day = (trip?.days || []).find(d => String(d.id) === tripDayId);
    const dayLabel = day
      ? `Day ${day.dayNumber}${day.region ? ` — ${day.region}` : ""}`
      : "";
    onSave({
      category,
      title: title.trim(),
      amount: parseFloat(amount),
      dateIso: date,
      notes: [dayLabel, notes.trim()].filter(Boolean).join(" · ") || null,
    });
  }

  return (
    <div className="border border-gray-200 rounded-2xl p-4 mb-3 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-bold text-gray-800">+ Add Manual Expense</p>
        <button onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
      </div>

      <p className="text-xs font-semibold text-gray-600 mb-1.5">
        Category <span className="text-red-500">*</span>
      </p>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {CATEGORIES.map(c => (
          <button key={c.key} onClick={() => setCategory(c.key)}
            className={`px-2.5 py-1.5 rounded-full border text-xs font-semibold
                        transition-colors
                        ${category === c.key
                          ? "bg-orange-400 border-orange-400 text-white"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      <p className="text-xs font-semibold text-gray-600 mb-1.5">
        Item Title <span className="text-red-500">*</span>
      </p>
      <input type="text" value={title} onChange={e => setTitle(e.target.value)}
        placeholder="e.g. Rice and curry lunch — Kandy"
        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm
                   outline-none focus:border-green-700 mb-3" />

      <p className="text-xs font-semibold text-gray-600 mb-1.5">
        Amount <span className="text-red-500">*</span>
      </p>
      <div className="flex gap-2 mb-3">
        <div className="flex-1 flex items-center border border-gray-200
                        rounded-xl px-3">
          <span className="text-sm text-gray-400">$</span>
          <input type="number" min="0" value={amount}
            onChange={e => setAmount(e.target.value)} placeholder="0.00"
            className="w-full px-2 py-2 text-sm outline-none" />
        </div>
        <span className="flex items-center px-3 border border-gray-200
                         rounded-xl text-xs font-semibold text-gray-500">USD</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-1.5">Date</p>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="w-full min-w-0 max-w-full border border-gray-200 rounded-xl px-3 py-2
                       text-sm outline-none focus:border-green-700" />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-1.5">Trip Day</p>
          <select value={tripDayId} onChange={e => handleTripDayChange(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2
                       text-sm outline-none bg-white">
            <option value="">Select day...</option>
            {(trip?.days || []).map(d => (
              <option key={d.id} value={d.id}>
                Day {d.dayNumber}{d.region ? ` — ${d.region}` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-xs font-semibold text-gray-600 mb-1.5">
        Notes <span className="text-gray-400 font-normal">(optional)</span>
      </p>
      <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)}
        placeholder="Local restaurant near temple..."
        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm
                   outline-none focus:border-green-700 resize-none mb-4" />

      <div className="flex gap-2">
        <button onClick={onCancel}
          className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm
                     text-gray-600 hover:bg-gray-50">Cancel</button>
        <button onClick={handleSave} disabled={!valid}
          className="flex-1 py-2.5 bg-green-800 hover:bg-green-900 text-white
                     rounded-xl text-sm font-semibold disabled:opacity-50">
          Save Expense →
        </button>
      </div>
    </div>
  );
}

// ── Single expense row ─────────────────────────────────────
function ExpenseRow({ e, onDelete }) {
  const meta = catMeta(e.category);
  return (
    <div className="border border-gray-200 rounded-xl p-3 bg-white">
      <div className="flex items-start gap-2.5">
        <span className="text-xl flex-shrink-0">{meta.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
            {e.auto && (
              <span className="inline-flex items-center gap-0.5 bg-blue-500
                               text-white text-3xs font-bold px-1.5 py-0.5
                               rounded">
                <RefreshCw size={8} /> AUTO
              </span>
            )}
            <span className="text-3xs font-semibold px-1.5 py-0.5 rounded
                             bg-gray-100" style={{ color: meta.color }}>
              {meta.emoji} {meta.label}
            </span>
          </div>
          <p className="text-sm font-semibold text-gray-800 truncate">{e.title}</p>
          <p className="text-2xs text-gray-400">{formatItemDate(e.date)}</p>
          {e.note && <p className="text-2xs text-gray-400">{e.note}</p>}
          {e.reference && (
            <p className="text-3xs text-gray-400 font-mono">Ref: {e.reference}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <span className="text-sm font-bold text-gray-800">{money(e.amount)}</span>
          <div className="flex gap-1">
            <button className="w-6 h-6 flex items-center justify-center rounded
                               text-gray-400 hover:bg-gray-100"
              title="Edit (demo)">
              <Pencil size={12} />
            </button>
            <button onClick={() => onDelete(e.id)}
              className="w-6 h-6 flex items-center justify-center rounded
                         text-gray-400 hover:bg-red-50 hover:text-red-500"
              title="Delete">
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────
export default function BudgetTracker({ trip, onBudgetChange }) {
  const [mode, setMode]             = useState("LIVE");
  const [budgetId, setBudgetId]     = useState(null);
  const [loadingLive, setLoadingLive] = useState(true);
  const [expenses, setExpenses]     = useState([]);
  const [totalBudget, setTotalBudget] = useState(800);
  const [categoryBudgets, setCategoryBudgets] = useState({});
  const [editingAllocations, setEditingAllocations] = useState(null);
  const [showForm, setShowForm]     = useState(false);
  const [presetCategory, setPresetCategory] = useState(null);
  const [filterCat, setFilterCat]   = useState("");
  const [search, setSearch]         = useState("");
  const [copied, setCopied]         = useState(false);
  const expensePanelRef = useRef(null);

  // Sync Bookings modal state
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncableBookings, setSyncableBookings] = useState([]);
  const [loadingSyncable, setLoadingSyncable] = useState(false);
  const [syncingId, setSyncingId] = useState(null);
  const [syncError, setSyncError] = useState(null);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState(null);

  const isLive = mode === "LIVE";
  const tripDays = countDays(trip?.startDate, trip?.endDate);
  const tripTitle = trip?.title || "Sri Lanka Adventure";

  // Sensible default when the trip has no budget yet: the AI-estimated
  // trip cost (sum of per-day estimates) if present, else $500.
  const defaultBudget = useMemo(() => {
    const estimated = (trip?.days || [])
      .reduce((s, d) => s + (d.estimatedDayCost || 0), 0);
    return estimated > 0 ? Math.round(estimated) : 500;
  }, [trip]);

  async function loadLive() {
    if (!trip?.id) {
      setLoadingLive(false);
      return;
    }
    setLoadingLive(true);
    try {
      const budget = await budgetService.getBudgetByTrip(trip.id);
      setBudgetId(budget?.id || null);
      setTotalBudget(budget?.totalBudget ?? defaultBudget);
      setExpenses((budget?.items || []).map(mapApiItem));

      const loadedCategoryBudgets = budget?.categoryBudgets || {};
      const hasCustomCategoryBudgets = Object.keys(loadedCategoryBudgets).length > 0;
      if (hasCustomCategoryBudgets) {
        if (loadedCategoryBudgets.MISC !== undefined && loadedCategoryBudgets.OTHER === undefined) {
          loadedCategoryBudgets.OTHER = loadedCategoryBudgets.MISC;
        }
        if (loadedCategoryBudgets.OTHER !== undefined && loadedCategoryBudgets.MISC === undefined) {
          loadedCategoryBudgets.MISC = loadedCategoryBudgets.OTHER;
        }
      }
      setCategoryBudgets(
        hasCustomCategoryBudgets
          ? loadedCategoryBudgets
          : computeDefaultCategoryBudgets(budget?.totalBudget ?? defaultBudget)
      );
      onBudgetChange?.(budget?.totalBudget);
    } catch {
      // No budget created for this trip yet — show the empty state.
      setBudgetId(null);
      setTotalBudget(defaultBudget);
      setExpenses([]);
      setCategoryBudgets(computeDefaultCategoryBudgets(defaultBudget));
      onBudgetChange?.(null);
    } finally {
      setLoadingLive(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting form/loading state when the trip or mode changes; not derivable at render time
    setShowForm(false);
    if (isLive) {
      if (trip?.id) loadLive();
      else setLoadingLive(false);
    } else {
      setExpenses(DEMO_EXPENSES[mode] || []);
      setTotalBudget(800);
      setCategoryBudgets(computeDefaultCategoryBudgets(800));
      setLoadingLive(false);
    }
    setEditingAllocations(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, trip?.id]);

  // Creates the trip's budget on first use (first expense / edit / sync).
  async function ensureBudget() {
    if (budgetId) return budgetId;
    if (!trip?.id) return null;
    const created = await budgetService.createBudget(
      trip.id, totalBudget, "USD");
    setBudgetId(created.id);
    onBudgetChange?.(created.totalBudget);
    return created.id;
  }

  const totalSpent = useMemo(
    () => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);
  const autoSpent   = expenses.filter(e => e.auto).reduce((s, e) => s + e.amount, 0);
  const manualSpent = totalSpent - autoSpent;
  const remaining   = totalBudget - totalSpent;
  const pctUsed     = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const dailyAvg    = tripDays > 0 ? totalSpent / tripDays : 0;

  const perCategory = CATEGORIES.map(c => {
    const bVal = categoryBudgets[c.key] ?? (isSameCategory(c.key, "OTHER") ? (categoryBudgets["OTHER"] ?? categoryBudgets["MISC"] ?? 0) : 0);
    return {
      ...c,
      budget: bVal,
      spent: expenses.filter(e => isSameCategory(e.category, c.key))
                     .reduce((s, e) => s + e.amount, 0),
    };
  });

  // Live mode: bucket real expenses into trip days. Prefer the "Day N"
  // the traveler tagged the expense with (stored in notes) since that's
  // the most reliable signal; fall back to the calendar date's offset
  // from the trip start. Items we can't place (no day tag and a date
  // outside the trip window) are pooled into an "unscheduled" bucket so
  // their spend is still visible rather than silently vanishing.
  const { daily, unscheduledSpend } = useMemo(() => {
    if (!isLive) {
      return { daily: DEMO_DAILY[mode] || DEMO_DAILY.EMPTY, unscheduledSpend: 0 };
    }
    const buckets = Array(tripDays).fill(0);
    let unscheduled = 0;
    const start = trip?.startDate ? new Date(trip.startDate) : null;

    expenses.forEach(e => {
      let idx = null;

      const dayMatch = e.note && e.note.match(/\bDay\s+(\d+)\b/);
      if (dayMatch) {
        const n = parseInt(dayMatch[1], 10) - 1;
        if (n >= 0 && n < tripDays) idx = n;
      }

      if (idx === null && start && e.date && /^\d{4}-\d{2}-\d{2}$/.test(e.date)) {
        const diff = Math.round((new Date(e.date) - start) / 86400000);
        if (diff >= 0 && diff < tripDays) idx = diff;
      }

      if (idx === null) unscheduled += e.amount;
      else buckets[idx] += e.amount;
    });

    return { daily: buckets, unscheduledSpend: unscheduled };
  }, [isLive, mode, expenses, tripDays, trip]);

  // Live mismatch calculation when editing or viewing Category Summary
  const budgetMismatchInfo = useMemo(() => {
    let currentSum = 0;
    if (editingAllocations) {
      const keys = ["HOTEL", "VEHICLE", "GUIDE", "ACTIVITY", "FOOD", "TRANSPORT", "OTHER"];
      currentSum = keys.reduce((s, k) => {
        const val = parseFloat(editingAllocations[k]);
        return s + (Number.isNaN(val) || val < 0 ? 0 : val);
      }, 0);
    } else {
      currentSum = perCategory.reduce((s, c) => s + c.budget, 0);
    }

    const diff = Math.abs(currentSum - totalBudget);
    if (diff <= 0.01) return null;

    if (currentSum < totalBudget) {
      return {
        type: "UNDER",
        sum: currentSum,
        diff,
        message: `Category budgets total ${money(currentSum)}, which is ${money(diff)} less than your Total Budget (${money(totalBudget)}).`,
      };
    } else {
      return {
        type: "OVER",
        sum: currentSum,
        diff,
        message: `Category budgets total ${money(currentSum)}, which is ${money(diff)} more than your Total Budget (${money(totalBudget)}).`,
      };
    }
  }, [editingAllocations, perCategory, totalBudget]);

  const level = pctUsed > 100 ? "OVER" : pctUsed >= 80 ? "WARNING" : "ON_TRACK";

  // Demo assumption: the trip is halfway through, so insights can talk
  // about "remaining days" until real per-day expense dates are wired in.
  const remainingDays = Math.max(1, Math.ceil(tripDays / 2));
  const bookingsSpent = perCategory
    .filter(c => c.key === "HOTEL" || c.key === "VEHICLE")
    .reduce((s, c) => s + c.spent, 0);
  const bookingsPct = totalSpent > 0
    ? Math.round((bookingsSpent / totalSpent) * 100) : 0;
  const barGradient = {
    ON_TRACK: "linear-gradient(90deg, #15803d, #2563eb)",
    WARNING:  "linear-gradient(90deg, #d97706, #f59e0b)",
    OVER:     "linear-gradient(90deg, #dc2626, #ef4444)",
  }[level];

  const visibleExpenses = expenses.filter(e =>
    (!filterCat || e.category === filterCat) &&
    (!search || e.title.toLowerCase().includes(search.toLowerCase()))
  );
  const autoList   = visibleExpenses.filter(e => e.auto);
  const manualList = visibleExpenses.filter(e => !e.auto);

  async function handleDelete(id) {
    if (isLive) {
      try {
        await budgetService.deleteItem(budgetId, id);
      } catch {
        alert("Failed to delete expense");
        return;
      }
    }
    setExpenses(prev => prev.filter(e => e.id !== id));
  }

  async function handleSaveExpense(form) {
    if (isLive) {
      try {
        const id = await ensureBudget();
        const saved = await budgetService.addItem(id, {
          category: form.category,
          title: form.title,
          amount: form.amount,
          currency: "USD",
          date: form.dateIso,
          notes: form.notes,
        });
        setExpenses(prev => [...prev, mapApiItem(saved)]);
      } catch {
        alert("Failed to save expense");
        return;
      }
    } else {
      setExpenses(prev => [...prev, {
        id: `m${Date.now()}`,
        auto: false,
        category: form.category,
        title: form.title,
        amount: form.amount,
        date: form.dateIso,
        note: form.notes || undefined,
      }]);
    }
    setShowForm(false);
    setPresetCategory(null);
  }

  function openForm(category = null) {
    setPresetCategory(category);
    setShowForm(true);
  }

  async function handleEditBudget() {
    const v = window.prompt("Total budget (USD):", String(totalBudget));
    const n = parseFloat(v);
    if (Number.isNaN(n) || n <= 0) return;
    if (isLive) {
      try {
        if (budgetId) {
          await budgetService.updateBudget(budgetId, n);
        } else {
          const created = await budgetService.createBudget(trip.id, n, "USD");
          setBudgetId(created.id);
        }
      } catch {
        alert("Failed to update budget");
        return;
      }
      onBudgetChange?.(n);
    }
    setTotalBudget(n);
    setCategoryBudgets(prev => {
      const hasCustom = prev && Object.values(prev).some(v => v > 0);
      return hasCustom ? prev : computeDefaultCategoryBudgets(n);
    });
  }

  function startEditAllocations() {
    setEditingAllocations(Object.fromEntries(
      CATEGORIES.map(c => {
        const val = categoryBudgets[c.key] ?? (isSameCategory(c.key, "OTHER") ? (categoryBudgets["OTHER"] ?? categoryBudgets["MISC"] ?? 0) : 0);
        return [c.key, String(val)];
      })
    ));
  }

  async function saveAllocations() {
    const uiParsed = {};
    const apiPayload = {};

    for (const [key, value] of Object.entries(editingAllocations || {})) {
      const n = parseFloat(value);
      const val = Number.isNaN(n) || n < 0 ? 0 : n;

      uiParsed[key] = val;
      if (key === "OTHER") uiParsed["MISC"] = val;
      if (key === "MISC") uiParsed["OTHER"] = val;

      const apiKey = (key === "OTHER" || key === "MISC") ? "MISC" : key;
      apiPayload[apiKey] = val;
    }

    if (isLive) {
      try {
        const id = await ensureBudget();
        await budgetService.updateCategoryBudgets(id, apiPayload);
      } catch {
        alert("Failed to save category budgets");
        return;
      }
    }
    setCategoryBudgets(uiParsed);
    setEditingAllocations(null);
  }

  // ── Sync Bookings Handlers ──────────────────────────────
  async function handleOpenSyncModal() {
    if (!isLive) {
      setMode("ON_TRACK");
      return;
    }
    if (!trip?.id) return;
    setShowSyncModal(true);
    setLoadingSyncable(true);
    setSyncError(null);
    setSyncSuccessMsg(null);
    try {
      await ensureBudget();
      const data = await budgetService.getSyncableBookings(trip.id);
      setSyncableBookings(data || []);
    } catch (err) {
      console.error("Failed to load syncable bookings:", err);
      setSyncError(err?.response?.data?.message || err?.message || "Failed to load bookings");
    } finally {
      setLoadingSyncable(false);
    }
  }

  async function handleSyncBookings() {
    await handleOpenSyncModal();
  }

  async function handleSyncSingleBooking(booking) {
    if (!trip?.id || !booking) return;
    setSyncingId(booking.bookingId);
    setSyncError(null);
    try {
      await budgetService.syncBookingToBudget(trip.id, booking.bookingType, booking.bookingId);
      await loadLive();
      setSyncableBookings(prev => prev.map(b => 
        (b.bookingId === booking.bookingId && b.bookingType === booking.bookingType)
          ? { ...b, isSynced: true }
          : b
      ));
      setSyncSuccessMsg(`Synced ${booking.providerName} to budget!`);
      setTimeout(() => setSyncSuccessMsg(null), 3000);
    } catch (err) {
      console.error("Failed to sync booking:", err);
      setSyncError(err?.response?.data?.message || err?.message || "Failed to sync booking");
    } finally {
      setSyncingId(null);
    }
  }

  async function handleSyncAll() {
    if (!trip?.id) return;
    const unsynced = syncableBookings.filter(b => !b.isSynced);
    if (unsynced.length === 0) return;

    setSyncingId("ALL");
    setSyncError(null);
    try {
      for (const b of unsynced) {
        await budgetService.syncBookingToBudget(trip.id, b.bookingType, b.bookingId);
      }
      await loadLive();
      setSyncableBookings(prev => prev.map(b => ({ ...b, isSynced: true })));
      setSyncSuccessMsg(`Successfully synced ${unsynced.length} booking(s) to budget!`);
      setTimeout(() => setSyncSuccessMsg(null), 3500);
    } catch (err) {
      console.error("Failed to sync all bookings:", err);
      setSyncError(err?.response?.data?.message || err?.message || "Failed to sync all bookings");
    } finally {
      setSyncingId(null);
    }
  }
  function scrollToExpenses() {
    setFilterCat("");
    setSearch("");
    expensePanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function handleCopySummary() {
    const lines = [
      `Budget summary — ${tripTitle}`,
      `Total budget: ${money(totalBudget)} | Spent: ${money(totalSpent)} | Remaining: ${money(remaining)}`,
      ...perCategory.filter(c => c.spent > 0)
        .map(c => `${c.label}: ${money(c.spent)}`),
    ];
    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // Triggers a direct PDF binary file download (.pdf blob) using jsPDF
  // with Phase 1 normalized currency utilities, financial summary cards,
  // category breakdown, daily spending reconciliation, repeating table headers,
  // and complete pop-up blocker independence.
  function handleExportPdf() {
    downloadBudgetPdf({
      trip,
      tripTitle,
      totalBudget,
      totalSpent,
      remaining,
      dailyAvg,
      level,
      pctUsed,
      perCategory,
      daily,
      unscheduledSpend,
      expenses,
      tripDays,
    });
  }

  // ── Data source bar (live + demo previews) ───────────────
  // Internal design-preview tool — hidden from travelers. Only rendered
  // when the page URL carries ?budgetDemo (e.g. /trips/12?budgetDemo).
  const showDemoBar = new URLSearchParams(window.location.search)
    .has("budgetDemo");
  const demoBar = showDemoBar && (
    <div className="flex items-center gap-2 flex-wrap mb-6">
      <button onClick={() => setMode("LIVE")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border
                    text-xs font-semibold transition-colors
                    ${isLive
                      ? "bg-green-800 border-green-800 text-white"
                      : "border-gray-200 text-gray-600 bg-white hover:border-gray-300"}`}>
        <Database size={12} /> Live Data
      </button>
      <span className="text-xs text-gray-400 ml-1">Demo:</span>
      {DEMO_STATES.map(s => (
        <button key={s.key} onClick={() => setMode(s.key)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border
                      text-xs font-semibold transition-colors
                      ${mode === s.key
                        ? "bg-green-800 border-green-800 text-white"
                        : "border-gray-200 text-gray-600 bg-white hover:border-gray-300"}`}>
          <s.Icon size={12} /> {s.label}
          <span className={`font-normal
            ${mode === s.key ? "text-green-100" : "text-gray-400"}`}>
            {s.hint}
          </span>
        </button>
      ))}
    </div>
  );

  // ── Loading (live fetch) ─────────────────────────────────
  if (loadingLive) {
    return (
      <div>
        {demoBar}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm
                        flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-4 border-green-100 border-t-green-700
                          rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading budget...</p>
        </div>
      </div>
    );
  }

  // ── Empty state ──────────────────────────────────────────
  if (expenses.length === 0 && !showForm) {
    return (
      <div>
        {demoBar}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm
                        overflow-hidden">
          <div className="bg-gradient-to-b from-green-50/40 to-white text-center
                          px-6 py-14">
            <div className="text-5xl mb-4">💰</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Start Tracking Your Budget
            </h2>
            <p className="text-sm text-gray-500 max-w-md mx-auto mb-5">
              No expenses logged yet. Add your first expense to start tracking
              your <span className="font-semibold text-green-800">{tripTitle}</span>.
            </p>
            <div className="inline-flex items-center gap-2 bg-white border
                            border-gray-200 rounded-full px-5 py-2.5 shadow-sm">
              <span className="text-sm font-semibold text-gray-700">Total Budget:</span>
              <span className="text-sm font-bold text-green-800">{money(totalBudget)}</span>
              <span className="text-xs text-gray-400">for {tripDays} days</span>
              <button onClick={handleEditBudget}
                className="text-xs text-green-800 underline ml-1">edit</button>
            </div>
          </div>

          <div className="px-6 pb-8">
            <p className="text-sm font-bold text-gray-800 mb-3">
              How budget tracking works
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              {[
                { Icon: RefreshCw, color: "bg-blue-50 text-blue-600",
                  title: "Auto-sync bookings",
                  desc: "Vehicles & hotels are auto-added from your bookings" },
                { Icon: Pencil, color: "bg-orange-50 text-orange-500",
                  title: "Log daily expenses",
                  desc: "Track food, activities, transport & more" },
                { Icon: BarChart3, color: "bg-purple-50 text-purple-600",
                  title: "See real-time insights",
                  desc: "Get warnings before you overspend" },
                { Icon: ArrowLeftRight, color: "bg-cyan-50 text-cyan-600",
                  title: "Multi-currency support",
                  desc: `View in USD, LKR, EUR or GBP. 1 USD = ${LKR_RATE} LKR` },
              ].map(f => (
                <div key={f.title}
                  className="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
                  <div className={`w-9 h-9 rounded-xl flex items-center
                                   justify-center flex-shrink-0 ${f.color}`}>
                    <f.Icon size={17} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{f.title}</p>
                    <p className="text-xs text-gray-500">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 flex-wrap mb-5">
              <button onClick={() => openForm()}
                className="flex-1 min-w-[220px] flex items-center justify-center
                           gap-1.5 py-3.5 bg-green-800 hover:bg-green-900
                           text-white rounded-xl text-sm font-bold
                           transition-colors">
                <Plus size={16} /> Add First Expense
              </button>
              <button onClick={handleSyncBookings}
                className="flex items-center gap-1.5 px-6 py-3.5 border
                           border-green-700 text-green-800 rounded-xl text-sm
                           font-bold hover:bg-green-50 transition-colors">
                <RefreshCw size={15} /> Sync Bookings
              </button>
            </div>

            <p className="text-xs text-gray-400 text-center mb-3">
              What you can track:
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {CATEGORIES.filter(c => c.budget > 0).map(c => (
                <span key={c.key}
                  className="inline-flex items-center gap-1.5 border
                             border-gray-200 rounded-full px-3 py-1 text-xs
                             text-gray-600 bg-white">
                  <span className="w-2 h-2 rounded-full"
                        style={{ background: c.color }} />
                  {c.emoji} {c.label}
                  <span className="text-gray-400">· {money(c.budget)}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Full tracker ─────────────────────────────────────────
  const statusBanner = {
    ON_TRACK: {
      wrap: "bg-green-50 border-green-200", Icon: CheckCircle2,
      iconColor: "text-green-600",
      title: "✅ ON TRACK — Great job!",
      titleColor: "text-green-800",
      body: `You're spending wisely! At this rate you'll finish ${money(Math.max(remaining, 0))} under budget.`,
      tip: "Consider adding a hidden gem day trip — avg cost $25.00",
    },
    WARNING: {
      wrap: "bg-yellow-50 border-yellow-200", Icon: AlertTriangle,
      iconColor: "text-yellow-600",
      title: `⚠️ WARNING — ${pctUsed.toFixed(0)}% of budget used`,
      titleColor: "text-yellow-800",
      body: `Only ${money(Math.max(remaining, 0))} left. Consider lower-cost dining and free attractions for the remaining days.`,
      tip: "Tip: hidden gems are usually free to visit",
    },
    OVER: {
      wrap: "bg-red-50 border-red-200", Icon: AlertCircle,
      iconColor: "text-red-600",
      title: `🚨 OVER BUDGET — ${money(Math.abs(remaining))} over`,
      titleColor: "text-red-800",
      body: "You've exceeded your budget. Review recent expenses or increase your total budget.",
      tip: "Tap Edit Budget to adjust your target",
    },
  }[level];

  return (
    <div>
      {demoBar}

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
          <p className="text-2xl font-bold text-green-800">{money(totalBudget)}</p>
          <p className="text-xs text-gray-400 mb-1.5">Total Budget</p>
          <button onClick={handleEditBudget}
            className="inline-flex items-center gap-1 text-2xs font-semibold
                       text-green-800 hover:underline">
            <Pencil size={10} /> Edit Budget
          </button>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
          <p className="text-2xl font-bold text-gray-900">{money(totalSpent)}</p>
          <p className="text-xs text-gray-400">Total Spent</p>
          <p className="text-2xs text-gray-400 mt-1.5">{pctUsed.toFixed(1)}% used</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
          <p className={`text-2xl font-bold
              ${remaining < 0 ? "text-red-600" : "text-gray-900"}`}>
            {money(remaining)}
          </p>
          <p className="text-xs text-gray-400">Remaining</p>
          <p className={`text-2xs mt-1.5
              ${remaining < 0 ? "text-red-500" : "text-green-700"}`}>
            {remaining < 0 ? "over budget" : `${(100 - pctUsed).toFixed(1)}% left`}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-yellow-200 p-4 shadow-sm">
          <p className="text-2xl font-bold text-orange-500">{money(dailyAvg)}</p>
          <p className="text-xs text-gray-400">Daily Average</p>
          <p className="text-2xs text-gray-400 mt-1.5">{tripDays} days total</p>
        </div>
      </div>

      {/* Progress + status */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm mb-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-bold text-gray-800">
            Budget Used: {money(totalSpent)} of {money(totalBudget)}
          </p>
          <span className={`text-sm font-bold
              ${level === "OVER" ? "text-red-600"
                : level === "WARNING" ? "text-yellow-700" : "text-green-800"}`}>
            {pctUsed.toFixed(1)}%
          </span>
        </div>
        <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden mb-1">
          <div className="h-full rounded-full transition-all"
            style={{ width: `${Math.min(pctUsed, 100)}%`, background: barGradient }} />
        </div>
        <div className="relative h-5 text-3xs text-gray-400">
          <span className="absolute" style={{ left: "25%" }}>25%</span>
          <span className="absolute" style={{ left: "50%" }}>50%</span>
          <span className="absolute text-yellow-600 font-semibold"
            style={{ left: "80%" }}>▲ 80%</span>
          <span className="absolute text-red-500 font-semibold right-0">100%</span>
        </div>

        <div className={`mt-3 border rounded-xl px-4 py-3 flex gap-3
                         ${statusBanner.wrap}`}>
          <statusBanner.Icon size={18}
            className={`${statusBanner.iconColor} flex-shrink-0 mt-0.5`} />
          <div>
            <p className={`text-sm font-bold ${statusBanner.titleColor}`}>
              {statusBanner.title}
            </p>
            <p className="text-xs text-gray-600 mt-0.5">{statusBanner.body}</p>
            <p className="text-2xs text-gray-500 mt-1">
              <Lightbulb size={10} className="inline mr-1" />{statusBanner.tip}
            </p>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
        {/* Left column */}
        <div className="space-y-5 min-w-0">

          {/* Category donut */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <p className="text-sm font-bold text-gray-800 mb-4">
              Spending Breakdown by Category
            </p>
            <div className="flex items-center gap-6 flex-wrap">
              <CategoryDonut perCategory={perCategory} totalSpent={totalSpent} />
              <div className="flex-1 min-w-[220px] space-y-2">
                {perCategory.map(c => {
                  const pct = totalSpent > 0 ? (c.spent / totalSpent) * 100 : 0;
                  return (
                    <div key={c.key} className="flex items-center gap-2 text-xs">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ background: c.color }} />
                      <span className="text-gray-600 flex-1">
                        {c.emoji} {c.label}
                      </span>
                      <span className="font-bold text-gray-800">{money(c.spent)}</span>
                      <span className="text-gray-400 w-12 text-right">
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Daily bar chart */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <p className="text-sm font-bold text-gray-800 mb-4">
              Daily Spending Breakdown
            </p>
            <DailyBarChart daily={daily.slice(0, tripDays)} />
            <div className="flex gap-2 mt-1 ml-10">
              {daily.slice(0, tripDays).map((_, i) => (
                <span key={i}
                  className="flex-1 text-center text-3xs text-gray-400">
                  Day {i + 1}
                </span>
              ))}
            </div>
            {unscheduledSpend > 0 && (
              <p className="text-2xs text-gray-400 mt-2">
                + {money(unscheduledSpend)} not tagged to a specific day.
                Pick a Trip Day when adding an expense to place it here.
              </p>
            )}
          </div>

          {/* Category summary table */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <p className="text-sm font-bold text-gray-800 mb-3">Category Summary</p>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-400 border-b border-gray-100">
                  <th className="text-left font-medium py-2">Category</th>
                  <th className="text-right font-medium py-2">Budgeted</th>
                  <th className="text-right font-medium py-2">Spent</th>
                  <th className="text-right font-medium py-2">Remaining</th>
                </tr>
              </thead>
              <tbody>
                {perCategory
                  .filter(c => editingAllocations || c.budget > 0 || c.spent > 0)
                  .map(c => {
                  const rem = c.budget - c.spent;
                  return (
                    <tr key={c.key} className="border-b border-gray-50">
                      <td className="py-2.5">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full"
                            style={{ background: c.color }} />
                          {c.emoji} {c.label}
                        </span>
                      </td>
                      <td className="text-right text-gray-500">
                        {editingAllocations ? (
                          <input type="number" min="0"
                            value={editingAllocations[c.key]}
                            onChange={e => setEditingAllocations(prev =>
                              ({ ...prev, [c.key]: e.target.value }))}
                            className="w-20 border border-gray-200 rounded-lg
                                       px-2 py-1 text-right text-xs outline-none
                                       focus:border-green-700" />
                        ) : money(c.budget)}
                      </td>
                      <td className="text-right font-semibold text-gray-800">
                        {money(c.spent)}
                      </td>
                      <td className={`text-right font-semibold
                          ${rem < 0 ? "text-red-600" : "text-green-700"}`}>
                        {money(rem)} {rem >= 0 ? "✅" : "❌"}
                      </td>
                    </tr>
                  );
                })}
                <tr className="font-bold text-gray-900">
                  <td className="py-2.5">Total</td>
                  <td className="text-right">{money(totalBudget)}</td>
                  <td className="text-right">{money(totalSpent)}</td>
                  <td className={`text-right
                      ${remaining < 0 ? "text-red-600" : "text-green-700"}`}>
                    {money(remaining)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Soft non-blocking warning when category budgets sum does not equal Total Budget */}
            {budgetMismatchInfo && (
              <div className="mt-3 flex items-start gap-2.5 bg-amber-50 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-900 shadow-2xs">
                <AlertTriangle size={15} className="text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium leading-snug">{budgetMismatchInfo.message}</p>
                </div>
              </div>
            )}

            {editingAllocations ? (
              <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
                <p className="text-2xs text-gray-400">
                  Allocated:{" "}
                  <span className={budgetMismatchInfo ? "text-amber-700 font-semibold" : "text-gray-600 font-semibold"}>
                    {money(budgetMismatchInfo ? budgetMismatchInfo.sum : totalBudget)}
                  </span>
                  {" "}of {money(totalBudget)} total budget
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setEditingAllocations(null)}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg
                               text-xs text-gray-600 hover:bg-gray-50">
                    Cancel
                  </button>
                  <button onClick={saveAllocations}
                    className="px-3 py-1.5 bg-green-800 hover:bg-green-900
                               text-white rounded-lg text-xs font-semibold">
                    Save Budgets
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={startEditAllocations}
                className="mt-3 inline-flex items-center gap-1 text-xs
                           font-semibold text-green-800 hover:underline">
                <Plus size={12} /> Set Category Budget
              </button>
            )}
          </div>

          {/* Insights */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <p className="text-sm font-bold text-gray-800 mb-3">
              💡 Budget Insights
            </p>
            <div className="space-y-2.5">
              {level === "ON_TRACK" && (
                <>
                  <div className="flex items-start gap-2 bg-green-50 border
                                  border-green-200 rounded-xl px-3.5 py-2.5">
                    <CheckCircle2 size={14} className="text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-700">
                      <span className="font-bold">Hotels {perCategory[0].spent <= perCategory[0].budget ? "on track" : "over budget"}</span>
                      {" "}— {money(Math.abs(perCategory[0].budget - perCategory[0].spent))}{" "}
                      {perCategory[0].spent <= perCategory[0].budget ? "remaining in" : "over"} hotel budget
                    </p>
                  </div>
                  {perCategory.find(c => c.key === "GUIDE")?.spent === 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl
                                    px-3.5 py-2.5">
                      <div className="flex items-start gap-2">
                        <TrendingUp size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-gray-700">
                          <span className="font-bold">No guides booked yet.</span>
                          {" "}Budget $65.00/day for a wildlife guide near Yala.
                          <Link to="/guides"
                            className="block mt-1 font-semibold text-blue-700 underline">
                            Browse Guides →
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                  {perCategory.find(c => c.key === "FOOD")?.spent === 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl
                                    px-3.5 py-2.5">
                      <div className="flex items-start gap-2">
                        <AlertTriangle size={14} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-gray-700">
                          <span className="font-bold">Food budget untracked.</span>
                          {" "}Add meals to keep your budget accurate.
                          <button onClick={() => openForm("FOOD")}
                            className="block mt-1 font-semibold text-yellow-700 underline">
                            Add Food Expense →
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {level === "WARNING" && (
                <>
                  <div className="flex items-start gap-2 bg-yellow-50 border
                                  border-yellow-300 rounded-xl px-3.5 py-2.5">
                    <AlertTriangle size={14} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-gray-700">
                      <p className="font-bold text-yellow-800">
                        Approaching your budget limit ({pctUsed.toFixed(0)}% used)
                      </p>
                      <p className="mt-0.5">
                        You have {money(Math.max(remaining, 0))} left for the
                        remaining {remainingDays} days. Consider eating at local
                        restaurants to save $15.00/day.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 bg-blue-50 border
                                  border-blue-200 rounded-xl px-3.5 py-2.5">
                    <TrendingUp size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-700">
                      <span className="font-bold text-blue-800">Tip:</span>
                      {" "}Skip 1 activity ($30.00) and 2 restaurant dinners
                      ($40.00) to bring spending back under control.
                    </p>
                  </div>
                </>
              )}

              {level === "OVER" && (
                <>
                  <div className="flex items-start gap-2 bg-red-50 border
                                  border-red-200 rounded-xl px-3.5 py-2.5">
                    <Ban size={14} className="text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-gray-700">
                      <p className="font-bold text-red-700">
                        Budget exceeded by {money(Math.abs(remaining))}
                      </p>
                      <p className="mt-0.5">
                        Review hotel and vehicle bookings — they account
                        for {bookingsPct}% of total spend.
                      </p>
                      <button onClick={scrollToExpenses}
                        className="block mt-1 font-semibold text-red-700 underline">
                        Review Bookings →
                      </button>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 bg-yellow-50 border
                                  border-yellow-300 rounded-xl px-3.5 py-2.5">
                    <AlertTriangle size={14} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-700">
                      Consider swapping $60.00/night boutique hotels for
                      guesthouses to save $120.00 over remaining nights.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Quick convert + export */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <p className="text-sm font-bold text-gray-800 mb-3">
                💱 Quick Convert
              </p>
              {[100, 500, 1000].map(v => (
                <div key={v}
                  className="flex items-center justify-between text-xs py-1.5">
                  <span className="font-semibold text-gray-700">${v} USD</span>
                  <span className="text-gray-300">=</span>
                  <span className="font-bold text-gray-800">{lkr(v)}</span>
                </div>
              ))}
              <p className="text-3xs text-gray-400 mt-2">
                Rate: 1 USD = {LKR_RATE} LKR · Updated today
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <p className="text-sm font-bold text-gray-800 mb-3">📤 Export</p>
              <div className="space-y-2">
                <button onClick={handleExportPdf}
                  className="w-full flex items-center gap-2 text-xs text-gray-600
                             hover:text-green-800 py-1.5">
                  <Download size={13} /> Export PDF Report
                </button>
                <button onClick={handleCopySummary}
                  className="w-full flex items-center gap-2 text-xs text-gray-600
                             hover:text-green-800 py-1.5">
                  <Copy size={13} /> {copied ? "Copied!" : "Copy Summary"}
                </button>
                <button onClick={() => alert("Demo: share coming soon")}
                  className="w-full flex items-center gap-2 text-xs text-gray-600
                             hover:text-green-800 py-1.5">
                  <Share2 size={13} /> Share Budget
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: expense items */}
        <div ref={expensePanelRef}
             className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm
                        h-fit">
          <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
            <p className="text-sm font-bold text-gray-800">Expense Items</p>
            <div className="flex items-center gap-2">
              {isLive && (
                <button onClick={handleSyncBookings}
                  title="Refresh from bookings and fix any auto-added item dates"
                  className="flex items-center gap-1 px-2.5 py-1.5 border
                             border-gray-200 rounded-full text-xs font-semibold
                             text-gray-600 hover:bg-gray-50 transition-colors">
                  <RefreshCw size={12} /> Sync
                </button>
              )}
              <button onClick={() => openForm()}
                className="flex items-center gap-1 px-3 py-1.5 bg-green-800
                           hover:bg-green-900 text-white rounded-full text-xs
                           font-semibold transition-colors">
                <Plus size={12} /> Add Manual Expense
              </button>
            </div>
          </div>

          <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2
                       text-sm outline-none bg-white mb-2">
            <option value="">All Categories</option>
            {CATEGORIES.map(c => (
              <option key={c.key} value={c.key}>{c.emoji} {c.label}</option>
            ))}
          </select>

          <div className="flex items-center border border-gray-200 rounded-xl
                          px-3 mb-4">
            <Search size={14} className="text-gray-400" />
            <input type="text" value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search items..."
              className="w-full px-2 py-2 text-sm outline-none" />
          </div>

          {showForm && (
            <ExpenseForm
              trip={trip}
              presetCategory={presetCategory}
              onSave={handleSaveExpense}
              onCancel={() => { setShowForm(false); setPresetCategory(null); }}
            />
          )}

          {/* Auto group */}
          <div className="bg-gray-50 rounded-xl px-3 py-2 mb-2 flex items-center
                          gap-1.5 text-xs font-semibold text-gray-600">
            <RefreshCw size={11} className="text-blue-500" />
            Auto-Added from Bookings
          </div>
          <div className="space-y-2 mb-4">
            {autoList.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-3">
                No auto-added bookings{filterCat || search ? " match" : ""}.
              </p>
            )}
            {autoList.map(e => (
              <ExpenseRow key={e.id} e={e} onDelete={handleDelete} />
            ))}
          </div>

          {/* Manual group */}
          <div className="bg-gray-50 rounded-xl px-3 py-2 mb-2 flex items-center
                          gap-1.5 text-xs font-semibold text-gray-600">
            <Pencil size={11} className="text-orange-500" />
            Manual Expenses
          </div>
          <div className="space-y-2 mb-4">
            {manualList.length === 0 ? (
              <div className="text-center py-6">
                <div className="text-3xl mb-2">🍜</div>
                <p className="text-sm font-semibold text-gray-700">
                  No manual expenses yet
                </p>
                <p className="text-xs text-gray-400 mb-3">
                  Add food, tickets, or other costs
                </p>
                <button onClick={() => openForm()}
                  className="px-4 py-2 bg-green-800 hover:bg-green-900
                             text-white rounded-full text-xs font-semibold
                             transition-colors">
                  + Add First Expense
                </button>
              </div>
            ) : manualList.map(e => (
              <ExpenseRow key={e.id} e={e} onDelete={handleDelete} />
            ))}
          </div>

          {/* Totals footer */}
          <div className="border-t border-gray-100 pt-3 space-y-1.5 text-xs">
            <div className="flex justify-between text-gray-500">
              <span>Auto-added</span><span>{money(autoSpent)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Manual</span><span>{money(manualSpent)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900
                            border-t border-gray-100 pt-2 text-sm">
              <span>Total Spent</span><span>{money(totalSpent)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sync Bookings Modal ────────────────────────────── */}
      {showSyncModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-xl w-full overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-gray-100 flex items-start justify-between gap-4 bg-gradient-to-r from-emerald-50/60 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 shadow-sm">
                  <RefreshCw size={20} className={loadingSyncable ? "animate-spin" : ""} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 leading-snug">
                    Sync Bookings to Trip Budget
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Import confirmed vehicle & guide bookings into this trip's budget items.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSyncModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Notification banners */}
            {syncSuccessMsg && (
              <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>{syncSuccessMsg}</span>
              </div>
            )}
            {syncError && (
              <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle size={16} className="text-red-600 shrink-0" />
                <span>{syncError}</span>
              </div>
            )}

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
              {loadingSyncable ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-gray-400">
                  <RefreshCw size={24} className="animate-spin text-emerald-600" />
                  <p className="text-xs font-medium">Checking for confirmed bookings...</p>
                </div>
              ) : syncableBookings.length === 0 ? (
                <div className="py-10 text-center space-y-3">
                  <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
                    <Database size={24} />
                  </div>
                  <p className="text-sm font-bold text-gray-800">No confirmed bookings found</p>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    You don't have any confirmed vehicle rentals or tour guide bookings yet. When you complete a booking advance payment, it will appear here for 1-click sync.
                  </p>
                </div>
              ) : (
                <>
                  {/* Summary Bar */}
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-gray-100 flex-wrap">
                    <span className="text-xs font-semibold text-gray-600">
                      {syncableBookings.filter(b => !b.isSynced).length > 0 ? (
                        <span className="text-emerald-700 font-bold">
                          {syncableBookings.filter(b => !b.isSynced).length} new booking(s) available
                        </span>
                      ) : (
                        <span className="text-gray-500">All bookings are synced with your budget</span>
                      )}
                    </span>
                    {syncableBookings.some(b => !b.isSynced) && (
                      <button
                        onClick={handleSyncAll}
                        disabled={syncingId !== null}
                        className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                      >
                        {syncingId === "ALL" ? (
                          <>
                            <RefreshCw size={12} className="animate-spin" /> Syncing All...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={13} /> Sync All Available
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* List of Bookings */}
                  <div className="space-y-3">
                    {syncableBookings.map((b) => {
                      const isVehicle = b.bookingType === "VEHICLE";
                      const isThisSyncing = syncingId === b.bookingId;
                      return (
                        <div
                          key={`${b.bookingType}-${b.bookingId}`}
                          className={`p-4 rounded-2xl border transition-all ${
                            b.isSynced
                              ? "bg-gray-50/80 border-gray-200/80 opacity-80"
                              : "bg-white border-emerald-100 hover:border-emerald-300 shadow-sm"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                isVehicle ? "bg-amber-100 text-amber-800" : "bg-purple-100 text-purple-800"
                              }`}>
                                {isVehicle ? <Car size={18} /> : <UsersIcon size={18} />}
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                    isVehicle ? "bg-amber-100 text-amber-900" : "bg-purple-100 text-purple-900"
                                  }`}>
                                    {isVehicle ? "Vehicle" : "Guide"}
                                  </span>
                                  <span className="text-[10px] font-medium text-gray-500">
                                    #{b.referenceId}
                                  </span>
                                  {b.tripId === trip?.id && (
                                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md font-semibold">
                                      This Trip
                                    </span>
                                  )}
                                </div>
                                <h4 className="text-sm font-bold text-gray-900">
                                  {b.providerName}
                                </h4>
                                <p className="text-xs text-gray-500">
                                  {b.startDate} {b.endDate && b.endDate !== b.startDate ? `– ${b.endDate}` : ""}
                                  {b.vehicleNumber && ` · Plate: ${b.vehicleNumber}`}
                                </p>
                                {b.notes && (
                                  <p className="text-[11px] text-gray-400 italic">
                                    Req: {b.notes}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="text-right shrink-0 flex flex-col items-end gap-2">
                              <div className="text-sm font-bold text-gray-900">
                                ${b.totalCost?.toFixed(2)}
                              </div>
                              {b.isSynced ? (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-lg">
                                  <CheckCircle2 size={12} /> Synced
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleSyncSingleBooking(b)}
                                  disabled={syncingId !== null}
                                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-3 py-1 rounded-lg transition-colors disabled:opacity-50"
                                >
                                  {isThisSyncing ? (
                                    <>
                                      <RefreshCw size={12} className="animate-spin" /> Syncing...
                                    </>
                                  ) : (
                                    <>
                                      <Plus size={12} /> Sync to Budget
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>Automatic duplicate prevention enabled</span>
              <button
                onClick={() => setShowSyncModal(false)}
                className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 rounded-xl font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

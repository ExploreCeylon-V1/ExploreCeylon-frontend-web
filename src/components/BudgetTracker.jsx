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
  BarChart3, ArrowLeftRight, Lightbulb, Ban, Database,
} from "lucide-react";
import budgetService from "../services/budgetService";

const LKR_RATE = 325;

// Keys match the backend BudgetItem.ItemCategory enum exactly.
const CATEGORIES = [
  { key: "HOTEL",     label: "Hotels",     emoji: "🏨", color: "#1e3a5f", budget: 350 },
  { key: "VEHICLE",   label: "Vehicles",   emoji: "🚗", color: "#f59e0b", budget: 140 },
  { key: "GUIDE",     label: "Guides",     emoji: "👤", color: "#7c3aed", budget: 130 },
  { key: "ACTIVITY",  label: "Activities", emoji: "🎟️", color: "#059669", budget: 70 },
  { key: "FOOD",      label: "Food",       emoji: "🍜", color: "#e11d48", budget: 70 },
  { key: "TRANSPORT", label: "Transport",  emoji: "🚌", color: "#2563eb", budget: 40 },
  { key: "MISC",      label: "Other",      emoji: "📦", color: "#9ca3af", budget: 0 },
];

const catMeta = key =>
  CATEGORIES.find(c => c.key === key) || CATEGORIES[CATEGORIES.length - 1];

// Starting allocations offered before the traveler customizes their own.
const DEFAULT_ALLOCATIONS = Object.fromEntries(
  CATEGORIES.map(c => [c.key, c.budget]));

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
  { id: "a4", auto: true, category: "VEHICLE", title: "Airport Transfer Van (1 day)",
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
  let offset = 0;

  const segments = perCategory
    .filter(c => c.spent > 0)
    .map(c => {
      const frac = totalSpent > 0 ? c.spent / totalSpent : 0;
      const seg = { color: c.color, dash: frac * C, offset };
      offset += frac * C;
      return seg;
    });

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
        <span className="text-[11px] text-gray-400">Total Spent</span>
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
      <div className="h-40 flex flex-col justify-between text-[10px]
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

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-1.5">Date</p>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2
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
                               text-white text-[9px] font-bold px-1.5 py-0.5
                               rounded">
                <RefreshCw size={8} /> AUTO
              </span>
            )}
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded
                             bg-gray-100" style={{ color: meta.color }}>
              {meta.emoji} {meta.label}
            </span>
          </div>
          <p className="text-sm font-semibold text-gray-800 truncate">{e.title}</p>
          <p className="text-[11px] text-gray-400">{formatItemDate(e.date)}</p>
          {e.note && <p className="text-[11px] text-gray-400">{e.note}</p>}
          {e.reference && (
            <p className="text-[10px] text-gray-400 font-mono">Ref: {e.reference}</p>
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
  const [categoryBudgets, setCategoryBudgets] = useState(DEFAULT_ALLOCATIONS);
  const [editingAllocations, setEditingAllocations] = useState(null);
  const [showForm, setShowForm]     = useState(false);
  const [presetCategory, setPresetCategory] = useState(null);
  const [filterCat, setFilterCat]   = useState("");
  const [search, setSearch]         = useState("");
  const [copied, setCopied]         = useState(false);
  const expensePanelRef = useRef(null);

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
    setLoadingLive(true);
    try {
      const budget = await budgetService.getBudgetByTrip(trip.id);
      setBudgetId(budget.id);
      setTotalBudget(budget.totalBudget);
      setExpenses((budget.items || []).map(mapApiItem));
      setCategoryBudgets(
        budget.categoryBudgets && Object.keys(budget.categoryBudgets).length > 0
          ? budget.categoryBudgets
          : DEFAULT_ALLOCATIONS);
      onBudgetChange?.(budget.totalBudget);
    } catch {
      // No budget created for this trip yet — show the empty state.
      setBudgetId(null);
      setTotalBudget(defaultBudget);
      setExpenses([]);
      setCategoryBudgets(DEFAULT_ALLOCATIONS);
      onBudgetChange?.(null);
    } finally {
      setLoadingLive(false);
    }
  }

  useEffect(() => {
    setShowForm(false);
    if (isLive) {
      if (trip?.id) loadLive();
      else setLoadingLive(false);
    } else {
      setExpenses(DEMO_EXPENSES[mode] || []);
      setTotalBudget(800);
      setCategoryBudgets(DEFAULT_ALLOCATIONS);
      setLoadingLive(false);
    }
    setEditingAllocations(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, trip?.id]);

  // Creates the trip's budget on first use (first expense / edit / sync).
  async function ensureBudget() {
    if (budgetId) return budgetId;
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

  const perCategory = CATEGORIES.map(c => ({
    ...c,
    budget: categoryBudgets[c.key] ?? 0,
    spent: expenses.filter(e => e.category === c.key)
                   .reduce((s, e) => s + e.amount, 0),
  }));

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLive, mode, expenses, tripDays, trip?.startDate]);

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
  }

  function startEditAllocations() {
    setEditingAllocations(Object.fromEntries(
      CATEGORIES.map(c => [c.key, String(categoryBudgets[c.key] ?? 0)])));
  }

  async function saveAllocations() {
    const parsed = {};
    for (const [key, value] of Object.entries(editingAllocations)) {
      const n = parseFloat(value);
      parsed[key] = Number.isNaN(n) || n < 0 ? 0 : n;
    }
    if (isLive) {
      try {
        const id = await ensureBudget();
        await budgetService.updateCategoryBudgets(id, parsed);
      } catch {
        alert("Failed to save category budgets");
        return;
      }
    }
    setCategoryBudgets(parsed);
    setEditingAllocations(null);
  }

  // Bookings auto-add to the budget server-side when they're created;
  // "Sync Bookings" creates the budget if needed, repairs the dates of
  // any auto-added items saved before that logic recorded the booking's
  // real date (so they show up correctly in the daily chart), and refetches.
  async function handleSyncBookings() {
    if (!isLive) { setMode("ON_TRACK"); return; }
    try {
      const id = await ensureBudget();
      await budgetService.repairAutoAddedDates(id);
      await loadLive();
    } catch {
      alert("Failed to sync bookings");
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

  // Opens a print-ready report in a new window and triggers the browser's
  // print dialog, where the traveler can "Save as PDF". No PDF library —
  // this stays dependency-free and works in every browser.
  function handleExportPdf() {
    const esc = s => String(s ?? "").replace(/[&<>"]/g, ch =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));

    const statusLabel = { ON_TRACK: "On Track", WARNING: "Warning",
      OVER: "Over Budget" }[level];
    const dateRange = trip?.startDate && trip?.endDate
      ? `${formatItemDate(trip.startDate)} – ${formatItemDate(trip.endDate)}`
      : "";
    const generatedOn = new Date().toLocaleString("en-US",
      { dateStyle: "medium", timeStyle: "short" });

    const categoryRows = perCategory
      .filter(c => c.budget > 0 || c.spent > 0)
      .map(c => {
        const rem = c.budget - c.spent;
        return `<tr>
          <td>${esc(c.emoji)} ${esc(c.label)}</td>
          <td class="num">${money(c.budget)}</td>
          <td class="num">${money(c.spent)}</td>
          <td class="num ${rem < 0 ? "neg" : "pos"}">${money(rem)}</td>
        </tr>`;
      }).join("");

    const dailyRows = daily.slice(0, tripDays).map((v, i) =>
      `<tr><td>Day ${i + 1}</td><td class="num">${money(v)}</td></tr>`).join("");

    const sortedExpenses = [...expenses].sort((a, b) =>
      String(a.date || "").localeCompare(String(b.date || "")));
    const expenseRows = sortedExpenses.map(e => {
      const meta = catMeta(e.category);
      return `<tr>
        <td>${esc(formatItemDate(e.date))}</td>
        <td>${esc(meta.emoji)} ${esc(meta.label)}</td>
        <td>${esc(e.title)}${e.auto ? ' <span class="tag">AUTO</span>' : ""}
            ${e.note ? `<div class="note">${esc(e.note)}</div>` : ""}</td>
        <td class="num">${money(e.amount)}</td>
      </tr>`;
    }).join("");

    const html = `<!doctype html><html><head><meta charset="utf-8">
      <title>Budget Report — ${esc(tripTitle)}</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: system-ui, -apple-system, sans-serif; color: #1f2937;
               margin: 32px; font-size: 12px; }
        h1 { font-size: 22px; margin: 0 0 4px; color: #14532d; }
        h2 { font-size: 14px; margin: 24px 0 8px; color: #14532d;
             border-bottom: 2px solid #dcfce7; padding-bottom: 4px; }
        .sub { color: #6b7280; margin: 0 0 16px; }
        .cards { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 8px; }
        .card { flex: 1; min-width: 130px; border: 1px solid #e5e7eb;
                border-radius: 10px; padding: 12px; }
        .card .val { font-size: 18px; font-weight: 700; }
        .card .lbl { color: #6b7280; font-size: 11px; }
        .badge { display: inline-block; padding: 3px 10px; border-radius: 999px;
                 font-weight: 700; font-size: 11px; }
        .b-ontrack { background: #dcfce7; color: #166534; }
        .b-warning { background: #fef9c3; color: #854d0e; }
        .b-over { background: #fee2e2; color: #991b1b; }
        table { width: 100%; border-collapse: collapse; margin-top: 4px; }
        th, td { text-align: left; padding: 7px 8px; border-bottom: 1px solid #f0f0f0; }
        th { color: #6b7280; font-weight: 600; border-bottom: 1px solid #d1d5db; }
        .num { text-align: right; font-variant-numeric: tabular-nums; }
        .pos { color: #15803d; } .neg { color: #dc2626; }
        tfoot td { font-weight: 700; border-top: 2px solid #d1d5db; }
        .tag { background: #dbeafe; color: #1d4ed8; font-size: 9px;
               font-weight: 700; padding: 1px 5px; border-radius: 4px; }
        .note { color: #9ca3af; font-size: 10px; }
        .foot { margin-top: 28px; color: #9ca3af; font-size: 10px;
                border-top: 1px solid #e5e7eb; padding-top: 8px; }
        @media print { body { margin: 12px; } h2 { page-break-after: avoid; } }
      </style></head><body>
      <h1>Budget Report</h1>
      <p class="sub"><strong>${esc(tripTitle)}</strong>${dateRange ? ` &middot; ${esc(dateRange)}` : ""}
        ${trip?.groupSize ? ` &middot; ${trip.groupSize} traveler${trip.groupSize > 1 ? "s" : ""}` : ""}</p>

      <div class="cards">
        <div class="card"><div class="val">${money(totalBudget)}</div><div class="lbl">Total Budget</div></div>
        <div class="card"><div class="val">${money(totalSpent)}</div><div class="lbl">Total Spent (${pctUsed.toFixed(1)}%)</div></div>
        <div class="card"><div class="val ${remaining < 0 ? "neg" : "pos"}">${money(remaining)}</div><div class="lbl">Remaining</div></div>
        <div class="card"><div class="val">${money(dailyAvg)}</div><div class="lbl">Daily Average</div></div>
      </div>
      <p><span class="badge b-${level.toLowerCase().replace("_", "")}">${statusLabel}</span></p>

      <h2>Spending by Category</h2>
      <table><thead><tr><th>Category</th><th class="num">Budgeted</th>
        <th class="num">Spent</th><th class="num">Remaining</th></tr></thead>
        <tbody>${categoryRows || '<tr><td colspan="4">No categories.</td></tr>'}</tbody>
        <tfoot><tr><td>Total</td><td class="num">${money(totalBudget)}</td>
          <td class="num">${money(totalSpent)}</td>
          <td class="num ${remaining < 0 ? "neg" : "pos"}">${money(remaining)}</td></tr></tfoot>
      </table>

      <h2>Daily Spending</h2>
      <table><thead><tr><th>Day</th><th class="num">Spent</th></tr></thead>
        <tbody>${dailyRows}</tbody></table>

      <h2>All Expenses (${expenses.length})</h2>
      <table><thead><tr><th>Date</th><th>Category</th><th>Item</th>
        <th class="num">Amount</th></tr></thead>
        <tbody>${expenseRows || '<tr><td colspan="4">No expenses logged.</td></tr>'}</tbody>
        <tfoot><tr><td colspan="3">Total Spent</td>
          <td class="num">${money(totalSpent)}</td></tr></tfoot>
      </table>

      <p class="foot">Generated ${esc(generatedOn)} &middot; ExploreCeylon Budget Tracker</p>
      </body></html>`;

    const win = window.open("", "_blank");
    if (!win) {
      alert("Please allow pop-ups to export the PDF report.");
      return;
    }
    win.document.write(html);
    win.document.close();
    win.focus();
    // Give the new document a tick to lay out before invoking print.
    setTimeout(() => win.print(), 300);
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
            className="inline-flex items-center gap-1 text-[11px] font-semibold
                       text-green-800 hover:underline">
            <Pencil size={10} /> Edit Budget
          </button>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
          <p className="text-2xl font-bold text-gray-900">{money(totalSpent)}</p>
          <p className="text-xs text-gray-400">Total Spent</p>
          <p className="text-[11px] text-gray-400 mt-1.5">{pctUsed.toFixed(1)}% used</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
          <p className={`text-2xl font-bold
              ${remaining < 0 ? "text-red-600" : "text-gray-900"}`}>
            {money(remaining)}
          </p>
          <p className="text-xs text-gray-400">Remaining</p>
          <p className={`text-[11px] mt-1.5
              ${remaining < 0 ? "text-red-500" : "text-green-700"}`}>
            {remaining < 0 ? "over budget" : `${(100 - pctUsed).toFixed(1)}% left`}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-yellow-200 p-4 shadow-sm">
          <p className="text-2xl font-bold text-orange-500">{money(dailyAvg)}</p>
          <p className="text-xs text-gray-400">Daily Average</p>
          <p className="text-[11px] text-gray-400 mt-1.5">{tripDays} days total</p>
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
        <div className="relative h-5 text-[10px] text-gray-400">
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
            <p className="text-[11px] text-gray-500 mt-1">
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
                  className="flex-1 text-center text-[10px] text-gray-400">
                  Day {i + 1}
                </span>
              ))}
            </div>
            {unscheduledSpend > 0 && (
              <p className="text-[11px] text-gray-400 mt-2">
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

            {editingAllocations ? (
              <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
                <p className="text-[11px] text-gray-400">
                  Allocated:{" "}
                  <span className={
                    Object.values(editingAllocations)
                      .reduce((s, v) => s + (parseFloat(v) || 0), 0) > totalBudget
                      ? "text-red-600 font-semibold"
                      : "text-gray-600 font-semibold"}>
                    {money(Object.values(editingAllocations)
                      .reduce((s, v) => s + (parseFloat(v) || 0), 0))}
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
              <p className="text-[10px] text-gray-400 mt-2">
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
    </div>
  );
}

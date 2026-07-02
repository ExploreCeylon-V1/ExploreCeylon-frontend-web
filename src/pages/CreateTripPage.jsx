import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createTrip } from "../services/tripService";
import heroImg from "../assets/srilanka-hero.png";
import tipImg from "../assets/trip_img_2.png";
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// ── Constants ──────────────────────────────────────────────
const TRAVEL_STYLES = [
  { value: "ADVENTURE",   label: "Adventure",   emoji: "🏔️" },
  { value: "CULTURAL",    label: "Cultural",    emoji: "🏛️" },
  { value: "RELAXATION",  label: "Relaxation",  emoji: "🌴" },
  { value: "FAMILY",      label: "Family",      emoji: "👨‍👩‍👧" },
  { value: "HONEYMOON",   label: "Honeymoon",   emoji: "💑" },
  { value: "PILGRIMAGE",  label: "Pilgrimage",  emoji: "🛕" },
  { value: "WILDLIFE",    label: "Wildlife",    emoji: "🦁" },
  { value: "PHOTOGRAPHY", label: "Photography", emoji: "📸" },
];

const BUDGET_OPTIONS = [
  {
    value: "BUDGET",
    label: "Budget",
    emoji: "💚",
    sub: "Guesthouses",
    price: "$15–30/night",
  },
  {
    value: "MID_RANGE",
    label: "Mid-Range",
    emoji: "⭐",
    sub: "Boutique Hotels",
    price: "$40–80/night",
  },
  {
    value: "LUXURY",
    label: "Luxury",
    emoji: "👑",
    sub: "Premium Resorts",
    price: "$150+/night",
  },
];

const NEXT_STEPS = [
  { emoji: "✨", label: "AI analyzes your preferences" },
  { emoji: "📍", label: "Finds best places & activities" },
  { emoji: "📋", label: "Builds a perfect itinerary" },
  { emoji: "📝", label: "You review & customize" },
  { emoji: "🙂", label: "Your dream trip is ready!" },
];

// ── Date / Duration Picker ─────────────────────────────────
function DateDurationPicker({ startDate, endDate, onChange, onClose }) {
  const [localStart, setLocalStart] = useState(startDate || "");
  const [localEnd,   setLocalEnd]   = useState(endDate   || "");

  const days =
    localStart && localEnd
      ? Math.round(
          Math.abs(new Date(localEnd) - new Date(localStart)) / 86400000
        ) + 1
      : 0;

  function handleApply() {
    if (!localStart || !localEnd) return;
    if (new Date(localEnd) < new Date(localStart)) {
      alert("End date must be after start date.");
      return;
    }
    onChange(localStart, localEnd);
    onClose();
  }

  return (
    <div className="absolute left-0 top-full mt-2 z-50 bg-white rounded-2xl
                    border border-gray-200 shadow-2xl p-5 w-80">
      <h4 className="text-sm font-semibold text-gray-800 mb-4">
        📅 Select Dates
      </h4>

      <div className="space-y-3 mb-4">
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">
            Start Date
          </label>
          <input
            type="date"
            value={localStart}
            min={new Date().toISOString().split("T")[0]}
            onChange={e => setLocalStart(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2
                       text-sm text-gray-800 outline-none
                       focus:border-[#1a5c2a] focus:ring-2 focus:ring-green-100"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">
            End Date
          </label>
          <input
            type="date"
            value={localEnd}
            min={localStart || new Date().toISOString().split("T")[0]}
            onChange={e => setLocalEnd(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2
                       text-sm text-gray-800 outline-none
                       focus:border-[#1a5c2a] focus:ring-2 focus:ring-green-100"
          />
        </div>
      </div>

      {days > 0 && (
        <div className="text-center text-xs font-semibold text-[#1a5c2a]
                         bg-green-50 rounded-lg py-2 mb-4">
          🕐 {days} Day{days > 1 ? "s" : ""} Trip
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 py-2 text-sm border border-gray-200 rounded-xl
                     text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleApply}
          disabled={!localStart || !localEnd}
          className="flex-1 py-2 text-sm bg-[#1a5c2a] text-white
                     rounded-xl font-semibold hover:bg-[#14471f]
                     disabled:opacity-40 disabled:cursor-not-allowed
                     transition-colors"
        >
          Apply
        </button>
      </div>
    </div>
  );
}

// ── Format date display ────────────────────────────────────
function formatDisplay(start, end) {
  if (!start || !end) return null;
  const s = new Date(start).toLocaleDateString("en-US", {
    month: "short", day: "numeric",
  });
  const e = new Date(end).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
  const days =
    Math.round(Math.abs(new Date(end) - new Date(start)) / 86400000) + 1;
  return `${s} – ${e} · ${days} days`;
}

// ── Main Page ──────────────────────────────────────────────
export default function CreateTripPage() {
  const navigate = useNavigate();

  const [fromLocation, setFromLocation] = useState("");
  const [toLocation,   setToLocation]   = useState("");
  const [startDate,    setStartDate]    = useState("");
  const [endDate,      setEndDate]      = useState("");
  const [groupSize,    setGroupSize]    = useState(2);
  const [travelStyle,  setTravelStyle]  = useState([]);
  const [budgetRange,  setBudgetRange]  = useState("MID_RANGE");
  const [specialNotes, setSpecialNotes] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState(null);

  // ── Validation ─────────────────────────────────────────
  function isValid() {
    return (
      fromLocation.trim() &&
      toLocation.trim()   &&
      startDate           &&
      endDate             &&
      travelStyle.length > 0 &&
      budgetRange
    );
  }

  // ── Submit ─────────────────────────────────────────────
  async function handleSubmit(withAi) {
    if (!isValid()) {
      setError("Please fill in all required fields.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const payload = {
        fromLocation:   fromLocation.trim(),
        toLocation:     toLocation.trim(),
        startDate,
        endDate,
        groupSize,
        travelStyle:    travelStyle[0],
        travelStyles:   travelStyle,
        budgetRange,
        specialNotes:   specialNotes.trim() || null,
        generateWithAi: withAi,
      };

      const trip = await createTrip(payload);

      if (withAi) {
        // Trigger AI generation then go to trip detail
        const { generateAiItinerary } = await import("../services/tripService");
        await generateAiItinerary(trip.id, {
          startDate,
          endDate,
          travelStyle:   travelStyle[0],
          travelStyles:  travelStyle,
          budgetRange,
          groupSize,
          regions:       [toLocation.trim()],
          interests:     [],
          startingPoint: fromLocation.trim(),
          fromLocation:  fromLocation.trim(),
          toLocation:    toLocation.trim(),
          specialNotes:  specialNotes.trim() || null,
        });
        navigate(`/trips/${trip.id}`);
      } else {
        navigate(`/trips`);
      }
    } catch (e) {
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Toggle Travel Style ────────────────────────────────
  function toggleTravelStyle(styleValue) {
    setTravelStyle(prev => {
      if (prev.includes(styleValue)) {
        return prev.filter(item => item !== styleValue);
      }
      return [...prev, styleValue];
    });
  }

  // ── Render ─────────────────────────────────────────────
  return (
    <>
    <Navbar />
    <div
      className="min-h-screen relative bg-cover bg-center bg-fixed "
      style={{ backgroundImage: `url(${heroImg})` }}
    >
      <div className="absolute inset-0 bg-white/55 " />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-10 lg:py-14">
        {/* Desktop Header */}
        <div className="hidden lg:block mb-8">
            <h1 className="text-4xl font-extrabold text-[#16331c]">
                Create New Trip ✨
            </h1>

            <p className="mt-3 text-lg text-gray-600">
                Plan your perfect adventure with our AI-powered trip planner.
            </p>
        </div>

        {/* Mobile Header */}
        <div className="lg:hidden mb-5">
            <h1 className="text-2xl font-extrabold text-[#16331c]">
                Create New Trip ✨
            </h1>

            <p className="text-sm text-gray-600 mt-1">
                Plan your perfect adventure with our AI trip planner.
            </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* ── Center: Form card ── */}
            <div className="lg:col-span-2 bg-white rounded-3xl shadow-xl border border-gray-100 p-8 xl:p-10">            

            {/* Error banner */}
            {error && (
              <div className="mb-5 flex items-start gap-2 bg-red-50 border
                              border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                <span>⚠️</span> {error}
              </div>
            )}

            {/* ── Row 1: From / To / Date ── */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
              {/* Heading from */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold
                                  text-[#1a5c2a] mb-2">
                  <span className="text-base">📍</span> Heading from
                </label>
                <input
                  type="text"
                  value={fromLocation}
                  onChange={e => setFromLocation(e.target.value)}
                  placeholder="Country, City or Landmark"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5
                             text-sm text-gray-800 placeholder-gray-400 outline-none
                             focus:border-[#1a5c2a] focus:ring-2 focus:ring-green-100
                             transition-all"
                />
              </div>

              {/* Where to */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold
                                  text-[#1a5c2a] mb-2">
                  <span className="text-base">📍</span> Where to?
                </label>
                <input
                  type="text"
                  value={toLocation}
                  onChange={e => setToLocation(e.target.value)}
                  placeholder="Country, City or Landmark"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5
                             text-sm text-gray-800 placeholder-gray-400 outline-none
                             focus:border-[#1a5c2a] focus:ring-2 focus:ring-green-100
                             transition-all"
                />
              </div>

              {/* Date / Duration */}
              <div className="relative">
                <label className="flex items-center gap-1.5 text-xs font-semibold
                                  text-[#1a5c2a] mb-2">
                  <span className="text-base">📅</span> Date / Duration
                </label>
                <button
                  onClick={() => setShowDatePicker(p => !p)}
                  className={`w-full border rounded-xl px-3 py-2.5 text-sm text-left
                              transition-all outline-none
                              ${startDate && endDate
                                ? "border-[#1a5c2a] text-gray-800 bg-green-50"
                                : "border-gray-200 text-gray-400 hover:border-gray-300"
                              }`}
                >
                  {formatDisplay(startDate, endDate) || "Select date range"}
                </button>

                {showDatePicker && (
                  <DateDurationPicker
                    startDate={startDate}
                    endDate={endDate}
                    onChange={(s, e) => { setStartDate(s); setEndDate(e); }}
                    onClose={() => setShowDatePicker(false)}
                  />
                )}
              </div>

              {/* ── Group Size ── */}
                <div className="mb-6">
                <label className="flex items-center gap-2 text-sm font-semibold
                                    text-gray-800 mb-3">
                    <span className="text-base">👥</span> Group Size
                </label>
                <div className="flex items-center gap-3">
                    <button
                    onClick={() => setGroupSize(s => Math.max(1, s - 1))}
                    className="w-9 h-9 rounded-xl border border-gray-200 text-gray-600
                                text-lg font-bold hover:border-[#1a5c2a] hover:text-[#1a5c2a]
                                hover:bg-green-50 transition-colors flex items-center justify-center"
                    >
                    −
                    </button>
                    <span className="text-base font-semibold text-gray-800 w-6 text-center">
                    {groupSize}
                    </span>
                    <button
                    onClick={() => setGroupSize(s => Math.min(20, s + 1))}
                    className="w-9 h-9 rounded-xl border border-gray-200 text-gray-600
                                text-lg font-bold hover:border-[#1a5c2a] hover:text-[#1a5c2a]
                                hover:bg-green-50 transition-colors flex items-center justify-center"
                    >
                    +
                    </button>
                </div>
                </div>
            </div>

            <div className="border-t border-gray-100 mb-6" />

            {/* ── Travel Style ── */}
            <div className="mb-6">
              <label className="flex items-center gap-2 text-sm font-semibold
                                text-gray-800 mb-3">
                <span className="text-base">🧭</span> Travel Style
                <span className="text-xs font-normal text-gray-400">(Choose one or more)</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {TRAVEL_STYLES.map(s => {
                  const active = travelStyle.includes(s.value);
                  return (
                    <button
                      key={s.value}
                      onClick={() => toggleTravelStyle(s.value)}
                      className={`relative flex flex-col items-center gap-1.5 py-3 px-2
                                  rounded-xl border text-xs font-medium transition-all
                                  ${active
                                    ? "border-[#1a5c2a] bg-green-50 text-[#1a5c2a]"
                                    : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                                  }`}
                    >
                      {active && (
                        <span className="absolute top-1.5 right-1.5 text-[#1a5c2a] text-sm">
                          ✅
                        </span>
                      )}
                      <span className="text-2xl">{s.emoji}</span>
                      <span className="text-center">{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-gray-100 mb-6" />

            {/* ── Budget Range ── */}
            <div className="mb-6">
              <label className="flex items-center gap-2 text-sm font-semibold
                                text-gray-800 mb-3">
                <span className="text-base">🏷️</span> Budget Range
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {BUDGET_OPTIONS.map(b => {
                  const active = budgetRange === b.value;
                  return (
                    <button
                      key={b.value}
                      onClick={() => setBudgetRange(b.value)}
                      className={`relative flex flex-col gap-0.5 p-4 rounded-xl
                                  border text-left transition-all
                                  ${active
                                    ? "border-[#1a5c2a] bg-green-50"
                                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                  }`}
                    >
                      {active && (
                        <span className="absolute top-2 right-2 text-[#1a5c2a] text-base">
                          ✅
                        </span>
                      )}
                      <span className="text-lg mb-0.5">{b.emoji}</span>
                      <span className={`text-sm font-semibold ${active ? "text-[#1a5c2a]" : "text-gray-800"}`}>
                        {b.label}
                      </span>
                      <span className="text-xs text-gray-400">{b.sub}</span>
                      <span className="text-xs text-gray-400">{b.price}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-gray-100 mb-6" />

            {/* ── Special Notes ── */}
            <div className="mb-7">
              <label className="flex items-center gap-2 text-sm font-semibold
                                text-gray-800 mb-3">
                <span className="text-base">📝</span> Special Notes
                <span className="text-xs font-normal text-gray-400">(optional)</span>
              </label>
              <textarea
                value={specialNotes}
                onChange={e => setSpecialNotes(e.target.value)}
                placeholder="Any special requirements, preferences or notes for the AI planner... e.g. vegetarian food, no extreme activities, travelling with elderly parents"
                rows={3}
                maxLength={300}
                className="w-full border border-gray-200 rounded-xl px-4 py-3
                           text-sm text-gray-800 placeholder-gray-400 outline-none
                           focus:border-[#1a5c2a] focus:ring-2 focus:ring-green-100
                           transition-all resize-none"
              />
              <p className="text-right text-[11px] text-gray-400 mt-1">
                {specialNotes.length}/300
              </p>
            </div>

            {/* ── Generate with AI button ── */}
            <button
              onClick={() => handleSubmit(true)}
              disabled={loading || !isValid()}
              className="w-full py-4 bg-[#1a5c2a] hover:bg-[#14471f] text-white
                         rounded-2xl font-semibold text-sm transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2 shadow-sm mb-3"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30
                                    border-t-white rounded-full animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <span className="text-base">✨</span>
                  Generate with AI
                  <span className="font-normal opacity-80 ml-1">
                    · Let AI plan your perfect trip
                  </span>
                  <span className="ml-1">→</span>
                </>
              )}
            </button>

            {/* ── Manual create link ── */}
            <button
              onClick={() => handleSubmit(false)}
              disabled={loading || !isValid()}
              className="w-full py-3 border border-gray-200 text-gray-500
                         rounded-2xl text-sm font-medium hover:bg-gray-50
                         hover:border-gray-300 transition-colors
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Create manually (plan yourself)
            </button>

            {/* Field hint */}
            {!isValid() ? (
              <p className="text-center text-xs text-gray-400 mt-3">
                Fill in all fields to continue
              </p>
            ) : (
              <p className="text-center text-xs text-gray-400 mt-3 flex items-center justify-center gap-1">
                🔒 Your data is private &amp; secure
              </p>
            )}
          </div>

          {/* ── Right: AI Travel Tip + What happens next ── */}
          <div className="lg:col-span-1 flex flex-col gap-6 sticky top-6">
            <div className="bg-white rounded-3xl shadow-lg border border-green-100 p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">✨</span>
                <h3 className="text-sm font-bold text-[#1a5c2a]">AI Travel Tip</h3>
                <span className="ml-auto text-base">💡</span>
              </div>
              <p className="text-xs text-gray-600 mb-4">
                Pick your style &amp; budget for better AI suggestions.
              </p>
              <img
                src={tipImg}
                alt="Travel essentials: suitcase, hat, camera and map"
                className="w-full rounded-xl object-cover"
              />
            </div>

            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-sm font-bold text-[#1a5c2a] mb-4">
                What happens next?
              </h3>
              <ul className="space-y-3">
                {NEXT_STEPS.map((step, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-gray-700">
                    <span className="w-7 h-7 rounded-lg bg-green-50 flex items-center
                                     justify-center text-sm shrink-0">
                      {step.emoji}
                    </span>
                    {step.label}
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
    <Footer />
    </>
  );
}

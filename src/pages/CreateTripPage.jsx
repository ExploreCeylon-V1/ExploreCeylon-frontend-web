import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createTrip } from "../services/tripService";
import heroImg from "../assets/srilanka-hero.png";
import tipImg from "../assets/trip_img_2.png";
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import TripGenerationLoader from '../components/TripGenerationLoader';
import plannerService from '../services/plannerService';
import { MapPin, Calendar, Users, Compass, DollarSign, FileText, Sparkles, ArrowRight, CheckCircle2, Lightbulb, Clock } from "lucide-react";

// ── Constants ──────────────────────────────────────────────
const TRAVEL_STYLES = [
  // Existing travel styles
  { value: "ADVENTURE",        label: "Adventure",          emoji: "🏔️" },
  { value: "CULTURAL",         label: "Cultural",           emoji: "🏛️" },
  { value: "RELAXATION",       label: "Relaxation",         emoji: "🌴" },
  { value: "FAMILY",           label: "Family",             emoji: "👨‍👩‍👧" },
  { value: "HONEYMOON",        label: "Honeymoon",          emoji: "💑" },
  { value: "PILGRIMAGE",       label: "Pilgrimage",         emoji: "🛕" },
  { value: "WILDLIFE",         label: "Wildlife",           emoji: "🦁" },
  { value: "PHOTOGRAPHY",      label: "Photography",        emoji: "📸" },

  // Unified 8-category set (Phase 1 additive)
  { value: "CULTURE_HERITAGE", label: "Culture & Heritage", emoji: "🏛️" },
  { value: "RELIGIOUS",        label: "Religious",          emoji: "🛕" },
  { value: "WILDLIFE_NATURE",  label: "Wildlife & Nature",  emoji: "🦁" },
  { value: "BEACH_COAST",      label: "Beach & Coast",      emoji: "🏖️" },
  { value: "HILL_COUNTRY",     label: "Hill Country",       emoji: "⛰️" },
  { value: "SCENIC_VIEWS",     label: "Scenic Views",       emoji: "🌄" },
  { value: "CITY_URBAN",       label: "City & Urban",       emoji: "🏙️" },
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
  { emoji: "✨", label: "AI analyzes your travel preferences" },
  { emoji: "📍", label: "Selects optimal routes & hidden gems" },
  { emoji: "📋", label: "Generates custom daily itinerary" },
  { emoji: "📝", label: "Review & personalize your schedule" },
  { emoji: "🎉", label: "Your Sri Lanka dream trip is ready!" },
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
    <div className="absolute left-0 top-full mt-2.5 z-50 bg-white rounded-3xl border border-gray-200 shadow-2xl p-6 w-80 animate-in fade-in zoom-in-95 duration-150">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
        <h4 className="text-xs font-extrabold text-slate-900 tracking-wide uppercase flex items-center gap-1.5">
          <Calendar className="h-4 w-4 text-emerald-700" /> Select Travel Dates
        </h4>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xs font-bold">✕</button>
      </div>

      <div className="space-y-3.5 mb-4">
        <div>
          <label className="text-3xs font-bold uppercase tracking-wider text-gray-500 mb-1 block">
            Start Date
          </label>
          <input
            type="date"
            value={localStart}
            min={new Date().toISOString().split("T")[0]}
            onChange={e => setLocalStart(e.target.value)}
            className="w-full rounded-2xl border border-gray-200 bg-slate-50 px-3.5 py-2.5 text-xs text-gray-800 outline-none focus:border-emerald-700 focus:bg-white focus:ring-2 focus:ring-emerald-700/10"
          />
        </div>
        <div>
          <label className="text-3xs font-bold uppercase tracking-wider text-gray-500 mb-1 block">
            End Date
          </label>
          <input
            type="date"
            value={localEnd}
            min={localStart || new Date().toISOString().split("T")[0]}
            onChange={e => setLocalEnd(e.target.value)}
            className="w-full rounded-2xl border border-gray-200 bg-slate-50 px-3.5 py-2.5 text-xs text-gray-800 outline-none focus:border-emerald-700 focus:bg-white focus:ring-2 focus:ring-emerald-700/10"
          />
        </div>
      </div>

      {days > 0 && (
        <div className="text-center text-xs font-bold text-emerald-800 bg-emerald-50 rounded-2xl py-2 mb-4 border border-emerald-100 flex items-center justify-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-emerald-700" /> {days} Day{days > 1 ? "s" : ""} Duration
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 py-2 text-xs border border-gray-200 rounded-2xl text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleApply}
          disabled={!localStart || !localEnd}
          className="flex-1 py-2 text-xs bg-emerald-800 text-white rounded-2xl font-bold hover:bg-emerald-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          Apply Dates
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

  const [aiGenerating, setAiGenerating] = useState(false);
  const [genError,     setGenError]     = useState(null);
  const [pendingTripId, setPendingTripId] = useState(null);

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

  function buildPayload(withAi) {
    return {
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
  }

  async function handleManualCreate() {
    if (!isValid()) {
      setError("Please fill in all required fields.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await createTrip(buildPayload(false));
      navigate(`/trips`);
    } catch (e) {
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function runAiGeneration() {
    setGenError(null);
    setAiGenerating(true);
    try {
      const tripDays = startDate && endDate
        ? Math.round(Math.abs(new Date(endDate) - new Date(startDate)) / 86400000) + 1
        : 2;

      const plannerReq = {
        origin: fromLocation.trim(),
        destination: toLocation.trim(),
        tripDays,
        budget: budgetRange,
        travelStyle: travelStyle[0] || 'RELAXED',
        groupSize: Number(groupSize) || 2,
        startDate: startDate || new Date().toISOString().split('T')[0],
        preferences: travelStyle,
        specialNotes: specialNotes.trim() || null,
      };

      const result = await plannerService.generateAndSavePlanner({
        plannerRequest: plannerReq,
        customTripTitle: `${fromLocation.trim()} to ${toLocation.trim()} Trip`,
        autoConfirm: true,
      });

      if (result && result.tripId) {
        navigate(`/trips/${result.tripId}`);
      } else {
        setAiGenerating(false);
      }
    } catch (e) {
      setGenError(
        e.response?.data?.message ||
        e.message ||
        "Unable to generate itinerary. Please try again."
      );
    }
  }

  function handleGenerateWithAi() {
    if (!isValid()) {
      setError("Please fill in all required fields.");
      return;
    }
    setError(null);
    runAiGeneration();
  }

  function dismissGeneration() {
    setAiGenerating(false);
    setGenError(null);
  }

  function handleSubmit(withAi) {
    return withAi ? handleGenerateWithAi() : handleManualCreate();
  }

  function toggleTravelStyle(styleValue) {
    setTravelStyle(prev => {
      if (prev.includes(styleValue)) {
        return prev.filter(item => item !== styleValue);
      }
      return [...prev, styleValue];
    });
  }

  return (
    <>
    {aiGenerating && (
      <TripGenerationLoader
        destination={toLocation.trim()}
        travelStyleLabel={
          TRAVEL_STYLES.find((s) => s.value === travelStyle[0])?.label
        }
        error={genError}
        onRetry={runAiGeneration}
        onDismiss={dismissGeneration}
      />
    )}
    <Navbar />
    <div
      className="min-h-screen relative bg-gradient-to-br from-emerald-50/70 via-teal-50/30 to-slate-100 font-sans text-slate-900 selection:bg-emerald-600 selection:text-white"
    >
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        {/* ── Top Hero Banner ── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-800 to-green-900 p-6 sm:p-10 shadow-xl text-white mb-8">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/30 bg-white/15 px-3.5 py-1 text-3xs font-bold uppercase tracking-widest text-emerald-200 mb-3">
              <Sparkles size={13} /> AI Travel Engine Phase 13
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
              Create Your Dream Itinerary ✨
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-medium">
              Tell us your starting point, destination, dates, and preferences. Our multi-engine AI will craft an optimized Sri Lanka journey in seconds.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ── Main Form Section ── */}
          <div className="lg:col-span-8 bg-white rounded-3xl shadow-xl shadow-slate-900/5 border border-emerald-100/80 p-6 sm:p-10">            

            {/* Error banner */}
            {error && (
              <div className="mb-6 flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-2xl p-4 text-xs font-semibold text-red-700">
                <span className="text-base">⚠️</span> {error}
              </div>
            )}

            {/* ── Row 1: Locations, Dates, Group Size ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {/* Heading from */}
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                  <MapPin className="h-4 w-4 text-emerald-600" /> Heading From <span className="text-emerald-600">*</span>
                </label>
                <input
                  type="text"
                  value={fromLocation}
                  onChange={e => setFromLocation(e.target.value)}
                  placeholder="e.g. Colombo, Katunayake Airport"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 px-4 text-xs sm:text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
                />
              </div>

              {/* Where to */}
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                  <MapPin className="h-4 w-4 text-rose-500" /> Where To? <span className="text-emerald-600">*</span>
                </label>
                <input
                  type="text"
                  value={toLocation}
                  onChange={e => setToLocation(e.target.value)}
                  placeholder="e.g. Kandy, Galle, Ella, Sigiriya"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 px-4 text-xs sm:text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
                />
              </div>

              {/* Date / Duration */}
              <div className="relative flex flex-col gap-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                  <Calendar className="h-4 w-4 text-emerald-600" /> Date & Duration <span className="text-emerald-600">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowDatePicker(p => !p)}
                  className={`w-full rounded-2xl border py-3 px-4 text-xs sm:text-sm text-left transition-all outline-none flex items-center justify-between ${
                    startDate && endDate
                      ? "border-emerald-600 text-emerald-950 font-semibold bg-emerald-50/50"
                      : "border-slate-200 text-slate-400 hover:border-slate-300 bg-slate-50/50"
                  }`}
                >
                  <span>{formatDisplay(startDate, endDate) || "Select travel dates"}</span>
                  <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
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

              {/* Group Size */}
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                  <Users className="h-4 w-4 text-emerald-600" /> Group Size
                </label>
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/50 py-1.5 px-3">
                  <button
                    type="button"
                    onClick={() => setGroupSize(s => Math.max(1, s - 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:border-emerald-600 hover:bg-emerald-50 transition-colors shadow-2xs"
                  >
                    −
                  </button>
                  <div className="text-center">
                    <span className="text-sm font-extrabold text-slate-900">{groupSize}</span>
                    <span className="text-3xs text-slate-500 ml-1">Traveler{groupSize > 1 ? "s" : ""}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setGroupSize(s => Math.min(20, s + 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:border-emerald-600 hover:bg-emerald-50 transition-colors shadow-2xs"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 my-6" />

            {/* ── Travel Style ── */}
            <div className="mb-6">
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                <Compass className="h-4 w-4 text-emerald-600" /> Travel Style <span className="text-emerald-600">*</span>
                <span className="text-3xs font-medium text-slate-400 normal-case ml-1">(Select one or more)</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {TRAVEL_STYLES.map(s => {
                  const active = travelStyle.includes(s.value);
                  return (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => toggleTravelStyle(s.value)}
                      className={`relative flex flex-col items-center gap-1.5 py-3.5 px-3 rounded-2xl border text-xs font-semibold transition-all ${
                        active
                          ? "border-emerald-600 bg-emerald-50/70 text-emerald-950 shadow-sm"
                          : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50/70"
                      }`}
                    >
                      {active && (
                        <CheckCircle2 className="absolute top-2 right-2 h-4 w-4 text-emerald-700" />
                      )}
                      <span className="text-2xl">{s.emoji}</span>
                      <span>{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-gray-100 my-6" />

            {/* ── Budget Range ── */}
            <div className="mb-6">
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                <DollarSign className="h-4 w-4 text-emerald-600" /> Budget Level <span className="text-emerald-600">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {BUDGET_OPTIONS.map(b => {
                  const active = budgetRange === b.value;
                  return (
                    <button
                      key={b.value}
                      type="button"
                      onClick={() => setBudgetRange(b.value)}
                      className={`relative flex flex-col gap-1 p-4 rounded-2xl border text-left transition-all ${
                        active
                          ? "border-emerald-600 bg-emerald-50/70 shadow-sm"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/70"
                      }`}
                    >
                      {active && (
                        <CheckCircle2 className="absolute top-3 right-3 h-4 w-4 text-emerald-700" />
                      )}
                      <span className="text-xl">{b.emoji}</span>
                      <span className={`text-xs font-bold uppercase tracking-wider ${active ? "text-emerald-950" : "text-slate-800"}`}>
                        {b.label}
                      </span>
                      <span className="text-3xs text-slate-500 font-medium">{b.sub}</span>
                      <span className="text-3xs font-semibold text-emerald-700 mt-1">{b.price}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-gray-100 my-6" />

            {/* ── Special Notes ── */}
            <div className="mb-8">
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                <FileText className="h-4 w-4 text-emerald-600" /> Special Notes & Preferences
                <span className="text-3xs font-medium text-slate-400 normal-case ml-1">(Optional)</span>
              </label>
              <textarea
                value={specialNotes}
                onChange={e => setSpecialNotes(e.target.value)}
                placeholder="Mention any specific requirements... e.g. vegetarian food, photography focus, travelling with toddlers, beach stops"
                rows={3}
                maxLength={300}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3.5 text-xs sm:text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 resize-none"
              />
              <p className="text-right text-3xs text-slate-400 mt-1">
                {specialNotes.length}/300
              </p>
            </div>

            {/* ── Submit Buttons ── */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => handleSubmit(true)}
                disabled={loading || aiGenerating || !isValid()}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-800 hover:bg-emerald-900 py-4 px-6 text-xs sm:text-sm font-bold text-white shadow-md shadow-emerald-900/10 transition-all hover:shadow-lg active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Generating Itinerary...</span>
                  </div>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-amber-300" />
                    <span>Generate with AI Planner</span>
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </button>
            </div>

            {!isValid() && (
              <p className="text-center text-3xs text-slate-400 mt-3 font-medium">
                Please complete all required fields (*) to generate your trip
              </p>
            )}
          </div>

          {/* ── Right Panel: Tips & Process ── */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-8">
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-900/5 border border-emerald-100 p-6">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-emerald-50">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-950">AI Travel Tip</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Selecting specific travel styles and budget preferences enables our 13-Phase engine to pick optimal routes & hidden gems.
              </p>
              <img
                src={tipImg}
                alt="Travel essentials"
                className="hidden lg:block w-full rounded-2xl object-cover shadow-xs"
              />
            </div>

            <div className="bg-white rounded-3xl shadow-xl shadow-slate-900/5 border border-slate-100 p-6">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 mb-4 pb-2 border-b border-slate-100">
                What Happens Next?
              </h3>
              <ul className="space-y-3.5">
                {NEXT_STEPS.map((step, i) => (
                  <li key={i} className="flex items-center gap-3 text-xs text-slate-700 font-medium">
                    <span className="w-7 h-7 rounded-xl bg-emerald-50 flex items-center justify-center text-sm shrink-0 border border-emerald-100/50">
                      {step.emoji}
                    </span>
                    <span>{step.label}</span>
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

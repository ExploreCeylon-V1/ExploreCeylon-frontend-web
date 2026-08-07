// 🚨 වැදගත්: useState සහ useEffect මෙතනට අලුතින් එකතු කර ඇත
import { useState, useEffect } from "react"; // 👈 මේ පේළිය තමයි අඩු වෙලා තිබුණේ
import { Link, useNavigate } from "react-router-dom";
import { Users } from "lucide-react";
import heroImage from "../assets/hero-bg.webp";

import destinationsService from "../services/destinationsService";
import guidesService from "../services/guidesService";
import eventService from "../services/eventService";
import hiddenGemsService from "../services/Hiddengemsservice";
import { vehicleService } from "../services/vehicleService";
import userService from "../services/userService";
import DestinationCard from "../components/DestinationCard";
import { useAuth } from "../hooks/useAuth";
import { useCountUp } from "../hooks/useCountUp";

// ─── Category filter pills (DestinationCategory enum values ekata match wenna oni) ───
const CATEGORIES = [
  { label: "Beach", value: "BEACH", emoji: "🏖️" },
  { label: "Cultural", value: "CULTURAL", emoji: "🎭" },
  { label: "Wildlife", value: "WILDLIFE", emoji: "🦁" },
  { label: "Hill", value: "HILL", emoji: "⛰️" },
  { label: "Surf", value: "SURF", emoji: "🏄" },
  { label: "Heritage", value: "HERITAGE", emoji: "🏛️" },
  { label: "Religious", value: "RELIGIOUS", emoji: "🙏" },
  { label: "City", value: "CITY", emoji: "🏙️" },
];

// ─── Format an event's start/end LocalDate strings into a short display range ───
const formatEventRange = (start, end) => {
  if (!start) return "";
  const opts = { month: "short", day: "numeric" };
  const startLabel = new Date(start).toLocaleDateString("en-US", opts);
  if (!end || end === start) return startLabel;
  return `${startLabel} – ${new Date(end).toLocaleDateString("en-US", opts)}`;
};

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // ─── Live data state ───
  const [destinations, setDestinations] = useState([]);
  const [guides, setGuides] = useState([]);
  const [events, setEvents] = useState([]);
  const [gems, setGems] = useState([]);
  const [vehicleCount, setVehicleCount] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalDestinationsCount, setTotalDestinationsCount] = useState(0);

  const [activeCategory, setActiveCategory] = useState(null);
  const [loadingDestinations, setLoadingDestinations] = useState(true);
  const [loadingGuides, setLoadingGuides] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingGems, setLoadingGems] = useState(true);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingTotalDestinations, setLoadingTotalDestinations] = useState(true);

  // ─── Stats card: all counts must be settled before the count-up animation targets are final ───
  const statsLoading =
    loadingTotalDestinations || loadingGuides || loadingVehicles || loadingGems || loadingUsers;
  const [destRef, destCount] = useCountUp(totalDestinationsCount);
  const [gemRef, gemCount] = useCountUp(gems.length);
  const [guideRef, guideCount] = useCountUp(guides.length);
  const [vehicleRef, vehicleCountDisplay] = useCountUp(vehicleCount);
  const [userRef, userCountDisplay] = useCountUp(totalUsers);

  const [email, setEmail] = useState("");

  // ─── Top 3 hidden gems by rating (highest first) ───
  const topGems = [...gems]
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 3);

  // ─── Initial load: featured destinations, guides, events, gems, vehicle count ───
  useEffect(() => {
    // Featured destinations
    destinationsService
      .getFeatured()
      .then((data) => setDestinations(data || []))
      .catch((err) => console.error("Failed to load featured destinations:", err))
      .finally(() => setLoadingDestinations(false));

    // Popular guides (full list load karala, display ekedi withara 3ta limit karanawa)
    guidesService
      .getAllGuides()
      .then((data) => setGuides(data || []))
      .catch((err) => console.error("Failed to load guides:", err))
      .finally(() => setLoadingGuides(false));

    // Upcoming events
    eventService
      .getUpcomingEvents()
      .then((data) => setEvents(data || []))
      .catch((err) => console.error("Failed to load events:", err))
      .finally(() => setLoadingEvents(false));

    // Hidden gems (full list load karala, display ekedi withara 3ta limit karanawa)
    hiddenGemsService
      .getAllGems()
      .then((data) => setGems(data || []))
      .catch((err) => console.error("Failed to load hidden gems:", err))
      .finally(() => setLoadingGems(false));

    // Vehicle count (stats bar eke)
    vehicleService
      .getAllVehicles()
      .then((data) => setVehicleCount((data || []).length))
      .catch((err) => console.error("Failed to load vehicles:", err))
      .finally(() => setLoadingVehicles(false));

    // Total registered users (stats bar eke)
    userService
      .getCount()
      .then((data) => setTotalUsers(data?.count || 0))
      .catch((err) => console.error("Failed to load user count:", err))
      .finally(() => setLoadingUsers(false));

    // Total destination count (stats bar eke — getFeatured() eken venuwata sampurna gananaya)
    destinationsService
      .getAllDestinations()
      .then((data) => setTotalDestinationsCount((data || []).length))
      .catch((err) => console.error("Failed to load total destination count:", err))
      .finally(() => setLoadingTotalDestinations(false));
  }, []);

  // ─── Category filter click → destinations refetch ───
  const handleCategoryClick = (categoryValue) => {
    const nextCategory = activeCategory === categoryValue ? null : categoryValue;
    setActiveCategory(nextCategory);
    setLoadingDestinations(true);

    destinationsService
      .getAllDestinations(nextCategory ? { category: nextCategory } : {})
      .then((data) => setDestinations(data || []))
      .catch((err) => console.error("Failed to filter destinations:", err))
      .finally(() => setLoadingDestinations(false));
  };

  const handleSubscribe = () => {
    // 🚨 TODO: Backend eke newsletter subscribe endpoint එකක් තියෙනවනම් මෙතන connect කරන්න
    if (!email) return;
    console.log("Subscribe email:", email);
    setEmail("");
  };

  return (
    <div>
      {/* ══════════════════════════ HERO SECTION ══════════════════════════ */}
      <div
        className="relative flex flex-col items-center justify-center w-full min-h-screen px-4 overflow-hidden text-center bg-center bg-cover"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(4,20,14,0.62) 0%, rgba(4,20,14,0.32) 45%, rgba(4,20,14,0.8) 100%), url(${heroImage})`,
        }}
      >
        {/*
        <div className="absolute top-8 bg-black/40 border border-yellow-500/30 backdrop-blur-sm text-xs text-stone-300 px-4 py-1.5 rounded-full flex items-center gap-1.5 tracking-wide animate-fade-in-up">
          <span className="text-sm text-yellow-500">🤖</span>
          <span>
            Powered by <span className="font-semibold text-white">GPT-4o AI</span>
          </span>
          <span className="text-yellow-500">★</span>
        </div>
        */}

        <div className="flex flex-col items-center max-w-4xl mx-auto mt-12 space-y-6">
          <h1
            className="text-5xl font-bold leading-tight tracking-tight text-white md:text-8xl drop-shadow-md animate-fade-in-up"
            style={{ animationDelay: "0.08s" }}
          >
            Discover Sri Lanka
          </h1>
          <h2
            className="text-3xl font-bold tracking-wide md:text-5xl text-amber-500 drop-shadow-md animate-fade-in-up"
            style={{ animationDelay: "0.18s" }}
          >
            Like Never Before
          </h2>
          <p
            className="max-w-xl mt-2 text-sm font-medium leading-relaxed md:text-base text-stone-200 animate-fade-in-up"
            style={{ animationDelay: "0.28s" }}
          >
            AI-powered travel planning with real local data. <br />
            <span className="opacity-90">
              From ancient kingdoms to hidden beaches — your perfect Sri Lanka trip starts here.
            </span>
          </p>

          <div
            className="flex flex-col items-center w-full gap-4 pt-6 sm:flex-row sm:w-auto animate-fade-in-up"
            style={{ animationDelay: "0.38s" }}
          >
            <button
              onClick={() => navigate("/trips/new")}
              className="w-full sm:w-auto bg-emerald-700 hover:bg-emerald-600 text-white font-medium px-8 py-3.5 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-lg hover:shadow-emerald-900/40 hover:-translate-y-0.5 text-sm md:text-base"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M5 2a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0V6H3a1 1 0 110-2h1V3a1 1 0 011-1zm12 7a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1zm-11 2.5a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75h-.01a.75.75 0 01-.75-.75v-.01zm4-7.5a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75h-.01a.75.75 0 01-.75-.75V7zm3.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1l7-7a1 1 0 000-1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Generate AI Trip — Free
            </button>

            <Link
              to="/destinations"
              className="w-full sm:w-auto bg-white hover:bg-stone-100 text-emerald-900 font-semibold px-8 py-3.5 rounded-lg transition-all duration-200 shadow-lg hover:-translate-y-0.5 text-sm md:text-base border border-stone-200 text-center block"
            >
              Browse Destinations
            </Link>
          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute z-10 hidden -translate-x-1/2 sm:block left-1/2 bottom-24 animate-bounce">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>

      </div>

      {/* ══════════════════════════ STATS + JOIN CARD ══════════════════════════ */}
      <div className="px-4 py-14 sm:py-16 bg-[#1A2035]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">We only deliver results.</h2>
          <p className="mt-1 text-sm text-stone-400">No icons — just the numbers that matter.</p>

          {statsLoading ? (
            <div className="py-10 text-stone-500">Loading stats...</div>
          ) : (
            <div className="grid grid-cols-2 mt-8 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
              <div>
                <div ref={destRef} className="text-4xl font-extrabold text-white tabular-nums">{destCount}</div>
                <div className="mt-2 text-sm font-semibold text-white">Destinations</div>
                <div className="text-xs text-stone-400">Across Sri Lanka.</div>
              </div>
              <div>
                <div ref={gemRef} className="text-4xl font-extrabold text-white tabular-nums">{gemCount}</div>
                <div className="mt-2 text-sm font-semibold text-white">Hidden gems</div>
                <div className="text-xs text-stone-400">Off the beaten path.</div>
              </div>
              <div>
                <div ref={guideRef} className="text-4xl font-extrabold text-white tabular-nums">{guideCount}</div>
                <div className="mt-2 text-sm font-semibold text-white">Expert guides</div>
                <div className="text-xs text-stone-400">Local, licensed pros.</div>
              </div>
              <div>
                <div ref={vehicleRef} className="text-4xl font-extrabold text-white tabular-nums">{vehicleCountDisplay}</div>
                <div className="mt-2 text-sm font-semibold text-white">Local vehicles</div>
                <div className="text-xs text-stone-400">Well-maintained fleet.</div>
              </div>
              <div>
                <div ref={userRef} className="text-4xl font-extrabold text-amber-400 tabular-nums">
                  {new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(userCountDisplay)}+
                </div>
                <div className="mt-2 text-sm font-semibold text-white">Total users</div>
                <div className="text-xs text-stone-400">Travelers served.</div>
              </div>
            </div>
          )}

          {!isAuthenticated && (
            <div className="flex flex-col items-start justify-between gap-5 pt-8 mt-10 border-t border-white/10 sm:flex-row sm:items-center">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center flex-shrink-0 rounded-xl w-11 h-11 bg-blue-400/15">
                  <Users className="w-5 h-5 text-blue-300" />
                </div>
                <div>
                  <div className="text-base font-bold text-white">Join with us</div>
                  <p className="mt-0.5 text-sm text-stone-400">Create a free account to save trips and book faster.</p>
                </div>
              </div>
              <Link
                to="/register"
                className="flex items-center justify-center w-full gap-1.5 px-5 py-2.5 text-sm font-semibold text-center transition-colors rounded-full sm:w-auto bg-blue-400 text-slate-900 hover:bg-blue-300 whitespace-nowrap"
              >
                Register free →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════ FEATURED DESTINATIONS ══════════════════════════ */}
      <div className="px-4 py-16 mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <p className="mb-1 text-xs font-bold tracking-widest text-emerald-700">EXPLORE SRI LANKA</p>
            <h2 className="text-3xl font-bold text-stone-900 sm:text-4xl">Featured Destinations</h2>
            <p className="mt-1 text-sm text-stone-500">Hand-picked Sri Lanka's finest travel destinations</p>
          </div>
          <Link to="/destinations" className="flex items-center text-sm font-semibold text-emerald-700 hover:text-emerald-800">
            View All Destinations <span className="ml-1">›</span>
          </Link>
        </div>

        {loadingDestinations ? (
          <div className="py-12 text-center text-stone-400">Loading destinations...</div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {destinations.slice(0, 4).map((dest) => (
              <DestinationCard
                key={dest.id}
                destination={dest}
                onExplore={(d) => navigate(`/destinations/${d.id}`)}
              />
            ))}
          </div>
        )}

        {/* Category filter pills */}
        <div className="flex flex-wrap gap-3 mt-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => handleCategoryClick(cat.value)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                activeCategory === cat.value
                  ? "bg-emerald-700 text-white border-emerald-700"
                  : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
              }`}
            >
              <span>{cat.emoji}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════ AI TRIP PLANNER PROMO ══════════════════════════ */}
      <div className="relative px-4 py-16 overflow-hidden bg-emerald-900">
        <div className="absolute rounded-full pointer-events-none -top-24 -right-24 w-96 h-96 bg-amber-500/10 blur-3xl" />
        <div className="absolute rounded-full pointer-events-none -bottom-32 -left-24 w-96 h-96 bg-emerald-400/10 blur-3xl" />
        <div className="relative z-10 grid items-center max-w-6xl grid-cols-1 gap-10 mx-auto lg:grid-cols-2">
          <div>
            <div className="flex items-center justify-center w-12 h-12 mb-6 bg-white/10 rounded-xl">🤖</div>
            <h2 className="text-4xl font-bold leading-tight text-white md:text-5xl">
              Let AI Plan Your Perfect <span className="text-amber-500">Sri Lanka Trip</span>
            </h2>
            <p className="max-w-lg mt-4 text-sm leading-relaxed text-stone-200 md:text-base">
              Tell us your travel style, budget and interests. Our GPT-4o AI builds a day-by-day itinerary using
              real destinations, local guides and hidden gems — monsoon-aware, geography-optimized.
            </p>

            <div className="flex flex-wrap gap-2 mt-6">
              {["Real Sri Lanka data", "Monsoon aware", "Hidden gems included", "Festival calendar", "Budget tracking", "Guide booking"].map(
                (tag) => (
                  <span key={tag} className="px-3 py-1.5 text-xs font-medium text-white border rounded-full bg-white/10 border-white/20">
                    ✓ {tag}
                  </span>
                )
              )}
            </div>

            <div className="flex flex-col gap-3 mt-8 sm:flex-row">
              <button
                onClick={() => navigate("/trips/new")}
                className="px-6 py-3 text-sm font-semibold rounded-lg bg-amber-500 text-emerald-950 hover:bg-amber-400"
              >
                🚀 Generate My Trip with AI →
              </button>
            </div>
            <p className="mt-3 text-xs text-stone-400">Free to use • No credit card required</p>
          </div>

          {/* Preview card (static mock — real preview backend eken generate wenne trip create karapu passe) */}
          <div className="flex items-center justify-center lg:justify-end">
            <div
              className="p-4 bg-white shadow-2xl rounded-2xl w-full max-w-xs transition-transform hover:rotate-0"
              style={{ transform: "rotate(3deg)" }}
            >
              <div className="flex items-center gap-2 pb-3 mb-3 border-b border-stone-100">
                <span className="flex items-center justify-center w-8 h-8 text-white rounded-lg bg-emerald-700">🎒</span>
                <div>
                  <div className="text-sm font-bold text-stone-900">AI Generated Trip</div>
                  <div className="text-xs text-stone-400">"7-Day Adventure"</div>
                </div>
              </div>
              <div className="space-y-2 text-xs">
                {[
                  ["Day 1", "Colombo — Arrival"],
                  ["Day 2", "Sigiriya Rock Climb"],
                  ["Day 3", "Kandy Cultural Tour"],
                  ["Day 4", "Train to Ella 🚂"],
                  ["Day 5", "Ella Rock Hike"],
                  ["Day 6", "Yala Safari 🐆"],
                  ["Day 7", "Galle Fort Tour"],
                ].map(([day, plan]) => (
                  <div key={day} className="flex items-center gap-2 py-1.5 border-b border-stone-50">
                    <span className="px-2 py-0.5 font-semibold rounded bg-emerald-50 text-emerald-700">{day}</span>
                    <span className="text-stone-600">{plan}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-3 mt-3 text-xs border-t border-stone-100">
                <span className="text-stone-500">💰 Est. Budget</span>
                <span className="font-bold text-stone-900">$980</span>
              </div>
              <div className="px-3 py-2 mt-2 text-xs rounded-lg bg-amber-50 text-amber-700">
                ⚠️ Monsoon: East coast safe
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════ POPULAR TOUR GUIDES ══════════════════════════ */}
      <div className="px-4 py-16 mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <p className="mb-1 text-xs font-bold tracking-widest text-emerald-700">MEET THE EXPERTS</p>
            <h2 className="text-3xl font-bold text-stone-900 sm:text-4xl">Popular Tour Guides</h2>
            <p className="mt-1 text-sm text-stone-500">Verified local experts ready to guide your adventure</p>
          </div>
          <Link to="/guides" className="flex items-center text-sm font-semibold text-emerald-700 hover:text-emerald-800">
            Browse All {guides.length || 8} Guides <span className="ml-1">›</span>
          </Link>
        </div>

        {loadingGuides ? (
          <div className="py-12 text-center text-stone-400">Loading guides...</div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {guides.slice(0, 3).map((guide) => (
              <div key={guide.id} className="flex flex-col items-center gap-4 p-5 text-center bg-white border shadow-sm rounded-xl border-stone-100 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 sm:flex-row sm:text-left">
                <img
                  src={guide.photoUrl}
                  alt={guide.fullName}
                  loading="lazy"
                  className="object-cover rounded-full shrink-0 w-16 h-16"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://placehold.co/100x100?text=" + encodeURIComponent((guide.fullName || "G")[0]);
                  }}
                />
                <div className="flex-1 w-full min-w-0">
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    <h3 className="font-bold break-words text-stone-900">{guide.fullName}</h3>
                    {guide.verified !== false && (
                      <span className="px-2 py-0.5 text-3xs font-semibold text-emerald-700 bg-emerald-50 rounded-full whitespace-nowrap">
                        ✓ Verified
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-emerald-700">
                    {Array.isArray(guide.specialties)
                      ? guide.specialties.join(" & ")
                      : guide.specialties || guide.specialty || ""}
                  </p>
                  <p className="mt-1 text-xs text-stone-500">⭐ {guide.rating}</p>
                  <p className="text-xs text-stone-400">📍 {guide.district}</p>
                  <div className="flex flex-wrap items-center justify-center gap-2 mt-3 sm:justify-between">
                    <span className="text-sm font-bold text-stone-900">${guide.pricePerDay ?? guide.price}/day</span>
                    <button
                      onClick={() => navigate(`/guides/${guide.id}`)}
                      className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg bg-emerald-700 hover:bg-emerald-600 whitespace-nowrap"
                    >
                      Book Guide →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══════════════════════════ UPCOMING EVENTS ══════════════════════════ */}
      <div className="px-4 py-16 bg-stone-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="flex items-center gap-2 text-2xl font-bold text-stone-900">
                📅 Upcoming Sri Lanka Events
              </h2>
              <p className="mt-1 text-sm text-stone-500">Plan around festivals and seasons</p>
            </div>
            <Link to="/events" className="flex items-center text-sm font-semibold text-emerald-700 hover:text-emerald-800">
              View Full Calendar <span className="ml-1">›</span>
            </Link>
          </div>

          {loadingEvents ? (
            <div className="py-12 text-center text-stone-400">Loading events...</div>
          ) : (
            <div className="flex gap-4 pb-2 overflow-x-auto">
              {events.map((ev) => (
                <div key={ev.id} className="min-w-[220px] bg-white rounded-xl border border-stone-100 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
                  <div className="relative h-28">
                    <img
                      src={ev.imageUrls?.[0]}
                      alt={ev.title}
                      loading="lazy"
                      className="object-cover w-full h-full"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://placehold.co/400x200?text=" + encodeURIComponent(ev.title || "Event");
                      }}
                    />
                    <span className="absolute px-2 py-0.5 text-3xs font-semibold rounded-full top-2 left-2 bg-white/90 text-stone-700">
                      {ev.category}
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-stone-400">
                        {ev.startDate ? new Date(ev.startDate).toLocaleDateString("en-US", { month: "short" }) : ""}
                      </span>
                    </div>
                    <h3 className="mb-1 text-sm font-bold text-stone-900">{ev.title}</h3>
                    <p className="mb-1 text-xs text-stone-500">📍 {ev.location || ev.region}</p>
                    <p className="mb-3 text-xs text-stone-400">📆 {formatEventRange(ev.startDate, ev.endDate)}</p>
                    <button
                      onClick={() => navigate(`/trips/new?eventId=${ev.id}`)}
                      className="w-full py-1.5 text-xs font-semibold border rounded-lg text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                    >
                      + Add to Trip
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════ WHY CHOOSE EXPLORECEYLON ══════════════════════════ */}
      <div className="px-4 py-16 mx-auto text-center max-w-7xl">
        <h2 className="text-3xl font-bold text-stone-900 sm:text-4xl">Why Choose ExploreCeylon?</h2>
        <p className="mt-1 mb-10 text-sm text-stone-500">The smartest way to explore Sri Lanka</p>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { emoji: "🤖", title: "AI Trip Planner", desc: "GPT-4o generates personalized day-by-day itineraries using real Sri Lanka destination data" },
            { emoji: "💎", title: "Hidden Gems", desc: `Discover ${gems.length || 15}+ curated off-the-beaten-path locations that most tourists never find` },
            { emoji: "🧑‍💼", title: "Verified Local Guides", desc: `${guides.length || 8} expert guides covering wildlife, culture, trekking, food and photography` },
            { emoji: "💰", title: "Smart Budget Tracker", desc: "Track every expense automatically. Multi-currency support with real-time spending alerts" },
          ].map((item) => (
            <div key={item.title} className="p-6 text-left bg-stone-50 rounded-xl transition-all duration-200 hover:bg-white hover:shadow-lg hover:-translate-y-0.5">
              <div className="mb-3 text-3xl">{item.emoji}</div>
              <h3 className="mb-2 font-bold text-stone-900">{item.title}</h3>
              <p className="text-xs leading-relaxed text-stone-500">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-3 mt-10">
          {["🛡️ Secure Booking", "⭐ 4.8 Rated", "✅ Verified Guides", "🧭 Local Expertise", "🌐 Safe Payments", "🤖 AI Powered"].map((badge) => (
            <span key={badge} className="px-4 py-2 text-xs font-medium border rounded-full text-stone-600 border-stone-200">
              {badge}
            </span>
          ))}
        </div>
      </div>

      {/* ══════════════════════════ HIDDEN GEMS ══════════════════════════ */}
      <div className="relative px-4 py-20 overflow-hidden bg-[#1A2035]">
        <div className="absolute rounded-full pointer-events-none top-1/2 -right-32 w-96 h-96 bg-amber-500/10 blur-3xl" />
        <div className="relative z-10 grid items-center max-w-6xl grid-cols-1 gap-10 mx-auto lg:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-bold tracking-widest text-amber-500">HIDDEN GEMS</p>
            <h2 className="text-4xl font-bold leading-tight text-white">
              Discover Sri Lanka's <span className="text-amber-500">Best Kept Secrets</span>
            </h2>
            <p className="max-w-lg mt-4 text-sm leading-relaxed text-stone-300">
              {gems.length || 15} lesser-known destinations curated by locals. From secret waterfalls to hidden
              beaches — places guidebooks don't mention.
            </p>

            <div className="flex flex-wrap gap-2 mt-6">
              {topGems.map((gem) => (
                <span key={gem.id} className="px-3 py-1.5 text-xs font-medium text-white border rounded-full bg-white/10 border-white/20">
                  {gem.emoji || "💎"} {gem.title} · ⭐ {gem.rating}
                </span>
              ))}
            </div>

            <button
              onClick={() => navigate("/hidden-gems")}
              className="flex items-center gap-2 px-6 py-3 mt-8 text-sm font-semibold text-white rounded-lg bg-emerald-700 hover:bg-emerald-600"
            >
              💎 Explore Hidden Gems →
            </button>
          </div>

          {loadingGems ? (
            <div className="text-center text-stone-400">Loading hidden gems...</div>
          ) : (
            <div className="relative hidden lg:block h-80">
              {topGems.map((gem, i) => {
                const rotations = [-8, 4, -3];
                const positions = [
                  { top: "10px", left: "10px" },
                  { top: "70px", left: "150px" },
                  { top: "140px", left: "60px" },
                ];
                return (
                  <div
                    key={gem.id}
                    className="absolute w-48 overflow-hidden transition-transform bg-white shadow-2xl rounded-2xl hover:z-50 hover:rotate-0"
                    style={{
                      ...positions[i],
                      transform: `rotate(${rotations[i]}deg)`,
                      zIndex: i + 1,
                    }}
                  >
                    <img
                      src={gem.imageUrls?.[0]}
                      alt={gem.title}
                      loading="lazy"
                      className="object-cover w-full h-32"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://placehold.co/300x200?text=" + encodeURIComponent(gem.title || "Gem");
                      }}
                    />
                    <div className="p-3">
                      <div className="text-sm font-bold truncate text-stone-900">{gem.title}</div>
                      <div className="text-xs text-stone-400">
                        {gem.district} · <span className="text-amber-500">⭐</span> {gem.rating}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════ FINAL CTA ══════════════════════════ */}
      <div className="relative px-4 py-20 overflow-hidden text-center bg-white">
        <div className="absolute -translate-x-1/2 rounded-full pointer-events-none top-0 left-1/2 w-[32rem] h-96 bg-amber-100/40 blur-3xl" />

        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-stone-900 sm:text-4xl">Start Your Sri Lanka Adventure</h2>
          <p className="mt-2 text-sm text-stone-500">Join 1,200+ travelers who planned their trip with ExploreCeylon</p>

          <div className="flex flex-col items-center justify-center gap-3 mt-8 sm:flex-row">
            <button
              onClick={() => navigate("/trips/new")}
              className="flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-lg bg-amber-500 text-emerald-950 transition-all duration-200 hover:bg-amber-400 hover:-translate-y-0.5 shadow-lg"
            >
              🚀 Generate AI Trip — Free
            </button>
            <button
              onClick={() => navigate("/destinations")}
              className="px-6 py-3 text-sm font-semibold transition-colors border rounded-lg text-emerald-700 border-emerald-200 hover:bg-emerald-50"
            >
              Browse Destinations
            </button>
          </div>

          <div className="flex flex-col items-center justify-center gap-2 mt-8 sm:flex-row">
            <label htmlFor="newsletter-email" className="sr-only">Email address</label>
            <input
              id="newsletter-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="📧 Enter your email for travel tips..."
              className="w-full sm:w-72 px-4 py-2.5 text-sm text-stone-900 bg-white border border-stone-200 rounded-lg outline-none placeholder:text-stone-400 focus:border-emerald-500"
            />
            <button
              onClick={handleSubscribe}
              className="w-full sm:w-auto px-5 py-2.5 text-sm font-semibold rounded-lg bg-amber-500 text-emerald-950 hover:bg-amber-400 transition-colors"
            >
              Subscribe →
            </button>
          </div>
          <p className="mt-2 text-xs text-stone-400">No spam. Unsubscribe anytime.</p>
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect, useCallback, useMemo, Component } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, ChevronDown } from "lucide-react";
import { searchHotels } from "../services/Hotelservice";
import HotelDetailsPanel from "../components/HotelDetailsPanel";
import ShowMoreButton from "../components/ShowMoreButton";
import { useShowMore } from "../hooks/useShowMore";
import { buildBookingComUrl } from "../utils/hotelLinks";
import { useRequireAuth } from "../hooks/useRequireAuth";
import bannerImage from "../assets/Banner.jpg";

// ============================================================================
// ERROR BOUNDARY FOR HOTEL RESULTS
// ============================================================================
class HotelResultsErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Hotel list rendering error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center bg-white rounded-2xl border border-rose-100 shadow-sm my-4">
          <span className="text-3xl mb-2 block">⚠️</span>
          <h3 className="text-base font-bold text-slate-800">Couldn't load some hotel details</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">An unexpected issue occurred while displaying the hotel results.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 text-xs font-bold bg-emerald-800 text-white rounded-xl hover:bg-emerald-900"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ============================================================================
// 1. REUSABLE HOTEL CARD COMPONENT
// ============================================================================
function HotelCard({ hotel, nightsCount = 1, searchParams, onViewDetails }) {
  const price = typeof hotel?.pricePerNight === "number" ? hotel.pricePerNight : 0;
  const nights = typeof nightsCount === "number" && nightsCount > 0 ? nightsCount : 1;
  const calculatedTotalPrice = (price * nights).toFixed(2);
  const requireAuth = useRequireAuth();

  const handleBookNow = () => {
    requireAuth(
      () =>
        window.open(
          buildBookingComUrl(hotel, searchParams),
          "_blank",
          "noopener,noreferrer",
        ),
      {
        title: "Sign in to book",
        message: "Please sign in or create a free account to book this hotel.",
      },
    );
  };

  const photo =
    hotel?.photoUrl ||
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=600&auto=format&fit=crop";
  const starsCount = Math.max(0, Math.min(5, Number(hotel?.stars) || 0));

  return (
    <div className="flex flex-col w-full mb-4 overflow-hidden transition-all duration-300 bg-white border border-slate-100 shadow-sm md:flex-row rounded-2xl hover:shadow-xl group">
      {/* Left Side: Image Section */}
      <div className="relative w-full h-52 bg-slate-100 md:w-72 md:h-auto shrink-0 overflow-hidden">
        <img
          src={photo}
          alt={hotel?.name || "Hotel"}
          className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            e.target.src =
              "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=600&auto=format&fit=crop";
          }}
        />
        {/* Badges Container */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[90%] z-10">
          {Boolean(hotel?.isLocalPick || hotel?.localPick) && (
            <span className="bg-emerald-900/90 backdrop-blur-md text-amber-300 text-3xs font-extrabold tracking-wider px-2.5 py-1 rounded-lg flex items-center shadow-md border border-amber-300/30">
              ★ LOCAL PICK
            </span>
          )}
          {hotel?.propertyType && (
            <span className="bg-amber-500 text-white text-3xs font-bold tracking-wider px-2.5 py-1 rounded-lg shadow-md">
              {hotel.propertyType}
            </span>
          )}
        </div>
      </div>

      {/* Middle Section: Content Area */}
      <div className="flex flex-col justify-between flex-1 p-5 sm:p-6">
        <div>
          {/* Title & Stars */}
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 group-hover:text-emerald-800 transition-colors">
                {hotel.name}
              </h3>
              {hotel.stars > 0 && (
                <div className="flex items-center text-amber-400 text-xs mt-1 space-x-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i}>{i < hotel.stars ? "★" : "☆"}</span>
                  ))}
                  <span className="ml-1.5 text-xs font-semibold text-slate-400">
                    {hotel.stars} Star Stay
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Rating Row */}
          {hotel.reviewScore > 0 && (
            <div className="flex items-center mt-3 space-x-2">
              <span className="bg-emerald-800 text-white font-extrabold text-xs px-2.5 py-0.5 rounded-lg shadow-xs">
                {hotel.reviewScore}
              </span>
              {hotel.reviewScoreWord && (
                <span className="text-sm font-bold text-slate-800">
                  {hotel.reviewScoreWord}
                </span>
              )}
              {hotel.reviewsCount > 0 && (
                <span className="text-xs font-medium text-slate-400">
                  ({hotel.reviewsCount} verified reviews)
                </span>
              )}
            </div>
          )}

          {/* Amenities Pills */}
          {hotel.amenities && hotel.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {hotel.amenities.slice(0, 5).map((amenity, index) => (
                <span
                  key={index}
                  className="bg-emerald-50/80 text-emerald-950 text-xs font-semibold px-2.5 py-1 rounded-md border border-emerald-100/60"
                >
                  {amenity}
                </span>
              ))}
              {hotel.amenities.length > 5 && (
                <span className="bg-slate-50 text-slate-400 text-xs font-medium px-2.5 py-1 rounded-md">
                  +{hotel.amenities.length - 5} more
                </span>
              )}
            </div>
          )}

          {/* Address */}
          {hotel.address && (
            <p className="mt-3 text-xs font-medium leading-relaxed text-slate-500 line-clamp-2">
              📍 {hotel.address}
            </p>
          )}
        </div>

        {/* Location & Cancellation Details */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 mt-4 text-xs font-semibold border-t border-slate-100">
          {hotel.distanceFromCenterKm != null ? (
            <div className="flex items-center text-slate-500">
              <span className="mr-1">🗺️</span>
              <span>
                {hotel.distanceFromCenterKm.toFixed(1)} km from city center
              </span>
            </div>
          ) : (
            <span />
          )}
          {hotel.freeCancellationUntil ? (
            <div className="flex items-center text-emerald-700">
              <span className="mr-1 font-bold">✓</span>
              <span>Free cancellation until {hotel.freeCancellationUntil}</span>
            </div>
          ) : (
            <div className="flex items-center text-rose-500">
              <span className="mr-1 font-bold">✕</span>
              <span>Non-refundable</span>
            </div>
          )}
        </div>
      </div>

      {/* Right Side: Pricing & Actions */}
      <div className="flex flex-row items-center justify-between w-full p-5 border-t border-slate-100 md:w-52 md:border-t-0 md:border-l md:flex-col md:justify-center shrink-0 bg-slate-50/50 md:bg-white">
        <div className="w-full text-left md:text-right md:mb-5">
          <div className="flex items-baseline md:justify-end">
            <span className="text-2xl font-black text-slate-900">
              {hotel.currency} {hotel.pricePerNight}
            </span>
            <span className="ml-1 text-xs font-semibold text-slate-400">
              /night
            </span>
          </div>
          <div className="text-xs font-extrabold text-emerald-900 mt-0.5">
            {hotel.currency} {calculatedTotalPrice} total
          </div>
          <div className="font-medium text-slate-400 text-3xs">
            ({nightsCount} {nightsCount === 1 ? "night" : "nights"})
          </div>
        </div>

        <div className="flex w-auto gap-2 md:flex-col md:w-full shrink-0">
          <button
            onClick={() => onViewDetails(hotel)}
            className="px-4 py-2.5 text-xs font-bold transition-all border border-emerald-800/30 text-emerald-900 hover:bg-emerald-50 rounded-xl whitespace-nowrap text-center"
          >
            View Details →
          </button>
          <button
            onClick={handleBookNow}
            className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all whitespace-nowrap shadow-sm hover:shadow-md text-center"
          >
            Book Now ↗
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 2. MAIN HOTELS PAGE COMPONENT
// ============================================================================
export default function HotelsPage() {
  const navigate = useNavigate();

  // --- Search Bar Controlled States (Empty/Placeholder defaults) ---
  const [location, setLocation] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [adults, setAdults] = useState("1 Adult");
  const [rooms, setRooms] = useState("1 Room");

  // --- Extract numeric counts in component scope for cards, details & API calls ---
  const adultsCount = useMemo(() => parseInt(adults.split(" ")[0], 10) || 1, [adults]);
  const roomsCount = useMemo(() => parseInt(rooms.split(" ")[0], 10) || 1, [rooms]);

  // --- Live Data States ---
  const [allHotels, setAllHotels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // --- Details Panel State ---
  const [selectedHotel, setSelectedHotel] = useState(null);

  // --- Sidebar Filter States ---
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [maxPrice, setMaxPrice] = useState(500);
  const [stars, setStars] = useState({
    5: false,
    4: false,
    3: false,
    2: false,
    1: false,
  });
  const [guestRating, setGuestRating] = useState("");
  const [localPicksOnly, setLocalPicksOnly] = useState(false);

  // --- View & Sort States ---
  const [viewType, setViewType] = useState("List");
  const [sortBy, setSortBy] = useState("Best Match");

  // --- DYNAMIC CALCULATION FOR NIGHTS COUNT ---
  const calculateNights = (start, end) => {
    if (!start || !end) return 1;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const differenceInTime = endDate.getTime() - startDate.getTime();
    const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));
    return differenceInDays > 0 ? differenceInDays : 1;
  };

  const nightsCount = calculateNights(checkIn, checkOut);

  // --- DYNAMIC DATE FORMATTING FOR TEXT (e.g., "Jul 17 – Jul 19") ---
  const formatDateText = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // ══════════════════════════════════════════════════════════════
  // INITIAL UNFILTERED LOAD — Fetches ALL hotels across Sri Lanka on mount
  // ══════════════════════════════════════════════════════════════
  const loadInitialHotels = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      // Fresh, unfiltered initial hotel listing across Sri Lanka
      const results = await searchHotels({
        location: "Sri Lanka",
        currency: "USD",
      });
      setAllHotels(Array.isArray(results) ? results : []);
    } catch (err) {
      console.error("Failed to load hotels:", err);
      setErrorMessage("Unable to load hotels. Please try again.");
      setAllHotels([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Run initial load ONCE on mount — never auto-filters from search bar state
  useEffect(() => {
    loadInitialHotels();
  }, [loadInitialHotels]);

  // ══════════════════════════════════════════════════════════════
  // EXPLICIT SEARCH HANDLER — Only triggers when user clicks "Search"
  // ══════════════════════════════════════════════════════════════
  const handleSearch = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      // Sane fallback dates if user searched with empty date pickers (today + 14..16 days)
      let searchCheckin = checkIn;
      let searchCheckout = checkOut;
      if (!searchCheckin || !searchCheckout) {
        const today = new Date();
        const defaultIn = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
        const defaultOut = new Date(today.getTime() + 16 * 24 * 60 * 60 * 1000);
        searchCheckin = defaultIn.toISOString().split("T")[0];
        searchCheckout = defaultOut.toISOString().split("T")[0];
      }

      const results = await searchHotels({
        location: location?.trim() || "Sri Lanka",
        checkinDate: searchCheckin,
        checkoutDate: searchCheckout,
        adults: adultsCount,
        rooms: roomsCount,
        currency: "USD",
      });
      setAllHotels(Array.isArray(results) ? results : []);
    } catch (err) {
      console.error("Hotel search failed:", err);
      setErrorMessage("Unable to find hotels matching your search. Please try again.");
      setAllHotels([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter submit handler — filters are applied client-side on already-fetched data (see filteredHotels below)
  const handleApplyFilters = () => {
    // No-op trigger; filtering is reactive via filteredHotels. Kept for UX parity with the Apply button.
  };

  const handleClearAll = () => {
    setLocation("");
    setCheckIn("");
    setCheckOut("");
    setRooms("1 Room");
    setAdults("1 Adult");

    setMaxPrice(500);
    setStars({ 5: false, 4: false, 3: false, 2: false, 1: false });
    setGuestRating("");
    setLocalPicksOnly(false);
  };

  // ══════════════════════════════════════════════════════════════
  // CLIENT-SIDE FILTERING — only on fields the backend actually returns
  // ══════════════════════════════════════════════════════════════
  const anyStarSelected = Object.values(stars).some(Boolean);

  // Memoized so the list keeps a stable identity between renders —
  // usePagination resets to page 1 whenever this array changes, which is
  // exactly the filter/sort-changed signal we want (and nothing more).
  const sortedHotels = useMemo(() => {
    const filtered = allHotels.filter((hotel) => {
      if (hotel.pricePerNight > maxPrice) return false;
      if (anyStarSelected && !stars[hotel.stars]) return false;
      if (guestRating) {
        const minScore = parseInt(guestRating, 10); // '9+' -> 9, '8+' -> 8, '7+' -> 7
        if ((hotel.reviewScore || 0) < minScore) return false;
      }
      if (localPicksOnly && !hotel.isLocalPick) return false;
      return true;
    });

    // ══════════════════════════════════════════════════════════════
    // CLIENT-SIDE SORTING
    // ══════════════════════════════════════════════════════════════
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "Price: Low to High":
          return a.pricePerNight - b.pricePerNight;
        case "Price: High to Low":
          return b.pricePerNight - a.pricePerNight;
        case "Top Rated":
          return (b.reviewScore || 0) - (a.reviewScore || 0);
        default:
          return 0; // Best Match — keep backend's popularity order
      }
    });
  }, [
    allHotels,
    maxPrice,
    anyStarSelected,
    stars,
    guestRating,
    localPicksOnly,
    sortBy,
  ]);

  const {
    visibleItems: visibleHotels,
    hasMore,
    remainingCount,
    showMore,
  } = useShowMore(sortedHotels, {
    initialCount: 5,
    increment: 5,
    resetDeps: [
      maxPrice,
      anyStarSelected,
      stars,
      guestRating,
      localPicksOnly,
      sortBy,
      location,
    ],
  });

  return (
    <div className="w-full min-h-screen pb-12 font-sans bg-gray-100">
      {/* ══════════════════════════ HERO SECTION ══════════════════════════ */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-900 text-white py-10 sm:py-12 pb-20 sm:pb-24 px-4 sm:px-6 lg:px-8 shadow-xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-emerald-400 to-teal-400 opacity-60" />

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="max-w-4xl text-left space-y-2.5">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-400/30 bg-emerald-500/15 text-3xs font-extrabold uppercase tracking-widest text-emerald-300">
                <span>🏨</span> Premium Accommodation
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-snug">
              Find Your Perfect Stay in <span className="text-amber-300">Sri Lanka</span>
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-medium max-w-3xl">
              Discover boutique villas, beach resorts, and luxury heritage stays across all island districts with real-time availability.
            </p>

            <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs font-semibold text-emerald-200">
              <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                ✨ {allHotels.length} Stays Listed
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                📍 All Districts Covered
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Search Container Wrapper */}
      <div className="relative z-10 max-w-6xl px-4 mx-auto -mt-16">
        <div className="p-6 mb-8 bg-white shadow-xl rounded-2xl">
          {/* Main Search Grid */}
          <div className="grid items-center grid-cols-1 gap-3 md:grid-cols-12">
            {/* Location Input */}
            <div className="flex items-center p-3 transition-colors bg-white border border-gray-200 md:col-span-3 rounded-xl focus-within:border-emerald-600">
              <svg
                className="w-5 h-5 mr-2 text-gray-400 shrink-0"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full text-sm font-medium text-gray-700 bg-transparent outline-none"
                placeholder="Where are you going?"
              />
            </div>

            {/* Check-in Date Input */}
            <div className="flex items-center p-3 transition-colors bg-white border border-gray-200 md:col-span-2 rounded-xl focus-within:border-emerald-600">
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full min-w-0 max-w-full text-sm font-medium text-gray-700 bg-transparent outline-none cursor-pointer"
              />
            </div>

            {/* Check-out Date Input */}
            <div className="flex items-center p-3 transition-colors bg-white border border-gray-200 md:col-span-2 rounded-xl focus-within:border-emerald-600">
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full min-w-0 max-w-full text-sm font-medium text-gray-700 bg-transparent outline-none cursor-pointer"
              />
            </div>

            {/* Rooms Dropdown */}
            <div className="relative flex items-center p-3 transition-colors bg-white border border-gray-200 md:col-span-1.5 rounded-xl focus-within:border-emerald-600">
              <svg
                className="w-5 h-5 mr-2 text-gray-400 shrink-0"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              <select
                value={rooms}
                onChange={(e) => setRooms(e.target.value)}
                className="w-full pr-4 text-sm font-medium text-gray-700 bg-transparent outline-none appearance-none cursor-pointer"
              >
                <option value="1 Room">1 R</option>
                <option value="2 Rooms">2 R</option>
                <option value="3 Rooms">3 R</option>
              </select>
              <span className="absolute text-gray-400 pointer-events-none text-3xs right-2">
                ▼
              </span>
            </div>

            {/* Guests Dropdown */}
            <div className="relative flex items-center p-3 transition-colors bg-white border border-gray-200 md:col-span-2 rounded-xl focus-within:border-emerald-600">
              <svg
                className="w-5 h-5 mr-2 text-gray-400 shrink-0"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <select
                value={adults}
                onChange={(e) => setAdults(e.target.value)}
                className="w-full pr-4 text-sm font-medium text-gray-700 bg-transparent outline-none appearance-none cursor-pointer"
              >
                <option value="1 Adult">1 Adult</option>
                <option value="2 Adults">2 Adults</option>
                <option value="3 Adults">3 Adults</option>
                <option value="4 Adults">4 Adults</option>
              </select>
              <span className="absolute text-xs text-gray-400 pointer-events-none right-3">
                ▼
              </span>
            </div>

            {/* Search Button */}
            <div className="md:col-span-1.5">
              <button
                onClick={handleSearch}
                disabled={isLoading}
                className="w-full bg-emerald-800 hover:bg-emerald-900 disabled:opacity-60 text-white p-3 rounded-xl flex items-center justify-center transition-all shadow-md font-extrabold text-sm gap-1.5"
              >
                <svg
                  className="w-4 h-4 mr-1.5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <span>{isLoading ? "Searching..." : "Search"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Layout Grid Layout for Sidebar & Content Area */}
        <div className="grid items-start grid-cols-1 gap-8 lg:grid-cols-12">
          {/* --- SIDEBAR FILTERS PANEL --- */}
          <div className="w-full max-w-sm p-6 mx-auto bg-white shadow-md lg:col-span-4 rounded-2xl lg:mx-0">
            {/* Header (Clickable toggle on mobile/tablet, static on desktop) */}
            <div
              onClick={() => setIsFilterOpen((prev) => !prev)}
              className={`flex items-center justify-between cursor-pointer select-none lg:cursor-default transition-all ${
                isFilterOpen ? "mb-6" : "mb-0 lg:mb-6"
              }`}
            >
              <div className="flex items-center space-x-2 text-lg font-bold text-gray-800">
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  ></path>
                </svg>
                <span>Filter Results</span>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearAll();
                  }}
                  className="text-sm font-semibold transition-colors text-emerald-600 hover:text-emerald-800"
                >
                  Clear All
                </button>
                <ChevronDown
                  className={`w-5 h-5 text-gray-500 transition-transform duration-200 lg:hidden ${
                    isFilterOpen ? "rotate-180" : ""
                  }`}
                />
              </div>
            </div>

            {/* Collapsible Filter Body on Mobile/Tablet, Always Visible on Desktop */}
            <div className={`${isFilterOpen ? "block" : "hidden"} lg:block`}>
              {/* Price Per Night Component */}
              <div className="mb-6">
                <h3 className="mb-3 text-sm font-bold text-gray-800">
                  Price per Night
                </h3>
                <input
                  type="range"
                  min="0"
                  max="500"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-700"
                />
                <div className="flex items-center justify-between mt-2 text-xs font-medium text-gray-400">
                  <span>$0</span>
                  <span className="text-sm font-bold text-gray-800">
                    Max: ${maxPrice}
                  </span>
                  <span>$500</span>
                </div>
              </div>

              {/* Star Rating Component */}
              <div className="mb-6">
                <h3 className="mb-3 text-sm font-bold text-gray-800">
                  Star Rating
                </h3>
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((starCount) => (
                    <label
                      key={starCount}
                      className="flex items-center cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={stars[starCount] || false}
                        onChange={(e) =>
                          setStars({ ...stars, [starCount]: e.target.checked })
                        }
                        className="w-4 h-4 mr-3 border-gray-400 rounded cursor-pointer text-emerald-700 focus:ring-emerald-600 accent-emerald-700"
                      />
                      <div className="flex items-center mr-2 space-x-1 text-xs text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i}>{i < starCount ? "★" : "☆"}</span>
                        ))}
                      </div>
                      <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                        {starCount} Stars
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Guest Rating Component */}
              <div className="mb-6">
                <h3 className="mb-3 text-sm font-bold text-gray-800">
                  Guest Rating
                </h3>
                <div className="space-y-2">
                  {[
                    { id: "9+", label: "Superb (9+)", icon: "😍" },
                    { id: "8+", label: "Very Good (8+)", icon: "😊" },
                    { id: "7+", label: "Good (7+)", icon: "🙂" },
                  ].map((rating) => (
                    <button
                      key={rating.id}
                      type="button"
                      onClick={() =>
                        setGuestRating(guestRating === rating.id ? "" : rating.id)
                      }
                      className={`w-full flex items-center px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                        guestRating === rating.id
                          ? "border-emerald-600 bg-emerald-50/50 text-emerald-800"
                          : "border-gray-100 hover:border-gray-200 text-gray-700 bg-white"
                      }`}
                    >
                      <span className="mr-2 text-base">{rating.icon}</span>
                      {rating.label}
                    </button>
                  ))}
                </div>
              </div>

              <hr className="my-5 border-gray-100" />

              {/* Local Picks Toggle Option */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center space-x-1 text-sm font-bold text-gray-800">
                    <span className="text-sm text-amber-500">☆</span>
                    <span>Show Local Picks Only</span>
                  </div>
                  <p className="font-medium text-gray-400 text-2xs">
                    Recommended by ExploreCeylon
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setLocalPicksOnly(!localPicksOnly)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 focus:outline-none ${
                    localPicksOnly ? "bg-emerald-600" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                      localPicksOnly ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Apply Filters Button */}
              <button
                type="button"
                onClick={handleApplyFilters}
                className="w-full bg-[#115e3b] hover:bg-[#0c4a2e] text-white text-sm font-bold py-3.5 rounded-xl transition-colors shadow-md text-center"
              >
                Apply Filters
              </button>
            </div>
          </div>

          {/* Right Side: Main Hotel List Content Area */}
          <div ref={listRef} className="w-full space-y-6 lg:col-span-8">
            {/* Header Control Row */}
            <div className="flex flex-col w-full pt-2 pb-5 border-b border-gray-200 sm:flex-row sm:items-center sm:justify-between">
              {/* Left Side: Title, Sub-details */}
              <div className="space-y-3">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {isLoading
                      ? "Searching hotels..."
                      : `Showing ${sortedHotels.length} hotels in ${location?.trim() ? location : "Sri Lanka"}`}
                  </h2>
                  <p className="text-sm font-medium text-gray-500 mt-0.5">
                    {checkIn && checkOut ? (
                      <>
                        {formatDateText(checkIn)} – {formatDateText(checkOut)} •{" "}
                        {nightsCount} {nightsCount === 1 ? "night" : "nights"} •{" "}
                      </>
                    ) : (
                      <>All year round • </>
                    )}
                    {adults.toLowerCase()}
                  </p>
                </div>

                {/* Active Filter Badges */}
                {(anyStarSelected || guestRating || localPicksOnly) && (
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {anyStarSelected && (
                      <div className="flex items-center bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-md font-medium">
                        <span>★ Stars filtered</span>
                      </div>
                    )}
                    {guestRating && (
                      <div className="flex items-center bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-md font-medium">
                        <span>Rating {guestRating}</span>
                      </div>
                    )}
                    {localPicksOnly && (
                      <div className="flex items-center bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-md font-medium">
                        <span>★ Local Picks</span>
                      </div>
                    )}
                    <button
                      onClick={handleClearAll}
                      className="ml-1 font-semibold text-gray-500 transition-colors hover:text-gray-800"
                    >
                      Clear all
                    </button>
                  </div>
                )}
              </div>

              {/* Right Side: List/Map Controls & Sort Selector */}
              <div className="flex items-center self-start mt-4 space-x-4 sm:mt-0 sm:self-center">
                {/* List / Map Toggle Buttons */}
                <div className="flex items-center bg-white border border-gray-200 rounded-lg p-0.5 shadow-sm text-sm font-medium text-gray-600">
                  <button
                    onClick={() => setViewType("List")}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-colors ${
                      viewType === "List"
                        ? "bg-gray-100 text-gray-900 font-bold"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-xs">☰</span>
                    <span>List</span>
                  </button>
                  <button
                    onClick={() => setViewType("Map")}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-colors ${
                      viewType === "Map"
                        ? "bg-gray-100 text-gray-900 font-bold"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-xs">🗺️</span>
                    <span>Map</span>
                  </button>
                </div>

                {/* Sort Dropdown Selector */}
                <div className="flex items-center space-x-2 text-sm">
                  <span className="font-medium text-gray-400 whitespace-nowrap">
                    Sort:
                  </span>
                  <div className="relative border border-gray-200 rounded-xl bg-white px-3 py-2 shadow-sm font-semibold text-gray-800 min-w-[120px]">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full pr-5 text-xs bg-transparent outline-none appearance-none cursor-pointer"
                    >
                      <option value="Best Match">Best Match</option>
                      <option value="Price: Low to High">
                        Price: Low to High
                      </option>
                      <option value="Price: High to Low">
                        Price: High to Low
                      </option>
                      <option value="Top Rated">Top Rated</option>
                    </select>
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-3xs text-gray-400 pointer-events-none">
                      ▼
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ERROR STATE */}
            {errorMessage && (
              <div className="p-4 text-sm font-medium border text-rose-700 bg-rose-50 border-rose-200 rounded-xl">
                {errorMessage}
              </div>
            )}

            {/* LOADING STATE */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center w-full py-20 text-gray-400">
                <div className="w-8 h-8 mb-3 border-4 border-gray-200 rounded-full border-t-emerald-600 animate-spin" />
                <span className="text-sm font-medium">
                  Fetching live hotel rates...
                </span>
              </div>
            )}

            {/* EMPTY STATE */}
            {!isLoading && !errorMessage && sortedHotels.length === 0 && (
              <div className="flex flex-col items-center justify-center w-full py-20 text-center text-gray-400">
                <span className="mb-2 text-3xl">🏨</span>
                <span className="text-sm font-medium">
                  No hotels matched your search/filters.
                </span>
                <span className="text-xs">
                  Try widening your filters or searching a different location.
                </span>
              </div>
            )}

            {/* DYNAMIC HOTEL CARDS CONTAINER */}
            {!isLoading && sortedHotels.length > 0 && (
              <>
                <HotelResultsErrorBoundary>
                  <div className="flex flex-col w-full gap-4">
                    {visibleHotels.map((hotelItem) => (
                      <HotelCard
                        key={hotelItem.hotelId || hotelItem.name}
                        hotel={hotelItem}
                        nightsCount={nightsCount}
                        searchParams={{
                          checkIn,
                          checkOut,
                          adults: adultsCount,
                          rooms: roomsCount,
                        }}
                        onViewDetails={setSelectedHotel}
                      />
                    ))}
                  </div>
                </HotelResultsErrorBoundary>

                <ShowMoreButton
                  onClick={showMore}
                  hasMore={hasMore}
                  remainingCount={remainingCount}
                  buttonText="Show More Hotels"
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* HOTEL DETAILS PANEL — opens when "View Details" is clicked */}
      {selectedHotel && (
        <HotelDetailsPanel
          hotel={selectedHotel}
          nightsCount={nightsCount}
          searchParams={{
            checkIn,
            checkOut,
            adults: adultsCount,
            rooms: roomsCount,
          }}
          onClose={() => setSelectedHotel(null)}
        />
      )}
    </div>
  );
}

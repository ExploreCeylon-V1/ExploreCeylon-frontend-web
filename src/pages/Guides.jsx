import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, ChevronDown } from "lucide-react";
import guidesService from "../services/guidesService";
import bannerImage from "../assets/Banner.jpg";
import { SRI_LANKA_DISTRICTS } from "../components/SriLankaDistricts";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ShowMoreButton from "../components/ShowMoreButton";
import { useShowMore } from "../hooks/useShowMore";

const RATING_OPTIONS = [
  { value: 5, label: "★★★★★", sub: "5.0" },
  { value: 4, label: "★★★★☆", sub: "4.0+" },
  { value: 3, label: "★★★☆☆", sub: "3.0+" },
];

const SORT_OPTIONS = [
  { value: "rating_desc", label: "Highest Rated" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "reviews_desc", label: "Most Reviewed" },
];

const PLACEHOLDER_PHOTO =
  "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=200&q=60";

function MultiSelectDropdown({ title, options, selected, onChange, placeholder }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(search.toLowerCase()),
  );

  const toggleOption = (opt) => {
    if (selected.includes(opt)) {
      onChange(selected.filter((x) => x !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  return (
    <div className="mb-5">
      <p className="mb-1 text-sm font-semibold text-gray-700">{title}</p>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center justify-between w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white text-left text-gray-700 focus:outline-2 focus:outline-[#2D6A4F]"
      >
        <span className="truncate">
          {selected.length === 0
            ? placeholder
            : `${selected.length} selected (${selected.join(", ")})`}
        </span>
        <span className="ml-2 text-xs text-gray-400">{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <div className="mt-1 border border-gray-200 rounded-lg bg-white shadow-lg p-2 max-h-48 overflow-y-auto space-y-1 z-10 relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${title.toLowerCase()}...`}
            className="w-full border border-gray-200 rounded px-2 py-1 text-xs mb-1 focus:outline-none focus:border-[#2D6A4F]"
          />
          {filtered.length === 0 ? (
            <p className="text-xs text-gray-400 p-1">No options found</p>
          ) : (
            filtered.map((opt) => {
              const checked = selected.includes(opt);
              return (
                <label
                  key={opt}
                  className="flex items-center gap-2 px-2 py-1 rounded text-xs hover:bg-gray-50 cursor-pointer text-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleOption(opt)}
                    className="accent-[#2D6A4F]"
                  />
                  <span className="truncate">{opt}</span>
                </label>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

const Guides = () => {
  const navigate = useNavigate();
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [district, setDistrict] = useState("");
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [selectedSpecialties, setSelectedSpecialties] = useState([]);
  const [maxPrice, setMaxPrice] = useState(100);
  const [minRating, setMinRating] = useState(null);
  const [sortBy, setSortBy] = useState("rating_desc");
  const [viewMode, setViewMode] = useState("grid");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const dateRangeInvalid = Boolean(startDate && endDate && endDate < startDate);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (district) count++;
    if (selectedLanguages.length > 0) count++;
    if (selectedSpecialties.length > 0) count++;
    if (maxPrice < 100) count++;
    if (minRating) count++;
    if (startDate || endDate) count++;
    return count;
  }, [searchTerm, district, selectedLanguages, selectedSpecialties, maxPrice, minRating, startDate, endDate]);

  async function fetchGuides() {
    try {
      setLoading(true);
      setError(null);
      const hasRange = startDate && endDate && !dateRangeInvalid;
      const data = await guidesService.getAllGuides(
        hasRange ? { startDate, endDate } : {},
      );
      setGuides(data || []);
    } catch (err) {
      console.error("Failed to load guides:", err);
      setError("Could not load guides. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount/filter change
    fetchGuides();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  const languages = useMemo(() => {
    const all = guides.flatMap((g) =>
      (g.languages || "")
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean),
    );
    return Array.from(new Set(all)).sort();
  }, [guides]);

  const specialties = useMemo(() => {
    const all = guides.flatMap((g) =>
      (g.specialties || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    );
    return Array.from(new Set(all)).sort();
  }, [guides]);

  const filteredGuides = useMemo(() => {
    let result = [...guides];

    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      result = result.filter(
        (g) =>
          g.fullName?.toLowerCase().includes(term) ||
          g.specialties?.toLowerCase().includes(term) ||
          g.district?.toLowerCase().includes(term),
      );
    }

    if (district) {
      result = result.filter((g) => g.district === district);
    }

    if (selectedLanguages.length > 0) {
      result = result.filter((g) => {
        const gLangs = (g.languages || "")
          .split(",")
          .map((l) => l.trim())
          .filter(Boolean);
        return gLangs.some((l) => selectedLanguages.includes(l));
      });
    }

    if (selectedSpecialties.length > 0) {
      result = result.filter((g) => {
        const gSpecs = (g.specialties || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        return gSpecs.some((s) => selectedSpecialties.includes(s));
      });
    }

    result = result.filter((g) => (g.pricePerDay ?? 0) <= maxPrice);

    if (minRating) {
      result = result.filter((g) => (g.rating ?? 0) >= minRating);
    }

    switch (sortBy) {
      case "price_asc":
        result.sort((a, b) => (a.pricePerDay ?? 0) - (b.pricePerDay ?? 0));
        break;
      case "price_desc":
        result.sort((a, b) => (b.pricePerDay ?? 0) - (a.pricePerDay ?? 0));
        break;
      case "reviews_desc":
        result.sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0));
        break;
      case "rating_desc":
      default:
        result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
    }

    return result;
  }, [
    guides,
    searchTerm,
    district,
    selectedLanguages,
    selectedSpecialties,
    maxPrice,
    minRating,
    sortBy,
  ]);

  // Grid view is `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`; list view is a
  // single stacked column at every width. Swapping the toggle changes the
  // column map, so page size recomputes on the spot.
  const {
    visibleItems: visibleGuides,
    hasMore,
    remainingCount,
    showMore,
  } = useShowMore(filteredGuides, {
    initialCount: 5,
    increment: 5,
    resetDeps: [
      searchTerm,
      district,
      selectedLanguages,
      selectedSpecialties,
      maxPrice,
      minRating,
      sortBy,
      startDate,
      endDate,
      viewMode,
    ],
  });

  const handleClearAll = () => {
    setSearchTerm("");
    setDistrict("");
    setSelectedLanguages([]);
    setSelectedSpecialties([]);
    setMaxPrice(100);
    setMinRating(null);
    setSortBy("rating_desc");
    setStartDate("");
    setEndDate("");
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-100">
        {/* ══════════════════════════ HERO SECTION ══════════════════════════ */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-900 text-white py-10 sm:py-12 px-4 sm:px-6 lg:px-8 shadow-xl">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-emerald-400 to-teal-400 opacity-60" />

          <div className="relative z-10 max-w-7xl mx-auto">
            <div className="max-w-4xl text-left space-y-2.5">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-400/30 bg-emerald-500/15 text-3xs font-extrabold uppercase tracking-widest text-emerald-300">
                  <span>🧑‍💼</span> Certified Tour Experts
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-snug">
                Find Your Local Guide in <span className="text-amber-300">Sri Lanka</span>
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-medium max-w-3xl">
                Verified local tour guides specializing in wildlife, ancient heritage, trekking, street food & photography.
              </p>

              <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs font-semibold text-emerald-200">
                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                  ✨ {guides.length} Verified Guides
                </span>
                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                  🌐 Multi-Language Support
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Chat-before-payment notice */}
        <div className="px-6 py-3 bg-amber-50 border-y border-amber-200 sm:px-10">
          <p className="flex items-center gap-2 mx-auto text-sm max-w-7xl text-amber-800">
            <span className="text-base">💬</span>
            Chat with your guide on WhatsApp and confirm availability before you
            pay.
          </p>
        </div>

        <div className="px-4 py-6 mx-auto max-w-7xl sm:px-10 pb-14">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            {/* Filter sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky p-4 sm:p-5 bg-white rounded-2xl border border-slate-100 shadow-sm top-4">
                {/* Collapsible Mobile Toggle Header */}
                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between font-extrabold text-slate-900 text-sm sm:text-base cursor-pointer lg:cursor-default"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-800">🔍</span>
                    <span>Filter Guides</span>
                    {activeFilterCount > 0 && (
                      <span className="bg-emerald-100 text-emerald-900 border border-emerald-200 text-3xs font-extrabold px-2.5 py-0.5 rounded-full">
                        {activeFilterCount} Active
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold lg:hidden">
                    <span>{isMobileFilterOpen ? "Hide Filters" : "Show Filters"}</span>
                    <ChevronDown
                      size={18}
                      className={`transition-transform duration-300 ${
                        isMobileFilterOpen ? "rotate-180 text-emerald-800" : ""
                      }`}
                    />
                  </div>
                </button>

                {/* Collapsible Panel Content */}
                <div className={`mt-4 ${isMobileFilterOpen ? "block" : "hidden lg:block"}`}>
                  <p className="mb-2 text-sm font-semibold text-gray-700">
                    📅 Trip Dates
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-1">
                    <div>
                      <label className="block mb-1 text-xs text-gray-400">
                        From
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full min-w-0 max-w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-2 focus:outline-[#2D6A4F] focus:outline-offset-1"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-xs text-gray-400">
                        To
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        min={startDate || undefined}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full min-w-0 max-w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-2 focus:outline-[#2D6A4F] focus:outline-offset-1"
                      />
                    </div>
                  </div>
                  {dateRangeInvalid ? (
                    <p className="mb-4 text-xs text-red-600">
                      End date must be after start date.
                    </p>
                  ) : startDate && endDate ? (
                    <p className="mb-4 text-xs text-gray-500">
                      Showing guides free for these dates.{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setStartDate("");
                          setEndDate("");
                        }}
                        className="text-[#2D6A4F] font-semibold underline"
                      >
                        Clear
                      </button>
                    </p>
                  ) : (
                    <p className="mb-4 text-xs text-gray-400">
                      Set dates to only show available guides.
                    </p>
                  )}

                  <div className="relative mb-5">
                    <span className="absolute text-sm text-gray-500 -translate-y-1/2 left-3 top-1/2">
                      🔍
                    </span>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search guides by name, specialty..."
                      className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-2 focus:outline-[#2D6A4F] focus:outline-offset-1"
                    />
                  </div>

                  <p className="mb-2 text-sm font-semibold text-gray-700">
                    District
                  </p>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm mb-5 cursor-pointer focus:outline-2 focus:outline-[#2D6A4F] focus:outline-offset-1"
                  >
                    <option value="">All Districts</option>
                    {SRI_LANKA_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>

                  <MultiSelectDropdown
                    title="Language"
                    options={languages}
                    selected={selectedLanguages}
                    onChange={setSelectedLanguages}
                    placeholder="All Languages"
                  />

                  <MultiSelectDropdown
                    title="Specialty"
                    options={specialties}
                    selected={selectedSpecialties}
                    onChange={setSelectedSpecialties}
                    placeholder="All Specialties"
                  />

                  <p className="mb-2 text-sm font-semibold text-gray-700">
                    Max Price: ${maxPrice}/day
                  </p>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full mb-1 accent-[#2D6A4F]"
                  />
                  <div className="flex justify-between mb-5 text-xs text-gray-400">
                    <span>$0</span>
                    <span>$100/day</span>
                  </div>

                  <p className="mb-2 text-sm font-semibold text-gray-700">
                    Min Rating
                  </p>
                  <div className="flex gap-2 mb-5">
                    {RATING_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() =>
                          setMinRating(minRating === opt.value ? null : opt.value)
                        }
                        className={`flex-1 flex flex-col items-center gap-0.5 rounded-lg border px-2 py-2 transition-colors duration-150 ${
                          minRating === opt.value
                            ? "bg-[#2D6A4F] text-white border-[#2D6A4F]"
                            : "bg-white text-gray-700 border-gray-200 hover:border-[#2D6A4F]"
                        }`}
                      >
                        <span className="text-xs leading-none text-yellow-400">
                          {opt.label}
                        </span>
                        <span className="text-xs font-semibold">{opt.sub}</span>
                      </button>
                    ))}
                  </div>

                  <p className="mb-2 text-sm font-semibold text-gray-700">
                    Sort By
                  </p>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm mb-5 cursor-pointer"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="flex-1 border border-slate-200 rounded-xl py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all"
                    >
                      Clear All
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsMobileFilterOpen(false)}
                      className="flex-1 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl py-2.5 text-xs font-bold transition-all shadow-sm"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            </div>

              {/* Results */}
              <div className="lg:col-span-3">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-semibold text-slate-500">
                    Showing <strong className="text-slate-900">{visibleGuides.length}</strong> of <strong className="text-slate-900">{filteredGuides.length}</strong> verified guides
                  </p>
                  <div className="flex overflow-hidden bg-white border border-slate-200 rounded-xl shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setViewMode("list")}
                      aria-label="List view"
                      className={`px-3.5 py-2 text-sm font-bold transition-colors ${
                        viewMode === "list"
                          ? "bg-emerald-800 text-white"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      ☰
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("grid")}
                      aria-label="Grid view"
                      className={`px-3.5 py-2 text-sm font-bold transition-colors ${
                        viewMode === "grid"
                          ? "bg-emerald-800 text-white"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      ▦
                    </button>
                  </div>
                </div>

                {loading && (
                  <p className="py-12 text-base text-center text-gray-500">
                    Loading guides...
                  </p>
                )}

                {!loading && error && (
                  <div className="py-12 text-base text-center text-red-700">
                    {error}
                    <button
                      type="button"
                      onClick={fetchGuides}
                      className="inline-block ml-3 bg-[#2D6A4F] text-white rounded-md px-3.5 py-1.5 cursor-pointer"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {!loading && !error && filteredGuides.length === 0 && (
                  <p className="py-12 text-base text-center text-gray-500">
                    No guides match your filters. Try adjusting your search.
                  </p>
                )}

                {!loading && !error && filteredGuides.length > 0 && (
                  <>
                    <div
                      className={
                        viewMode === "grid"
                          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
                          : "flex flex-col gap-4"
                      }
                    >
                      {visibleGuides.map((guide) => {
                        const ratingDisplay =
                          guide.rating != null ? guide.rating.toFixed(1) : "—";
                        const specialtyTags = (guide.specialties || "")
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean);

                        if (viewMode === "list") {
                          return (
                            <div
                              key={guide.id}
                              className="flex flex-col gap-4 p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 sm:flex-row sm:items-center group"
                            >
                              <div className="relative shrink-0">
                                <img
                                  src={guide.photoUrl || PLACEHOLDER_PHOTO}
                                  alt={guide.fullName}
                                  className="object-cover w-20 h-20 rounded-full ring-4 ring-emerald-500/15 group-hover:scale-105 transition-transform duration-300 shadow-md"
                                />
                                {guide.available && (
                                  <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                  <h3 className="font-extrabold text-slate-900 text-lg group-hover:text-emerald-800 transition-colors">
                                    {guide.fullName}
                                  </h3>
                                  <span className="text-3xs font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                                    ✓ Verified
                                  </span>
                                  <span
                                    className={`text-3xs font-extrabold tracking-wider uppercase px-2.5 py-0.5 rounded-full ${
                                      guide.available
                                        ? "bg-emerald-100 text-emerald-800"
                                        : "bg-slate-100 text-slate-500"
                                    }`}
                                  >
                                    {guide.available ? "Available" : "Unavailable"}
                                  </span>
                                </div>

                                <p className="mb-2 text-xs font-semibold text-slate-500">
                                  {guide.specialties}
                                </p>

                                <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600">
                                  <span className="flex items-center gap-1 text-slate-800">
                                    <span className="text-amber-400">★</span>
                                    <strong>{ratingDisplay}</strong>
                                    <span className="text-slate-400 font-normal">
                                      ({guide.reviewCount ?? 0} reviews)
                                    </span>
                                  </span>
                                  <span>📍 {guide.district}</span>
                                  <span>💬 {guide.languages}</span>
                                </div>

                                <div className="flex gap-1.5 flex-wrap mt-3">
                                  {specialtyTags.slice(0, 3).map((tag) => (
                                    <span
                                      key={tag}
                                      className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200/50"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-center sm:gap-2 shrink-0 sm:w-36 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                                <p className="text-xl font-black text-slate-900">
                                  ${guide.pricePerDay}<span className="text-xs font-semibold text-slate-400">/day</span>
                                </p>
                                <Link
                                  to={`/guides/${guide.id}`}
                                  className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl py-2.5 px-4 text-center whitespace-nowrap transition-all shadow-sm hover:shadow-md"
                                >
                                  View Profile →
                                </Link>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={guide.id}
                            className="flex flex-col items-center p-6 text-center bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                          >
                            <div className="flex items-center justify-between w-full mb-4">
                              <span className="text-3xs font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                                ✓ Verified
                              </span>
                              <span
                                className={`text-3xs font-extrabold tracking-wider uppercase px-2.5 py-0.5 rounded-full ${
                                  guide.available
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                {guide.available ? "Available" : "Unavailable"}
                              </span>
                            </div>

                            <div className="relative mb-3">
                              <img
                                src={guide.photoUrl || PLACEHOLDER_PHOTO}
                                alt={guide.fullName}
                                className="object-cover w-24 h-24 rounded-full ring-4 ring-emerald-500/15 group-hover:scale-105 transition-transform duration-300 shadow-md"
                              />
                            </div>

                            <h3 className="font-extrabold text-slate-900 text-lg mb-0.5 group-hover:text-emerald-800 transition-colors">
                              {guide.fullName}
                            </h3>
                            <p className="mb-2 text-xs font-semibold text-slate-500 line-clamp-1">
                              {guide.specialties}
                            </p>

                            <div className="flex items-center gap-1 mb-3 text-xs font-semibold text-slate-700">
                              <span className="text-amber-400">★</span>
                              <strong>{ratingDisplay}</strong>
                              <span className="text-slate-400 font-normal">
                                ({guide.reviewCount ?? 0})
                              </span>
                            </div>

                            <div className="flex gap-1.5 flex-wrap justify-center mb-4">
                              {specialtyTags.slice(0, 2).map((tag) => (
                                <span
                                  key={tag}
                                  className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200/50"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>

                            <div className="w-full text-xs font-semibold text-slate-500 space-y-1 mb-4 pt-3 border-t border-slate-100">
                              <p>📍 {guide.district}</p>
                              <p className="truncate">💬 {guide.languages}</p>
                            </div>

                            <div className="w-full pt-3 mt-auto border-t border-slate-100 flex items-center justify-between">
                              <p className="text-xl font-black text-slate-900">
                                ${guide.pricePerDay}<span className="text-xs font-semibold text-slate-400">/day</span>
                              </p>

                              <Link
                                to={`/guides/${guide.id}`}
                                className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl py-2.5 px-4 text-center transition-all shadow-sm hover:shadow-md"
                              >
                                View Profile →
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <ShowMoreButton
                      onClick={showMore}
                      hasMore={hasMore}
                      remainingCount={remainingCount}
                      buttonText="Show More Guides"
                    />
                  </>
                )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Guides;

import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import guidesService from "../services/guidesService";
import bannerImage from "../assets/Banner.jpg";
import { SRI_LANKA_DISTRICTS } from "../components/SriLankaDistricts";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

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

const Guides = () => {
  const navigate = useNavigate();
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [district, setDistrict] = useState("");
  const [language, setLanguage] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [maxPrice, setMaxPrice] = useState(100);
  const [minRating, setMinRating] = useState(null);
  const [sortBy, setSortBy] = useState("rating_desc");
  const [viewMode, setViewMode] = useState("grid");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const dateRangeInvalid = Boolean(startDate && endDate && endDate < startDate);

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

    if (language) {
      result = result.filter((g) =>
        (g.languages || "")
          .split(",")
          .map((l) => l.trim())
          .includes(language),
      );
    }

    if (specialty) {
      result = result.filter((g) =>
        (g.specialties || "")
          .split(",")
          .map((s) => s.trim())
          .includes(specialty),
      );
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
    language,
    specialty,
    maxPrice,
    minRating,
    sortBy,
  ]);

  const handleClearAll = () => {
    setSearchTerm("");
    setDistrict("");
    setLanguage("");
    setSpecialty("");
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
        <header
          className="relative h-64 bg-cover bg-center flex flex-col justify-center"
          style={{
            backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.2)), url(${bannerImage})`,
          }}
        >
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-10 text-white">
            <div className="flex items-center gap-1 text-sm text-gray-200 mb-3">
              <span
                className="cursor-pointer hover:underline"
                onClick={() => navigate("/")}
              >
                Home
              </span>
              <ChevronRight size={14} />
              <span>Guides</span>
            </div>
            <h1 className="mb-2 text-3xl font-bold sm:text-4xl">
              Find Your Local Guide
            </h1>
            <p className="max-w-xl text-gray-200">
              Verified guides for every region and interest in Sri Lanka
            </p>
          </div>
        </header>

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
              <div className="sticky p-5 bg-white rounded-xl sm:p-6 top-4">
                <h2 className="flex items-center gap-2 mb-4 font-bold text-gray-800">
                  🔍 Filter Guides
                </h2>

                <p className="mb-2 text-sm font-semibold text-gray-700">
                  📅 Trip Dates
                </p>
                <div className="grid grid-cols-2 gap-2 mb-1">
                  <div>
                    <label className="block mb-1 text-xs text-gray-400">
                      From
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-2 focus:outline-[#2D6A4F] focus:outline-offset-1"
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
                      className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-2 focus:outline-[#2D6A4F] focus:outline-offset-1"
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

                <p className="mb-2 text-sm font-semibold text-gray-700">
                  Language
                </p>
                <div className="flex flex-wrap gap-2 mb-5">
                  {languages.map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLanguage(language === l ? "" : l)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors duration-150 ${
                        language === l
                          ? "bg-[#2D6A4F] text-white border-[#2D6A4F]"
                          : "bg-white text-gray-700 border-gray-200 hover:border-[#2D6A4F]"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>

                <p className="mb-2 text-sm font-semibold text-gray-700">
                  Specialty
                </p>
                <div className="flex flex-col gap-1.5 mb-5">
                  {specialties.map((s) => (
                    <label
                      key={s}
                      className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={specialty === s}
                        onChange={() => setSpecialty(specialty === s ? "" : s)}
                      />
                      {s}
                    </label>
                  ))}
                </div>

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
                    className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Clear All
                  </button>
                  <button
                    type="button"
                    className="flex-1 bg-[#2D6A4F] hover:bg-[#1B4332] text-white rounded-lg py-2.5 text-sm font-semibold transition-colors duration-150"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="lg:col-span-3">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">
                  Showing <strong>{filteredGuides.length}</strong> guides
                </p>
                <div className="flex overflow-hidden bg-white border border-gray-200 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    aria-label="List view"
                    className={`px-3.5 py-2.5 text-base transition-colors duration-150 ${
                      viewMode === "list"
                        ? "bg-[#2D6A4F] text-white"
                        : "text-gray-700"
                    }`}
                  >
                    ☰
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    aria-label="Grid view"
                    className={`px-3.5 py-2.5 text-base transition-colors duration-150 ${
                      viewMode === "grid"
                        ? "bg-[#2D6A4F] text-white"
                        : "text-gray-700"
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
                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
                      : "flex flex-col gap-4"
                  }
                >
                  {filteredGuides.map((guide) => {
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
                          className="flex flex-col gap-4 p-5 bg-white rounded-xl sm:flex-row sm:items-center"
                        >
                          <img
                            src={guide.photoUrl || PLACEHOLDER_PHOTO}
                            alt={guide.fullName}
                            className="object-cover w-16 h-16 rounded-full shrink-0"
                          />

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-gray-800">
                                {guide.fullName}
                              </h3>
                              <span className="text-xs font-semibold text-green-700">
                                ✓ Verified
                              </span>
                              <span
                                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                  guide.available
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-500"
                                }`}
                              >
                                {guide.available ? "Available" : "Unavailable"}
                              </span>
                            </div>

                            <p className="mb-2 text-sm text-gray-500">
                              {guide.specialties}
                            </p>

                            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1 text-sm text-gray-700">
                                <span className="text-yellow-400">★</span>
                                <strong>{ratingDisplay}</strong>
                                <span className="text-gray-400">
                                  ({guide.reviewCount ?? 0})
                                </span>
                              </span>
                              <span>📍 {guide.district}</span>
                              <span>💬 {guide.languages}</span>
                            </div>

                            <div className="flex gap-1.5 flex-wrap mt-2">
                              {specialtyTags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-700"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-center sm:gap-2 shrink-0 sm:w-36">
                            <p className="text-lg font-bold text-[#2D6A4F]">
                              ${guide.pricePerDay}/day
                            </p>
                            <Link
                              to={`/guides/${guide.id}`}
                              className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-semibold text-sm rounded-lg py-2.5 px-4 text-center whitespace-nowrap transition-colors duration-150"
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
                        className="flex flex-col items-center p-5 text-center bg-white rounded-xl"
                      >
                        <div className="flex items-center justify-between w-full mb-3">
                          <span className="text-xs font-semibold text-green-700">
                            ✓ Verified
                          </span>
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              guide.available
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {guide.available ? "Available" : "Unavailable"}
                          </span>
                        </div>

                        <img
                          src={guide.photoUrl || PLACEHOLDER_PHOTO}
                          alt={guide.fullName}
                          className="object-cover w-20 h-20 mb-3 rounded-full"
                        />

                        <h3 className="font-bold text-gray-800 mb-0.5">
                          {guide.fullName}
                        </h3>
                        <p className="mb-2 text-sm text-gray-500">
                          {guide.specialties}
                        </p>

                        <div className="flex items-center gap-1 mb-3 text-sm text-gray-700">
                          <span className="text-yellow-400">★</span>
                          <strong>{ratingDisplay}</strong>
                          <span className="text-gray-400">
                            ({guide.reviewCount ?? 0})
                          </span>
                        </div>

                        <div className="flex gap-1.5 flex-wrap justify-center mb-3">
                          {specialtyTags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-700"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        <p className="mb-1 text-xs text-gray-500">
                          📍 {guide.district}
                        </p>
                        <p className="mb-3 text-xs text-gray-500">
                          💬 {guide.languages}
                        </p>

                        <p className="text-lg font-bold text-[#2D6A4F] mb-3">
                          ${guide.pricePerDay}/day
                        </p>

                        <Link
                          to={`/guides/${guide.id}`}
                          className="w-full bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-semibold text-sm rounded-lg py-3 text-center transition-colors duration-150"
                        >
                          View Profile →
                        </Link>
                      </div>
                    );
                  })}
                </div>
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

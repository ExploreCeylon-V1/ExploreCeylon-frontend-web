import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import destinationsService from "../services/destinationsService";
import bannerImage from "../assets/Banner.jpg";
import DestinationCard from "../components/DestinationCard";
import FeaturedCarousel from "../components/FeaturedCarousel";
import { DESTINATION_CATEGORIES } from "../components/destinationCategories";
import ErrorBoundary from "../components/ErrorBoundary";
import Pagination from "../components/Pagination";
import { usePagination } from "../hooks/usePagination";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const SORT_OPTIONS = [
  { value: "rating_desc", label: "Highest Rated" },
  { value: "rating_asc", label: "Lowest Rated" },
  { value: "reviews_desc", label: "Most Reviewed" },
  { value: "name_asc", label: "Name (A-Z)" },
];

const Destinations = () => {
  const navigate = useNavigate();

  const [destinations, setDestinations] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeCategory, setActiveCategory] = useState("ALL");
  const [provinceFilter, setProvinceFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("rating_desc");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [allData, featuredData] = await Promise.all([
        destinationsService.getAllDestinations(),
        destinationsService.getFeatured(),
      ]);
      setDestinations(allData || []);
      setFeatured(featuredData || []);
    } catch (err) {
      console.error("Failed to load destinations:", err);
      setError("Could not load destinations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetchData sets loading state synchronously before its await; intentional fetch-on-mount pattern
    fetchData();
  }, []);

  const provinces = useMemo(() => {
    const unique = new Set(destinations.map((d) => d.province).filter(Boolean));
    return Array.from(unique).sort();
  }, [destinations]);

  const categoryCounts = useMemo(() => {
    const counts = {};
    DESTINATION_CATEGORIES.forEach((c) => {
      counts[c.value] = destinations.filter(
        (d) => d.category === c.value,
      ).length;
    });
    return counts;
  }, [destinations]);

  const filteredDestinations = useMemo(() => {
    let result = [...destinations];

    if (activeCategory !== "ALL") {
      result = result.filter((d) => d.category === activeCategory);
    }

    if (provinceFilter !== "ALL") {
      result = result.filter((d) => d.province === provinceFilter);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      result = result.filter(
        (d) =>
          d.name?.toLowerCase().includes(term) ||
          d.description?.toLowerCase().includes(term) ||
          d.district?.toLowerCase().includes(term) ||
          d.province?.toLowerCase().includes(term),
      );
    }

    switch (sortBy) {
      case "rating_asc":
        result.sort((a, b) => (a.rating ?? 0) - (b.rating ?? 0));
        break;
      case "reviews_desc":
        result.sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0));
        break;
      case "name_asc":
        result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        break;
      case "rating_desc":
      default:
        result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
    }

    return result;
  }, [destinations, activeCategory, provinceFilter, searchTerm, sortBy]);

  const {
    pageItems: paginatedDestinations,
    page,
    totalPages,
    setPage,
  } = usePagination(filteredDestinations, {
    columns: { base: 1, md: 2, lg: 3 },
    rows: 10,
  });

  const handleExplore = (destination) => {
    navigate(`/destinations/${destination.id}`);
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
                  <span>📍</span> Iconic Destinations
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-snug">
                Explore Sri Lanka's Finest <span className="text-amber-300">Wonders</span>
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-medium max-w-3xl">
                From ancient UNESCO fortresses and tea plantations to pristine tropical beaches and wildlife reserves.
              </p>

              <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs font-semibold text-emerald-200">
                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                  ✨ {destinations.length} Destinations
                </span>
                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                  🏛️ 8 UNESCO World Heritage Sites
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-6 mx-auto max-w-7xl sm:px-10 pb-14">
          {/* Featured carousel */}
          {!loading && !error && (
            <FeaturedCarousel
              destinations={featured}
              onExplore={handleExplore}
            />
          )}

          {/* Category tabs */}
          <div className="flex gap-2 flex-wrap mb-5">
            <button
              type="button"
              onClick={() => setActiveCategory("ALL")}
              className={`rounded-full px-4 py-2 text-xs font-bold whitespace-nowrap border transition-all ${
                activeCategory === "ALL"
                  ? "bg-emerald-800 text-white border-emerald-800 shadow-xs"
                  : "bg-white text-slate-700 border-slate-200 hover:border-emerald-700 hover:text-emerald-800"
              }`}
            >
              ☀️ All ({destinations.length})
            </button>
            {DESTINATION_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setActiveCategory(cat.value)}
                className={`rounded-full px-4 py-2 text-xs font-bold whitespace-nowrap border transition-all ${
                  activeCategory === cat.value
                    ? "bg-emerald-800 text-white border-emerald-800 shadow-xs"
                    : "bg-white text-slate-700 border-slate-200 hover:border-emerald-700 hover:text-emerald-800"
                }`}
              >
                {cat.icon} {cat.label} ({categoryCounts[cat.value] || 0})
              </button>
            ))}
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 p-4 mb-5 bg-white rounded-xl">
            <select
              value={provinceFilter}
              onChange={(e) => setProvinceFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 bg-white cursor-pointer"
            >
              <option value="ALL">All Provinces</option>
              {provinces.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            <div className="flex-1 min-w-[200px] relative flex items-center">
              <span className="absolute text-sm text-gray-500 left-3">🔍</span>
              <input
                type="text"
                placeholder="Search destinations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-2 focus:outline-[#2D6A4F] focus:outline-offset-1"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 bg-white cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Result count */}
          <p className="mb-4 text-sm text-gray-500">
            Showing <strong>{paginatedDestinations.length}</strong> of <strong>{filteredDestinations.length}</strong> destination{filteredDestinations.length !== 1 ? "s" : ""}
          </p>

          {loading && (
            <p className="py-12 text-base text-center text-gray-500">
              Loading destinations...
            </p>
          )}

          {!loading && error && (
            <div className="py-12 text-base text-center text-red-700">
              {error}
              <button
                type="button"
                onClick={fetchData}
                className="inline-block ml-3 bg-[#2D6A4F] text-white rounded-md px-3.5 py-1.5 cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && filteredDestinations.length === 0 && (
            <p className="py-12 text-base text-center text-gray-500">
              No destinations match your filters. Try adjusting your search.
            </p>
          )}

          {!loading && !error && filteredDestinations.length > 0 && (
            <ErrorBoundary title="Unable to load destinations" message="There was a problem rendering the destinations grid.">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {paginatedDestinations.map((destination) => (
                  <DestinationCard
                    key={destination.id}
                    destination={destination}
                    onExplore={handleExplore}
                  />
                ))}
              </div>
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                label="Destinations"
              />
            </ErrorBoundary>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Destinations;

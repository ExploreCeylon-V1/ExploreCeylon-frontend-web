import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import hiddenGemsService from "../services/Hiddengemsservice";
import bannerImage from "../assets/Banner.jpg";
import GemCard from "../components/GemCard";
import { GEM_CATEGORIES } from "../components/gemCategories";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Pagination from "../components/Pagination";
import { usePagination } from "../hooks/usePagination";

const SORT_OPTIONS = [
  { value: "rating_desc", label: "Highest Rated" },
  { value: "rating_asc", label: "Lowest Rated" },
  { value: "reviews_desc", label: "Most Visited" },
  { value: "title_asc", label: "Name (A-Z)" },
];

const HiddenGems = () => {
  const navigate = useNavigate();
  const [gems, setGems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeCategory, setActiveCategory] = useState("ALL");
  const [districtFilter, setDistrictFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("rating_desc");
  const [viewMode, setViewMode] = useState("grid");

  const fetchGems = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await hiddenGemsService.getAllGems();
      setGems(data || []);
    } catch (err) {
      console.error("Failed to load hidden gems:", err);
      setError("Could not load hidden gems. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetchGems sets loading state synchronously before its await; intentional fetch-on-mount pattern
    fetchGems();
  }, []);

  // Only approved gems should ever show on the public traveler page
  const approvedGems = useMemo(() => gems.filter((g) => g.approved), [gems]);

  const districts = useMemo(() => {
    const unique = new Set(approvedGems.map((g) => g.district).filter(Boolean));
    return Array.from(unique).sort();
  }, [approvedGems]);

  const categoryCounts = useMemo(() => {
    const counts = {};
    GEM_CATEGORIES.forEach((c) => {
      counts[c.value] = approvedGems.filter(
        (g) => g.category === c.value,
      ).length;
    });
    return counts;
  }, [approvedGems]);

  const filteredGems = useMemo(() => {
    let result = [...approvedGems];

    if (activeCategory !== "ALL") {
      result = result.filter((g) => g.category === activeCategory);
    }

    if (districtFilter !== "ALL") {
      result = result.filter((g) => g.district === districtFilter);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      result = result.filter(
        (g) =>
          g.title?.toLowerCase().includes(term) ||
          g.description?.toLowerCase().includes(term) ||
          g.district?.toLowerCase().includes(term),
      );
    }

    switch (sortBy) {
      case "rating_asc":
        result.sort((a, b) => (a.rating ?? 0) - (b.rating ?? 0));
        break;
      case "reviews_desc":
        result.sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0));
        break;
      case "title_asc":
        result.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
        break;
      case "rating_desc":
      default:
        result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
    }

    return result;
  }, [approvedGems, activeCategory, districtFilter, searchTerm, sortBy]);

  // Grid view is `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`; list view is a
  // single stacked column at every width.
  const {
    pageItems: pagedGems,
    page,
    totalPages,
    setPage,
    listRef,
  } = usePagination(filteredGems, {
    columns:
      viewMode === "grid" ? { base: 1, md: 2, lg: 3 } : { base: 1 },
  });

  const handleViewDetails = (gem) => {
    navigate(`/hidden-gems/${gem.id}`);
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
                  <span>💎</span> Secret Spots & Treasures
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-snug">
                Discover Hidden Gems of <span className="text-amber-300">Sri Lanka</span>
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-medium max-w-3xl">
                Off-the-beaten-path waterfalls, secluded beaches & insider locations curated by local explorers.
              </p>

              <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs font-semibold text-emerald-200">
                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                  💎 {approvedGems.length} Verified Gems
                </span>
                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                  🗂️ {GEM_CATEGORIES.length} Categories
                </span>
                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                  ✅ Community Approved
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-6 mx-auto max-w-7xl sm:px-10 pb-14">
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
              ☀️ All ({approvedGems.length})
            </button>
            {GEM_CATEGORIES.map((cat) => (
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
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 bg-white cursor-pointer"
            >
              <option value="ALL">All Districts</option>
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <div className="flex-1 min-w-[200px] relative flex items-center">
              <span className="absolute text-sm text-gray-500 left-3">🔍</span>
              <input
                type="text"
                placeholder="Search gems..."
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

            <div className="flex overflow-hidden border border-gray-200 rounded-lg">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                aria-label="Grid view"
                className={`px-3.5 py-2.5 text-base transition-colors duration-150 ${
                  viewMode === "grid"
                    ? "bg-[#2D6A4F] text-white"
                    : "bg-white text-gray-700"
                }`}
              >
                ▦
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                aria-label="List view"
                className={`px-3.5 py-2.5 text-base transition-colors duration-150 ${
                  viewMode === "list"
                    ? "bg-[#2D6A4F] text-white"
                    : "bg-white text-gray-700"
                }`}
              >
                ☰
              </button>
            </div>
          </div>

          {/* Result count */}
          <p ref={listRef} className="mb-4 text-sm text-gray-500">
            Showing <strong>{filteredGems.length}</strong> approved gems
          </p>

          {loading && (
            <p className="py-12 text-base text-center text-gray-500">
              Loading hidden gems...
            </p>
          )}

          {!loading && error && (
            <div className="py-12 text-base text-center text-red-700">
              {error}
              <button
                type="button"
                onClick={fetchGems}
                className="inline-block ml-3 bg-[#2D6A4F] text-white rounded-md px-3.5 py-1.5 cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && filteredGems.length === 0 && (
            <p className="py-12 text-base text-center text-gray-500">
              No gems match your filters. Try adjusting your search.
            </p>
          )}

          {!loading && !error && filteredGems.length > 0 && (
            <>
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    : "flex flex-col gap-4"
                }
              >
                {pagedGems.map((gem) => (
                  <GemCard
                    key={gem.id}
                    gem={gem}
                    viewMode={viewMode}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>

              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                label="Hidden gems"
              />
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default HiddenGems;

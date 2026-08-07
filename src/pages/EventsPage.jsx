import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, CalendarX, Search, X, Bookmark } from "lucide-react";
import eventService from "../services/eventService";
import bannerImage from "../assets/Banner.jpg";
import EventCalendar from "../components/EventCalendar";
import EventCard from "../components/EventCard";
import { CATEGORY_META, CATEGORY_LIST } from "../utils/eventCategoryMeta";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Pagination from "../components/Pagination";
import { usePagination } from "../hooks/usePagination";
import { useAuth } from "../hooks/useAuth";
import { getSavedEventIds, toggleSavedEventId } from "../utils/eventBookmarks";

const toKey = (date) => date.toISOString().slice(0, 10);

export default function EventsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [viewDate, setViewDate] = useState(new Date());
  // null = no date filter active, Date = filter by that date
  const [selectedDate, setSelectedDate] = useState(null);
  const [savedIds, setSavedIds] = useState(new Set());

  // Sync user-specific bookmarks from storage & custom event listener
  useEffect(() => {
    setSavedIds(getSavedEventIds(user));
    const handleUpdate = () => {
      setSavedIds(getSavedEventIds(user));
    };
    window.addEventListener("event-bookmarks-updated", handleUpdate);
    return () => window.removeEventListener("event-bookmarks-updated", handleUpdate);
  }, [user]);

  // Fetch all events whenever category changes (or fetch all for client-side search/bookmarks)
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        const filters =
          activeCategory !== "ALL" && activeCategory !== "BOOKMARKS"
            ? { category: activeCategory }
            : {};
        const data = await eventService.getAllEvents(filters);
        setEvents(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load events. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [activeCategory]);

  // Event dates set for calendar dots
  const eventDates = useMemo(() => {
    const set = new Set();
    events.forEach((e) => {
      const start = new Date(e.startDate);
      const end = new Date(e.endDate);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        set.add(d.toISOString().slice(0, 10));
      }
    });
    return set;
  }, [events]);

  // Filter by search, category/bookmarks, and selected date, then sort
  const filteredEvents = useMemo(() => {
    let list = [...events];

    // 1. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (e) =>
          e.title?.toLowerCase().includes(q) ||
          e.location?.toLowerCase().includes(q) ||
          e.region?.toLowerCase().includes(q) ||
          e.description?.toLowerCase().includes(q) ||
          e.category?.toLowerCase().includes(q)
      );
    }

    // 2. Bookmarks / Category Filter
    if (activeCategory === "BOOKMARKS") {
      list = list.filter((e) => savedIds.has(e.id));
    } else if (activeCategory !== "ALL") {
      list = list.filter((e) => e.category === activeCategory);
    }

    // 3. Selected Date Filter
    if (selectedDate) {
      const key = toKey(selectedDate);
      list = list.filter((e) => {
        const start = new Date(e.startDate);
        const end = new Date(e.endDate);
        const sel = new Date(key);
        return sel >= start && sel <= end;
      });
    }

    return list.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  }, [events, searchQuery, activeCategory, savedIds, selectedDate]);

  const {
    pageItems: pagedEvents,
    page,
    totalPages,
    setPage,
    listRef,
  } = usePagination(filteredEvents, { columns: { base: 1 } });

  const toggleSave = (id) => {
    const updated = toggleSavedEventId(user, id);
    setSavedIds(new Set(updated));
  };

  const handleDateSelect = (date) => {
    // Toggle: click same date again → clear filter
    if (selectedDate && toKey(date) === toKey(selectedDate)) {
      setSelectedDate(null);
    } else {
      setSelectedDate(date);
    }
  };

  const clearDateFilter = () => setSelectedDate(null);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 font-sans">
        {/* ══════════════════════════ HERO SECTION ══════════════════════════ */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-900 text-white py-10 sm:py-12 px-4 sm:px-6 lg:px-8 shadow-xl">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-emerald-400 to-teal-400 opacity-60" />

          <div className="relative z-10 max-w-7xl mx-auto">
            <div className="max-w-4xl text-left space-y-2.5">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-400/30 bg-emerald-500/15 text-3xs font-extrabold uppercase tracking-widest text-emerald-300">
                  <span>✨</span> Festivals & Seasons
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-snug">
                Events & Festivals in <span className="text-amber-300">Sri Lanka</span>
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-medium max-w-3xl">
                Experience historic pageants, coastal kite festivals, and seasonal celebrations that make Sri Lanka truly unique.
              </p>

              <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs font-semibold text-emerald-200">
                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                  📅 {events.length} Upcoming Events
                </span>
                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                  🐘 Historic Pageants & Rituals
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
          {/* ── LEFT SIDEBAR (sticky on desktop only) ── */}
          <aside className="w-full lg:w-[340px] shrink-0 lg:sticky lg:top-4 lg:self-start">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-5">
              <h2 className="font-extrabold text-slate-900 mb-4 text-base">
                Event Calendar
              </h2>
              <EventCalendar
                viewDate={viewDate}
                setViewDate={setViewDate}
                selectedDate={selectedDate}
                setSelectedDate={handleDateSelect}
                eventDates={eventDates}
              />

              {/* Active date filter pill */}
              {selectedDate && (
                <div className="mt-3 flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                  <span className="text-xs text-emerald-900 font-bold">
                    📅{" "}
                    {selectedDate.toLocaleDateString("default", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  <button
                    onClick={clearDateFilter}
                    className="text-xs font-extrabold text-emerald-700 hover:underline ml-2"
                  >
                    Clear
                  </button>
                </div>
              )}

              <hr className="my-5 border-slate-100" />

              <h3 className="font-extrabold text-slate-900 mb-3 text-sm flex items-center justify-between">
                <span>Filter by Category</span>
                {activeCategory !== "ALL" && (
                  <button
                    onClick={() => setActiveCategory("ALL")}
                    className="text-3xs font-extrabold text-emerald-800 hover:underline uppercase"
                  >
                    Reset Filter
                  </button>
                )}
              </h3>

              {/* Responsive Category Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2 sm:gap-2.5">
                {["ALL", "BOOKMARKS", ...CATEGORY_LIST].map((key) => {
                  const meta = CATEGORY_META[key];
                  const Icon = meta.icon;
                  const active = activeCategory === key;
                  const isBookmarkKey = key === "BOOKMARKS";
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setActiveCategory(key)}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all min-w-0 ${
                        active
                          ? "bg-emerald-800 text-white shadow-xs"
                          : "bg-slate-50 text-slate-700 hover:bg-slate-100/80 border border-slate-100"
                      }`}
                    >
                      <Icon
                        size={16}
                        className={`shrink-0 ${
                          active
                            ? isBookmarkKey
                              ? "text-amber-300 fill-amber-300"
                              : "text-amber-300"
                            : isBookmarkKey
                            ? "text-amber-500 fill-amber-500"
                            : "text-emerald-700"
                        }`}
                      />
                      <span className="truncate flex-1 min-w-0 text-left">{meta.label}</span>
                      {isBookmarkKey && savedIds.size > 0 && (
                        <span
                          className={`text-3xs px-1.5 py-0.5 rounded-full font-extrabold shrink-0 ${
                            active
                              ? "bg-amber-400 text-slate-950"
                              : "bg-emerald-100 text-emerald-900"
                          }`}
                        >
                          {savedIds.size}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* ── RIGHT: Events list ── */}
          <div ref={listRef} className="flex-1 min-w-0">
            {/* ── SEARCH BAR ── */}
            <div className="bg-white border border-slate-100 rounded-2xl p-3.5 sm:p-4 shadow-sm mb-5 flex items-center gap-3">
              <Search size={18} className="text-emerald-700 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events by title, location, region or category..."
                className="w-full text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 bg-transparent outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  title="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Header row */}
            <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
              <div>
                <h2 className="font-extrabold text-slate-900 text-base sm:text-lg">
                  {activeCategory === "BOOKMARKS"
                    ? "Bookmarked Events"
                    : selectedDate
                    ? `Events on ${selectedDate.toLocaleDateString("default", {
                        day: "numeric",
                        month: "long",
                      })}`
                    : "Upcoming Events"}
                </h2>
                {!loading && (
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    Showing <strong className="text-slate-900">{filteredEvents.length}</strong> event
                    {filteredEvents.length !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
              {selectedDate && (
                <button
                  onClick={clearDateFilter}
                  className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100"
                >
                  <CalendarX size={14} /> Clear date filter
                </button>
              )}
            </div>

            {/* States */}
            {loading && (
              <div className="flex flex-col gap-4">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-28 bg-slate-100 rounded-2xl animate-pulse"
                  />
                ))}
              </div>
            )}
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-xs font-bold">
                ⚠️ {error}
              </div>
            )}

            {/* Empty States */}
            {!loading && !error && filteredEvents.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white border border-slate-100 rounded-2xl shadow-sm">
                {activeCategory === "BOOKMARKS" ? (
                  <>
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600 mb-3">
                      <Bookmark size={28} />
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-base mb-1">
                      No Bookmarked Events Yet
                    </h3>
                    <p className="text-xs font-medium text-slate-500 max-w-sm leading-relaxed mb-4">
                      Click the bookmark icon on any event card or detail page to save your favorite Sri Lanka festivals here.
                    </p>
                    <button
                      onClick={() => setActiveCategory("ALL")}
                      className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm"
                    >
                      Browse All Events →
                    </button>
                  </>
                ) : (
                  <>
                    <CalendarX size={40} className="mb-3 text-slate-400 opacity-60" />
                    <h3 className="font-extrabold text-slate-900 text-base mb-1">
                      No Events Found
                    </h3>
                    <p className="text-xs font-medium text-slate-500 max-w-sm leading-relaxed mb-4">
                      {searchQuery
                        ? `No events match "${searchQuery}". Try searching for another keyword or clearing your filters.`
                        : selectedDate
                        ? "No events scheduled for this specific date."
                        : "No events available for this category."}
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery("")}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all"
                        >
                          Clear Search
                        </button>
                      )}
                      {selectedDate && (
                        <button
                          onClick={clearDateFilter}
                          className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all"
                        >
                          Clear Date Filter
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Event cards */}
            {!loading && !error && pagedEvents.length > 0 && (
              <div className="flex flex-col gap-4">
                {pagedEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    saved={savedIds.has(event.id)}
                    onSave={toggleSave}
                    onViewDetails={(id) => navigate(`/events/${id}`)}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loading && (
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                label="Events"
              />
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

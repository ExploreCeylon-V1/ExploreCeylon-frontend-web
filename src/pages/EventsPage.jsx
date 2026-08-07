import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, CalendarX } from "lucide-react";
import eventService from "../services/eventService";
import bannerImage from "../assets/Banner.jpg";
import EventCalendar from "../components/EventCalendar";
import EventCard from "../components/EventCard";
import { CATEGORY_META, CATEGORY_LIST } from "../utils/eventCategoryMeta";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Pagination from "../components/Pagination";
import { usePagination } from "../hooks/usePagination";

const toKey = (date) => date.toISOString().slice(0, 10);

export default function EventsPage() {
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeCategory, setActiveCategory] = useState("ALL");
  const [viewDate, setViewDate] = useState(new Date());
  // null = no date filter active, Date = filter by that date
  const [selectedDate, setSelectedDate] = useState(null);
  const [savedIds, setSavedIds] = useState(new Set());

  // Fetch all events whenever category changes
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        const filters =
          activeCategory !== "ALL" ? { category: activeCategory } : {};
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

  // Page resets on category/date changes are handled by usePagination, which
  // watches the filtered list's identity.

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

  // Filter by selected date if any, then sort
  const filteredEvents = useMemo(() => {
    let list = [...events];
    if (selectedDate) {
      const key = toKey(selectedDate);
      list = list.filter((e) => {
        const start = new Date(e.startDate);
        const end = new Date(e.endDate);
        // include if selected date falls within event range
        const sel = new Date(key);
        return sel >= start && sel <= end;
      });
    }
    return list.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  }, [events, selectedDate]);

  // Events render as a single stacked column at every breakpoint, so a "row"
  // is one card — 10 rows = 10 events per page, matching the previous
  // hardcoded PAGE_SIZE.
  const {
    pageItems: pagedEvents,
    page,
    totalPages,
    setPage,
    listRef,
  } = usePagination(filteredEvents, { columns: { base: 1 } });

  const toggleSave = (id) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
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
      <div className="min-h-screen bg-gray-50">
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
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5">
              <h2 className="font-semibold text-gray-900 mb-4">
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
                <div className="mt-3 flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                  <span className="text-xs text-emerald-800 font-medium">
                    📅{" "}
                    {selectedDate.toLocaleDateString("default", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  <button
                    onClick={clearDateFilter}
                    className="text-xs text-emerald-700 hover:underline ml-2"
                  >
                    Clear
                  </button>
                </div>
              )}

              <hr className="my-5" />

              <h3 className="font-semibold text-gray-900 mb-3">
                Filter by Category
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
                {["ALL", ...CATEGORY_LIST].map((key) => {
                  const meta = CATEGORY_META[key];
                  const Icon = meta.icon;
                  const active = activeCategory === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setActiveCategory(key)}
                      className={`flex flex-col items-center gap-1.5 py-3 rounded-lg text-xs font-medium transition-colors
                      ${
                        active
                          ? "bg-emerald-800 text-white"
                          : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <Icon size={20} />
                      {meta.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* ── RIGHT: Events list ── */}
          <div ref={listRef} className="flex-1 min-w-0">
            {/* Header row */}
            <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
              <div>
                <h2 className="font-semibold text-gray-900 text-base sm:text-lg">
                  {selectedDate
                    ? `Events on ${selectedDate.toLocaleDateString("default", {
                        day: "numeric",
                        month: "long",
                      })}`
                    : "Upcoming Events"}
                </h2>
                {!loading && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {filteredEvents.length} event
                    {filteredEvents.length !== 1 ? "s" : ""} found
                  </p>
                )}
              </div>
              {selectedDate && (
                <button
                  onClick={clearDateFilter}
                  className="text-sm text-emerald-700 hover:underline flex items-center gap-1"
                >
                  <CalendarX size={14} /> Show all
                </button>
              )}
            </div>

            {/* States */}
            {loading && (
              <div className="flex flex-col gap-4">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-28 bg-gray-100 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            )}
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {!loading && !error && filteredEvents.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <CalendarX size={40} className="mb-3 opacity-40" />
                <p className="font-medium">No events found</p>
                <p className="text-sm mt-1">
                  {selectedDate
                    ? "No events on this date."
                    : "No events for this category."}
                </p>
                {selectedDate && (
                  <button
                    onClick={clearDateFilter}
                    className="mt-4 text-sm text-emerald-700 hover:underline"
                  >
                    Clear date filter
                  </button>
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

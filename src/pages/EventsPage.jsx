import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, ChevronLeft, CalendarX } from "lucide-react";
import eventService from "../services/eventService";
import EventCalendar from "../components/EventCalendar";
import EventCard from "../components/EventCard";
import { CATEGORY_META, CATEGORY_LIST } from "../utils/eventCategoryMeta";
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const PAGE_SIZE = 10;

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
  const [page, setPage] = useState(1);

  // Fetch all events whenever category changes
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        const filters = activeCategory !== "ALL" ? { category: activeCategory } : {};
        const data = await eventService.getAllEvents(filters);
        setEvents(data);
        setPage(1);
      } catch (err) {
        console.error(err);
        setError("Failed to load events. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [activeCategory]);

  // Reset page when date selection changes
  useEffect(() => {
    setPage(1);
  }, [selectedDate]);

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

  // Paginate
  const totalPages = Math.ceil(filteredEvents.length / PAGE_SIZE);
  const pagedEvents = filteredEvents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
      {/* Hero */}
      <div
        className="relative h-64 bg-cover bg-center flex flex-col justify-end"
        style={{
          backgroundImage:
            "linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.2)), url('/images/events-hero.jpg')",
        }}
      >
        <div className="max-w-7xl mx-auto w-full px-6 pb-8 text-white">
          <div className="flex items-center gap-1 text-sm text-gray-200 mb-3">
            <span
              className="cursor-pointer hover:underline"
              onClick={() => navigate("/")}
            >
              Home
            </span>
            <ChevronRight size={14} />
            <span>Events</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Events in Sri Lanka</h1>
          <p className="text-gray-200 max-w-xl">
            Experience the vibrant culture, traditions and celebrations that make Sri Lanka truly unique.
          </p>
        </div>
      </div>

      {/* Main grid */}
      <div className="max-w-7xl mx-auto px-6 py-8 flex gap-8 items-start">
        {/* ── LEFT SIDEBAR (sticky) ── */}
        <aside className="w-[340px] shrink-0 sticky top-4 self-start">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Event Calendar</h2>
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

            <h3 className="font-semibold text-gray-900 mb-3">Filter by Category</h3>
            <div className="grid grid-cols-4 gap-3">
              {["ALL", ...CATEGORY_LIST].map((key) => {
                const meta = CATEGORY_META[key];
                const Icon = meta.icon;
                const active = activeCategory === key;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setActiveCategory(key);
                      setPage(1);
                    }}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-lg text-xs font-medium transition-colors
                      ${active
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
        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-900 text-lg">
                {selectedDate
                  ? `Events on ${selectedDate.toLocaleDateString("default", {
                      day: "numeric",
                      month: "long",
                    })}`
                  : "Upcoming Events"}
              </h2>
              {!loading && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""} found
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
                <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          )}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {!loading && !error && filteredEvents.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <CalendarX size={40} className="mb-3 opacity-40" />
              <p className="font-medium">No events found</p>
              <p className="text-sm mt-1">
                {selectedDate ? "No events on this date." : "No events for this category."}
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
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50"
              >
                <ChevronLeft size={16} />
              </button>

              {[...Array(totalPages)].map((_, i) => {
                const pg = i + 1;
                // show first, last, current ±1
                const show =
                  pg === 1 ||
                  pg === totalPages ||
                  Math.abs(pg - page) <= 1;
                const isDot =
                  (pg === 2 && page > 4) ||
                  (pg === totalPages - 1 && page < totalPages - 3);
                if (!show) return null;
                if (isDot)
                  return (
                    <span key={pg} className="px-1 text-gray-400">
                      …
                    </span>
                  );
                return (
                  <button
                    key={pg}
                    onClick={() => setPage(pg)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium ${
                      pg === page
                        ? "bg-emerald-800 text-white"
                        : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {pg}
                  </button>
                );
              })}

              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
    <Footer />
    </>
  );
}
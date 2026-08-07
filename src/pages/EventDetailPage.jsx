import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronRight, ChevronLeft, ChevronRight as ChevronRightIcon,
  MapPin, Calendar, RefreshCw, X, ArrowLeft, Tag,
  Plus, Share2, Bookmark, ImageOff
} from "lucide-react";
import eventService from "../services/eventService";
import EventCard from "../components/EventCard";
import { CATEGORY_META } from "../utils/eventCategoryMeta";
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AddToTripModal from "../components/AddToTripModal";

import { useAuth } from "../hooks/useAuth";
import { isEventSaved, toggleSavedEventId } from "../utils/eventBookmarks";

/* ── Helpers ─────────────────────────────────────────────── */
const fmtDate = (str) =>
  new Date(str).toLocaleDateString("en-LK", {
    day: "numeric", month: "long", year: "numeric",
  });

const fmtDuration = (start, end) => {
  const ms = new Date(end) - new Date(start);
  const days = Math.round(ms / (1000 * 60 * 60 * 24));
  if (days === 0) return "1 day";
  return `${days + 1} day${days + 1 !== 1 ? "s" : ""}`;
};

/* ── Lightbox ────────────────────────────────────────────── */
function Lightbox({ images, initialIdx, onClose }) {
  const [idx, setIdx] = useState(initialIdx);
  const prev = () => setIdx((i) => (i - 1 + images.length) % images.length);
  const next = () => setIdx((i) => (i + 1) % images.length);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  return (
    <div
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/70 hover:text-white"
      >
        <X size={28} />
      </button>

      <button
        onClick={(e) => { e.stopPropagation(); prev(); }}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-3"
      >
        <ChevronLeft size={24} />
      </button>

      <img
        src={images[idx]}
        alt=""
        className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />

      <button
        onClick={(e) => { e.stopPropagation(); next(); }}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-3"
      >
        <ChevronRightIcon size={24} />
      </button>

      <div className="absolute bottom-4 flex gap-2">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={(e) => { e.stopPropagation(); setIdx(i); }}
            className={`h-1.5 rounded-full transition-all ${
              i === idx ? "w-6 bg-white" : "w-1.5 bg-white/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Skeleton ────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-[420px] bg-gray-200 rounded-2xl mb-8" />
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-10">
        <div className="space-y-4">
          <div className="h-5 bg-gray-200 rounded w-1/4" />
          <div className="h-8 bg-gray-200 rounded w-2/3" />
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
        </div>
        <div className="h-64 bg-gray-200 rounded-2xl" />
      </div>
    </div>
  );
}

/* ── Main ────────────────────────────────────────────────── */
export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lightbox, setLightbox] = useState(null); // index or null
  const [saved, setSaved] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [selectedRelEvent, setSelectedRelEvent] = useState(null);

  // Sync bookmark state with storage & custom event
  useEffect(() => {
    if (id) {
      setSaved(isEventSaved(user, id));
    }
    const handleUpdate = () => {
      if (id) setSaved(isEventSaved(user, id));
    };
    window.addEventListener("event-bookmarks-updated", handleUpdate);
    return () => window.removeEventListener("event-bookmarks-updated", handleUpdate);
  }, [user, id]);

  const handleToggleSave = () => {
    if (id) {
      const updatedSet = toggleSavedEventId(user, id);
      setSaved(updatedSet.has(id));
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await eventService.getEventById(id);
        setEvent(data);
        // fetch related events (same category, exclude current)
        const rel = await eventService.getAllEvents({ category: data.category });
        setRelated(rel.filter((e) => e.id !== data.id).slice(0, 4));
      } catch {
        setError("Event not found.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <div className="min-h-screen bg-gray-50 py-6"><Skeleton /></div>;
  if (error || !event)
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-gray-500">
        <p className="text-lg font-medium mb-4">{error || "Event not found."}</p>
        <button onClick={() => navigate("/events")} className="text-emerald-700 hover:underline">
          ← Back to Events
        </button>
      </div>
    );

  const images = event.imageUrls?.length ? event.imageUrls : [];
  const meta = CATEGORY_META[event.category] || CATEGORY_META.ALL;
  const Icon = meta.icon;

  return (
    <>
    <Navbar />
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ── Hero Gallery ─────────────────────────────── */}
      <div className="relative bg-gray-900">
        {/* Main hero image */}
        <div className="h-[280px] sm:h-[360px] md:h-[440px] overflow-hidden relative">
          {images.length > 0 ? (
            <img
              src={images[activeImg]}
              alt={event.title}
              className="w-full h-full object-cover opacity-80 transition-all duration-500 cursor-zoom-in"
              onClick={() => setLightbox(activeImg)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-600">
              <ImageOff size={48} className="opacity-30" />
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent" />

          {/* Back button */}
          <button
            onClick={() => navigate("/events")}
            className="absolute top-4 left-4 sm:top-5 sm:left-6 flex items-center gap-2 text-white/80 hover:text-white bg-black/30 hover:bg-black/50 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm transition-all"
          >
            <ArrowLeft size={16} /> Events
          </button>

          {/* Save + share */}
          <div className="absolute top-4 right-4 sm:top-5 sm:right-6 flex gap-2">
            <button
              onClick={() => navigator.share?.({ title: event.title, url: window.location.href })}
              className="bg-black/30 hover:bg-black/50 backdrop-blur-sm text-white p-2 rounded-full transition-all"
            >
              <Share2 size={18} />
            </button>
            <button
              onClick={handleToggleSave}
              className={`backdrop-blur-sm p-2 rounded-full transition-all ${
                saved
                  ? "bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-md"
                  : "bg-black/30 hover:bg-black/50 text-white"
              }`}
              title={saved ? "Remove from Bookmarks" : "Save Event to Bookmarks"}
            >
              <Bookmark size={18} fill={saved ? "currentColor" : "none"} />
            </button>
          </div>

          {/* Title overlay */}
          <div className="absolute bottom-4 sm:bottom-6 left-0 right-0 px-4 sm:px-6 max-w-7xl mx-auto">
            <div className="flex items-center gap-2 text-white/60 text-xs sm:text-sm mb-2">
              <span className="cursor-pointer hover:text-white" onClick={() => navigate("/")}>Home</span>
              <ChevronRight size={14} />
              <span className="cursor-pointer hover:text-white" onClick={() => navigate("/events")}>Events</span>
              <ChevronRight size={14} />
              <span className="text-white/90 truncate max-w-[120px] sm:max-w-[200px]">{event.title}</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${meta.badge}`}>
                <Icon size={14} /> {meta.label}
              </span>
              {event.isRecurring && (
                <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-white/10 text-white/80">
                  <RefreshCw size={13} /> Annual Event
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-white drop-shadow-md">{event.title}</h1>
            <p className="text-white/70 mt-1 flex items-center gap-1.5 text-sm sm:text-base">
              <MapPin size={14} /> {event.location}, {event.region}
            </p>
          </div>
        </div>

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <div className="bg-gray-900 px-4 sm:px-6 py-3 flex gap-2 overflow-x-auto max-w-7xl mx-auto">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImg(i)}
                className={`shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                  i === activeImg ? "border-emerald-500" : "border-transparent opacity-60 hover:opacity-90"
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
            <button
              onClick={() => setLightbox(activeImg)}
              className="shrink-0 w-20 h-14 rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center text-white/40 hover:text-white/70 text-xs"
            >
              View all
            </button>
          </div>
        )}
      </div>

      {/* ── Body ─────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 lg:gap-10">
        {/* Left: content */}
        <div>
          {/* About */}
          <section className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">About this Event</h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">
              {event.description || "No description available for this event."}
            </p>
          </section>

          {/* Photo gallery grid — shows max 6, last tile = "+X more" if there are extras */}
          {images.length > 1 && (
            <section className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Gallery
                  <span className="ml-2 text-sm font-normal text-gray-400">{images.length} photos</span>
                </h2>
                {images.length > 6 && (
                  <button
                    onClick={() => setLightbox(0)}
                    className="text-sm text-emerald-700 hover:underline"
                  >
                    View all {images.length}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {images.slice(0, 6).map((img, i) => {
                  const isLastVisible = i === 5 && images.length > 6;
                  const remaining = images.length - 6;
                  return (
                    <button
                      key={i}
                      onClick={() => setLightbox(i)}
                      className="relative aspect-[4/3] rounded-xl overflow-hidden group"
                    >
                      <img
                        src={img}
                        alt=""
                        className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105
                          ${isLastVisible ? "brightness-50" : ""}`}
                      />
                      {/* hover tint */}
                      {!isLastVisible && (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                      )}
                      {/* "+X more" overlay on last tile */}
                      {isLastVisible && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                          <span className="text-3xl font-bold">+{remaining}</span>
                          <span className="text-sm mt-1 opacity-80">more photos</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Quick facts */}
          <section className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Event Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: Calendar, label: "Start Date", value: fmtDate(event.startDate) },
                { icon: Calendar, label: "End Date", value: fmtDate(event.endDate) },
                { icon: MapPin, label: "Location", value: event.location },
                { icon: Tag, label: "Region", value: event.region },
                { icon: RefreshCw, label: "Duration", value: fmtDuration(event.startDate, event.endDate) },
                { icon: Icon, label: "Category", value: meta.label },
              ].map(({ icon: Ic, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="mt-0.5 p-2 bg-emerald-50 rounded-lg">
                    <Ic size={16} className="text-emerald-700" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className="text-sm font-medium text-gray-800">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right: sticky info card */}
        <aside className="lg:sticky lg:top-4 lg:self-start space-y-4">
          {/* Date card */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={18} className="text-emerald-700" />
              <h3 className="font-semibold text-gray-900">When</h3>
            </div>

            <div className="flex items-stretch gap-4">
              {/* Start */}
              <div className="flex-1 bg-emerald-50 rounded-xl p-3 text-center">
                <p className="text-xs text-emerald-600 font-medium mb-1">Start</p>
                <p className="text-3xl font-bold text-emerald-800 leading-none">
                  {new Date(event.startDate).getDate()}
                </p>
                <p className="text-sm text-emerald-700 mt-1">
                  {new Date(event.startDate).toLocaleString("default", { month: "short", year: "numeric" })}
                </p>
              </div>

              <div className="flex items-center text-gray-300 font-light text-xl">→</div>

              {/* End */}
              <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500 font-medium mb-1">End</p>
                <p className="text-3xl font-bold text-gray-800 leading-none">
                  {new Date(event.endDate).getDate()}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {new Date(event.endDate).toLocaleString("default", { month: "short", year: "numeric" })}
                </p>
              </div>
            </div>

            <p className="text-center text-xs text-gray-400 mt-3">
              {fmtDuration(event.startDate, event.endDate)} event
              {event.isRecurring ? " · Held annually" : ""}
            </p>
          </div>

          {/* Location card */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={18} className="text-emerald-700" />
              <h3 className="font-semibold text-gray-900">Where</h3>
            </div>
            <p className="text-gray-800 font-medium">{event.location}</p>
            <p className="text-sm text-gray-500 mt-0.5">{event.region}, Sri Lanka</p>

            {/* Placeholder map box */}
            <div
              className="mt-3 h-32 rounded-xl overflow-hidden bg-emerald-50 flex items-center justify-center
                border border-emerald-100 cursor-pointer hover:bg-emerald-100 transition-colors"
              onClick={() =>
                window.open(
                  `https://www.google.com/maps/search/${encodeURIComponent(event.location + ", Sri Lanka")}`,
                  "_blank"
                )
              }
            >
              <div className="text-center text-emerald-700">
                <MapPin size={24} className="mx-auto mb-1" />
                <p className="text-xs font-medium">Open in Google Maps</p>
              </div>
            </div>
          </div>

          {/* Add to Trip CTA */}
          <div className="bg-emerald-800 rounded-2xl p-4 sm:p-6 text-white shadow-md">
            <h3 className="font-bold text-base mb-1">Planning a trip?</h3>
            <p className="text-emerald-200 text-xs mb-4 leading-relaxed">
              Add this event directly to your custom Sri Lanka itinerary days.
            </p>
            <button
              onClick={() => setIsTripModalOpen(true)}
              className="w-full bg-white text-emerald-900 font-extrabold text-xs py-3 rounded-xl hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Plus size={16} /> Add to Trip
            </button>
          </div>
        </aside>
      </div>

      {/* ── Related Events ────────────────────────────── */}
      {related.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-12">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-gray-900">
              More {meta.label} Events
            </h2>
            <button
              onClick={() => navigate("/events")}
              className="text-sm text-emerald-700 hover:underline flex items-center gap-1"
            >
              View all <ChevronRightIcon size={14} />
            </button>
          </div>
          <div className="flex flex-col gap-4">
            {related.map((rel) => (
              <EventCard
                key={rel.id}
                event={rel}
                saved={false}
                onSave={() => {}}
                onViewDetails={(rid) => navigate(`/events/${rid}`)}
                onAddToTrip={(relEvt) => setSelectedRelEvent(relEvt)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox !== null && (
        <Lightbox
          images={images}
          initialIdx={lightbox}
          onClose={() => setLightbox(null)}
        />
      )}

      {/* Add To Trip Modals */}
      <AddToTripModal
        event={event}
        isOpen={isTripModalOpen}
        onClose={() => setIsTripModalOpen(false)}
      />

      <AddToTripModal
        event={selectedRelEvent}
        isOpen={!!selectedRelEvent}
        onClose={() => setSelectedRelEvent(null)}
      />
    </div>
    <Footer />
    </>
  );
}
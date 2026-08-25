import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, MapPin, Plus, CheckCircle2, AlertCircle, X, Sparkles, LogIn } from "lucide-react";
import tripsService from "../services/Tripsservice";
import { useAuth } from "../hooks/useAuth";

/**
 * AddToTripModal
 * Unified modal allowing travelers to add an event to one of their existing trip days.
 * Uses real endpoints: GET /api/v1/trips/my, GET /api/v1/trips/{id}, POST /api/v1/trips/{tripId}/days/{dayId}/items
 */
export default function AddToTripModal({ event, isOpen, onClose }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [trips, setTrips] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState("");
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [selectedDayId, setSelectedDayId] = useState("");

  const [loadingTrips, setLoadingTrips] = useState(true);
  const [loadingTripDetail, setLoadingTripDetail] = useState(false);
  const [adding, setAdding] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message, tripId }
  const [alreadyExists, setAlreadyExists] = useState(false);

  // Fetch user's trips when modal opens
  useEffect(() => {
    if (!isOpen) {
      setFeedback(null);
      return;
    }

    if (!isAuthenticated) {
      setLoadingTrips(false);
      return;
    }

    const loadTrips = async () => {
      setLoadingTrips(true);
      setFeedback(null);
      try {
        const data = await tripsService.getMyTrips();
        setTrips(data || []);
        if (data && data.length > 0) {
          setSelectedTripId(String(data[0].id));
        }
      } catch (err) {
        console.error("Failed to load user trips:", err);
        setFeedback({ type: "error", message: "Failed to load your trips. Please try again." });
      } finally {
        setLoadingTrips(false);
      }
    };

    loadTrips();
  }, [isOpen, isAuthenticated]);

  // Fetch detail for selected trip (to get days and items)
  useEffect(() => {
    if (!selectedTripId) {
      setSelectedTrip(null);
      setSelectedDayId("");
      return;
    }

    const loadDetail = async () => {
      setLoadingTripDetail(true);
      try {
        const detail = await tripsService.getTripById(selectedTripId);
        setSelectedTrip(detail);
        if (detail?.days?.length > 0) {
          setSelectedDayId(String(detail.days[0].id));
        }
      } catch (err) {
        console.error("Failed to load trip details:", err);
      } finally {
        setLoadingTripDetail(false);
      }
    };

    loadDetail();
  }, [selectedTripId]);

  // Check for duplicates when selectedDayId or event changes
  useEffect(() => {
    if (!selectedTrip || !selectedDayId || !event) {
      setAlreadyExists(false);
      return;
    }

    const currentDay = selectedTrip.days?.find((d) => String(d.id) === String(selectedDayId));
    if (!currentDay || !currentDay.items) {
      setAlreadyExists(false);
      return;
    }

    const duplicate = currentDay.items.some(
      (item) =>
        String(item.referenceId) === String(event.id) ||
        (item.title && event.title && item.title.toLowerCase().includes(event.title.toLowerCase()))
    );

    setAlreadyExists(duplicate);
  }, [selectedTrip, selectedDayId, event]);

  if (!isOpen) return null;

  const handleAdd = async () => {
    if (!selectedTripId || !selectedDayId || !event) return;

    setAdding(true);
    setFeedback(null);

    const titleToAdd = event.title?.startsWith("Festival:")
      ? event.title
      : `Festival: ${event.title}`;

    try {
      await tripsService.addItemToDay(selectedTripId, selectedDayId, {
        type: "ACTIVITY",
        referenceId: String(event.id),
        title: titleToAdd,
        cost: 0,
        currency: "LKR",
        notes: `${event.location || ""}${event.region ? `, ${event.region}` : ""}`,
      });

      const dayObj = selectedTrip?.days?.find((d) => String(d.id) === String(selectedDayId));
      const dayNum = dayObj ? `Day ${dayObj.dayNumber}` : "your trip day";

      setFeedback({
        type: "success",
        message: `Successfully added "${event.title}" to ${selectedTrip.title} (${dayNum})!`,
        tripId: selectedTripId,
      });

      // Update local state to reflect addition and prevent duplicate re-adds
      setSelectedTrip((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          days: prev.days.map((d) =>
            String(d.id) === String(selectedDayId)
              ? {
                  ...d,
                  items: [
                    ...(d.items || []),
                    {
                      id: Date.now(),
                      type: "ACTIVITY",
                      referenceId: String(event.id),
                      title: titleToAdd,
                    },
                  ],
                }
              : d
          ),
        };
      });
      setAlreadyExists(true);
    } catch (err) {
      console.error("Failed to add event to trip:", err);
      setFeedback({
        type: "error",
        message: err.response?.data?.message || "Could not add event to trip. Please try again.",
      });
    } finally {
      setAdding(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 to-teal-800 text-white p-5 sm:p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-3xs font-extrabold uppercase tracking-widest text-emerald-200 mb-2">
            <Sparkles size={12} /> Add Event to Itinerary
          </span>
          <h2 className="text-lg sm:text-xl font-extrabold text-white leading-snug line-clamp-1">
            {event?.title || "Add Event"}
          </h2>
          <p className="text-xs text-emerald-100/90 mt-1 flex items-center gap-1">
            <MapPin size={13} className="text-amber-300 shrink-0" />
            <span className="truncate">{event?.location}, {event?.region}</span>
          </p>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4">
          {!isAuthenticated ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
                <LogIn size={24} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Authentication Required</h3>
                <p className="text-xs font-medium text-slate-500 mt-1 max-w-xs mx-auto">
                  Please log in to your ExploreCeylon account to add events to your personalized trip itinerary.
                </p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  navigate("/login");
                }}
                className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs py-3 rounded-xl shadow-sm transition-all"
              >
                Log In to Continue →
              </button>
            </div>
          ) : loadingTrips ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-emerald-800 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-500">Loading your trips...</p>
            </div>
          ) : trips.length === 0 ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto text-emerald-700">
                <Calendar size={24} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">You don't have any trips yet</h3>
                <p className="text-xs font-medium text-slate-500 mt-1 max-w-xs mx-auto">
                  Create a trip first, then add festivals and events to your days!
                </p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  navigate("/create-trip");
                }}
                className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs py-3 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <Plus size={16} /> Create a Trip First
              </button>
            </div>
          ) : (
            <>
              {/* Trip Selector */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Trip
                </label>
                <select
                  value={selectedTripId}
                  onChange={(e) => setSelectedTripId(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:outline-2 focus:outline-emerald-800 transition-all cursor-pointer"
                >
                  {trips.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title || `Trip #${t.id}`} ({t.fromLocation || "Sri Lanka"} → {t.toLocation || "Sri Lanka"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Day Selector */}
              {loadingTripDetail ? (
                <div className="py-4 text-center">
                  <span className="text-xs font-medium text-slate-400">Loading trip days...</span>
                </div>
              ) : selectedTrip && selectedTrip.days?.length > 0 ? (
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Select Trip Day
                  </label>
                  <select
                    value={selectedDayId}
                    onChange={(e) => setSelectedDayId(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:outline-2 focus:outline-emerald-800 transition-all cursor-pointer"
                  >
                    {selectedTrip.days.map((d) => (
                      <option key={d.id} value={d.id}>
                        Day {d.dayNumber} - {d.region || "Region"} ({d.date ? new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""})
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              {/* Duplicate Warning */}
              {alreadyExists && !feedback && (
                <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 flex items-start gap-2.5 text-amber-800 text-xs font-medium">
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-600" />
                  <span>This event is already added to the selected day of this trip.</span>
                </div>
              )}

              {/* Feedback Alert */}
              {feedback && (
                <div
                  className={`rounded-xl p-3.5 text-xs font-semibold flex items-start gap-2.5 ${
                    feedback.type === "success"
                      ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
                      : "bg-rose-50 border border-rose-200 text-rose-800"
                  }`}
                >
                  {feedback.type === "success" ? (
                    <CheckCircle2 size={18} className="shrink-0 text-emerald-700 mt-0.5" />
                  ) : (
                    <AlertCircle size={18} className="shrink-0 text-rose-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p>{feedback.message}</p>
                    {feedback.type === "success" && (
                      <button
                        onClick={() => {
                          onClose();
                          navigate(`/trips/${feedback.tripId}`);
                        }}
                        className="mt-2 text-xs font-bold text-emerald-800 hover:underline inline-flex items-center gap-1"
                      >
                        View Trip Itinerary →
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 border border-slate-200 rounded-xl py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all"
                >
                  {feedback?.type === "success" ? "Close" : "Cancel"}
                </button>
                {feedback?.type === "success" ? (
                  <button
                    onClick={() => {
                      onClose();
                      navigate(`/trips/${feedback.tripId}`);
                    }}
                    className="flex-1 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl py-2.5 text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                  >
                    View My Trip →
                  </button>
                ) : (
                  <button
                    onClick={handleAdd}
                    disabled={adding || alreadyExists || !selectedDayId}
                    className="flex-1 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white rounded-xl py-2.5 text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                  >
                    {adding ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus size={15} /> Add to Selected Trip
                      </>
                    )}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import apiClient from "../../services/api";

export default function VehicleBookingDrawer({ vehicle, onClose, onSuccess }) {
  const [pickupDate, setPickupDate] = useState("");
  const [dropoffDate, setDropoffDate] = useState("");
  const [pickupTime, setPickupTime] = useState("10:00");
  const [dropoffTime, setDropoffTime] = useState("10:00");
  const [pickupLoc, setPickupLoc] = useState("");
  const [dropoffLoc, setDropoffLoc] = useState("");
  const [tripId, setTripId] = useState("");
  const [notes, setNotes] = useState("");
  const [trips, setTrips] = useState([]);
  const [avail, setAvail] = useState(null); // true | false | null
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Fetch user's trips for the "Link to Trip" dropdown
  useEffect(() => {
    apiClient.get("/api/v1/trips/my")
      .then((r) => r.data || [])
      .then(setTrips)
      .catch(() => setTrips([]));
  }, []);

  // Close on Escape
  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  // Duration in days
  const duration = (() => {
    if (!pickupDate || !dropoffDate) return 0;
    const diff =
      (new Date(dropoffDate) - new Date(pickupDate)) / (1000 * 60 * 60 * 24);
    return diff > 0 ? diff : 0;
  })();

  const subtotal = duration * (vehicle?.pricePerDay || 0);

  const checkAvailability = async () => {
    if (!pickupDate || !dropoffDate) return;
    setChecking(true);
    setAvail(null);
    try {
      const params = new URLSearchParams({
        vehicleId: vehicle.id,
        pickupDate,
        dropoffDate,
      });
      const res = await apiClient.get(`/api/v1/vehicle-bookings/check-availability?${params}`);
      setAvail(res.data);
    } catch {
      setAvail(null);
    } finally {
      setChecking(false);
    }
  };

  const confirmBooking = async () => {
    if (!pickupDate || !dropoffDate || !pickupLoc) {
      setError("Please fill pickup date, dropoff date and pickup location.");
      return;
    }
    if (avail === false) {
      setError("Vehicle is not available for the selected dates.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const body = {
        vehicleId: vehicle.id,
        pickupDate,
        dropoffDate,
        pickupTime: pickupTime + ":00",
        dropoffTime: dropoffTime + ":00",
        pickupLocation: pickupLoc,
        dropoffLocation: dropoffLoc || pickupLoc,
        ...(tripId ? { tripId: Number(tripId) } : {}),
        notes,
      };
      const res = await apiClient.post("/api/v1/vehicle-bookings", body);
      onSuccess?.(res.data);
      onClose();
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!vehicle) return null;

  const imageUrl =
    vehicle.imageUrls?.[0] ||
    `https://placehold.co/80x60/1a5c38/white?text=${encodeURIComponent(vehicle.name)}`;

  const fmt = (n) => n.toFixed(2);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed top-0 right-0 z-50 flex flex-col w-full h-full max-w-xl overflow-hidden bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Book — {vehicle.name}
          </h2>
          <button
            onClick={onClose}
            className="text-2xl leading-none text-gray-400 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 px-6 py-5 space-y-5 overflow-y-auto">
          {/* Vehicle summary card */}
          <div className="flex items-center gap-4 p-3 border border-gray-200 bg-gray-50 rounded-xl">
            <img
              src={imageUrl}
              alt={vehicle.name}
              className="flex-shrink-0 object-cover w-20 h-16 rounded-lg"
              onError={(e) => {
                e.target.src = `https://placehold.co/80x60/1a5c38/white?text=${encodeURIComponent(vehicle.name)}`;
              }}
            />
            <div>
              <p className="font-semibold text-gray-900">{vehicle.name}</p>
              <p className="text-sm text-gray-500">📍 {vehicle.district}</p>
              <p className="font-bold text-green-700">
                ${vehicle.pricePerDay}/day
              </p>
            </div>
          </div>

          {/* Dates & Times */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Pickup Date
              </label>
              <input
                type="date"
                value={pickupDate}
                onChange={(e) => {
                  setPickupDate(e.target.value);
                  setAvail(null);
                }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Dropoff Date
              </label>
              <input
                type="date"
                value={dropoffDate}
                min={pickupDate}
                onChange={(e) => {
                  setDropoffDate(e.target.value);
                  setAvail(null);
                }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Pickup Time
              </label>
              <input
                type="time"
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Dropoff Time
              </label>
              <input
                type="time"
                value={dropoffTime}
                onChange={(e) => setDropoffTime(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
              />
            </div>
          </div>

          {/* Locations */}
          <div className="space-y-3">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Pickup Location
              </label>
              <input
                type="text"
                placeholder="Enter pickup address or landmark"
                value={pickupLoc}
                onChange={(e) => setPickupLoc(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Dropoff Location
              </label>
              <input
                type="text"
                placeholder="Same as pickup"
                value={dropoffLoc}
                onChange={(e) => setDropoffLoc(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
              />
            </div>
          </div>

          {/* Link to Trip */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Link to Trip
            </label>
            <select
              value={tripId}
              onChange={(e) => setTripId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
            >
              <option value="">Select trip (optional)</option>
              {trips.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name || `Trip #${t.id}`}
                </option>
              ))}
            </select>
          </div>

          {/* Special Notes */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Special Notes
            </label>
            <textarea
              placeholder="Any special requests..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:border-green-600"
            />
          </div>

          {/* Cost Summary */}
          <div className="p-4 space-y-2 border border-gray-200 bg-gray-50 rounded-xl">
            <h4 className="font-semibold text-gray-800">Cost Summary</h4>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Duration:</span>
              <span>
                {duration > 0
                  ? `${duration} day${duration > 1 ? "s" : ""}`
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Rate:</span>
              <span>${vehicle.pricePerDay}/day</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal:</span>
              <span>{duration > 0 ? `$${fmt(subtotal)}` : "—"}</span>
            </div>
            {tripId && (
              <p className="text-xs font-medium text-green-600">
                ✓ Auto-added to Budget Tracker
              </p>
            )}
            <div className="flex justify-between pt-1 font-bold text-gray-900 border-t border-gray-200">
              <span>Total:</span>
              <span>{duration > 0 ? `$${fmt(subtotal)}` : "—"}</span>
            </div>
          </div>

          {/* Availability result */}
          {avail === true && (
            <div className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-green-700 border border-green-200 rounded-lg bg-green-50">
              <span>✅</span> Available for selected dates
            </div>
          )}
          {avail === false && (
            <div className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-red-600 border border-red-200 rounded-lg bg-red-50">
              <span>❌</span> Not available for these dates
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="px-4 py-3 text-sm text-red-600 border border-red-200 rounded-lg bg-red-50">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Sticky footer */}
        <div className="flex gap-3 px-6 py-4 bg-white border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={checkAvailability}
            disabled={!pickupDate || !dropoffDate || checking}
            className="px-5 py-2.5 rounded-xl border border-green-700 text-green-700 text-sm font-medium hover:bg-green-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {checking ? "Checking…" : "Check Availability"}
          </button>
          <button
            onClick={confirmBooking}
            disabled={submitting || !vehicle.available}
            className="flex-1 py-2.5 rounded-xl bg-green-700 text-white text-sm font-semibold hover:bg-green-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? "Confirming…" : "Confirm Booking →"}
          </button>
        </div>
      </div>
    </>
  );
}

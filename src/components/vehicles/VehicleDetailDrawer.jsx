import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { vehicleService } from "../../services/vehicleService";
import { useCart } from "../../hooks/useCart";
import { useRequireAuth } from "../../hooks/useRequireAuth";
import { useAuth } from "../../hooks/useAuth";
import VehicleReviews from "../VehicleReviews";
import apiClient from "../../services/api";

export default function VehicleDetailDrawer({ vehicleId, onClose }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart, isInCart } = useCart();
  const requireAuth = useRequireAuth();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imgIndex, setImgIndex] = useState(0);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [avail, setAvail] = useState(null);
  const [checkingAvail, setCheckingAvail] = useState(false);

  const fetchVehicle = useCallback(() => {
    if (!vehicleId) return;
    return vehicleService.getVehicleById(vehicleId).then(setVehicle);
  }, [vehicleId]);

  useEffect(() => {
    if (!vehicleId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting drawer state for the newly selected vehicle before fetching
    setLoading(true);
    setImgIndex(0);
    setAvail(null);
    fetchVehicle().finally(() => setLoading(false));
  }, [vehicleId, fetchVehicle]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const checkAvailability = async () => {
    if (!fromDate || !toDate) return;
    setCheckingAvail(true);
    try {
      const params = new URLSearchParams({
        vehicleId,
        pickupDate: fromDate,
        dropoffDate: toDate,
      });
      const res = await apiClient.get(`/api/v1/vehicle-bookings/check-availability?${params}`);
      setAvail(res.data);
    } catch {
      setAvail(null);
    } finally {
      setCheckingAvail(false);
    }
  };

  if (!vehicleId) return null;

  const images = vehicle?.imageUrls?.length
    ? vehicle.imageUrls
    : [
        `https://placehold.co/600x300/1a5c38/white?text=${encodeURIComponent(vehicle?.name || "")}`,
      ];

  const features = [
    vehicle?.driverIncluded && "Driver Included",
    ["CAR", "VAN", "MINIVAN"].includes(vehicle?.type) && "AC",
    "City Tours",
    "Day Trips",
    "Luggage Space",
  ].filter(Boolean);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[1000] transition-opacity bg-black/40"
        onClick={onClose}
      />

      {/* Drawer — z-[1001] because Navbar is sticky at z-[1000] and would
          otherwise render on top of (and hide) this panel's header. */}
      <div className="fixed top-0 right-0 z-[1001] flex flex-col w-full h-full max-w-xl overflow-hidden bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {loading ? "Loading…" : vehicle?.name}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex items-center justify-center w-8 h-8 text-gray-400 rounded-full hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center flex-1">
            <div className="w-8 h-8 border-4 border-gray-200 rounded-full border-t-green-700 animate-spin" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {/* ── Image carousel ── */}
            <div className="relative bg-gray-900 h-60">
              <img
                src={images[imgIndex]}
                alt={vehicle.name}
                className="object-cover w-full h-full"
                onError={(e) => {
                  e.target.src = `https://placehold.co/600x300/1a5c38/white?text=${encodeURIComponent(vehicle.name)}`;
                }}
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setImgIndex(
                        (i) => (i - 1 + images.length) % images.length,
                      )
                    }
                    className="absolute flex items-center justify-center w-8 h-8 text-white -translate-y-1/2 rounded-full left-3 top-1/2 bg-black/50 hover:bg-black/70"
                  >
                    ←
                  </button>
                  <button
                    onClick={() => setImgIndex((i) => (i + 1) % images.length)}
                    className="absolute flex items-center justify-center w-8 h-8 text-white -translate-y-1/2 rounded-full right-3 top-1/2 bg-black/50 hover:bg-black/70"
                  >
                    →
                  </button>
                  <span className="absolute px-2 py-1 text-xs text-white rounded-full bottom-3 right-3 bg-black/60">
                    {imgIndex + 1}/{images.length}
                  </span>
                  {/* Dots */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setImgIndex(i)}
                        className={`w-2 h-2 rounded-full transition-colors ${i === imgIndex ? "bg-white" : "bg-white/40"}`}
                      />
                    ))}
                  </div>
                </>
              )}
              {/* Badges */}
              <div className="absolute flex gap-2 top-3 left-3">
                <span className="px-2 py-1 text-xs font-bold text-white bg-gray-900 rounded">
                  {vehicle.type}
                </span>
                <span
                  className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded ${vehicle.available ? "bg-green-600 text-white" : "bg-red-500 text-white"}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
                  {vehicle.available ? "Available" : "Unavailable"}
                </span>
              </div>
            </div>

            <div className="px-6 py-5 space-y-6">
              {/* Title + rating */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {vehicle.name}
                </h3>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                  {vehicle.rating > 0 && (
                    <span className="flex items-center gap-1">
                      {"★"
                        .repeat(5)
                        .split("")
                        .map((s, i) => (
                          <span
                            key={i}
                            className={
                              i < Math.round(vehicle.rating)
                                ? "text-yellow-400"
                                : "text-gray-300"
                            }
                          >
                            {s}
                          </span>
                        ))}
                      <span className="font-medium text-gray-700">
                        {vehicle.rating.toFixed(1)}
                      </span>
                      <span className="text-gray-400">
                        ({vehicle.reviewCount} reviews)
                      </span>
                    </span>
                  )}
                  <span>📍 {vehicle.district}</span>
                  <span>👥 {vehicle.seats} seats</span>
                </div>
              </div>

              {/* Vehicle Specifications */}
              <div>
                <h4 className="mb-3 font-semibold text-gray-800">
                  Vehicle Specifications
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: "🚗", label: "Type", value: vehicle.type },
                    {
                      icon: "🏷",
                      label: "Category",
                      value: vehicle.category || "Local",
                    },
                    {
                      icon: "👥",
                      label: "Seats",
                      value: `${vehicle.seats} People`,
                    },
                    {
                      icon: "❄️",
                      label: "AC",
                      value: ["CAR", "VAN", "MINIVAN"].includes(vehicle.type)
                        ? "Yes ✓"
                        : "No",
                    },
                    {
                      icon: "🧑",
                      label: "Driver",
                      value: vehicle.driverIncluded
                        ? "Included ✓"
                        : "Not included",
                    },
                  ].map(({ icon, label, value }) => (
                    <div key={label}>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mb-0.5">
                        <span>{icon}</span> {label}
                      </p>
                      <p className="text-sm font-semibold text-gray-800">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Driver */}
              {vehicle.driverName && (
                <div>
                  <h4 className="mb-3 font-semibold text-gray-800">
                    Your Driver 🧑
                  </h4>
                  <div className="flex items-center gap-3 p-3 border border-green-200 bg-green-50 rounded-xl">
                    <div className="flex items-center justify-center flex-shrink-0 text-sm font-bold text-white bg-green-700 rounded-full w-11 h-11">
                      {vehicle.driverName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {vehicle.driverName}
                      </p>
                      {vehicle.driverLanguages && (
                        <p className="text-sm text-gray-500">
                          🗣 Languages: {vehicle.driverLanguages}
                        </p>
                      )}
                      <p className="text-sm font-medium text-green-600">
                        ✓ Verified Driver
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Features */}
              <div>
                <h4 className="mb-2 font-semibold text-gray-800">
                  ✓ Features & Amenities
                </h4>
                <ul className="space-y-1.5">
                  {features.map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-2 text-sm text-gray-600"
                    >
                      <span className="text-green-600">✓</span> {f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* About */}
              {vehicle.description && (
                <div>
                  <h4 className="mb-1 font-semibold text-gray-800">
                    About this vehicle
                  </h4>
                  <p className="text-sm leading-relaxed text-gray-500">
                    {vehicle.description}
                  </p>
                  {vehicle.pickupLocation && (
                    <p className="mt-2 text-sm text-gray-500">
                      📍 <span className="font-medium">Pickup:</span>{" "}
                      <span className="text-green-700">
                        {vehicle.pickupLocation}
                      </span>
                    </p>
                  )}
                </div>
              )}

              {/* Check Availability */}
              <div className="p-4 border border-gray-200 bg-gray-50 rounded-xl">
                <h4 className="mb-3 font-semibold text-gray-800">
                  🗓 Check Availability & Pricing
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block mb-1 text-xs text-gray-500">
                      From
                    </label>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => {
                        setFromDate(e.target.value);
                        setAvail(null);
                      }}
                      className="w-full min-w-0 max-w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-xs text-gray-500">
                      To
                    </label>
                    <input
                      type="date"
                      value={toDate}
                      min={fromDate}
                      onChange={(e) => {
                        setToDate(e.target.value);
                        setAvail(null);
                      }}
                      className="w-full min-w-0 max-w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                    />
                  </div>
                </div>
                <button
                  onClick={checkAvailability}
                  disabled={!fromDate || !toDate || checkingAvail}
                  className="w-full py-2.5 rounded-lg text-sm font-medium border border-green-700 text-green-700 hover:bg-green-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {checkingAvail ? "Checking…" : "Check Availability"}
                </button>
                {avail === true && (
                  <p className="mt-2 text-sm font-medium text-center text-green-600">
                    ✓ Available for selected dates!
                  </p>
                )}
                {avail === false && (
                  <p className="mt-2 text-sm font-medium text-center text-red-500">
                    ✗ Not available for these dates.
                  </p>
                )}
              </div>

              {/* Reviews — live, wired to the backend */}
              <VehicleReviews
                vehicleId={vehicle.id}
                onReviewAdded={fetchVehicle}
              />
            </div>
          </div>
        )}

        {/* Sticky footer */}
        {!loading && vehicle && (
          <div className="px-6 py-4 bg-white border-t border-gray-200 space-y-3">
            <div>
              <span className="text-2xl font-bold text-gray-900">
                ${vehicle.pricePerDay}
              </span>
              <span className="text-sm text-gray-400">/day</span>
            </div>

            <div className="flex gap-2">
              {isInCart("vehicle", vehicle.id) ? (
                <button
                  onClick={() => navigate("/profile?tab=cart")}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-emerald-50 text-emerald-700 border border-emerald-200 transition-colors"
                >
                  ✓ In Cart — View Cart
                </button>
              ) : (
                <button
                  onClick={() =>
                    requireAuth(
                      () => {
                        if (user?.kycStatus !== "APPROVED") {
                          navigate("/verification");
                          return;
                        }
                        addToCart({
                          type: "vehicle",
                          id: vehicle.id,
                          name: vehicle.name,
                          price: vehicle.pricePerDay,
                          image: vehicle.imageUrls?.[0],
                          meta: {
                            district: vehicle.district,
                            type: vehicle.type,
                            seats: vehicle.seats,
                            driverName: vehicle.driverName,
                            driverPhone: vehicle.driverPhone,
                            whatsappNumber: vehicle.whatsappNumber,
                            languages: vehicle.driverLanguages,
                          },
                        });
                      },
                      {
                        title: "Sign in required",
                        message: "Please sign in or create an account to add vehicles to your cart."
                      }
                    )
                  }
                  disabled={!vehicle.available}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-sm border border-green-700 text-green-700 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  + Add to Cart
                </button>
              )}
              {(vehicle.whatsappNumber || vehicle.driverPhone) && (
                <a
                  href={`https://wa.me/${String(vehicle.whatsappNumber || vehicle.driverPhone).replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 py-2.5 px-4 rounded-xl font-semibold text-sm border border-[#25D366] text-[#128C4B] hover:bg-green-50 transition-colors whitespace-nowrap"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Chat
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

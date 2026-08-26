import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useCart } from "../hooks/useCart";
import { payGuide, payVehicle, calcAdvanceAmount, calcFinalAmount } from "../services/paymentService";
import apiClient from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// ── Helpers ────────────────────────────────────────────────
function calcDays(start, end) {
  if (!start || !end) return 0;
  return Math.max(0, Math.round((new Date(end) - new Date(start)) / 86400000) + 1);
}
function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── Step Indicator ─────────────────────────────────────────
function StepBar({ current }) {
  const steps = [
    { num: 1, label: "Availability" },
    { num: 2, label: "Inquiry"      },
    { num: 3, label: "Confirm"      },
    { num: 4, label: "Pay 20%"      },
  ];
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((s, i) => (
        <div key={s.num} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center
                            text-sm font-bold border-2 transition-all
                            ${s.num < current  ? "bg-[#1a5c2a] border-[#1a5c2a] text-white"   : ""}
                            ${s.num === current ? "bg-white border-[#1a5c2a] text-[#1a5c2a]"  : ""}
                            ${s.num > current  ? "bg-white border-gray-200 text-gray-300"      : ""}`}>
              {s.num < current ? "✓" : s.num}
            </div>
            <span className={`text-[10px] whitespace-nowrap
              ${s.num === current ? "text-[#1a5c2a] font-semibold" : "text-gray-400"}`}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mx-1 mb-4
              ${s.num < current ? "bg-[#1a5c2a]" : "bg-gray-200"}`}/>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Item Mini Card ─────────────────────────────────────────
function ItemCard({ item, type, startDate, endDate }) {
  const days  = calcDays(startDate, endDate);
  const total = days * (item?.pricePerDay || item?.price || 0);
  const adv   = calcAdvanceAmount(total);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6 flex items-center gap-4">
      <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center text-2xl flex-shrink-0">
        {type === "guide" ? "👤" : "🚗"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-900 text-sm">
          {item?.fullName || item?.name || "—"}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          📍 {item?.district || "—"}
          {type === "guide"
            ? ` · ${item?.specialties || ""}`
            : ` · ${item?.type || ""} · ${item?.seats || ""} seats`}
        </p>
        <p className="text-xs text-gray-400">
          📅 {fmtDate(startDate)} – {fmtDate(endDate)} · {days} day{days !== 1 ? "s" : ""}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-lg font-bold text-[#1a5c2a]">${total.toFixed(2)}</p>
        <p className="text-[11px] text-gray-400">20% now: ${adv.toFixed(2)}</p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// STEP 1 — Availability Check
// ══════════════════════════════════════════════════════════
function Step1Availability({ item, type, startDate, endDate,
  setStartDate, setEndDate, onNext, loading, availResult }) {

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-1">📅 Check Availability</h2>
      <p className="text-sm text-gray-400 mb-5">
        Confirm your dates before proceeding
      </p>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">
              {type === "guide" ? "Start Date" : "Pickup Date"}
            </label>
            <input type="date" value={startDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={e => setStartDate(e.target.value)}
              className="w-full min-w-0 max-w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm
                         outline-none focus:border-[#1a5c2a] focus:ring-2 focus:ring-green-100"/>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">
              {type === "guide" ? "End Date" : "Return Date"}
            </label>
            <input type="date" value={endDate}
              min={startDate || new Date().toISOString().split("T")[0]}
              onChange={e => setEndDate(e.target.value)}
              className="w-full min-w-0 max-w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm
                         outline-none focus:border-[#1a5c2a] focus:ring-2 focus:ring-green-100"/>
          </div>
        </div>

        {/* Date summary */}
        {startDate && endDate && (
          <div className="bg-gray-50 rounded-xl px-4 py-3 mb-5 flex justify-between items-center">
            <span className="text-sm text-gray-600">
              🕐 <strong>{calcDays(startDate, endDate)}</strong> days selected
            </span>
            <span className="text-sm font-bold text-[#1a5c2a]">
              ${(calcDays(startDate, endDate) * (item?.pricePerDay || item?.price || 0)).toFixed(2)}
            </span>
          </div>
        )}

        {/* Result */}
        {availResult === "available" && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200
                          rounded-xl px-4 py-3 mb-5">
            <span className="text-xl">✅</span>
            <div>
              <p className="text-sm font-bold text-green-800">Available!</p>
              <p className="text-xs text-green-600">
                {item?.fullName || item?.name} is free for your dates.
              </p>
            </div>
          </div>
        )}
        {availResult === "unavailable" && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200
                          rounded-xl px-4 py-3 mb-5">
            <span className="text-xl">❌</span>
            <p className="text-sm font-bold text-red-700">
              Not available for selected dates. Try different dates.
            </p>
          </div>
        )}

        <button onClick={onNext} disabled={!startDate || !endDate || loading}
          className="w-full py-3 bg-[#1a5c2a] hover:bg-[#14471f] text-white
                     rounded-xl text-sm font-semibold transition-colors
                     disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? (
            <><span className="w-4 h-4 border-2 border-white/30 border-t-white
                               rounded-full animate-spin"/><span>Checking…</span></>
          ) : availResult === "available" ? "Continue →" : "Check Availability"}
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// STEP 2 — WhatsApp Inquiry
// ══════════════════════════════════════════════════════════
function Step2Inquiry({ item, type, startDate, endDate, onNext, onBack }) {
  const days = calcDays(startDate, endDate);
  const personName = item?.fullName || item?.driverName || item?.meta?.driverName || item?.name || "them";
  // Prefer the raw whatsappNumber (stored without '+'/spaces, e.g. "94771234567").
  // Fall back to the plain phone digits for older records without a WhatsApp number.
  // Cart-sourced items nest driver/guide contact details under `meta`.
  const waNumber = (
    item?.whatsappNumber || item?.phone || item?.driverPhone ||
    item?.meta?.whatsappNumber || item?.meta?.phone || item?.meta?.driverPhone || ""
  ).replace(/\D/g, "");

  const waText = encodeURIComponent(
    `Hi${type === "guide" ? ` ${personName}` : ""}! I'm interested in booking your ` +
    `${type} service from ${fmtDate(startDate)} to ${fmtDate(endDate)} (${days} day${days !== 1 ? "s" : ""}). ` +
    `Could you confirm availability and any special requirements? — via ExploreCeylon`
  );
  const waLink = waNumber ? `https://wa.me/${waNumber}?text=${waText}` : null;

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-1">💬 Contact Before Booking</h2>
      <p className="text-sm text-gray-400 mb-5">
        Chat with the {type === "guide" ? "guide" : "driver"} to discuss details.
        <span className="text-gray-300"> (Optional)</span>
      </p>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
        {/* WhatsApp */}
        {waLink ? (
          <a href={waLink} target="_blank" rel="noreferrer"
            className="flex items-center justify-center gap-3 w-full py-4 mb-4
                       bg-[#25D366] hover:bg-[#1da851] text-white rounded-2xl
                       font-semibold text-sm transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            Chat on WhatsApp with {personName}
          </a>
        ) : (
          <div className="flex items-center justify-center gap-2 bg-gray-50 rounded-xl p-4 mb-4 text-sm text-gray-400">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            WhatsApp number not available
          </div>
        )}

        {/* In-app message */}
        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold text-gray-400 mb-2">
            Or send a platform message:
          </p>
          <textarea rows={3}
            placeholder={`Hi! I'd like to book your ${type} service for ${fmtDate(startDate)}...`}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm
                       outline-none focus:border-[#1a5c2a] focus:ring-2
                       focus:ring-green-100 resize-none mb-2"/>
          <button className="w-full py-2 border border-[#1a5c2a] text-[#1a5c2a]
                             rounded-xl text-sm font-semibold hover:bg-green-50
                             transition-colors">
            Send Message
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack}
          className="flex-1 py-3 border border-gray-200 rounded-xl text-sm
                     text-gray-600 hover:bg-gray-50 transition-colors">
          ← Back
        </button>
        <button onClick={onNext}
          className="flex-1 py-3 bg-[#1a5c2a] hover:bg-[#14471f] text-white
                     rounded-xl text-sm font-semibold transition-colors">
          Skip & Proceed to Book →
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// STEP 3 — Booking Confirm Form
// ══════════════════════════════════════════════════════════
function Step3Confirm({ item, type, startDate, endDate,
  bookingNote, setBookingNote, pickupLocation, setPickupLocation,
  pickupTime, setPickupTime, dropoffTime, setDropoffTime,
  dropoffLocation, setDropoffLocation,
  onNext, onBack, creating }) {

  const days  = calcDays(startDate, endDate);
  const total = days * (item?.pricePerDay || item?.price || 0);
  const adv   = calcAdvanceAmount(total);
  const fin   = calcFinalAmount(total);

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-1">📋 Confirm Booking</h2>
      <p className="text-sm text-gray-400 mb-5">Review details before payment</p>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
        <h3 className="text-sm font-bold text-gray-800 mb-4">Your Details</h3>
        <div className="space-y-3 mb-5">
          {type === "vehicle" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 block">
                    Pickup Time
                  </label>
                  <input type="time" value={pickupTime}
                    onChange={e => setPickupTime(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm
                               outline-none focus:border-[#1a5c2a] focus:ring-2 focus:ring-green-100"/>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 block">
                    Dropoff Time
                  </label>
                  <input type="time" value={dropoffTime}
                    onChange={e => setDropoffTime(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm
                               outline-none focus:border-[#1a5c2a] focus:ring-2 focus:ring-green-100"/>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">
                  Pickup Location *
                </label>
                <input type="text" value={pickupLocation}
                  onChange={e => setPickupLocation(e.target.value)}
                  placeholder="e.g. Colombo Fort, Hotel Cinnamon"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm
                             outline-none focus:border-[#1a5c2a] focus:ring-2 focus:ring-green-100"/>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">
                  Dropoff Location
                </label>
                <input type="text" value={dropoffLocation}
                  onChange={e => setDropoffLocation(e.target.value)}
                  placeholder="Same as pickup"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm
                             outline-none focus:border-[#1a5c2a] focus:ring-2 focus:ring-green-100"/>
              </div>
            </>
          )}
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">
              Special Requirements
            </label>
            <textarea rows={3} value={bookingNote}
              onChange={e => setBookingNote(e.target.value)}
              placeholder="Any special requests or notes…"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm
                         outline-none focus:border-[#1a5c2a] focus:ring-2
                         focus:ring-green-100 resize-none"/>
          </div>
        </div>

        {/* Payment breakdown */}
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Payment Schedule
          </p>
          <div className="space-y-3">
            <div class="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#1a5c2a] text-white text-xs
                              font-bold flex items-center justify-center flex-shrink-0">1</div>
              <div className="flex-1 flex justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Pay Now (20% Advance)</p>
                  <p className="text-xs text-gray-400">Confirms your booking today</p>
                </div>
                <span className="text-sm font-bold text-[#1a5c2a]">${adv.toFixed(2)}</span>
              </div>
            </div>
            <div className="ml-4 border-l-2 border-dashed border-gray-200 h-4"/>
            <div className="flex items-center gap-3 opacity-60">
              <div className="w-8 h-8 rounded-full bg-gray-300 text-white text-xs
                              font-bold flex items-center justify-center flex-shrink-0">2</div>
              <div className="flex-1 flex justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-700">After Service (80%)</p>
                  <p className="text-xs text-gray-400">Due after completion</p>
                </div>
                <span className="text-sm font-bold text-gray-400">${fin.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack}
          className="flex-1 py-3 border border-gray-200 rounded-xl text-sm
                     text-gray-600 hover:bg-gray-50 transition-colors">
          ← Back
        </button>
        <button onClick={onNext}
          disabled={creating || (type === "vehicle" && !pickupLocation.trim())}
          className="flex-1 py-3 bg-[#1a5c2a] hover:bg-[#14471f] text-white
                     rounded-xl text-sm font-bold transition-colors
                     disabled:opacity-50 flex items-center justify-center gap-2">
          {creating ? (
            <><span className="w-4 h-4 border-2 border-white/30 border-t-white
                               rounded-full animate-spin"/><span>Creating Booking…</span></>
          ) : `Proceed to Payment ($${adv.toFixed(2)}) →`}
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// STEP 4 — Pay 20%
// ══════════════════════════════════════════════════════════
function Step4Pay({ item, booking, startDate, endDate,
  onBack, onPay, paying }) {

  const days  = calcDays(startDate, endDate);
  const total = days * (item?.pricePerDay || item?.price || 0);
  const adv   = calcAdvanceAmount(total);

  // Auto-redirect straight to the real PayHere sandbox checkout —
  // no in-app card mock in between.
  useEffect(() => {
    onPay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-1">💳 Pay 20% Advance</h2>
      <p className="text-sm text-gray-400 mb-5">
        Secure your booking with a 20% advance payment
      </p>

      {/* Booking confirm banner */}
      <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-5
                      flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-green-800">
            Booking #{booking?.id} Created ✅
          </p>
          <p className="text-xs text-green-600">
            {item?.fullName || item?.name} · {days} days
          </p>
        </div>
        <p className="text-xl font-bold text-[#1a5c2a]">${adv.toFixed(2)}</p>
      </div>

      <div className="bg-white rounded-2xl border-2 border-[#1a5c2a] p-8 mb-4
                      flex flex-col items-center gap-3 text-center">
        <span className="w-8 h-8 border-2 border-gray-200 border-t-[#1a5c2a]
                         rounded-full animate-spin"/>
        <p className="font-semibold text-gray-800">Redirecting to PayHere…</p>
        <p className="text-xs text-gray-400">
          You'll be taken to the secure PayHere checkout to complete your ${adv.toFixed(2)} advance payment.
        </p>
        {!paying && (
          <button onClick={onPay}
            className="mt-2 px-5 py-2 bg-[#1a5c2a] hover:bg-[#14471f] text-white
                       rounded-xl text-sm font-semibold transition-colors">
            Continue to Payment →
          </button>
        )}
      </div>

      <button onClick={onBack}
        className="w-full py-2.5 border border-gray-200 rounded-xl text-sm
                   text-gray-500 hover:bg-gray-50 transition-colors">
        ← Back to Booking Details
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════
export default function BookingPage() {
  const { type, id }    = useParams();        // "guide" or "vehicle"
  const location        = useLocation();
  const navigate        = useNavigate();
  const { user, token } = useAuth();
  const { removeFromCart } = useCart();

  // From cart state (if came from cart)
  const cartState = location.state || {};

  const [step,          setStep]          = useState(1);
  const [item,          setItem]          = useState(cartState.item || null);
  const [startDate,     setStartDate]     = useState(cartState.startDate || "");
  const [endDate,       setEndDate]       = useState(cartState.endDate   || "");
  const [bookingNote,   setBookingNote]   = useState("");
  const [pickupLocation, setPickupLoc]   = useState("");
  const [pickupTime,     setPickupTime]     = useState("10:00");
  const [dropoffTime,    setDropoffTime]    = useState("10:00");
  const [dropoffLocation, setDropoffLoc]    = useState("");
  const [availResult,   setAvailResult]  = useState(null);
  const [booking,       setBooking]      = useState(null);
  const [loading,       setLoading]      = useState(false);
  const [creating,      setCreating]     = useState(false);
  const [paying,        setPaying]       = useState(false);
  const [error,         setError]        = useState(null);
  const [kycError,      setKycError]     = useState(null);

  // Fetch item if not passed via state
  useEffect(() => {
    if (!item && id) {
      const endpoint = type === "guide"
        ? `/api/v1/guides/${id}`
        : `/api/v1/vehicles/local/${id}`;
      apiClient.get(endpoint)
        .then(r => setItem(r.data))
        .catch(() => setError("Failed to load details"));
    }
  }, [type, id, item]);

  if (!user) { navigate("/login"); return null; }

  // ── Step 1: Check availability ─────────────────────────
  async function handleCheckAvailability() {
    if (!startDate || !endDate) return;
    if (availResult === "available") { setStep(2); return; }

    setLoading(true);
    try {
      const endpoint = type === "guide"
        ? `/api/v1/guides/${id}/availability?startDate=${startDate}&endDate=${endDate}`
        : `/api/v1/vehicles/local/${id}/check-availability?startDate=${startDate}&endDate=${endDate}`;

      const res = await apiClient.get(endpoint);
      const available = res.data?.available ?? true;
      setAvailResult(available ? "available" : "unavailable");
      if (available) setTimeout(() => setStep(2), 500);
    } catch {
      // If endpoint doesn't exist yet, assume available
      setAvailResult("available");
      setTimeout(() => setStep(2), 500);
    } finally {
      setLoading(false);
    }
  }

  // ── Step 3: Create booking ─────────────────────────────
  async function handleCreateBooking() {
    setCreating(true);
    setError(null);
    setKycError(null);
    try {
      let bookingData;
      if (type === "guide") {
        bookingData = {
          guideId:   parseInt(id),
          startDate,
          endDate,
          notes: bookingNote || null,
          totalCost: calcDays(startDate, endDate) * (item?.pricePerDay || 0),
        };
      } else {
        bookingData = {
          vehicleId:       parseInt(id),
          pickupDate:      startDate,
          dropoffDate:     endDate,
          pickupTime:      pickupTime || null,
          dropoffTime:     dropoffTime || null,
          pickupLocation:  pickupLocation,
          dropoffLocation: dropoffLocation.trim() || pickupLocation,
          notes:           bookingNote || null,
          totalCost: calcDays(startDate, endDate) * (item?.pricePerDay || item?.price || 0),
        };
      }

      const endpointPath = type === "guide"
        ? "/api/v1/guide-bookings"
        : "/api/v1/vehicle-bookings";

      const res = await apiClient.post(endpointPath, bookingData);
      setBooking(res.data);
      setStep(4);
    } catch (e) {
      console.error("Create booking failed:", e);
      const resData = e?.response?.data;
      if (resData?.code && String(resData.code).startsWith("VERIFICATION_")) {
        setKycError({
          code: resData.code,
          message: resData.message || "Identity verification is required before completing this booking.",
          rejectionReason: resData.rejectionReason,
        });
      } else {
        setError(resData?.message || e.message || "Failed to create booking");
      }
    } finally {
      setCreating(false);
    }
  }

  // ── Step 4: Initiate PayHere payment ──────────────────
  async function handlePay() {
    if (!booking?.id || paying) return;
    setPaying(true);
    try {
      if (type === "guide") {
        await payGuide(booking.id, "ADVANCE", user);
      } else {
        await payVehicle(booking.id, "ADVANCE", user);
      }
      // Remove from cart after initiating payment
      if (item?.cartId) removeFromCart(item.cartId);
      else removeFromCart(`${type}-${id}`);
    } catch (e) {
      setError(e.message || "Payment failed");
      setPaying(false);
    }
    // Note: page redirects to PayHere — no finally needed
  }

  const typeLabel = type === "guide" ? "Guide" : "Vehicle";

  return (
    <>
      <Navbar/>
      <div className="min-h-screen bg-gray-50 pb-16">
        <div className="max-w-2xl mx-auto px-4 py-8">

          {/* Page header */}
          <div className="mb-6">
            <button onClick={() => navigate(-1)}
              className="text-sm text-gray-400 hover:text-gray-600 mb-2 flex items-center gap-1">
              ← Back
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              Book {typeLabel}
            </h1>
          </div>

          {/* Step bar */}
          <StepBar current={step}/>

          {/* Item card */}
          {item && (
            <ItemCard item={item} type={type}
              startDate={startDate} endDate={endDate}/>
          )}

          {/* KYC Gate Error Banner */}
          {kycError && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6 shadow-xs">
              <div className="flex items-start gap-3.5">
                <span className="text-2xl">🛡️</span>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-amber-900">
                    {kycError.code === "VERIFICATION_PENDING"
                      ? "Identity Verification Under Review"
                      : kycError.code === "VERIFICATION_REJECTED"
                      ? "Identity Verification Rejected"
                      : "Identity Verification Required"}
                  </h3>
                  <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                    {kycError.message}
                  </p>
                  {kycError.rejectionReason && (
                    <p className="text-xs font-semibold text-red-700 mt-2 bg-red-100/60 p-2.5 rounded-xl border border-red-200">
                      Rejection Reason: {kycError.rejectionReason}
                    </p>
                  )}
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => navigate("/verification")}
                      className="px-4 py-2 bg-[#1a5c2a] hover:bg-[#14471f] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      {kycError.code === "VERIFICATION_PENDING"
                        ? "Check Verification Status →"
                        : "Verify Identity Now →"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* General Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3
                            text-sm text-red-700 mb-5 flex items-center gap-2">
              ⚠️ {error}
            </div>
          )}

          {/* Step content */}
          {step === 1 && (
            <Step1Availability
              item={item} type={type}
              startDate={startDate} endDate={endDate}
              setStartDate={setStartDate} setEndDate={setEndDate}
              onNext={handleCheckAvailability}
              loading={loading} availResult={availResult}/>
          )}
          {step === 2 && (
            <Step2Inquiry
              item={item} type={type}
              startDate={startDate} endDate={endDate}
              onNext={() => setStep(3)} onBack={() => setStep(1)}/>
          )}
          {step === 3 && (
            <Step3Confirm
              item={item} type={type}
              startDate={startDate} endDate={endDate}
              bookingNote={bookingNote} setBookingNote={setBookingNote}
              pickupLocation={pickupLocation} setPickupLocation={setPickupLoc}
              pickupTime={pickupTime} setPickupTime={setPickupTime}
              dropoffTime={dropoffTime} setDropoffTime={setDropoffTime}
              dropoffLocation={dropoffLocation} setDropoffLocation={setDropoffLoc}
              onNext={handleCreateBooking} onBack={() => setStep(2)}
              creating={creating}/>
          )}
          {step === 4 && (
            <Step4Pay
              item={item} type={type}
              booking={booking}
              startDate={startDate} endDate={endDate}
              onBack={() => setStep(3)}
              onPay={handlePay} paying={paying}/>
          )}
        </div>
      </div>
      <Footer/>
    </>
  );
}
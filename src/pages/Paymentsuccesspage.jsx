import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  parseOrderId, getBookingTypeFromOrderId,
  getPhaseFromOrderId, getGuidePaymentsForBooking,
  getVehiclePaymentsForBooking, confirmGuidePayment,
  confirmVehiclePayment
} from "../services/paymentService";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function PaymentSuccessPage() {
  const navigate    = useNavigate();
  const { token }   = useAuth();
  const [status,    setStatus]  = useState("loading");
  const [payment,   setPayment] = useState(null);
  const [orderId,   setOrderId] = useState(null);
  const [phase,     setPhase]   = useState(null);
  const [bType,     setBType]   = useState(null);

  useEffect(() => {
    const order = parseOrderId(window.location.search);
    const type  = getBookingTypeFromOrderId(order);
    const ph    = getPhaseFromOrderId(order);
    setOrderId(order);
    setBType(type);
    setPhase(ph);

    (async () => {
      try {
        // Confirm the payment ourselves — on local/sandbox setups PayHere's
        // server-to-server IPN can't reach a non-public notify_url, so the
        // booking would otherwise stay stuck at its pre-payment status.
        // This is idempotent: a no-op if the real IPN already completed it.
        if (order) {
          try {
            type === "GUIDE"
              ? await confirmGuidePayment(order)
              : await confirmVehiclePayment(order);
          } catch {
            // Ignore — the real IPN may have already completed it, or
            // this may not be our payment (order missing/invalid).
          }
        }

        // Extract booking ID from order: GBK-{id}-ADV-XXX
        const parts     = (order || "").split("-");
        const bookingId = parts[1] ? parseInt(parts[1]) : null;

        if (!bookingId) { setStatus("success"); return; }

        const payments = type === "GUIDE"
          ? await getGuidePaymentsForBooking(bookingId)
          : await getVehiclePaymentsForBooking(bookingId);

        const completed = payments?.find(p => p.status === "COMPLETED");
        setPayment(completed || payments?.[0] || null);
        setStatus("success");
      } catch {
        setStatus("success"); // Show success even if fetch fails
      }
    })();
  }, []);

  return (
    <>
      <Navbar/>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md">

          {status === "loading" ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center shadow-sm">
              <div className="w-12 h-12 border-4 border-green-100 border-t-[#1a5c2a]
                              rounded-full animate-spin mx-auto mb-4"/>
              <p className="text-gray-600 font-medium">Confirming your payment…</p>
              <p className="text-xs text-gray-400 mt-1">Please wait a moment</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-sm">
              {/* Success icon */}
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center
                              justify-center mx-auto mb-5">
                <span className="text-4xl">🎉</span>
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                {phase === "ADVANCE" ? "Booking Confirmed!" : "Booking Fully Paid!"}
              </h1>
              <p className="text-sm text-gray-500 mb-6">
                {phase === "ADVANCE"
                  ? "20% advance payment received. Your booking is confirmed!"
                  : "Full payment received. Your booking is completely settled!"}
              </p>

              {/* Payment details */}
              {(orderId || payment) && (
                <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Payment Details
                  </p>
                  {orderId && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Order ID</span>
                      <span className="font-mono text-gray-800">{orderId}</span>
                    </div>
                  )}
                  {payment?.amount && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Amount Paid</span>
                      <span className="font-bold text-[#1a5c2a]">${payment.amount.toFixed(2)}</span>
                    </div>
                  )}
                  {bType && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Booking Type</span>
                      <span className="text-gray-800">{bType === "GUIDE" ? "👤 Guide" : "🚗 Vehicle"}</span>
                    </div>
                  )}
                  {phase && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Payment Phase</span>
                      <span className={`font-semibold ${phase === "ADVANCE" ? "text-yellow-600" : "text-green-700"}`}>
                        {phase === "ADVANCE" ? "20% Advance" : "80% Balance"}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Status</span>
                    <span className="text-green-700 font-semibold">✅ Completed</span>
                  </div>
                </div>
              )}

              {/* What's next */}
              {phase === "ADVANCE" && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-left">
                  <p className="text-xs font-semibold text-blue-800 mb-1">What happens next?</p>
                  <ul className="text-xs text-blue-600 space-y-1">
                    <li>• {bType === "GUIDE" ? "Guide" : "Driver"} will contact you before the service</li>
                    <li>• After service, pay the remaining 80% to complete</li>
                    <li>• Track your booking in My Profile → My Bookings</li>
                  </ul>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3">
                <Link to="/profile?tab=bookings"
                  className="block w-full py-3 bg-[#1a5c2a] hover:bg-[#14471f] text-white
                             rounded-xl text-sm font-semibold transition-colors text-center">
                  View My Bookings
                </Link>
                <Link to="/"
                  className="block w-full py-2.5 border border-gray-200 rounded-xl text-sm
                             text-gray-600 hover:bg-gray-50 transition-colors text-center">
                  Back to Home
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer/>
    </>
  );
}
import { Link } from "react-router-dom";
import { parseOrderId } from "../services/paymentService";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function PaymentCancelPage() {
  const orderId = parseOrderId(window.location.search);

  return (
    <>
      <Navbar/>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200
                        p-8 text-center shadow-sm">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center
                          justify-center mx-auto mb-5">
            <span className="text-4xl">😕</span>
          </div>

          <h1 className="text-xl font-bold text-gray-900 mb-1">Payment Cancelled</h1>
          <p className="text-sm text-gray-500 mb-2">
            Your payment was cancelled. Your booking has not been confirmed.
          </p>
          {orderId && (
            <p className="text-xs text-gray-400 font-mono mb-6">Order: {orderId}</p>
          )}

          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 text-left">
            <p className="text-xs font-semibold text-orange-800 mb-1">What happened?</p>
            <ul className="text-xs text-orange-600 space-y-1">
              <li>• No payment was taken from your card</li>
              <li>• Your booking is still in PENDING state</li>
              <li>• You can try paying again from My Bookings</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Link to="/profile?tab=bookings"
              className="block w-full py-3 bg-[#1a5c2a] hover:bg-[#14471f] text-white
                         rounded-xl text-sm font-semibold transition-colors text-center">
              Try Again from My Bookings
            </Link>
            <Link to="/"
              className="block w-full py-2.5 border border-gray-200 rounded-xl text-sm
                         text-gray-600 hover:bg-gray-50 transition-colors text-center">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
      <Footer/>
    </>
  );
}
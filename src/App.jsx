import {
  BrowserRouter as Router,
  Routes,
  Route,
  Outlet,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AuthPromptProvider } from "./context/AuthPromptContext";
import { CartProvider } from "./context/CartContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import MyTrips from "./pages/Mytripspage";
import CreateTripPage from "./pages/CreateTripPage";
import HotelsPage from "./pages/HotelsPage";
import HiddenGems from "./pages/Hiddengems";
import GemDetail from "./pages/Gemdetail";
import SubmitGem from "./pages/Submitgem";
import DestinationsPage from "./pages/Destinations";
import DestinationDetail from "./pages/DestinationDetail";
import VehicleListing from "./pages/vehicles/VehicleListing";
import Guides from "./pages/Guides";
import GuideDetail from "./pages/GuideDetail";
import TripDetailPage from "./pages/TripDetailPage";
import EventsPage from "./pages/EventsPage";
import EventDetailPage from "./pages/EventDetailPage";
import ProfilePage from "./pages/ProfilePage";
import NotFound from "./pages/NotFound";
import BookingPage         from "./pages/BookingPage";
import PaymentSuccessPage  from "./pages/PaymentSuccessPage";
import PaymentCancelPage   from "./pages/PaymentCancelPage";

// MainLayout eken thama Navbar saha Footer render karanne.
// Meka athule thiyena pages walata witharai mewa apply wenne.

function MainLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-100">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AuthPromptProvider>
        <CartProvider>
        <Routes>
          {/* 1. Navbar & Footer thiyena Pages */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            {/* Anith pages meke pahalin add karanna */}
            <Route path="/hotels" element={<HotelsPage />} />
          </Route>

          {/* 2. Auth pages (Navbar & Footer NATHI) */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* 3. Public browse pages */}
          <Route path="/hidden-gems" element={<HiddenGems />} />
          <Route path="/hidden-gems/:id" element={<GemDetail />} />
          <Route path="/destinations" element={<DestinationsPage />} />
          <Route path="/destinations/:id" element={<DestinationDetail />} />
          <Route path="/vehicles" element={<VehicleListing />} />
          <Route path="/guides" element={<Guides />} />
          <Route path="/guides/:id" element={<GuideDetail />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />

          {/* 4. Traveler-only pages (require login) */}
          <Route path="/my-trips" element={<ProtectedRoute><MyTrips /></ProtectedRoute>} />
          <Route path="/hidden-gems/submit" element={<ProtectedRoute><SubmitGem /></ProtectedRoute>} />
          <Route path="/trips/new" element={<ProtectedRoute><CreateTripPage /></ProtectedRoute>} />
          <Route path="/trips/:id" element={<ProtectedRoute><TripDetailPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/booking/:type/:id" element={<BookingPage />} />
          <Route path="/payment/success"   element={<PaymentSuccessPage />} />
          <Route path="/payment/cancel"    element={<PaymentCancelPage />} />

          {/* 5. Catch-all 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </CartProvider>
        </AuthPromptProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

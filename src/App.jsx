import {
  BrowserRouter as Router,
  Routes,
  Route,
  Outlet,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import MyTrips from "./pages/Mytripspage";
import CreateTripPage from "./pages/CreateTripPage";
import HotelsPage from "./pages/HotelsPage";
import HiddenGems from "./pages/Hiddengems";
import GemDetail from "./pages/Gemdetail";
import SubmitGem from "./pages/Submitgem";
import DestinationsPage from "./pages/Destinations";
import DestinationDetail from "./pages/DestinationDetail";
import VehicleListing from "./pages/vehicles/VehicleListing";
import Guides from './pages/Guides';
import GuideDetail from './pages/GuideDetail';
import TripDetailPage from "./pages/TripDetailPage";



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
        <Routes>
          {/* 1. Navbar & Footer thiyena Pages */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            {/* Anith pages meke pahalin add karanna */}
            <Route path="/hotels" element={<HotelsPage />} />
            {/* <Route path="/vehicles" element={<VehiclesPage />} /> */}
            {/* <Route path="/destinations" element={<DestinationsPage />} /> */}
          </Route>

          {/* 2. Navbar & Footer NATHI Pages (Auth) */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/my-trips" element={<MyTrips />} />
          <Route path="/hidden-gems" element={<HiddenGems />} />
          <Route path="/hidden-gems/:id" element={<GemDetail />} />
          <Route path="/hidden-gems/submit" element={<SubmitGem />} />
          <Route path="/destinations" element={<DestinationsPage />} />
          <Route path="/destinations/:id" element={<DestinationDetail />} />
          <Route path="/vehicles" element={<VehicleListing />} />
          <Route path="/guides" element={<Guides />} />
          <Route path="/guides/:id" element={<GuideDetail />} />
          <Route path="/trips/new" element={<CreateTripPage />} />
          <Route path="/trips/:id" element={<TripDetailPage />} />

        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;

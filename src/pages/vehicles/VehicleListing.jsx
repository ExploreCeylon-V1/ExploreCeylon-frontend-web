import { useEffect, useState, useCallback } from "react";
import VehicleCard from "../../components/vehicles/VehicleCard";
import VehicleDetailDrawer from "../../components/vehicles/VehicleDetailDrawer";
import VehicleBookingDrawer from "../../components/vehicles/VehicleBookingDrawer";
import { vehicleService } from "../../services/vehicleService";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const TABS = [
  { key: "ALL", label: "All Vehicles" },
  { key: "TUKTUK", label: "🛺 Tuk-Tuks" },
  { key: "AIRPORT", label: "✈ Airport Transfers" },
  { key: "CAR", label: "🚗 Cars" },
  { key: "VAN", label: "🚐 Vans" },
];

const SRI_LANKA_DISTRICTS = [
  "Colombo",
  "Gampaha",
  "Kalutara",
  "Kandy",
  "Matale",
  "Nuwara Eliya",
  "Galle",
  "Matara",
  "Hambantota",
  "Jaffna",
  "Kilinochchi",
  "Mannar",
  "Vavuniya",
  "Mullaitivu",
  "Batticaloa",
  "Ampara",
  "Trincomalee",
  "Kurunegala",
  "Puttalam",
  "Anuradhapura",
  "Polonnaruwa",
  "Badulla",
  "Monaragala",
  "Ratnapura",
  "Kegalle",
];

const PRICE_RANGES = [
  { label: "Any Price", min: null, max: null },
  { label: "Under $20", min: 0, max: 20 },
  { label: "$20 – $50", min: 20, max: 50 },
  { label: "$50 – $100", min: 50, max: 100 },
  { label: "Over $100", min: 100, max: null },
];

export default function VehicleListing() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState("ALL");
  const [district, setDistrict] = useState("");
  const [priceRange, setPriceRange] = useState(PRICE_RANGES[0]);
  const [driverOnly, setDriverOnly] = useState(false);
  const [sortBy, setSortBy] = useState("default");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");

  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    tuktuks: 0,
    airportTransfers: 0,
  });
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [bookingVehicle, setBookingVehicle] = useState(null);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data;
      if (activeTab === "TUKTUK") data = await vehicleService.getTukTuks();
      else if (activeTab === "AIRPORT")
        data = await vehicleService.getAirportTransfers();
      else data = await vehicleService.getAllVehicles();
      setVehicles(data);
      if (activeTab === "ALL") {
        setStats({
          total: data.length,
          available: data.filter((v) => v.available).length,
          tuktuks: data.filter((v) => v.type === "TUKTUK").length,
          airportTransfers: data.filter((v) => v.airportTransfer).length,
        });
      }
    } catch {
      setError("Unable to load vehicles. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const displayed = vehicles
    .filter((v) => {
      if (activeTab === "CAR") return v.type === "CAR";
      if (activeTab === "VAN") return v.type === "VAN" || v.type === "MINIVAN";
      return true;
    })
    .filter((v) => !district || v.district === district)
    .filter((v) => {
      if (!priceRange.min && !priceRange.max) return true;
      if (!priceRange.max) return v.pricePerDay >= priceRange.min;
      if (!priceRange.min) return v.pricePerDay <= priceRange.max;
      return v.pricePerDay >= priceRange.min && v.pricePerDay <= priceRange.max;
    })
    .filter((v) => !driverOnly || v.driverIncluded)
    .filter((v) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        v.name?.toLowerCase().includes(q) ||
        v.district?.toLowerCase().includes(q) ||
        v.driverName?.toLowerCase().includes(q) ||
        v.type?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === "price-asc") return a.pricePerDay - b.pricePerDay;
      if (sortBy === "price-desc") return b.pricePerDay - a.pricePerDay;
      if (sortBy === "rating") return b.rating - a.rating;
      return 0;
    });

  const clearFilters = () => {
    setDistrict("");
    setPriceRange(PRICE_RANGES[0]);
    setDriverOnly(false);
    setSearchQuery("");
    setSortBy("default");
  };

  const handleBook = (vehicle) => {
    setBookingVehicle(vehicle);
  };
  const handleViewDetails = (id) => {
    setSelectedVehicleId(id);
  };

  return (
    <div>
      <Navbar />
      <div className="min-h-screen font-sans bg-gray-100">
        {/* Hero */}
        <div className="py-10 bg-green-800">
          <div className="px-6 mx-auto max-w-7xl">
            <h1 className="mb-2 text-3xl font-bold text-white">
              Find Your Perfect Ride in Sri Lanka
            </h1>
            <p className="mb-5 text-sm text-green-200">
              Tuk-tuks, Cars, Vans & SUVs with local drivers
            </p>
            <div className="flex flex-wrap gap-5 text-sm font-medium text-green-100">
              <span>🚗 {stats.total} Vehicles Available</span>
              <span>📍 All Districts Covered</span>
              <span>🛡 15% Commission Protected</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 mx-auto max-w-7xl">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-5">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                  activeTab === tab.key
                    ? "bg-green-800 text-white border-green-800"
                    : "bg-white text-gray-600 border-gray-300 hover:border-green-700 hover:text-green-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 mb-6 bg-white border border-gray-200 rounded-xl">
            {/* District */}
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
            >
              <option value="">All Districts ▾</option>
              {SRI_LANKA_DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            {/* Price */}
            <select
              value={priceRange.label}
              onChange={(e) => {
                const found = PRICE_RANGES.find(
                  (r) => r.label === e.target.value,
                );
                setPriceRange(found || PRICE_RANGES[0]);
              }}
              className="px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
            >
              {PRICE_RANGES.map((r) => (
                <option key={r.label} value={r.label}>
                  {r.label}
                </option>
              ))}
            </select>

            {/* Driver toggle */}
            <button
              onClick={() => setDriverOnly((p) => !p)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-all ${
                driverOnly
                  ? "bg-green-50 border-green-600 text-green-700 font-semibold"
                  : "border-gray-300 text-gray-600 hover:border-green-600"
              }`}
            >
              🧑 Driver Included {driverOnly && "✔"}
            </button>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
            >
              <option value="default">Sort By ▾</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
              <option value="rating">Top Rated</option>
            </select>

            {/* Search */}
            <div className="relative flex-1 min-w-44">
              <span className="absolute text-sm text-gray-400 -translate-y-1/2 pointer-events-none left-3 top-1/2">
                🔍
              </span>
              <input
                type="text"
                placeholder="Search vehicles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-2 pl-8 pr-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
              />
            </div>

            {/* View toggle */}
            <div className="flex overflow-hidden border border-gray-300 rounded-lg">
              <button
                onClick={() => setViewMode("grid")}
                className={`px-3 py-2 text-base transition-colors ${viewMode === "grid" ? "bg-green-800 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
                title="Grid view"
              >
                ⊞
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-2 text-base transition-colors ${viewMode === "list" ? "bg-green-800 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
                title="List view"
              >
                ☰
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-7">
            {[
              { icon: "🚗", num: stats.total, label: "Total Vehicles" },
              { icon: "✅", num: stats.available, label: "Available Now" },
              { icon: "🛺", num: stats.tuktuks, label: "Tuk-Tuks Ready" },
              {
                icon: "✈",
                num: stats.airportTransfers,
                label: "Airport Transfers",
              },
            ].map(({ icon, num, label }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-1 p-4 text-center bg-white border border-gray-200 rounded-xl"
              >
                <span className="text-2xl">{icon}</span>
                <span className="text-2xl font-bold text-green-800">{num}</span>
                <span className="text-xs text-gray-500">{label}</span>
              </div>
            ))}
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center gap-4 py-20 text-gray-500">
              <div className="border-4 border-gray-200 rounded-full w-9 h-9 border-t-green-700 animate-spin" />
              <p className="text-sm">Loading vehicles...</p>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="flex flex-col items-center gap-4 py-20 text-red-600">
              <p>⚠️ {error}</p>
              <button
                onClick={fetchVehicles}
                className="px-4 py-2 text-sm transition-colors border border-red-400 rounded-lg hover:bg-red-50"
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && displayed.length === 0 && (
            <div className="flex flex-col items-center gap-4 py-20 text-gray-500">
              <p className="text-sm">No vehicles match your filters.</p>
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm text-green-700 transition-colors border border-green-700 rounded-lg hover:bg-green-50"
              >
                Clear Filters
              </button>
            </div>
          )}

          {/* Grid / List */}
          {!loading && !error && displayed.length > 0 && (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
                  : "flex flex-col gap-4"
              }
            >
              {displayed.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  onBook={handleBook}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <VehicleDetailDrawer
        vehicleId={selectedVehicleId}
        onClose={() => setSelectedVehicleId(null)}
        onBook={(vehicle) => {
          setSelectedVehicleId(null);
          handleBook(vehicle);
        }}
      />

      <VehicleBookingDrawer
        vehicle={bookingVehicle}
        onClose={() => setBookingVehicle(null)}
        onSuccess={(booking) => {
          alert(`Booking confirmed! Booking ID: ${booking.id}`);
        }}
      />

      <Footer />
    </div>
  );
}

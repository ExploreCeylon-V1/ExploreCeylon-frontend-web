import { useState, useEffect } from "react"; // 1. useEffect add කරා
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function Vehicles() {
  // 2. Backend එකෙන් එන vehicles save කරගන්න state එකක් හැදුවා
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // මේක පාවිච්චි වෙන්න ඕනේ

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [district, setDistrict] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [driverIncluded, setDriverIncluded] = useState(false);
  const [sortBy, setSortBy] = useState("default");
  const [searchQuery, setSearchQuery] = useState("");

  // 3. Page එක load වෙනකොට API එකෙන් data ගන්න useEffect එක
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          "http://localhost:8080/api/v1/vehicles/local",
        );

        if (!response.ok) {
          throw new Error("Failed to fetch vehicles data");
        }

        const data = await response.json();
        setVehicles(data);
        setError(null); // Request එක සාර්ථක නම් error එක clear කරනවා
      } catch (err) {
        // 💡 මෙතන 'err' සහ 'setError' දෙකම පාවිච්චි වෙන නිසා අර warnings නැති වෙනවා:
        console.error("Error fetching data:", err);
        setError(err.message);

        // ඔයා Mock data පාවිච්චි කරනවා නම්, ඒ ටිකත් මෙතනට දාන්න පුළුවන්:
        setVehicles([
          {
            id: 1,
            name: "Colombo City Tuk-Tuk (Mock)",
            type: "TUKTUK",
            category: "tuk-tuks",
            location: "Colombo",
            seats: 3,
            price: 15,
            available: true,
            features: ["Driver Included", "AC"],
            image:
              "https://images.unsplash.com/photo-1566996694954-90b052c413c4?q=80&w=600&auto=format&fit=crop",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, []);

  const categories = [
    { id: "all", label: "All Vehicles" },
    { id: "tuk-tuks", label: "Tuk-Tuks", icon: "🛺" },
    { id: "airport", label: "Airport Transfers", icon: "✈️" },
    { id: "cars", label: "Cars", icon: "🚗" },
    { id: "vans", label: "Vans", icon: "🚐" },
    { id: "scooters", label: "Scooters", icon: "🛵" },
  ];

  // 4. INITIAL_VEHICLES වෙනුවට backend එකෙන් ආපු 'vehicles' array එක filter කරන්න ගත්තා
  const filteredVehicles = vehicles
    .filter((vehicle) => {
      const matchesCategory =
        selectedCategory === "all" ||
        (selectedCategory === "airport"
          ? vehicle.features?.includes("Driver Included") // backend එකේ features තියෙනවාද කියලා safe check එකක්
          : vehicle.category === selectedCategory);

      const matchesDistrict =
        district === "all" || vehicle.location === district;

      const matchesDriver =
        !driverIncluded || vehicle.features?.includes("Driver Included");

      const matchesSearch =
        vehicle.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vehicle.type?.toLowerCase().includes(searchQuery.toLowerCase());

      let matchesPrice = true;
      if (priceRange === "0-20") matchesPrice = vehicle.price <= 20;
      else if (priceRange === "20-50")
        matchesPrice = vehicle.price > 20 && vehicle.price <= 50;
      else if (priceRange === "50+") matchesPrice = vehicle.price > 50;

      return (
        matchesCategory &&
        matchesDistrict &&
        matchesDriver &&
        matchesSearch &&
        matchesPrice
      );
    })
    .sort((a, b) => {
      if (sortBy === "low-high") return a.price - b.price;
      if (sortBy === "rating") return b.rating - a.rating;
      return 0;
    });

  // Dynamic Stats Counters
  const totalCount = filteredVehicles.length;
  const availableCount = filteredVehicles.filter((v) => v.available).length;
  const tukTukCount = filteredVehicles.filter(
    (v) => v.type === "TUKTUK",
  ).length;
  const scooterCount = filteredVehicles.filter(
    (v) => v.type === "SCOOTER",
  ).length;

  return (
    <div>
      <Navbar />

      <div className="h-40 bg-green-800">
        <div className="px-4 py-10 mx-auto max-w-7xl md:py-12 lg:py-10">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Find Your Perfect Ride in Sri Lanka
          </h1>
          <p className="max-w-2xl mt-2 text-sm text-gray-200 md:text-base">
            Tuk-tuks, Cars, Vans & SUVs with local drivers
          </p>
        </div>
      </div>

      <div className="w-full bg-[#f8f9fa] min-h-screen p-4 md:p-8">
        <div className="mx-auto space-y-6 max-w-7xl">
          {/* Categories Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-[#1e6f43] text-white shadow-sm"
                      : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {cat.icon && <span>{cat.icon}</span>}
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Search Bar and Dropdowns */}
          <div className="flex flex-col items-start justify-between gap-4 p-4 bg-white border border-gray-100 shadow-xs lg:flex-row lg:items-center rounded-xl">
            <div className="flex flex-wrap items-center w-full gap-3 lg:w-auto">
              {/* District Dropdown */}
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-hidden"
              >
                <option value="all">All Districts ▾</option>
                <option value="Colombo">Colombo</option>
                <option value="Kandy">Kandy</option>
                <option value="Matara">Matara</option>
                <option value="Badulla">Badulla</option>
              </select>

              {/* Price Range */}
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-hidden"
              >
                <option value="all">Price Range ▾</option>
                <option value="0-20">$0-$20</option>
                <option value="20-50">$20-$50</option>
                <option value="50+">$50+</option>
              </select>

              {/* Driver Filter */}
              <label className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={driverIncluded}
                  onChange={(e) => setDriverIncluded(e.target.checked)}
                  className="w-4 h-4 accent-[#1e6f43]"
                />
                <span>Driver Included 👮</span>
              </label>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-hidden"
              >
                <option value="default">Sort by ▾</option>
                <option value="low-high">Price Low-High</option>
                <option value="rating">Rating</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="relative w-full lg:w-72">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                🔍
              </span>
              <input
                type="text"
                placeholder="Search vehicles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-2 pr-4 text-sm bg-white border border-gray-300 rounded-lg pl-9 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Counters */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="p-4 text-center bg-white border border-gray-200 rounded-xl">
              <div className="mb-1 text-xl">
                🚗 <span className="font-bold text-gray-800">{totalCount}</span>
              </div>
              <div className="text-xs font-medium text-gray-500">
                Total Vehicles
              </div>
            </div>
            <div className="p-4 text-center bg-white border border-gray-200 rounded-xl">
              <div className="mb-1 text-xl">
                ✅{" "}
                <span className="font-bold text-gray-800">
                  {availableCount}
                </span>
              </div>
              <div className="text-xs font-medium text-gray-500">
                Available Now
              </div>
            </div>
            <div className="p-4 text-center bg-white border border-gray-200 rounded-xl">
              <div className="mb-1 text-xl">
                🛺{" "}
                <span className="font-bold text-gray-800">{tukTukCount}</span>
              </div>
              <div className="text-xs font-medium text-gray-500">
                Tuk-Tuks Ready
              </div>
            </div>
            <div className="p-4 text-center bg-white border border-gray-200 rounded-xl">
              <div className="mb-1 text-xl">
                🛵{" "}
                <span className="font-bold text-gray-800">{scooterCount}</span>
              </div>
              <div className="text-xs font-medium text-gray-500">
                Scooters Ready
              </div>
            </div>
          </div>

          {/* Loading සහ Error States handle කිරීම */}
          {loading && (
            <div className="py-10 font-medium text-center text-gray-500">
              Loading vehicles data...⏳
            </div>
          )}

          {error && (
            <div className="py-10 font-medium text-center text-red-500">
              Error: {error} ❌
            </div>
          )}

          {/* Vehicle Grid Display */}
          {!loading && !error && (
            <div className="grid grid-cols-1 gap-6 pt-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredVehicles.map((vehicle) => (
                <div
                  key={vehicle.id || vehicle._id}
                  className="overflow-hidden transition-all duration-300 bg-white border border-gray-200 shadow-xs rounded-2xl hover:-translate-y-2 hover:shadow-xl group"
                >
                  <div className="relative h-56 overflow-hidden bg-gray-100">
                    <img
                      src={
                        vehicle.image ||
                        "https://placehold.co/600x400?text=No+Image"
                      }
                      alt={vehicle.name}
                      className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute top-3 left-3 bg-[#e67e22] text-white text-xs font-bold px-3 py-1 rounded-md tracking-wider">
                      {vehicle.type}
                    </span>
                    <span
                      className={`absolute top-3 right-3 text-white text-xs font-bold px-3 py-1 rounded-md flex items-center gap-1 ${vehicle.available ? "bg-[#00b050]" : "bg-[#e74c3c]"}`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full bg-white ${vehicle.available ? "animate-pulse" : ""}`}
                      ></span>
                      {vehicle.available ? "Available" : "Unavailable"}
                    </span>
                  </div>

                  <div className="p-5 space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 tracking-tight group-hover:text-[#1e6f43] transition-colors">
                        {vehicle.name}
                      </h3>
                      <div className="flex flex-wrap items-center mt-2 text-sm text-gray-500 gap-x-3 gap-y-1">
                        <span>📍 {vehicle.location}</span>
                        <span>👥 {vehicle.seats} seats</span>
                        <span className="text-amber-500">
                          ⭐{" "}
                          <span className="font-semibold text-gray-800">
                            {vehicle.rating || 0}
                          </span>{" "}
                          <span className="text-gray-400">
                            ({vehicle.reviews || 0})
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-x-2 text-sm text-gray-600 bg-gray-50 p-2.5 rounded-lg">
                      <span>
                        {vehicle.driver === "Self Drive" ? "🛵" : "🧑‍✈️"}
                      </span>
                      <div>
                        <span className="font-semibold text-gray-800">
                          {vehicle.driver || "No Driver"}
                        </span>
                        <span className="text-gray-400 mx-1.5">•</span>
                        <span className="text-xs text-gray-500">
                          {vehicle.languages || "N/A"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 min-h-7">
                      {vehicle.features && vehicle.features.length > 0 ? (
                        vehicle.features.map((feat, i) => (
                          <span
                            key={i}
                            className="bg-[#ebf7ee] text-[#1e6f43] text-xs font-medium px-2.5 py-1 rounded-md"
                          >
                            ✓ {feat}
                          </span>
                        ))
                      ) : (
                        <span className="bg-amber-50 text-amber-700 text-xs font-medium px-2.5 py-1 rounded-md">
                          ⚠ Rental Only (No Driver)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div>
                        <span className="text-2xl font-black text-[#1e6f43]">
                          ${vehicle.price}
                        </span>
                        <span className="text-xs font-medium text-gray-400">
                          /day
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-3 py-2 text-sm font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
                          View Details
                        </button>
                        <button
                          disabled={!vehicle.available}
                          className={`px-4 py-2 text-white text-sm font-semibold rounded-lg ${vehicle.available ? "bg-[#1e6f43] hover:bg-[#154d2e]" : "bg-gray-300 cursor-not-allowed"}`}
                        >
                          Book →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && filteredVehicles.length === 0 && (
            <div className="py-10 font-medium text-center text-gray-500">
              No vehicles match your filters. 📭
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}

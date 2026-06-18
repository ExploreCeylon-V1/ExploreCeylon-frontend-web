import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const INITIAL_VEHICLES = [
  {
    id: 1,
    name: "Colombo City Tuk-Tuk",
    type: "TUKTUK",
    category: "tuk-tuks",
    location: "Colombo",
    seats: 3,
    rating: 4.8,
    reviews: 124,
    driver: "Kamal Silva",
    languages: "English, Sinhala",
    features: ["Driver Included", "AC", "Airport Transfer"],
    price: 15,
    available: true,
    image:
      "https://images.unsplash.com/photo-1566996694954-90b052c413c4?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: 2,
    name: "Airport Transfer Van",
    type: "VAN",
    category: "vans",
    location: "Colombo",
    seats: 8,
    rating: 4.9,
    reviews: 156,
    driver: "Nimal Perera",
    languages: "English, Sinhala",
    features: ["Driver Included", "AC", "Airport Transfer"],
    price: 45,
    available: true,
    image:
      "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: 3,
    name: "Ella Adventure Jeep",
    type: "SUV",
    category: "cars",
    location: "Badulla",
    seats: 5,
    rating: 4.7,
    reviews: 98,
    driver: "Roshan Dias",
    languages: "English, Sinhala",
    features: ["Driver Included", "4WD"],
    price: 55,
    available: false,
    image:
      "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: 4,
    name: "Coastal Car",
    type: "CAR",
    category: "cars",
    location: "Matara",
    seats: 4,
    rating: 4.6,
    reviews: 87,
    driver: "Asanka Fernando",
    languages: "English, Tamil",
    features: ["Driver Included", "AC"],
    price: 30,
    available: true,
    image:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: 5,
    name: "Kandy Hills Scooter",
    type: "SCOOTER",
    category: "scooters",
    location: "Kandy",
    seats: 1,
    rating: 4.5,
    reviews: 45,
    driver: "Self Drive",
    languages: "No Driver",
    features: [], // No Driver Included for Scooters
    price: 10,
    available: true,
    image:
      "https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: 6,
    name: "Mirissa Beach Van",
    type: "MINIVAN",
    category: "vans",
    location: "Matara",
    seats: 6,
    rating: 4.8,
    reviews: 112,
    driver: "Saman Kumar",
    languages: "English, Sinhala",
    features: ["Driver Included", "AC"],
    price: 40,
    available: true,
    image:
      "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?q=80&w=600&auto=format&fit=crop",
  },
];

export default function Vehicles() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [district, setDistrict] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [driverIncluded, setDriverIncluded] = useState(false); // Scooters default false
  const [sortBy, setSortBy] = useState("default");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    { id: "all", label: "All Vehicles" },
    { id: "tuk-tuks", label: "Tuk-Tuks", icon: "🛺" },
    { id: "airport", label: "Airport Transfers", icon: "✈️" },
    { id: "cars", label: "Cars", icon: "🚗" },
    { id: "vans", label: "Vans", icon: "🚐" },
    { id: "scooters", label: "Scooters", icon: "🛵" },
  ];

  // Dynamic Filtering Logic
  const filteredVehicles = INITIAL_VEHICLES.filter((vehicle) => {
    const matchesCategory =
      selectedCategory === "all" ||
      (selectedCategory === "airport"
        ? vehicle.features.includes("Airport Transfer")
        : vehicle.category === selectedCategory);

    const matchesDistrict = district === "all" || vehicle.location === district;

    // Driver Included (Scooter) dynamic hide logic
    const matchesDriver =
      !driverIncluded || vehicle.features.includes("Driver Included");

    const matchesSearch =
      vehicle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.type.toLowerCase().includes(searchQuery.toLowerCase());

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
  }).sort((a, b) => {
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

      <div className=" h-40 bg-green-800">
        <div className="max-w-7xl mx-auto px-0 py-10 md:py-12 lg:py-10">
          <h1 className="text-3xl md:text-3xl font-bold text-white tracking-tight">
            Find Your Perfect Ride in Sri Lanka
          </h1>
          <p className="text-gray-200 text-sm md:text-base mt-2 max-w-2xl">
            Tuk-tuks, Cars, Vans & SUVs with local drivers
          </p>
        </div>
      </div>

      <div className="w-full bg-[#f8f9fa] min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Categories Buttons */}
          <div className="flex flex-wrap gap-3 items-center">
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
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
            <div className="flex flex-wrap gap-3 items-center w-full lg:w-auto">
              {/* District Dropdown */}
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-hidden focus:border-[#1e6f43]"
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
                className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-hidden focus:border-[#1e6f43]"
              >
                <option value="all">Price Range ▾</option>
                <option value="0-20">$0-$20</option>
                <option value="20-50">$20-$50</option>
                <option value="50+">$50+</option>
              </select>

              {/* Driver Filter Checkbox */}
              <label className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={driverIncluded}
                  onChange={(e) => setDriverIncluded(e.target.checked)}
                  className="w-4 h-4 accent-[#1e6f43]"
                />
                <span>Driver Included 👮</span>
              </label>

              {/* Order */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-hidden focus:border-[#1e6f43]"
              >
                <option value="default">Sort by ▾</option>
                <option value="low-high">Price Low-High</option>
                <option value="rating">Rating</option>
              </select>
            </div>

            {/* Search Bar */}
            <div className="relative w-full lg:w-72">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                🔍
              </span>
              <input
                type="text"
                placeholder="Search vehicles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-hidden focus:border-[#1e6f43]"
              />
            </div>
          </div>

          {/*Counter card */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs text-center">
              <div className="text-xl mb-1">
                🚗 <span className="font-bold text-gray-800">{totalCount}</span>
              </div>
              <div className="text-xs text-gray-500 font-medium">
                Total Vehicles
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs text-center">
              <div className="text-xl mb-1">
                ✅{" "}
                <span className="font-bold text-gray-800">
                  {availableCount}
                </span>
              </div>
              <div className="text-xs text-gray-500 font-medium">
                Available Now
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs text-center">
              <div className="text-xl mb-1">
                🛺{" "}
                <span className="font-bold text-gray-800">{tukTukCount}</span>
              </div>
              <div className="text-xs text-gray-500 font-medium">
                Tuk-Tuks Ready
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs text-center">
              <div className="text-xl mb-1">
                🛵{" "}
                <span className="font-bold text-gray-800">{scooterCount}</span>
              </div>
              <div className="text-xs text-gray-500 font-medium">
                Scooters Ready
              </div>
            </div>
          </div>

          {/* Vehicles Info card */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            {filteredVehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-xs transition-all duration-300 hover:-translate-y-2 hover:shadow-xl group"
              >
                {/* Image and Logo */}
                <div className="relative h-56 overflow-hidden bg-gray-100">
                  <img
                    src={vehicle.image}
                    alt={vehicle.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute top-3 left-3 bg-[#e67e22] text-white text-xs font-bold px-3 py-1 rounded-md tracking-wider">
                    {vehicle.type}
                  </span>
                  <span
                    className={`absolute top-3 right-3 text-white text-xs font-bold px-3 py-1 rounded-md flex items-center gap-1 ${
                      vehicle.available ? "bg-[#00b050]" : "bg-[#e74c3c]"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full bg-white ${vehicle.available ? "animate-pulse" : ""}`}
                    ></span>
                    {vehicle.available ? "Available" : "Unavailable"}
                  </span>
                </div>

                {/* Details */}
                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 tracking-tight group-hover:text-[#1e6f43] transition-colors">
                      {vehicle.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500 mt-2">
                      <span className="flex items-center gap-1">
                        📍 {vehicle.location}
                      </span>
                      <span className="flex items-center gap-1">
                        👥 {vehicle.seats} seats
                      </span>
                      <span className="flex items-center gap-0.5 text-amber-500">
                        ⭐{" "}
                        <span className="text-gray-800 font-semibold">
                          {vehicle.rating}
                        </span>{" "}
                        <span className="text-gray-400">
                          ({vehicle.reviews})
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Language and Driver (Dynamic Icon) */}
                  <div className="flex items-center gap-x-2 text-sm text-gray-600 bg-gray-50 p-2.5 rounded-lg">
                    <span>{vehicle.driver === "Self Drive" ? "🛵" : "🧑‍✈️"}</span>
                    <div>
                      <span className="font-semibold text-gray-800">
                        {vehicle.driver}
                      </span>
                      <span className="text-gray-400 mx-1.5">•</span>
                      <span className="text-xs text-gray-500">
                        {vehicle.languages}
                      </span>
                    </div>
                  </div>

                  {/* Features tags - Dynamic render*/}
                  <div className="flex flex-wrap gap-1.5 min-h-7">
                    {vehicle.features.length > 0 ? (
                      vehicle.features.map((feat, i) => (
                        <span
                          key={i}
                          className="bg-[#ebf7ee] text-[#1e6f43] text-xs font-medium px-2.5 py-1 rounded-md flex items-center gap-1"
                        >
                          ✓ {feat}
                        </span>
                      ))
                    ) : (
                      <span className="bg-amber-50 text-amber-700 text-xs font-medium px-2.5 py-1 rounded-md flex items-center gap-1">
                        ⚠ Rental Only (No Driver)
                      </span>
                    )}
                  </div>

                  {/* Price and Booking Buttons */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div>
                      <span className="text-2xl font-black text-[#1e6f43]">
                        ${vehicle.price}
                      </span>
                      <span className="text-xs text-gray-400 font-medium">
                        /day
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors">
                        View Details
                      </button>
                      <button
                        disabled={!vehicle.available}
                        className={`px-4 py-2 text-white text-sm font-semibold rounded-lg transition-all ${
                          vehicle.available
                            ? "bg-[#1e6f43] hover:bg-[#154d2e] active:scale-95 shadow-xs"
                            : "bg-gray-300 cursor-not-allowed"
                        }`}
                      >
                        Book →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

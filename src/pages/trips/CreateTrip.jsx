import { useState } from "react";
import LocationInput from "./LocationInput";
import DateRangePicker from "./DateRangePicker";
import myImage from "../../assets/newTripBanner.png"; // Replace with your actual image path

const travelStyles = [
  { label: "Adventure", icon: "🏔️" },
  { label: "Cultural", icon: "🏛️" },
  { label: "Relaxation", icon: "🌴" },
  { label: "Family", icon: "👨‍👩‍👧" },
  { label: "Honeymoon", icon: "💑" },
  { label: "Pilgrimage", icon: "🙏" },
  { label: "Wildlife", icon: "🦁" },
  { label: "Photography", icon: "📷" },
];

const budgetOptions = [
  {
    emoji: "💚",
    title: "Budget",
    subtitle: "Guesthouses",
    price: "$15–30/night",
  },
  {
    emoji: "⭐",
    title: "Mid-Range",
    subtitle: "Boutique Hotels",
    price: "$40–80/night",
  },
  {
    emoji: "👑",
    title: "Luxury",
    subtitle: "Premium Resorts",
    price: "$150+/night",
  },
];

const PinIcon = (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

export default function CreateTrip() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [dateRange, setDateRange] = useState(null);
  const [travelers, setTravelers] = useState(2);
  const [selectedStyle, setSelectedStyle] = useState("Adventure");
  const [selectedBudget, setSelectedBudget] = useState("Mid-Range");

  const handleGenerate = () => {
    console.log({
      from,
      to,
      dateRange,
      travelers,
      selectedStyle,
      selectedBudget,
    });
    // TODO: wire to AI trip generation API
  };

  const divStyle = {
    backgroundImage: `url(${myImage})`,
    backgroundSize: "cover", // Image එක div එකට හරියටම fit වෙන්න
    backgroundPosition: "center", // Center වෙන්න
    width: "100%",
    height: "400px", // Div එකට height එකක් අනිවාර්යයෙන් දෙන්න
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-2xl">
        {/* Hero Banner */}
        <div
          className="relative px-6 pt-6 pb-8 mb-4 overflow-hidden bg-gradient-to-br from-green-100 via-green-200 to-green-300 rounded-2xl"
          style={divStyle}
        >
          <h1 className="text-3xl font-semibold text-green-900">
            Create New Trip ✨
          </h1>
          <p className="mt-1 text-sm text-green-700">
            Plan your perfect adventure with our AI trip planner
          </p>
        </div>

        {/* Main Card */}
        <div className="p-6 space-y-6 bg-white border border-gray-200 rounded-2xl">
          {/* Location & Date Fields */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <LocationInput
              label="Heading from"
              placeholder="Country, City or Landmark"
              icon={PinIcon}
              value={from}
              onChange={setFrom}
            />
            <LocationInput
              label="Where to?"
              placeholder="Country, City or Landmark"
              icon={PinIcon}
              value={to}
              onChange={setTo}
            />
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              placeholder="Select dates"
            />
          </div>

          <hr className="border-gray-100" />

          {/* Group Size */}
          <div>
            <label className="flex items-center gap-2 mb-3 text-sm font-medium text-green-700">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Group Size
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setTravelers((t) => Math.max(1, t - 1))}
                className="flex items-center justify-center w-8 h-8 text-lg font-light text-gray-600 transition-colors border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                −
              </button>
              <span className="text-base font-medium text-gray-800 min-w-[2rem] text-center">
                {travelers}
              </span>
              <span className="text-sm text-gray-500">travelers</span>
              <button
                onClick={() => setTravelers((t) => Math.min(20, t + 1))}
                className="flex items-center justify-center w-8 h-8 ml-2 text-lg font-light text-gray-600 transition-colors border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                +
              </button>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Travel Style */}
          <div>
            <label className="flex items-center gap-2 mb-3 text-sm font-medium text-green-700">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
              Travel Style
            </label>
            <div className="grid grid-cols-4 gap-2">
              {travelStyles.map((style) => (
                <button
                  key={style.label}
                  onClick={() => setSelectedStyle(style.label)}
                  className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-center transition-all ${
                    selectedStyle === style.label
                      ? "border-green-600 bg-green-50 border-[1.5px]"
                      : "border-gray-200 hover:border-green-300 hover:bg-green-50/50"
                  }`}
                >
                  <span className="text-2xl">{style.icon}</span>
                  <span
                    className={`text-xs ${selectedStyle === style.label ? "text-green-800 font-medium" : "text-gray-500"}`}
                  >
                    {style.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Budget Range */}
          <div>
            <label className="flex items-center gap-2 mb-3 text-sm font-medium text-green-700">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
              Budget Range
            </label>
            <div className="grid grid-cols-3 gap-3">
              {budgetOptions.map((opt) => (
                <button
                  key={opt.title}
                  onClick={() => setSelectedBudget(opt.title)}
                  className={`relative text-left p-3.5 rounded-xl border transition-all ${
                    selectedBudget === opt.title
                      ? "border-green-600 bg-green-50 border-[1.5px]"
                      : "border-gray-200 hover:border-green-300"
                  }`}
                >
                  {selectedBudget === opt.title && (
                    <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-green-700 flex items-center justify-center">
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </span>
                  )}
                  <p className="mb-1 text-sm font-medium text-gray-800">
                    {opt.emoji} {opt.title}
                  </p>
                  <p className="text-xs text-gray-500">{opt.subtitle}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{opt.price}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            className="w-full py-4 bg-green-800 hover:bg-green-900 text-white rounded-xl font-medium text-sm transition-colors flex flex-col items-center gap-0.5"
          >
            <span className="flex items-center gap-2">✦ Generate with AI</span>
            <span className="text-xs font-normal opacity-75">
              Let AI plan your perfect trip
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

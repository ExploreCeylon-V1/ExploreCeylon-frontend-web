import { useState, useRef, useEffect } from "react";

const SRI_LANKA_LOCATIONS = [
  "Colombo", "Kandy", "Galle", "Negombo", "Jaffna", "Trincomalee",
  "Anuradhapura", "Polonnaruwa", "Sigiriya", "Dambulla", "Nuwara Eliya",
  "Ella", "Mirissa", "Unawatuna", "Hikkaduwa", "Bentota", "Beruwala",
  "Arugam Bay", "Nilaveli", "Passikudah", "Batticaloa", "Matara",
  "Hambantota", "Tissamaharama", "Yala", "Udawalawe", "Horton Plains",
  "Adam's Peak", "Pinnawala", "Minneriya", "Kalpitiya", "Mannar",
  "Vavuniya", "Kurunegala", "Ratnapura", "Badulla", "Bandarawela",
  "Haputale", "Welimada", "Kataragama", "Tangalle", "Weligama",
  "Koggala", "Ahungalla", "Induruwa", "Aluthgama", "Kalutara",
  "Mount Lavinia", "Dehiwala", "Moratuwa", "Panadura",
];

const WORLD_CITIES = [
  "London, UK", "Paris, France", "Dubai, UAE", "Singapore", "Tokyo, Japan",
  "Sydney, Australia", "New York, USA", "Toronto, Canada", "Frankfurt, Germany",
  "Amsterdam, Netherlands", "Bangkok, Thailand", "Kuala Lumpur, Malaysia",
  "Mumbai, India", "Delhi, India", "Chennai, India", "Bangalore, India",
  "Beijing, China", "Seoul, South Korea", "Hong Kong", "Doha, Qatar",
  "Riyadh, Saudi Arabia", "Abu Dhabi, UAE", "Istanbul, Turkey",
  "Rome, Italy", "Barcelona, Spain", "Zurich, Switzerland",
  "Melbourne, Australia", "Auckland, New Zealand", "Los Angeles, USA",
  "Chicago, USA", "Miami, USA", "San Francisco, USA",
];

const ALL_LOCATIONS = [...SRI_LANKA_LOCATIONS, ...WORLD_CITIES];

export default function LocationInput({ label, placeholder, icon, value, onChange }) {
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const inputRef = useRef(null);
  const dropRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (!dropRef.current?.contains(e.target) && !inputRef.current?.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleChange = (val) => {
    setQuery(val);
    onChange?.(val);
    if (val.trim().length < 1) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const filtered = ALL_LOCATIONS.filter((loc) =>
      loc.toLowerCase().includes(val.toLowerCase())
    ).slice(0, 6);
    setSuggestions(filtered);
    setOpen(filtered.length > 0);
    setHighlighted(-1);
  };

  const handleSelect = (loc) => {
    setQuery(loc);
    onChange?.(loc);
    setSuggestions([]);
    setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      setHighlighted((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter" && highlighted >= 0) {
      handleSelect(suggestions[highlighted]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const isSriLanka = (loc) => SRI_LANKA_LOCATIONS.includes(loc);

  return (
    <div className="relative">
      <label className="flex items-center gap-1 text-xs font-medium text-green-700 mb-2">
        {icon}
        {label}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query && suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent placeholder-gray-400"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); onChange?.(""); setSuggestions([]); setOpen(false); }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <div
          ref={dropRef}
          className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
        >
          {suggestions.map((loc, i) => (
            <button
              key={loc}
              onClick={() => handleSelect(loc)}
              className={`w-full text-left px-3 py-2.5 flex items-center gap-2.5 transition-colors text-sm ${
                i === highlighted ? "bg-green-50" : "hover:bg-gray-50"
              }`}
            >
              <svg className="w-4 h-4 flex-shrink-0 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="flex-1 text-gray-800">{loc}</span>
              {isSriLanka(loc) && (
                <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full font-medium">
                  🇱🇰 LK
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

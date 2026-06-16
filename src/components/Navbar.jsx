import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Hotels", path: "/hotels" },
    { name: "Vehicles", path: "/vehicles" },
    { name: "Guides", path: "/guides" },
    { name: "Destinations", path: "/destinations" },
    { name: "Calendar", path: "/calendar" },
    { name: "Hidden Gems", path: "/hidden-gems" },
  ];

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : "U");

  return (
    <nav className="sticky top-0 z-[1000] flex h-[60px] items-center justify-between border-b border-gray-200 bg-white px-6 font-sans">
      {/* Logo */}
      <div className="flex shrink-0 cursor-pointer items-center gap-2" onClick={() => navigate("/")}>
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#2D6A4F]">
          <svg viewBox="0 0 24 24" fill="white" width="16" height="16">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
        </div>
        <span className="text-[15px] font-bold tracking-tight text-gray-900">ExploreCeylon</span>
      </div>

      {/* Nav Links */}
      <ul className="hidden items-center gap-1 md:flex">
        {navLinks.map((link) => (
          <li key={link.name}>
            <button
              className={`relative whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm transition-colors hover:text-[#2D6A4F] ${
                location.pathname === link.path ? "font-semibold text-[#2D6A4F] after:absolute after:-bottom-0.5 after:left-2 after:right-2 after:h-0.5 after:rounded-full after:bg-[#2D6A4F]" : "font-medium text-gray-600"
              }`}
              onClick={() => navigate(link.path)}
            >
              {link.name}
            </button>
          </li>
        ))}
      </ul>

      {/* Right Side */}
      <div className="flex shrink-0 items-center">
        {isAuthenticated && user ? (
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <button className="relative flex items-center justify-center rounded-full p-1 text-gray-600 hover:bg-gray-100 hover:text-[#2D6A4F]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {user.notificationCount > 0 && (
                <span className="absolute -right-1 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full border-[1.5px] border-white bg-red-600 text-[9px] font-bold text-white">
                  {user.notificationCount}
                </span>
              )}
            </button>

            {/* User Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                className="flex items-center gap-2 rounded-lg p-1 transition-colors hover:bg-gray-50"
                onClick={() => setDropdownOpen((prev) => !prev)}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#7B2D8B] text-[13px] font-bold text-white">
                  {getInitial(user.name)}
                </div>
                <span className="text-sm font-medium text-gray-900">Hi, {user.name}</span>
                <svg
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"
                  className={`text-gray-500 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-[calc(100%+10px)] z-[1001] w-60 origin-top-right overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg animate-in slide-in-from-top-2">
                  <div className="flex items-center gap-3 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#7B2D8B] text-base font-bold text-white">
                      {getInitial(user.name)}
                    </div>
                    <div>
                      <p className="m-0 text-sm font-bold text-gray-900">{user.name}</p>
                      <p className="m-0 mb-1 text-xs text-gray-500">{user.email}</p>
                      {user.role && <span className="rounded border border-gray-300 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-gray-600">{user.role}</span>}
                    </div>
                  </div>
                  <div className="h-px bg-gray-100" />
                  <button className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-50" onClick={() => { navigate("/my-trips"); setDropdownOpen(false); }}>
                    <span>My Trips</span>
                  </button>
                  <button className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-50" onClick={() => { navigate("/budget-tracker"); setDropdownOpen(false); }}>
                    <span>Budget Tracker</span>
                  </button>
                  <button className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-50" onClick={() => { navigate("/profile"); setDropdownOpen(false); }}>
                    <span>Profile</span>
                  </button>
                  <div className="h-px bg-gray-100" />
                  <button
                    className="block w-full px-4 py-3 text-center text-sm font-semibold text-red-600 hover:bg-red-50"
                    onClick={() => { logout(); setDropdownOpen(false); }}
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <button className="rounded-lg border-[1.5px] border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-900 transition-colors hover:border-[#2D6A4F] hover:bg-[#f6faf8] hover:text-[#2D6A4F]" onClick={() => navigate("/login")}>
              Login
            </button>
            <button className="rounded-lg bg-[#2D6A4F] px-5 py-2 text-sm font-semibold text-white transition-all hover:-translate-y-px hover:bg-[#235C42]" onClick={() => navigate("/register")}>
              Register →
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
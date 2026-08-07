import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useCart } from "../hooks/useCart";
import navLogo from "../assets/nav_logo1.png";
import SignOutModal from "./SignOutModal";
import NotificationBell from "./NotificationBell";

// "/" only matches the home page itself; every other link also matches any
// route nested under it (e.g. "/hotels" stays active on "/hotels/123") while
// stopping at a segment boundary so "/hotels" doesn't match "/hotels-guide".
function isNavLinkActive(pathname, linkPath) {
  if (linkPath === "/") return pathname === "/";
  return pathname === linkPath || pathname.startsWith(`${linkPath}/`);
}

export default function Navbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSignOut, setShowSignOut] = useState(false);
  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const { user, logout, isAuthenticated } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Destinations", path: "/destinations" },
    { name: "Hidden Gems", path: "/hidden-gems" },
    { name: "Events", path: "/events" },
    { name: "Guides", path: "/guides" },
    { name: "Vehicles", path: "/vehicles" },
    { name: "Hotels", path: "/hotels" },
    { name: "About Us", path: "/about" },
  ];

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false);
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(e.target) &&
        !e.target.closest("[data-mobile-menu-toggle]")
      ) {
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close the mobile menu on navigation (covers link clicks, back/forward, etc.)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing UI state to route changes, not derivable at render time
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Lock background scroll while the mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : "U");

  return (
    <nav className="sticky top-0 z-[1000] border-b border-gray-200 bg-white font-sans">
      <div className="flex h-[60px] items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <button
          type="button"
          className="flex shrink-0 items-center gap-2"
          onClick={() => navigate("/")}
          aria-label="Go to home page"
        >
          <img
            src={navLogo}
            alt="ExploreCeylon Logo"
            className="h-14 w-auto object-contain"
          />
        </button>

        {/* Nav Links */}
        <ul className="hidden items-center gap-1 xl:flex">
          {navLinks.map((link) => (
            <li key={link.name}>
              <button
                className={`relative whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm transition-colors hover:text-[#2D6A4F] ${
                  isNavLinkActive(location.pathname, link.path)
                    ? "font-semibold text-[#2D6A4F] after:absolute after:-bottom-0.5 after:left-2 after:right-2 after:h-0.5 after:rounded-full after:bg-[#2D6A4F]"
                    : "font-medium text-gray-600"
                }`}
                onClick={() => navigate(link.path)}
              >
                {link.name}
              </button>
            </li>
          ))}
        </ul>

        {/* Right Side */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Cart */}
              <button
                className="relative flex items-center justify-center rounded-full p-1 text-gray-600 hover:bg-gray-100 hover:text-[#2D6A4F]"
                onClick={() => navigate("/profile?tab=cart")}
                aria-label="Cart"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  width="20"
                  height="20"
                >
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -right-1 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full border-[1.5px] border-white bg-red-600 text-3xs font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Notification Bell */}
              <NotificationBell />

              {/* User Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  className="flex items-center gap-2 rounded-lg p-1 transition-colors hover:bg-gray-50"
                  onClick={() => setDropdownOpen((prev) => !prev)}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#7B2D8B] text-sm font-bold text-white">
                    {getInitial(user.name)}
                  </div>
                  <span className="hidden max-w-[140px] truncate text-sm font-medium text-gray-900 xl:inline">
                    Hi, {user.name}
                  </span>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    width="14"
                    height="14"
                    className={`hidden text-gray-500 transition-transform xl:block ${dropdownOpen ? "rotate-180" : ""}`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-[calc(100%+10px)] z-[1001] w-60 origin-top-right overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg animate-fade-in-up">
                    <div className="flex items-center gap-3 p-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#7B2D8B] text-base font-bold text-white">
                        {getInitial(user.name)}
                      </div>
                      <div>
                        <p className="m-0 text-sm font-bold text-gray-900">
                          {user.name}
                        </p>
                        <p className="m-0 mb-1 text-xs text-gray-500">
                          {user.email}
                        </p>
                        {user.role && (
                          <span className="rounded border border-gray-300 px-1.5 py-0.5 text-3xs font-bold tracking-wider text-gray-600">
                            {user.role}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="h-px bg-gray-100" />
                    <button
                      className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-50"
                      onClick={() => {
                        navigate("/my-trips");
                        setDropdownOpen(false);
                      }}
                    >
                      <span>My Trips</span>
                    </button>
                    <button
                      className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-50"
                      onClick={() => {
                        navigate("/profile");
                        setDropdownOpen(false);
                      }}
                    >
                      <span>Profile</span>
                    </button>
                    <div className="h-px bg-gray-100" />
                    <button
                      className="block w-full px-4 py-3 text-center text-sm font-semibold text-red-600 hover:bg-red-50"
                      onClick={() => {
                        setShowSignOut(true);
                        setDropdownOpen(false);
                      }}
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="hidden items-center gap-2.5 xl:flex">
              <button
                className="rounded-lg border-[1.5px] border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-900 transition-colors hover:border-[#2D6A4F] hover:bg-[#f6faf8] hover:text-[#2D6A4F]"
                onClick={() => navigate("/login")}
              >
                Login
              </button>
              <button
                className="rounded-lg bg-[#2D6A4F] px-5 py-2 text-sm font-semibold text-white transition-all hover:-translate-y-px hover:bg-[#235C42]"
                onClick={() => navigate("/register")}
              >
                Register →
              </button>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            data-mobile-menu-toggle
            type="button"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            className="flex items-center justify-center rounded-md p-2 text-gray-600 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2D6A4F] xl:hidden"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
          >
            {mobileMenuOpen ? (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                width="22"
                height="22"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                width="22"
                height="22"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu panel */}
      {mobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="border-t border-gray-100 bg-white shadow-lg animate-fade-in-up xl:hidden"
        >
          <ul className="flex flex-col gap-0.5 p-2">
            {navLinks.map((link) => (
              <li key={link.name}>
                <button
                  className={`block w-full rounded-md px-4 py-3 text-left text-sm transition-colors ${
                    isNavLinkActive(location.pathname, link.path)
                      ? "bg-[#f6faf8] font-semibold text-[#2D6A4F]"
                      : "font-medium text-gray-700 hover:bg-gray-50"
                  }`}
                  onClick={() => navigate(link.path)}
                >
                  {link.name}
                </button>
              </li>
            ))}
          </ul>

          {!isAuthenticated && (
            <div className="flex flex-col gap-2 border-t border-gray-100 p-3">
              <button
                className="w-full rounded-lg border-[1.5px] border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-900 transition-colors hover:border-[#2D6A4F] hover:bg-[#f6faf8] hover:text-[#2D6A4F]"
                onClick={() => navigate("/login")}
              >
                Login
              </button>
              <button
                className="w-full rounded-lg bg-[#2D6A4F] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#235C42]"
                onClick={() => navigate("/register")}
              >
                Register →
              </button>
            </div>
          )}
        </div>
      )}
      {showSignOut && (
        <SignOutModal
          onClose={() => setShowSignOut(false)}
          onConfirm={() => {
            setShowSignOut(false);
            logout("/");
          }}
        />
      )}
    </nav>
  );
}

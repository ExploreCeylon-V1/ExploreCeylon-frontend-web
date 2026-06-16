"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/src/context/AuthContext";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Hotels", href: "/hotels" },
  { label: "Vehicles", href: "/vehicles" },
  { label: "Guides", href: "/guides" },
  { label: "Destinations", href: "/destinations" },
  { label: "Calendar", href: "/calendar" },
  { label: "Hidden Gems", href: "/hidden-gems" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  const firstName = user?.name?.trim().split(" ")[0] ?? "Traveler";
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setDropdownOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [dropdownOpen]);

  return (
    <nav className="relative w-full bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#1a7a4a]">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M8 2C5 2 2 5 2 8s3 6 6 6 6-3 6-6-3-6-6-6z"
              fill="white"
              opacity="0.3"
            />
            <path d="M8 2c0 0-2 3-2 6s2 6 2 6 2-3 2-6-2-6-2-6z" fill="white" />
          </svg>
        </div>
        <span className="font-semibold text-gray-900 text-[15px]">
          ExploreCeylon
        </span>
      </Link>

      {/* Nav Links */}
      <div className="hidden md:flex items-center gap-1">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`relative px-3 py-1.5 text-sm transition-colors ${isActive ? "text-[#1a7a4a]" : "text-[#4b5563]"}`}
            >
              {link.label}
              {isActive && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-[#1a7a4a]" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Auth Section */}
      <div className="flex items-center gap-3">
        {isAuthenticated ? (
          <>
            {/* Notification Bell */}
            <button className="relative p-2 rounded-full hover:bg-gray-100 transition-colors">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#4b5563"
                strokeWidth="2"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className="absolute top-1 right-1 w-4 h-4 text-[10px] font-semibold text-white rounded-full flex items-center justify-center bg-[#e53e3e]">
                2
              </span>
            </button>

            {/* User Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold overflow-hidden bg-[#6b46c1]">
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={`Avatar of ${firstName}`}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    initials
                  )}
                </div>
                <span className="text-sm text-gray-700 hidden sm:block">
                  Hi, {firstName}
                </span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#9ca3af"
                  strokeWidth="2"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-3 w-64 overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-2xl">
                  <div className="space-y-3 border-b border-slate-200 px-4 py-4 bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#6b46c1] text-sm font-semibold text-white overflow-hidden">
                        {user?.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={`Avatar of ${firstName}`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          initials
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {user?.name ?? firstName}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {user?.email ?? ""}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600 ring-1 ring-slate-200">
                      {user?.role?.toUpperCase() === "ADMIN"
                        ? "ADMIN"
                        : "TRAVELER"}
                    </span>
                  </div>

                  <div className="space-y-1 px-2 py-2">
                    <Link
                      href="/trips"
                      className="flex items-center justify-between gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <span className="inline-flex items-center gap-2">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M3 7h18" />
                          <path d="M6 11h12" />
                          <path d="M10 15h4" />
                          <path d="M4 19h16" />
                        </svg>
                        My Trips
                      </span>
                      <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-slate-100 px-2 text-[11px] font-semibold text-slate-700">
                        3
                      </span>
                    </Link>
                    <Link
                      href="/budget"
                      className="flex items-center gap-2 rounded-2xl px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M12 3v18" />
                        <path d="M6 7h12" />
                        <path d="M6 17h12" />
                      </svg>
                      Budget Tracker
                    </Link>
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 rounded-2xl px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4z" />
                        <path d="M6 21v-1a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v1" />
                      </svg>
                      Profile
                    </Link>
                  </div>

                  <div className="border-t border-slate-200 px-2 py-2">
                    <button
                      onClick={() => {
                        logout();
                        setDropdownOpen(false);
                      }}
                      className="w-full rounded-2xl px-3 py-3 text-sm font-semibold text-rose-600 hover:bg-slate-100"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => setMenuOpen((open) => !open)}
              className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {menuOpen ? (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              )}
            </button>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="px-4 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="px-4 py-1.5 text-sm text-white rounded-lg flex items-center gap-1 transition-opacity hover:opacity-90 bg-[#1a7a4a]"
            >
              Register →
            </Link>
          </>
        )}
      </div>

      {menuOpen && (
        <div className="absolute inset-x-0 top-full z-40 overflow-hidden border-b border-gray-100 bg-white shadow-xl md:hidden">
          <div className="flex items-center justify-between px-5 py-4">
            <span className="text-sm font-semibold text-slate-900">
              Navigation
            </span>
            <button
              onClick={() => setMenuOpen(false)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100"
              aria-label="Close navigation"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="space-y-1 px-4 pb-4">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`block rounded-2xl px-4 py-3 text-sm font-medium ${isActive ? "bg-slate-100 text-slate-900" : "text-slate-700 hover:bg-slate-50"}`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login as loginUser } from "@/src/services/authService";
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

export default function LoginPage() {
  const { login: setAuth, logout: contextLogout, isAdmin } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAdmin) {
      router.push("/admin");
    }
  }, [isAdmin, router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await loginUser({ email, password });

      if (data.role === "ADMIN") {
        contextLogout();
        throw new Error(
          "Please use the Admin Portal to sign in as an administrator.",
        );
      }

      setAuth(data.accessToken, {
        id: data.userId,
        name: data.name || "",
        email: data.email || "",
        role: data.role || "TRAVELER",
        avatarUrl: data.avatarUrl,
      });

      router.push("/"); // ← Traveler home
    } catch (err) {
      setError(err?.message || "Sign in failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6 py-12">
        <div className="grid w-full gap-8 lg:grid-cols-[1.3fr_1fr] lg:gap-12">
          {/* LEFT PANEL — unchanged */}
          <section className="relative overflow-hidden rounded-[32px] bg-[radial-gradient(circle_at_top,_rgba(20,83,45,0.45),_transparent_36%),linear-gradient(180deg,_rgba(15,62,38,0.9)_0%,_rgba(15,62,38,0.98)_100%)] p-10 text-white shadow-2xl shadow-slate-900/10">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center opacity-30"></div>
            <div className="relative space-y-8">
              <div className="flex items-center gap-3 rounded-full bg-white/10 px-4 py-2 text-sm font-medium ring-1 ring-white/10">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xl font-bold text-white">
                  E
                </span>
                ExploreCeylon
              </div>
              <div className="space-y-4">
                <p className="text-sm uppercase tracking-[0.3em] text-emerald-200">
                  Welcome Back
                </p>
                <h1 className="text-4xl font-semibold leading-tight">
                  Your Journey to Paradise Begins Here
                </h1>
                <p className="max-w-xs text-slate-200/90">
                  Discover ancient temples, pristine beaches, and lush tea
                  plantations. Plan your perfect Sri Lankan adventure with local
                  experts.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl bg-white/10 p-5 text-center">
                  <p className="text-2xl font-semibold">12,000+</p>
                  <p className="mt-2 text-sm text-slate-200/80">
                    Happy Travelers
                  </p>
                </div>
                <div className="rounded-3xl bg-white/10 p-5 text-center">
                  <p className="text-2xl font-semibold">4.9★</p>
                  <p className="mt-2 text-sm text-slate-200/80">
                    Average Rating
                  </p>
                </div>
                <div className="rounded-3xl bg-white/10 p-5 text-center">
                  <p className="text-2xl font-semibold">500+</p>
                  <p className="mt-2 text-sm text-slate-200/80">Destinations</p>
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT PANEL */}
          <main className="rounded-[32px] bg-white p-10 shadow-2xl shadow-slate-900/5 flex flex-col justify-center">
            {/* Close Button */}
            <div className="flex justify-end mb-4">
              <Link
                href="/"
                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-500 hover:text-gray-700"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </Link>
            </div>

            {/* Header */}
            <div className="space-y-1 mb-8">
              <h1 className="text-3xl font-bold text-slate-900">
                Welcome Back 👋
              </h1>
              <p className="text-sm text-slate-500">
                Sign in to your ExploreCeylon account
              </p>
            </div>

            {/* Google Button */}
            <button
              type="button"
              className="w-full flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:border-slate-300 mb-5"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 text-sm text-slate-400 mb-5">
              <span className="h-px flex-1 bg-slate-200"></span>
              <span>or sign in with email</span>
              <span className="h-px flex-1 bg-slate-200"></span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-2">
                <label
                  className="text-sm font-semibold text-slate-700"
                  htmlFor="email"
                >
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </span>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    className="text-sm font-semibold text-slate-700"
                    htmlFor="password"
                  >
                    Password
                  </label>
                  <Link
                    href="#"
                    className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-12 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showPassword ? (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <label className="inline-flex items-center gap-2.5 text-sm text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                Remember me on this device
              </label>

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-emerald-800 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  "Signing In..."
                ) : (
                  <>
                    Sign In <span>→</span>
                  </>
                )}
              </button>
            </form>

            {/* Sign up link */}
            <p className="mt-5 text-center text-sm text-slate-500">
              Don't have an account?{" "}
              <Link
                href="/register"
                className="font-semibold text-emerald-600 hover:text-emerald-700"
              >
                Create one free →
              </Link>
            </p>

            {/* SSL Badge */}
            <div className="mt-5 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Your login is secured with 256-bit SSL encryption
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
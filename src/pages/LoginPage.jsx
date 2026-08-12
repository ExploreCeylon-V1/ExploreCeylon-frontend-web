import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  login as loginUser,
  googleLogin as googleLoginApi,
} from "../services/authService";
import { useAuth } from "../hooks/useAuth";
import { useGoogleLogin } from "@react-oauth/google";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  MapPin,
  Star,
  Users,
} from "lucide-react";
import logo from "../assets/EC_Logo.png";

export default function LoginPage() {
  const { login: setAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await loginUser({ email, password });
      setAuth(
        data.accessToken,
        {
          id: data.userId,
          name: data.name || "",
          email: data.email || "",
          role: data.role || "TRAVELER",
          avatarUrl: data.avatarUrl,
        },
        rememberMe,
        data.refreshToken,
      );
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err?.message || "Sign in failed.");
    } finally {
      setLoading(false);
    }
  }

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setError(null);
      setLoading(true);
      try {
        const data = await googleLoginApi(tokenResponse.access_token);
        setAuth(
          data.accessToken,
          {
            id: data.userId,
            name: data.name || "",
            email: data.email || "",
            role: data.role || "TRAVELER",
            avatarUrl: data.avatarUrl,
          },
          rememberMe,
          data.refreshToken,
        );
        navigate(redirectTo, { replace: true });
      } catch (err) {
        setError(err?.message || "Google Sign in failed.");
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      setError("Google Login was cancelled or failed.");
    },
  });

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50/80 via-teal-50/40 to-slate-100 p-4 sm:p-6 md:p-10 font-sans selection:bg-emerald-600 selection:text-white overflow-hidden">
      {/* ── Background Ambient Light Orbs ── */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-emerald-200/40 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-teal-200/40 blur-[100px]" />

      {/* ── Main Container ── */}
      <div className="relative z-10 w-full max-w-5xl overflow-hidden rounded-3xl border border-emerald-100 bg-white/90 shadow-xl shadow-emerald-950/5 backdrop-blur-md lg:grid lg:grid-cols-12">
        {/* ── LEFT HERO PANEL ── */}
        <section className="relative flex flex-col justify-between overflow-hidden p-8 sm:p-10 text-white lg:col-span-5 min-h-[320px] lg:min-h-[600px]">
          {/* Hero Image Overlay */}
          <div className="absolute inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center opacity-40 transition-transform duration-1000 hover:scale-105" />
          <div className="absolute inset-0 z-0 bg-gradient-to-t from-emerald-950 via-emerald-900/90 to-emerald-800/70" />

          {/* Header Badge */}
          <div className="relative z-10 flex items-center justify-between">
            <Link
              to="/"
              className="group flex items-center gap-2.5 rounded-full border border-white/20 bg-white/10 px-2 py-1.5 backdrop-blur-md transition-all hover:bg-white/20"
            >
              <img
                src={logo}
                alt="ExploreCeylon Logo"
                className="h-10 w-10 object-contain"
              />
              <span className="text-sm font-bold tracking-wide text-white group-hover:text-emerald-200">
                ExploreCeylon
              </span>
            </Link>
          </div>

          {/* Hero Main Content */}
          <div className="relative z-10 my-auto py-6">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-300/30 bg-white/15 px-3 py-1 text-2xs font-bold uppercase tracking-widest text-emerald-200">
              <Sparkles className="h-3 w-3" /> Welcome Back
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight tracking-tight text-white mb-3">
              Your Journey to Paradise Begins Here
            </h1>
            <p className="text-xs sm:text-sm text-slate-100/90 leading-relaxed max-w-sm font-medium">
              Discover ancient heritage sites, pristine golden beaches, and
              mist-covered tea plantations with Sri Lanka's leading tourism
              platform.
            </p>
          </div>

          {/* Stats Badges */}
          <div className="relative z-10 grid grid-cols-3 gap-2.5 pt-4 border-t border-white/15">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-3 text-center backdrop-blur-sm">
              <div className="flex items-center justify-center text-emerald-300 mb-0.5">
                <Users className="h-4 w-4" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-white">12,000+</p>
              <p className="text-3xs text-emerald-100 font-medium">Travelers</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-3 text-center backdrop-blur-sm">
              <div className="flex items-center justify-center text-amber-300 mb-0.5">
                <Star className="h-4 w-4 fill-amber-300" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-white">4.9 ★</p>
              <p className="text-3xs text-emerald-100 font-medium">Rating</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-3 text-center backdrop-blur-sm">
              <div className="flex items-center justify-center text-teal-300 mb-0.5">
                <MapPin className="h-4 w-4" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-white">500+</p>
              <p className="text-3xs text-emerald-100 font-medium">Spots</p>
            </div>
          </div>
        </section>

        {/* ── RIGHT FORM PANEL ── */}
        <main className="relative flex flex-col justify-between bg-white p-6 sm:p-10 lg:col-span-7">
          {/* Top Navbar close button */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Sign In 👋
            </h2>
            <Link
              to="/"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800"
              aria-label="Close and return home"
            >
              ✕
            </Link>
          </div>

          <p className="text-xs sm:text-sm text-slate-500 -mt-4 mb-6">
            Enter your details below to access your account & AI trip planner
          </p>

          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={() => handleGoogleLogin()}
            disabled={loading}
            className="mb-5 flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white py-3 px-4 text-xs sm:text-sm font-semibold text-slate-700 shadow-xs transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              className="shrink-0"
            >
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
            <span>
              {loading ? "Connecting to Google..." : "Continue with Google"}
            </span>
          </button>

          {/* Divider */}
          <div className="mb-5 flex items-center gap-3 text-2xs uppercase tracking-wider text-slate-400 font-medium">
            <span className="h-px flex-1 bg-slate-200" />
            <span>or sign in with email</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          {/* Form */}
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-bold text-slate-700 tracking-wide uppercase"
                htmlFor="email"
              >
                Email Address
              </label>
              <div className="relative flex items-center">
                <Mail className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-4 text-xs sm:text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label
                  className="text-xs font-bold text-slate-700 tracking-wide uppercase"
                  htmlFor="password"
                >
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  state={{ email }}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative flex items-center">
                <Lock className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-11 text-xs sm:text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 text-slate-400 hover:text-slate-600 transition-colors p-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <label className="flex cursor-pointer items-center gap-2.5 text-xs sm:text-sm text-slate-600 select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 cursor-pointer rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>Remember me on this device</span>
            </label>

            {/* Error Banner */}
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 flex items-center gap-2 font-medium">
                <span>⚠️</span> {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-800 hover:bg-emerald-900 py-3.5 px-4 text-xs sm:text-sm font-semibold text-white shadow-md shadow-emerald-900/10 transition-all hover:shadow-lg active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Signing In...</span>
                </div>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs sm:text-sm text-slate-500">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
              >
                Create one free →
              </Link>
            </p>
          </div>

          {/* Security SSL Badge */}
          <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-slate-100 bg-slate-50/70 py-2.5 px-3 text-3xs text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>256-bit Bank-Grade SSL Encrypted Authentication</span>
          </div>
        </main>
      </div>
    </div>
  );
}

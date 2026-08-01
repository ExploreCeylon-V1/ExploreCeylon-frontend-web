import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { login as loginUser, googleLogin as googleLoginApi } from "../services/authService";
import { useAuth } from "../hooks/useAuth";
import { useGoogleLogin } from '@react-oauth/google';

export default function LoginPage() {
  const { login: setAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // Where to send the user after a successful login: back to the page a
  // ProtectedRoute bounced them from, else the home page.
  const redirectTo = location.state?.from?.pathname || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Email/Password login eka
  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await loginUser({ email, password });
      setAuth(data.accessToken, {
        id: data.userId,
        name: data.name || "",
        email: data.email || "",
        role: data.role || "TRAVELER",
        avatarUrl: data.avatarUrl,
      }, rememberMe, data.refreshToken);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err?.message || "Sign in failed.");
    } finally {
      setLoading(false);
    }
  }

  // Google Login flow eka
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setError(null);
      setLoading(true);
      try {
        // Google eken labena access_token eka backend ekata yawanawa
        const data = await googleLoginApi(tokenResponse.access_token);

        setAuth(data.accessToken, {
          id: data.userId,
          name: data.name || "",
          email: data.email || "",
          role: data.role || "TRAVELER",
          avatarUrl: data.avatarUrl,
        }, rememberMe);
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
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6 font-sans text-slate-900 md:p-12">
      <div className="grid w-full max-w-[1100px] grid-cols-1 gap-8 lg:grid-cols-[1.3fr_1fr]">

        {/* ── LEFT PANEL ── */}
        <section className="relative flex min-h-[260px] flex-col overflow-hidden rounded-[32px] p-10 text-white shadow-2xl">
          {/* Background Image & Overlay */}
          <div className="absolute inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center opacity-30" />
          <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top,rgba(20,83,45,0.45),transparent_36%),linear-gradient(180deg,rgba(15,62,38,0.9)_0%,rgba(15,62,38,0.98)_100%)]" />
          
          <div className="relative z-10 flex h-full flex-col gap-8">
            {/* Brand badge */}
            <div className="flex w-fit items-center gap-3 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-lg font-bold">E</span>
              ExploreCeylon
            </div>

            {/* Hero text */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">Welcome Back</p>
              <h1 className="mb-3.5 text-3xl font-semibold leading-[1.2] md:text-4xl">
                Your Journey to Paradise Begins Here
              </h1>
              <p className="m-0 max-w-[280px] text-sm leading-[1.6] text-slate-200/90">
                Discover ancient temples, pristine beaches, and lush tea
                plantations. Plan your perfect Sri Lankan adventure with local experts.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { val: "12,000+", label: "Happy Travelers" },
                { val: "4.9★", label: "Average Rating" },
                { val: "500+", label: "Destinations" },
              ].map((stat, idx) => (
                <div key={idx} className="rounded-3xl bg-white/10 p-5 text-center">
                  <p className="m-0 mb-1.5 text-2xl font-semibold">{stat.val}</p>
                  <p className="m-0 text-xs text-slate-200/80">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── RIGHT PANEL ── */}
        <main className="flex flex-col justify-center rounded-[32px] bg-white p-9 shadow-[0_4px_40px_rgba(15,23,42,0.06)] md:p-10">
          {/* Close */}
          <div className="mb-4 flex justify-end">
            <Link to="/" className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </Link>
          </div>

          {/* Heading */}
          <h1 className="m-0 mb-1 text-3xl font-bold text-slate-900">Welcome Back 👋</h1>
          <p className="m-0 mb-6 text-sm text-slate-500">Sign in to your ExploreCeylon account</p>

          {/* Google Button */}
          <button 
            type="button" 
            onClick={() => handleGoogleLogin()}
            disabled={loading}
            className="mb-4 flex w-full items-center justify-center gap-2.5 rounded-2xl border-[1.5px] border-slate-200 bg-white py-[13px] text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {loading ? "Connecting..." : "Continue with Google"}
          </button>

          {/* Divider */}
          <div className="mb-4 flex items-center gap-3 text-sm text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            <span>or sign in with email</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          {/* Form */}
          <form className="flex flex-col gap-4.5" onSubmit={handleSubmit}>
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700" htmlFor="email">Email Address</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 flex -translate-y-1/2 items-center text-slate-400">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </span>
                <input
                  id="email" type="email" placeholder="your@email.com" required
                  className="w-full box-border rounded-2xl border-[1.5px] border-slate-200 bg-white py-3 pl-10 pr-3.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-300 focus:border-emerald-500 focus:ring-[3px] focus:ring-emerald-500/10"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5 mt-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700" htmlFor="password">Password</label>
                <Link to="/forgot-password" state={{ email }} className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">Forgot password?</Link>
              </div>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 flex -translate-y-1/2 items-center text-slate-400">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  id="password" type={showPassword ? "text" : "password"} placeholder="Enter your password" required
                  className="w-full box-border rounded-2xl border-[1.5px] border-slate-200 bg-white py-3 pl-10 pr-[44px] text-sm text-slate-900 outline-none transition-all placeholder:text-slate-300 focus:border-emerald-500 focus:ring-[3px] focus:ring-emerald-500/10"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                />
                <button type="button" className="absolute right-3.5 top-1/2 flex -translate-y-1/2 items-center text-slate-400 hover:text-slate-600" onClick={() => setShowPassword((v) => !v)}>
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <label className="mt-4 flex cursor-pointer items-center gap-2.5 text-sm text-slate-600">
              <input type="checkbox" className="h-4 w-4 cursor-pointer accent-emerald-600" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
              Remember me on this device
            </label>

            {/* Error */}
            {error && <div className="mt-2 rounded-2xl border-[1.5px] border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700">{error}</div>}

            {/* Submit */}
            <button type="submit" disabled={loading} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1a5c3a] py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#134d2f] disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? "Signing In..." : <>Sign In <span>→</span></>}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-4 text-center text-sm text-slate-500">
            Don't have an account?{" "}
            <Link to="/register" className="font-semibold text-emerald-600 hover:text-emerald-700">Create one free →</Link>
          </p>

          {/* SSL */}
          <div className="mt-4 flex items-center gap-2 rounded-2xl border-[1.5px] border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            Your login is secured with 256-bit SSL encryption
          </div>
        </main>
      </div>
    </div>
  );
}
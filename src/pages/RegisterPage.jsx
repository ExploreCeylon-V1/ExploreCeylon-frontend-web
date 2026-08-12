import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { SuccessModal } from "../components/SuccessModal";
import { register as registerUser } from "../services/authService";
import { useAuth } from "../hooks/useAuth";
import { User, Mail, Lock, Eye, EyeOff, Globe, MessageSquare, ShieldCheck, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import logo from "../assets/EC_Logo.png";

const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Argentina","Armenia","Australia","Austria","Azerbaijan",
  "Bahamas","Bahrain","Bangladesh","Belarus","Belgium","Belize","Benin","Bhutan","Bolivia","Bosnia",
  "Botswana","Brazil","Brunei","Bulgaria","Cambodia","Cameroon","Canada","Chile","China","Colombia",
  "Croatia","Cuba","Cyprus","Czech Republic","Denmark","Ecuador","Egypt","Estonia","Ethiopia","Finland",
  "France","Georgia","Germany","Ghana","Greece","Guatemala","Honduras","Hungary","Iceland","India",
  "Indonesia","Iran","Iraq","Ireland","Israel","Italy","Jamaica","Japan","Jordan","Kazakhstan",
  "Kenya","Kuwait","Kyrgyzstan","Latvia","Lebanon","Libya","Lithuania","Luxembourg","Malaysia","Maldives",
  "Mali","Malta","Mexico","Moldova","Mongolia","Montenegro","Morocco","Mozambique","Myanmar","Namibia",
  "Nepal","Netherlands","New Zealand","Nicaragua","Nigeria","North Korea","Norway","Oman","Pakistan","Panama",
  "Paraguay","Peru","Philippines","Poland","Portugal","Qatar","Romania","Russia","Rwanda","Saudi Arabia",
  "Senegal","Serbia","Singapore","Slovakia","Slovenia","South Africa","South Korea","Spain","Sri Lanka","Sudan",
  "Sweden","Switzerland","Syria","Taiwan","Tajikistan","Tanzania","Thailand","Tunisia","Turkey","Uganda",
  "Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan","Venezuela","Vietnam",
  "Yemen","Zambia","Zimbabwe",
];
const LANGUAGES = ["English","Sinhala","Tamil","French","German","Spanish","Italian","Portuguese","Russian","Chinese","Japanese","Korean","Arabic","Hindi"];

export default function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || "/";
  const { login: setAuth } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [nationality, setNationality] = useState("");
  const [language, setLanguage] = useState("English");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }
    if (!agreeTerms) {
      setError("Please agree to the Terms of Service and Privacy Policy");
      setLoading(false);
      return;
    }

    try {
      const data = await registerUser({ name: fullName, email, password, nationality, language });
      setAuth(data.accessToken, {
        id: data.userId,
        name: data.name || fullName,
        email: data.email || email,
        role: data.role || "TRAVELER",
        avatarUrl: data.avatarUrl,
      }, true, data.refreshToken);
      setShowSuccessModal(true);
    } catch (err) {
      setError(err?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSuccessModalAction() {
    setShowSuccessModal(false);
    navigate(redirectTo, { replace: true });
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50/80 via-teal-50/40 to-slate-100 p-4 sm:p-6 md:p-10 font-sans selection:bg-emerald-600 selection:text-white overflow-hidden">
      {/* ── Background Ambient Light Orbs ── */}
      <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-emerald-200/40 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-teal-200/40 blur-[100px]" />

      {/* ── Main Container ── */}
      <div className="relative z-10 w-full max-w-5xl overflow-hidden rounded-3xl border border-emerald-100 bg-white/90 shadow-xl shadow-emerald-950/5 backdrop-blur-md lg:grid lg:grid-cols-12">

        {/* ── LEFT HERO PANEL ── */}
        <section className="relative flex flex-col justify-between overflow-hidden p-8 sm:p-10 text-white lg:col-span-5 min-h-[320px] lg:min-h-[680px]">
          {/* Hero Image Overlay */}
          <div className="absolute inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1493558103817-58b2924bce98?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center opacity-40 transition-transform duration-1000 hover:scale-105" />
          <div className="absolute inset-0 z-0 bg-gradient-to-t from-emerald-950 via-emerald-900/90 to-emerald-800/70" />

          {/* Header Brand */}
          <div className="relative z-10 flex items-center justify-between">
            <Link to="/" className="group flex items-center gap-2.5 rounded-full border border-white/20 bg-white/10 px-2 py-1.5 backdrop-blur-md transition-all hover:bg-white/20">
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
              <Sparkles className="h-3 w-3" /> Join 12,000+ Travelers
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight tracking-tight text-white mb-3">
              Start Your Sri Lankan Adventure
            </h1>
            <p className="text-xs sm:text-sm text-slate-100/90 leading-relaxed max-w-sm font-medium">
              Unlock AI-powered trip generation, direct driver & guide bookings, and exclusive hidden local gems across the island.
            </p>

            {/* Feature Highlights */}
            <div className="mt-6 space-y-3">
              {[
                { title: "AI-Powered Itineraries", desc: "Tailored daily schedules built for your style" },
                { title: "Verified Local Experts", desc: "Book drivers and tour guides safely" },
                { title: "Hidden Gems & Budgeting", desc: "Discover off-the-beaten-path locations" },
              ].map((f, i) => (
                <div key={i} className="flex items-start gap-3 rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-white">{f.title}</p>
                    <p className="text-3xs text-emerald-100 font-medium">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Badge */}
          <div className="relative z-10 pt-4 border-t border-white/15 flex items-center justify-between text-2xs text-emerald-100 font-medium">
            <span>🇱🇰 Sri Lanka Tourism Platform</span>
            <span>Free Forever</span>
          </div>
        </section>

        {/* ── RIGHT FORM PANEL ── */}
        <main className="relative flex flex-col justify-between bg-white p-6 sm:p-10 lg:col-span-7">
          {/* Top Navbar close button */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Create Free Account ✨
            </h2>
            <Link
              to="/"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800"
              aria-label="Close and return home"
            >
              ✕
            </Link>
          </div>

          <p className="text-xs sm:text-sm text-slate-500 -mt-2 mb-6">
            Fill in your information below to register your Traveler account
          </p>

          <form className="flex flex-col gap-3.5" onSubmit={handleSubmit}>
            {/* Full Name */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700 tracking-wide uppercase" htmlFor="fullName">
                Full Name <span className="text-emerald-600">*</span>
              </label>
              <div className="relative flex items-center">
                <User className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" />
                <input
                  id="fullName"
                  type="text"
                  placeholder="John Smith"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-xs sm:text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700 tracking-wide uppercase" htmlFor="reg-email">
                Email Address <span className="text-emerald-600">*</span>
              </label>
              <div className="relative flex items-center">
                <Mail className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" />
                <input
                  id="reg-email"
                  type="email"
                  placeholder="john@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-xs sm:text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
                />
              </div>
            </div>

            {/* Passwords Grid */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Password */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700 tracking-wide uppercase" htmlFor="reg-password">
                  Password <span className="text-emerald-600">*</span>
                </label>
                <div className="relative flex items-center">
                  <Lock className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" />
                  <input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-10 text-xs sm:text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700 tracking-wide uppercase" htmlFor="confirmPassword">
                  Confirm Password <span className="text-emerald-600">*</span>
                </label>
                <div className="relative flex items-center">
                  <Lock className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" />
                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Repeat password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-10 text-xs sm:text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Nationality & Language Dropdowns */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700 tracking-wide uppercase">Nationality</label>
                <div className="relative flex items-center">
                  <Globe className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" />
                  <select
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-8 text-xs sm:text-sm text-slate-700 outline-none cursor-pointer transition-all focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 appearance-none"
                  >
                    <option value="">🌍 Select country</option>
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700 tracking-wide uppercase">Language</label>
                <div className="relative flex items-center">
                  <MessageSquare className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" />
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-8 text-xs sm:text-sm text-slate-700 outline-none cursor-pointer transition-all focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 appearance-none"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Traveler Account Banner */}
            <div className="mt-1 flex gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3 text-xs">
              <span className="text-emerald-600 font-bold shrink-0 mt-0.5">ℹ️</span>
              <div>
                <p className="font-semibold text-emerald-950 mb-0.5">
                  Default Role: <span className="rounded-full bg-emerald-200/80 px-2 py-0.5 text-3xs font-bold text-emerald-900">TRAVELER</span>
                </p>
                <p className="text-slate-600 text-3xs leading-relaxed">
                  Plan itineraries, book guides & vehicles, and track budget. All accounts start as Traveler.
                </p>
              </div>
            </div>

            {/* Terms Checkbox */}
            <label className="mt-1 flex cursor-pointer items-start gap-2.5 text-xs text-slate-600 select-none">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>
                I agree to the{" "}
                <Link to="/terms" target="_blank" rel="noreferrer" className="font-semibold text-emerald-700 hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy" target="_blank" rel="noreferrer" className="font-semibold text-emerald-700 hover:underline">
                  Privacy Policy
                </Link>
              </span>
            </label>

            {/* Error Message Banner */}
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-center gap-2 font-medium">
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
                  <span>Creating Account...</span>
                </div>
              ) : (
                <>
                  <span>Create Free Account</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            <p className="text-xs sm:text-sm text-slate-500">
              Already have an account?{" "}
              <Link to="/login" className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline">
                Sign in here →
              </Link>
            </p>
          </div>

          {/* Security SSL Badge */}
          <div className="mt-3 flex items-center justify-center gap-2 rounded-2xl border border-slate-100 bg-slate-50/70 py-2 px-3 text-3xs text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>256-bit Bank-Grade SSL Encrypted Registration</span>
          </div>
        </main>

      </div>

      <SuccessModal
        isOpen={showSuccessModal}
        title="Account Created!"
        message="Welcome to ExploreCeylon! Your journey to discovering Sri Lanka's wonders begins now."
        onButtonClick={handleSuccessModalAction}
        onClose={handleSuccessModalAction}
      />
    </div>
  );
}
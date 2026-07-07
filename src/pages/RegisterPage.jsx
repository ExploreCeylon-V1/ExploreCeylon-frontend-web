import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { SuccessModal } from "../components/SuccessModal";
import { register as registerUser } from "../services/authService";
import { useAuth } from "../context/AuthContext";

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

const EyeOpen = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>;
const EyeOff = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>;
const ChevronDown = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>;

// FIX: InputWrap kiyana component eka main function eken eliyata gaththa. 
// Eka nisa dan thappara gane meka re-render wenne na. Focus eka nathi wenneth na.
const InputWrap = ({ icon, children }) => (
  <div className="relative">
    <span className="pointer-events-none absolute left-3.5 top-1/2 flex -translate-y-1/2 items-center text-slate-400">{icon}</span>
    {children}
  </div>
);

export default function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  // Return the user to wherever the login prompt was triggered, else home.
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

  const inputClasses = "w-full box-border rounded-2xl border-[1.5px] border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-300 focus:border-emerald-500 focus:ring-[3px] focus:ring-emerald-500/10";
  const selectClasses = "w-full appearance-none box-border rounded-2xl border-[1.5px] border-slate-200 bg-white py-2.5 pl-8 pr-8 text-sm text-slate-700 outline-none transition-all focus:border-emerald-500 focus:ring-[3px] focus:ring-emerald-500/10 cursor-pointer";

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6 font-sans text-slate-900 md:p-12">
      <div className="grid w-full max-w-[1100px] grid-cols-1 gap-8 lg:grid-cols-[1.3fr_1fr]">

        {/* ── LEFT PANEL ── */}
        <section className="relative flex min-h-[280px] flex-col overflow-hidden rounded-[32px] p-10 text-white shadow-2xl">
          <div className="absolute inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1493558103817-58b2924bce98?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center opacity-30" />
          <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top,rgba(15,62,38,0.62),transparent_36%),linear-gradient(180deg,rgba(15,62,38,0.92)_0%,rgba(15,62,38,0.98)_100%)]" />
          
          <div className="relative z-10 flex h-full flex-col gap-8">
            <div className="flex w-fit items-center gap-3 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-lg font-bold">E</span>
              ExploreCeylon
            </div>

            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">Join Thousands of Travelers</p>
              <h1 className="mb-3.5 text-3xl font-semibold leading-[1.2] md:text-4xl">Create Your Account</h1>
              <p className="m-0 max-w-[320px] text-sm leading-[1.6] text-slate-200/90">
                Start planning your Sri Lankan adventure with AI-powered itineraries, expert guides, and hidden local gems.
              </p>
            </div>

            <div className="flex flex-col gap-4 rounded-3xl bg-white/10 p-6">
              {[
                { title: "Personalized Itineraries", desc: "AI-powered trip planning tailored to your preferences" },
                { title: "Local Expert Guides", desc: "Connect with verified guides who know Sri Lanka best" },
                { title: "Hidden Gems", desc: "Discover secret spots loved by locals" },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-4">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50/90 text-base font-bold text-emerald-800">✓</div>
                  <div>
                    <p className="m-0 mb-1 text-sm font-semibold text-white">{item.title}</p>
                    <p className="m-0 text-sm text-slate-200/80">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── RIGHT PANEL ── */}
        <main className="flex flex-col justify-center rounded-[32px] bg-white p-7 shadow-[0_4px_40px_rgba(15,23,42,0.06)] md:p-10">
          <div className="mb-3.5 flex justify-end">
            <Link to="/" className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </Link>
          </div>

          <h1 className="m-0 mb-1 text-2xl font-bold text-slate-900">Create Your Account ✨</h1>
          <p className="m-0 mb-5 text-sm text-slate-500">Start planning your Sri Lanka adventure</p>

          <form className="flex flex-col gap-3.5" onSubmit={handleSubmit}>
            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700" htmlFor="fullName">Full Name <span className="text-red-500">*</span></label>
              <InputWrap icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>}>
                <input id="fullName" type="text" className={inputClasses} placeholder="John Smith" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </InputWrap>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700" htmlFor="reg-email">Email Address <span className="text-red-500">*</span></label>
              <InputWrap icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>}>
                <input id="reg-email" type="email" className={inputClasses} placeholder="john@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </InputWrap>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700" htmlFor="reg-password">Password <span className="text-red-500">*</span></label>
              <InputWrap icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>}>
                <input id="reg-password" type={showPassword ? "text" : "password"} className={`${inputClasses} pr-[44px]`} placeholder="Create password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="button" className="absolute right-3.5 top-1/2 flex -translate-y-1/2 items-center text-slate-400 hover:text-slate-600" onClick={() => setShowPassword((v) => !v)}>
                  {showPassword ? <EyeOff /> : <EyeOpen />}
                </button>
              </InputWrap>
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700" htmlFor="confirmPassword">Confirm Password <span className="text-red-500">*</span></label>
              <InputWrap icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>}>
                <input id="confirmPassword" type={showPassword ? "text" : "password"} className={`${inputClasses} pr-[44px]`} placeholder="Repeat password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                <button type="button" className="absolute right-3.5 top-1/2 flex -translate-y-1/2 items-center text-slate-400 hover:text-slate-600" onClick={() => setShowPassword((v) => !v)}>
                  {showPassword ? <EyeOff /> : <EyeOpen />}
                </button>
              </InputWrap>
            </div>

            {/* Nationality & Language */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">Nationality</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 items-center text-base">🌐</span>
                  <select className={selectClasses} value={nationality} onChange={(e) => setNationality(e.target.value)}>
                    <option value="">🌍 Select country</option>
                    {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center text-slate-400"><ChevronDown /></span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">Language</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 items-center text-base">💬</span>
                  <select className={selectClasses} value={language} onChange={(e) => setLanguage(e.target.value)}>
                    {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center text-slate-400"><ChevronDown /></span>
                </div>
              </div>
            </div>

            {/* Traveler Info Banner */}
            <div className="mt-2 flex gap-3 rounded-2xl border-[1.5px] border-blue-100 bg-blue-50 p-3.5">
              <span className="mt-[1px] shrink-0 text-blue-500">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></svg>
              </span>
              <div>
                <p className="m-0 mb-1 text-sm text-slate-600">
                  Your account type: <span className="inline-block rounded-full bg-blue-100 px-2 py-0.5 text-3xs font-bold tracking-[0.6px] text-blue-700">TRAVELER</span>
                </p>
                <p className="m-0 text-xs text-slate-500">Traveler accounts can plan trips, book guides & vehicles, and track budget. All accounts start as Traveler.</p>
              </div>
            </div>

            {/* Terms */}
            <label className="mt-1 flex cursor-pointer items-start gap-2.5 text-sm leading-[1.5] text-slate-600">
              <input type="checkbox" className="mt-[2px] h-4 w-4 shrink-0 cursor-pointer accent-emerald-600" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} />
              <span>I agree to the <Link to="#" className="font-semibold text-emerald-600 hover:text-emerald-700">Terms of Service</Link> and <Link to="#" className="font-semibold text-emerald-600 hover:text-emerald-700">Privacy Policy</Link></span>
            </label>

            {/* Error */}
            {error && <div className="mt-1 rounded-2xl border-[1.5px] border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700">{error}</div>}

            {/* Submit */}
            <button type="submit" disabled={loading} className="mt-1 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1a5c3a] py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#134d2f] disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? "Creating Account..." : <>Create Free Account →</>}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-slate-500">
            Already have an account? <Link to="/login" className="font-semibold text-emerald-600 hover:text-emerald-700">Sign in here →</Link>
          </p>
        </main>
      </div>

      <SuccessModal
        isOpen={showSuccessModal}
        title="Account Created!"
        message="Welcome to ExploreCeylon! Your journey to discovering Sri Lanka's wonders begins now."
        offerText="Welcome Gift: Get 10% off your first booking with code"
        offerCode="WELCOME10"
        buttonText="Start Exploring"
        icon="🌿"
        onButtonClick={handleSuccessModalAction}
        onClose={handleSuccessModalAction}
      />
    </div>
  );
}
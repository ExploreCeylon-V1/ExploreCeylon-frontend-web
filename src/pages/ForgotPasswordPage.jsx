import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import OtpInput from "../components/OtpInput";
import { SuccessModal } from "../components/SuccessModal";
import { forgotPassword, resetPassword, verifyResetCode } from "../services/authService";

const RESEND_COOLDOWN_SECONDS = 60;
const REDIRECT_DELAY_SECONDS = 5;

const EyeOpen = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>;
const EyeOff = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const STEP_COPY = {
  email:    { eyebrow: "Account Recovery",  title: "Forgot Your Password?", subtitle: "No worries — enter your email and we'll send you a reset code." },
  otp:      { eyebrow: "Verify It's You",   title: "Enter Verification Code", subtitle: "We've sent a 6-digit code to your email." },
  password: { eyebrow: "Almost There",      title: "Create New Password", subtitle: "Choose a strong password you haven't used before." },
};

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState("email"); // email | otp | password
  const [email, setEmail] = useState(location.state?.email || "");
  const [emailTouched, setEmailTouched] = useState(false);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [redirectIn, setRedirectIn] = useState(REDIRECT_DELAY_SECONDS);

  const emailValid = EMAIL_RE.test(email.trim());

  // Resend cooldown ticker
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendCooldown]);

  // Auto-redirect to login once the success modal is showing
  useEffect(() => {
    if (!showSuccessModal) return;
    if (redirectIn <= 0) {
      navigate("/login", { replace: true });
      return;
    }
    const id = setTimeout(() => setRedirectIn((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [showSuccessModal, redirectIn, navigate]);

  async function handleSendCode(e) {
    e?.preventDefault();
    setEmailTouched(true);
    if (!emailValid || loading) return;

    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setStep("otp");
      setCode("");
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setInfo("If that email is registered, a 6-digit code is on its way. It expires in 10 minutes.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0 || loading) return;
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setCode("");
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setInfo("A new code is on its way.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(e) {
    e?.preventDefault();
    if (code.length !== 6 || loading) return;

    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      await verifyResetCode(email.trim(), code);
      setStep("password");
    } catch (err) {
      setError(err.message);
      setCode("");
    } finally {
      setLoading(false);
    }
  }

  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const strength = newPassword.length === 0 ? 0
    : newPassword.length < 6 ? 1
    : newPassword.length < 10 ? 2
    : /[^a-zA-Z0-9]/.test(newPassword) ? 4 : 3;
  const strengthColors = ["", "bg-red-400", "bg-yellow-400", "bg-green-500", "bg-green-600"];
  const strengthText = ["", "Weak — too short", "Medium — add symbols to strengthen", "Strong", "Very Strong ✓"];

  async function handleResetPassword(e) {
    e?.preventDefault();
    if (loading) return;

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!passwordsMatch) {
      setError("Passwords do not match.");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await resetPassword(email.trim(), code, newPassword, confirmPassword);
      setRedirectIn(REDIRECT_DELAY_SECONDS);
      setShowSuccessModal(true);
    } catch (err) {
      setError(err.message);
      // The code may have expired while the user was typing — send them back
      // to request a fresh one rather than leaving them stuck.
      if (/invalid|expired/i.test(err.message)) {
        setStep("otp");
        setCode("");
      }
    } finally {
      setLoading(false);
    }
  }

  function backTo(targetStep) {
    setError(null);
    setInfo(null);
    setStep(targetStep);
  }

  const copy = STEP_COPY[step];
  const inputClasses = "w-full box-border rounded-2xl border-[1.5px] border-slate-200 bg-white py-3 pl-10 pr-3.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-300 focus:border-emerald-500 focus:ring-[3px] focus:ring-emerald-500/10";

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6 font-sans text-slate-900 md:p-12">
      <div className="grid w-full max-w-[1100px] grid-cols-1 gap-8 lg:grid-cols-[1.3fr_1fr]">

        {/* ── LEFT PANEL ── */}
        <section className="relative flex min-h-[260px] flex-col overflow-hidden rounded-[32px] p-10 text-white shadow-2xl">
          <div className="absolute inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center opacity-30" />
          <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top,rgba(20,83,45,0.45),transparent_36%),linear-gradient(180deg,rgba(15,62,38,0.9)_0%,rgba(15,62,38,0.98)_100%)]" />

          <div className="relative z-10 flex h-full flex-col gap-8">
            <div className="flex w-fit items-center gap-3 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-lg font-bold">E</span>
              ExploreCeylon
            </div>

            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">{copy.eyebrow}</p>
              <h1 className="mb-3.5 text-3xl font-semibold leading-[1.2] md:text-4xl">{copy.title}</h1>
              <p className="m-0 max-w-[300px] text-sm leading-[1.6] text-slate-200/90">{copy.subtitle}</p>
            </div>

            {/* Step indicator */}
            <div className="mt-auto flex items-center gap-2">
              {["email", "otp", "password"].map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors
                    ${step === s ? "bg-white text-[#1a5c3a]" : ["email", "otp", "password"].indexOf(step) > i ? "bg-emerald-400 text-[#1a5c3a]" : "bg-white/15 text-white/70"}`}>
                    {["email", "otp", "password"].indexOf(step) > i ? "✓" : i + 1}
                  </div>
                  {i < 2 && <div className="h-[2px] w-6 bg-white/20" />}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── RIGHT PANEL ── */}
        <main className="flex flex-col justify-center rounded-[32px] bg-white p-9 shadow-[0_4px_40px_rgba(15,23,42,0.06)] md:p-10">
          <div className="mb-4 flex justify-end">
            <Link to="/" aria-label="Close and return home" className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </Link>
          </div>

          <h1 className="m-0 mb-1 text-2xl font-bold text-slate-900">{copy.title}</h1>
          <p className="m-0 mb-6 text-sm text-slate-500">{copy.subtitle}</p>

          {/* Live region: screen readers announce state changes without visual duplication */}
          <div aria-live="polite" className="sr-only">{error || info}</div>

          {info && (
            <div className="mb-4 rounded-2xl border-[1.5px] border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-700">
              {info}
            </div>
          )}
          {error && (
            <div className="mb-4 rounded-2xl border-[1.5px] border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* ── STEP 1: EMAIL ── */}
          {step === "email" && (
            <form className="flex flex-col gap-4" onSubmit={handleSendCode} noValidate>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700" htmlFor="fp-email">Email Address</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 flex -translate-y-1/2 items-center text-slate-400">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                  </span>
                  <input
                    id="fp-email" type="email" placeholder="your@email.com"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setEmailTouched(true)}
                    aria-invalid={emailTouched && !emailValid}
                    aria-describedby="fp-email-error"
                    className={inputClasses} autoFocus
                  />
                </div>
                {emailTouched && !emailValid && (
                  <p id="fp-email-error" className="text-xs font-medium text-red-500">Enter a valid email address.</p>
                )}
              </div>

              <button type="submit" disabled={loading || !emailValid}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1a5c3a] py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#134d2f] disabled:cursor-not-allowed disabled:opacity-50">
                {loading ? "Sending Code..." : <>Send Reset Code →</>}
              </button>

              <p className="mt-1 text-center text-sm text-slate-500">
                Remembered it? <Link to="/login" className="font-semibold text-emerald-600 hover:text-emerald-700">Back to Sign In</Link>
              </p>
            </form>
          )}

          {/* ── STEP 2: OTP ── */}
          {step === "otp" && (
            <form className="flex flex-col gap-4" onSubmit={handleVerifyCode} noValidate>
              <p className="text-sm text-slate-600">
                Code sent to <span className="font-semibold text-slate-900">{email}</span>
              </p>

              <OtpInput length={6} value={code} onChange={setCode} disabled={loading} autoFocus />

              <button type="submit" disabled={loading || code.length !== 6}
                className="mt-1 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1a5c3a] py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#134d2f] disabled:cursor-not-allowed disabled:opacity-50">
                {loading ? "Verifying..." : "Verify Code"}
              </button>

              <div className="flex items-center justify-between text-sm">
                <button type="button" onClick={() => backTo("email")} className="font-semibold text-slate-500 hover:text-slate-700">
                  ← Use a different email
                </button>
                <button type="button" onClick={handleResend} disabled={resendCooldown > 0 || loading}
                  className="font-semibold text-emerald-600 hover:text-emerald-700 disabled:cursor-not-allowed disabled:text-slate-400">
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend code"}
                </button>
              </div>
            </form>
          )}

          {/* ── STEP 3: NEW PASSWORD ── */}
          {step === "password" && (
            <form className="flex flex-col gap-4" onSubmit={handleResetPassword} noValidate>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700" htmlFor="fp-new-password">New Password</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 flex -translate-y-1/2 items-center text-slate-400">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                  </span>
                  <input
                    id="fp-new-password" type={showPassword ? "text" : "password"}
                    placeholder="Min 8 characters" value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`${inputClasses} pr-[44px]`} autoFocus
                  />
                  <button type="button" aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3.5 top-1/2 flex -translate-y-1/2 items-center text-slate-400 hover:text-slate-600"
                    onClick={() => setShowPassword((v) => !v)}>
                    {showPassword ? <EyeOff /> : <EyeOpen />}
                  </button>
                </div>
              </div>

              {newPassword && (
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="mb-2 text-xs font-semibold text-gray-500">Password Strength</p>
                  <div className="mb-1.5 flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= strength ? strengthColors[strength] : "bg-gray-200"}`} />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${strength <= 1 ? "text-red-500" : strength === 2 ? "text-yellow-600" : "text-green-700"}`}>
                    {strengthText[strength]}
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700" htmlFor="fp-confirm-password">Confirm Password</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 flex -translate-y-1/2 items-center text-slate-400">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                  </span>
                  <input
                    id="fp-confirm-password" type={showPassword ? "text" : "password"}
                    placeholder="Repeat password" value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    aria-invalid={confirmPassword.length > 0 && !passwordsMatch}
                    className={`${inputClasses} pr-[44px]`}
                  />
                </div>
                {confirmPassword.length > 0 && !passwordsMatch && (
                  <p className="text-xs font-medium text-red-500">Passwords do not match.</p>
                )}
              </div>

              <button type="submit" disabled={loading || newPassword.length < 8 || !passwordsMatch}
                className="mt-1 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1a5c3a] py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#134d2f] disabled:cursor-not-allowed disabled:opacity-50">
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )}
        </main>
      </div>

      <SuccessModal
        isOpen={showSuccessModal}
        icon="🔑"
        title="Password Reset Successful!"
        message={`You can now sign in with your new password. Redirecting to login in ${redirectIn}s...`}
        buttonText="Back to Login"
        onButtonClick={() => navigate("/login", { replace: true })}
        onClose={() => navigate("/login", { replace: true })}
      />
    </div>
  );
}

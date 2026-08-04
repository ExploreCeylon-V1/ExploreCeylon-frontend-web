// ProfilePage.jsx — Full traveler profile page
// Sections: Profile Settings, Password, Phone, My Trips, My Bookings, Cart

import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useCart } from "../hooks/useCart";
import userService from "../services/userService";
import guidesService from "../services/guidesService";
import { vehicleService } from "../services/vehicleService";
import { payGuide, payVehicle } from "../services/paymentService";
import { parseAuthError } from "../utils/authError";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SignOutModal from "../components/SignOutModal";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// ── Auth header helper ─────────────────────────────────────
function authHeader(token) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

// ── Helpers ────────────────────────────────────────────────
function calcDays(start, end) {
  if (!start || !end) return 0;
  return Math.max(
    0,
    Math.round((new Date(end) - new Date(start)) / 86400000) + 1,
  );
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ── Toast ──────────────────────────────────────────────────
function Toast({ msg, type = "success", onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only auto-dismiss timer; onClose is often a fresh inline function from the parent, so including it would reset the timer on every parent re-render
  }, []);
  return (
    <div
      className={`fixed top-5 right-5 z-[1100] flex items-center gap-3
                     bg-white border rounded-2xl shadow-xl px-5 py-4 w-80
                     animate-[slideIn_0.25s_ease]
                     ${type === "success" ? "border-green-200" : "border-red-200"}`}
    >
      <span className="text-xl">{type === "success" ? "✅" : "❌"}</span>
      <p className="text-sm text-gray-700 font-medium flex-1">{msg}</p>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
        ✕
      </button>
    </div>
  );
}

// ── Deactivate Modal ───────────────────────────────────────
function DeactivateModal({ onClose, onConfirm, hasPassword, passwordError }) {
  const [password, setPassword] = useState("");

  const canConfirm = !hasPassword || password.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 text-base">
            ⚠️ Deactivate Account
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
          <p className="text-sm font-bold text-red-800 mb-1">
            🚨 This action cannot be undone!
          </p>
          <p className="text-xs text-red-600">
            Your account, all trips, bookings, and history will be permanently
            deactivated. You cannot recover it.
          </p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 mb-4 space-y-1.5">
          {[
            "All trips deleted",
            "Active bookings cancelled",
            "Payment history removed",
            "Cannot create new account with same email",
          ].map((item) => (
            <p key={item} className="text-xs text-red-600">
              ❌ {item}
            </p>
          ))}
        </div>
        {hasPassword && (
          <div className="mb-4">
            {/* Off-screen decoys absorb the browser's saved-credential autofill so it
                doesn't land in the real field below or in an unrelated nearby input. */}
            <div style={{ position: "absolute", left: "-9999px", top: "-9999px", height: 0, overflow: "hidden" }} aria-hidden="true">
              <input type="text" name="fake-username" autoComplete="username" tabIndex="-1" readOnly />
              <input type="password" name="fake-password" autoComplete="new-password" tabIndex="-1" readOnly />
            </div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">
              Confirm with your password
            </label>
            <input
              type="password"
              name="deactivate-confirm-password"
              autoComplete="new-password"
              data-lpignore="true"
              data-1p-ignore="true"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canConfirm) onConfirm(password);
              }}
              placeholder="Your password"
              className="w-full border border-red-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-400 placeholder-red-300"
            />
            {passwordError && (
              <p className="mt-1.5 text-xs text-red-600">{passwordError}</p>
            )}
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(password)}
            disabled={!canConfirm}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold disabled:opacity-40 transition-colors"
          >
            Permanently Deactivate
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Notice Modal (centered error/info popup with a close button) ──
function NoticeModal({ title = "⚠️ Notice", msg, onClose }) {
  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 text-base">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-6">{msg}</p>
        <button
          onClick={onClose}
          className="w-full py-2.5 bg-[#2D6A4F] hover:bg-[#235C42] text-white rounded-xl text-sm font-bold transition-colors"
        >
          OK
        </button>
      </div>
    </div>
  );
}

// ── Photo Modal ────────────────────────────────────────────
function PhotoModal({ currentPhoto, onClose, onUploaded, onToast }) {
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(currentPhoto || null);
  const [busy, setBusy] = useState(false);

  function pick(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      onToast("Image must be under 5MB", "error");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function handleUpload() {
    if (!file) {
      fileRef.current?.click();
      return;
    }
    setBusy(true);
    try {
      const { profilePhoto } = await userService.uploadPhoto(file);
      onUploaded(profilePhoto);
      onToast("Profile photo updated!");
      onClose();
    } catch {
      onToast("Failed to upload photo", "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    setBusy(true);
    try {
      await userService.deletePhoto();
      onUploaded(null);
      onToast("Profile photo removed");
      onClose();
    } catch {
      onToast("Failed to remove photo", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-gray-900">Change Profile Photo</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={pick}
          className="hidden"
        />

        <button
          onClick={() => fileRef.current?.click()}
          className="w-full border-2 border-dashed border-gray-200 rounded-xl p-8 text-center
                     hover:border-[#1a5c2a] cursor-pointer transition-colors mb-4"
        >
          {preview ? (
            <img
              src={preview}
              alt="Preview"
              className="w-24 h-24 rounded-full object-cover mx-auto mb-2"
            />
          ) : (
            <p className="text-3xl mb-2">📷</p>
          )}
          <p className="text-sm text-gray-500">
            {file ? file.name : "Click to choose an image"}
          </p>
          <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP · Max 5MB</p>
        </button>

        <div className="flex gap-2">
          {currentPhoto && (
            <button
              onClick={handleRemove}
              disabled={busy}
              className="flex-1 py-2.5 border border-red-200 text-red-600 rounded-xl text-sm hover:bg-red-50 disabled:opacity-50"
            >
              Remove
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={busy}
            className="flex-1 py-2.5 bg-[#1a5c2a] text-white rounded-xl text-sm font-semibold disabled:opacity-50"
          >
            {busy ? "Saving…" : "Upload & Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Nav Item ───────────────────────────────────────────────
function NavItem({ icon, label, active, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                  font-medium transition-colors text-left
                  ${
                    active
                      ? "bg-green-50 text-[#1a5c2a] font-semibold border-l-[3px] border-[#1a5c2a] rounded-l-none"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
    >
      <span className="text-base">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge > 0 && (
        <span
          className="w-5 h-5 bg-[#1a5c2a] text-white text-[10px] font-bold
                         rounded-full flex items-center justify-center"
        >
          {badge}
        </span>
      )}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════
// SECTION: Profile Settings
// ═══════════════════════════════════════════════════════════
function SectionProfile({ user, onToast, onUpdateUser }) {
  const [form, setForm] = useState({
    name: user?.name || "",
    nationality: user?.nationality || "",
    language: user?.language || "English",
  });
  const [saving, setSaving] = useState(false);

  // Email verification flow
  const emailVerified = !!user?.emailVerified;
  const [emailStep, setEmailStep] = useState("idle"); // idle | code
  const [emailCode, setEmailCode] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await userService.updateProfile({
        name: form.name,
        nationality: form.nationality,
        language: form.language,
      });
      onUpdateUser(updated);
      onToast("Profile updated successfully!");
    } catch (e) {
      onToast(e?.response?.data?.error || "Failed to update profile", "error");
    } finally {
      setSaving(false);
    }
  }

  async function sendEmailCode() {
    setEmailBusy(true);
    try {
      const res = await userService.sendEmailVerification();
      setEmailStep("code");
      onToast(
        res.devCode
          ? `Dev code: ${res.devCode}`
          : "Verification code sent to your email",
      );
      if (res.devCode) setEmailCode(res.devCode);
    } catch (e) {
      onToast(parseAuthError(e, "Failed to send code"), "error");
    } finally {
      setEmailBusy(false);
    }
  }

  async function confirmEmailCode() {
    setEmailBusy(true);
    try {
      await userService.verifyEmail(emailCode);
      onUpdateUser({ emailVerified: true });
      setEmailStep("idle");
      setEmailCode("");
      onToast("Email verified! 🎉");
    } catch (e) {
      onToast(parseAuthError(e, "Invalid or expired code"), "error");
    } finally {
      setEmailBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Profile Settings Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              Profile Settings
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Update your personal information
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#1a5c2a] hover:bg-[#14471f] text-white text-sm
                       font-semibold rounded-xl transition-colors disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">
              Full Name
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-[#1a5c2a] focus:ring-2 focus:ring-green-100"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">
              Email Address
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={user?.email || ""}
                readOnly
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 bg-gray-50 outline-none"
              />
              {emailVerified ? (
                <span className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-green-50 border border-green-200 rounded-xl text-xs font-semibold text-green-700 whitespace-nowrap">
                  ✅ Verified
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-orange-50 border border-orange-200 rounded-xl text-xs font-semibold text-orange-700 whitespace-nowrap">
                  Not verified
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">
                Nationality
              </label>
              <input
                value={form.nationality}
                onChange={(e) =>
                  setForm((f) => ({ ...f, nationality: e.target.value }))
                }
                placeholder="e.g. Sri Lankan"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-[#1a5c2a]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">
                Preferred Language
              </label>
              <select
                value={form.language}
                onChange={(e) =>
                  setForm((f) => ({ ...f, language: e.target.value }))
                }
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-[#1a5c2a]"
              >
                {["English", "Sinhala", "Tamil", "German", "French"].map(
                  (l) => (
                    <option key={l}>{l}</option>
                  ),
                )}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Email Verification */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 mb-4">
          📧 Email Verification
        </h3>
        {emailVerified ? (
          <div className="flex items-center gap-4 bg-green-50 border border-green-200 rounded-xl p-4">
            <span className="text-2xl">✅</span>
            <div>
              <p className="text-sm font-bold text-green-800">Email Verified</p>
              <p className="text-xs text-green-600">
                {user?.email} is verified
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <p className="text-sm font-bold text-orange-800 mb-0.5">
              ⚠️ Email Not Verified
            </p>
            <p className="text-xs text-orange-600 mb-3">
              Verify {user?.email} to secure your account.
            </p>
            {emailStep === "idle" ? (
              <button
                onClick={sendEmailCode}
                disabled={emailBusy}
                className="px-4 py-2 bg-[#1a5c2a] hover:bg-[#14471f] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
              >
                {emailBusy ? "Sending…" : "Send Verification Code"}
              </button>
            ) : (
              <div className="flex gap-2">
                <input
                  value={emailCode}
                  onChange={(e) => setEmailCode(e.target.value)}
                  placeholder="6-digit code"
                  maxLength={6}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1a5c2a] tracking-widest"
                />
                <button
                  onClick={confirmEmailCode}
                  disabled={emailBusy || emailCode.length < 6}
                  className="px-4 py-2 bg-[#1a5c2a] hover:bg-[#14471f] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  {emailBusy ? "Verifying…" : "Verify"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SECTION: Password & Security
// ═══════════════════════════════════════════════════════════
function SectionPassword({ user, onToast, onUpdateUser }) {
  const hasPassword = !!user?.hasPassword;
  const [form, setForm] = useState({ current: "", newPw: "", confirm: "" });
  const [saving, setSaving] = useState(false);

  const strength =
    form.newPw.length === 0
      ? 0
      : form.newPw.length < 6
        ? 1
        : form.newPw.length < 10
          ? 2
          : /[^a-zA-Z0-9]/.test(form.newPw)
            ? 4
            : 3;

  const strengthColors = [
    "",
    "bg-red-400",
    "bg-yellow-400",
    "bg-green-500",
    "bg-green-600",
  ];
  const strengthText = [
    "",
    "Weak — too short",
    "Medium — add symbols to strengthen",
    "Strong",
    "Very Strong ✓",
  ];

  async function handleUpdate() {
    if (form.newPw !== form.confirm) {
      onToast("Passwords don't match", "error");
      return;
    }
    if (form.newPw.length < 8) {
      onToast("Minimum 8 characters", "error");
      return;
    }
    setSaving(true);
    try {
      await userService.changePassword(
        hasPassword ? form.current : undefined,
        form.newPw,
        form.confirm,
      );
      if (!hasPassword && onUpdateUser) {
        onUpdateUser({ hasPassword: true });
      }
      onToast(
        hasPassword
          ? "Password updated successfully!"
          : "Password created successfully!",
      );
      setForm({ current: "", newPw: "", confirm: "" });
    } catch (e) {
      onToast(parseAuthError(e, "Failed to update password"), "error");
    } finally {
      setSaving(false);
    }
  }

  const fields = hasPassword
    ? [
        ["Current Password", "current"],
        ["New Password", "newPw"],
        ["Confirm New Password", "confirm"],
      ]
    : [
        ["New Password", "newPw"],
        ["Confirm New Password", "confirm"],
      ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <h3 className="text-base font-bold text-gray-900 mb-5">
        🔒 Password & Security
      </h3>
      {!hasPassword && (
        <p className="text-xs text-gray-500 bg-gray-50 rounded-xl p-3 mb-5">
          You signed up with Google and don't have a password yet. Create one
          below to also be able to log in with your email and password.
        </p>
      )}
      <div className="space-y-4 mb-5">
        {fields.map(([label, key]) => (
          <div key={key}>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-500">
                {label}
              </label>
              {key === "current" && (
                <Link
                  to="/forgot-password"
                  state={{ email: user?.email }}
                  className="text-xs font-semibold text-[#2D6A4F] hover:underline"
                >
                  Forgot password?
                </Link>
              )}
            </div>
            <input
              type="password"
              value={form[key]}
              placeholder={key === "newPw" ? "Min 8 characters" : ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, [key]: e.target.value }))
              }
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1a5c2a] focus:ring-2 focus:ring-green-100"
            />
          </div>
        ))}
      </div>

      {/* Strength bar */}
      {form.newPw && (
        <div className="bg-gray-50 rounded-xl p-4 mb-5">
          <p className="text-xs font-semibold text-gray-500 mb-2">
            Password Strength
          </p>
          <div className="flex gap-1 mb-1.5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`flex-1 h-1.5 rounded-full transition-colors
                ${i <= strength ? strengthColors[strength] : "bg-gray-200"}`}
              />
            ))}
          </div>
          <p
            className={`text-xs font-medium ${strength <= 1 ? "text-red-500" : strength === 2 ? "text-yellow-600" : "text-green-700"}`}
          >
            {strengthText[strength]}
          </p>
        </div>
      )}

      <button
        onClick={handleUpdate}
        disabled={
          saving ||
          !form.newPw ||
          !form.confirm ||
          (hasPassword && !form.current)
        }
        className="w-full py-3 bg-[#1a5c2a] hover:bg-[#14471f] text-white rounded-xl
                   text-sm font-semibold transition-colors disabled:opacity-50"
      >
        {saving
          ? "Saving…"
          : hasPassword
            ? "Update Password"
            : "Create Password"}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SECTION: Phone & Verification
// ═══════════════════════════════════════════════════════════
function SectionPhone({ user, onToast, onUpdateUser }) {
  const [phone, setPhone] = useState(user?.phone || "");
  const [countryCode, setCC] = useState("+94");
  const [saving, setSaving] = useState(false);
  const [otpStep, setOtpStep] = useState("idle"); // idle | code
  const [code, setCode] = useState("");
  const [otpBusy, setOtpBusy] = useState(false);

  const verified = !!user?.phoneVerified;
  const fullNumber = () =>
    phone.startsWith("+") ? phone : countryCode + phone;

  async function saveNumber() {
    const updated = await userService.updateProfile({ phone: fullNumber() });
    onUpdateUser(updated); // phoneVerified resets to false on the backend
    return updated;
  }

  async function handleSave() {
    if (!phone.trim()) {
      onToast("Enter a phone number", "error");
      return;
    }
    setSaving(true);
    try {
      await saveNumber();
      onToast("Phone number saved!");
    } catch (e) {
      onToast(e?.response?.data?.error || "Failed to save phone", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleSendOtp() {
    if (!phone.trim()) {
      onToast("Enter a phone number first", "error");
      return;
    }
    setOtpBusy(true);
    try {
      await saveNumber(); // ensure the server has the current number
      const res = await userService.sendPhoneOtp();
      setOtpStep("code");
      onToast(
        res.devCode
          ? `Dev code: ${res.devCode}`
          : "OTP sent to " + fullNumber(),
      );
      if (res.devCode) setCode(res.devCode);
    } catch (e) {
      onToast(e?.response?.data?.error || "Failed to send OTP", "error");
    } finally {
      setOtpBusy(false);
    }
  }

  async function handleVerify() {
    setOtpBusy(true);
    try {
      await userService.verifyPhoneOtp(code);
      onUpdateUser({ phoneVerified: true });
      setOtpStep("idle");
      setCode("");
      onToast("Phone verified! 🎉");
    } catch (e) {
      onToast(e?.response?.data?.error || "Invalid or expired code", "error");
    } finally {
      setOtpBusy(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-sm">
      <h3 className="text-base font-bold text-gray-900 mb-5">
        📱 Phone & Verification
      </h3>
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <select
          value={countryCode}
          onChange={(e) => setCC(e.target.value)}
          disabled={phone.startsWith("+")}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 w-full sm:w-28 outline-none disabled:bg-gray-50"
        >
          <option value="+94">🇱🇰 +94</option>
          <option value="+44">🇬🇧 +44</option>
          <option value="+1">🇺🇸 +1</option>
          <option value="+49">🇩🇪 +49</option>
        </select>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="77 123 4567"
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1a5c2a] focus:ring-2 focus:ring-green-100"
        />
      </div>

      {verified ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
          <p className="text-sm font-bold text-green-800">✅ Phone Verified</p>
        </div>
      ) : (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4">
          <p className="text-sm font-bold text-orange-800 mb-0.5">
            ⚠️ Phone Not Verified
          </p>
          <p className="text-xs text-orange-600">
            Verify your number for booking notifications and WhatsApp contact.
          </p>
        </div>
      )}

      {otpStep === "code" && !verified && (
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={6}
            placeholder="6-digit code"
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1a5c2a] tracking-widest"
          />
          <button
            onClick={handleVerify}
            disabled={otpBusy || code.length < 6}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#1a5c2a] hover:bg-[#14471f] text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {otpBusy ? "Verifying…" : "Verify"}
          </button>
        </div>
      )}

      {!verified && (
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Number"}
          </button>
          <button
            onClick={handleSendOtp}
            disabled={otpBusy}
            className="flex-1 py-2.5 bg-[#1a5c2a] hover:bg-[#14471f] text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {otpBusy
              ? "Sending…"
              : otpStep === "code"
                ? "Resend OTP"
                : "Send OTP to Verify"}
          </button>
        </div>
      )}

      {verified && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          {saving ? "Saving…" : "Update Number"}
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SECTION: My Trips
// ═══════════════════════════════════════════════════════════
function SectionTrips({ token }) {
  const [trips, setTrips] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/trips/my`, { headers: authHeader(token) })
      .then((r) => r.json())
      .then(setTrips)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const STATUS_META = {
    DRAFT: { label: "Draft", color: "bg-gray-100 text-gray-600" },
    CONFIRMED: { label: "Confirmed", color: "bg-green-100 text-green-700" },
    COMPLETED: { label: "Completed", color: "bg-blue-100 text-blue-700" },
  };

  const counts = {
    all: trips.length,
    DRAFT: trips.filter((t) => t.status === "DRAFT").length,
    CONFIRMED: trips.filter((t) => t.status === "CONFIRMED").length,
    COMPLETED: trips.filter((t) => t.status === "COMPLETED").length,
  };

  const filtered =
    filter === "all" ? trips : trips.filter((t) => t.status === filter);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <h3 className="text-base font-bold text-gray-900">🗺️ My Trips</h3>
        <Link
          to="/trips/new"
          className="w-full sm:w-auto text-center px-4 py-2 bg-[#1a5c2a] hover:bg-[#14471f] text-white text-sm font-semibold rounded-xl transition-colors"
        >
          + New Trip
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-2 px-2 sm:mx-0 sm:px-0 sm:flex-wrap">
        {[
          ["all", `All Trips (${counts.all})`],
          ["DRAFT", `Draft (${counts.DRAFT})`],
          ["CONFIRMED", `Confirmed (${counts.CONFIRMED})`],
          ["COMPLETED", `Completed (${counts.COMPLETED})`],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors whitespace-nowrap
              ${
                filter === key
                  ? "bg-[#1a5c2a] border-[#1a5c2a] text-white"
                  : "border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-7 h-7 border-4 border-green-100 border-t-[#1a5c2a] rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">🗺️</p>
          <p className="font-semibold text-gray-600 mb-1">No trips yet</p>
          <p className="text-sm">Start planning your Sri Lanka adventure!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((trip) => {
            const meta = STATUS_META[trip.status] || STATUS_META.DRAFT;
            const days =
              trip.startDate && trip.endDate
                ? calcDays(trip.startDate, trip.endDate)
                : "—";
            return (
              <div
                key={trip.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 border border-gray-100
                           rounded-xl hover:border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-lg flex-shrink-0">
                    🗺️
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {trip.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      📅 {fmtDate(trip.startDate)} · {days} days
                      {trip.travelStyle && ` · ${trip.travelStyle}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${meta.color}`}
                  >
                    {meta.label}
                  </span>
                  <button
                    onClick={() => navigate(`/trips/${trip.id}`)}
                    className="text-xs border border-gray-200 px-3.5 py-1.5 rounded-lg text-gray-600
                               hover:border-[#1a5c2a] hover:text-[#1a5c2a] transition-colors flex-shrink-0 font-semibold"
                  >
                    View →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SECTION: My Bookings
// ═══════════════════════════════════════════════════════════
function SectionBookings({ token, user, onToast }) {
  const [guideBookings, setGB] = useState([]);
  const [vehicleBookings, setVB] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState(null);
  const [pay60Modal, setPay60Modal] = useState(null);
  const [detailsModal, setDetailsModal] = useState(null);
  const [payingFinal, setPayingFinal] = useState(false);
  const [payError, setPayError] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState(null);

  // Pay the remaining 80% balance via the real PayHere sandbox checkout.
  async function handlePayFinal(b) {
    if (payingFinal) return;
    setPayingFinal(true);
    setPayError(null);
    try {
      if (b.bType === "guide") {
        await payGuide(b.id, "FINAL", user);
      } else {
        await payVehicle(b.id, "FINAL", user);
      }
      // Page redirects to PayHere — no further action needed here.
    } catch (e) {
      setPayError(e.message || "Failed to start payment");
      setPayingFinal(false);
    }
  }

  function openReviewModal(b) {
    setReviewRating(0);
    setReviewComment("");
    setReviewError(null);
    setReviewModal(b);
  }

  // Submit a review for a fully-paid (COMPLETED) booking — wired to the same
  // guide/vehicle review endpoints that power GuideReviews/VehicleReviews.
  async function handleSubmitReview() {
    if (!reviewModal) return;
    if (!reviewRating) {
      setReviewError("Please select a star rating.");
      return;
    }

    setReviewSubmitting(true);
    setReviewError(null);
    try {
      const payload = {
        rating: reviewRating,
        comment: reviewComment.trim(),
        bookingId: reviewModal.id,
      };
      if (reviewModal.bType === "guide") {
        await guidesService.writeReview(reviewModal.guideId, payload);
      } else {
        await vehicleService.writeReview(reviewModal.vehicleId, payload);
      }
      onToast("Review submitted! Thank you 🙏");
      setReviewModal(null);
    } catch (e) {
      setReviewError(
        e.response?.data?.error ||
          e.response?.data?.message ||
          "Could not submit your review. Please try again.",
      );
    } finally {
      setReviewSubmitting(false);
    }
  }

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/v1/guide-bookings/my`, {
        headers: authHeader(token),
      })
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []),
      fetch(`${API_BASE}/api/v1/vehicle-bookings/my`, {
        headers: authHeader(token),
      })
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []),
    ])
      .then(([gb, vb]) => {
        setGB(gb);
        setVB(vb);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const BK_META = {
    PENDING_PAYMENT: {
      label: "Awaiting Payment",
      color: "bg-yellow-100 text-yellow-700",
    },
    CONFIRMED: { label: "Confirmed", color: "bg-blue-100 text-blue-700" },
    COMPLETED: { label: "Completed", color: "bg-emerald-100 text-emerald-700" },
    CANCELLED: { label: "Cancelled", color: "bg-red-100 text-red-600" },
  };

  const allBookings = [
    ...guideBookings.map((b) => ({ ...b, bType: "guide" })),
    ...vehicleBookings.map((b) => ({ ...b, bType: "vehicle" })),
  ].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  const filtered =
    filter === "all"
      ? allBookings
      : allBookings.filter((b) => b.bType === filter);

  function BookingCard({ b }) {
    const meta = BK_META[b.status] || BK_META.PENDING_PAYMENT;
    const total = b.totalCost || 0;
    const paid =
      b.status === "CONFIRMED"
        ? (b.advanceAmount ?? total * 0.2)
        : b.status === "COMPLETED"
          ? total
          : 0;
    const rem = total - paid;
    const isGuide = b.bType === "guide";
    const name = isGuide
      ? b.guideName || b.guide?.fullName || "Guide"
      : b.vehicleName || b.vehicle?.name || "Vehicle";
    const sub = isGuide
      ? `${b.notes || "Guide Service"} · ${calcDays(b.startDate, b.endDate)} days`
      : `${b.pickupLocation || ""} → ${b.dropoffLocation || ""} · ${calcDays(b.pickupDate, b.dropoffDate)} days`;
    const dateStr = isGuide
      ? `${fmtDate(b.startDate)}${b.endDate ? " – " + fmtDate(b.endDate) : ""}`
      : fmtDate(b.pickupDate);

    return (
      <div className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-colors">
        <div className="flex flex-col sm:flex-row items-start gap-3">
          <div className="flex items-start gap-3 w-full sm:w-auto flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-lg flex-shrink-0">
              {isGuide ? "👤" : "🚗"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-2">
                <div>
                  <p className="text-sm font-bold text-gray-900">{name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                  <p className="text-xs text-gray-400">📅 {dateStr}</p>
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full self-start sm:self-auto flex-shrink-0 whitespace-nowrap mt-1 sm:mt-0 ${meta.color}`}
                >
                  {meta.label}
                </span>
              </div>
            </div>
          </div>

          <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between mt-3 pt-3 border-t border-gray-100 gap-3">
            <p className="text-xs text-gray-500">
              Total:{" "}
              <strong className="text-gray-800">${total.toFixed(2)}</strong>
              {paid > 0 && (
                <>
                  {" "}
                  · Paid:{" "}
                  <span className="text-green-700 font-semibold">
                    ${paid.toFixed(2)}
                  </span>
                </>
              )}
              {rem > 0 && b.status !== "CANCELLED" && (
                <>
                  {" "}
                  · Remaining:{" "}
                  <span className="text-orange-600 font-semibold">
                    ${rem.toFixed(2)}
                  </span>
                </>
              )}
            </p>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <button
                onClick={() => setDetailsModal(b)}
                className="flex-1 sm:flex-none text-center text-xs border border-gray-200 px-3 py-1.5 rounded-lg text-gray-600 hover:border-[#1a5c2a] hover:text-[#1a5c2a] transition-colors"
              >
                View Details
              </button>
              {b.status === "CONFIRMED" && (
                <button
                  onClick={() => setPay60Modal(b)}
                  className="flex-1 sm:flex-none text-center text-xs bg-[#1a5c2a] text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-[#14471f] transition-colors"
                >
                  Pay 80%
                </button>
              )}
              {b.status === "COMPLETED" && (
                <button
                  onClick={() => openReviewModal(b)}
                  className="flex-1 sm:flex-none text-center text-xs border border-gray-200 px-3 py-1.5 rounded-lg text-gray-600 hover:border-[#1a5c2a] hover:text-[#1a5c2a] transition-colors"
                >
                  Review
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-sm">
        <h3 className="text-base font-bold text-gray-900 mb-4">
          📋 My Bookings
        </h3>

        <div className="flex gap-2 mb-5 border-b border-gray-100 pb-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-2 px-2 sm:mx-0 sm:px-0 sm:flex-wrap">
          {[
            ["all", "All"],
            ["guide", "👤 Guides"],
            ["vehicle", "🚗 Vehicles"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap
                ${
                  filter === key
                    ? "bg-[#1a5c2a] text-white"
                    : "border border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-7 h-7 border-4 border-green-100 border-t-[#1a5c2a] rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-3">📋</p>
            <p className="font-semibold text-gray-600 mb-1">No bookings yet</p>
            <p className="text-sm">Book a guide or vehicle to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((b, i) => (
              <BookingCard key={i} b={b} />
            ))}
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      {detailsModal &&
        (() => {
          const b = detailsModal;
          const isGuide = b.bType === "guide";
          const meta = BK_META[b.status] || BK_META.PENDING_PAYMENT;
          const total = b.totalCost || 0;
          const paid =
            b.status === "CONFIRMED"
              ? (b.advanceAmount ?? total * 0.2)
              : b.status === "COMPLETED"
                ? total
                : 0;
          const rem = total - paid;
          const name = isGuide
            ? b.guideName || "Guide"
            : b.vehicleName || "Vehicle";

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-lg flex-shrink-0">
                      {isGuide ? "👤" : "🚗"}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{name}</h3>
                      <p className="text-xs text-gray-400">Booking #{b.id}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setDetailsModal(null)}
                    className="text-gray-400 hover:text-gray-600 text-xl"
                  >
                    ✕
                  </button>
                </div>

                <span
                  className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-4 ${meta.color}`}
                >
                  {meta.label}
                </span>

                <div className="space-y-3 mb-4">
                  {isGuide ? (
                    <>
                      <DetailRow
                        label="Service Dates"
                        value={`${fmtDate(b.startDate)} – ${fmtDate(b.endDate)}`}
                      />
                      <DetailRow
                        label="Duration"
                        value={`${calcDays(b.startDate, b.endDate)} day(s)`}
                      />
                      {b.guideDistrict && (
                        <DetailRow label="District" value={b.guideDistrict} />
                      )}
                    </>
                  ) : (
                    <>
                      <DetailRow
                        label="Pickup"
                        value={`${fmtDate(b.pickupDate)}${b.pickupTime ? " · " + b.pickupTime : ""}`}
                      />
                      <DetailRow
                        label="Dropoff"
                        value={`${fmtDate(b.dropoffDate)}${b.dropoffTime ? " · " + b.dropoffTime : ""}`}
                      />
                      <DetailRow
                        label="Duration"
                        value={`${calcDays(b.pickupDate, b.dropoffDate)} day(s)`}
                      />
                      <DetailRow
                        label="Pickup Location"
                        value={b.pickupLocation || "—"}
                      />
                      <DetailRow
                        label="Dropoff Location"
                        value={b.dropoffLocation || "—"}
                      />
                      {b.vehicleType && (
                        <DetailRow label="Vehicle Type" value={b.vehicleType} />
                      )}
                      {b.driverName && (
                        <DetailRow label="Driver" value={b.driverName} />
                      )}
                    </>
                  )}
                  {b.notes && <DetailRow label="Notes" value={b.notes} />}
                  <DetailRow label="Booked On" value={fmtDate(b.createdAt)} />
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                    Payment
                  </p>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Cost</span>
                      <span className="font-semibold text-gray-800">
                        ${total.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Paid</span>
                      <span className="font-semibold text-green-700">
                        ${paid.toFixed(2)}
                      </span>
                    </div>
                    {b.status !== "CANCELLED" && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Remaining</span>
                        <span className="font-semibold text-orange-600">
                          ${rem.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {b.status === "CONFIRMED" && (
                  <button
                    onClick={() => {
                      setDetailsModal(null);
                      setPay60Modal(b);
                    }}
                    className="w-full mt-4 py-3 bg-[#1a5c2a] text-white rounded-xl text-sm font-bold hover:bg-[#14471f] transition-colors"
                  >
                    Pay Remaining 80%
                  </button>
                )}
                {b.status === "COMPLETED" && (
                  <button
                    onClick={() => {
                      setDetailsModal(null);
                      openReviewModal(b);
                    }}
                    className="w-full mt-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:border-[#1a5c2a] hover:text-[#1a5c2a] transition-colors"
                  >
                    Leave a Review
                  </button>
                )}
              </div>
            </div>
          );
        })()}

      {/* Pay 80% Balance — redirects to the real PayHere sandbox checkout */}
      {pay60Modal && (
        <PayFinalModal
          booking={pay60Modal}
          paying={payingFinal}
          error={payError}
          onPay={() => handlePayFinal(pay60Modal)}
          onClose={() => {
            setPay60Modal(null);
            setPayError(null);
          }}
        />
      )}

      {/* Review Modal — wired to the guide/vehicle review endpoints */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between mb-4">
              <h3 className="font-bold text-gray-900">⭐ Leave a Review</h3>
              <button
                onClick={() => setReviewModal(null)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 mb-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center text-lg">
                {reviewModal.bType === "guide" ? "👤" : "🚗"}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">
                  {reviewModal.guideName || reviewModal.vehicleName}
                </p>
                <p className="text-xs text-gray-400">
                  {fmtDate(reviewModal.startDate || reviewModal.pickupDate)}
                </p>
              </div>
            </div>
            <StarRating value={reviewRating} onChange={setReviewRating} />
            <textarea
              rows={4}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Share your experience…"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#1a5c2a] resize-none mt-4 mb-4"
            />
            {reviewError && (
              <p className="text-sm text-red-600 mb-3">{reviewError}</p>
            )}
            <button
              onClick={handleSubmitReview}
              disabled={reviewSubmitting}
              className="w-full py-3 bg-[#1a5c2a] text-white rounded-xl text-sm font-bold hover:bg-[#14471f] disabled:opacity-60 transition-colors"
            >
              {reviewSubmitting ? "Submitting…" : "Submit Review"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function PayFinalModal({ booking, paying, error, onPay, onClose }) {
  const amount = booking.balanceAmount ?? (booking.totalCost || 0) * 0.8;

  // Auto-redirect to PayHere as soon as the modal opens.
  useEffect(() => {
    onPay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex justify-between mb-4">
          <h3 className="font-bold text-gray-900">💳 Pay Remaining Balance</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 flex justify-between">
          <div>
            <p className="text-sm font-semibold text-green-800">
              {booking.vehicleName || booking.guideName}
            </p>
            <p className="text-xs text-green-600">Remaining 80% balance</p>
          </div>
          <p className="text-lg font-bold text-[#1a5c2a]">
            ${amount.toFixed(2)}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
            ⚠️ {error}
          </div>
        )}

        <div className="border-2 border-[#1a5c2a] rounded-2xl p-8 flex flex-col items-center gap-3 text-center">
          <span className="w-8 h-8 border-2 border-gray-200 border-t-[#1a5c2a] rounded-full animate-spin" />
          <p className="font-semibold text-gray-800">Redirecting to PayHere…</p>
          <p className="text-xs text-gray-400">
            You'll be taken to the secure PayHere checkout to complete your $
            {amount.toFixed(2)} balance payment.
          </p>
          {!paying && (
            <button
              onClick={onPay}
              className="mt-2 px-5 py-2 bg-[#1a5c2a] hover:bg-[#14471f] text-white rounded-xl text-sm font-semibold transition-colors"
            >
              Continue to Payment →
            </button>
          )}
        </div>
        <p className="text-center text-xs text-gray-400 mt-3">
          Powered by PayHere · 256-bit SSL
        </p>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-gray-400">{label}</span>
      <span className="text-gray-800 font-medium text-right">{value}</span>
    </div>
  );
}

function StarRating({ value = 0, onChange }) {
  const [hover, setHover] = useState(0);
  const labels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];
  return (
    <div className="text-center">
      <div className="flex justify-center gap-2 mb-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange?.(s)}
            onMouseEnter={() => setHover(s)}
            onMouseLeave={() => setHover(0)}
            className={`text-3xl transition-colors ${s <= (hover || value) ? "text-yellow-400" : "text-gray-200"}`}
          >
            ★
          </button>
        ))}
      </div>
      {(hover || value) > 0 && (
        <p className="text-xs text-gray-500 font-medium">
          {labels[hover || value]}
        </p>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SECTION: Cart
// ═══════════════════════════════════════════════════════════
function SectionCart({ onToast }) {
  const { cartItems, removeFromCart, updateDates } = useCart();
  const navigate = useNavigate();

  if (cartItems.length === 0)
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-base font-bold text-gray-900 mb-6">🛒 Cart</h3>
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">🛒</p>
          <p className="font-semibold text-gray-700 mb-1">Your cart is empty</p>
          <p className="text-sm mb-5">Browse vehicles or guides to add items</p>
          <div className="flex gap-3 justify-center">
            <Link
              to="/vehicles"
              className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:border-[#1a5c2a] hover:text-[#1a5c2a] transition-colors"
            >
              Browse Vehicles
            </Link>
            <Link
              to="/guides"
              className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:border-[#1a5c2a] hover:text-[#1a5c2a] transition-colors"
            >
              Browse Guides
            </Link>
          </div>
        </div>
      </div>
    );

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-5">
        <h3 className="text-base font-bold text-gray-900">🛒 Cart</h3>
        <span className="text-xs text-gray-400">
          {cartItems.length} items pending booking
        </span>
      </div>

      <div className="space-y-4">
        {cartItems.map((item) => {
          const days = calcDays(item.startDate, item.endDate);
          const total = days * (item.price || 0);
          const adv = (total * 0.2).toFixed(2);
          const isGuide = item.type === "guide";

          return (
            <div
              key={item.cartId}
              className="border border-gray-200 rounded-2xl p-5"
            >
              <div className="flex items-start gap-4 mb-4">
                {/* Avatar */}
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-green-50 flex items-center justify-center text-2xl flex-shrink-0">
                    {isGuide ? "👤" : "🚗"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {item.name}
                      </p>
                      {item.meta?.district && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          📍 {item.meta.district}
                          {item.meta.type ? ` · ${item.meta.type}` : ""}
                          {item.meta.seats ? ` · ${item.meta.seats} seats` : ""}
                        </p>
                      )}
                      {item.meta?.driverName && (
                        <p className="text-xs text-gray-500">
                          👤 {item.meta.driverName}
                        </p>
                      )}
                      {item.meta?.specialties && (
                        <p className="text-xs text-gray-400">
                          🏛️ {item.meta.specialties}
                        </p>
                      )}
                      {item.meta?.languages && (
                        <p className="text-xs text-gray-400">
                          🌐 {item.meta.languages}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => removeFromCart(item.cartId)}
                      className="text-gray-300 hover:text-red-400 transition-colors text-xl flex-shrink-0 ml-2"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              </div>

              {/* Date inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-[10px] font-semibold text-gray-400 mb-1 block">
                    {isGuide ? "Start Date" : "Pickup Date"}
                  </label>
                  <input
                    type="date"
                    value={item.startDate}
                    onChange={(e) =>
                      updateDates(item.cartId, e.target.value, item.endDate)
                    }
                    className="w-full min-w-0 max-w-full border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 outline-none focus:border-[#1a5c2a]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-400 mb-1 block">
                    {isGuide ? "End Date" : "Return Date"}
                  </label>
                  <input
                    type="date"
                    value={item.endDate}
                    onChange={(e) =>
                      updateDates(item.cartId, item.startDate, e.target.value)
                    }
                    className="w-full min-w-0 max-w-full border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 outline-none focus:border-[#1a5c2a]"
                  />
                </div>
              </div>

              {/* Cost row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 mb-4">
                <p className="text-sm font-bold text-[#1a5c2a]">
                  {days > 0
                    ? `${days} day${days > 1 ? "s" : ""} · $${total.toFixed(2)}`
                    : "Select dates"}
                </p>
                {days > 0 && (
                  <p className="text-xs text-gray-400">
                    20% advance:{" "}
                    <strong className="text-gray-600">${adv}</strong>
                  </p>
                )}
              </div>

              {/* Book Now button → BookingFlow */}
              <button
                onClick={() => {
                  if (!item.startDate || !item.endDate) {
                    onToast("Please select dates first", "error");
                    return;
                  }
                  navigate(`/booking/${item.type}/${item.id}`, {
                    state: {
                      item,
                      startDate: item.startDate,
                      endDate: item.endDate,
                    },
                  });
                }}
                className="w-full py-2.5 bg-[#1a5c2a] hover:bg-[#14471f] text-white
                           rounded-xl text-sm font-semibold transition-colors"
              >
                Book Now →
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════
const TAB_KEYS = ["profile", "security", "phone", "trips", "bookings", "cart"];

export default function ProfilePage() {
  const { user, token, logout, updateUser } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setTab] = useState(() => {
    const tab = new URLSearchParams(location.search).get("tab");
    return TAB_KEYS.includes(tab) ? tab : "profile";
  });
  const [toast, setToast] = useState(null);
  const [showDeact, setDeact] = useState(false);
  const [deactPasswordError, setDeactPasswordError] = useState(null);
  const [showSignOut, setShowSignOut] = useState(false);
  const [noticeMsg, setNoticeMsg] = useState(null);
  const [showPhoto, setPhoto] = useState(false);
  const [stats, setStats] = useState({ trips: null, bookings: null });

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  function showToast(msg, type = "success") {
    setToast({ msg, type });
  }

  // Redirect unauthenticated users (in an effect, not during render)
  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  // Keep the active tab in sync with ?tab=… (e.g. navbar cart icon while already on /profile)
  useEffect(() => {
    const tab = new URLSearchParams(location.search).get("tab");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing state to the URL, not derivable at render time
    if (TAB_KEYS.includes(tab)) setTab(tab);
  }, [location.search]);

  // Hydrate the full profile (nationality/language/verified flags aren't in the
  // login payload) and load real sidebar stat counts.
  useEffect(() => {
    if (!token) return;
    userService
      .getMe()
      .then((me) => updateUser(me))
      .catch(() => {});

    Promise.all([
      fetch(`${API_BASE}/api/v1/trips/my`, { headers: authHeader(token) })
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []),
      fetch(`${API_BASE}/api/v1/guide-bookings/my`, {
        headers: authHeader(token),
      })
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []),
      fetch(`${API_BASE}/api/v1/vehicle-bookings/my`, {
        headers: authHeader(token),
      })
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []),
    ]).then(([trips, gb, vb]) => {
      setStats({
        trips: (trips || []).length,
        bookings: (gb || []).length + (vb || []).length,
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- updateUser (from AuthContext) is a new function identity on every AuthProvider render and builds a new user object each call; including it would re-trigger this fetch repeatedly instead of only on token change
  }, [token]);

  if (!user) return null;

  const NAV = [
    {
      key: "profile",
      icon: "👤",
      label: "Profile Settings",
      section: "ACCOUNT",
    },
    {
      key: "security",
      icon: "🔒",
      label: "Password & Security",
      section: "ACCOUNT",
    },
    {
      key: "phone",
      icon: "📱",
      label: "Phone & Verification",
      section: "ACCOUNT",
    },
    { key: "trips", icon: "🗺️", label: "My Trips", section: "ACTIVITY" },
    { key: "bookings", icon: "📋", label: "My Bookings", section: "ACTIVITY" },
    {
      key: "cart",
      icon: "🛒",
      label: "Cart",
      section: "ACTIVITY",
      badge: cartCount,
    },
  ];

  const sections = [...new Set(NAV.map((n) => n.section))];

  const CONTENT = {
    profile: (
      <SectionProfile
        user={user}
        onToast={showToast}
        onUpdateUser={updateUser}
      />
    ),
    security: (
      <SectionPassword
        user={user}
        onToast={showToast}
        onUpdateUser={updateUser}
      />
    ),
    phone: (
      <SectionPhone user={user} onToast={showToast} onUpdateUser={updateUser} />
    ),
    trips: <SectionTrips token={token} />,
    bookings: <SectionBookings token={token} user={user} onToast={showToast} />,
    cart: <SectionCart onToast={showToast} />,
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-100 pb-16">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6 md:py-8 flex flex-col lg:flex-row gap-6 items-start">

          {/* ── MOBILE HEADER & SCROLLABLE TAB NAVIGATION (lg:hidden) ── */}
          <div className="w-full lg:hidden space-y-3">
            {/* Mobile Profile Card Summary */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative flex-shrink-0">
                  {user.profilePhoto ? (
                    <img
                      src={user.profilePhoto}
                      alt={user.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-[#1a5c2a] shadow-sm"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#6b46c1] flex items-center justify-center text-white text-lg font-bold border-2 border-white shadow-sm">
                      {initial}
                    </div>
                  )}
                  <button
                    onClick={() => setPhoto(true)}
                    className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#1a5c2a] text-white rounded-full flex items-center justify-center text-[10px] shadow"
                  >
                    📷
                  </button>
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-gray-900 truncate">
                    {user.name}
                  </h2>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[9px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">
                      {user.role || "TRAVELER"}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowSignOut(true)}
                className="p-2 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 text-xs font-semibold flex items-center gap-1 flex-shrink-0"
                title="Sign Out"
              >
                <span>🚪</span>
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>

            {/* Mobile Scrollable Horizontal Tab Selector */}
            <div className="sticky top-16 z-20 bg-gray-100/95 backdrop-blur-md py-2 border-b border-gray-200/80 -mx-4 px-4">
              <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {NAV.map((n) => {
                  const isActive = activeTab === n.key;
                  return (
                    <button
                      key={n.key}
                      onClick={() => setTab(n.key)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shadow-sm ${
                        isActive
                          ? "bg-[#1a5c2a] text-white"
                          : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <span>{n.icon}</span>
                      <span>{n.label}</span>
                      {n.badge > 0 && (
                        <span
                          className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                            isActive
                              ? "bg-white text-[#1a5c2a]"
                              : "bg-[#1a5c2a] text-white"
                          }`}
                        >
                          {n.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── DESKTOP LEFT SIDEBAR (hidden on mobile, visible on lg+) ── */}
          <div className="hidden lg:block w-72 flex-shrink-0 sticky top-24 space-y-4">
            {/* Profile card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="h-20 bg-[#1a5c2a] relative">
                <button
                  onClick={() => setPhoto(true)}
                  className="absolute top-2 right-2 w-7 h-7 bg-white/20 hover:bg-white/30
                             rounded-lg flex items-center justify-center text-white text-sm transition-colors"
                >
                  ✏️
                </button>
              </div>
              <div className="px-5 pb-5">
                <div className="relative -mt-8 mb-3 w-fit">
                  {user.profilePhoto ? (
                    <img
                      src={user.profilePhoto}
                      alt={user.name}
                      className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-sm"
                    />
                  ) : (
                    <div
                      className="w-16 h-16 rounded-full bg-[#6b46c1] flex items-center
                                    justify-center text-white text-2xl font-bold border-4 border-white shadow-sm"
                    >
                      {initial}
                    </div>
                  )}
                  <button
                    onClick={() => setPhoto(true)}
                    className="absolute bottom-0 right-0 w-6 h-6 bg-[#1a5c2a] text-white
                               rounded-full flex items-center justify-center text-xs shadow
                               hover:bg-[#14471f] transition-colors"
                  >
                    📷
                  </button>
                </div>
                <h2 className="text-base font-bold text-gray-900">
                  {user.name}
                </h2>
                <p className="text-xs text-gray-500">{user.email}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2.5 py-0.5 rounded-full">
                    {user.role || "TRAVELER"}
                  </span>
                  <span className="text-xs text-gray-400">📍 Sri Lanka</span>
                </div>
                {/* Stats (real counts) */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-100">
                  {[
                    [stats.trips, "Trips"],
                    [stats.bookings, "Bookings"],
                    [cartCount, "Cart"],
                  ].map(([n, l]) => (
                    <div key={l} className="text-center">
                      <p className="text-base font-bold text-gray-900">
                        {n == null ? "—" : n}
                      </p>
                      <p className="text-[10px] text-gray-400">{l}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Nav menu */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-2">
              {sections.map((section) => (
                <div key={section}>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-3 py-2">
                    {section}
                  </p>
                  {NAV.filter((n) => n.section === section).map((n) => (
                    <NavItem
                      key={n.key}
                      icon={n.icon}
                      label={n.label}
                      tabKey={n.key}
                      active={activeTab === n.key}
                      badge={n.badge || 0}
                      onClick={() => setTab(n.key)}
                    />
                  ))}
                </div>
              ))}

              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-3 py-2 mt-1">
                DANGER ZONE
              </p>
              <button
                onClick={() => setShowSignOut(true)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                           text-red-600 hover:bg-red-50 transition-colors font-medium"
              >
                <span>🚪</span> Sign Out
              </button>
              <button
                onClick={() => setDeact(true)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                           text-red-500 hover:bg-red-50 transition-colors"
              >
                <span>⚠️</span> Deactivate Account
              </button>
            </div>
          </div>

          {/* ── MAIN CONTENT ── */}
          <div className="w-full flex-1 min-w-0 animate-[fadeIn_0.2s_ease]">
            {CONTENT[activeTab]}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showSignOut && (
        <SignOutModal
          onClose={() => setShowSignOut(false)}
          onConfirm={() => {
            setShowSignOut(false);
            logout("/");
          }}
        />
      )}
      {showDeact && (
        <DeactivateModal
          hasPassword={!!user?.hasPassword}
          passwordError={deactPasswordError}
          onClose={() => { setDeact(false); setDeactPasswordError(null); }}
          onConfirm={async (password) => {
            setDeactPasswordError(null);
            try {
              await userService.deactivate(password);
            } catch (e) {
              const message = parseAuthError(e, "Failed to deactivate account");
              if (e?.response?.data?.error === "Incorrect password") {
                // Keep the modal open so they can just retype the password.
                setDeactPasswordError(message);
                return;
              }
              setDeact(false);
              setNoticeMsg(message);
              return;
            }
            setDeact(false);
            logout("/");
          }}
        />
      )}
      {noticeMsg && (
        <NoticeModal
          title="⚠️ Can't Deactivate"
          msg={noticeMsg}
          onClose={() => setNoticeMsg(null)}
        />
      )}
      {showPhoto && (
        <PhotoModal
          currentPhoto={user.profilePhoto}
          onClose={() => setPhoto(false)}
          onUploaded={(photo) => updateUser({ profilePhoto: photo || "" })}
          onToast={showToast}
        />
      )}
      {toast && (
        <Toast
          msg={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <Footer />

      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
      `}</style>
    </>
  );
}

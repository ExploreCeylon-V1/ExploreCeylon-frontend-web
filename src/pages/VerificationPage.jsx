import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  Globe,
  RefreshCw,
  Compass,
  Car,
  ChevronRight,
  Info,
} from "lucide-react";
import verificationService from "../services/verificationService";
import { useAuth } from "../hooks/useAuth";

const COUNTRIES = [
  "Sri Lankan",
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
  "Senegal","Serbia","Singapore","Slovakia","Slovenia","South Africa","South Korea","Spain","Sudan",
  "Sweden","Switzerland","Syria","Taiwan","Tajikistan","Tanzania","Thailand","Tunisia","Turkey","Uganda",
  "Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan","Venezuela","Vietnam",
  "Yemen","Zambia","Zimbabwe",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_EXTS = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];

function isSriLankanNationality(nat) {
  if (!nat) return false;
  const n = nat.trim().toLowerCase();
  return n === "sri lankan" || n === "sri lanka";
}

function formatDate(isoStr) {
  if (!isoStr) return "—";
  return new Date(isoStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function FileDropzone({ label, file, preview, error, onSelect, onRemove, hint }) {
  const inputRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      onSelect(selected);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold text-slate-700 tracking-wide uppercase">
        {label} <span className="text-red-500">*</span>
      </label>

      {file ? (
        <div className="relative border-2 border-emerald-200 bg-emerald-50/40 rounded-2xl p-4 flex items-center justify-between transition-all">
          <div className="flex items-center gap-3 min-w-0">
            {preview ? (
              <img
                src={preview}
                alt={label}
                className="w-14 h-14 rounded-xl object-cover border border-emerald-200 flex-shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 flex-shrink-0">
                <FileText size={24} />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">{file.name}</p>
              <p className="text-[11px] text-slate-400">
                {(file.size / 1024 / 1024).toFixed(2)} MB · {file.type.split("/")[1]?.toUpperCase() || "FILE"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg transition-colors flex-shrink-0"
            title="Remove document"
          >
            <X size={18} />
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
            error
              ? "border-red-300 bg-red-50/30 hover:bg-red-50/50"
              : "border-slate-300 bg-slate-50/50 hover:border-emerald-500 hover:bg-emerald-50/20"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.pdf"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
              <UploadCloud size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-700">
                Click to upload or drag and drop
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {hint || "JPG, PNG, WEBP, or PDF (max 5MB)"}
              </p>
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-600 mt-0.5">{error}</p>}
    </div>
  );
}

export default function VerificationPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [loadingStatus, setLoadingStatus] = useState(true);
  const [statusData, setStatusData] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Form State
  const initialNat = user?.nationality || "Sri Lankan";
  const [nationality, setNationality] = useState(initialNat);
  const isSriLankan = isSriLankanNationality(nationality);
  const [docType, setDocType] = useState("NIC"); // 'NIC' | 'DRIVING_LICENSE' | 'PASSPORT'

  const [frontFile, setFrontFile] = useState(null);
  const [frontPreview, setFrontPreview] = useState(null);
  const [backFile, setBackFile] = useState(null);
  const [backPreview, setBackPreview] = useState(null);

  const [validationErrors, setValidationErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Synchronize document type when nationality changes
  useEffect(() => {
    if (isSriLankan) {
      if (docType === "PASSPORT") {
        setDocType("NIC");
      }
    } else {
      setDocType("PASSPORT");
      setBackFile(null);
      setBackPreview(null);
    }
  }, [nationality, isSriLankan, docType]);

  const loadStatus = async () => {
    try {
      setLoadingStatus(true);
      setErrorMessage(null);
      const data = await verificationService.getStatus();
      setStatusData(data);
      if (data.nationality) {
        setNationality(data.nationality);
      }
    } catch (err) {
      console.error("Failed to load verification status:", err);
      setErrorMessage(err?.response?.data?.message || "Failed to load verification status.");
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleFrontSelect = (file) => {
    if (file.size > MAX_FILE_SIZE) {
      setValidationErrors((prev) => ({ ...prev, front: "File size must be under 5MB" }));
      return;
    }
    if (!ALLOWED_EXTS.includes(file.type)) {
      setValidationErrors((prev) => ({ ...prev, front: "Unsupported format. Use JPG, PNG, WEBP, or PDF." }));
      return;
    }
    setValidationErrors((prev) => ({ ...prev, front: null }));
    setFrontFile(file);
    if (file.type.startsWith("image/")) {
      setFrontPreview(URL.createObjectURL(file));
    } else {
      setFrontPreview(null);
    }
  };

  const handleBackSelect = (file) => {
    if (file.size > MAX_FILE_SIZE) {
      setValidationErrors((prev) => ({ ...prev, back: "File size must be under 5MB" }));
      return;
    }
    if (!ALLOWED_EXTS.includes(file.type)) {
      setValidationErrors((prev) => ({ ...prev, back: "Unsupported format. Use JPG, PNG, WEBP, or PDF." }));
      return;
    }
    setValidationErrors((prev) => ({ ...prev, back: null }));
    setBackFile(file);
    if (file.type.startsWith("image/")) {
      setBackPreview(URL.createObjectURL(file));
    } else {
      setBackPreview(null);
    }
  };

  const handleRemoveFront = () => {
    setFrontFile(null);
    setFrontPreview(null);
  };

  const handleRemoveBack = () => {
    setBackFile(null);
    setBackPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    const errors = {};

    if (!nationality.trim()) {
      errors.nationality = "Nationality is required";
    }

    if (!frontFile) {
      errors.front = isSriLankan ? "Front side photo is required" : "Passport photo page is required";
    }

    if (isSriLankan && !backFile) {
      errors.back = "Back side photo is required for NIC and Driving License";
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      setSubmitting(true);
      const res = await verificationService.submitVerification({
        nationality,
        documentType: docType,
        frontImage: frontFile,
        backImage: isSriLankan ? backFile : null,
      });

      setStatusData(res);
      handleRemoveFront();
      handleRemoveBack();
    } catch (err) {
      console.error("Verification submit error:", err);
      const msg = err?.response?.data?.error || err?.response?.data?.message || err?.message || "Failed to submit verification";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingStatus) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="animate-spin text-emerald-600 h-8 w-8" />
          <p className="text-sm font-medium text-slate-600">Checking verification status...</p>
        </div>
      </div>
    );
  }

  const currentStatus = statusData?.status || "NOT_SUBMITTED";

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20 pt-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">

        {/* Header Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-6">
          <Link to="/" className="hover:text-slate-600 transition-colors">Home</Link>
          <ChevronRight size={14} />
          <Link to="/profile" className="hover:text-slate-600 transition-colors">Profile</Link>
          <ChevronRight size={14} />
          <span className="text-slate-700">Identity Verification</span>
        </div>

        {/* Page Title Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 mb-3 border border-emerald-100">
                <ShieldCheck size={14} /> KYC Verification
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Government Identity Verification
              </h1>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed max-w-xl">
                To safeguard travelers and certified service providers, ExploreCeylon requires one-time identity verification before booking vehicles and tour guides.
              </p>
            </div>
          </div>
        </div>

        {/* State 1: APPROVED (Terminal) */}
        {currentStatus === "APPROVED" && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-200/80 shadow-xs">
            <div className="flex flex-col items-center text-center py-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-4 ring-8 ring-emerald-50">
                <CheckCircle2 size={36} />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                Identity Verified & Approved
              </h2>
              <p className="text-sm text-slate-500 mt-2 max-w-md">
                Your government ID has been reviewed and verified. Your account has full booking privileges unlocked.
              </p>

              <div className="w-full max-w-md bg-slate-50 border border-slate-200/80 rounded-2xl p-4 mt-6 text-left grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 font-medium block">Verified Nationality</span>
                  <span className="font-bold text-slate-800 mt-0.5 block">{statusData?.nationality || "Sri Lankan"}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Document Type</span>
                  <span className="font-bold text-slate-800 mt-0.5 block">{statusData?.documentType?.replace("_", " ") || "NIC"}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Verified On</span>
                  <span className="font-bold text-slate-800 mt-0.5 block">{formatDate(statusData?.reviewedAt || statusData?.submittedAt)}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Account Status</span>
                  <span className="font-bold text-emerald-600 mt-0.5 flex items-center gap-1">
                    <CheckCircle2 size={12} /> Active & Verified
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 justify-center mt-8">
                <button
                  onClick={() => navigate("/vehicles")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-[#1a5c2a] text-white hover:bg-[#14471f] shadow-xs transition-colors"
                >
                  <Car size={16} /> Browse Vehicles
                </button>
                <button
                  onClick={() => navigate("/guides")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Compass size={16} /> Explore Tour Guides
                </button>
              </div>
            </div>
          </div>
        )}

        {/* State 2: PENDING */}
        {currentStatus === "PENDING" && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-200/80 shadow-xs">
            <div className="flex flex-col items-center text-center py-6">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mb-4 ring-8 ring-amber-50">
                <Clock size={36} />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                Your ID is Under Review
              </h2>
              <p className="text-sm text-slate-500 mt-2 max-w-md">
                We have received your verification submission. Our administrative team is currently reviewing your document.
              </p>

              <div className="w-full max-w-md bg-amber-50/60 border border-amber-200 rounded-2xl p-4 mt-6 text-left grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-amber-700/70 font-medium block">Submitted Nationality</span>
                  <span className="font-bold text-slate-800 mt-0.5 block">{statusData?.nationality || nationality}</span>
                </div>
                <div>
                  <span className="text-amber-700/70 font-medium block">Document Type</span>
                  <span className="font-bold text-slate-800 mt-0.5 block">{statusData?.documentType?.replace("_", " ") || docType}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-amber-700/70 font-medium block">Submitted At</span>
                  <span className="font-bold text-slate-800 mt-0.5 block">{formatDate(statusData?.submittedAt)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-6 text-xs text-slate-400">
                <Info size={14} className="text-amber-500 flex-shrink-0" />
                <span>Verification typically takes 12–24 hours. You will receive an email once approved.</span>
              </div>

              <div className="mt-8">
                <button
                  onClick={() => navigate("/")}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Return to Home
                </button>
              </div>
            </div>
          </div>
        )}

        {/* State 3 & 4: REJECTED or NOT_SUBMITTED (Shows Form) */}
        {(currentStatus === "NOT_SUBMITTED" || currentStatus === "REJECTED") && (
          <div className="space-y-6">

            {/* Rejection Alert if REJECTED */}
            {currentStatus === "REJECTED" && (
              <div className="bg-red-50 border border-red-200 rounded-3xl p-6 sm:p-7 shadow-xs">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
                    <ShieldAlert size={22} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-red-900">
                      Verification Submission Rejected
                    </h3>
                    <p className="text-xs text-red-700 mt-1">
                      Your previous document submission could not be verified by the admin team.
                    </p>
                    {statusData?.rejectionReason && (
                      <div className="bg-white/80 border border-red-200/80 rounded-xl p-3.5 mt-3">
                        <p className="text-xs font-bold text-red-950 uppercase tracking-wide">
                          Reason for rejection:
                        </p>
                        <p className="text-xs font-medium text-red-900 mt-1">
                          {statusData.rejectionReason}
                        </p>
                      </div>
                    )}
                    <p className="text-xs text-red-600 mt-3 font-medium">
                      Please upload a clear, legible photo following the guidelines below to resubmit.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Verification Form Card */}
            <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">

              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {currentStatus === "REJECTED" ? "Re-submit Identity Documents" : "Submit Identity Documents"}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Ensure all details on your ID are clearly readable with no glare or obstruction.
                </p>
              </div>

              {submitError && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2 text-xs text-red-700">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Nationality Field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 tracking-wide uppercase">
                  Nationality / Country of Citizenship <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <Globe className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" />
                  <select
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-8 text-xs sm:text-sm text-slate-700 outline-none cursor-pointer transition-all focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 appearance-none"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                {validationErrors.nationality && (
                  <p className="text-xs text-red-600">{validationErrors.nationality}</p>
                )}
              </div>

              {/* Conditional Document Type Section */}
              {isSriLankan ? (
                <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                        Selected Document: <span className="text-emerald-700">{docType === "NIC" ? "National Identity Card (NIC)" : "Driving License"}</span>
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Both front and back photos are required for verification.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setDocType(docType === "NIC" ? "DRIVING_LICENSE" : "NIC")}
                      className="text-xs font-bold text-[#1a5c2a] hover:underline flex items-center gap-1 cursor-pointer flex-shrink-0"
                    >
                      {docType === "NIC" ? "Use Driving License instead →" : "Use NIC instead →"}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <FileDropzone
                      label={`${docType === "NIC" ? "NIC" : "Driving License"} — Front Side`}
                      file={frontFile}
                      preview={frontPreview}
                      error={validationErrors.front}
                      onSelect={handleFrontSelect}
                      onRemove={handleRemoveFront}
                      hint="Clear photo of the front side"
                    />

                    <FileDropzone
                      label={`${docType === "NIC" ? "NIC" : "Driving License"} — Back Side`}
                      file={backFile}
                      preview={backPreview}
                      error={validationErrors.back}
                      onSelect={handleBackSelect}
                      onRemove={handleRemoveBack}
                      hint="Clear photo of the back side"
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4">
                  <div>
                    <p className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Selected Document: <span className="text-emerald-700">Passport Photo Page</span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      For international travelers, upload the main identification photo page of your valid passport.
                    </p>
                  </div>

                  <FileDropzone
                    label="Passport Photo Page"
                    file={frontFile}
                    preview={frontPreview}
                    error={validationErrors.front}
                    onSelect={handleFrontSelect}
                    onRemove={handleRemoveFront}
                    hint="Full photo page including MRZ code"
                  />
                </div>
              )}

              {/* Guidelines Info */}
              <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 text-xs text-emerald-900 space-y-1.5">
                <p className="font-bold flex items-center gap-1.5">
                  <Info size={14} className="text-emerald-700" /> Document Guidelines:
                </p>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-emerald-800/90 pl-1">
                  <li>Government-issued document must be original and unexpired.</li>
                  <li>All 4 corners of the document must be visible with no cropping.</li>
                  <li>Text and photos must be sharp and free of reflection or glare.</li>
                </ul>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-[#1a5c2a] hover:bg-[#14471f] text-white font-bold text-sm rounded-2xl shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="animate-spin h-4 w-4" /> Submitting Verification...
                  </>
                ) : (
                  <>
                    Submit ID for Verification <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}

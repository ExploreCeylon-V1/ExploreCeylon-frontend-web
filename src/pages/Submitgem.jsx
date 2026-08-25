import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import hiddenGemsService from '../services/Hiddengemsservice';
import uploadService from '../services/Uploadservice';
import { GEM_CATEGORIES, getCategoryMeta } from '../components/gemCategories';
import { SRI_LANKA_DISTRICTS } from '../components/SriLankaDistricts';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const MAX_PHOTOS = 5;
const MAX_FILE_SIZE_MB = 5;

const SubmitGem = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [district, setDistrict] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [howToGetThere, setHowToGetThere] = useState('');
  const [bestTime, setBestTime] = useState('');
  const [tips, setTips] = useState('');

  const [photoFiles, setPhotoFiles] = useState([]); // File objects, pre-upload
  const [uploadedUrls, setUploadedUrls] = useState([]); // S3 public URLs, post-upload
  const [uploading, setUploading] = useState(false);

  const [confirmAccuracy, setConfirmAccuracy] = useState(false);
  const [confirmLicense, setConfirmLicense] = useState(false);

  const [locatingGps, setLocatingGps] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const categoryMeta = category ? getCategoryMeta(category) : null;

  // ── GPS ────────────────────────────────────────────────
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setSubmitError('Geolocation is not supported by your browser.');
      return;
    }

    setLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
        setLocatingGps(false);
      },
      (err) => {
        console.error('Geolocation error:', err);
        setSubmitError('Could not get your location. Please enter it manually.');
        setLocatingGps(false);
      }
    );
  };

  // ── Photos ─────────────────────────────────────────────
  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files || []);
    const validFiles = [];

    for (const file of selected) {
      if (photoFiles.length + validFiles.length >= MAX_PHOTOS) break;
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        setSubmitError(`${file.name} is not a supported format (JPG/PNG only).`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setSubmitError(`${file.name} exceeds ${MAX_FILE_SIZE_MB}MB.`);
        continue;
      }
      validFiles.push(file);
    }

    setPhotoFiles((prev) => [...prev, ...validFiles]);
  };

  const removePhoto = (index) => {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Uploads all selected files to S3 (via backend multipart endpoint)
  // and returns their public URLs
  const uploadAllPhotos = async () => {
    setUploading(true);
    try {
      const urls = await uploadService.uploadMultiple(photoFiles);
      setUploadedUrls(urls);
      return urls;
    } finally {
      setUploading(false);
    }
  };

  // ── Submit ─────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    if (!title.trim() || !description.trim() || !category || !district) {
      setSubmitError('Please fill in all required fields (*).');
      return;
    }
    if (!confirmAccuracy || !confirmLicense) {
      setSubmitError('Please confirm both checkboxes before submitting.');
      return;
    }

    try {
      setSubmitting(true);

      let imageUrls = uploadedUrls;
      if (photoFiles.length > 0 && uploadedUrls.length !== photoFiles.length) {
        imageUrls = await uploadAllPhotos();
      }

      await hiddenGemsService.submitGem({
        title: title.trim(),
        description: description.trim(),
        category,
        district,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        howToGetThere: howToGetThere.trim(),
        bestTime: bestTime.trim(),
        tips: tips.trim(),
        imageUrls,
      });

      navigate('/hidden-gems', {
        state: { submitted: true },
      });
    } catch (err) {
      console.error('Failed to submit gem:', err);
      setSubmitError(
        err.response?.data?.message ||
          'Could not submit your gem. Please check the form and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-slate-100 font-sans">
        {/* ══════════════════════════ HERO SECTION ══════════════════════════ */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-900 text-white py-10 sm:py-12 px-4 sm:px-6 lg:px-8 shadow-xl">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-emerald-400 to-teal-400 opacity-60" />

          <div className="relative z-10 max-w-7xl mx-auto">
            <div className="max-w-4xl text-left space-y-2.5">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-400/30 bg-emerald-500/15 text-3xs font-extrabold uppercase tracking-widest text-emerald-300">
                  <span>💎</span> Community Contribution
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-snug">
                Share a Hidden Gem of <span className="text-amber-300">Sri Lanka</span>
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-medium max-w-3xl">
                Help fellow travelers discover off-the-beaten-path waterfalls, secluded beaches, and secret local spots across the island.
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-4">
            <Link to="/" className="hover:text-emerald-800">Home</Link>
            <span>›</span>
            <Link to="/hidden-gems" className="hover:text-emerald-800">Hidden Gems</Link>
            <span>›</span>
            <span className="text-slate-800 font-bold">Submit a Gem</span>
          </div>

          {/* Info banner */}
          <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl px-4 py-3 text-xs font-semibold text-emerald-900 mb-6 flex items-center gap-2 shadow-xs">
            <span>ℹ️</span> Your submission will be reviewed by our team before publishing. Usually approved within 24–48 hours.
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main column */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {/* Basic Information */}
              <div className="bg-white rounded-2xl p-6 border-l-4 border-emerald-800 shadow-sm border border-slate-100">
                <h2 className="font-extrabold text-slate-900 text-lg mb-4 flex items-center gap-2">
                  <span>📍</span> Basic Information
                </h2>

                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Gem Name *
                </label>
                <p className="text-xs text-slate-500 mb-1.5">Give it a memorable, descriptive title</p>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, 200))}
                  placeholder="e.g. Secret Jungle Waterfall, Nilaveli Coral Cove..."
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium mb-1 focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                />
                <p className="text-xs font-semibold text-slate-400 text-right mb-4">{title.length}/200</p>

                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Description *
                </label>
                <p className="text-xs text-slate-500 mb-1.5">
                  Tell travelers what makes this place special, how it feels, and what to expect
                </p>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 3000))}
                  placeholder="e.g. A secluded beach only accessible by boat or a short jungle trek. Crystal clear water with zero crowds..."
                  rows={4}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium resize-none mb-1 focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                />
                <p className="text-xs font-semibold text-slate-400 text-right mb-4">
                  {description.length}/3000
                </p>

                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Category *
                </label>
                <p className="text-xs text-slate-500 mb-2">Select the type of secret spot</p>
                <div className="flex gap-2 flex-wrap mb-5">
                  {GEM_CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setCategory(cat.value)}
                      className={`rounded-full px-4 py-2 text-xs font-bold border transition-all ${
                        category === cat.value
                          ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-700 hover:text-emerald-800'
                      }`}
                    >
                      {cat.icon} {cat.label}
                    </button>
                  ))}
                </div>

                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  District *
                </label>
                <p className="text-xs text-slate-500 mb-1.5">Which Sri Lankan district is it located in?</p>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium cursor-pointer focus:outline-none focus:border-emerald-700"
                >
                  <option value="">Select district</option>
                  {SRI_LANKA_DISTRICTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Location Details */}
              <div className="bg-white rounded-2xl p-6 border-l-4 border-emerald-800 shadow-sm border border-slate-100">
                <h2 className="font-extrabold text-slate-900 text-lg mb-4 flex items-center gap-2">
                  <span>🗺️</span> Location & Directions
                </h2>

                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  GPS Location
                </label>
                <p className="text-xs text-slate-500 mb-2">Optional coordinates to help travelers navigate directly</p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input
                    type="text"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="Latitude e.g. 6.0089"
                    className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-emerald-700"
                  />
                  <input
                    type="text"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="Longitude e.g. 80.2491"
                    className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-emerald-700"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={locatingGps}
                  className="w-full border border-emerald-800/30 text-emerald-900 rounded-xl py-2.5 text-xs font-bold hover:bg-emerald-50 disabled:opacity-60 transition-all mb-5"
                >
                  📍 {locatingGps ? 'Locating coordinates...' : 'Use My Current GPS Location'}
                </button>

                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  How to Get There *
                </label>
                <p className="text-xs text-slate-500 mb-1.5">
                  Clear step-by-step directions from nearest town or landmark
                </p>
                <textarea
                  value={howToGetThere}
                  onChange={(e) => setHowToGetThere(e.target.value.slice(0, 1000))}
                  placeholder="e.g. Take a boat from Unawatuna beach (10 min) OR hike 30 min through jungle trail starting near temple..."
                  rows={3}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium resize-none mb-1 focus:outline-none focus:border-emerald-700"
                />
                <p className="text-xs font-semibold text-slate-400 text-right mb-4">
                  {howToGetThere.length}/1000
                </p>

                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Best Time to Visit
                </label>
                <p className="text-xs text-slate-500 mb-1.5">
                  e.g. "Dec–Mar (Dry Season)" or "Early morning at sunrise"
                </p>
                <input
                  type="text"
                  value={bestTime}
                  onChange={(e) => setBestTime(e.target.value.slice(0, 100))}
                  placeholder="e.g. Dec – Mar"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-emerald-700"
                />
              </div>

              {/* Tips & Safety */}
              <div className="bg-white rounded-2xl p-6 border-l-4 border-emerald-800 shadow-sm border border-slate-100">
                <h2 className="font-extrabold text-slate-900 text-lg mb-4 flex items-center gap-2">
                  <span>💡</span> Tips & Insider Advice
                </h2>

                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Traveler Tips & Safety Notes
                </label>
                <p className="text-xs text-slate-500 mb-1.5">Share practical advice (e.g. footwear, water, entry fees, local customs)</p>
                <textarea
                  value={tips}
                  onChange={(e) => setTips(e.target.value.slice(0, 1000))}
                  placeholder="e.g. Bring drinking water — no shops nearby. Go early morning for calm water. Wear sturdy shoes..."
                  rows={3}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium resize-none mb-1 focus:outline-none focus:border-emerald-700"
                />
                <p className="text-xs font-semibold text-slate-400 text-right">{tips.length}/1000</p>
              </div>

              {/* Photos */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h2 className="font-extrabold text-slate-900 text-lg mb-1 flex items-center gap-2">
                  <span>📷</span> High-Quality Photos <span className="text-slate-400 font-normal text-xs">(Optional)</span>
                </h2>

                <label
                  htmlFor="photo-input"
                  className="mt-3 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center py-10 cursor-pointer hover:border-emerald-600 transition-colors bg-slate-50/50"
                >
                  <span className="text-3xl mb-2">📸</span>
                  <p className="text-sm font-bold text-slate-800">
                    Upload Photos of the Hidden Gem
                  </p>
                  <p className="text-xs text-slate-500 mb-3">Drag & drop or click to browse</p>
                  <p className="text-3xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                    JPG or PNG (max {MAX_FILE_SIZE_MB}MB) · Up to {MAX_PHOTOS} photos
                  </p>
                  <span className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl px-5 py-2.5 shadow-sm transition-all">
                    Browse Local Photos
                  </span>
                  <input
                    id="photo-input"
                    type="file"
                    accept="image/jpeg,image/png"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>

                {photoFiles.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-4">
                    {photoFiles.map((file, idx) => (
                      <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(idx)}
                          className="absolute top-1 right-1 bg-black/70 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold hover:bg-rose-600 transition-colors"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {uploading && (
                  <p className="text-xs font-semibold text-emerald-800 mt-3 flex items-center gap-1.5">
                    <span className="animate-spin">⏳</span> Uploading photos to server...
                  </p>
                )}
              </div>

              {/* Confirmation */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <label className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 mb-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmAccuracy}
                    onChange={(e) => setConfirmAccuracy(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-800 focus:ring-emerald-500"
                  />
                  I confirm this is a real location in Sri Lanka and my submission is accurate to the best of my knowledge.
                </label>
                <label className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 mb-5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmLicense}
                    onChange={(e) => setConfirmLicense(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-800 focus:ring-emerald-500"
                  />
                  I agree that ExploreCeylon may share this submission and photos on the travel platform.
                </label>

                {submitError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs font-bold mb-4">
                    ⚠️ {submitError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || uploading}
                  className="w-full bg-emerald-800 hover:bg-emerald-900 disabled:opacity-60 text-white font-extrabold text-sm rounded-xl py-3.5 transition-all shadow-md hover:shadow-lg"
                >
                  {submitting ? 'Submitting Hidden Gem...' : '✨ Submit Hidden Gem →'}
                </button>
                <p className="text-3xs font-bold text-slate-400 uppercase tracking-wider text-center mt-3">
                  ⏱️ Review time: 24–48 hours &nbsp;•&nbsp; 📧 Email notification upon approval
                </p>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              {/* Preview */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h2 className="font-extrabold text-slate-900 mb-1">Live Card Preview</h2>
                <p className="text-xs text-slate-500 mb-4">How your gem will appear in community listings</p>

                {!title && !description ? (
                  <div className="border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center py-10 text-center bg-slate-50/50">
                    <span className="text-3xl mb-2">💎</span>
                    <p className="text-xs font-semibold text-slate-500">
                      Fill the form to see your<br />live gem card preview
                    </p>
                  </div>
                ) : (
                  <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm">
                    <div className="aspect-[4/3] bg-slate-100 flex items-center justify-center relative overflow-hidden">
                      {photoFiles[0] ? (
                        <img
                          src={URL.createObjectURL(photoFiles[0])}
                          alt="preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-4xl">💎</span>
                      )}
                      {categoryMeta && (
                        <span className="absolute top-3 left-3 text-3xs font-extrabold tracking-wider uppercase px-2.5 py-1 rounded-lg bg-emerald-900/90 text-emerald-200 border border-emerald-400/30">
                          {categoryMeta.icon} {categoryMeta.label}
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="font-extrabold text-slate-900 text-base mb-0.5">
                        {title || 'Untitled gem'}
                      </p>
                      {district && (
                        <p className="text-xs font-semibold text-slate-500 mb-2">📍 {district}</p>
                      )}
                      <p className="text-xs font-medium text-slate-600 line-clamp-2">
                        {description || 'No description provided.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Guidelines */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h2 className="font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                  <span>📋</span> Community Guidelines
                </h2>

                <p className="text-3xs font-extrabold uppercase tracking-wider text-emerald-800 mb-2">DO SUBMIT</p>
                <ul className="flex flex-col gap-2 mb-5">
                  {[
                    'Real off-the-beaten-path locations in Sri Lanka',
                    'Clear, accurate directions & tips',
                    'Your own photos only',
                    'Authentic traveler experiences',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <span className="text-emerald-600">✅</span> {item}
                    </li>
                  ))}
                </ul>

                <p className="text-3xs font-extrabold uppercase tracking-wider text-rose-700 mb-2">DO NOT SUBMIT</p>
                <ul className="flex flex-col gap-2 mb-5">
                  {[
                    'Commercial businesses (hotels, restaurants)',
                    'Already famous tourist landmarks',
                    'Duplicate existing gems',
                    'Copyrighted web photos',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <span className="text-rose-500">❌</span> {item}
                    </li>
                  ))}
                </ul>

                <p className="text-3xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">APPROVAL PROCESS</p>
                <ol className="flex flex-col gap-2">
                  {[
                    'Submit your gem',
                    'Admin reviews details (24–48h)',
                    'Approved & published',
                    'Email notification sent',
                  ].map((step, idx) => (
                    <li key={step} className="flex items-center gap-2 text-xs font-medium text-slate-700">
                      <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-800 font-bold text-3xs flex items-center justify-center border border-emerald-200/60 shrink-0">
                        {idx + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default SubmitGem;
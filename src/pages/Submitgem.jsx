import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import hiddenGemsService from '../services/Hiddengemsservice';
import uploadService from '../services/Uploadservice';
import { GEM_CATEGORIES, getCategoryMeta } from '../components/gemCategories';
import { SRI_LANKA_DISTRICTS } from '../components/sriLankaDistricts';
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
      <div className="min-h-screen bg-gray-100">
        {/* Hero */}
        <header className="bg-gradient-to-br from-[#2D6A4F] to-[#1B4332] text-white px-6 sm:px-10 py-8">
          <div className="flex items-center gap-3 mb-1.5">
            <span className="text-3xl">💎</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold">Share a Hidden Gem</h1>
          </div>
          <p className="text-base opacity-90">
            Help fellow travelers discover Sri Lanka's secret spots
          </p>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-10 py-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link to="/" className="hover:text-[#2D6A4F]">Home</Link>
            <span>›</span>
            <Link to="/hidden-gems" className="hover:text-[#2D6A4F]">Hidden Gems</Link>
            <span>›</span>
            <span className="text-gray-800 font-medium">Submit a Gem</span>
          </div>

          {/* Info banner */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-sm text-blue-800 mb-6 flex items-center gap-2">
            ℹ️ Your submission will be reviewed by our team before publishing.
            Usually approved within 24–48 hours.
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main column */}
            <div className="lg:col-span-2 flex flex-col gap-5">
              {/* Basic Information */}
              <div className="bg-white rounded-xl p-5 sm:p-6 border-l-4 border-[#2D6A4F]">
                <h2 className="font-bold text-gray-800 text-lg mb-4">📍 Basic Information</h2>

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gem Name *
                </label>
                <p className="text-xs text-gray-500 mb-1.5">Give it a memorable name</p>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, 200))}
                  placeholder="e.g. Jungle Beach, Ravana Cave..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm mb-1 focus:outline-2 focus:outline-[#2D6A4F] focus:outline-offset-1"
                />
                <p className="text-xs text-gray-400 text-right mb-4">{title.length}/200</p>

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <p className="text-xs text-gray-500 mb-1.5">
                  Tell travelers what makes this place special
                </p>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 3000))}
                  placeholder="e.g. A secluded beach only accessible by boat or jungle trek. Crystal clear water with no crowds..."
                  rows={4}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm resize-none mb-1 focus:outline-2 focus:outline-[#2D6A4F] focus:outline-offset-1"
                />
                <p className="text-xs text-gray-400 text-right mb-4">
                  {description.length}/3000
                </p>

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <p className="text-xs text-gray-500 mb-2">Select the type of hidden gem</p>
                <div className="flex gap-2 flex-wrap mb-4">
                  {GEM_CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setCategory(cat.value)}
                      className={`rounded-full px-4 py-2 text-sm font-medium border transition-colors duration-150 ${
                        category === cat.value
                          ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-[#2D6A4F]'
                      }`}
                    >
                      {cat.icon} {cat.label}
                    </button>
                  ))}
                </div>

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  District *
                </label>
                <p className="text-xs text-gray-500 mb-1.5">Which Sri Lanka district?</p>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm cursor-pointer"
                >
                  <option value="">Select district</option>
                  {SRI_LANKA_DISTRICTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Location Details */}
              <div className="bg-white rounded-xl p-5 sm:p-6 border-l-4 border-[#2D6A4F]">
                <h2 className="font-bold text-gray-800 text-lg mb-4">🗺️ Location Details</h2>

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GPS Location
                </label>
                <p className="text-xs text-gray-500 mb-2">Optional but helps travelers find it</p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input
                    type="text"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="Latitude e.g. 6.0089"
                    className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-2 focus:outline-[#2D6A4F] focus:outline-offset-1"
                  />
                  <input
                    type="text"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="Longitude e.g. 80.2491"
                    className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-2 focus:outline-[#2D6A4F] focus:outline-offset-1"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={locatingGps}
                  className="w-full border border-[#2D6A4F] text-[#2D6A4F] rounded-lg py-2.5 text-sm font-semibold hover:bg-gray-50 disabled:opacity-60 mb-4"
                >
                  📍 {locatingGps ? 'Locating...' : 'Use My Current Location'}
                </button>

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  How to Get There *
                </label>
                <p className="text-xs text-gray-500 mb-1.5">
                  Give clear directions from nearest town
                </p>
                <textarea
                  value={howToGetThere}
                  onChange={(e) => setHowToGetThere(e.target.value.slice(0, 1000))}
                  placeholder="e.g. Take a boat from Unawatuna beach (10 min) OR hike 30 min through jungle trail..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm resize-none mb-1 focus:outline-2 focus:outline-[#2D6A4F] focus:outline-offset-1"
                />
                <p className="text-xs text-gray-400 text-right mb-4">
                  {howToGetThere.length}/1000
                </p>

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Best Time to Visit
                </label>
                <p className="text-xs text-gray-500 mb-1.5">
                  e.g. "Dec–Mar" or "Year round"
                </p>
                <input
                  type="text"
                  value={bestTime}
                  onChange={(e) => setBestTime(e.target.value.slice(0, 100))}
                  placeholder="e.g. Dec – Mar"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-2 focus:outline-[#2D6A4F] focus:outline-offset-1"
                />
              </div>

              {/* Tips & Safety */}
              <div className="bg-white rounded-xl p-5 sm:p-6 border-l-4 border-[#2D6A4F]">
                <h2 className="font-bold text-gray-800 text-lg mb-4">💡 Tips & Safety Info</h2>

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Traveler Tips
                </label>
                <p className="text-xs text-gray-500 mb-1.5">Share practical tips for visiting</p>
                <textarea
                  value={tips}
                  onChange={(e) => setTips(e.target.value.slice(0, 1000))}
                  placeholder="e.g. Bring snacks — no shops nearby. Go early morning for calm water. Wear good shoes for the hike..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-2 focus:outline-[#2D6A4F] focus:outline-offset-1"
                />
                <p className="text-xs text-gray-400 text-right">{tips.length}/1000</p>
              </div>

              {/* Photos */}
              <div className="bg-white rounded-xl p-5 sm:p-6">
                <h2 className="font-bold text-gray-800 text-lg mb-1">
                  📷 Photos <span className="text-gray-400 font-normal text-sm">(Optional)</span>
                </h2>

                <label
                  htmlFor="photo-input"
                  className="mt-3 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center py-10 cursor-pointer hover:border-[#2D6A4F] transition-colors duration-150"
                >
                  <span className="text-3xl mb-2">⬆️</span>
                  <p className="text-sm font-medium text-gray-700">
                    Drag & drop photos here
                  </p>
                  <p className="text-xs text-gray-500 mb-3">or click to browse</p>
                  <p className="text-xs text-gray-400 mb-3">
                    Supported: JPG, PNG (max {MAX_FILE_SIZE_MB}MB) · Up to {MAX_PHOTOS} photos
                  </p>
                  <span className="bg-[#2D6A4F] text-white text-sm font-semibold rounded-lg px-5 py-2.5">
                    Browse Files
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
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-gray-200">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(idx)}
                          className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {uploading && (
                  <p className="text-sm text-gray-500 mt-3">Uploading photos...</p>
                )}
              </div>

              {/* Confirmation */}
              <div className="bg-white rounded-xl p-5 sm:p-6">
                <label className="flex items-start gap-2 text-sm text-gray-700 mb-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmAccuracy}
                    onChange={(e) => setConfirmAccuracy(e.target.checked)}
                    className="mt-0.5"
                  />
                  I confirm this is a real location in Sri Lanka and my submission is
                  accurate to the best of my knowledge.
                </label>
                <label className="flex items-start gap-2 text-sm text-gray-700 mb-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmLicense}
                    onChange={(e) => setConfirmLicense(e.target.checked)}
                    className="mt-0.5"
                  />
                  I agree that ExploreCeylon may use my submission and photos on the
                  platform.
                </label>

                {submitError && (
                  <p className="text-sm text-red-600 mb-3">{submitError}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting || uploading}
                  className="w-full bg-[#2D6A4F] hover:bg-[#1B4332] disabled:opacity-60 text-white font-semibold rounded-lg py-3.5 transition-colors duration-150"
                >
                  {submitting ? 'Submitting...' : '✨ Submit Hidden Gem →'}
                </button>
                <p className="text-xs text-gray-500 text-center mt-3">
                  ⏱️ Review time: 24–48 hours &nbsp;&nbsp; 📧 You'll be notified by email
                </p>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 flex flex-col gap-5">
              {/* Preview */}
              <div className="bg-white rounded-xl p-5 sm:p-6">
                <h2 className="font-bold text-gray-800 mb-1">Preview</h2>
                <p className="text-xs text-gray-500 mb-4">How your gem will appear</p>

                {!title && !description ? (
                  <div className="border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center py-10 text-center">
                    <span className="text-3xl mb-2">💎</span>
                    <p className="text-sm text-gray-500">
                      Start filling the form to<br />see your gem preview
                    </p>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="aspect-[4/3] bg-gray-200 flex items-center justify-center relative">
                      {photoFiles[0] ? (
                        <img
                          src={URL.createObjectURL(photoFiles[0])}
                          alt="preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl">💎</span>
                      )}
                      {categoryMeta && (
                        <span className="absolute top-2 left-2 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#2D6A4F]/90 text-white">
                          {categoryMeta.icon} {categoryMeta.label}
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="font-bold text-gray-800 text-sm mb-0.5">
                        {title || 'Untitled gem'}
                      </p>
                      {district && (
                        <p className="text-xs text-gray-500 mb-1.5">📍 {district}</p>
                      )}
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {description || 'No description yet.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Guidelines */}
              <div className="bg-white rounded-xl p-5 sm:p-6">
                <h2 className="font-bold text-gray-800 mb-4">📋 Guidelines</h2>

                <p className="text-xs font-semibold text-gray-500 mb-2">DO</p>
                <ul className="flex flex-col gap-1.5 mb-4">
                  {[
                    'Real locations in Sri Lanka',
                    'Clear accurate directions',
                    'Your own photos only',
                    'Honest descriptions',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="text-green-600">✅</span> {item}
                    </li>
                  ))}
                </ul>

                <p className="text-xs font-semibold text-gray-500 mb-2">DON'T</p>
                <ul className="flex flex-col gap-1.5 mb-4">
                  {[
                    'Commercial businesses (hotels, restaurants)',
                    'Already famous landmarks',
                    'Duplicate existing gems',
                    'Copied photos',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="text-red-500">❌</span> {item}
                    </li>
                  ))}
                </ul>

                <p className="text-xs font-semibold text-gray-500 mb-2">APPROVAL PROCESS</p>
                <ol className="flex flex-col gap-2">
                  {[
                    'Submit your gem',
                    'Admin reviews (24–48h)',
                    'Approved & published',
                    'Email notification sent',
                  ].map((step, idx) => (
                    <li key={step} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-600 text-xs flex items-center justify-center flex-shrink-0">
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
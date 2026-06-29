import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import guidesService from '../services/guidesService';
import tripsService from '../services/tripsService';
import GuideReviews from '../components/GuideReviews';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const PLACEHOLDER_PHOTO =
  'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=200&q=60';
const PLACEHOLDER_BANNER =
  'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1600&q=70';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const toDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const onlyDigits = (str) => (str || '').replace(/\D/g, '');

const GuideDetail = () => {
  const { id } = useParams();

  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [bookings, setBookings] = useState([]);

  const [trips, setTrips] = useState([]);
  const [tripsLoading, setTripsLoading] = useState(true);

  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [galleryFilter, setGalleryFilter] = useState('all');
  const [bioExpanded, setBioExpanded] = useState(false);

  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [tripId, setTripId] = useState('');
  const [notes, setNotes] = useState('');
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingMessage, setBookingMessage] = useState(null);

  // ── Load guide ──────────────────────────────────────────
  const fetchGuide = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await guidesService.getGuideById(id);
      setGuide(data);
    } catch (err) {
      console.error('Failed to load guide:', err);
      setError('Could not load this guide. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchGuide();
  }, [fetchGuide]);

  // ── Load bookings (for availability calendar) ──────────
  useEffect(() => {
    let active = true;
    guidesService
      .getGuideBookings(id)
      .then((data) => {
        if (active) setBookings(data || []);
      })
      .catch((err) => {
        console.error('Failed to load guide bookings:', err);
        if (active) setBookings([]);
      });
    return () => {
      active = false;
    };
  }, [id]);

  // ── Load my trips (for Attach to Trip) ─────────────────
  useEffect(() => {
    let active = true;
    setTripsLoading(true);
    tripsService
      .getMyTrips()
      .then((data) => {
        if (active) setTrips(data || []);
      })
      .catch((err) => {
        console.error('Failed to load trips:', err);
        if (active) setTrips([]);
      })
      .finally(() => {
        if (active) setTripsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // ── Derived: photo gallery ──────────────────────────────
  const galleryPhotos = useMemo(() => {
    const urls = guide?.imageUrls?.length ? guide.imageUrls : [];
    return urls.length ? urls : [guide?.photoUrl || PLACEHOLDER_PHOTO];
  }, [guide]);

  const specialtyTags = useMemo(
    () =>
      (guide?.specialties || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    [guide]
  );

  const languageList = useMemo(
    () =>
      (guide?.languages || '')
        .split(',')
        .map((l) => l.trim())
        .filter(Boolean),
    [guide]
  );

  const galleryTabs = useMemo(() => {
    const tabs = [{ key: 'all', label: 'All', count: galleryPhotos.length }];
    specialtyTags.forEach((tag) => {
      tabs.push({ key: tag, label: tag, count: galleryPhotos.length });
    });
    return tabs;
  }, [galleryPhotos.length, specialtyTags]);

  // ── Derived: booked date set from real bookings ────────
  const bookedDateKeys = useMemo(() => {
    const set = new Set();
    bookings.forEach((b) => {
      if (b.status === 'CANCELLED') return;
      const start = new Date(b.startDate);
      const end = new Date(b.endDate);
      const cursor = new Date(start);
      while (cursor <= end) {
        set.add(toDateKey(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }
    });
    return set;
  }, [bookings]);

  // ── Calendar grid ────────────────────────────────────────
  const calendarCells = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const cells = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const key = toDateKey(date);
      let status = 'available';
      if (date < today) status = 'past';
      else if (bookedDateKeys.has(key)) status = 'booked';
      cells.push({ day, status, key });
    }
    return cells;
  }, [calendarMonth, bookedDateKeys]);

  const goToPrevMonth = () =>
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const goToNextMonth = () =>
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

  // ── Booking submit ──────────────────────────────────────
  const totalDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
  }, [startDate, endDate]);

  const estimatedTotal = totalDays * (guide?.pricePerDay ?? 0);

  const handleCheckAvailability = () => {
    if (!startDate || !endDate) {
      setBookingMessage({ type: 'error', text: 'Please select a start and end date.' });
      return;
    }
    const cursor = new Date(startDate);
    const end = new Date(endDate);
    let conflict = false;
    while (cursor <= end) {
      if (bookedDateKeys.has(toDateKey(cursor))) {
        conflict = true;
        break;
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    setBookingMessage(
      conflict
        ? { type: 'error', text: 'Some of the selected dates are already booked.' }
        : { type: 'success', text: 'Great news — those dates are available!' }
    );
  };

  const handleBookNow = async () => {
    if (!startDate || !endDate) {
      setBookingMessage({ type: 'error', text: 'Please select a start and end date.' });
      return;
    }
    try {
      setBookingSubmitting(true);
      setBookingMessage(null);
      await guidesService.bookGuide({
        guideId: Number(id),
        tripId: tripId ? Number(tripId) : null,
        startDate,
        endDate,
        notes,
      });
      setBookingMessage({ type: 'success', text: 'Booking confirmed! The guide has been notified.' });
      const updated = await guidesService.getGuideBookings(id);
      setBookings(updated || []);
    } catch (err) {
      console.error('Booking failed:', err);
      const apiMsg = err?.response?.data?.message;
      setBookingMessage({
        type: 'error',
        text: apiMsg || 'Could not complete the booking. Please try again.',
      });
    } finally {
      setBookingSubmitting(false);
    }
  };

  const whatsappHref = guide?.phone
    ? `https://wa.me/${onlyDigits(guide.phone)}`
    : null;
  const mailHref = guide?.email ? `mailto:${guide.email}` : null;

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <p className="text-gray-500 text-base">Loading guide...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !guide) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center gap-3">
          <p className="text-red-700 text-base">{error || 'Guide not found.'}</p>
          <button
            type="button"
            onClick={fetchGuide}
            className="bg-[#2D6A4F] text-white rounded-md px-4 py-2 text-sm"
          >
            Retry
          </button>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-100">
        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-4 sm:px-10 pt-4 text-sm text-gray-500">
          <Link to="/" className="text-[#2D6A4F] hover:underline">
            Home
          </Link>
          <span className="mx-2">›</span>
          <Link to="/guides" className="text-[#2D6A4F] hover:underline">
            Guides
          </Link>
          <span className="mx-2">›</span>
          <span className="text-gray-700 font-medium">{guide.fullName}</span>
        </div>

        {/* Hero banner */}
        <div className="relative mt-3 mb-20 sm:mb-16">
          <div className="h-56 sm:h-72 w-full overflow-hidden">
            <img
              src={galleryPhotos[0] || PLACEHOLDER_BANNER}
              alt={guide.fullName}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -bottom-16 sm:-bottom-12 left-4 sm:left-10 flex items-end gap-4">
            <img
              src={guide.photoUrl || PLACEHOLDER_PHOTO}
              alt={guide.fullName}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-white shadow-md"
            />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-10">
          <div className="mb-4">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="text-2xl font-extrabold text-gray-800">{guide.fullName}</h1>
              {guide.verified && (
                <span className="text-xs font-semibold text-green-700 bg-green-100 rounded-full px-2.5 py-1">
                  ✓ Verified Guide
                </span>
              )}
              <span className="flex items-center gap-1 text-sm text-gray-700">
                <span className="text-yellow-400">★</span>
                <strong>{guide.rating?.toFixed(1) ?? '—'}</strong>
                <span className="text-gray-400">{guide.reviewCount ?? 0} reviews</span>
              </span>
            </div>
            <div className="flex gap-2 flex-wrap mb-1.5">
              {specialtyTags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-700"
                >
                  {tag}
                </span>
              ))}
            </div>
            <p className="text-sm text-gray-500">📍 {guide.district}, Sri Lanka</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-10 py-2 pb-14">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main column */}
            <div className="lg:col-span-2 flex flex-col gap-6">

              {/* Photos & Gallery */}
              <div className="bg-white rounded-xl p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="flex items-center gap-2 font-bold text-gray-800">
                    📷 Photos &amp; Gallery
                  </h2>
                  <span className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    🖼️ {galleryPhotos.length} photos
                  </span>
                </div>

                <div className="relative rounded-lg overflow-hidden mb-3">
                  <img
                    src={galleryPhotos[activePhotoIndex] || PLACEHOLDER_BANNER}
                    alt={`${guide.fullName} gallery ${activePhotoIndex + 1}`}
                    className="w-full h-72 sm:h-80 object-cover"
                  />
                  <span className="absolute top-3 right-3 bg-black/60 text-white text-xs font-medium px-2 py-1 rounded">
                    {activePhotoIndex + 1} / {galleryPhotos.length}
                  </span>
                </div>

                {galleryPhotos.length > 1 && (
                  <div className="flex gap-2 mb-4 overflow-x-auto">
                    {galleryPhotos.map((url, idx) => (
                      <button
                        key={url + idx}
                        type="button"
                        onClick={() => setActivePhotoIndex(idx)}
                        className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                          idx === activePhotoIndex
                            ? 'border-[#2D6A4F]'
                            : 'border-transparent'
                        }`}
                      >
                        <img
                          src={url}
                          alt={`thumb ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  {galleryTabs.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setGalleryFilter(tab.key)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors duration-150 ${
                        galleryFilter === tab.key
                          ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-[#2D6A4F]'
                      }`}
                    >
                      {tab.label} ({tab.count})
                    </button>
                  ))}
                </div>
              </div>

              {/* About */}
              <div className="bg-white rounded-xl p-5 sm:p-6">
                <h2 className="font-bold text-gray-800 mb-3">About {guide.fullName.split(' ')[0]}</h2>
                <p className="text-sm text-gray-600 leading-relaxed mb-1">
                  {bioExpanded || (guide.bio || '').length <= 160
                    ? guide.bio || 'No bio provided yet.'
                    : `${guide.bio.slice(0, 160)}...`}
                </p>
                {(guide.bio || '').length > 160 && (
                  <button
                    type="button"
                    onClick={() => setBioExpanded((v) => !v)}
                    className="text-sm text-[#2D6A4F] font-semibold hover:underline mb-4"
                  >
                    {bioExpanded ? 'Show less' : 'Read more...'}
                  </button>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 mt-3 text-sm">
                  <div className="flex items-start gap-2">
                    <span>🗣️</span>
                    <div>
                      <p className="text-gray-500">Languages</p>
                      <p className="font-semibold text-gray-800">
                        {languageList.join(', ') || '—'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span>📍</span>
                    <div>
                      <p className="text-gray-500">District</p>
                      <p className="font-semibold text-gray-800">{guide.district}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span>🎯</span>
                    <div>
                      <p className="text-gray-500">Specialties</p>
                      <p className="font-semibold text-gray-800">
                        {specialtyTags.join(', ') || '—'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span>🔥</span>
                    <div>
                      <p className="text-gray-500">Price</p>
                      <p className="font-semibold text-gray-800">
                        ${guide.pricePerDay}/day
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span>📞</span>
                    <div>
                      <p className="text-gray-500">Contact</p>
                      {whatsappHref ? (
                        <a
                          href={whatsappHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-[#2D6A4F] hover:underline"
                        >
                          {guide.phone}
                        </a>
                      ) : (
                        <p className="font-semibold text-gray-400">Not provided</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span>📧</span>
                    <div>
                      <p className="text-gray-500">Email</p>
                      {mailHref ? (
                        <a
                          href={mailHref}
                          className="font-semibold text-[#2D6A4F] hover:underline"
                        >
                          {guide.email}
                        </a>
                      ) : (
                        <p className="font-semibold text-gray-400">Not provided</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Expertise */}
              {specialtyTags.length > 0 && (
                <div className="bg-white rounded-xl p-5 sm:p-6">
                  <h2 className="font-bold text-gray-800 mb-3">
                    {specialtyTags[0]} Expertise
                  </h2>
                  <ul className="flex flex-col gap-2">
                    {specialtyTags.map((tag) => (
                      <li key={tag} className="flex items-center gap-2 text-sm text-gray-700">
                        <span className="text-green-600">✓</span>
                        {tag} specialist
                      </li>
                    ))}
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="text-green-600">✓</span>
                      Based in {guide.district}
                    </li>
                  </ul>
                </div>
              )}

              {/* Availability calendar */}
              <div className="bg-white rounded-xl p-5 sm:p-6">
                <h2 className="flex items-center gap-2 font-bold text-gray-800 mb-4">
                  📅 Check Availability
                </h2>
                <div className="flex items-center justify-between mb-3">
                  <button
                    type="button"
                    onClick={goToPrevMonth}
                    className="text-gray-500 hover:text-gray-800 px-2"
                    aria-label="Previous month"
                  >
                    ‹
                  </button>
                  <p className="font-semibold text-gray-800">
                    {MONTH_NAMES[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
                  </p>
                  <button
                    type="button"
                    onClick={goToNextMonth}
                    className="text-gray-500 hover:text-gray-800 px-2"
                    aria-label="Next month"
                  >
                    ›
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1.5 text-center text-xs text-gray-500 mb-2">
                  {WEEKDAY_LABELS.map((d) => (
                    <div key={d}>{d}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1.5">
                  {calendarCells.map((cell, idx) =>
                    cell ? (
                      <div
                        key={cell.key}
                        className={`rounded-md py-2 text-sm font-medium text-center ${
                          cell.status === 'booked'
                            ? 'bg-red-100 text-red-600'
                            : cell.status === 'past'
                            ? 'bg-gray-50 text-gray-300'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {cell.day}
                      </div>
                    ) : (
                      <div key={`empty-${idx}`} />
                    )
                  )}
                </div>

                <div className="flex gap-4 mt-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-green-100 inline-block" /> Available
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-red-100 inline-block" /> Booked
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-gray-50 inline-block" /> Past
                  </span>
                </div>
              </div>

              {/* ── Reviews — now handled by GuideReviews component ── */}
              <GuideReviews
                guideId={id}
                onReviewAdded={fetchGuide}
              />

            </div>

            {/* Booking sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl p-5 sm:p-6 sticky top-4 flex flex-col gap-4">
                <div>
                  <h2 className="font-bold text-gray-800 mb-1">
                    Book {guide.fullName}
                  </h2>
                  <p className="text-2xl font-extrabold text-[#2D6A4F]">
                    ${guide.pricePerDay}
                    <span className="text-sm font-medium text-gray-500">/day</span>
                  </p>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1.5">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setBookingMessage(null);
                    }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-2 focus:outline-[#2D6A4F] focus:outline-offset-1"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1.5">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setBookingMessage(null);
                    }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-2 focus:outline-[#2D6A4F] focus:outline-offset-1"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-sm text-gray-700 mb-1.5">
                    🧳 Attach to Trip
                  </label>
                  <select
                    value={tripId}
                    onChange={(e) => setTripId(e.target.value)}
                    disabled={tripsLoading}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm cursor-pointer disabled:bg-gray-50"
                  >
                    <option value="">
                      {tripsLoading ? 'Loading trips...' : 'None'}
                    </option>
                    {trips.map((trip) => (
                      <option key={trip.id} value={trip.id}>
                        {trip.title}
                        {trip.status === 'DRAFT' ? ' (Draft)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1.5">Special Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="We're interested in leopard tracking..."
                    rows={3}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-2 focus:outline-[#2D6A4F] focus:outline-offset-1"
                  />
                </div>

                {totalDays > 0 && (
                  <div className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2.5">
                    <span className="text-gray-600">
                      {totalDays} day{totalDays > 1 ? 's' : ''}
                    </span>
                    <span className="font-bold text-gray-800">
                      ${estimatedTotal.toFixed(0)} total
                    </span>
                  </div>
                )}

                {bookingMessage && (
                  <p
                    className={`text-sm rounded-lg px-3 py-2 ${
                      bookingMessage.type === 'success'
                        ? 'bg-green-50 text-green-700'
                        : 'bg-red-50 text-red-600'
                    }`}
                  >
                    {bookingMessage.text}
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleCheckAvailability}
                  className="w-full border border-[#2D6A4F] text-[#2D6A4F] rounded-lg py-2.5 text-sm font-semibold hover:bg-green-50 transition-colors duration-150"
                >
                  Check Availability
                </button>

                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={!!guide.available} readOnly />
                  <span className={guide.available ? 'text-green-700' : 'text-gray-500'}>
                    {guide.available ? 'Available' : 'Unavailable'}
                  </span>
                </label>

                <button
                  type="button"
                  onClick={handleBookNow}
                  disabled={bookingSubmitting || !guide.available}
                  className="w-full bg-[#2D6A4F] hover:bg-[#1B4332] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg py-3 text-sm transition-colors duration-150"
                >
                  {bookingSubmitting ? 'Booking...' : 'Book Now'}
                </button>

                {whatsappHref ? (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 text-sm font-semibold text-[#2D6A4F] hover:underline"
                  >
                    💬 Message Guide
                  </a>
                ) : (
                  <span className="flex items-center justify-center gap-1.5 text-sm font-semibold text-gray-400">
                    💬 Message Guide (no phone on file)
                  </span>
                )}

                <div className="grid grid-cols-2 gap-y-1.5 gap-x-2 text-xs text-gray-500 border-t border-gray-100 pt-3">
                  <span>{guide.verified ? '✓' : '—'} Verified ID</span>
                  <span>✓ Background Check</span>
                  <span>✓ Experienced Guide</span>
                  <span>✓ First Aid</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default GuideDetail;
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import guidesService from '../services/guidesService';
import { SRI_LANKA_DISTRICTS } from '../components/SriLankaDistricts';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const RATING_OPTIONS = [
  { value: 5, label: '★★★★★', sub: '5.0' },
  { value: 4, label: '★★★★☆', sub: '4.0+' },
  { value: 3, label: '★★★☆☆', sub: '3.0+' },
];

const SORT_OPTIONS = [
  { value: 'rating_desc', label: 'Highest Rated' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'reviews_desc', label: 'Most Reviewed' },
];

const PLACEHOLDER_PHOTO =
  'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=200&q=60';

const Guides = () => {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [district, setDistrict] = useState('');
  const [language, setLanguage] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [maxPrice, setMaxPrice] = useState(100);
  const [minRating, setMinRating] = useState(null);
  const [sortBy, setSortBy] = useState('rating_desc');
  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => {
    fetchGuides();
  }, []);

  const fetchGuides = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await guidesService.getAllGuides();
      setGuides(data || []);
    } catch (err) {
      console.error('Failed to load guides:', err);
      setError('Could not load guides. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const languages = useMemo(() => {
    const all = guides.flatMap((g) =>
      (g.languages || '').split(',').map((l) => l.trim()).filter(Boolean)
    );
    return Array.from(new Set(all)).sort();
  }, [guides]);

  const specialties = useMemo(() => {
    const all = guides.flatMap((g) =>
      (g.specialties || '').split(',').map((s) => s.trim()).filter(Boolean)
    );
    return Array.from(new Set(all)).sort();
  }, [guides]);

  const filteredGuides = useMemo(() => {
    let result = [...guides];

    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      result = result.filter(
        (g) =>
          g.fullName?.toLowerCase().includes(term) ||
          g.specialties?.toLowerCase().includes(term) ||
          g.district?.toLowerCase().includes(term)
      );
    }

    if (district) {
      result = result.filter((g) => g.district === district);
    }

    if (language) {
      result = result.filter((g) =>
        (g.languages || '').split(',').map((l) => l.trim()).includes(language)
      );
    }

    if (specialty) {
      result = result.filter((g) =>
        (g.specialties || '').split(',').map((s) => s.trim()).includes(specialty)
      );
    }

    result = result.filter((g) => (g.pricePerDay ?? 0) <= maxPrice);

    if (minRating) {
      result = result.filter((g) => (g.rating ?? 0) >= minRating);
    }

    switch (sortBy) {
      case 'price_asc':
        result.sort((a, b) => (a.pricePerDay ?? 0) - (b.pricePerDay ?? 0));
        break;
      case 'price_desc':
        result.sort((a, b) => (b.pricePerDay ?? 0) - (a.pricePerDay ?? 0));
        break;
      case 'reviews_desc':
        result.sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0));
        break;
      case 'rating_desc':
      default:
        result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
    }

    return result;
  }, [guides, searchTerm, district, language, specialty, maxPrice, minRating, sortBy]);

  const handleClearAll = () => {
    setSearchTerm('');
    setDistrict('');
    setLanguage('');
    setSpecialty('');
    setMaxPrice(100);
    setMinRating(null);
    setSortBy('rating_desc');
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-100">
        <header className="bg-gradient-to-br from-[#2D6A4F] to-[#1B4332] text-white px-6 sm:px-10 py-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-1.5">
            Find Your Local Guide
          </h1>
          <p className="text-base opacity-90">
            Verified guides for every region and interest in Sri Lanka
          </p>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-10 py-6 pb-14">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filter sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl p-5 sm:p-6 sticky top-4">
                <h2 className="flex items-center gap-2 font-bold text-gray-800 mb-4">
                  🔍 Filter Guides
                </h2>

                <div className="relative mb-5">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                    🔍
                  </span>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search guides by name, specialty..."
                    className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-2 focus:outline-[#2D6A4F] focus:outline-offset-1"
                  />
                </div>

                <p className="font-semibold text-gray-700 text-sm mb-2">District</p>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm mb-5 cursor-pointer focus:outline-2 focus:outline-[#2D6A4F] focus:outline-offset-1"
                >
                  <option value="">All Districts</option>
                  {SRI_LANKA_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>

                <p className="font-semibold text-gray-700 text-sm mb-2">Language</p>
                <div className="flex gap-2 flex-wrap mb-5">
                  {languages.map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLanguage(language === l ? '' : l)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors duration-150 ${
                        language === l
                          ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-[#2D6A4F]'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>

                <p className="font-semibold text-gray-700 text-sm mb-2">Specialty</p>
                <div className="flex flex-col gap-1.5 mb-5">
                  {specialties.map((s) => (
                    <label
                      key={s}
                      className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={specialty === s}
                        onChange={() => setSpecialty(specialty === s ? '' : s)}
                      />
                      {s}
                    </label>
                  ))}
                </div>

                <p className="font-semibold text-gray-700 text-sm mb-2">
                  Max Price: ${maxPrice}/day
                </p>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full mb-1 accent-[#2D6A4F]"
                />
                <div className="flex justify-between text-xs text-gray-400 mb-5">
                  <span>$0</span>
                  <span>$100/day</span>
                </div>

                <p className="font-semibold text-gray-700 text-sm mb-2">Min Rating</p>
                <div className="flex gap-2 mb-5">
                  {RATING_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setMinRating(minRating === opt.value ? null : opt.value)
                      }
                      className={`flex-1 flex flex-col items-center gap-0.5 rounded-lg border px-2 py-2 transition-colors duration-150 ${
                        minRating === opt.value
                          ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-[#2D6A4F]'
                      }`}
                    >
                      <span className="text-yellow-400 text-xs leading-none">
                        {opt.label}
                      </span>
                      <span className="text-xs font-semibold">{opt.sub}</span>
                    </button>
                  ))}
                </div>

                <p className="font-semibold text-gray-700 text-sm mb-2">Sort By</p>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm mb-5 cursor-pointer"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Clear All
                  </button>
                  <button
                    type="button"
                    className="flex-1 bg-[#2D6A4F] hover:bg-[#1B4332] text-white rounded-lg py-2.5 text-sm font-semibold transition-colors duration-150"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="lg:col-span-3">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">
                  Showing <strong>{filteredGuides.length}</strong> guides
                </p>
                <div className="flex border border-gray-200 rounded-lg overflow-hidden bg-white">
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    aria-label="List view"
                    className={`px-3.5 py-2.5 text-base transition-colors duration-150 ${
                      viewMode === 'list' ? 'bg-[#2D6A4F] text-white' : 'text-gray-700'
                    }`}
                  >
                    ☰
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    aria-label="Grid view"
                    className={`px-3.5 py-2.5 text-base transition-colors duration-150 ${
                      viewMode === 'grid' ? 'bg-[#2D6A4F] text-white' : 'text-gray-700'
                    }`}
                  >
                    ▦
                  </button>
                </div>
              </div>

              {loading && (
                <p className="text-center py-12 text-gray-500 text-base">
                  Loading guides...
                </p>
              )}

              {!loading && error && (
                <div className="text-center py-12 text-red-700 text-base">
                  {error}
                  <button
                    type="button"
                    onClick={fetchGuides}
                    className="inline-block ml-3 bg-[#2D6A4F] text-white rounded-md px-3.5 py-1.5 cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              )}

              {!loading && !error && filteredGuides.length === 0 && (
                <p className="text-center py-12 text-gray-500 text-base">
                  No guides match your filters. Try adjusting your search.
                </p>
              )}

              {!loading && !error && filteredGuides.length > 0 && (
                <div
                  className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'
                      : 'flex flex-col gap-4'
                  }
                >
                  {filteredGuides.map((guide) => {
                    const ratingDisplay =
                      guide.rating != null ? guide.rating.toFixed(1) : '—';
                    const specialtyTags = (guide.specialties || '')
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean);

                    if (viewMode === 'list') {
                      return (
                        <div
                          key={guide.id}
                          className="bg-white rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
                        >
                          <img
                            src={guide.photoUrl || PLACEHOLDER_PHOTO}
                            alt={guide.fullName}
                            className="w-16 h-16 rounded-full object-cover shrink-0"
                          />

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-gray-800">
                                {guide.fullName}
                              </h3>
                              <span className="text-xs font-semibold text-green-700">
                                ✓ Verified
                              </span>
                              <span
                                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                  guide.available
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-500'
                                }`}
                              >
                                {guide.available ? 'Available' : 'Unavailable'}
                              </span>
                            </div>

                            <p className="text-sm text-gray-500 mb-2">
                              {guide.specialties}
                            </p>

                            <div className="flex items-center gap-4 flex-wrap text-xs text-gray-500">
                              <span className="flex items-center gap-1 text-sm text-gray-700">
                                <span className="text-yellow-400">★</span>
                                <strong>{ratingDisplay}</strong>
                                <span className="text-gray-400">
                                  ({guide.reviewCount ?? 0})
                                </span>
                              </span>
                              <span>📍 {guide.district}</span>
                              <span>💬 {guide.languages}</span>
                            </div>

                            <div className="flex gap-1.5 flex-wrap mt-2">
                              {specialtyTags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-700"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 sm:gap-2 shrink-0 sm:w-36">
                            <p className="text-lg font-bold text-[#2D6A4F]">
                              ${guide.pricePerDay}/day
                            </p>
                            <Link
                              to={`/guides/${guide.id}`}
                              className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-semibold text-sm rounded-lg py-2.5 px-4 text-center whitespace-nowrap transition-colors duration-150"
                            >
                              View Profile →
                            </Link>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={guide.id}
                        className="bg-white rounded-xl p-5 flex flex-col items-center text-center"
                      >
                        <div className="flex items-center justify-between w-full mb-3">
                          <span className="text-xs font-semibold text-green-700">
                            ✓ Verified
                          </span>
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              guide.available
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {guide.available ? 'Available' : 'Unavailable'}
                          </span>
                        </div>

                        <img
                          src={guide.photoUrl || PLACEHOLDER_PHOTO}
                          alt={guide.fullName}
                          className="w-20 h-20 rounded-full object-cover mb-3"
                        />

                        <h3 className="font-bold text-gray-800 mb-0.5">
                          {guide.fullName}
                        </h3>
                        <p className="text-sm text-gray-500 mb-2">
                          {guide.specialties}
                        </p>

                        <div className="flex items-center gap-1 text-sm text-gray-700 mb-3">
                          <span className="text-yellow-400">★</span>
                          <strong>{ratingDisplay}</strong>
                          <span className="text-gray-400">
                            ({guide.reviewCount ?? 0})
                          </span>
                        </div>

                        <div className="flex gap-1.5 flex-wrap justify-center mb-3">
                          {specialtyTags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-700"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        <p className="text-xs text-gray-500 mb-1">📍 {guide.district}</p>
                        <p className="text-xs text-gray-500 mb-3">
                          💬 {guide.languages}
                        </p>

                        <p className="text-lg font-bold text-[#2D6A4F] mb-3">
                          ${guide.pricePerDay}/day
                        </p>

                        <Link
                          to={`/guides/${guide.id}`}
                          className="w-full bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-semibold text-sm rounded-lg py-3 text-center transition-colors duration-150"
                        >
                          View Profile →
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Guides;
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import destinationsService from '../services/destinationsService';
import DestinationCard from '../components/DestinationCard';
import FeaturedCarousel from '../components/FeaturedCarousel';
import { DESTINATION_CATEGORIES } from '../components/destinationCategories';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const SORT_OPTIONS = [
  { value: 'rating_desc', label: 'Highest Rated' },
  { value: 'rating_asc', label: 'Lowest Rated' },
  { value: 'reviews_desc', label: 'Most Reviewed' },
  { value: 'name_asc', label: 'Name (A-Z)' },
];

const Destinations = () => {
  const navigate = useNavigate();

  const [destinations, setDestinations] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeCategory, setActiveCategory] = useState('ALL');
  const [provinceFilter, setProvinceFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('rating_desc');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [allData, featuredData] = await Promise.all([
        destinationsService.getAllDestinations(),
        destinationsService.getFeatured(),
      ]);
      setDestinations(allData || []);
      setFeatured(featuredData || []);
    } catch (err) {
      console.error('Failed to load destinations:', err);
      setError('Could not load destinations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const provinces = useMemo(() => {
    const unique = new Set(destinations.map((d) => d.province).filter(Boolean));
    return Array.from(unique).sort();
  }, [destinations]);

  const categoryCounts = useMemo(() => {
    const counts = {};
    DESTINATION_CATEGORIES.forEach((c) => {
      counts[c.value] = destinations.filter((d) => d.category === c.value).length;
    });
    return counts;
  }, [destinations]);

  const filteredDestinations = useMemo(() => {
    let result = [...destinations];

    if (activeCategory !== 'ALL') {
      result = result.filter((d) => d.category === activeCategory);
    }

    if (provinceFilter !== 'ALL') {
      result = result.filter((d) => d.province === provinceFilter);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      result = result.filter(
        (d) =>
          d.name?.toLowerCase().includes(term) ||
          d.description?.toLowerCase().includes(term) ||
          d.district?.toLowerCase().includes(term) ||
          d.province?.toLowerCase().includes(term)
      );
    }

    switch (sortBy) {
      case 'rating_asc':
        result.sort((a, b) => (a.rating ?? 0) - (b.rating ?? 0));
        break;
      case 'reviews_desc':
        result.sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0));
        break;
      case 'name_asc':
        result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'rating_desc':
      default:
        result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
    }

    return result;
  }, [destinations, activeCategory, provinceFilter, searchTerm, sortBy]);

  const handleExplore = (destination) => {
    navigate(`/destinations/${destination.id}`);
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-100">
        {/* Hero */}
        <header className="bg-gradient-to-br from-[#2D6A4F] to-[#1B4332] text-white px-6 sm:px-10 py-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-1.5">
            Explore Sri Lanka's Finest Destinations
          </h1>
          <p className="text-base opacity-90">
            From ancient kingdoms to pristine beaches
          </p>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-10 py-6 pb-14">
          {/* Featured carousel */}
          {!loading && !error && (
            <FeaturedCarousel destinations={featured} onExplore={handleExplore} />
          )}

          {/* Category tabs */}
          <div className="flex gap-2.5 flex-wrap mb-5">
            <button
              type="button"
              onClick={() => setActiveCategory('ALL')}
              className={`rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap border transition-colors duration-150 ${
                activeCategory === 'ALL'
                  ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-[#2D6A4F]'
              }`}
            >
              ☀️ All ({destinations.length})
            </button>
            {DESTINATION_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setActiveCategory(cat.value)}
                className={`rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap border transition-colors duration-150 ${
                  activeCategory === cat.value
                    ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-[#2D6A4F]'
                }`}
              >
                {cat.icon} {cat.label} ({categoryCounts[cat.value] || 0})
              </button>
            ))}
          </div>

          {/* Toolbar */}
          <div className="flex gap-3 items-center flex-wrap bg-white rounded-xl p-4 mb-5">
            <select
              value={provinceFilter}
              onChange={(e) => setProvinceFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 bg-white cursor-pointer"
            >
              <option value="ALL">All Provinces</option>
              {provinces.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            <div className="flex-1 min-w-[200px] relative flex items-center">
              <span className="absolute left-3 text-sm text-gray-500">🔍</span>
              <input
                type="text"
                placeholder="Search destinations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-2 focus:outline-[#2D6A4F] focus:outline-offset-1"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 bg-white cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Result count */}
          <p className="text-sm text-gray-500 mb-4">
            Showing <strong>{filteredDestinations.length}</strong> destinations
          </p>

          {loading && (
            <p className="text-center py-12 text-gray-500 text-base">
              Loading destinations...
            </p>
          )}

          {!loading && error && (
            <div className="text-center py-12 text-red-700 text-base">
              {error}
              <button
                type="button"
                onClick={fetchData}
                className="inline-block ml-3 bg-[#2D6A4F] text-white rounded-md px-3.5 py-1.5 cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && filteredDestinations.length === 0 && (
            <p className="text-center py-12 text-gray-500 text-base">
              No destinations match your filters. Try adjusting your search.
            </p>
          )}

          {!loading && !error && filteredDestinations.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDestinations.map((destination) => (
                <DestinationCard
                  key={destination.id}
                  destination={destination}
                  onExplore={handleExplore}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Destinations;
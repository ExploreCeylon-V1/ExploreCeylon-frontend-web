import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import hiddenGemsService from '../services/Hiddengemsservice';
import { getCategoryMeta } from '../components/gemCategories';
import GemReviews from '../components/GemReviews';
import AddToTripCard from '../components/AddToTripCard';
import NearbyGems from '../components/NearbyGems';
import SubmitGemCta from '../components/SubmitGemCta';
import ImageGallery from '../components/ImageGallery';
import ErrorBoundary from '../components/ErrorBoundary';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { getNearbyGems } from '../utils/geo';

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1546484959-f9a381d1330d?auto=format&fit=crop&w=1200&q=70';

const GemDetail = () => {
  const { id } = useParams();

  const [gem, setGem] = useState(null);
  const [nearbyGems, setNearbyGems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGem = async () => {
    try {
      setLoading(true);
      setError(null);
      const [gemData, allGems] = await Promise.all([
        hiddenGemsService.getGemById(id),
        hiddenGemsService.getAllGems(),
      ]);
      setGem(gemData);

      const approvedGems = (allGems || []).filter((g) => g.approved);
      setNearbyGems(getNearbyGems(gemData, approvedGems, 3));
    } catch (err) {
      console.error('Failed to load gem:', err);
      setError('Could not load this hidden gem. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetchGem sets loading state synchronously before its await; intentional fetch-on-id-change pattern
    fetchGem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <p className="text-gray-500">Loading...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !gem) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-3">{error || 'Gem not found.'}</p>
            <Link to="/hidden-gems" className="text-[#2D6A4F] font-semibold underline">
              Back to Hidden Gems
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const categoryMeta = getCategoryMeta(gem.category);
  const photos = gem.imageUrls?.length ? gem.imageUrls : [PLACEHOLDER_IMAGE];
  const ratingDisplay = gem.rating != null ? gem.rating.toFixed(1) : '—';

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-10 py-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link to="/" className="hover:text-[#2D6A4F]">
              Home
            </Link>
            <span>›</span>
            <Link to="/hidden-gems" className="hover:text-[#2D6A4F]">
              Hidden Gems
            </Link>
            <span>›</span>
            <span className="text-gray-800 font-medium">{gem.title}</span>
          </div>

          {/* Photo gallery */}
          <ImageGallery images={photos} title={gem.title} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main column */}
            <div className="lg:col-span-2 flex flex-col gap-5">
              {/* Header card */}
              <div className="bg-white rounded-xl p-5 sm:p-6">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-[#2D6A4F] text-white">
                      {categoryMeta.icon} {categoryMeta.label}
                    </span>
                    <span className="flex items-center gap-1 text-sm text-gray-700">
                      <span className="text-yellow-400">★</span>
                      <strong>{ratingDisplay}</strong>
                      <span className="text-gray-400">
                        {gem.reviewCount ?? 0} community visits
                      </span>
                    </span>
                  </div>
                  {gem.approved && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-green-100 text-green-700">
                      ✅ Community Approved
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800 mb-1">
                  {gem.title}
                </h1>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  📍 {gem.district}
                </p>
              </div>

              {/* Description */}
              {gem.description && (
                <div className="bg-white rounded-xl p-5 sm:p-6">
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                    {gem.description}
                  </p>
                </div>
              )}

              {/* Getting There */}
              {gem.howToGetThere && (
                <div className="bg-white rounded-xl p-5 sm:p-6 border-l-4 border-[#2D6A4F]">
                  <h2 className="flex items-center gap-2 font-bold text-gray-800 mb-2">
                    🧭 Getting There
                  </h2>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                    {gem.howToGetThere}
                  </p>
                </div>
              )}

              {/* Best time */}
              {gem.bestTime && (
                <div className="bg-white rounded-xl p-5 sm:p-6">
                  <h2 className="flex items-center gap-2 font-bold text-gray-800 mb-2">
                    📅 Best Time to Visit
                  </h2>
                  <p className="text-sm text-gray-700">{gem.bestTime}</p>
                </div>
              )}

              {/* Tips */}
              {gem.tips && (
                <div className="bg-yellow-50 rounded-xl p-5 sm:p-6">
                  <h2 className="flex items-center gap-2 font-bold text-gray-800 mb-2">
                    ⚠️ Important Tips
                  </h2>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                    {gem.tips}
                  </p>
                </div>
              )}

              {/* Location */}
              {gem.latitude != null && gem.longitude != null && (
                <div className="bg-white rounded-xl p-5 sm:p-6">
                  <h2 className="flex items-center gap-2 font-bold text-gray-800 mb-3">
                    📍 Location
                  </h2>
                  <a
                    href={`https://www.google.com/maps?q=${gem.latitude},${gem.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block border border-gray-200 rounded-lg text-center py-2.5 text-sm font-semibold text-[#2D6A4F] hover:bg-gray-50"
                  >
                    📍 Get Directions
                  </a>
                </div>
              )}

              {/* Reviews */}
              <ErrorBoundary title="Unable to load reviews" message="Reviews section encountered a problem loading.">
                <GemReviews gemId={gem.id} onReviewAdded={fetchGem} />
              </ErrorBoundary>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 flex flex-col gap-5">
              <AddToTripCard item={gem} itemType="GEM" />

              <div className="bg-white rounded-xl p-5 sm:p-6">
                <h2 className="font-bold text-gray-800 mb-4">Gem Info</h2>
                <dl className="flex flex-col gap-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-400">Category</dt>
                    <dd className="font-medium text-gray-800">
                      {categoryMeta.icon} {categoryMeta.label}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-400">District</dt>
                    <dd className="font-medium text-gray-800">{gem.district}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-400">Rating</dt>
                    <dd className="font-medium text-gray-800">
                      ⭐ {ratingDisplay} ({gem.reviewCount ?? 0} reviews)
                    </dd>
                  </div>
                  {gem.bestTime && (
                    <div className="flex justify-between">
                      <dt className="text-gray-400">Best Time</dt>
                      <dd className="font-medium text-gray-800">{gem.bestTime}</dd>
                    </div>
                  )}
                </dl>
              </div>

              <NearbyGems gems={nearbyGems} />

              <SubmitGemCta />
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default GemDetail;
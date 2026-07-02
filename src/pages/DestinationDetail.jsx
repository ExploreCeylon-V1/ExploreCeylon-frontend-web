import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import destinationsService from '../services/destinationsService';
import hiddenGemsService from '../services/Hiddengemsservice';
import guidesService from '../services/guidesService';
import { getDestinationCategoryMeta } from '../components/destinationCategories';
import { getCategoryMeta } from '../components/gemCategories';
import { ALL_MONTHS_ABBR, getActiveMonthSet, formatBestMonths } from '../utils/formatMonths';
import { parseTravelTimeFrom, parseActivities, parseNearbyGemTitles } from '../utils/destinationParsers';
import AddToTripCard from '../components/AddToTripCard';
import GuideMiniCard from '../components/GuideMiniCard';
import DestinationReviews from '../components/DestinationReviews';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1586183189334-1f3e3d7f0c0c?auto=format&fit=crop&w=1200&q=70';

const DestinationDetail = () => {
  const { id } = useParams();

  const [destination, setDestination] = useState(null);
  const [nearbyGems, setNearbyGems] = useState([]);
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activePhoto, setActivePhoto] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);

  useEffect(() => {
    fetchDestination();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchDestination = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await destinationsService.getById(id);
      setDestination(data);
      setActivePhoto(0);
      setShowFullDescription(false);

      // Resolve nearbyGems titles -> real gem objects
      const gemTitles = parseNearbyGemTitles(data.nearbyGems);
      if (gemTitles.length) {
        const allGems = await hiddenGemsService.getAllGems();
        const matched = gemTitles
          .map((title) =>
            (allGems || []).find(
              (g) => g.approved && g.title?.toLowerCase() === title.toLowerCase()
            )
          )
          .filter(Boolean);
        setNearbyGems(matched);
      } else {
        setNearbyGems([]);
      }

      // Guides operating in the same district (best available approximation)
      if (data.district) {
        const guideData = await guidesService.getAllGuides({ district: data.district });
        setGuides((guideData || []).filter((g) => g.available !== false));
      } else {
        setGuides([]);
      }
    } catch (err) {
      console.error('Failed to load destination:', err);
      setError('Could not load this destination. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

  if (error || !destination) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-3">{error || 'Destination not found.'}</p>
            <Link to="/destinations" className="text-[#2D6A4F] font-semibold underline">
              Back to Destinations
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const categoryMeta = getDestinationCategoryMeta(destination.category);
  const photos = destination.imageUrls?.length
    ? destination.imageUrls
    : destination.coverImageUrl
    ? [destination.coverImageUrl]
    : [PLACEHOLDER_IMAGE];
  const ratingDisplay = destination.rating != null ? destination.rating.toFixed(1) : '—';
  const activeMonths = getActiveMonthSet(destination.bestMonths);
  const bestMonthsRange = formatBestMonths(destination.bestMonths);
  const activities = parseActivities(destination.activities);
  const travelTimes = parseTravelTimeFrom(destination.travelTimeFrom);

  const descriptionIsLong = (destination.description?.length || 0) > 200;
  const descriptionToShow =
    showFullDescription || !descriptionIsLong
      ? destination.description
      : `${destination.description.slice(0, 200)}...`;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-10 py-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link to="/" className="hover:text-[#2D6A4F]">Home</Link>
            <span>›</span>
            <Link to="/destinations" className="hover:text-[#2D6A4F]">Destinations</Link>
            <span>›</span>
            <span className="text-gray-800 font-medium">{destination.name}</span>
          </div>

          {/* Photo gallery */}
          <div className="relative rounded-xl overflow-hidden aspect-[16/8] bg-gray-300 mb-3">
            <img
              src={photos[activePhoto]}
              alt={destination.name}
              className="w-full h-full object-cover"
            />
            <span className="absolute top-3 right-3 bg-black/60 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
              {activePhoto + 1}/{photos.length}
            </span>
          </div>

          {photos.length > 1 && (
            <div className="flex gap-2 mb-6 overflow-x-auto">
              {photos.map((photo, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActivePhoto(idx)}
                  className={`flex-shrink-0 w-20 h-14 rounded-md overflow-hidden border-2 ${
                    idx === activePhoto ? 'border-[#2D6A4F]' : 'border-transparent'
                  }`}
                >
                  <img src={photo} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main column */}
            <div className="lg:col-span-2 flex flex-col gap-5">
              {/* Header card */}
              <div className="bg-white rounded-xl p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-700">
                    {categoryMeta.icon} {categoryMeta.label}
                  </span>
                  {destination.featured && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-orange-400 text-white">
                      ⭐ Featured
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800 mb-1">
                  {destination.name}
                </h1>
                <p className="text-sm text-gray-500 flex items-center gap-1 mb-2">
                  📍 {destination.district}, {destination.province}
                </p>
                <div className="flex items-center gap-1 text-sm text-gray-700">
                  <span className="text-yellow-400">★</span>
                  <strong>{ratingDisplay}</strong>
                  {destination.reviewCount != null && (
                    <span className="text-gray-400">({destination.reviewCount} reviews)</span>
                  )}
                </div>
              </div>

              {/* Description */}
              {destination.description && (
                <div className="bg-white rounded-xl p-5 sm:p-6">
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                    {descriptionToShow}
                  </p>
                  {descriptionIsLong && (
                    <button
                      type="button"
                      onClick={() => setShowFullDescription((v) => !v)}
                      className="text-sm text-[#2D6A4F] font-semibold mt-2 hover:underline"
                    >
                      {showFullDescription ? 'Show less' : 'Read full description...'}
                    </button>
                  )}
                </div>
              )}

              {/* Best Time to Visit */}
              {destination.bestMonths && (
                <div className="bg-white rounded-xl p-5 sm:p-6">
                  <h2 className="flex items-center gap-2 font-bold text-gray-800 mb-3">
                    📅 Best Time to Visit
                  </h2>
                  <div className="grid grid-cols-6 gap-2 mb-2">
                    {ALL_MONTHS_ABBR.map((month) => {
                      const isActive = activeMonths.has(month);
                      return (
                        <div
                          key={month}
                          className={`text-center text-sm font-semibold rounded-md py-2 ${
                            isActive
                              ? 'bg-[#2D6A4F] text-white'
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {month}
                        </div>
                      );
                    })}
                  </div>
                  {bestMonthsRange && (
                    <p className="text-sm text-gray-500">Best: {bestMonthsRange}</p>
                  )}
                </div>
              )}

              {/* What to Do Here */}
              {activities.length > 0 && (
                <div className="bg-white rounded-xl p-5 sm:p-6">
                  <h2 className="flex items-center gap-2 font-bold text-gray-800 mb-3">
                    🎯 What to Do Here
                  </h2>
                  <div className="flex gap-2 flex-wrap">
                    {activities.map((activity) => (
                      <span
                        key={activity}
                        className="text-sm font-medium px-3 py-1.5 rounded-full bg-gray-100 text-gray-700"
                      >
                        {activity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Practical Info */}
              {(destination.entryFee || destination.openingHours || destination.latitude != null) && (
                <div className="bg-white rounded-xl p-5 sm:p-6 border-l-4 border-[#2D6A4F]">
                  <h2 className="flex items-center gap-2 font-bold text-gray-800 mb-3">
                    ℹ️ Practical Info
                  </h2>
                  <dl className="flex flex-col gap-2.5 text-sm">
                    {destination.entryFee && (
                      <div className="flex justify-between">
                        <dt className="text-gray-500">💰 Entry Fee</dt>
                        <dd className="font-medium text-gray-800">{destination.entryFee}</dd>
                      </div>
                    )}
                    {destination.openingHours && (
                      <div className="flex justify-between">
                        <dt className="text-gray-500">🕒 Opening Hours</dt>
                        <dd className="font-medium text-gray-800">{destination.openingHours}</dd>
                      </div>
                    )}
                    {destination.latitude != null && destination.longitude != null && (
                      <div className="flex justify-between">
                        <dt className="text-gray-500">📍 GPS</dt>
                        <dd className="font-medium text-gray-800">
                          {destination.latitude.toFixed(4)}°N, {destination.longitude.toFixed(4)}°E
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}

              {/* Travel Time From */}
              {travelTimes.length > 0 && (
                <div className="bg-white rounded-xl p-5 sm:p-6">
                  <h2 className="flex items-center gap-2 font-bold text-gray-800 mb-3">
                    🚗 Travel Time From
                  </h2>
                  <div className="flex flex-col gap-2.5">
                    {travelTimes.map((t) => (
                      <div key={t.from} className="flex justify-between text-sm">
                        <span className="text-gray-500 flex items-center gap-1">
                          📍 From {t.from}
                        </span>
                        <span className="font-medium text-gray-800">{t.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Location */}
              {destination.latitude != null && destination.longitude != null && (
                <div className="bg-white rounded-xl p-5 sm:p-6">
                  <h2 className="flex items-center gap-2 font-bold text-gray-800 mb-3">
                    📍 Location
                  </h2>
                  <div className="bg-green-50 rounded-lg h-40 flex flex-col items-center justify-center mb-3">
                    <span className="text-2xl mb-1">🗺️</span>
                    <p className="text-sm font-medium text-gray-700">{destination.name}</p>
                    <p className="text-xs text-gray-500">
                      {destination.latitude.toFixed(4)}°N, {destination.longitude.toFixed(4)}°E
                    </p>
                  </div>
                  <a
                    href={`https://www.google.com/maps?q=${destination.latitude},${destination.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block border border-gray-200 rounded-lg text-center py-2.5 text-sm font-semibold text-[#2D6A4F] hover:bg-gray-50"
                  >
                    📍 Get Directions
                  </a>
                </div>
              )}

              {/* Available Guides */}
              {guides.length > 0 && (
                <div className="bg-white rounded-xl p-5 sm:p-6">
                  <h2 className="flex items-center gap-2 font-bold text-gray-800 mb-3">
                    🧑‍🦱 Available Guides for {destination.name}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {guides.slice(0, 4).map((guide) => (
                      <GuideMiniCard key={guide.id} guide={guide} />
                    ))}
                  </div>
                </div>
              )}

              {/* Hidden Gems Nearby */}
              {nearbyGems.length > 0 && (
                <div className="bg-white rounded-xl p-5 sm:p-6">
                  <h2 className="flex items-center gap-2 font-bold text-gray-800 mb-3">
                    💎 Hidden Gems Nearby
                  </h2>
                  <div className="flex flex-col">
                    {nearbyGems.map((gem) => {
                      const gemCategoryMeta = getCategoryMeta(gem.category);
                      return (
                        <div
                          key={gem.id}
                          className="flex items-center justify-between gap-3 py-3 border-b border-gray-100 last:border-0"
                        >
                          <div>
                            <p className="font-semibold text-gray-800 text-sm">{gem.title}</p>
                            <p className="text-xs text-gray-500">{gemCategoryMeta.label}</p>
                          </div>
                          <Link
                            to={`/hidden-gems/${gem.id}`}
                            className="text-xs font-semibold border border-[#2D6A4F] text-[#2D6A4F] rounded-md px-3 py-1.5 hover:bg-[#2D6A4F] hover:text-white transition-colors duration-150 whitespace-nowrap"
                          >
                            View Gem
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Reviews */}
              <DestinationReviews
                destinationId={destination.id}
                onReviewAdded={fetchDestination}
              />
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 flex flex-col gap-5">
              <AddToTripCard
                item={destination}
                itemType="ACTIVITY"
                title={destination.name}
                heading={`Plan a Visit to ${destination.name}`}
              />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default DestinationDetail;
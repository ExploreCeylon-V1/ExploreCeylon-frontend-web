import { useEffect } from 'react';
import { buildBookingComUrl, buildGoogleMapsUrl } from '../utils/hotelLinks';
import { useRequireAuth } from '../hooks/useRequireAuth';

// ============================================================================
// HOTEL DETAILS PANEL — slides in from the right when "View Details" is clicked
// Only renders fields that actually exist in our backend's HotelResult DTO.
// No fake photo carousel, no fake sub-rating bars, no fake guest reviews —
// the RapidAPI search response doesn't reliably give us that data.
// ============================================================================
export default function HotelDetailsPanel({ hotel, nightsCount, searchParams, onClose }) {
  const requireAuth = useRequireAuth();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!hotel) return null;

  const totalPrice = (hotel.pricePerNight * nightsCount).toFixed(2);
  const bookingUrl = buildBookingComUrl(hotel, searchParams);
  const mapsUrl = buildGoogleMapsUrl(hotel);

  const handleBookNow = () => {
    requireAuth(
      () => window.open(bookingUrl, '_blank', 'noopener,noreferrer'),
      {
        title: 'Sign in to book',
        message:
          'Please sign in or create a free account to book this hotel.',
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-md h-full overflow-y-auto bg-white shadow-2xl sm:max-w-lg animate-in slide-in-from-right">

        {/* Hero Image */}
        <div className="relative w-full h-64 bg-gray-100">
          <img
            src={hotel.photoUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=600&auto=format&fit=crop'}
            alt={hotel.name}
            className="object-cover w-full h-full"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=600&auto=format&fit=crop';
            }}
          />
          <button
            onClick={onClose}
            className="absolute flex items-center justify-center w-9 h-9 text-gray-700 bg-white rounded-full shadow-md top-3 right-3 hover:bg-gray-100"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {hotel.isLocalPick && (
              <span className="bg-amber-500 text-white text-2xs font-bold px-2.5 py-1 rounded-md flex items-center shadow-sm">
                ★ LOCAL PICK
              </span>
            )}
          </div>

          {/* Name & Stars */}
          <h2 className="text-2xl font-bold text-gray-900">{hotel.name}</h2>
          {hotel.stars > 0 && (
            <div className="flex items-center mt-1 space-x-1 text-sm text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i}>{i < hotel.stars ? '★' : '☆'}</span>
              ))}
              <span className="ml-1 text-sm font-medium text-gray-500">
                {hotel.stars}-star {hotel.propertyType || 'Hotel'}
              </span>
            </div>
          )}

          {/* Address + Map link */}
          {hotel.address && (
            <div className="mt-2 text-sm text-gray-500">
              <div className="flex items-center">
                <span className="mr-1">📍</span>
                <span>{hotel.address}</span>
              </div>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-1 text-sm font-semibold text-emerald-700 hover:text-emerald-900"
              >
                View on Google Maps →
              </a>
            </div>
          )}

          {/* Price Box */}
          <div className="p-4 mt-4 border border-emerald-100 rounded-xl bg-emerald-50/50">
            <div className="flex items-baseline">
              <span className="text-3xl font-black text-gray-900">{hotel.currency} {hotel.pricePerNight}</span>
              <span className="ml-1 text-sm font-medium text-gray-400">/night</span>
            </div>
            <div className="mt-1 text-sm font-bold text-gray-700">
              {hotel.currency} {totalPrice} total ({nightsCount} {nightsCount === 1 ? 'night' : 'nights'})
            </div>
            {hotel.distanceFromCenterKm != null && (
              <div className="mt-1 text-xs text-gray-400">
                {hotel.distanceFromCenterKm.toFixed(1)} km from city center
              </div>
            )}
            {hotel.freeCancellationUntil ? (
              <div className="flex items-center mt-2 text-xs font-semibold text-emerald-600">
                <span className="mr-1">✓</span>
                <span>Free cancellation until {hotel.freeCancellationUntil}</span>
              </div>
            ) : (
              <div className="flex items-center mt-2 text-xs font-semibold text-rose-500">
                <span className="mr-1">✕</span>
                <span>Non-refundable</span>
              </div>
            )}

            <div className="flex flex-col gap-2 mt-4 sm:flex-row">
              <button
                onClick={handleBookNow}
                className="flex items-center justify-center flex-1 bg-[#115e3b] hover:bg-[#0c4a2e] text-white text-sm font-bold px-4 py-3 rounded-xl transition-colors shadow-sm"
              >
                Book on Booking.com ↗
              </button>
              <button
                className="flex items-center justify-center flex-1 px-4 py-3 text-sm font-bold transition-colors border border-emerald-700 text-emerald-800 hover:bg-emerald-50 rounded-xl"
                title="Coming soon"
              >
                Save to Trip
              </button>
            </div>
            <p className="mt-2 text-2xs text-gray-400 text-center sm:text-left">
              Opens Booking.com in a new tab
            </p>
          </div>

          {/* Amenities */}
          <div className="mt-6">
            <h3 className="mb-3 text-base font-bold text-gray-800">Amenities</h3>
            {hotel.amenities && hotel.amenities.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {hotel.amenities.map((amenity, index) => (
                  <div key={index} className="flex items-center text-sm text-gray-700">
                    <span className="mr-1.5 text-emerald-600">✓</span>
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Amenities not available for this property.</p>
            )}
          </div>

          {/* Rating */}
          {hotel.reviewScore > 0 && (
            <div className="flex items-center pt-6 mt-6 space-x-3 border-t border-gray-100">
              <span className="text-3xl font-black text-gray-900">{hotel.reviewScore}</span>
              <div>
                {hotel.reviewScoreWord && (
                  <div className="text-base font-bold text-gray-800">{hotel.reviewScoreWord}</div>
                )}
                {hotel.reviewsCount > 0 && (
                  <div className="text-sm text-gray-400">{hotel.reviewsCount} reviews</div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
// ============================================================================
// HOTEL LINKS — build external URLs from real HotelResult data
// (We don't have a direct Booking.com hotel URL or lat/lng from the backend,
// so these build honest search-based links instead of fake direct links.)
// ============================================================================

/**
 * Booking.com search-results URL for a specific hotel + dates + occupancy.
 * Not a guaranteed direct hotel page (RapidAPI doesn't give us one), but lands
 * the user on Booking.com with the hotel name pre-searched.
 */
export const buildBookingComUrl = (hotel, { checkIn, checkOut, adults, rooms }) => {
  const params = new URLSearchParams({
    ss: [hotel?.name, hotel?.address].filter(Boolean).join(', '),
    checkin: checkIn || '',
    checkout: checkOut || '',
    group_adults: String(adults || 1),
    no_rooms: String(rooms || 1),
  });
  return `https://www.booking.com/searchresults.html?${params.toString()}`;
};

/**
 * Google Maps search URL built from hotel name + address.
 * We don't have lat/lng from the backend, so this uses a text search
 * instead of a pin-drop link.
 */
export const buildGoogleMapsUrl = (hotel) => {
  const query = [hotel?.name, hotel?.address].filter(Boolean).join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
};
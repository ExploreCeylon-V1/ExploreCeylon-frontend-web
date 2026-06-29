import apiClient from './api';

// ============================================================================
// HOTEL SERVICE — backend eke HotelController ekata calls
// ============================================================================

/**
 * Hotels search karanna (POST /api/v1/hotels/search)
 * @param {Object} params
 * @param {string} params.location        - e.g. "Colombo, Sri Lanka"
 * @param {string} params.checkinDate     - format: "2026-06-17"
 * @param {string} params.checkoutDate    - format: "2026-06-19"
 * @param {number} params.adults
 * @param {number} params.rooms
 * @param {string} params.currency        - "USD" | "LKR" | "EUR" | "GBP"
 * @returns {Promise<Array>} list of HotelResult objects
 */
export const searchHotels = async ({
  location,
  checkinDate,
  checkoutDate,
  adults,
  rooms,
  currency,
}) => {
  const response = await apiClient.post('/api/v1/hotels/search', {
    location,
    checkinDate,
    checkoutDate,
    adults,
    rooms,
    currency,
  });
  return response.data; // List<HotelResult>
};

/**
 * Hotel ekak ge full details ganna (GET /api/v1/hotels/{hotelId})
 * @param {string} hotelId
 * @returns {Promise<Object>} raw hotel details (RapidAPI passthrough)
 */
export const getHotelDetails = async (hotelId) => {
  const response = await apiClient.get(`/api/v1/hotels/${hotelId}`);
  return response.data;
};
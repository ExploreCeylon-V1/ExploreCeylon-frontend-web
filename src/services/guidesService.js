import apiClient from './api';

/**
 * Guides API service
 * Maps to: com.exploreceylon.backend.controller.TourGuideController
 */
const guidesService = {
  /**
   * GET /api/v1/guides
   */
  getAllGuides: async (filters = {}) => {
    const params = {};
    if (filters.district) params.district = filters.district;
    if (filters.language) params.language = filters.language;
    if (filters.specialty) params.specialty = filters.specialty;
    if (filters.maxPrice) params.maxPrice = filters.maxPrice;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;

    const response = await apiClient.get('/api/v1/guides', { params });
    return response.data;
  },

  /**
   * GET /api/v1/guides/{id}
   */
  getGuideById: async (id) => {
    const response = await apiClient.get(`/api/v1/guides/${id}`);
    return response.data;
  },

  /**
   * GET /api/v1/guides/search?keyword=...
   */
  searchGuides: async (keyword) => {
    const response = await apiClient.get('/api/v1/guides/search', {
      params: { keyword },
    });
    return response.data;
  },

  /**
   * GET /api/v1/guides/{id}/reviews
   */
  getGuideReviews: async (id) => {
    const response = await apiClient.get(`/api/v1/guides/${id}/reviews`);
    return response.data;
  },

  /**
   * POST /api/v1/guides/{id}/reviews
   */
  writeReview: async (id, { rating, comment, bookingId }) => {
    const response = await apiClient.post(`/api/v1/guides/${id}/reviews`, {
      rating,
      comment,
      bookingId,
    });
    return response.data;
  },

  /**
   * GET /api/v1/guides/{id}/bookings
   * Used to derive guide availability (booked date ranges) for the calendar.
   */
  getGuideBookings: async (id) => {
    const response = await apiClient.get(`/api/v1/guides/${id}/bookings`);
    return response.data;
  },

  /**
   * POST /api/v1/guide-bookings
   */
  bookGuide: async ({ guideId, tripId, startDate, endDate, notes }) => {
    const response = await apiClient.post('/api/v1/guide-bookings', {
      guideId,
      tripId,
      startDate,
      endDate,
      notes,
    });
    return response.data;
  },

  /**
   * GET /api/v1/guide-bookings/my
   */
  getMyBookings: async () => {
    const response = await apiClient.get('/api/v1/guide-bookings/my');
    return response.data;
  },
};

export default guidesService;
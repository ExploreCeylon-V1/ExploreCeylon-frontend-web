import apiClient from './api';

/**
 * Destinations API service
 * Maps to: com.exploreceylon.backend.controller.DestinationController
 * Base path: /api/v1/destinations
 */
const destinationsService = {
  /**
   * GET /api/v1/destinations
   * @param {Object} filters
   * @param {string} [filters.category] - DestinationCategory enum value
   * @param {string} [filters.province]
   * @param {string} [filters.month]
   * @param {boolean} [filters.includeAll] - admin use: include inactive destinations
   */
  getAllDestinations: async (filters = {}) => {
    const params = {};
    if (filters.category) params.category = filters.category;
    if (filters.province) params.province = filters.province;
    if (filters.month) params.month = filters.month;
    if (filters.includeAll) params.includeAll = filters.includeAll;

    const response = await apiClient.get('/api/v1/destinations', { params });
    return response.data;
  },

  /**
   * GET /api/v1/destinations/featured
   */
  getFeatured: async () => {
    const response = await apiClient.get('/api/v1/destinations/featured');
    return response.data;
  },

  /**
   * GET /api/v1/destinations/search?keyword=...
   */
  search: async (keyword) => {
    const response = await apiClient.get('/api/v1/destinations/search', {
      params: { keyword },
    });
    return response.data;
  },

  /**
   * GET /api/v1/destinations/{id}
   */
  getById: async (id) => {
    const response = await apiClient.get(`/api/v1/destinations/${id}`);
    return response.data;
  },

  /**
   * GET /api/v1/destinations/nearby?lat=&lng=&limit=
   * Distance-sorted destinations near a point (nearest first).
   */
  getNearby: async (lat, lng, limit = 6) => {
    const response = await apiClient.get('/api/v1/destinations/nearby', {
      params: { lat, lng, limit },
    });
    return response.data;
  },
};

export default destinationsService;
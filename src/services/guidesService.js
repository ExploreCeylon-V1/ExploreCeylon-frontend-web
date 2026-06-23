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
};

export default guidesService;
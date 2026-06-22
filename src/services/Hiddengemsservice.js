import apiClient from './api';

/**
 * Hidden Gems API service
 * Maps to: com.exploreceylon.backend.controller.HiddenGemController
 * Base path: /api/v1/gems
 */
const hiddenGemsService = {
  /**
   * GET /api/v1/gems
   * @param {Object} filters
   * @param {string} [filters.category] - one of GemCategory enum values
   * @param {string} [filters.district]
   */
  getAllGems: async (filters = {}) => {
    const params = {};
    if (filters.category) params.category = filters.category;
    if (filters.district) params.district = filters.district;

    const response = await apiClient.get('/api/v1/gems', { params });
    return response.data;
  },

  /**
   * GET /api/v1/gems/{id}
   */
  getGemById: async (id) => {
    const response = await apiClient.get(`/api/v1/gems/${id}`);
    return response.data;
  },

  /**
   * GET /api/v1/gems/search?keyword=...
   */
  searchGems: async (keyword) => {
    const response = await apiClient.get('/api/v1/gems/search', {
      params: { keyword },
    });
    return response.data;
  },

  /**
   * POST /api/v1/gems/submit (authenticated traveler submission)
   * @param {Object} gemData - shape of CreateGemRequest
   */
  submitGem: async (gemData) => {
    const response = await apiClient.post('/api/v1/gems/submit', gemData);
    return response.data;
  },
};

export default hiddenGemsService;
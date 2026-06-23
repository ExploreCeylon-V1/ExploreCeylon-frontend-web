import apiClient from './api';

/**
 * Gem Reviews API service
 * Maps to: com.exploreceylon.backend.controller.GemReviewController
 * Base path: /api/v1/gems/{gemId}/reviews
 */
const reviewsService = {
  /**
   * GET /api/v1/gems/{gemId}/reviews
   */
  getReviewsForGem: async (gemId) => {
    const response = await apiClient.get(`/api/v1/gems/${gemId}/reviews`);
    return response.data;
  },

  /**
   * POST /api/v1/gems/{gemId}/reviews
   * Requires traveler to be logged in (apiClient attaches ec_traveler_token automatically)
   * @param {Object} reviewData - { travelerName, rating, comment }
   */
  addReview: async (gemId, reviewData) => {
    const response = await apiClient.post(
      `/api/v1/gems/${gemId}/reviews`,
      reviewData
    );
    return response.data;
  },

  /**
   * DELETE /api/v1/gems/{gemId}/reviews/{reviewId}
   */
  deleteReview: async (gemId, reviewId) => {
    const response = await apiClient.delete(
      `/api/v1/gems/${gemId}/reviews/${reviewId}`
    );
    return response.data;
  },
};

export default reviewsService;
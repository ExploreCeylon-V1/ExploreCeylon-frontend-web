import apiClient from './api';

/**
 * Destination Reviews API service
 * Maps to: com.exploreceylon.backend.controller.DestinationReviewController
 * Base path: /api/v1/destinations/{destinationId}/reviews
 */
const destinationReviewsService = {
  /**
   * GET /api/v1/destinations/{destinationId}/reviews
   */
  getReviewsForDestination: async (destinationId) => {
    const response = await apiClient.get(
      `/api/v1/destinations/${destinationId}/reviews`
    );
    return response.data;
  },

  /**
   * POST /api/v1/destinations/{destinationId}/reviews
   * Requires traveler to be logged in (apiClient attaches ec_traveler_token automatically)
   * @param {Object} reviewData - { travelerName, rating, comment }
   */
  addReview: async (destinationId, reviewData) => {
    const response = await apiClient.post(
      `/api/v1/destinations/${destinationId}/reviews`,
      reviewData
    );
    return response.data;
  },

  /**
   * DELETE /api/v1/destinations/{destinationId}/reviews/{reviewId}
   */
  deleteReview: async (destinationId, reviewId) => {
    const response = await apiClient.delete(
      `/api/v1/destinations/${destinationId}/reviews/${reviewId}`
    );
    return response.data;
  },
};

export default destinationReviewsService;
import apiClient from './api';

/**
 * Trips API service
 * Maps to: com.exploreceylon.backend.controller.TripController
 * Base path: /api/v1/trips
 */
const tripsService = {
  /**
   * GET /api/v1/trips/my
   * Returns trips for the logged-in traveler
   */
  getMyTrips: async () => {
    const response = await apiClient.get('/api/v1/trips/my');
    return response.data;
  },

  /**
   * GET /api/v1/trips/{id}
   * Returns full trip detail including days + items
   */
  getTripById: async (tripId) => {
    const response = await apiClient.get(`/api/v1/trips/${tripId}`);
    return response.data;
  },

  /**
   * POST /api/v1/trips/{tripId}/days/{dayId}/items
   * Adds an item (e.g. a gem) to a specific trip day
   * @param {Object} itemData - shape of TripDayItemRequest
   */
  addItemToDay: async (tripId, dayId, itemData) => {
    const response = await apiClient.post(
      `/api/v1/trips/${tripId}/days/${dayId}/items`,
      itemData
    );
    return response.data;
  },

  /**
   * DELETE /api/v1/trips/{tripId}/days/{dayId}/items/{itemId}
   */
  removeItemFromDay: async (tripId, dayId, itemId) => {
    const response = await apiClient.delete(
      `/api/v1/trips/${tripId}/days/${dayId}/items/${itemId}`
    );
    return response.data;
  },
};

export default tripsService;
import apiClient from './api';

/**
 * Service handling End-to-End Trip Planning API calls with single retry policy on network failure.
 */
class PlannerService {

  /**
   * Generates a complete 11-phase itinerary (unpersisted).
   * @param {Object} plannerRequest
   * @returns {Promise<Object>} PlannerResponse
   */
  async generatePlanner(plannerRequest) {
    return this._callWithRetry(() => apiClient.post('/api/v1/planner/generate', plannerRequest));
  }

  /**
   * Generates and persists a trip owned by the authenticated user.
   * @param {Object} plannerSaveRequest
   * @returns {Promise<Object>} PlannerSaveResponse
   */
  async generateAndSavePlanner(plannerSaveRequest) {
    return this._callWithRetry(() => apiClient.post('/api/v1/planner/generate-and-save', plannerSaveRequest));
  }

  /**
   * Fetches user's generated trip summaries.
   * @returns {Promise<Array>} Array of PlannerTripSummary
   */
  async getMyGeneratedTrips() {
    const res = await apiClient.get('/api/v1/planner/trips');
    return res.data;
  }

  /**
   * Fetches full generated trip itinerary by ID.
   * @param {number|string} tripId
   * @returns {Promise<Object>} PlannerResponse
   */
  async getGeneratedTripById(tripId) {
    const res = await apiClient.get(`/api/v1/planner/trips/${tripId}`);
    return res.data;
  }

  /**
   * Soft deletes a trip.
   * @param {number|string} tripId
   */
  async deleteGeneratedTrip(tripId) {
    await apiClient.delete(`/api/v1/planner/trips/${tripId}`);
  }

  /**
   * Private helper method executing an API request with a 1-time retry on network errors.
   */
  async _callWithRetry(apiFn, retryCount = 1) {
    try {
      const response = await apiFn();
      return response.data;
    } catch (error) {
      if (retryCount > 0 && (!error.response || error.code === 'ECONNABORTED' || error.message === 'Network Error')) {
        console.warn('Network issue detected during Planner API call. Retrying once...');
        return this._callWithRetry(apiFn, retryCount - 1);
      }
      throw error;
    }
  }
}

const plannerService = new PlannerService();
export default plannerService;

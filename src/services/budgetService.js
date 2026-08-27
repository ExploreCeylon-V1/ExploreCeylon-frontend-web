import apiClient from './api';

/**
 * Budget API service
 * Maps to: com.exploreceylon.backend.controller.BudgetController
 * Base path: /api/v1/budget
 */
const budgetService = {
  /**
   * GET /api/v1/budget/trip/{tripId}
   * Returns { id, tripId, tripTitle, totalBudget, currency, items[] }.
   * Throws (backend error) when the trip has no budget yet.
   */
  getBudgetByTrip: async (tripId) => {
    const res = await apiClient.get(`/api/v1/budget/trip/${tripId}`);
    return res.data;
  },

  /**
   * POST /api/v1/budget
   */
  createBudget: async (tripId, totalBudget, currency = 'USD') => {
    const res = await apiClient.post('/api/v1/budget', {
      tripId, totalBudget, currency,
    });
    return res.data;
  },

  /**
   * PUT /api/v1/budget/{budgetId}?totalBudget=&currency=
   */
  updateBudget: async (budgetId, totalBudget, currency) => {
    const params = {};
    if (totalBudget != null) params.totalBudget = totalBudget;
    if (currency) params.currency = currency;
    const res = await apiClient.put(`/api/v1/budget/${budgetId}`, null, { params });
    return res.data;
  },

  /**
   * PUT /api/v1/budget/{budgetId}/categories
   * @param {Object} allocations - e.g. { HOTEL: 350, FOOD: 70 }
   */
  updateCategoryBudgets: async (budgetId, allocations) => {
    const res = await apiClient.put(
      `/api/v1/budget/${budgetId}/categories`, allocations);
    return res.data;
  },

  /**
   * POST /api/v1/budget/{budgetId}/repair-dates
   * One-time backfill: re-derives auto-added items' dates from their
   * referenced booking, for items created before that was fixed.
   */
  repairAutoAddedDates: async (budgetId) => {
    const res = await apiClient.post(`/api/v1/budget/${budgetId}/repair-dates`);
    return res.data;
  },

  /**
   * POST /api/v1/budget/{budgetId}/items
   * @param {Object} item - shape of AddBudgetItemRequest:
   *   { category, title, amount, currency?, date? (yyyy-MM-dd), notes?, referenceId? }
   */
  addItem: async (budgetId, item) => {
    const res = await apiClient.post(`/api/v1/budget/${budgetId}/items`, item);
    return res.data;
  },

  /**
   * PUT /api/v1/budget/{budgetId}/items/{itemId}
   */
  updateItem: async (budgetId, itemId, item) => {
    const res = await apiClient.put(
      `/api/v1/budget/${budgetId}/items/${itemId}`, item);
    return res.data;
  },

  /**
   * DELETE /api/v1/budget/{budgetId}/items/{itemId}
   */
  deleteItem: async (budgetId, itemId) => {
    await apiClient.delete(`/api/v1/budget/${budgetId}/items/${itemId}`);
  },

  /**
   * GET /api/v1/budget/trip/{tripId}/summary?currency=
   */
  getSummary: async (tripId, currency) => {
    const res = await apiClient.get(`/api/v1/budget/trip/${tripId}/summary`, {
      params: currency ? { currency } : {},
    });
    return res.data;
  },

  /**
   * GET /api/v1/budget/trip/{tripId}/syncable-bookings
   */
  getSyncableBookings: async (tripId) => {
    const res = await apiClient.get(`/api/v1/budget/trip/${tripId}/syncable-bookings`);
    return res.data;
  },

  /**
   * POST /api/v1/budget/trip/{tripId}/sync-booking/{type}/{bookingId}
   */
  syncBookingToBudget: async (tripId, type, bookingId) => {
    const res = await apiClient.post(`/api/v1/budget/trip/${tripId}/sync-booking/${type}/${bookingId}`);
    return res.data;
  },
};

export default budgetService;

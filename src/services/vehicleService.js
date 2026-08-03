import apiClient from "./api";

function dateRangeParams({ startDate, endDate } = {}) {
  if (!startDate || !endDate) return {};
  return { startDate, endDate };
}

export const vehicleService = {
  getAllVehicles: async (range) => {
    const res = await apiClient.get("/api/v1/vehicles/local", {
      params: dateRangeParams(range),
    });
    return res.data;
  },
  getVehicleById: async (id) => {
    const res = await apiClient.get(`/api/v1/vehicles/local/${id}`);
    return res.data;
  },
  getTukTuks: async (range) => {
    const res = await apiClient.get("/api/v1/vehicles/local/tuktuks", {
      params: dateRangeParams(range),
    });
    return res.data;
  },
  searchVehicles: async (filters) => {
    const res = await apiClient.post("/api/v1/vehicles/local/search", filters);
    return res.data;
  },

  // GET /api/v1/vehicles/local/{id}/reviews
  getVehicleReviews: async (id) => {
    const response = await apiClient.get(`/api/v1/vehicles/local/${id}/reviews`);
    return response.data;
  },

  // POST /api/v1/vehicles/local/{id}/reviews
  writeReview: async (id, { rating, comment, bookingId }) => {
    const response = await apiClient.post(`/api/v1/vehicles/local/${id}/reviews`, {
      rating,
      comment,
      bookingId,
    });
    return response.data;
  },
};

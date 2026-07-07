import apiClient from "./api";

const BASE_URL = "http://localhost:8080/api/v1/vehicles/local";

function dateRangeQuery({ startDate, endDate } = {}) {
  if (!startDate || !endDate) return "";
  return `?${new URLSearchParams({ startDate, endDate })}`;
}

export const vehicleService = {
  getAllVehicles: async (range) => {
    const res = await fetch(`${BASE_URL}${dateRangeQuery(range)}`);
    if (!res.ok) throw new Error("Failed to fetch vehicles");
    return res.json();
  },
  getVehicleById: async (id) => {
    const res = await fetch(`${BASE_URL}/${id}`);
    if (!res.ok) throw new Error("Failed to fetch vehicle");
    return res.json();
  },
  getTukTuks: async (range) => {
    const res = await fetch(`${BASE_URL}/tuktuks${dateRangeQuery(range)}`);
    if (!res.ok) throw new Error("Failed to fetch tuk-tuks");
    return res.json();
  },
  getAirportTransfers: async (range) => {
    const res = await fetch(`${BASE_URL}/airport-transfers${dateRangeQuery(range)}`);
    if (!res.ok) throw new Error("Failed to fetch airport transfers");
    return res.json();
  },
  searchVehicles: async (filters) => {
    const res = await fetch(`${BASE_URL}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filters),
    });
    if (!res.ok) throw new Error("Search failed");
    return res.json();
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

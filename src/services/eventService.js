import axios from "axios";
import { getToken } from "../utils/authStorage";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const EVENTS_URL = `${API_BASE}/api/v1/events`;

// Attach JWT token if present (matches your auth interceptor pattern)
const authHeader = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const eventService = {
  // GET /api/v1/events  (supports ?month=&region=&category=)
  getAllEvents: async (filters = {}) => {
    const params = {};
    if (filters.month) params.month = filters.month;
    if (filters.region) params.region = filters.region;
    if (filters.category) params.category = filters.category;

    const res = await axios.get(EVENTS_URL, { params, headers: authHeader() });
    return res.data;
  },

  // GET /api/v1/events/upcoming
  getUpcomingEvents: async () => {
    const res = await axios.get(`${EVENTS_URL}/upcoming`, { headers: authHeader() });
    return res.data;
  },

  // GET /api/v1/events/{id}
  getEventById: async (id) => {
    const res = await axios.get(`${EVENTS_URL}/${id}`, { headers: authHeader() });
    return res.data;
  },

  // GET /api/v1/events/trip-sync?startDate=&endDate=
  getTripSyncEvents: async (startDate, endDate) => {
    const res = await axios.get(`${EVENTS_URL}/trip-sync`, {
      params: { startDate, endDate },
      headers: authHeader(),
    });
    return res.data;
  },
};

export default eventService;
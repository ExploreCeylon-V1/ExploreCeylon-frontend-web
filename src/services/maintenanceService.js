import apiClient from "./api";

/**
 * Maintenance mode API service
 * Maps to: com.exploreceylon.backend.controller.MaintenanceController
 * Public endpoint — checked on app load, before a user is authenticated.
 */
const maintenanceService = {
  /**
   * GET /api/v1/maintenance/status
   */
  getStatus: async () => {
    const response = await apiClient.get("/api/v1/maintenance/status");
    return response.data;
  },
};

export default maintenanceService;

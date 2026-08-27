import apiClient from './api';

/**
 * Verification API service (KYC Gate)
 * Maps to: com.exploreceylon.backend.controller.UserVerificationController
 * Base path: /api/v1/verification
 */
const verificationService = {
  /**
   * GET /api/v1/verification/status
   * Returns current user's latest verification status + rejection reason if any.
   * { status: "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED", canSubmit: boolean, ... }
   */
  getStatus: async () => {
    const response = await apiClient.get('/api/v1/verification/status');
    return response.data;
  },

  /**
   * POST /api/v1/verification/submit
   * Multipart upload (nationality, documentType, frontImage, backImage nullable)
   */
  submitVerification: async ({ nationality, documentType, frontImage, backImage }) => {
    const formData = new FormData();
    formData.append('nationality', nationality);
    formData.append('documentType', documentType);
    if (frontImage) {
      formData.append('frontImage', frontImage);
    }
    if (backImage) {
      formData.append('backImage', backImage);
    }

    const response = await apiClient.post('/api/v1/verification/submit', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default verificationService;

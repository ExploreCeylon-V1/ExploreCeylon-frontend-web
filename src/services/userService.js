import apiClient from './api';

/**
 * User API service
 * Maps to: com.exploreceylon.backend.controller.UserController
 * Base path: /api/v1/users
 */
const userService = {
  /**
   * GET /api/v1/users/count — public total registered user count
   */
  getCount: async () => {
    const response = await apiClient.get('/api/v1/users/count');
    return response.data;
  },

  // ── Current user profile ─────────────────────────────────
  getMe: async () => {
    const response = await apiClient.get('/api/v1/users/me');
    return response.data;
  },

  // Accepts any subset of { name, phone, nationality, language }
  updateProfile: async (fields) => {
    const response = await apiClient.put('/api/v1/users/me', fields);
    return response.data;
  },

  // POST /api/v1/auth/change-password  { currentPassword?, newPassword, confirmPassword }
  // currentPassword is omitted for Google users creating a password for the first time.
  changePassword: async (currentPassword, newPassword, confirmPassword) => {
    const response = await apiClient.post('/api/v1/auth/change-password', {
      currentPassword: currentPassword || undefined,
      newPassword,
      confirmPassword,
    });
    return response.data;
  },

  // ── Profile photo ────────────────────────────────────────
  uploadPhoto: async (file) => {
    const form = new FormData();
    form.append('file', file);
    const response = await apiClient.post('/api/v1/users/me/photo', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data; // { profilePhoto }
  },

  deletePhoto: async () => {
    const response = await apiClient.delete('/api/v1/users/me/photo');
    return response.data;
  },

  // ── Account ──────────────────────────────────────────────
  deactivate: async () => {
    const response = await apiClient.post('/api/v1/users/me/deactivate');
    return response.data;
  },

  // ── Phone OTP ────────────────────────────────────────────
  sendPhoneOtp: async () => {
    const response = await apiClient.post('/api/v1/users/me/phone/send-otp');
    return response.data; // { message, devCode? }
  },

  verifyPhoneOtp: async (code) => {
    const response = await apiClient.post('/api/v1/users/me/phone/verify-otp', { code });
    return response.data; // { phoneVerified }
  },

  // ── Email verification ───────────────────────────────────
  sendEmailVerification: async () => {
    const response = await apiClient.post('/api/v1/users/me/email/send-verification');
    return response.data; // { message, devCode? }
  },

  verifyEmail: async (code) => {
    const response = await apiClient.post('/api/v1/users/me/email/verify', { code });
    return response.data; // { emailVerified }
  },
};

export default userService;

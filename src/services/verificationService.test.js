import { describe, it, expect, vi, beforeEach } from 'vitest';
import verificationService from './verificationService';
import apiClient from './api';

vi.mock('./api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('verificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getStatus', () => {
    it('calls GET /api/v1/verification/status and returns response data', async () => {
      const mockData = {
        status: 'PENDING',
        canSubmit: false,
        nationality: 'Sri Lankan',
        documentType: 'NIC',
        rejectionReason: null,
      };
      apiClient.get.mockResolvedValueOnce({ data: mockData });

      const result = await verificationService.getStatus();

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/verification/status');
      expect(result).toEqual(mockData);
    });
  });

  describe('submitVerification', () => {
    it('appends fields to FormData and calls POST /api/v1/verification/submit', async () => {
      const mockResponse = {
        status: 'PENDING',
        canSubmit: false,
      };
      apiClient.post.mockResolvedValueOnce({ data: mockResponse });

      const mockFrontFile = new File(['front'], 'front.jpg', { type: 'image/jpeg' });
      const mockBackFile = new File(['back'], 'back.jpg', { type: 'image/jpeg' });

      const result = await verificationService.submitVerification({
        nationality: 'Sri Lankan',
        documentType: 'NIC',
        frontImage: mockFrontFile,
        backImage: mockBackFile,
      });

      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/v1/verification/submit',
        expect.any(FormData),
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      expect(result).toEqual(mockResponse);
    });
  });
});

import apiClient from './api';

/**
 * Upload service
 * Maps to: com.exploreceylon.backend.controller.UploadController
 * (multipart/form-data pattern — files are sent to YOUR backend,
 * which then forwards them to S3 and returns the public URLs)
 */
const uploadService = {
  /**
   * POST /api/v1/upload/multiple?folder=gems
   * Uploads several files in a single request.
   * @param {File[]} files
   * @returns {Promise<string[]>} array of public S3 image URLs, in order
   */
  uploadMultiple: async (files) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await apiClient.post(
      '/api/v1/upload/multiple',
      formData,
      {
        params: { folder: 'gems' },
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );

    // Backend returns List<UploadResponse>, e.g. [{ imageUrl, fileName, success, message }, ...]
    return response.data.map((item) => item.imageUrl);
  },

  /**
   * POST /api/v1/upload/single?folder=gems
   * Uploads a single file. Kept for cases where only one photo is needed.
   * @param {File} file
   * @returns {Promise<string>} public S3 image URL
   */
  uploadSingle: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post(
      '/api/v1/upload/single',
      formData,
      {
        params: { folder: 'gems' },
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );

    return response.data.imageUrl;
  },

  /**
   * DELETE /api/v1/upload?imageUrl=...
   */
  deleteImage: async (imageUrl) => {
    const response = await apiClient.delete('/api/v1/upload', {
      params: { imageUrl },
    });
    return response.data;
  },
};

export default uploadService;
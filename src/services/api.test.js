import { beforeEach, describe, expect, it, vi } from 'vitest';

// Captured interceptor callbacks, filled in when api.js registers them via
// `.interceptors.request.use(...)` / `.interceptors.response.use(...)`.
let requestOnFulfilled;
let requestOnRejected;
let responseOnFulfilled;
let responseOnRejected;

const mockAxiosPost = vi.fn();

// The axios "instance" api.js gets back from axios.create(). It must be
// callable (apiClient(originalRequest) is used to retry a request) and carry
// an `.interceptors` object whose `.use()` calls we capture.
const mockInstance = vi.fn();
mockInstance.interceptors = {
  request: {
    use: vi.fn((onFulfilled, onRejected) => {
      requestOnFulfilled = onFulfilled;
      requestOnRejected = onRejected;
    }),
  },
  response: {
    use: vi.fn((onFulfilled, onRejected) => {
      responseOnFulfilled = onFulfilled;
      responseOnRejected = onRejected;
    }),
  },
};

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => mockInstance),
    post: (...args) => mockAxiosPost(...args),
  },
}));

vi.mock('../utils/authStorage', () => ({
  getToken: vi.fn(),
  getRefreshToken: vi.fn(),
  updateAccessToken: vi.fn(),
  clearAuth: vi.fn(),
}));

const { getToken, getRefreshToken, updateAccessToken, clearAuth } = await import(
  '../utils/authStorage'
);

// Importing this module is what runs axios.create(...) and registers the
// interceptors above — do it once, top-level, like the app does.
await import('./api');

describe('apiClient request interceptor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('adds an Authorization header when a token is present and no header exists', () => {
    getToken.mockReturnValue('abc123');

    const config = requestOnFulfilled({ headers: {} });

    expect(config.headers.Authorization).toBe('Bearer abc123');
  });

  it('does NOT overwrite an existing Authorization header (e.g. from retry logic)', () => {
    getToken.mockReturnValue('stale-token');

    const config = requestOnFulfilled({
      headers: { Authorization: 'Bearer fresh-new-token' },
    });

    expect(config.headers.Authorization).toBe('Bearer fresh-new-token');
  });

  it('leaves the config untouched when there is no token', () => {
    getToken.mockReturnValue(null);

    const config = requestOnFulfilled({ headers: {} });

    expect(config.headers.Authorization).toBeUndefined();
  });

  it('rejects on request error', async () => {
    const error = new Error('boom');
    await expect(requestOnRejected(error)).rejects.toBe(error);
  });
});

describe('apiClient response interceptor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInstance.mockReset();
    Object.defineProperty(window, 'location', {
      value: { pathname: '/dashboard', href: '' },
      writable: true,
      configurable: true,
    });
  });

  it('passes successful responses straight through', () => {
    const response = { data: 'ok' };
    expect(responseOnFulfilled(response)).toBe(response);
  });

  it('refreshes the token and retries the original request on a 401', async () => {
    getRefreshToken.mockReturnValue('refresh-token-value');
    mockAxiosPost.mockResolvedValue({
      data: {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token-value',
      },
    });
    mockInstance.mockResolvedValue({ data: 'retried-ok' });

    const originalRequest = { url: '/api/v1/users/me', headers: {} };
    const error = { response: { status: 401 }, config: originalRequest };

    const result = await responseOnRejected(error);

    expect(mockAxiosPost).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/auth/refresh-token'),
      { refreshToken: 'refresh-token-value' }
    );
    expect(updateAccessToken).toHaveBeenCalledWith('new-access-token', 'new-refresh-token-value');
    expect(originalRequest._retried).toBe(true);
    expect(originalRequest.headers.Authorization).toBe('Bearer new-access-token');
    expect(mockInstance).toHaveBeenCalledWith(originalRequest);
    expect(result).toEqual({ data: 'retried-ok' });
  });

  it('calls headers.set() when originalRequest.headers is an AxiosHeaders instance', async () => {
    getRefreshToken.mockReturnValue('refresh-token-value');
    mockAxiosPost.mockResolvedValue({
      data: {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token-value',
      },
    });
    mockInstance.mockResolvedValue({ data: 'retried-ok' });

    const mockHeaders = {
      set: vi.fn(),
    };
    const originalRequest = { url: '/api/v1/trips/23/days', headers: mockHeaders };
    const error = { response: { status: 401 }, config: originalRequest };

    const result = await responseOnRejected(error);

    expect(mockHeaders.set).toHaveBeenCalledWith('Authorization', 'Bearer new-access-token');
    expect(mockInstance).toHaveBeenCalledWith(originalRequest);
    expect(result).toEqual({ data: 'retried-ok' });
  });

  it('does not retry a request a second time (_retried guard)', async () => {
    const originalRequest = { url: '/api/v1/users/me', headers: {}, _retried: true };
    const error = { response: { status: 401 }, config: originalRequest };

    await expect(responseOnRejected(error)).rejects.toBe(error);
    expect(mockAxiosPost).not.toHaveBeenCalled();
    expect(mockInstance).not.toHaveBeenCalled();
  });

  it('skips refresh logic entirely for auth endpoints', async () => {
    const originalRequest = { url: '/api/v1/auth/login', headers: {} };
    const error = { response: { status: 401 }, config: originalRequest };

    await expect(responseOnRejected(error)).rejects.toBe(error);
    expect(mockAxiosPost).not.toHaveBeenCalled();
  });

  it('clears auth and redirects to /login when the refresh fails', async () => {
    getRefreshToken.mockReturnValue(null);

    const originalRequest = { url: '/api/v1/users/me', headers: {} };
    const error = { response: { status: 401 }, config: originalRequest };

    responseOnRejected(error);

    await vi.waitFor(() => {
      expect(clearAuth).toHaveBeenCalled();
      expect(window.location.href).toBe('/login');
    });
  });

  it('does not redirect again when already on /login', async () => {
    window.location.pathname = '/login';
    getRefreshToken.mockReturnValue(null);

    const originalRequest = { url: '/api/v1/users/me', headers: {} };
    const error = { response: { status: 401 }, config: originalRequest };

    await expect(responseOnRejected(error)).rejects.toBe(error);

    expect(clearAuth).toHaveBeenCalled();
    expect(window.location.href).toBe('');
  });

  it('passes non-401 errors straight through without touching refresh logic', async () => {
    const originalRequest = { url: '/api/v1/users/me', headers: {} };
    const error = { response: { status: 500 }, config: originalRequest };

    await expect(responseOnRejected(error)).rejects.toBe(error);
    expect(mockAxiosPost).not.toHaveBeenCalled();
  });
});

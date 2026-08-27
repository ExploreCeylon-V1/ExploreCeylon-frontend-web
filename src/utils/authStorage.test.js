import { describe, it, expect, beforeEach } from 'vitest';
import {
  TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  USER_KEY,
  saveAuth,
  getToken,
  getRefreshToken,
  updateAccessToken,
  getStoredUser,
  clearAuth,
} from './authStorage';

describe('authStorage utility', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('saveAuth & getToken / getRefreshToken', () => {
    it('saves to localStorage when remember is true', () => {
      saveAuth('token-abc', { id: 1, name: 'Kasun' }, true, 'refresh-xyz');

      expect(localStorage.getItem(TOKEN_KEY)).toBe('token-abc');
      expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBe('refresh-xyz');
      expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull();
      expect(getToken()).toBe('token-abc');
      expect(getRefreshToken()).toBe('refresh-xyz');
    });

    it('saves to sessionStorage when remember is false', () => {
      saveAuth('token-session', { id: 2, name: 'John' }, false, 'refresh-session');

      expect(sessionStorage.getItem(TOKEN_KEY)).toBe('token-session');
      expect(sessionStorage.getItem(REFRESH_TOKEN_KEY)).toBe('refresh-session');
      expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
      expect(getToken()).toBe('token-session');
      expect(getRefreshToken()).toBe('refresh-session');
    });
  });

  describe('updateAccessToken', () => {
    it('updates accessToken and refreshToken in localStorage when active session is in localStorage', () => {
      localStorage.setItem(TOKEN_KEY, 'old-token');
      localStorage.setItem(USER_KEY, JSON.stringify({ id: 1 }));
      localStorage.setItem(REFRESH_TOKEN_KEY, 'old-refresh');

      updateAccessToken('fresh-access-token', 'fresh-refresh-token');

      expect(localStorage.getItem(TOKEN_KEY)).toBe('fresh-access-token');
      expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBe('fresh-refresh-token');
      expect(getToken()).toBe('fresh-access-token');
      expect(getRefreshToken()).toBe('fresh-refresh-token');
    });

    it('updates accessToken and refreshToken in sessionStorage when active session is in sessionStorage', () => {
      sessionStorage.setItem(TOKEN_KEY, 'old-session-token');
      sessionStorage.setItem(USER_KEY, JSON.stringify({ id: 2 }));
      sessionStorage.setItem(REFRESH_TOKEN_KEY, 'old-session-refresh');

      updateAccessToken('fresh-session-access', 'fresh-session-refresh');

      expect(sessionStorage.getItem(TOKEN_KEY)).toBe('fresh-session-access');
      expect(sessionStorage.getItem(REFRESH_TOKEN_KEY)).toBe('fresh-session-refresh');
      expect(getToken()).toBe('fresh-session-access');
      expect(getRefreshToken()).toBe('fresh-session-refresh');
    });

    it('updates BOTH stores if both currently hold tokens to prevent split-brain', () => {
      localStorage.setItem(TOKEN_KEY, 'local-old');
      sessionStorage.setItem(TOKEN_KEY, 'session-old');

      updateAccessToken('universal-fresh-token', 'universal-fresh-refresh');

      expect(localStorage.getItem(TOKEN_KEY)).toBe('universal-fresh-token');
      expect(sessionStorage.getItem(TOKEN_KEY)).toBe('universal-fresh-token');
      expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBe('universal-fresh-refresh');
      expect(sessionStorage.getItem(REFRESH_TOKEN_KEY)).toBe('universal-fresh-refresh');
      expect(getToken()).toBe('universal-fresh-token');
    });

    it('defaults to localStorage if no store holds tokens yet', () => {
      updateAccessToken('brand-new-token', 'brand-new-refresh');

      expect(localStorage.getItem(TOKEN_KEY)).toBe('brand-new-token');
      expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBe('brand-new-refresh');
      expect(getToken()).toBe('brand-new-token');
    });
  });

  describe('clearAuth', () => {
    it('clears all auth keys across both localStorage and sessionStorage', () => {
      localStorage.setItem(TOKEN_KEY, 'local-tok');
      localStorage.setItem(REFRESH_TOKEN_KEY, 'local-ref');
      sessionStorage.setItem(TOKEN_KEY, 'sess-tok');
      sessionStorage.setItem(REFRESH_TOKEN_KEY, 'sess-ref');

      clearAuth();

      expect(getToken()).toBeNull();
      expect(getRefreshToken()).toBeNull();
      expect(getStoredUser()).toBeNull();
    });
  });
});

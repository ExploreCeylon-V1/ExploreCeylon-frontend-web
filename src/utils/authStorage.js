// Single source of truth for where the traveler's auth token/user live.
//
// "Remember me" decides the backing store:
//  - remember === true  → localStorage  (survives browser restarts)
//  - remember === false → sessionStorage (cleared when the tab/window closes)
//
// Every reader must look in BOTH stores, otherwise a session-only login would
// be invisible to code that only checks localStorage.

export const TOKEN_KEY = "ec_traveler_token";
export const USER_KEY = "ec_traveler_user";
export const REFRESH_TOKEN_KEY = "ec_traveler_refresh_token";

/** Persist token + user (+ optional refresh token) in the chosen store, clearing any previous copy first. */
export function saveAuth(token, user, remember = true, refreshToken = null) {
  const existingRefreshToken = getRefreshToken();
  const tokenToKeep = refreshToken || existingRefreshToken;
  clearAuth();
  const store = remember ? localStorage : sessionStorage;
  store.setItem(TOKEN_KEY, token);
  store.setItem(USER_KEY, JSON.stringify(user));
  if (tokenToKeep) store.setItem(REFRESH_TOKEN_KEY, tokenToKeep);
}

/** Token from whichever store holds it (localStorage wins if both somehow set). */
export function getToken() {
  return (
    localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || null
  );
}

/** Refresh token from whichever store holds it. */
export function getRefreshToken() {
  return (
    localStorage.getItem(REFRESH_TOKEN_KEY) || sessionStorage.getItem(REFRESH_TOKEN_KEY) || null
  );
}

/** Swap in a freshly-issued access token, keeping it in whichever store currently holds auth. */
export function updateAccessToken(token) {
  const store = localStorage.getItem(TOKEN_KEY) ? localStorage : sessionStorage;
  store.setItem(TOKEN_KEY, token);
}

/** Parsed user object, or null if absent/corrupted. */
export function getStoredUser() {
  const raw =
    localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Merge a partial into the stored user, in whichever store currently holds it. */
export function updateStoredUser(partial) {
  const store = localStorage.getItem(USER_KEY)
    ? localStorage
    : sessionStorage.getItem(USER_KEY)
      ? sessionStorage
      : null;
  if (!store) return null;
  let current;
  try {
    current = JSON.parse(store.getItem(USER_KEY)) || {};
  } catch {
    current = {};
  }
  const merged = { ...current, ...partial };
  store.setItem(USER_KEY, JSON.stringify(merged));
  return merged;
}

/** Wipe token + user + refresh token from both stores. */
export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}

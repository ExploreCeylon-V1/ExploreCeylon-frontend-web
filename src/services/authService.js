import apiClient from "./api";
import { getToken as readToken, getStoredUser } from "../utils/authStorage";
import { parseAuthError } from "../utils/authError";

export async function login(credentials) {
  try {
    const response = await apiClient.post("/api/v1/auth/login", credentials);
    const data = response.data;

    // Traveler site ekata ena wenath account types block kireema
    if (data.role !== "TRAVELER") {
      throw new Error("This account type isn't supported on the traveler site.");
    }

    return data;
  } catch (err) {
    throw new Error(parseAuthError(err, "Login failed"), { cause: err });
  }
}

export async function register(userData) {
  try {
    const response = await apiClient.post("/api/v1/auth/register", userData);
    return response.data;
  } catch (err) {
    throw new Error(parseAuthError(err, "Registration failed"), { cause: err });
  }
}

export function getToken() {
  return readToken();
}

export function getUser() {
  return getStoredUser();
}

//google auth function
export async function googleLogin(googleAccessToken) {
  try {
    // Backend ekata google token eka yawanawa
    const response = await apiClient.post("/api/v1/auth/google", {
      token: googleAccessToken
    });

    const data = response.data;

    // Traveler site ekata ena wenath account types block kireema
    if (data.role !== "TRAVELER") {
      throw new Error("This account type isn't supported on the traveler site.");
    }

    return data;
  } catch (err) {
    throw new Error(parseAuthError(err, "Google Sign-In failed"), { cause: err });
  }
}

// ── Forgot Password ──────────────────────────────────────
// POST /api/v1/auth/forgot-password — always resolves on any syntactically valid
// email; the backend intentionally never reveals whether the address exists.
export async function forgotPassword(email) {
  try {
    const response = await apiClient.post(
      "/api/v1/auth/forgot-password",
      { email },
      { timeout: 15000 }
    );
    return response.data;
  } catch (err) {
    throw new Error(parseAuthError(err, "Couldn't request a password reset. Please try again."), { cause: err });
  }
}

// POST /api/v1/auth/verify-reset-code — pre-check only, does not consume the code.
export async function verifyResetCode(email, code) {
  try {
    const response = await apiClient.post(
      "/api/v1/auth/verify-reset-code",
      { email, code },
      { timeout: 15000 }
    );
    return response.data;
  } catch (err) {
    throw new Error(parseAuthError(err, "Invalid or expired code."), { cause: err });
  }
}

// POST /api/v1/auth/reset-password
export async function resetPassword(email, code, newPassword, confirmPassword) {
  try {
    const response = await apiClient.post(
      "/api/v1/auth/reset-password",
      { email, code, newPassword, confirmPassword },
      { timeout: 15000 }
    );
    return response.data;
  } catch (err) {
    throw new Error(parseAuthError(err, "Couldn't reset your password. Please try again."), { cause: err });
  }
}
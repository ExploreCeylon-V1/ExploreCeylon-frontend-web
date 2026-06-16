import apiClient from "./api";

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
    // Backend error message eka hariyata allaganeema
    throw new Error(err.response?.data?.message || err.message || "Login failed");
  }
}

export async function register(userData) {
  try {
    const response = await apiClient.post("/api/v1/auth/register", userData);
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || err.message || "Registration failed");
  }
}

export function getToken() {
  return localStorage.getItem("ec_traveler_token");
}

export function getUser() {
  const user = localStorage.getItem("ec_traveler_user");
  return user ? JSON.parse(user) : null;
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
    throw new Error(err.response?.data?.message || err.message || "Google Sign-In failed");
  }
}
const BASE_URL = "http://localhost:8080/api/v1/vehicles/local";

export const vehicleService = {
  getAllVehicles: async () => {
    const res = await fetch(BASE_URL);
    if (!res.ok) throw new Error("Failed to fetch vehicles");
    return res.json();
  },
  getVehicleById: async (id) => {
    const res = await fetch(`${BASE_URL}/${id}`);
    if (!res.ok) throw new Error("Failed to fetch vehicle");
    return res.json();
  },
  getTukTuks: async () => {
    const res = await fetch(`${BASE_URL}/tuktuks`);
    if (!res.ok) throw new Error("Failed to fetch tuk-tuks");
    return res.json();
  },
  getAirportTransfers: async () => {
    const res = await fetch(`${BASE_URL}/airport-transfers`);
    if (!res.ok) throw new Error("Failed to fetch airport transfers");
    return res.json();
  },
  searchVehicles: async (filters) => {
    const res = await fetch(`${BASE_URL}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filters),
    });
    if (!res.ok) throw new Error("Search failed");
    return res.json();
  },
};

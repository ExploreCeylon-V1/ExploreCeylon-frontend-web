import { describe, it, expect } from "vitest";
import {
  SRI_LANKA_DISTRICTS,
  normalizeDistrictName,
  resolveLocationToDistrict,
  getCorridorDistrictsBetween,
  getTripRouteDistricts,
  isIslandWideEvent,
  isEventDateMatchingTrip,
  isEventMatchingTrip,
  filterEventsForTrip,
} from "./sriLankaRouteDistricts";

describe("sriLankaRouteDistricts Utility", () => {
  describe("District and Town Normalization", () => {
    it("recognizes all 25 official administrative districts", () => {
      expect(SRI_LANKA_DISTRICTS).toHaveLength(25);
      expect(normalizeDistrictName("Colombo")).toBe("Colombo");
      expect(normalizeDistrictName("kandy")).toBe("Kandy");
      expect(normalizeDistrictName("nuwara eliya district")).toBe("Nuwara Eliya");
      expect(normalizeDistrictName("galle")).toBe("Galle");
      expect(normalizeDistrictName("kegalle")).toBe("Kegalle");
      expect(normalizeDistrictName("matale")).toBe("Matale");
      expect(normalizeDistrictName("matara")).toBe("Matara");
    });

    it("resolves tourist hubs and cities to their administrative districts without substring collision", () => {
      expect(resolveLocationToDistrict("Ella")).toBe("Badulla");
      expect(resolveLocationToDistrict("Sigiriya")).toBe("Matale");
      expect(resolveLocationToDistrict("Dambulla")).toBe("Matale");
      expect(resolveLocationToDistrict("Mirissa")).toBe("Matara");
      expect(resolveLocationToDistrict("Weligama")).toBe("Matara");
      expect(resolveLocationToDistrict("Pinnawala")).toBe("Kegalle");
      expect(resolveLocationToDistrict("Kitulgala")).toBe("Kegalle");
      expect(resolveLocationToDistrict("Bentota")).toBe("Galle");
      expect(resolveLocationToDistrict("Hikkaduwa")).toBe("Galle");
      expect(resolveLocationToDistrict("Unawatuna")).toBe("Galle");
      expect(resolveLocationToDistrict("Tangalle")).toBe("Hambantota");
      expect(resolveLocationToDistrict("Yala")).toBe("Hambantota");
      expect(resolveLocationToDistrict("Arugam Bay")).toBe("Ampara");
      expect(resolveLocationToDistrict("Negombo")).toBe("Gampaha");
      expect(resolveLocationToDistrict("Pasikuda")).toBe("Batticaloa");
      expect(resolveLocationToDistrict("Nilaveli")).toBe("Trincomalee");
      expect(resolveLocationToDistrict("Nallur")).toBe("Jaffna");
      expect(resolveLocationToDistrict("Nuwara Eliya Town")).toBe("Nuwara Eliya");
    });
  });

  describe("Route Corridor Resolution", () => {
    it("returns single district when start and end are the same", () => {
      const districts = getCorridorDistrictsBetween("Kandy", "Kandy");
      expect(districts).toEqual(["Kandy"]);
    });

    it("returns highway corridor districts for Colombo -> Badulla (Ella)", () => {
      const districts = getCorridorDistrictsBetween("Colombo", "Badulla");
      expect(districts).toContain("Colombo");
      expect(districts).toContain("Kegalle");
      expect(districts).toContain("Ratnapura");
      expect(districts).toContain("Badulla");
      expect(districts).not.toContain("Jaffna");
    });

    it("returns highway corridor districts for Colombo -> Kandy", () => {
      const districts = getCorridorDistrictsBetween("Colombo", "Kandy");
      expect(districts).toContain("Colombo");
      expect(districts).toContain("Gampaha");
      expect(districts).toContain("Kegalle");
      expect(districts).toContain("Kandy");
      expect(districts).not.toContain("Galle");
    });

    it("returns highway corridor districts for Colombo -> Matara (South Coast)", () => {
      const districts = getCorridorDistrictsBetween("Colombo", "Matara");
      expect(districts).toContain("Colombo");
      expect(districts).toContain("Kalutara");
      expect(districts).toContain("Galle");
      expect(districts).toContain("Matara");
      expect(districts).not.toContain("Kandy");
    });

    it("returns highway corridor districts for Colombo -> Matale (Sigiriya / Dambulla)", () => {
      const districts = getCorridorDistrictsBetween("Colombo", "Matale");
      expect(districts).toContain("Colombo");
      expect(districts).toContain("Gampaha");
      expect(districts).toContain("Kurunegala");
      expect(districts).toContain("Matale");
    });

    it("extracts all route districts for a multi-day trip with town names", () => {
      const trip = {
        fromLocation: "Colombo",
        toLocation: "Ella",
        days: [
          { dayNumber: 1, region: "Ratnapura", items: [{ title: "Bopath Ella Waterfall", notes: "Ratnapura" }] },
          { dayNumber: 2, region: "Ella", items: [{ title: "Nine Arches Bridge", notes: "Badulla" }] },
        ],
      };

      const routeDistricts = getTripRouteDistricts(trip);
      expect(routeDistricts.has("Colombo")).toBe(true);
      expect(routeDistricts.has("Kegalle")).toBe(true);
      expect(routeDistricts.has("Ratnapura")).toBe(true);
      expect(routeDistricts.has("Badulla")).toBe(true);
      expect(routeDistricts.has("Jaffna")).toBe(false);
      expect(routeDistricts.has("Galle")).toBe(false);
    });
  });

  describe("Island-Wide Event Detection", () => {
    it("identifies island-wide events correctly", () => {
      expect(isIslandWideEvent({ region: "Island-wide", location: "Island-wide" })).toBe(true);
      expect(isIslandWideEvent({ region: "National", location: "All Regions" })).toBe(true);
      expect(isIslandWideEvent({ region: "Sri Lanka", location: "Across Sri Lanka" })).toBe(true);
      expect(isIslandWideEvent({ region: null, location: "Island-wide" })).toBe(true);
      expect(isIslandWideEvent({ region: "All", location: "All" })).toBe(true);
      expect(isIslandWideEvent({ region: "Kandy", location: "Kandy City Center" })).toBe(false);
      expect(isIslandWideEvent({ region: "Galle", location: "Galle Fort" })).toBe(false);
    });
  });

  describe("Date Overlap Logic", () => {
    const trip = { startDate: "2026-08-10", endDate: "2026-08-20" };

    it("matches events overlapping the trip date range", () => {
      // Starts before, ends during trip
      expect(isEventDateMatchingTrip({ startDate: "2026-08-01", endDate: "2026-08-15" }, trip)).toBe(true);
      // Starts during, ends during trip
      expect(isEventDateMatchingTrip({ startDate: "2026-08-12", endDate: "2026-08-14" }, trip)).toBe(true);
      // Starts during, ends after trip
      expect(isEventDateMatchingTrip({ startDate: "2026-08-18", endDate: "2026-08-25" }, trip)).toBe(true);
      // Spans entire trip
      expect(isEventDateMatchingTrip({ startDate: "2026-08-01", endDate: "2026-08-31" }, trip)).toBe(true);
      // Single-day event during trip
      expect(isEventDateMatchingTrip({ startDate: "2026-08-15", endDate: null }, trip)).toBe(true);
    });

    it("rejects events outside the trip date range", () => {
      // Completely before trip
      expect(isEventDateMatchingTrip({ startDate: "2026-07-01", endDate: "2026-07-15" }, trip)).toBe(false);
      // Completely after trip
      expect(isEventDateMatchingTrip({ startDate: "2026-08-25", endDate: "2026-08-30" }, trip)).toBe(false);
    });
  });

  describe("Full Event Suggestion Filtering (Route + Island-wide + Dates)", () => {
    const mockEvents = [
      {
        id: 1,
        title: "National Kite Festival",
        region: "Island-wide",
        location: "Island-wide",
        startDate: "2026-08-01",
        endDate: "2026-08-31",
      },
      {
        id: 2,
        title: "Pinnawala Elephant Day",
        region: "Kegalle",
        location: "Pinnawala Elephant Orphanage",
        startDate: "2026-08-12",
        endDate: "2026-08-12",
      },
      {
        id: 3,
        title: "Dedigama Kota Vehera Perahera",
        region: "Kegalle",
        location: "Dedigama Kota Vehera",
        startDate: "2026-08-15",
        endDate: "2026-08-16",
      },
      {
        id: 4,
        title: "Kandy Esala Perahera",
        region: "Kandy",
        location: "Kandy City Center",
        startDate: "2026-08-15",
        endDate: "2026-08-25",
      },
      {
        id: 5,
        title: "Galle Literary Festival",
        region: "Galle",
        location: "Galle Fort",
        startDate: "2026-01-20",
        endDate: "2026-01-25",
      },
      {
        id: 6,
        title: "Hikkaduwa Beach Fest",
        region: "Galle",
        location: "Hikkaduwa Beach",
        startDate: "2026-08-15",
        endDate: "2026-08-18",
      },
      {
        id: 7,
        title: "Jaffna Nallur Festival",
        region: "Jaffna",
        location: "Nallur Kandaswamy Kovil",
        startDate: "2026-08-10",
        endDate: "2026-08-20",
      },
      {
        id: 8,
        title: "Panadura Kite Festival",
        region: "Kalutara",
        location: "Panadura Beach",
        startDate: "2026-08-15",
        endDate: "2026-08-16",
      },
      {
        id: 9,
        title: "Matale Muthumariamman Ther Festival",
        region: "Matale",
        location: "Sri Muthumariamman Temple, Matale",
        startDate: "2026-02-25",
        endDate: "2026-03-05",
      },
    ];

    it("suggests island-wide events and route-district events for Colombo -> Ella trip in August", () => {
      const colomboToEllaTrip = {
        startingPoint: "Colombo",
        toLocation: "Ella",
        startDate: "2026-08-10",
        endDate: "2026-08-18",
        days: [
          { dayNumber: 1, region: "Kegalle", items: [] },
          { dayNumber: 2, region: "Badulla", items: [] },
        ],
      };

      const results = filterEventsForTrip(mockEvents, colomboToEllaTrip);
      const titles = results.map((e) => e.title);

      // 1. Island-wide event in August should be suggested
      expect(titles).toContain("National Kite Festival");

      // 2. Events in Kegalle & Kalutara (on the route corridor to Ella) should be suggested
      expect(titles).toContain("Pinnawala Elephant Day");
      expect(titles).toContain("Dedigama Kota Vehera Perahera");
      expect(titles).toContain("Panadura Kite Festival");

      // 3. Events off-route (Galle, Jaffna) should NOT be suggested for Colombo -> Ella
      expect(titles).not.toContain("Hikkaduwa Beach Fest");
      expect(titles).not.toContain("Jaffna Nallur Festival");

      // 4. Date mismatch events (Galle Literary Festival in Jan) should NOT be suggested
      expect(titles).not.toContain("Galle Literary Festival");
    });

    it("suggests Kandy events and island-wide events for Kandy -> Kandy trip in August", () => {
      const kandyTrip = {
        startingPoint: "Kandy",
        toLocation: "Kandy",
        startDate: "2026-08-10",
        endDate: "2026-08-18",
        days: [{ dayNumber: 1, region: "Kandy", items: [] }],
      };

      const results = filterEventsForTrip(mockEvents, kandyTrip);
      const titles = results.map((e) => e.title);

      expect(titles).toContain("National Kite Festival"); // Island-wide
      expect(titles).toContain("Kandy Esala Perahera"); // Kandy
      expect(titles).not.toContain("Jaffna Nallur Festival");
      expect(titles).not.toContain("Hikkaduwa Beach Fest");
      expect(titles).not.toContain("Dedigama Kota Vehera Perahera");
    });

    it("suggests Galle and Kalutara events for Colombo -> Mirissa trip in August", () => {
      const southCoastTrip = {
        startingPoint: "Colombo",
        toLocation: "Mirissa",
        startDate: "2026-08-10",
        endDate: "2026-08-18",
        days: [
          { dayNumber: 1, region: "Galle", items: [] },
          { dayNumber: 2, region: "Matara", items: [] },
        ],
      };

      const results = filterEventsForTrip(mockEvents, southCoastTrip);
      const titles = results.map((e) => e.title);

      expect(titles).toContain("National Kite Festival"); // Island-wide
      expect(titles).toContain("Hikkaduwa Beach Fest"); // Galle
      expect(titles).toContain("Panadura Kite Festival"); // Kalutara (corridor)
      expect(titles).not.toContain("Kandy Esala Perahera"); // Kandy is off-route
      expect(titles).not.toContain("Jaffna Nallur Festival"); // Jaffna is off-route
    });

    it("suggests Matale events for Colombo -> Sigiriya trip in February/March", () => {
      const culturalTriangleTrip = {
        startingPoint: "Colombo",
        toLocation: "Sigiriya",
        startDate: "2026-02-20",
        endDate: "2026-03-02",
        days: [{ dayNumber: 1, region: "Matale", items: [] }],
      };

      const results = filterEventsForTrip(mockEvents, culturalTriangleTrip);
      const titles = results.map((e) => e.title);

      expect(titles).toContain("Matale Muthumariamman Ther Festival");
      expect(titles).not.toContain("Hikkaduwa Beach Fest");
      expect(titles).not.toContain("National Kite Festival");
    });
  });
});

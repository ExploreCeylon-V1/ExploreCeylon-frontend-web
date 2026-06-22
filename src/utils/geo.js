/**
 * Calculates straight-line distance between two lat/lng points using the
 * haversine formula. Returns distance in kilometers.
 */
export const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371; // Earth's radius in km

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Given a target gem and a full list of gems, returns the closest N gems
 * (excluding the target itself and any gem missing coordinates).
 */
export const getNearbyGems = (targetGem, allGems, limit = 3) => {
  if (targetGem.latitude == null || targetGem.longitude == null) return [];

  return allGems
    .filter(
      (g) =>
        g.id !== targetGem.id &&
        g.latitude != null &&
        g.longitude != null
    )
    .map((g) => ({
      ...g,
      distanceKm: getDistanceKm(
        targetGem.latitude,
        targetGem.longitude,
        g.latitude,
        g.longitude
      ),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
};
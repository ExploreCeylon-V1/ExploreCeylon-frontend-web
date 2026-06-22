/**
 * Parses the comma-separated travelTimeFrom field, e.g.
 * "Colombo:5h by road,Galle:2.5h by road,Hambantota:1 hour"
 * into [{ from: "Colombo", time: "5h by road" }, ...]
 */
export const parseTravelTimeFrom = (travelTimeFrom) => {
  if (!travelTimeFrom) return [];

  return travelTimeFrom
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [from, ...rest] = entry.split(':');
      return {
        from: from?.trim() || entry,
        time: rest.join(':').trim() || '—',
      };
    });
};

/**
 * Parses the comma-separated activities field, e.g.
 * "Leopard safari,Elephant watching,Birdwatching"
 * into a clean array of strings.
 */
export const parseActivities = (activities) => {
  if (!activities) return [];
  return activities
    .split(',')
    .map((a) => a.trim())
    .filter(Boolean);
};

/**
 * Parses the comma-separated nearbyGems field, e.g.
 * "Bundala NP,Mirissa Beach"
 * into a clean array of title strings to match against real gems.
 */
export const parseNearbyGemTitles = (nearbyGems) => {
  if (!nearbyGems) return [];
  return nearbyGems
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
};
import { getDistanceKm } from "./geo";

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// All 25 administrative districts of Sri Lanka
export const SRI_LANKA_DISTRICTS = [
  "Ampara",
  "Anuradhapura",
  "Badulla",
  "Batticaloa",
  "Colombo",
  "Galle",
  "Gampaha",
  "Hambantota",
  "Jaffna",
  "Kalutara",
  "Kandy",
  "Kegalle",
  "Kilinochchi",
  "Kurunegala",
  "Mannar",
  "Matale",
  "Matara",
  "Monaragala",
  "Mullaitivu",
  "Nuwara Eliya",
  "Polonnaruwa",
  "Puttalam",
  "Ratnapura",
  "Trincomalee",
  "Vavuniya",
];

// Comprehensive mapping from popular Sri Lankan towns, tourist hubs,
// attractions, and cities to their administrative district.
export const CITY_TO_DISTRICT_MAP = {
  // Colombo District
  colombo: "Colombo",
  dehiwala: "Colombo",
  "mount lavinia": "Colombo",
  moratuwa: "Colombo",
  kotte: "Colombo",
  "sri jayawardenepura kotte": "Colombo",
  battaramulla: "Colombo",
  rajagiriya: "Colombo",
  nugegoda: "Colombo",
  maharagama: "Colombo",
  homagama: "Colombo",
  "galle face": "Colombo",
  cinnamon: "Colombo",
  petta: "Colombo",
  pettah: "Colombo",
  fort: "Colombo",

  // Gampaha District
  gampaha: "Gampaha",
  negombo: "Gampaha",
  katunayake: "Gampaha",
  kelaniya: "Gampaha",
  wattala: "Gampaha",
  "ja-ela": "Gampaha",
  jaela: "Gampaha",
  mirigama: "Gampaha",
  veyangoda: "Gampaha",
  biyagama: "Gampaha",

  // Kalutara District
  kalutara: "Kalutara",
  panadura: "Kalutara",
  wadduwa: "Kalutara",
  beruwala: "Kalutara",
  aluthgama: "Kalutara",
  horana: "Kalutara",
  matugama: "Kalutara",
  bandaragama: "Kalutara",

  // Kandy District
  kandy: "Kandy",
  peradeniya: "Kandy",
  katugastota: "Kandy",
  gampola: "Kandy",
  digana: "Kandy",
  teldeniya: "Kandy",
  kundasale: "Kandy",
  kadugannawa: "Kandy",
  knuckles: "Kandy",
  hantana: "Kandy",
  hanthana: "Kandy",

  // Matale District
  matale: "Matale",
  sigiriya: "Matale",
  dambulla: "Matale",
  kandalama: "Matale",
  habarana: "Matale",
  naula: "Matale",
  rattota: "Matale",
  aluvihare: "Matale",
  pidurangala: "Matale",

  // Nuwara Eliya District
  "nuwara eliya": "Nuwara Eliya",
  nuwaraeliya: "Nuwara Eliya",
  hatton: "Nuwara Eliya",
  nallathanniya: "Nuwara Eliya",
  dalhousie: "Nuwara Eliya",
  "adam's peak": "Nuwara Eliya",
  "adams peak": "Nuwara Eliya",
  "sri pada": "Nuwara Eliya",
  maskeliya: "Nuwara Eliya",
  talawakele: "Nuwara Eliya",
  "horton plains": "Nuwara Eliya",
  hakgala: "Nuwara Eliya",
  ragala: "Nuwara Eliya",
  radella: "Nuwara Eliya",
  mahagastotte: "Nuwara Eliya",
  pundaluoya: "Nuwara Eliya",

  // Galle District
  galle: "Galle",
  unawatuna: "Galle",
  hikkaduwa: "Galle",
  bentota: "Galle",
  koggala: "Galle",
  ahangama: "Galle",
  ambalangoda: "Galle",
  karapitiya: "Galle",
  baddegama: "Galle",
  elpitiya: "Galle",
  induruwa: "Galle",

  // Matara District
  matara: "Matara",
  mirissa: "Matara",
  weligama: "Matara",
  hiriketiya: "Matara",
  dikwella: "Matara",
  dickwella: "Matara",
  dondra: "Matara",
  devinuwara: "Matara",
  polhena: "Matara",
  deniyaya: "Matara",

  // Hambantota District
  hambantota: "Hambantota",
  tangalle: "Hambantota",
  tissamaharama: "Hambantota",
  tissa: "Hambantota",
  yala: "Hambantota",
  kataragama: "Hambantota",
  kirinda: "Hambantota",
  bundala: "Hambantota",
  ambalantota: "Hambantota",
  ranna: "Hambantota",

  // Badulla District
  badulla: "Badulla",
  ella: "Badulla",
  bandarawela: "Badulla",
  haputale: "Badulla",
  passara: "Badulla",
  mahiyanganaya: "Badulla",
  diyatalawa: "Badulla",
  welimada: "Badulla",
  demodara: "Badulla",
  "lipton's seat": "Badulla",
  "liptons seat": "Badulla",
  "nine arches": "Badulla",
  "little adam": "Badulla",
  ravana: "Badulla",

  // Monaragala District
  monaragala: "Monaragala",
  buttala: "Monaragala",
  wellawaya: "Monaragala",
  bibile: "Monaragala",
  siyambalanduwa: "Monaragala",

  // Ratnapura District
  ratnapura: "Ratnapura",
  balangoda: "Ratnapura",
  pelmadulla: "Ratnapura",
  kuruwita: "Ratnapura",
  embilipitiya: "Ratnapura",
  udawalawe: "Ratnapura",
  rakwana: "Ratnapura",
  sinharaja: "Ratnapura",

  // Kegalle District
  kegalle: "Kegalle",
  pinnawala: "Kegalle",
  kitulgala: "Kegalle",
  mawanella: "Kegalle",
  rambukkana: "Kegalle",
  warakapola: "Kegalle",
  beligala: "Kegalle",
  dedigama: "Kegalle",

  // Kurunegala District
  kurunegala: "Kurunegala",
  kuliyapitiya: "Kurunegala",
  narammala: "Kurunegala",
  wariyapola: "Kurunegala",
  ibbagamuwa: "Kurunegala",
  polgahawela: "Kurunegala",

  // Puttalam District
  puttalam: "Puttalam",
  kalpitiya: "Puttalam",
  chilaw: "Puttalam",
  marawila: "Puttalam",
  wennappuwa: "Puttalam",
  wilpattu: "Puttalam",

  // Anuradhapura District
  anuradhapura: "Anuradhapura",
  mihintale: "Anuradhapura",
  kekirawa: "Anuradhapura",
  medawachchiya: "Anuradhapura",
  eppawala: "Anuradhapura",

  // Polonnaruwa District
  polonnaruwa: "Polonnaruwa",
  minneriya: "Polonnaruwa",
  giritale: "Polonnaruwa",
  kaduruwela: "Polonnaruwa",
  medirigiriya: "Polonnaruwa",
  kaudulla: "Polonnaruwa",

  // Trincomalee District
  trincomalee: "Trincomalee",
  nilaveli: "Trincomalee",
  uppuveli: "Trincomalee",
  kantale: "Trincomalee",
  kinniya: "Trincomalee",

  // Batticaloa District
  batticaloa: "Batticaloa",
  pasikuda: "Batticaloa",
  passekudah: "Batticaloa",
  kalkudah: "Batticaloa",
  valachchenai: "Batticaloa",

  // Ampara District
  ampara: "Ampara",
  "arugam bay": "Ampara",
  arugambay: "Ampara",
  pottuvil: "Ampara",
  kalmunai: "Ampara",
  lahugala: "Ampara",
  kumana: "Ampara",

  // Jaffna District
  jaffna: "Jaffna",
  nallur: "Jaffna",
  "point pedro": "Jaffna",
  chavakachcheri: "Jaffna",
  karainagar: "Jaffna",
  delft: "Jaffna",

  // Kilinochchi District
  kilinochchi: "Kilinochchi",

  // Mannar District
  mannar: "Mannar",
  talaimannar: "Mannar",

  // Vavuniya District
  vavuniya: "Vavuniya",

  // Mullaitivu District
  mullaitivu: "Mullaitivu",
};

// District Adjacency Map for Sri Lanka
export const SRI_LANKA_DISTRICT_ADJACENCY = {
  Colombo: ["Gampaha", "Kalutara", "Kegalle"],
  Gampaha: ["Colombo", "Kalutara", "Kegalle", "Kurunegala", "Puttalam"],
  Kalutara: ["Colombo", "Gampaha", "Kegalle", "Ratnapura", "Galle"],
  Galle: ["Kalutara", "Ratnapura", "Matara"],
  Matara: ["Galle", "Ratnapura", "Hambantota"],
  Hambantota: ["Matara", "Ratnapura", "Monaragala", "Ampara"],
  Kegalle: ["Colombo", "Gampaha", "Kurunegala", "Kandy", "Nuwara Eliya", "Ratnapura", "Kalutara"],
  Ratnapura: ["Kalutara", "Kegalle", "Nuwara Eliya", "Badulla", "Monaragala", "Hambantota", "Matara", "Galle"],
  Kandy: ["Kegalle", "Kurunegala", "Matale", "Badulla", "Nuwara Eliya"],
  Matale: ["Kandy", "Kurunegala", "Anuradhapura", "Polonnaruwa", "Badulla"],
  "Nuwara Eliya": ["Kandy", "Badulla", "Ratnapura", "Kegalle"],
  Badulla: ["Kandy", "Matale", "Nuwara Eliya", "Ratnapura", "Monaragala", "Ampara"],
  Monaragala: ["Badulla", "Ratnapura", "Hambantota", "Ampara"],
  Kurunegala: ["Gampaha", "Kegalle", "Kandy", "Matale", "Anuradhapura", "Puttalam"],
  Puttalam: ["Gampaha", "Kurunegala", "Anuradhapura", "Mannar"],
  Anuradhapura: ["Puttalam", "Kurunegala", "Matale", "Polonnaruwa", "Trincomalee", "Vavuniya", "Mannar"],
  Polonnaruwa: ["Anuradhapura", "Matale", "Badulla", "Ampara", "Batticaloa", "Trincomalee"],
  Trincomalee: ["Anuradhapura", "Polonnaruwa", "Batticaloa", "Mullaitivu", "Vavuniya"],
  Batticaloa: ["Polonnaruwa", "Trincomalee", "Ampara"],
  Ampara: ["Batticaloa", "Polonnaruwa", "Badulla", "Monaragala", "Hambantota"],
  Vavuniya: ["Anuradhapura", "Mannar", "Mullaitivu", "Trincomalee"],
  Mannar: ["Puttalam", "Anuradhapura", "Vavuniya", "Mullaitivu", "Kilinochchi"],
  Mullaitivu: ["Vavuniya", "Mannar", "Kilinochchi", "Trincomalee"],
  Kilinochchi: ["Mannar", "Mullaitivu", "Jaffna"],
  Jaffna: ["Kilinochchi"],
};

// Defined high-traffic Sri Lanka highway corridor district sequences
export const HIGHWAY_CORRIDOR_DISTRICTS = {
  // Colombo -> Badulla / Ella (via A4 / A2+A4 corridor)
  "Colombo-Badulla": ["Colombo", "Kalutara", "Kegalle", "Ratnapura", "Nuwara Eliya", "Monaragala", "Badulla"],
  // Colombo -> Kandy (via A1)
  "Colombo-Kandy": ["Colombo", "Gampaha", "Kegalle", "Kandy"],
  // Colombo -> Nuwara Eliya (via A7 or A1+A5)
  "Colombo-Nuwara Eliya": ["Colombo", "Gampaha", "Kegalle", "Kandy", "Nuwara Eliya", "Ratnapura"],
  // Colombo -> Galle (via E01 / A2)
  "Colombo-Galle": ["Colombo", "Kalutara", "Galle"],
  // Colombo -> Matara / Mirissa (via E01 / A2)
  "Colombo-Matara": ["Colombo", "Kalutara", "Galle", "Matara"],
  // Colombo -> Hambantota / Yala (via E01 / A2)
  "Colombo-Hambantota": ["Colombo", "Kalutara", "Galle", "Matara", "Hambantota", "Monaragala"],
  // Colombo -> Matale / Sigiriya / Dambulla (via Central Expressway / A6)
  "Colombo-Matale": ["Colombo", "Gampaha", "Kurunegala", "Matale"],
  // Colombo -> Anuradhapura (via A1/A6/A28)
  "Colombo-Anuradhapura": ["Colombo", "Gampaha", "Kurunegala", "Anuradhapura"],
  // Colombo -> Polonnaruwa (via A1/A6/A11)
  "Colombo-Polonnaruwa": ["Colombo", "Gampaha", "Kurunegala", "Matale", "Polonnaruwa"],
  // Colombo -> Trincomalee (via A6)
  "Colombo-Trincomalee": ["Colombo", "Gampaha", "Kurunegala", "Matale", "Anuradhapura", "Polonnaruwa", "Trincomalee"],
  // Colombo -> Ampara / Arugam Bay
  "Colombo-Ampara": ["Colombo", "Kalutara", "Ratnapura", "Monaragala", "Badulla", "Hambantota", "Ampara"],
  // Colombo -> Batticaloa / Pasikuda
  "Colombo-Batticaloa": ["Colombo", "Gampaha", "Kurunegala", "Matale", "Polonnaruwa", "Batticaloa"],
  // Colombo -> Jaffna (via A9)
  "Colombo-Jaffna": ["Colombo", "Gampaha", "Kurunegala", "Anuradhapura", "Vavuniya", "Kilinochchi", "Jaffna"],
  // Colombo -> Puttalam / Kalpitiya (via A3)
  "Colombo-Puttalam": ["Colombo", "Gampaha", "Puttalam"],

  // Kandy Hub routes
  "Kandy-Galle": ["Kandy", "Kegalle", "Colombo", "Kalutara", "Galle"],
  "Kandy-Matara": ["Kandy", "Kegalle", "Colombo", "Kalutara", "Galle", "Matara"],
  "Kandy-Badulla": ["Kandy", "Nuwara Eliya", "Badulla"],
  "Kandy-Nuwara Eliya": ["Kandy", "Nuwara Eliya"],
  "Kandy-Matale": ["Kandy", "Matale"],
  "Kandy-Anuradhapura": ["Kandy", "Matale", "Anuradhapura"],
  "Kandy-Polonnaruwa": ["Kandy", "Matale", "Polonnaruwa"],
  "Kandy-Trincomalee": ["Kandy", "Matale", "Polonnaruwa", "Trincomalee"],
  "Kandy-Ampara": ["Kandy", "Badulla", "Monaragala", "Ampara"],
  "Kandy-Hambantota": ["Kandy", "Nuwara Eliya", "Badulla", "Monaragala", "Hambantota"],

  // Southern Coast -> Hill Country / East
  "Galle-Badulla": ["Galle", "Matara", "Hambantota", "Monaragala", "Ratnapura", "Badulla"],
  "Matara-Badulla": ["Matara", "Hambantota", "Monaragala", "Ratnapura", "Badulla"],
  "Hambantota-Badulla": ["Hambantota", "Monaragala", "Badulla"],
  "Galle-Kandy": ["Galle", "Kalutara", "Colombo", "Kegalle", "Kandy"],
  "Matara-Kandy": ["Matara", "Galle", "Kalutara", "Colombo", "Kegalle", "Kandy"],

  // Cultural Triangle -> East / North
  "Matale-Trincomalee": ["Matale", "Anuradhapura", "Polonnaruwa", "Trincomalee"],
  "Matale-Batticaloa": ["Matale", "Polonnaruwa", "Batticaloa"],
  "Anuradhapura-Jaffna": ["Anuradhapura", "Vavuniya", "Kilinochchi", "Jaffna"],
  "Anuradhapura-Trincomalee": ["Anuradhapura", "Trincomalee"],
};

/**
 * Normalizes any string to an exact Sri Lankan Administrative District name if recognized.
 * Uses exact match or exact suffix match to prevent false partial matches (e.g. "Galle" vs "Kegalle").
 */
export function normalizeDistrictName(str) {
  if (!str) return null;
  const clean = String(str).trim().toLowerCase();

  for (const d of SRI_LANKA_DISTRICTS) {
    const dLower = d.toLowerCase();
    if (
      clean === dLower ||
      clean === `${dLower} district` ||
      clean === `district of ${dLower}` ||
      clean === `${dLower} province`
    ) {
      return d;
    }
  }
  return null;
}

/**
 * Resolves a city, town, attraction, or district name to its official Administrative District.
 */
export function resolveLocationToDistrict(locationStr) {
  if (!locationStr) return null;
  const raw = String(locationStr).trim();
  const lower = raw.toLowerCase();

  // 1. Direct district match
  const directDistrict = normalizeDistrictName(raw);
  if (directDistrict) return directDistrict;

  // 2. Exact city / town match
  if (CITY_TO_DISTRICT_MAP[lower]) {
    return CITY_TO_DISTRICT_MAP[lower];
  }

  // 3. Word-boundary search for known cities/towns (longest match first)
  const sortedCities = Object.keys(CITY_TO_DISTRICT_MAP).sort((a, b) => b.length - a.length);
  for (const city of sortedCities) {
    const regex = new RegExp(`(^|[^a-zA-Z0-9])${escapeRegExp(city)}([^a-zA-Z0-9]|$)`, "i");
    if (regex.test(lower)) {
      return CITY_TO_DISTRICT_MAP[city];
    }
  }

  // 4. Word-boundary search for official district names
  for (const d of SRI_LANKA_DISTRICTS) {
    const dLower = d.toLowerCase();
    const regex = new RegExp(`(^|[^a-zA-Z0-9])${escapeRegExp(dLower)}([^a-zA-Z0-9]|$)`, "i");
    if (regex.test(lower)) {
      return d;
    }
  }

  return null;
}

/**
 * Breadth-First Search shortest path on the Sri Lanka district adjacency network.
 */
function findBfsDistrictPath(startDistrict, endDistrict) {
  if (!startDistrict || !endDistrict) return [];
  if (startDistrict === endDistrict) return [startDistrict];

  const queue = [[startDistrict]];
  const visited = new Set([startDistrict]);

  while (queue.length > 0) {
    const path = queue.shift();
    const current = path[path.length - 1];

    const neighbors = SRI_LANKA_DISTRICT_ADJACENCY[current] || [];
    for (const neighbor of neighbors) {
      if (neighbor === endDistrict) {
        return [...path, neighbor];
      }
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([...path, neighbor]);
      }
    }
  }

  return [startDistrict, endDistrict];
}

/**
 * Returns all districts along the travel corridor between two districts.
 */
export function getCorridorDistrictsBetween(startDistrict, endDistrict) {
  if (!startDistrict && !endDistrict) return [];
  if (startDistrict && !endDistrict) return [startDistrict];
  if (!startDistrict && endDistrict) return [endDistrict];
  if (startDistrict === endDistrict) return [startDistrict];

  const key1 = `${startDistrict}-${endDistrict}`;
  const key2 = `${endDistrict}-${startDistrict}`;

  if (HIGHWAY_CORRIDOR_DISTRICTS[key1]) {
    return HIGHWAY_CORRIDOR_DISTRICTS[key1];
  }
  if (HIGHWAY_CORRIDOR_DISTRICTS[key2]) {
    return HIGHWAY_CORRIDOR_DISTRICTS[key2];
  }

  return findBfsDistrictPath(startDistrict, endDistrict);
}

/**
 * Computes all districts related to the entire travel route of a trip:
 * - Starting district
 * - Destination district
 * - Highway corridor districts between origin and destination
 * - Districts of all itinerary days and stops
 * - Highway corridor districts between consecutive day legs
 */
export function getTripRouteDistricts(trip, detailCatalog = {}) {
  const districtSet = new Set();

  if (!trip) return districtSet;

  // 1. Origin & Destination
  const startRaw = trip.startingPoint || trip.fromLocation || "";
  const destRaw = trip.toLocation || "";

  const startDistrict = resolveLocationToDistrict(startRaw);
  const destDistrict = resolveLocationToDistrict(destRaw);

  if (startDistrict) districtSet.add(startDistrict);
  if (destDistrict) districtSet.add(destDistrict);

  // 2. Direct Corridor between start and end
  if (startDistrict && destDistrict) {
    const directCorridor = getCorridorDistrictsBetween(startDistrict, destDistrict);
    directCorridor.forEach((d) => districtSet.add(d));
  }

  // 3. Day-by-day stops and region waypoints
  const dayDistricts = [];
  if (startDistrict) dayDistricts.push(startDistrict);

  (trip.days || []).forEach((day) => {
    let dayDist = resolveLocationToDistrict(day.region);
    if (dayDist) {
      districtSet.add(dayDist);
      dayDistricts.push(dayDist);
    }

    (day.items || []).forEach((item) => {
      // Notes or district field
      if (item.notes) {
        const d = resolveLocationToDistrict(item.notes);
        if (d) districtSet.add(d);
      }
      if (item.title) {
        const d = resolveLocationToDistrict(item.title);
        if (d) districtSet.add(d);
      }

      // Resolved catalog records
      if (detailCatalog) {
        const dests = detailCatalog.destinations || [];
        const gems = detailCatalog.gems || [];
        const rec =
          dests.find((d) => String(d.id) === String(item.referenceId) || d.name === item.title) ||
          gems.find((g) => String(g.id) === String(item.referenceId) || g.title === item.title);

        if (rec) {
          const recDist = resolveLocationToDistrict(rec.district || rec.region);
          if (recDist) {
            districtSet.add(recDist);
            if (!dayDist) {
              dayDist = recDist;
              dayDistricts.push(recDist);
            }
          }
        }
      }
    });
  });

  if (destDistrict) dayDistricts.push(destDistrict);

  // 4. Connect consecutive legs along the itinerary progression
  for (let i = 0; i < dayDistricts.length - 1; i++) {
    const legCorridor = getCorridorDistrictsBetween(dayDistricts[i], dayDistricts[i + 1]);
    legCorridor.forEach((d) => districtSet.add(d));
  }

  return districtSet;
}

/**
 * Checks whether an event is island-wide / nationwide.
 */
export function isIslandWideEvent(event) {
  if (!event) return false;
  const r = (event.region || "").toLowerCase().trim();
  const l = (event.location || "").toLowerCase().trim();

  const islandKeywords = [
    "island-wide",
    "islandwide",
    "island wide",
    "all",
    "all regions",
    "all districts",
    "national",
    "countrywide",
    "sri lanka",
    "across sri lanka",
    "whole island",
  ];

  if (!r || islandKeywords.includes(r)) return true;
  if (islandKeywords.includes(l)) return true;

  if (
    l.startsWith("island-wide") ||
    l.startsWith("islandwide") ||
    l.startsWith("island wide") ||
    l.startsWith("across sri lanka") ||
    r.startsWith("island-wide") ||
    r.startsWith("islandwide") ||
    r.startsWith("island wide")
  ) {
    return true;
  }

  return false;
}

/**
 * Checks whether an event's date range overlaps with the trip's date range.
 * Preserves the previous exact date overlap calculation.
 */
export function isEventDateMatchingTrip(event, trip) {
  if (!trip?.startDate || !trip?.endDate) return true;
  if (!event?.startDate) return true;

  const eventStart = String(event.startDate).split("T")[0];
  const eventEnd = event.endDate ? String(event.endDate).split("T")[0] : eventStart;
  const tripStart = String(trip.startDate).split("T")[0];
  const tripEnd = String(trip.endDate).split("T")[0];

  // Overlap: event starts on or before trip ends AND event ends on or after trip starts
  return eventStart <= tripEnd && eventEnd >= tripStart;
}

/**
 * Extracts coordinate waypoints from a trip.
 */
function getTripCoordinates(trip, detailCatalog = {}) {
  const coords = [];
  const dests = detailCatalog.destinations || [];
  const gems = detailCatalog.gems || [];

  (trip?.days || []).forEach((day) => {
    (day?.items || []).forEach((item) => {
      const rec =
        dests.find((d) => String(d.id) === String(item.referenceId) || d.name === item.title) ||
        gems.find((g) => String(g.id) === String(item.referenceId) || g.title === item.title);

      if (rec && rec.latitude != null && rec.longitude != null && !isNaN(Number(rec.latitude)) && !isNaN(Number(rec.longitude))) {
        coords.push({ lat: Number(rec.latitude), lng: Number(rec.longitude) });
      }
    });
  });

  return coords;
}

/**
 * Checks whether an event matches the trip by:
 * 1. Date overlap (required).
 * 2. AND either Island-wide, or Route District match, or Coordinate proximity.
 */
export function isEventMatchingTrip(event, trip, detailCatalog = {}, routeDistricts = null) {
  if (!event) return false;

  // 1. Date matching (preserved)
  if (!isEventDateMatchingTrip(event, trip)) {
    return false;
  }

  // 2. Island-wide events are always included
  if (isIslandWideEvent(event)) {
    return true;
  }

  // 3. District / Route matching
  const activeRouteDistricts = routeDistricts || getTripRouteDistricts(trip, detailCatalog);

  const eventRegionDistrict = resolveLocationToDistrict(event.region);
  const eventLocationDistrict = resolveLocationToDistrict(event.location);

  if (eventRegionDistrict && activeRouteDistricts.has(eventRegionDistrict)) {
    return true;
  }
  if (eventLocationDistrict && activeRouteDistricts.has(eventLocationDistrict)) {
    return true;
  }

  // Word-boundary checks for district names in event region / location text
  const rLower = (event.region || "").toLowerCase().trim();
  const lLower = (event.location || "").toLowerCase().trim();

  for (const dist of activeRouteDistricts) {
    const dLower = dist.toLowerCase();
    const regex = new RegExp(`(^|[^a-zA-Z0-9])${escapeRegExp(dLower)}([^a-zA-Z0-9]|$)`, "i");
    if (regex.test(rLower) || regex.test(lLower)) {
      return true;
    }
  }

  // 4. Coordinate proximity check (if event has lat/lng and is within 35km of any trip stop)
  if (event.latitude != null && event.longitude != null && !isNaN(Number(event.latitude)) && !isNaN(Number(event.longitude))) {
    const eLat = Number(event.latitude);
    const eLng = Number(event.longitude);
    const tripCoords = getTripCoordinates(trip, detailCatalog);

    for (const c of tripCoords) {
      const dist = getDistanceKm(eLat, eLng, c.lat, c.lng);
      if (dist <= 35.0) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Filters a candidate list of events for a trip.
 */
export function filterEventsForTrip(events, trip, detailCatalog = {}) {
  const list = Array.isArray(events) ? events : [];
  if (list.length === 0) return [];

  const routeDistricts = getTripRouteDistricts(trip, detailCatalog);

  return list.filter((e) => isEventMatchingTrip(e, trip, detailCatalog, routeDistricts));
}

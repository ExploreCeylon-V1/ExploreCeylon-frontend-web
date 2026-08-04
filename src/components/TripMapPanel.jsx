// TripMapPanel.jsx
// Displays the full trip route on Google Maps with markers for regions,
// matched destinations, hidden gems, and coordinate-enabled events.

import { useEffect, useRef, useState } from "react";
import destinationsService from "../services/destinationsService";
import hiddenGemsService from "../services/Hiddengemsservice";
import eventService from "../services/eventService";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

const SRI_LANKA_COORDS = {
  colombo: { lat: 6.9271, lng: 79.8612 },
  kandy: { lat: 7.2906, lng: 80.6337 },
  galle: { lat: 6.0535, lng: 80.2210 },
  ella: { lat: 6.8667, lng: 81.0466 },
  matara: { lat: 5.9549, lng: 80.5550 },
  kalutara: { lat: 6.5854, lng: 79.9607 },
  mirissa: { lat: 5.9483, lng: 80.4589 },
  "nuwara eliya": { lat: 6.9497, lng: 80.7891 },
  sigiriya: { lat: 7.9570, lng: 80.7603 },
  dambulla: { lat: 7.8742, lng: 80.6511 },
  polonnaruwa: { lat: 7.9403, lng: 81.0188 },
  anuradhapura: { lat: 8.3114, lng: 80.4037 },
  jaffna: { lat: 9.6615, lng: 80.0255 },
  trincomalee: { lat: 8.5874, lng: 81.2152 },
  batticaloa: { lat: 7.7102, lng: 81.6924 },
  "arugam bay": { lat: 6.8401, lng: 81.8362 },
  yala: { lat: 6.3729, lng: 81.5214 },
  unawatuna: { lat: 6.0102, lng: 80.2487 },
  hikkaduwa: { lat: 6.1395, lng: 80.1000 },
  negombo: { lat: 7.2083, lng: 79.8358 },
  bentota: { lat: 6.4225, lng: 79.9998 },
  badulla: { lat: 6.9934, lng: 81.0550 },
  ratnapura: { lat: 6.6828, lng: 80.3992 },
  gampaha: { lat: 7.0840, lng: 80.0000 },
  kurunegala: { lat: 7.4818, lng: 80.3609 },
  matale: { lat: 7.4675, lng: 80.6234 },
  tangalle: { lat: 6.0249, lng: 80.7972 },
  weligama: { lat: 5.9753, lng: 80.4291 },
  hambantota: { lat: 6.1241, lng: 81.1185 },
  katunayake: { lat: 7.1699, lng: 79.8844 },
  airport: { lat: 7.1699, lng: 79.8844 },
  bia: { lat: 7.1699, lng: 79.8844 },
  "galle fort": { lat: 6.0257, lng: 80.2168 },
  "galle face": { lat: 6.9271, lng: 79.8449 },
  "temple of the tooth": { lat: 7.2936, lng: 80.6413 },
  "sigiriya rock": { lat: 7.9570, lng: 80.7603 },
  "nine arch bridge": { lat: 6.8750, lng: 81.0590 },
  "horton plains": { lat: 6.8005, lng: 80.8086 },
  "adams peak": { lat: 6.8098, lng: 80.4994 },
  "jungle beach": { lat: 6.0298, lng: 80.2433 },
  "parrot rock": { lat: 5.9462, lng: 80.4569 },
};

const DAY_COLORS = [
  "#1a5c2a", "#2563eb", "#dc2626", "#d97706",
  "#7c3aed", "#0891b2", "#be185d", "#065f46",
];

let mapsLoaded = false;
let mapsLoading = false;
const mapsCallbacks = [];

function loadGoogleMaps(apiKey) {
  return new Promise((resolve, reject) => {
    if (mapsLoaded) { resolve(window.google); return; }
    mapsCallbacks.push({ resolve, reject });
    if (mapsLoading) return;
    mapsLoading = true;

    window.__googleMapsLoaded = () => {
      mapsLoaded = true;
      mapsCallbacks.forEach(cb => cb.resolve(window.google));
      mapsCallbacks.length = 0;
    };

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=__googleMapsLoaded&libraries=geometry`;
    script.async = true;
    script.onerror = () => {
      mapsCallbacks.forEach(cb => cb.reject(new Error("Maps load failed")));
      mapsCallbacks.length = 0;
      mapsLoading = false;
    };
    document.head.appendChild(script);
  });
}

// Fetches a real road-following route from OSRM's public routing API
// (free, no key required) for the given ordered stops. Returns
// { coords, distance(m), duration(s) } or null on any failure so the caller
// can fall back to a straight line.
async function fetchOsrmRoute(points) {
  if (points.length < 2) return null;
  const trimmed = points.slice(0, 100);
  const coords = trimmed.map(p => `${p.lng},${p.lat}`).join(";");
  try {
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.code !== "Ok" || !data.routes?.length) return null;
    const route = data.routes[0];
    return {
      coords: route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng })),
      distance: route.distance, // meters
      duration: route.duration, // seconds
    };
  } catch {
    return null;
  }
}

// Minutes → "Xh Ym" (or "Ym").
function formatTravelTime(min) {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h ? `${h}h ${m}m` : `${m}m`;
}

function hasCoords(record) {
  return Number.isFinite(Number(record?.latitude)) &&
    Number.isFinite(Number(record?.longitude)) &&
    Number(record.latitude) !== 0 &&
    Number(record.longitude) !== 0;
}

function resolveCoords(name, lat, lng) {
  if (hasCoords({ latitude: lat, longitude: lng })) {
    return { lat: Number(lat), lng: Number(lng) };
  }

  const key = normalizeName(name);
  for (const [knownName, coords] of Object.entries(SRI_LANKA_COORDS)) {
    const known = normalizeName(knownName);
    if (key.includes(known) || known.includes(key)) return coords;
  }
  return null;
}

function normalizeName(value = "") {
  return value
    .toLowerCase()
    .replace(/^hidden gem:\s*/i, "")
    .replace(/^festival:\s*/i, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanItemTitle(title = "") {
  return title
    .replace(/^Hidden Gem:\s*/i, "")
    .replace(/^Festival:\s*/i, "")
    .split("—")[0]
    .split("–")[0]
    .split(" - ")[0]
    .trim();
}

function tokenScore(a, b) {
  const aTokens = new Set(normalizeName(a).split(" ").filter(t => t.length > 2));
  const bTokens = new Set(normalizeName(b).split(" ").filter(t => t.length > 2));
  if (!aTokens.size || !bTokens.size) return 0;
  let hits = 0;
  aTokens.forEach(token => { if (bTokens.has(token)) hits += 1; });
  return hits / Math.min(aTokens.size, bTokens.size);
}

function findCatalogMatch(title, records, nameKey) {
  const itemName = normalizeName(cleanItemTitle(title));
  if (!itemName) return null;

  let best = null;
  let bestScore = 0;

  records.forEach(record => {
    const recordName = normalizeName(record[nameKey]);
    if (!recordName) return;
    const direct = itemName === recordName ||
      itemName.includes(recordName) ||
      recordName.includes(itemName);
    const score = direct ? 1 : tokenScore(itemName, recordName);
    if (score > bestScore) {
      bestScore = score;
      best = record;
    }
  });

  return bestScore >= 0.45 ? best : null;
}

function indexById(records) {
  const map = new Map();
  records.forEach(r => { if (r.id != null) map.set(String(r.id), r); });
  return map;
}

async function loadMapCatalog(trip) {
  const [destinations, gems, events] = await Promise.all([
    destinationsService.getAllDestinations().catch(() => []),
    hiddenGemsService.getAllGems().catch(() => []),
    eventService.getTripSyncEvents(trip.startDate, trip.endDate).catch(() => []),
  ]);

  const destList = destinations.filter(hasCoords);
  const gemList = gems.filter(hasCoords);
  const eventList = events.filter(hasCoords);

  return {
    destinations: destList,
    gems: gemList,
    events: eventList,
    destinationsById: indexById(destList),
    gemsById: indexById(gemList),
    eventsById: indexById(eventList),
  };
}

function offsetCoords(coords, index) {
  const ring = Math.floor(index / 8) + 1;
  const angle = (index % 8) * (Math.PI / 4);
  const distance = 0.018 * ring;
  return {
    lat: coords.lat + Math.sin(angle) * distance,
    lng: coords.lng + Math.cos(angle) * distance,
  };
}

function buildMarkers(trip, catalog = {}) {
  const markers = [];
  const seen = new Set();
  const destinations = catalog.destinations || [];
  const gems = catalog.gems || [];
  const events = catalog.events || [];
  const destinationsById = catalog.destinationsById || new Map();
  const gemsById = catalog.gemsById || new Map();
  const eventsById = catalog.eventsById || new Map();

  function addMarker(marker) {
    const key = `${marker.dayNum}-${marker.order}-${marker.type}-${marker.title}`;
    if (seen.has(key)) return;
    seen.add(key);
    markers.push(marker);
  }

  (trip.days || []).forEach((day, dayIdx) => {
    const color = DAY_COLORS[dayIdx % DAY_COLORS.length];
    const regionCoords = day.region ? resolveCoords(day.region, null, null) : null;

    if (regionCoords) {
      addMarker({
        lat: regionCoords.lat,
        lng: regionCoords.lng,
        label: `${day.dayNumber}`,
        title: `Day ${day.dayNumber}: ${day.region}`,
        region: day.region,
        theme: day.theme,
        dayNum: day.dayNumber,
        color,
        type: "REGION",
        order: 0,
      });
    }

    (day.items || []).forEach((item, itemIdx) => {
      const isFestival = item.title?.startsWith("Festival:");
      let kind = null;
      let match = null;

      // Prefer an exact match via referenceId, set by the backend at
      // generation time when it could resolve the AI's text to a real
      // DB row. Falls back to fuzzy text matching for older trips or
      // items the backend couldn't resolve.
      if (item.referenceId) {
        if (item.type === "GEM") {
          match = gemsById.get(String(item.referenceId)) || null;
          kind = match ? "GEM" : null;
        } else if (isFestival) {
          match = eventsById.get(String(item.referenceId)) || null;
          kind = match ? "EVENT" : null;
        } else if (item.type === "ACTIVITY") {
          match = destinationsById.get(String(item.referenceId)) || null;
          kind = match ? "DESTINATION" : null;
        }
      }

      if (!match) {
        if (item.type === "GEM") {
          match = findCatalogMatch(item.title, gems, "title");
          kind = match ? "GEM" : null;
        } else if (isFestival) {
          match = findCatalogMatch(item.title, events, "title");
          kind = match ? "EVENT" : null;
        } else if (item.type === "ACTIVITY") {
          match = findCatalogMatch(item.title, destinations, "name");
          kind = match ? "DESTINATION" : null;
        }
      }

      if (match) {
        addMarker({
          lat: Number(match.latitude),
          lng: Number(match.longitude),
          label: kind === "GEM" ? "G" : kind === "EVENT" ? "E" : `${day.dayNumber}.${itemIdx + 1}`,
          title: kind === "DESTINATION" ? match.name : match.title,
          type: kind,
          dayNum: day.dayNumber,
          color,
          theme: day.theme,
          order: itemIdx + 1,
          notes: item.title,
        });
        return;
      }

      const fallbackCoords = resolveCoords(cleanItemTitle(item.title), null, null);
      const coords = fallbackCoords || (regionCoords ? offsetCoords(regionCoords, itemIdx) : null);
      if (coords && ["ACTIVITY", "GEM"].includes(item.type)) {
        addMarker({
          lat: coords.lat,
          lng: coords.lng,
          label: item.type === "GEM" ? "G" : `${day.dayNumber}.${itemIdx + 1}`,
          title: cleanItemTitle(item.title),
          type: item.type === "GEM" ? "GEM" : "DESTINATION",
          dayNum: day.dayNumber,
          color,
          theme: day.theme,
          order: itemIdx + 1,
          notes: fallbackCoords ? item.title : `${item.title} (approximate location near ${day.region})`,
        });
      }
    });
  });

  return markers.sort((a, b) =>
    a.dayNum === b.dayNum ? (a.order || 0) - (b.order || 0) : a.dayNum - b.dayNum
  );
}

function createMarkerSvg(label, color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
    <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 26 18 26S36 31.5 36 18C36 8.06 27.94 0 18 0z" fill="${color}"/>
    <circle cx="18" cy="18" r="10" fill="white"/>
    <text x="18" y="23" text-anchor="middle" font-size="12" font-weight="bold" fill="${color}">${label}</text>
  </svg>`;
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}

export default function TripMapPanel({
  trip,
  activeDayNumber = null,
  onMarkerDayClick,
  mapHeightClass = "h-72",
}) {
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const googleRef = useRef(null);
  const catalogRef = useRef(null);
  const loadedTripIdRef = useRef(null);
  const fittedTripIdRef = useRef(null);
  const drawTokenRef = useRef(0);
  const activeDayRef = useRef(activeDayNumber);
  const infoWindowRef = useRef(null);
  const markerObjsRef = useRef([]);          // [{ marker, dayNum, type }]
  const segmentsRef = useRef([]);            // [{ dayNum, polyline }]
  const boundsByDayRef = useRef(new Map());  // dayNum -> LatLngBounds
  const fullBoundsRef = useRef(null);
  const [mapStatus, setMapStatus] = useState("loading");
  const [markerCount, setMarkerCount] = useState(0);
  const [routeStats, setRouteStats] = useState(null); // { km, min }

  // Changes whenever the itinerary's items change, so the route recalculates
  // live on add/remove/regenerate (§8) — not only when the trip id changes.
  const itemsSignature = (trip?.days || [])
    .map(d => `${d.dayNumber}:${(d.items || [])
      .map(i => i.id ?? i.referenceId ?? i.title).join(",")}`)
    .join("|");

  useEffect(() => { activeDayRef.current = activeDayNumber; }, [activeDayNumber]);

  // Load Google + catalog (catalog cached per trip), then (re)draw the route.
  // Runs on trip change AND on any item change so edits update the map live.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- early-exit guard when maps can't load; not derivable at render time
    if (!GOOGLE_MAPS_API_KEY) { setMapStatus("nokey"); return; }
    let cancelled = false;

    async function run() {
      const google = await loadGoogleMaps(GOOGLE_MAPS_API_KEY);
      if (cancelled) return;
      googleRef.current = google;

      // The destination/gem/event catalog only depends on the trip, not on
      // item edits — fetch it once per trip and reuse on every redraw.
      if (loadedTripIdRef.current !== trip.id || !catalogRef.current) {
        if (!catalogRef.current) setMapStatus("loading");
        catalogRef.current = await loadMapCatalog(trip);
        loadedTripIdRef.current = trip.id;
        if (cancelled) return;
      }
      if (!mapRef.current) return;
      ensureMap(google);
      drawTrip(google, catalogRef.current);
      setMapStatus("ready");
    }

    run().catch(() => setMapStatus("error"));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- drawTrip/trip are plain values recreated every render; itemsSignature + trip?.id are the deliberately curated triggers for redrawing (see comment above)
  }, [trip?.id, itemsSignature]);

  // Bidirectional sync (§3): re-emphasize + pan when the selected day changes.
  useEffect(() => {
    if (mapStatus === "ready") applyDayEmphasis(activeDayNumber, true);
  }, [activeDayNumber, mapStatus]);

  // Creates the Google map once; later redraws reuse this instance so the
  // user's zoom/pan and the tile load aren't thrown away on every edit.
  function ensureMap(google) {
    if (googleMapRef.current) return googleMapRef.current;
    const map = new google.maps.Map(mapRef.current, {
      center: { lat: 7.8731, lng: 80.7718 },
      zoom: 8,
      mapTypeId: "roadmap",
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      styles: [
        { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
      ],
    });
    googleMapRef.current = map;
    infoWindowRef.current = new google.maps.InfoWindow();
    return map;
  }

  // Emphasizes the active day's segment/markers and dims the rest; optionally
  // fits the viewport to the active day (or the whole trip when none active).
  function applyDayEmphasis(dayNum, doFit) {
    const map = googleMapRef.current;
    if (!map) return;

    segmentsRef.current.forEach(s => {
      const isActive = s.dayNum === dayNum;
      s.polyline.setOptions({
        strokeOpacity: dayNum == null ? 0.85 : isActive ? 1 : 0.15,
        strokeWeight: isActive ? 6 : 3,
        zIndex: isActive ? 40 : 1,
      });
    });
    markerObjsRef.current.forEach(m => {
      const dim = dayNum != null && m.dayNum !== dayNum;
      m.marker.setOpacity(dim ? 0.3 : 1);
      m.marker.setZIndex(m.dayNum === dayNum ? 60 : m.type === "REGION" ? 20 : 10);
    });

    if (!doFit) return;
    if (dayNum != null && boundsByDayRef.current.has(dayNum)) {
      map.fitBounds(boundsByDayRef.current.get(dayNum), { top: 60, right: 40, bottom: 40, left: 40 });
    } else if (fullBoundsRef.current) {
      map.fitBounds(fullBoundsRef.current, { top: 40, right: 20, bottom: 20, left: 20 });
    }
  }

  // Clears existing overlays and redraws markers + per-day route segments.
  // A draw token guards the async OSRM results so a rapid second edit never
  // has its stale routing overwrite the current one.
  function drawTrip(google, catalog) {
    const map = googleMapRef.current;
    const token = ++drawTokenRef.current;

    markerObjsRef.current.forEach(o => o.marker.setMap(null));
    segmentsRef.current.forEach(s => s.polyline.setMap(null));
    markerObjsRef.current = [];
    segmentsRef.current = [];

    const markers = buildMarkers(trip, catalog);
    setMarkerCount(markers.length);
    if (!markers.length) { setRouteStats(null); return; }

    const bounds = new google.maps.LatLngBounds();
    const infoWindow = infoWindowRef.current;
    const markerObjs = [];

    markers.forEach(m => {
      const position = { lat: m.lat, lng: m.lng };
      bounds.extend(position);

      const marker = new google.maps.Marker({
        position,
        map,
        title: `${m.type}: ${m.title}`,
        icon: {
          url: createMarkerSvg(m.label, m.color),
          anchor: new google.maps.Point(18, 44),
        },
        zIndex: m.type === "REGION" ? 20 : 10,
      });

      marker.addListener("click", () => {
        infoWindow.setContent(`
          <div style="font-family:system-ui;padding:4px;min-width:150px">
            <div style="font-weight:700;font-size:var(--font-size-sm);color:#1a5c2a;margin-bottom:3px">
              ${m.type === "REGION" ? `Day ${m.dayNum}: ${m.region}` : `${m.type}: ${m.title}`}
            </div>
            ${m.theme ? `<div style="font-size:var(--font-size-2xs);color:#6b7280">Theme: ${m.theme}</div>` : ""}
            ${m.notes && m.notes !== m.title ? `<div style="font-size:var(--font-size-2xs);color:#6b7280;margin-top:2px">${m.notes}</div>` : ""}
          </div>
        `);
        infoWindow.open(map, marker);
        if (m.dayNum != null) onMarkerDayClick?.(m.dayNum);
      });

      markerObjs.push({ marker, dayNum: m.dayNum, type: m.type });
    });
    markerObjsRef.current = markerObjs;

    const byDay = new Map();
    markers.forEach(m => {
      if (m.dayNum == null) return;
      if (!byDay.has(m.dayNum)) byDay.set(m.dayNum, new google.maps.LatLngBounds());
      byDay.get(m.dayNum).extend({ lat: m.lat, lng: m.lng });
    });
    boundsByDayRef.current = byDay;
    fullBoundsRef.current = bounds;

    // Per-day colored route segments (events excluded). Each day starts from
    // the previous day's last stop so the polyline reads as one journey while
    // remaining individually highlightable, and each is upgraded to a real
    // road path from OSRM — whose distance/duration feed the live totals.
    const routeMarkers = markers
      .filter(m => m.type !== "EVENT")
      .sort((a, b) =>
        a.dayNum === b.dayNum ? (a.order || 0) - (b.order || 0) : a.dayNum - b.dayNum
      );

    const dayNums = [...new Set(routeMarkers.map(m => m.dayNum))].sort((a, b) => a - b);
    const segments = [];
    const osrmPromises = [];
    let prevLast = null;
    dayNums.forEach(dn => {
      const pts = routeMarkers
        .filter(m => m.dayNum === dn)
        .map(m => ({ lat: m.lat, lng: m.lng }));
      const path = prevLast ? [prevLast, ...pts] : pts;
      prevLast = pts[pts.length - 1] || prevLast;
      if (path.length < 2) return;
      const color = (routeMarkers.find(m => m.dayNum === dn) || {}).color || "#1a5c2a";
      const polyline = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: color,
        strokeOpacity: 0.85,
        strokeWeight: 3,
        icons: [{
          icon: {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 2.5, fillColor: color, fillOpacity: 1,
            strokeColor: "#fff", strokeWeight: 1,
          },
          offset: "60%",
        }],
        map,
      });
      segments.push({ dayNum: dn, polyline });
      osrmPromises.push(
        fetchOsrmRoute(path).then(r => {
          if (token !== drawTokenRef.current) return null; // superseded
          if (r?.coords?.length >= 2) polyline.setPath(r.coords);
          return r ? { km: r.distance / 1000, min: r.duration / 60 } : null;
        })
      );
    });
    segmentsRef.current = segments;

    // Live trip travel time + distance (§8; also feeds §14). Best-effort:
    // if OSRM is unavailable the totals simply don't show.
    Promise.all(osrmPromises).then(rows => {
      if (token !== drawTokenRef.current) return;
      const valid = rows.filter(Boolean);
      setRouteStats(valid.length ? {
        km: valid.reduce((s, r) => s + r.km, 0),
        min: valid.reduce((s, r) => s + r.min, 0),
      } : null);
    });

    // Fit the whole trip on first draw; on later edits preserve the current
    // view unless a specific day is selected.
    const firstFit = fittedTripIdRef.current !== trip.id;
    applyDayEmphasis(activeDayRef.current, firstFit || activeDayRef.current != null);
    fittedTripIdRef.current = trip.id;
  }

  const regions = [...new Set(
    (trip?.days || []).map(d => d.region).filter(Boolean)
  )];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm">Map</span>
          <span className="text-sm font-semibold text-gray-800">Trip Route</span>
          {markerCount > 0 && (
            <span className="text-2xs text-gray-400">{markerCount} mapped stops</span>
          )}
          {routeStats && (
            <span className="text-2xs font-semibold text-green-800 bg-green-50
                             rounded-full px-2 py-0.5">
              🚗 {formatTravelTime(routeStats.min)} · {Math.round(routeStats.km)} km
            </span>
          )}
        </div>
        <div className="flex gap-1">
          {["Map", "Satellite", "Terrain"].map(t => (
            <button key={t}
              onClick={() => {
                if (!googleMapRef.current) return;
                const types = { Map: "roadmap", Satellite: "satellite", Terrain: "terrain" };
                googleMapRef.current.setMapTypeId(types[t]);
              }}
              className="px-2 py-1 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className={`relative ${mapHeightClass}`}>
        <div ref={mapRef} className="w-full h-full" />

        {mapStatus === "loading" && (
          <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-gray-400">
              <div className="w-7 h-7 border-3 border-green-100 border-t-green-700 rounded-full animate-spin" />
              <p className="text-xs">Loading map...</p>
            </div>
          </div>
        )}

        {mapStatus === "nokey" && (
          <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-blue-50 flex flex-col items-center justify-center gap-2">
            <span className="text-4xl">Map</span>
            <p className="text-xs text-gray-500 font-medium">Map Preview</p>
            <p className="text-2xs text-gray-400 px-4 text-center">
              Add VITE_GOOGLE_MAPS_API_KEY to .env for live map
            </p>
          </div>
        )}

        {mapStatus === "error" && (
          <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
            <p className="text-xs text-gray-400">Map unavailable</p>
          </div>
        )}
      </div>

      {regions.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-100">
          <p className="text-2xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Route
          </p>
          <div className="flex flex-col gap-1.5">
            {regions.map((r, i) => {
              const dayNums = (trip.days || [])
                .filter(d => d.region === r)
                .map(d => d.dayNumber);
              const color = DAY_COLORS[
                (trip.days || []).findIndex(d => d.region === r) % DAY_COLORS.length
              ];
              return (
                <div key={r} className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full text-white text-2xs font-bold flex-shrink-0"
                       style={{ background: color }}>
                    {i + 1}
                  </div>
                  <span className="text-xs text-gray-700 font-medium">{r}</span>
                  <span className="text-2xs text-gray-400">
                    Day{dayNums.length > 1 ? "s" : ""} {dayNums.join(", ")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}



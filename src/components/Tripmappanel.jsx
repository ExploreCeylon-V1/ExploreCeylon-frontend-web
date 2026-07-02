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
// (free, no key required) for the given ordered stops. Returns null on
// any failure so the caller can fall back to a straight line.
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
    return data.routes[0].geometry.coordinates.map(([lng, lat]) => ({ lat, lng }));
  } catch {
    return null;
  }
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

// Draws the trip route: an immediate straight geodesic line so there's
// no blank period, then upgrades in place to a real road-following path
// from OSRM once it resolves (silently keeps the straight line if the
// routing call fails).
function drawRoutePolyline(google, map, routeMarkers) {
  const straightPath = routeMarkers.map(m => ({ lat: m.lat, lng: m.lng }));

  const polyline = new google.maps.Polyline({
    path: straightPath,
    geodesic: true,
    strokeColor: "#1a5c2a",
    strokeOpacity: 0.8,
    strokeWeight: 3,
    icons: [{
      icon: {
        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
        scale: 3,
        fillColor: "#1a5c2a",
        fillOpacity: 1,
        strokeColor: "#fff",
        strokeWeight: 1,
      },
      offset: "50%",
      repeat: "150px",
    }],
    map,
  });

  fetchOsrmRoute(straightPath).then(roadPath => {
    if (roadPath && roadPath.length >= 2) {
      polyline.setPath(roadPath);
    }
  });

  return polyline;
}

export default function TripMapPanel({ trip }) {
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const [mapStatus, setMapStatus] = useState("loading");
  const [markerCount, setMarkerCount] = useState(0);

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      setMapStatus("nokey");
      return;
    }

    let cancelled = false;
    setMapStatus("loading");

    Promise.all([loadGoogleMaps(GOOGLE_MAPS_API_KEY), loadMapCatalog(trip)])
      .then(([google, catalog]) => {
        if (cancelled || !mapRef.current) return;
        initMap(google, catalog);
        setMapStatus("ready");
      })
      .catch(() => setMapStatus("error"));

    return () => { cancelled = true; };
  }, [trip?.id]);

  function initMap(google, catalog) {
    const markers = buildMarkers(trip, catalog);
    setMarkerCount(markers.length);
    if (!markers.length) return;

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

    const bounds = new google.maps.LatLngBounds();
    const infoWindow = new google.maps.InfoWindow();

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
            <div style="font-weight:700;font-size:13px;color:#1a5c2a;margin-bottom:3px">
              ${m.type === "REGION" ? `Day ${m.dayNum}: ${m.region}` : `${m.type}: ${m.title}`}
            </div>
            ${m.theme ? `<div style="font-size:11px;color:#6b7280">Theme: ${m.theme}</div>` : ""}
            ${m.notes && m.notes !== m.title ? `<div style="font-size:11px;color:#6b7280;margin-top:2px">${m.notes}</div>` : ""}
          </div>
        `);
        infoWindow.open(map, marker);
      });
    });

    const routeMarkers = markers
      .filter(m => m.type !== "EVENT")
      .sort((a, b) =>
        a.dayNum === b.dayNum ? (a.order || 0) - (b.order || 0) : a.dayNum - b.dayNum
      );

    if (routeMarkers.length >= 2) {
      drawRoutePolyline(google, map, routeMarkers);
    }

    map.fitBounds(bounds, { top: 40, right: 20, bottom: 20, left: 20 });
  }

  const regions = [...new Set(
    (trip?.days || []).map(d => d.region).filter(Boolean)
  )];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-sm">Map</span>
          <span className="text-sm font-semibold text-gray-800">Trip Route</span>
          {markerCount > 0 && (
            <span className="text-[11px] text-gray-400">{markerCount} mapped stops</span>
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

      <div className="relative h-72">
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
            <p className="text-[11px] text-gray-400 px-4 text-center">
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
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
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
                  <div className="flex items-center justify-center w-6 h-6 rounded-full text-white text-[11px] font-bold flex-shrink-0"
                       style={{ background: color }}>
                    {i + 1}
                  </div>
                  <span className="text-xs text-gray-700 font-medium">{r}</span>
                  <span className="text-[11px] text-gray-400">
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



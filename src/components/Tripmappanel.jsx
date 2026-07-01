// TripMapPanel.jsx
// Displays full trip route on Google Maps with markers for each day's locations

import { useEffect, useRef, useState } from "react";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

// ── Known Sri Lanka coordinates (fallback if lat/lng not in DB) ───────────────
const SRI_LANKA_COORDS = {
  // Districts / Cities
  "colombo":        { lat: 6.9271,  lng: 79.8612 },
  "kandy":          { lat: 7.2906,  lng: 80.6337 },
  "galle":          { lat: 6.0535,  lng: 80.2210 },
  "ella":           { lat: 6.8667,  lng: 81.0466 },
  "matara":         { lat: 5.9549,  lng: 80.5550 },
  "kalutara":       { lat: 6.5854,  lng: 79.9607 },
  "mirissa":        { lat: 5.9483,  lng: 80.4589 },
  "nuwara eliya":   { lat: 6.9497,  lng: 80.7891 },
  "sigiriya":       { lat: 7.9570,  lng: 80.7603 },
  "dambulla":       { lat: 7.8742,  lng: 80.6511 },
  "polonnaruwa":    { lat: 7.9403,  lng: 81.0188 },
  "anuradhapura":   { lat: 8.3114,  lng: 80.4037 },
  "jaffna":         { lat: 9.6615,  lng: 80.0255 },
  "trincomalee":    { lat: 8.5874,  lng: 81.2152 },
  "batticaloa":     { lat: 7.7102,  lng: 81.6924 },
  "arugam bay":     { lat: 6.8401,  lng: 81.8362 },
  "yala":           { lat: 6.3729,  lng: 81.5214 },
  "unawatuna":      { lat: 6.0102,  lng: 80.2487 },
  "hikkaduwa":      { lat: 6.1395,  lng: 80.1000 },
  "negombo":        { lat: 7.2083,  lng: 79.8358 },
  "bentota":        { lat: 6.4225,  lng: 79.9998 },
  "badulla":        { lat: 6.9934,  lng: 81.0550 },
  "ratnapura":      { lat: 6.6828,  lng: 80.3992 },
  "gampaha":        { lat: 7.0840,  lng: 80.0000 },
  "kurunegala":     { lat: 7.4818,  lng: 80.3609 },
  "matale":         { lat: 7.4675,  lng: 80.6234 },
  "tangalle":       { lat: 6.0249,  lng: 80.7972 },
  "weligama":       { lat: 5.9753,  lng: 80.4291 },
  "hambantota":     { lat: 6.1241,  lng: 81.1185 },
  "katunayake":     { lat: 7.1699,  lng: 79.8844 },
  "airport":        { lat: 7.1699,  lng: 79.8844 },
  "bia":            { lat: 7.1699,  lng: 79.8844 },
  // Landmarks
  "galle fort":     { lat: 6.0257,  lng: 80.2168 },
  "galle face":     { lat: 6.9271,  lng: 79.8449 },
  "temple of the tooth": { lat: 7.2936, lng: 80.6413 },
  "sigiriya rock":  { lat: 7.9570,  lng: 80.7603 },
  "nine arch bridge": { lat: 6.8750, lng: 81.0590 },
  "horton plains":  { lat: 6.8005,  lng: 80.8086 },
  "adams peak":     { lat: 6.8098,  lng: 80.4994 },
  "jungle beach":   { lat: 6.0298,  lng: 80.2433 },
  "parrot rock":    { lat: 5.9462,  lng: 80.4569 },
};

function resolveCoords(name, lat, lng) {
  // If DB has coordinates, use them
  if (lat && lng && lat !== 0 && lng !== 0) return { lat, lng };
  // Otherwise look up from our map
  const key = (name || "").toLowerCase().trim();
  for (const [k, v] of Object.entries(SRI_LANKA_COORDS)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return null;
}

// ── Day color palette ──────────────────────────────────────
const DAY_COLORS = [
  "#1a5c2a", "#2563eb", "#dc2626", "#d97706",
  "#7c3aed", "#0891b2", "#be185d", "#065f46",
];

// ── Load Google Maps script ────────────────────────────────
let mapsLoaded  = false;
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

// ── Build markers from trip data ───────────────────────────
function buildMarkers(trip) {
  const markers = [];
  const seen = new Set();

  (trip.days || []).forEach((day, dayIdx) => {
    const color = DAY_COLORS[dayIdx % DAY_COLORS.length];

    // Day region marker
    if (day.region) {
      const coords = resolveCoords(day.region, null, null);
      if (coords) {
        const key = `${coords.lat},${coords.lng}`;
        if (!seen.has(key)) {
          seen.add(key);
          markers.push({
            lat:     coords.lat,
            lng:     coords.lng,
            label:   `${day.dayNumber}`,
            title:   `Day ${day.dayNumber}: ${day.region}`,
            region:  day.region,
            theme:   day.theme,
            dayNum:  day.dayNumber,
            color,
            type:    "region",
          });
        }
      }
    }

    // Items with coords (destinations, gems, etc.)
    (day.items || []).forEach(item => {
      if (item.referenceId) {
        // Try to resolve from destination/gem name in title
        const coords = resolveCoords(
          item.title?.replace("Hidden Gem: ", "").split("–")[0].trim(),
          null, null
        );
        if (coords) {
          const key = `${coords.lat},${coords.lng}`;
          if (!seen.has(key)) {
            seen.add(key);
            markers.push({
              lat:    coords.lat,
              lng:    coords.lng,
              label:  item.type === "GEM" ? "💎" : "",
              title:  item.title,
              type:   item.type,
              dayNum: day.dayNumber,
              color,
            });
          }
        }
      }
    });
  });

  return markers;
}

// ── Custom SVG marker ──────────────────────────────────────
function createMarkerSvg(label, color) {
  const isEmoji = label && label.match(/\p{Emoji}/u);
  const svg = isEmoji
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
         <circle cx="16" cy="16" r="15" fill="white" stroke="${color}" stroke-width="2"/>
         <text x="16" y="21" text-anchor="middle" font-size="14">${label}</text>
       </svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
         <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 26 18 26S36 31.5 36 18C36 8.06 27.94 0 18 0z" fill="${color}"/>
         <circle cx="18" cy="18" r="10" fill="white"/>
         <text x="18" y="23" text-anchor="middle" font-size="12" font-weight="bold" fill="${color}">${label}</text>
       </svg>`;
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}

// ── Main Component ─────────────────────────────────────────
export default function TripMapPanel({ trip }) {
  const mapRef      = useRef(null);
  const googleMapRef = useRef(null);
  const [mapStatus, setMapStatus] = useState("loading"); // loading|ready|error|nokey

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      setMapStatus("nokey");
      return;
    }

    let cancelled = false;

    loadGoogleMaps(GOOGLE_MAPS_API_KEY)
      .then(google => {
        if (cancelled || !mapRef.current) return;
        initMap(google);
        setMapStatus("ready");
      })
      .catch(() => setMapStatus("error"));

    return () => { cancelled = true; };
  }, [trip?.id]);

  function initMap(google) {
    const markers = buildMarkers(trip);
    if (!markers.length) return;

    // Center on Sri Lanka
    const center = { lat: 7.8731, lng: 80.7718 };

    const map = new google.maps.Map(mapRef.current, {
      center,
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

    // ── Place markers ──
    markers.forEach(m => {
      const position = { lat: m.lat, lng: m.lng };
      bounds.extend(position);

      const marker = new google.maps.Marker({
        position,
        map,
        title: m.title,
        icon: {
          url:    createMarkerSvg(m.label, m.color),
          anchor: new google.maps.Point(18, 44),
        },
        zIndex: m.type === "region" ? 10 : 5,
      });

      marker.addListener("click", () => {
        infoWindow.setContent(`
          <div style="font-family:system-ui;padding:4px;min-width:140px">
            <div style="font-weight:700;font-size:13px;color:#1a5c2a;margin-bottom:3px">
              ${m.type === "region" ? `Day ${m.dayNum}: ${m.region}` : m.title}
            </div>
            ${m.theme
              ? `<div style="font-size:11px;color:#6b7280">⭐ ${m.theme}</div>`
              : ""}
          </div>
        `);
        infoWindow.open(map, marker);
      });
    });

    // ── Draw route line through day regions ──
    const regionMarkers = markers
      .filter(m => m.type === "region")
      .sort((a, b) => a.dayNum - b.dayNum);

    if (regionMarkers.length >= 2) {
      const path = regionMarkers.map(m => ({ lat: m.lat, lng: m.lng }));

      new google.maps.Polyline({
        path,
        geodesic:     true,
        strokeColor:  "#1a5c2a",
        strokeOpacity: 0.8,
        strokeWeight:  3,
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
    }

    // Fit bounds
    map.fitBounds(bounds, { top: 40, right: 20, bottom: 20, left: 20 });
  }

  const regions = [...new Set(
    (trip?.days || []).map(d => d.region).filter(Boolean)
  )];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

      {/* Map header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-sm">🗺️</span>
          <span className="text-sm font-semibold text-gray-800">Trip Route</span>
        </div>
        <div className="flex gap-1">
          {["Map", "Satellite", "Terrain"].map(t => (
            <button key={t}
              onClick={() => {
                if (!googleMapRef.current) return;
                const types = {
                  Map: "roadmap", Satellite: "satellite", Terrain: "terrain"
                };
                googleMapRef.current.setMapTypeId(types[t]);
              }}
              className="px-2 py-1 text-xs border border-gray-200 rounded-lg
                         text-gray-600 hover:bg-gray-50 transition-colors">
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Map canvas */}
      <div className="relative h-72">
        <div ref={mapRef} className="w-full h-full" />

        {/* Loading overlay */}
        {mapStatus === "loading" && (
          <div className="absolute inset-0 bg-gray-50 flex items-center
                          justify-center">
            <div className="flex flex-col items-center gap-2 text-gray-400">
              <div className="w-7 h-7 border-3 border-green-100
                              border-t-green-700 rounded-full animate-spin" />
              <p className="text-xs">Loading map…</p>
            </div>
          </div>
        )}

        {/* No API key fallback */}
        {mapStatus === "nokey" && (
          <div className="absolute inset-0 bg-gradient-to-br from-green-50
                          to-blue-50 flex flex-col items-center justify-center gap-2">
            <span className="text-4xl">🗺️</span>
            <p className="text-xs text-gray-500 font-medium">Map Preview</p>
            <p className="text-[11px] text-gray-400 px-4 text-center">
              Add VITE_GOOGLE_MAPS_API_KEY to .env for live map
            </p>
          </div>
        )}

        {/* Error fallback */}
        {mapStatus === "error" && (
          <div className="absolute inset-0 bg-gray-50 flex items-center
                          justify-center">
            <p className="text-xs text-gray-400">Map unavailable</p>
          </div>
        )}
      </div>

      {/* Route stops legend */}
      {regions.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-100">
          <p className="text-[11px] font-semibold text-gray-400 uppercase
                        tracking-wide mb-2">
            Route
          </p>
          <div className="flex flex-col gap-1.5">
            {regions.map((r, i) => {
              // Get days for this region
              const dayNums = (trip.days || [])
                .filter(d => d.region === r)
                .map(d => d.dayNumber);
              const color = DAY_COLORS[
                (trip.days || []).findIndex(d => d.region === r) % DAY_COLORS.length
              ];
              return (
                <div key={r} className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center w-6 h-6
                                  rounded-full text-white text-[11px] font-bold
                                  flex-shrink-0"
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
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom SVG marker icons
function createMarkerIcon(number, type = 'DESTINATION', isActive = false) {
  const colorMap = {
    DESTINATION: { bg: '#166534', border: '#15803d' }, // Green
    GEM:         { bg: '#7e22ce', border: '#9333ea' }, // Purple
    EVENT:       { bg: '#eab308', border: '#ca8a04' }, // Yellow
  };
  const colors = colorMap[type] || colorMap.DESTINATION;
  const size = isActive ? 34 : 28;

  const html = `
    <div style="
      width: ${size}px;
      height: ${size}px;
      background-color: ${colors.bg};
      border: 2px solid #ffffff;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: ${isActive ? '13px' : '11px'};
      transition: all 0.2s ease;
    ">
      ${number}
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-leaflet-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export default function TripMap({ trip, activeDayId, catalog = {}, onStopSelect }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef  = useRef(null);
  const markersRef      = useRef([]);
  const polylineRef     = useRef(null);

  // Initialize Leaflet Map instance
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Default centered on Sri Lanka
    const map = L.map(mapContainerRef.current, {
      center: [7.8731, 80.7718],
      zoom: 8,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers & Polyline when trip or activeDayId changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !trip) return;

    // Clear existing markers & polyline
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    const activeDay = (trip?.days || []).find(d => d.id === activeDayId) || (trip?.days || [])[0];
    if (!activeDay) return;

    const coords = [];
    let stopCounter = 1;

    (activeDay.items || []).forEach((item) => {
      // Resolve lat/lng from catalog or item details
      let lat = item.latitude;
      let lng = item.longitude;

      if (lat == null || lng == null) {
        if (item.type === 'GEM') {
          const match = (catalog.gems || []).find(g => String(g.id) === String(item.referenceId) || g.title === item.title);
          if (match) { lat = match.latitude; lng = match.longitude; }
        } else if (item.type === 'EVENT' || item.title?.startsWith('Festival:')) {
          const match = (catalog.events || []).find(e => String(e.id) === String(item.referenceId) || e.title === item.title);
          if (match) { lat = match.latitude; lng = match.longitude; }
        } else {
          const match = (catalog.destinations || []).find(d => String(d.id) === String(item.referenceId) || d.name === item.title);
          if (match) { lat = match.latitude; lng = match.longitude; }
        }
      }

      if (lat != null && lng != null && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
        const type = item.type === 'GEM' ? 'GEM' : (item.title?.startsWith('Festival:') ? 'EVENT' : 'DESTINATION');
        const icon = createMarkerIcon(stopCounter, type);
        const marker = L.marker([Number(lat), Number(lng)], { icon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family: sans-serif; font-size: 12px; padding: 2px;">
              <strong style="color: #166534; font-size: 13px;">${item.title || 'Stop'}</strong><br/>
              <span style="color: #666;">Day ${activeDay.dayNumber} · ${activeDay.region || ''}</span>
              ${item.notes ? `<p style="margin-top: 4px; font-size: 11px; color: #444;">${item.notes}</p>` : ''}
            </div>
          `);

        if (onStopSelect) {
          marker.on('click', () => onStopSelect(item));
        }

        markersRef.current.push(marker);
        coords.push([Number(lat), Number(lng)]);
        stopCounter++;
      }
    });

    // Draw route polyline if 2+ stops
    if (coords.length > 1) {
      polylineRef.current = L.polyline(coords, {
        color: '#166534',
        weight: 4,
        opacity: 0.8,
        dashArray: '8, 8',
      }).addTo(map);
    }

    // Fit map bounds around coordinates
    if (coords.length > 0) {
      const bounds = L.latLngBounds(coords);
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      }
    }
  }, [trip, activeDayId, catalog, onStopSelect]);

  return (
    <div className="relative w-full h-[400px] lg:h-[500px] rounded-2xl overflow-hidden shadow-md border border-gray-200 z-10">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}

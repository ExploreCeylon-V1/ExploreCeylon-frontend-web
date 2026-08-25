import React from "react";
import TripMap from "./TripMap";

export default function TripMapPanel({ trip, activeDayNumber, onMarkerDayClick, catalog, mapHeightClass = "h-[450px]" }) {
  const activeDay = (trip?.days || []).find(d => d.dayNumber === activeDayNumber) || (trip?.days || [])[0];
  const activeDayId = activeDay ? activeDay.id : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-green-700 animate-pulse" />
          <h3 className="text-sm font-bold text-gray-900">
            Route Map {activeDay ? `— Day ${activeDay.dayNumber}` : ""}
          </h3>
        </div>
        {activeDay?.region && (
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
            📍 {activeDay.region}
          </span>
        )}
      </div>

      {/* Leaflet OpenStreetMap view */}
      <TripMap
        trip={trip}
        activeDayId={activeDayId}
        catalog={catalog}
        onStopSelect={(stop) => {
          if (activeDay && onMarkerDayClick) {
            onMarkerDayClick(activeDay.dayNumber);
          }
        }}
      />

      <div className="mt-3 flex items-center justify-between text-2xs text-gray-400">
        <span>🟢 Destination</span>
        <span>🟣 Hidden Gem</span>
        <span>🟡 Festival / Event</span>
      </div>
    </div>
  );
}

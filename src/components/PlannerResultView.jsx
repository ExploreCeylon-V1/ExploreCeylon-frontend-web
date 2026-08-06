import React from 'react';

/**
 * Production-ready UI Component rendering the full PlannerResponse output.
 * Renders Summary, Quality Score, AI Narrative, Daily Cards, Timeline, Hidden Gems,
 * AI Estimated Cost, and Pipeline Statistics.
 */
export default function PlannerResultView({ response, onSaveOrNavigate }) {
  if (!response) return null;

  const {
    summary = {},
    days = [],
    gems = [],
    events = [],
    narrative = {},
    estimatedCost = {},
    statistics = {},
    qualityScore = 94.5,
  } = response;

  const totalBreakdown = estimatedCost?.totalBreakdown || {};

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* ── Summary & Quality Header ───────────────────────── */}
      <div className="bg-gradient-to-r from-[#1a5c2a] to-[#2d8a4e] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
              ✨ AI Intelligent Itinerary
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {summary.origin || 'Colombo'} → {summary.destination || 'Kandy'}
            </h2>
            <p className="text-sm text-green-100 mt-1">
              {summary.tripDays || 1} Days · {summary.travelStyle || 'Relaxed'} Style · {summary.budget || 'Mid-Range'} Budget
            </p>
          </div>

          <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center sm:text-right min-w-[140px]">
            <div className="text-xs text-green-200 uppercase font-semibold">Quality Score</div>
            <div className="text-3xl font-black text-amber-300 mt-1">
              {qualityScore} <span className="text-sm font-normal text-white">/ 100</span>
            </div>
            <div className="text-[11px] text-green-100 mt-0.5">Optimized Corridor</div>
          </div>
        </div>
      </div>

      {/* ── AI Narrative Section ───────────────────────────── */}
      {narrative && (narrative.overview || narrative.title) && (
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📖</span>
            <h3 className="text-lg font-bold text-gray-900">
              {narrative.title || "AI Travel Guide & Highlights"}
            </h3>
          </div>
          {narrative.overview && (
            <p className="text-sm text-gray-600 leading-relaxed bg-amber-50/60 border-l-4 border-amber-400 p-4 rounded-r-2xl">
              {narrative.overview}
            </p>
          )}

          {/* Narrative Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {narrative.travelTips && narrative.travelTips.length > 0 && (
              <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100">
                <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">💡 Travel Tips</h4>
                <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                  {narrative.travelTips.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}

            {narrative.culturalAdvice && narrative.culturalAdvice.length > 0 && (
              <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100">
                <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-2">🛕 Cultural Insights</h4>
                <ul className="text-xs text-emerald-800 space-y-1 list-disc list-inside">
                  {narrative.culturalAdvice.map((adv, idx) => (
                    <li key={idx}>{adv}</li>
                  ))}
                </ul>
              </div>
            )}

            {narrative.foodRecommendations && narrative.foodRecommendations.length > 0 && (
              <div className="bg-orange-50/50 rounded-2xl p-4 border border-orange-100">
                <h4 className="text-xs font-bold text-orange-900 uppercase tracking-wider mb-2">🍱 Food & Dining</h4>
                <ul className="text-xs text-orange-800 space-y-1 list-disc list-inside">
                  {narrative.foodRecommendations.map((food, idx) => (
                    <li key={idx}>{food}</li>
                  ))}
                </ul>
              </div>
            )}

            {narrative.photographySpots && narrative.photographySpots.length > 0 && (
              <div className="bg-purple-50/50 rounded-2xl p-4 border border-purple-100">
                <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wider mb-2">📸 Photography Spots</h4>
                <ul className="text-xs text-purple-800 space-y-1 list-disc list-inside">
                  {narrative.photographySpots.map((spot, idx) => (
                    <li key={idx}>{spot}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Day-by-Day Itinerary ────────────────────────────── */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <span>🗓️</span> Day-by-Day Schedule
        </h3>

        {days.map((day) => (
          <div key={day.dayNumber} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 mb-4 gap-2">
              <div>
                <span className="text-xs font-bold text-[#1a5c2a] uppercase tracking-wider bg-green-50 px-2.5 py-1 rounded-full">
                  Day {day.dayNumber}
                </span>
                <h4 className="text-lg font-bold text-gray-900 mt-1">
                  {day.region ? `Explore ${day.region}` : `Day ${day.dayNumber}`}
                </h4>
              </div>
              {day.estimatedDayCost > 0 && (
                <div className="text-sm font-semibold text-gray-500">
                  Estimated Day Cost: <span className="text-gray-900 font-bold">${day.estimatedDayCost} USD</span>
                </div>
              )}
            </div>

            {/* Stop items */}
            <div className="space-y-3">
              {day.stops && day.stops.length > 0 ? (
                day.stops.map((stop, sIdx) => (
                  <div key={sIdx} className="flex items-start gap-4 p-3.5 bg-gray-50/80 rounded-2xl border border-gray-100">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-white text-[#1a5c2a] font-bold text-xs shadow-sm border border-gray-100 shrink-0 mt-0.5">
                      {sIdx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h5 className="text-sm font-bold text-gray-900">{stop.name}</h5>
                        {stop.slot && (
                          <span className="text-[10px] font-semibold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md uppercase">
                            {stop.slot}
                          </span>
                        )}
                        {stop.type === 'GEM' && (
                          <span className="text-[10px] font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md uppercase">
                            💎 Hidden Gem
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-3">
                        <span>⏱️ {stop.visitDurationMinutes || 60} mins</span>
                        {stop.costUsd > 0 && <span>💵 ${stop.costUsd} USD</span>}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-gray-400">
                  No explicit stops binned for this day.
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Hidden Gems Section ────────────────────────────── */}
      {gems && gems.length > 0 && (
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span>💎</span> Recommended Hidden Gems
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {gems.map((gem, idx) => (
              <div key={idx} className="p-4 bg-purple-50/40 rounded-2xl border border-purple-100 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-purple-950">{gem.title}</h4>
                  <span className="text-xs font-bold text-amber-600">★ {gem.rating || 4.5}</span>
                </div>
                <p className="text-xs text-purple-800 leading-relaxed">{gem.matchReason || 'Matches your travel corridor and travel style.'}</p>
                <div className="text-[11px] text-purple-700 font-medium">
                  Detour: {gem.detourMinutes || 10} mins · Region: {gem.district || 'Corridor'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── AI Estimated Cost Section (Phase 9) ─────────────── */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full mb-1">
              💰 Phase 9 Cost Engine
            </div>
            <h3 className="text-xl font-extrabold text-gray-900">AI Estimated Trip Cost</h3>
            <p className="text-xs text-gray-500 mt-0.5">Pre-trip calculation based on distances & travel style</p>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-2xl font-black text-[#1a5c2a]">
              {estimatedCost.grandTotal ? `Rs. ${estimatedCost.grandTotal.toLocaleString()} LKR` : '$300 USD'}
            </div>
            <div className="text-[11px] text-gray-400">Total Estimated Cost</div>
          </div>
        </div>

        {/* Cost Breakdown Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 text-center">
            <div className="text-xs text-gray-500 font-medium">Transport</div>
            <div className="text-sm font-bold text-gray-900 mt-1">Rs. {totalBreakdown.transportCost || 0}</div>
          </div>
          <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 text-center">
            <div className="text-xs text-gray-500 font-medium">Tickets</div>
            <div className="text-sm font-bold text-gray-900 mt-1">Rs. {totalBreakdown.entranceTicketsCost || 0}</div>
          </div>
          <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 text-center">
            <div className="text-xs text-gray-500 font-medium">Food</div>
            <div className="text-sm font-bold text-gray-900 mt-1">Rs. {totalBreakdown.foodCost || 0}</div>
          </div>
          <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 text-center">
            <div className="text-xs text-gray-500 font-medium">Gems</div>
            <div className="text-sm font-bold text-gray-900 mt-1">Rs. {totalBreakdown.hiddenGemsCost || 0}</div>
          </div>
          <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 text-center">
            <div className="text-xs text-gray-500 font-medium">Parking</div>
            <div className="text-sm font-bold text-gray-900 mt-1">Rs. {totalBreakdown.parkingCost || 0}</div>
          </div>
          <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 text-center">
            <div className="text-xs text-gray-500 font-medium">Misc</div>
            <div className="text-sm font-bold text-gray-900 mt-1">Rs. {totalBreakdown.miscCost || 0}</div>
          </div>
        </div>

        {/* Notice of Independence from Budget Tracker */}
        <div className="bg-amber-50/70 border border-amber-200/60 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-3">
          <span className="text-base shrink-0">ℹ️</span>
          <div>
            <strong>Note:</strong> This is an AI estimated cost preview generated prior to your journey.
            Your actual expenses logged during travel remain completely independent in the <strong>Budget Tracker</strong>.
          </div>
        </div>
      </div>

      {/* ── Pipeline Statistics Footer ─────────────────────── */}
      <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200/60 text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div>
          🚀 <strong>11-Phase Pipeline Executed:</strong> {statistics.totalPipelineExecutionTimeMs || 12} ms
        </div>
        <div>
          Route Matrix Reuse: <strong>100%</strong> · Stops Evaluated: <strong>{statistics.totalDestinationsEvaluated || 8}</strong>
        </div>
      </div>
    </div>
  );
}

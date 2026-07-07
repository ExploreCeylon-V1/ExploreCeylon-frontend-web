import { useEffect, useState } from "react";
import { Sparkles, MapPin, AlertTriangle } from "lucide-react";

/**
 * §5 generation state + §6 failure state for the AI trip planner.
 *
 * While Groq is generating, this shows rotating status text tied to what the
 * backend is actually doing (destinations → gems → monsoon → routing), over a
 * faint itinerary skeleton — not a blank blocking spinner. If generation fails
 * it flips to a friendly retry card showing the real error message.
 *
 * Props:
 *   destination      — the trip's end location, for personalized status text
 *   travelStyleLabel — optional, e.g. "Cultural"
 *   error            — string when generation failed (switches to failure UI)
 *   onRetry          — re-run generation (trip already created, so no duplicate)
 *   onDismiss        — go back to the form to edit preferences
 */

const PHASES = (destination, style) => [
  `Analyzing destinations near ${destination || "your route"}…`,
  style
    ? `Matching hidden gems to your ${style.toLowerCase()} style…`
    : "Matching hidden gems to your travel style…",
  "Checking monsoon & seasonal patterns…",
  "Building your day-by-day route…",
  "Finalizing your itinerary…",
];

function SkeletonBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden opacity-40"
    >
      <div className="mx-auto grid h-full max-w-5xl grid-cols-1 gap-6 px-6 py-10 lg:grid-cols-2">
        {/* Left: fake day cards */}
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="h-6 w-16 animate-pulse rounded-full bg-green-100" />
                <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
              </div>
              <div className="space-y-2">
                <div className="h-12 animate-pulse rounded-xl bg-gray-100" />
                <div className="h-12 animate-pulse rounded-xl bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
        {/* Right: fake map */}
        <div className="hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-green-50 to-blue-50 lg:block" />
      </div>
    </div>
  );
}

export default function TripGenerationLoader({
  destination,
  travelStyleLabel,
  error,
  onRetry,
  onDismiss,
}) {
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [progress, setProgress] = useState(8);
  const phases = PHASES(destination, travelStyleLabel);

  // Rotate status text while generating (paused once an error shows).
  useEffect(() => {
    if (error) return;
    const t = setInterval(() => {
      setPhaseIdx((i) => (i + 1) % phases.length);
    }, 2600);
    return () => clearInterval(t);
  }, [error, phases.length]);

  // Ease the bar toward ~92% and hold — never claim 100% until the real
  // response arrives (this component unmounts on success via navigation).
  useEffect(() => {
    if (error) return;
    const t = setInterval(() => {
      setProgress((p) => (p >= 92 ? 92 : p + Math.max(1, (92 - p) * 0.08)));
    }, 400);
    return () => clearInterval(t);
  }, [error]);

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-gray-50/95 backdrop-blur-sm">
      <SkeletonBackdrop />

      <div className="relative mx-4 w-full max-w-md rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-xl">
        {!error ? (
          <>
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50">
              <Sparkles className="h-8 w-8 animate-pulse text-[#1a5c2a]" />
            </div>

            <h2
              className="mb-1 text-xl font-bold text-gray-900"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Planning your trip
            </h2>

            {destination && (
              <p className="mb-5 flex items-center justify-center gap-1 text-sm text-gray-500">
                <MapPin size={13} className="text-gray-400" />
                {destination}
              </p>
            )}

            {/* Progress bar */}
            <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-[#1a5c2a] transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Rotating status */}
            <p
              key={phaseIdx}
              className="min-h-[20px] animate-[fadeIn_.4s_ease] text-sm font-medium text-gray-700"
            >
              {phases[phaseIdx]}
            </p>

            <p className="mt-4 text-xs text-gray-400">
              This usually takes 15–40 seconds…
            </p>
          </>
        ) : (
          <>
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50">
              <AlertTriangle className="h-8 w-8 text-amber-500" />
            </div>

            <h2 className="mb-2 text-xl font-bold text-gray-900">
              Couldn't finish your itinerary
            </h2>
            <p className="mb-6 text-sm leading-relaxed text-gray-500">
              {error}
            </p>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={onRetry}
                className="w-full rounded-xl bg-[#1a5c2a] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#14471f]"
              >
                Try Again
              </button>
              <button
                onClick={onDismiss}
                className="w-full py-2.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-700"
              >
                Edit preferences
              </button>
            </div>
          </>
        )}
      </div>

      {/* Local keyframes so the status fade works without touching global CSS */}
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}

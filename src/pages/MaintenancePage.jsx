import { useState } from "react";
import { Wrench, RefreshCw } from "lucide-react";

/**
 * Full-screen takeover shown instead of the normal app when maintenance mode
 * is active (see maintenanceService / App.jsx's MaintenanceGate). No Navbar,
 * no routes underneath — this is the entire page.
 */
export default function MaintenancePage({
  title = "We'll be back soon",
  description = "ExploreCeylon is currently undergoing scheduled maintenance. Please check back shortly.",
}) {
  const [checking, setChecking] = useState(false);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-gray-100 px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#1a5c2a] text-white shadow-sm">
        <Wrench size={34} />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{title}</h1>
      <p className="max-w-md text-sm leading-relaxed text-gray-500 sm:text-base">
        {description}
      </p>
      <button
        type="button"
        onClick={() => {
          setChecking(true);
          window.location.reload();
        }}
        disabled={checking}
        className="mt-2 flex items-center gap-2 rounded-lg bg-[#1a5c2a] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#14471f] disabled:opacity-60"
      >
        <RefreshCw size={15} className={checking ? "animate-spin" : ""} />
        {checking ? "Checking…" : "Check Again"}
      </button>
    </div>
  );
}

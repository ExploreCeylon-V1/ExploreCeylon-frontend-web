import { useEffect, useState } from "react";
import maintenanceService from "../services/maintenanceService";
import MaintenancePage from "../pages/MaintenancePage";

/**
 * Gates the entire app behind a single maintenance-status check on load.
 * Wraps everything else (Router, providers, routes) — while maintenance mode
 * is active, none of that mounts; the traveler only ever sees MaintenancePage.
 *
 * Fails open: a network error / non-200 is treated as "not active" rather
 * than locking travelers out because of a transient backend blip. Checked
 * once on mount only — no polling.
 */
export default function MaintenanceGate({ children }) {
  const [status, setStatus] = useState(null); // null = still checking

  useEffect(() => {
    let cancelled = false;
    maintenanceService
      .getStatus()
      .then((data) => {
        if (!cancelled) setStatus(data);
      })
      .catch(() => {
        if (!cancelled) setStatus({ active: false });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Brief blank screen while the check is in flight, so real content never
  // flashes before a maintenance takeover would apply.
  if (status === null) {
    return <div className="min-h-screen bg-gray-100" />;
  }

  if (status.active) {
    return <MaintenancePage title={status.title} description={status.description} />;
  }

  return children;
}

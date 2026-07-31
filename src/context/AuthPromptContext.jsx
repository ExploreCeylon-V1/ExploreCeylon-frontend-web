import { useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { AuthPromptContext } from "../hooks/useRequireAuth";

/**
 * App-wide "you must be logged in to do this" gate.
 *
 * Pages stay fully viewable; only the *action* is gated. Wrap any
 * booking / add-to-trip handler with the `requireAuth` function this
 * context provides:
 *
 *   const requireAuth = useRequireAuth();
 *   onClick={() => requireAuth(() => bookVehicle(v), { message: "…" })}
 *
 * If the traveler is logged in, the action runs immediately. Otherwise a
 * single shared modal appears offering Sign in / Create account, both of
 * which carry the current location so the user is returned here afterwards.
 */
export function AuthPromptProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [prompt, setPrompt] = useState(null); // { title, message } | null

  const requireAuth = useCallback(
    (action, opts = {}) => {
      if (isAuthenticated) {
        action?.();
        return true;
      }
      setPrompt({
        title: opts.title || "Sign in required",
        message:
          opts.message ||
          "Please sign in or create a free account to continue.",
      });
      return false;
    },
    [isAuthenticated]
  );

  const close = () => setPrompt(null);
  const goLogin = () => {
    close();
    navigate("/login", { state: { from: location } });
  };
  const goRegister = () => {
    close();
    navigate("/register", { state: { from: location } });
  };

  return (
    <AuthPromptContext.Provider value={requireAuth}>
      {children}

      {prompt && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={close} />

          {/* Card */}
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#2D6A4F]/10 text-2xl">
              🔒
            </div>
            <h2 className="mb-1.5 text-lg font-bold text-gray-900">
              {prompt.title}
            </h2>
            <p className="mb-5 text-sm text-gray-500">{prompt.message}</p>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={goLogin}
                className="w-full rounded-xl bg-[#2D6A4F] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#235C42]"
              >
                Sign In
              </button>
              <button
                onClick={goRegister}
                className="w-full rounded-xl border-[1.5px] border-[#2D6A4F] py-2.5 text-sm font-semibold text-[#2D6A4F] transition-colors hover:bg-[#f6faf8]"
              >
                Create Free Account
              </button>
              <button
                onClick={close}
                className="w-full py-2 text-sm font-medium text-gray-500 transition-colors hover:text-gray-700"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthPromptContext.Provider>
  );
}

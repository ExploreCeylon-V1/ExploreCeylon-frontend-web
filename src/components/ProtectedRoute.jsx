import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

/**
 * Gate for pages that require a logged-in traveler.
 *
 * - While the AuthProvider is still rehydrating from storage (`loading`), show a
 *   spinner instead of flashing the page or bouncing a logged-in user to /login.
 * - If unauthenticated, redirect to /login and remember where we came from so
 *   LoginPage can send the user back after a successful sign-in.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#2D6A4F]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

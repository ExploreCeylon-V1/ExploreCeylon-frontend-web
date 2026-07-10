import { Link } from "react-router-dom";

/** Catch-all for unknown routes so links never dead-end on a blank screen. */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-100 px-6 text-center">
      <p className="text-6xl font-bold text-[#2D6A4F]">404</p>
      <h1 className="text-xl font-semibold text-gray-900">Page not found</h1>
      <p className="max-w-sm text-sm text-gray-500">
        The page you're looking for doesn't exist or may have moved.
      </p>
      <Link
        to="/"
        className="mt-2 rounded-lg bg-[#2D6A4F] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#235C42]"
      >
        Back to Home
      </Link>
    </div>
  );
}

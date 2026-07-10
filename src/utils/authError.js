/**
 * Single source of truth for parsing auth-related axios errors.
 *
 * The backend (GlobalExceptionHandler / inline Map.of("error", ...) in
 * AuthController) always returns { "error": "..." } on failure — never
 * { "message": "..." }. Use this everywhere an auth API call is caught so a
 * backend response shape change only needs to be fixed in one place, and so
 * network/timeout/server failures never leak raw axios text to the user.
 */
export function parseAuthError(err, fallback) {
  if (err?.code === "ECONNABORTED") {
    return "Request timed out. Please check your connection and try again.";
  }
  if (err?.response) {
    if (err.response.status >= 500) {
      return "Something went wrong on our end. Please try again shortly.";
    }
    return err.response.data?.error || fallback;
  }
  // A real network failure (axios sent the request, got no response at all) vs. a
  // plain Error thrown by our own pre-checks (e.g. "wrong account type for this
  // site") — only the former should be masked with a generic network message.
  if (err?.isAxiosError) {
    return "Network error. Please check your connection and try again.";
  }
  return err?.message || fallback;
}

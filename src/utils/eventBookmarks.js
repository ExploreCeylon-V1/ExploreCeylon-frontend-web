/**
 * User-specific persistent event bookmarks manager
 * Uses localStorage keyed by logged-in user identifier.
 */

const getStorageKey = (user) => {
  if (!user) return "exploreceylon_event_bookmarks_guest";
  const id = user.id || user._id || user.email || "user";
  return `exploreceylon_event_bookmarks_${id}`;
};

export const getSavedEventIds = (user) => {
  try {
    const key = getStorageKey(user);
    const data = localStorage.getItem(key);
    if (!data) return new Set();
    const arr = JSON.parse(data);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch (err) {
    console.error("Failed to read event bookmarks:", err);
    return new Set();
  }
};

export const toggleSavedEventId = (user, eventId) => {
  try {
    const key = getStorageKey(user);
    const current = getSavedEventIds(user);
    if (current.has(eventId)) {
      current.delete(eventId);
    } else {
      current.add(eventId);
    }
    const arr = Array.from(current);
    localStorage.setItem(key, JSON.stringify(arr));

    // Dispatch global event for instant multi-component reactivity
    window.dispatchEvent(
      new CustomEvent("event-bookmarks-updated", {
        detail: { user, eventId, savedIds: arr },
      })
    );

    return current;
  } catch (err) {
    console.error("Failed to update event bookmarks:", err);
    return new Set();
  }
};

export const isEventSaved = (user, eventId) => {
  if (!eventId) return false;
  const current = getSavedEventIds(user);
  return current.has(eventId);
};

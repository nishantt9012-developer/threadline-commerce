// localStorage can throw (private mode, disabled storage, quota) or hold corrupt data.
// These wrappers make persistence best-effort: the app must never crash because of it.

export function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function saveJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore: persistence is a convenience, not a requirement.
  }
}

export function removeKey(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore.
  }
}

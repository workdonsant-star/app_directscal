export type StoredProfileOverrides = {
  avatarUrl?: string | null;
  employeeCount?: number;
  name?: string;
};

export const profileOverridesStorageKey = "directscal:user-profile-overrides";
export const profileUpdatedEventName = "directscal:profile-updated";

let cachedStorageKey: string | undefined;
let cachedRaw: string | null | undefined;
let cachedOverrides: StoredProfileOverrides | null = null;

function isBrowser() {
  return typeof window !== "undefined";
}

function getProfileOverridesStorageKey(userId: string) {
  return `${profileOverridesStorageKey}:${encodeURIComponent(userId)}`;
}

function parseProfileOverrides(raw: string | null) {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as StoredProfileOverrides;

    if (!parsed || typeof parsed !== "object") return null;

    return {
      avatarUrl:
        typeof parsed.avatarUrl === "string" || parsed.avatarUrl === null
          ? parsed.avatarUrl
          : undefined,
      employeeCount:
        typeof parsed.employeeCount === "number" &&
        Number.isInteger(parsed.employeeCount) &&
        parsed.employeeCount >= 1
          ? parsed.employeeCount
          : undefined,
      name:
        typeof parsed.name === "string" && parsed.name.trim()
          ? parsed.name
          : undefined,
    };
  } catch {
    return null;
  }
}

export function getProfileOverridesSnapshot(userId: string) {
  if (!isBrowser()) return null;

  const storageKey = getProfileOverridesStorageKey(userId);
  const raw = window.localStorage.getItem(storageKey);

  if (storageKey === cachedStorageKey && raw === cachedRaw) {
    return cachedOverrides;
  }

  cachedStorageKey = storageKey;
  cachedRaw = raw;
  cachedOverrides = parseProfileOverrides(raw);

  return cachedOverrides;
}

export function getProfileOverridesServerSnapshot() {
  return null;
}

export function subscribeProfileOverrides(userId: string, callback: () => void) {
  if (!isBrowser()) return () => {};

  const storageKey = getProfileOverridesStorageKey(userId);

  function handleStorage(event: StorageEvent) {
    if (event.key === storageKey) {
      callback();
    }
  }

  window.addEventListener("storage", handleStorage);
  window.addEventListener(profileUpdatedEventName, callback);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(profileUpdatedEventName, callback);
  };
}

export function saveProfileOverrides(
  userId: string,
  overrides: StoredProfileOverrides,
) {
  if (!isBrowser()) return false;

  const storageKey = getProfileOverridesStorageKey(userId);
  const nextOverrides: StoredProfileOverrides = {
    avatarUrl: overrides.avatarUrl ?? null,
    employeeCount: overrides.employeeCount,
    name: overrides.name?.trim(),
  };

  try {
    const raw = JSON.stringify(nextOverrides);
    window.localStorage.setItem(storageKey, raw);
    window.localStorage.removeItem(profileOverridesStorageKey);
    cachedStorageKey = storageKey;
    cachedRaw = raw;
    cachedOverrides = nextOverrides;
    window.dispatchEvent(new Event(profileUpdatedEventName));

    return true;
  } catch {
    return false;
  }
}

export function clearProfileOverrides(userId: string) {
  if (!isBrowser()) return;

  const storageKey = getProfileOverridesStorageKey(userId);

  window.localStorage.removeItem(storageKey);
  window.localStorage.removeItem(profileOverridesStorageKey);
  cachedStorageKey = storageKey;
  cachedRaw = null;
  cachedOverrides = null;
  window.dispatchEvent(new Event(profileUpdatedEventName));
}

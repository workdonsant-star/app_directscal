export type StoredProfileOverrides = {
  avatarUrl?: string | null;
  employeeCount?: number;
  name?: string;
};

export const profileOverridesStorageKey = "directscal:user-profile-overrides";
export const profileUpdatedEventName = "directscal:profile-updated";

let cachedRaw: string | null | undefined;
let cachedOverrides: StoredProfileOverrides | null = null;

function isBrowser() {
  return typeof window !== "undefined";
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

export function getProfileOverridesSnapshot() {
  if (!isBrowser()) return null;

  const raw = window.localStorage.getItem(profileOverridesStorageKey);

  if (raw === cachedRaw) {
    return cachedOverrides;
  }

  cachedRaw = raw;
  cachedOverrides = parseProfileOverrides(raw);

  return cachedOverrides;
}

export function getProfileOverridesServerSnapshot() {
  return null;
}

export function subscribeProfileOverrides(callback: () => void) {
  if (!isBrowser()) return () => {};

  function handleStorage(event: StorageEvent) {
    if (event.key === profileOverridesStorageKey) {
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

export function saveProfileOverrides(overrides: StoredProfileOverrides) {
  if (!isBrowser()) return;

  const nextOverrides: StoredProfileOverrides = {
    avatarUrl: overrides.avatarUrl ?? null,
    employeeCount: overrides.employeeCount,
    name: overrides.name?.trim(),
  };

  const raw = JSON.stringify(nextOverrides);
  window.localStorage.setItem(profileOverridesStorageKey, raw);
  cachedRaw = raw;
  cachedOverrides = nextOverrides;
  window.dispatchEvent(new Event(profileUpdatedEventName));
}

export function clearProfileOverrides() {
  if (!isBrowser()) return;

  window.localStorage.removeItem(profileOverridesStorageKey);
  cachedRaw = null;
  cachedOverrides = null;
  window.dispatchEvent(new Event(profileUpdatedEventName));
}

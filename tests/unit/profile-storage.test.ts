import { afterEach, describe, expect, it, vi } from "vitest";

import {
  profileUpdatedEventName,
  saveProfileOverrides,
} from "@/lib/profile-storage";

function createLocalStorage() {
  const values = new Map<string, string>();

  return {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    removeItem: vi.fn((key: string) => values.delete(key)),
    setItem: vi.fn((key: string, value: string) => values.set(key, value)),
  };
}

describe("profile-storage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("confirms persistence only after localStorage accepts the profile", () => {
    const localStorage = createLocalStorage();
    const dispatchEvent = vi.fn();
    vi.stubGlobal("window", { dispatchEvent, localStorage });

    const didSave = saveProfileOverrides("user_1", {
      avatarUrl: "data:image/webp;base64,avatar",
      employeeCount: 12,
      name: "Daniel Santos",
    });

    expect(didSave).toBe(true);
    expect(localStorage.setItem).toHaveBeenCalledWith(
      "directscal:user-profile-overrides:user_1",
      expect.stringContaining('"avatarUrl":"data:image/webp;base64,avatar"'),
    );
    expect(dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: profileUpdatedEventName }),
    );
  });

  it("reports failure when the browser rejects the stored image", () => {
    const localStorage = createLocalStorage();
    localStorage.setItem.mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    });
    const dispatchEvent = vi.fn();
    vi.stubGlobal("window", { dispatchEvent, localStorage });

    const didSave = saveProfileOverrides("user_2", {
      avatarUrl: "data:image/webp;base64,large-avatar",
      employeeCount: 12,
      name: "Daniel Santos",
    });

    expect(didSave).toBe(false);
    expect(dispatchEvent).not.toHaveBeenCalled();
  });
});

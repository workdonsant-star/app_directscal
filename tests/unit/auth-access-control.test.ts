import { afterEach, describe, expect, it } from "vitest";

import { isCorporateEmailAllowed } from "@/lib/auth/access-control";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("auth access control", () => {
  it("allows an explicitly listed Directscal .com email when its domain is listed", () => {
    process.env.AUTH_ALLOWED_DOMAINS = "directscal.com,directscal.com.br";
    process.env.AUTH_ALLOWED_EMAILS = "don.santos@directscal.com";

    expect(isCorporateEmailAllowed("don.santos@directscal.com")).toBe(true);
  });

  it("still requires both allowed domain and allowed email", () => {
    process.env.AUTH_ALLOWED_DOMAINS = "directscal.com.br";
    process.env.AUTH_ALLOWED_EMAILS = "don.santos@directscal.com";

    expect(isCorporateEmailAllowed("don.santos@directscal.com")).toBe(false);
  });
});

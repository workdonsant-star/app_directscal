import { describe, expect, it } from "vitest";

import { resolvePendingAcquisitionGoogleUser } from "@/lib/auth/acquisition-session";
import {
  clearAuthJsSessionCookies,
  isAuthJsSessionCookieName,
} from "@/lib/auth/authjs-cookies";

describe("resolvePendingAcquisitionGoogleUser", () => {
  it("uses the selected Google identity for a pending acquisition session", () => {
    expect(
      resolvePendingAcquisitionGoogleUser({
        email: " Diretorio@FahtoMediaGroup.com ",
        name: "Diretório Fahto",
        userEmail: "diretorio@fahtomediagroup.com",
        userId: "user_fahto",
      }),
    ).toEqual({
      company: "Empresa pendente",
      email: "diretorio@fahtomediagroup.com",
      id: "user_fahto",
      name: "Diretório Fahto",
      role: "cliente",
    });
  });

  it("rejects stale corporate sessions resolved from another Google account", () => {
    expect(
      resolvePendingAcquisitionGoogleUser({
        email: "diretorio@fahtomediagroup.com",
        name: "Diretório Fahto",
        userEmail: "don.santos@directscal.com",
        userId: "user_don",
      }),
    ).toBeNull();
  });

  it("does not reuse an existing JWT subject when Auth.js did not resolve the Google user", () => {
    expect(
      resolvePendingAcquisitionGoogleUser({
        email: "diretorio@fahtomediagroup.com",
        name: "Diretório Fahto",
        userEmail: "diretorio@fahtomediagroup.com",
      }),
    ).toBeNull();
  });
});

describe("Auth.js acquisition cookie guards", () => {
  it("recognizes base and chunked Auth.js session cookie names", () => {
    expect(isAuthJsSessionCookieName("authjs.session-token")).toBe(true);
    expect(isAuthJsSessionCookieName("authjs.session-token.0")).toBe(true);
    expect(isAuthJsSessionCookieName("__Secure-authjs.session-token.1")).toBe(
      true,
    );
    expect(isAuthJsSessionCookieName("authjs.state")).toBe(false);
  });

  it("clears current and legacy Auth.js session cookie names", () => {
    const clearedCookies: string[] = [];

    clearAuthJsSessionCookies({
      cookies: {
        set(name, _value, options) {
          clearedCookies.push(name);
          expect(options.maxAge).toBe(0);
          expect(options.path).toBe("/");
        },
      },
    });

    expect(clearedCookies).toContain("authjs.session-token");
    expect(clearedCookies).toContain("authjs.session-token.0");
    expect(clearedCookies).toContain("__Secure-authjs.session-token");
    expect(clearedCookies).toContain("next-auth.session-token");
  });
});

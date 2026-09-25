import { describe, expect, it } from "vitest";

import { getDiagnosticAccessDecision } from "@/lib/auth/diagnostic-access";

const viewerUserId = "viewer";

describe("getDiagnosticAccessDecision", () => {
  it("gives the company owner full management and founder-link access", () => {
    expect(
      getDiagnosticAccessDecision({
        assignedToViewer: false,
        creatorUserId: "another-user",
        viewerRole: "cliente",
        viewerUserId,
      }),
    ).toEqual({
      canManage: true,
      canView: true,
      canViewAllTeamLinks: true,
      canViewFounderLink: true,
    });
  });

  it("lets an admin creator manage without exposing the founder link", () => {
    expect(
      getDiagnosticAccessDecision({
        assignedToViewer: false,
        creatorUserId: viewerUserId,
        viewerRole: "admin",
        viewerUserId,
      }),
    ).toEqual({
      canManage: true,
      canView: true,
      canViewAllTeamLinks: true,
      canViewFounderLink: false,
    });
  });

  it("limits an assigned leader to viewing the diagnostic and assigned team links", () => {
    expect(
      getDiagnosticAccessDecision({
        assignedToViewer: true,
        creatorUserId: "another-user",
        viewerRole: "admin",
        viewerUserId,
      }),
    ).toEqual({
      canManage: false,
      canView: true,
      canViewAllTeamLinks: false,
      canViewFounderLink: false,
    });
  });

  it("denies an unrelated admin", () => {
    expect(
      getDiagnosticAccessDecision({
        assignedToViewer: false,
        creatorUserId: "another-user",
        viewerRole: "admin",
        viewerUserId,
      }).canView,
    ).toBe(false);
  });

  it("keeps legacy diagnostics visible to existing company members", () => {
    expect(
      getDiagnosticAccessDecision({
        assignedToViewer: false,
        creatorUserId: null,
        viewerRole: "admin",
        viewerUserId,
      }).canView,
    ).toBe(true);
  });
});

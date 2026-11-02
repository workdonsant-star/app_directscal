import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/data/organization-structure-data-source", () => ({ getOrganizationStructure: vi.fn() }));

import { getOrganizationStructure } from "@/lib/data/organization-structure-data-source";
import { getActiveDiagnosticLeaderIds } from "@/lib/data/diagnostic-leader-selection";

beforeEach(() => vi.clearAllMocks());

describe("lideranças automáticas da pesquisa", () => {
  it("inclui apenas lideranças ativas da organização, sem repetir a mesma pessoa", async () => {
    vi.mocked(getOrganizationStructure).mockResolvedValue([
      { active: true, inviteStatus: "ativo", leader: { id: "lider-1" } },
      { active: true, inviteStatus: "ativo", leader: { id: "lider-1" } },
      { active: false, inviteStatus: "ativo", leader: { id: "lider-2" } },
      { active: true, inviteStatus: "convite_pendente", leader: { id: "lider-3" } },
    ] as Awaited<ReturnType<typeof getOrganizationStructure>>);

    expect(await getActiveDiagnosticLeaderIds("empresa-1")).toEqual(["lider-1"]);
    expect(getOrganizationStructure).toHaveBeenCalledWith("empresa-1");
  });

  it("permite criar pesquisa quando a empresa ainda não tem lideranças cadastradas", async () => {
    vi.mocked(getOrganizationStructure).mockResolvedValue([]);
    expect(await getActiveDiagnosticLeaderIds("empresa-1")).toEqual([]);
  });
});

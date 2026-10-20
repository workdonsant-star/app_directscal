import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseAdminClient: vi.fn() }));
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getPublishedSpecialistContact } from "@/lib/data/person-profiles-data-source";
import { SpecialistContactCard } from "@/components/reports/specialist-contact-card";

const eq = vi.fn();
const select = vi.fn();
const single = vi.fn();
const specialist = { name: "Especialista fixture", email: "fixture@example.invalid", title: "Especialista em processos", location: "Curitiba", avatar_url: null };
beforeEach(() => {
 vi.clearAllMocks();
 const query = { select: (fields: string) => { select(fields); return query; }, eq: (column: string, value: unknown) => { eq(column, value); return query; }, maybeSingle: single };
 single.mockResolvedValue({ data: specialist, error: null });
 vi.mocked(createSupabaseAdminClient).mockReturnValue({ from: () => query } as unknown as ReturnType<typeof createSupabaseAdminClient>);
});
describe("contato da atribuição publicada", () => {
 it("resolve exatamente o especialista publicado com somente campos de contato", async () => {
  const contact = await getPublishedSpecialistContact("specialist_other");
  expect(eq).toHaveBeenCalledWith("id", "specialist_other");
  for (const [column, value] of [["status", "ativo"], ["archived", false], ["deleted", false]]) expect(eq).toHaveBeenCalledWith(column, value);
  expect(select).toHaveBeenCalledWith("name,email,title,location,avatar_url");
  const card = JSON.stringify(SpecialistContactCard({ specialist: contact }));
  expect(card).toContain(specialist.name); expect(card).toContain("mailto:fixture@example.invalid");
  expect(card).not.toContain("Don Santos"); expect(card).not.toContain("wa.me"); expect(card).not.toContain("2 anos");
 });
 it("não inventa contato quando falta atribuição ou cadastro disponível", async () => {
  expect(await getPublishedSpecialistContact(null)).toBeNull(); expect(select).not.toHaveBeenCalled();
  single.mockResolvedValue({ data: null, error: null });
  expect(await getPublishedSpecialistContact("missing")).toBeNull();
  expect(JSON.stringify(SpecialistContactCard({ specialist: null }))).toContain("ainda não está disponível");
 });
});

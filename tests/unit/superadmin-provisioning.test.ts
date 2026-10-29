import { expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({ isSupabaseConfigured: () => true }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseAdminClient: vi.fn() }));

import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { ensureSupabaseAuthUserProvisioned } from "@/lib/auth/supabase-auth";

it("preserva o acesso global existente sem recriar empresa por domínio no login", async () => {
  const writes = vi.fn();
  const tables: string[] = [];
  const from = (table: string) => {
    tables.push(table);
    const chain = {
      select: () => chain,
      eq: () => chain,
      insert: writes, update: writes, upsert: writes,
      maybeSingle: async () => ({ data: { id: "actor", email: "actor@example.invalid", name: "Operador", image: null }, error: null }),
      order: () => ({ returns: async () => ({ data: [{ organization_id: "internal", role: "superadmin" }], error: null }) }),
      single: async () => ({ data: { id: "internal", name: "Administração Directscal", employee_count: 1 }, error: null }),
    };
    return chain;
  };
  vi.mocked(createSupabaseAdminClient).mockReturnValue({ from, schema: () => ({ from }) } as unknown as ReturnType<typeof createSupabaseAdminClient>);
  const user = await ensureSupabaseAuthUserProvisioned({ id: "actor", email: "actor@example.invalid" });
  expect(user?.role).toBe("superadmin");
  expect(user?.company).toBe("Administração Directscal");
  expect(tables).toEqual(["users", "organization_members", "organizations"]);
  expect(writes).not.toHaveBeenCalled();
});

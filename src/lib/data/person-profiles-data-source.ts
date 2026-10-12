import "server-only";
import { cache } from "react";
import { createSupabaseAdminClient, maybeCreateSupabaseAdminClient } from "@/lib/supabase/server";
import { adminSpecialistSchema } from "@/lib/contracts/admin-operations";
import { personalProfileInputSchema } from "@/lib/contracts/profile";

export const getAccountProfile = cache(async (userId: string) => {
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return null;
  const supabase = maybeCreateSupabaseAdminClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("account_profiles").select("name,avatar_url").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  if (data) return { name: data.name, avatarUrl: data.avatar_url, profilePersisted: true };
  const { data: account, error: accountError } = await supabase.schema("next_auth").from("users").select("name,image").eq("id", userId).maybeSingle();
  if (accountError) throw accountError;
  return account?.name ? { name: account.name, avatarUrl: account.image, profilePersisted: false } : null;
});

export async function saveAccountProfile(userId: string, input: unknown) {
  const profile = personalProfileInputSchema.parse(input);
  const { data, error } = await createSupabaseAdminClient().from("account_profiles")
    .upsert({ user_id: userId, name: profile.name, avatar_url: profile.avatarUrl, updated_at: new Date().toISOString() })
    .select("name,avatar_url").single();
  if (error) throw error;
  return { name: data.name, avatarUrl: data.avatar_url, profilePersisted: true };
}

export const getSpecialists = cache(async () => {
  const supabase = createSupabaseAdminClient();
  const [directory, assignments] = await Promise.all([
    supabase.from("specialists").select("*").order("created_at", { ascending: false }),
    supabase.from("admin_deliveries").select("specialist_id,organization_id,status"),
  ]);
  if (directory.error) throw directory.error;
  if (assignments.error) throw assignments.error;
  const data = directory.data;
  return data.map((row) => ({
    ...adminSpecialistSchema.parse({ id: row.id, name: row.name, email: row.email,
      avatarUrl: row.avatar_url ?? undefined, title: row.title, location: row.location,
      status: row.status, createdAt: row.created_at,
      companyCount: new Set(assignments.data.filter((item) => item.specialist_id === row.id).map((item) => item.organization_id)).size,
      activeDeliveryCount: assignments.data.filter((item) => item.specialist_id === row.id && item.status !== "publicada").length }),
    archived: row.archived, deleted: row.deleted,
  }));
});
export async function getPersistedSpecialist(id: string | null) {
  if (!id) return null;
  return (await getSpecialists()).find((item) => item.id === id) ?? null;
}

export async function mutateSpecialist(input: {
  id?: string; name?: string; email?: string; title?: string; location?: string;
  avatarUrl?: string | null; status?: string; archived?: boolean; deleted?: boolean;
}, creating: boolean) {
  const { avatarUrl, id, ...values } = input;
  const supabase = createSupabaseAdminClient();
  const payload = { ...values, ...(avatarUrl !== undefined ? { avatar_url: avatarUrl } : {}) };
  const result = creating
    ? await supabase.from("specialists").insert({ id: `specialist_${crypto.randomUUID()}`, name: input.name!, email: input.email!, title: input.title!, location: input.location! }).select("id").single()
    : await supabase.from("specialists").update(payload).eq("id", id!).eq("deleted", false).select("id").single();
  if (result.error) throw result.error;
}

export async function canAssignSpecialist(id: string) {
  const specialist = await getPersistedSpecialist(id);
  return Boolean(specialist && specialist.status === "ativo" && !specialist.archived && !specialist.deleted);
}

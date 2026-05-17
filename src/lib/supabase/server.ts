import { createClient } from "@supabase/supabase-js";

import {
  getRequiredServerEnv,
  isSupabaseConfigured,
  isSupabaseRlsConfigured,
} from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

export function createSupabaseAdminClient() {
  return createClient<Database>(
    getRequiredServerEnv("SUPABASE_URL"),
    getRequiredServerEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

export function createSupabaseRlsClient(accessToken: string) {
  return createClient<Database>(
    getRequiredServerEnv("SUPABASE_URL"),
    getRequiredServerEnv("SUPABASE_ANON_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    },
  );
}

export function maybeCreateSupabaseAdminClient() {
  return isSupabaseConfigured() ? createSupabaseAdminClient() : null;
}

export function canCreateSupabaseRlsClient() {
  return isSupabaseRlsConfigured();
}

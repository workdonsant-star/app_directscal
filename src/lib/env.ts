export function getPublicAppUrl() {
  return (
    process.env.PUBLIC_APP_URL ??
    process.env.AUTH_URL ??
    "https://app.directscal.com"
  ).replace(/\/+$/, "");
}

export function isProduction() {
  return process.env.NODE_ENV === "production";
}

export function isFeatureAcquisitionEnabled() {
  return process.env.FEATURE_ACQUISITION === "true";
}

export function getRequiredServerEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function isSupabaseConfigured() {
  return Boolean(
    process.env.SUPABASE_URL &&
      process.env.SUPABASE_ANON_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export function isSupabaseRlsConfigured() {
  return Boolean(
    process.env.SUPABASE_URL &&
      process.env.SUPABASE_ANON_KEY &&
      process.env.SUPABASE_JWT_SECRET,
  );
}

import { redirect } from "next/navigation";

type LegacyLayersPageProps = {
  searchParams?: Promise<{ diagnostico?: string | string[] }>;
};

export default async function LegacyLayersPage({
  searchParams,
}: LegacyLayersPageProps) {
  const resolvedSearchParams = await searchParams;
  const diagnostic =
    typeof resolvedSearchParams?.diagnostico === "string"
      ? resolvedSearchParams.diagnostico
      : null;

  redirect(
    diagnostic
      ? `/omdx?diagnostico=${encodeURIComponent(diagnostic)}`
      : "/omdx",
  );
}

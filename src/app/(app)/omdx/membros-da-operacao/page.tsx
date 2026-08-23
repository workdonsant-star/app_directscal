import { redirect } from "next/navigation";

export const metadata = {
  title: "Diagnósticos — Directscal",
};

export default async function OperationalMembersPage() {
  redirect("/omdx/diagnosticos");
}

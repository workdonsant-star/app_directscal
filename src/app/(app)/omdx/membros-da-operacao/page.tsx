import { redirect } from "next/navigation";

export const metadata = {
  title: "Diretório — Pessoas",
};

export default async function OperationalMembersPage() {
  redirect("/pessoas/diretorio");
}

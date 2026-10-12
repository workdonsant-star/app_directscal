import { redirect } from "next/navigation";

// Rota legada: Action Points vive em /action-points.
export default function LegacyGanttPage() {
  redirect("/action-points");
}

import { CalendarDays } from "lucide-react";
import Link from "next/link";
import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import { DocumentTableOfContents } from "@/components/document-table-of-contents";
import { OmdxReportView } from "./omdx-report-view";
import { ReportPdfDownload } from "./report-pdf-download";
import { SpecialistContactCard } from "./specialist-contact-card";
import { Button } from "@/components/ui/button";
import type { ComponentProps } from "react";

const reportSections = [
 { href: "#metodologia", label: "Metodologia" }, { href: "#maturidade", label: "Maturidade" },
 { href: "#bloqueadores", label: "Bloqueadores" }, { href: "#anatomia", label: "Anatomia" },
 { href: "#nucleo", label: "Núcleo dos desafios" }, { href: "#alavancas", label: "Alavancas" },
 { href: "#implementacoes", label: "Implementações" }, { href: "#conclusao", label: "Conclusão" },
];
export function ReportWorkspace({ report, editorial, specialist, compact = false, reportsHref = "/relatorios", actionPointsHref = `/action-points?diagnostico=${report.diagnostic.id}`, downloadHref = `/omdx/${report.diagnostic.id}/relatorio` }: ComponentProps<typeof OmdxReportView> & ComponentProps<typeof SpecialistContactCard> & { reportsHref?: string; actionPointsHref?: string; downloadHref?: string }) {
 return <><AppTopbar breadcrumb={[{ label: "Relatórios", href: reportsHref }, { label: report.diagnostic.name }]} /><AppPage className="min-w-0"><div className="grid w-full max-w-[1028px] grid-cols-1 lg:grid-cols-[220px_minmax(0,768px)] lg:gap-10"><aside className="hidden lg:block"><div className="sticky top-8 px-4"><DocumentTableOfContents ariaLabel="Navegação do relatório" items={reportSections} /><div className="mt-6 flex flex-col items-start gap-2"><Button nativeButton={false} render={<Link href={actionPointsHref} />}><CalendarDays aria-hidden="true" />Action Points</Button><ReportPdfDownload href={downloadHref} /></div><div className="mt-6"><SpecialistContactCard specialist={specialist} compact={compact} /></div></div></aside><div className="min-w-0"><div className="mb-6 space-y-4 lg:hidden"><Button nativeButton={false} render={<Link href={actionPointsHref} />}><CalendarDays aria-hidden="true" />Action Points</Button><ReportPdfDownload href={downloadHref} /><SpecialistContactCard specialist={specialist} compact={compact} /></div><OmdxReportView editorial={editorial} report={report} /></div></div></AppPage></>;
}

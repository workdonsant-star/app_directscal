import { ArrowLeft, Banknote, ClipboardList, Landmark } from "lucide-react";
import Link from "next/link";

import { KpiCard } from "@/components/kpi-card";
import { PessoasStatusBadge } from "@/components/pessoas/pessoas-status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import type { PeoplePerson } from "@/lib/types";

import {
  employmentTypeLabel,
  formatCurrency,
  formatDate,
} from "./pessoas-formatters";

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="grid gap-1 border-b py-3 last:border-b-0 sm:grid-cols-[180px_1fr]">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground">
        {value || "Não informado"}
      </dd>
    </div>
  );
}

function SectionHeader({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <div>
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

export function PessoasProfile({ person }: { person: PeoplePerson }) {
  const currentPayment = person.paymentHistory[0] ?? null;
  const pendingDocuments = person.documents.filter(
    (document) => document.status !== "valido",
  ).length;
  const pendingPaymentReasons = currentPayment?.pendingReasons.length ?? 0;

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 mb-2"
            nativeButton={false}
            render={<Link href="/pessoas/diretorio" />}
          >
            <ArrowLeft className="size-4" />
            Diretório
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              {person.name}
            </h1>
            <PessoasStatusBadge kind="person" status={person.status} />
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {person.operationalRole} em {person.area}. O perfil reúne vínculo,
            remuneração, documentos, papéis e histórico de pagamento.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/pessoas/fechamento" />}
          >
            Ver fechamento
          </Button>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/pessoas/configuracoes" />}
          >
            Configurações
          </Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Custo mensal"
          value={formatCurrency(person.remuneration.totalMonthlyCost)}
          caption={employmentTypeLabel[person.employmentType]}
          hint={person.costCenter}
        />
        <KpiCard
          label="Valor fixo"
          value={formatCurrency(person.remuneration.fixedAmount)}
          caption="Base da competência"
          hint={person.paymentMethod}
        />
        <KpiCard
          label="Variável prevista"
          value={formatCurrency(
            person.remuneration.variableForecast +
              person.remuneration.bonusProvision,
          )}
          caption="Variável e bônus provisionado"
          hint="Sem fórmula automática neste MVP"
        />
        <KpiCard
          label="Pendências"
          value={String(pendingDocuments + pendingPaymentReasons)}
          caption="Documentos e pagamento"
          hint="Bloqueios individuais"
        />
      </section>

      <Tabs defaultValue="resumo" className="gap-5">
        <TabsList className="max-w-full overflow-x-auto">
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="vinculo">Vínculo</TabsTrigger>
          <TabsTrigger value="remuneracao">Remuneração</TabsTrigger>
          <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
          <TabsTrigger value="papeis">Papéis</TabsTrigger>
        </TabsList>

        <TabsContent value="resumo" className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-lg border px-4 py-3">
            <SectionHeader
              title="Identidade operacional"
              description="Leitura rápida de quem a pessoa é na operação."
            />
            <dl className="mt-3">
              <DetailRow label="E-mail" value={person.email} />
              <DetailRow
                label="Vínculo"
                value={employmentTypeLabel[person.employmentType]}
              />
              <DetailRow label="Papel operacional" value={person.operationalRole} />
              <DetailRow label="Gestor ou referência" value={person.manager} />
              <DetailRow label="Centro de custo" value={person.costCenter} />
            </dl>
          </section>

          <section className="rounded-lg border px-4 py-3">
            <SectionHeader
              title="Sinais de governança"
              description="Pendências que afetam pagamento ou rastreabilidade."
            />
            <div className="mt-4 divide-y">
              {person.documents.length > 0 ? (
                person.documents.map((document) => (
                  <div
                    key={document.id}
                    className="flex items-start justify-between gap-3 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {document.title}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {document.type} · {formatDate(document.dueDate)}
                      </p>
                    </div>
                    <PessoasStatusBadge kind="document" status={document.status} />
                  </div>
                ))
              ) : (
                <p className="py-6 text-sm text-muted-foreground">
                  Nenhum documento configurado para esta pessoa.
                </p>
              )}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="vinculo" className="rounded-lg border px-4 py-3">
          <SectionHeader
            title="Vínculo"
            description="O tipo de vínculo define campos, documentos e alertas."
          />
          <dl className="mt-3">
            <DetailRow
              label="Tipo"
              value={employmentTypeLabel[person.employmentType]}
            />
            <DetailRow label="Empresa/PJ vinculada" value={person.companyName} />
            <DetailRow label="Cargo formal" value={person.formalRole} />
            <DetailRow label="Início" value={formatDate(person.startedAt)} />
            <DetailRow label="Forma de pagamento" value={person.paymentMethod} />
            <DetailRow label="Chave ou conta" value={person.paymentKey} />
          </dl>
        </TabsContent>

        <TabsContent value="remuneracao" className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-lg border px-4 py-3">
            <SectionHeader
              title="Composição de remuneração"
              description="Valores rastreáveis por competência, sem cálculo legal hardcoded."
            />
            <dl className="mt-3">
              <DetailRow
                label="Fixo"
                value={formatCurrency(person.remuneration.fixedAmount)}
              />
              <DetailRow
                label="Variável prevista"
                value={formatCurrency(person.remuneration.variableForecast)}
              />
              <DetailRow
                label="Bônus provisionado"
                value={formatCurrency(person.remuneration.bonusProvision)}
              />
              <DetailRow
                label="Benefícios"
                value={formatCurrency(person.remuneration.benefitsCost)}
              />
              <DetailRow
                label="Encargos estimados"
                value={formatCurrency(person.remuneration.chargesEstimate)}
              />
            </dl>
          </section>

          <section className="rounded-lg border px-4 py-3">
            <SectionHeader
              title="Benefícios"
              description="Custos e descontos que entram na leitura mensal."
            />
            <div className="mt-4 divide-y">
              {person.benefits.length > 0 ? (
                person.benefits.map((benefit) => (
                  <div
                    key={benefit.id}
                    className="grid gap-2 py-3 sm:grid-cols-[1fr_120px]"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {benefit.name}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {benefit.recurrence} · desconto{" "}
                        {formatCurrency(benefit.personDiscount)}
                      </p>
                    </div>
                    <p className="text-right text-sm font-medium tabular-nums">
                      {formatCurrency(benefit.companyCost)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="py-6 text-sm text-muted-foreground">
                  Nenhum benefício ativo para este vínculo.
                </p>
              )}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="pagamentos" className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>Competência</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead className="text-right">Líquido</TableHead>
                <TableHead className="text-right">Custo total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {person.paymentHistory.length > 0 ? (
                person.paymentHistory.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      {payment.competence}
                    </TableCell>
                    <TableCell>
                      <PessoasStatusBadge
                        kind="payment"
                        status={payment.status}
                      />
                    </TableCell>
                    <TableCell>{formatDate(payment.dueDate)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(payment.netAmount)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(payment.totalCost)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    Nenhum pagamento configurado para esta pessoa.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="documentos" className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>Documento</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Vencimento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {person.documents.length > 0 ? (
                person.documents.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell className="font-medium">{document.title}</TableCell>
                    <TableCell>{document.type}</TableCell>
                    <TableCell>
                      <PessoasStatusBadge
                        kind="document"
                        status={document.status}
                      />
                    </TableCell>
                    <TableCell>{formatDate(document.dueDate)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    Nenhum documento configurado para esta pessoa.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="papeis" className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-lg border px-4 py-3">
            <div className="flex items-start gap-3">
              <Landmark className="mt-1 size-4 text-primary" />
              <SectionHeader
                title="Responsabilidades"
                description="Relação inicial com a futura matriz de papéis."
              />
            </div>
            <ul className="mt-4 space-y-2">
              {person.responsibilities.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-foreground">
                  <ClipboardList className="mt-0.5 size-4 text-muted-foreground" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-lg border px-4 py-3">
            <div className="flex items-start gap-3">
              <Banknote className="mt-1 size-4 text-primary" />
              <SectionHeader
                title="Competências"
                description="Base para matriz de competências em fase posterior."
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {person.competencies.map((item) => (
                <span
                  key={item}
                  className="rounded-md border px-2.5 py-1 text-sm text-foreground"
                >
                  {item}
                </span>
              ))}
            </div>
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}

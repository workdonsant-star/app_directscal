"use client";

import Link from "next/link";

import { useAdminData } from "@/components/admin/use-admin-data";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  AcquisitionCampaign,
  AcquisitionFormField,
  AdminModule,
  Lead,
} from "@/lib/types";

type AdminLeadDetailProps = {
  leadId: string;
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function prettyFieldLabel(fieldId: string) {
  return fieldId
    .replace(/^custom_/, "Campo ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function displayValue(value: string | null | undefined) {
  const normalized = value?.trim();

  return normalized || "—";
}

function moduleName(moduleId: string, modules: AdminModule[]) {
  return (
    modules.find((module) => module.id === moduleId)?.shortName ?? moduleId
  );
}

function fieldEntries(lead: Lead, campaign?: AcquisitionCampaign) {
  const fieldsById = new Map<string, AcquisitionFormField>(
    campaign?.fields.map((field) => [field.id, field]) ?? [],
  );
  const orderedCampaignFields =
    campaign?.fields
      .filter((field) =>
        Object.prototype.hasOwnProperty.call(lead.fieldValues, field.id),
      )
      .sort((a, b) => a.order - b.order)
      .map((field) => ({
        id: field.id,
        label: field.label,
        value: displayValue(lead.fieldValues[field.id]),
      })) ?? [];
  const extraFields = Object.entries(lead.fieldValues)
    .filter(([fieldId]) => !fieldsById.has(fieldId))
    .map(([fieldId, value]) => ({
      id: fieldId,
      label: prettyFieldLabel(fieldId),
      value: displayValue(value),
    }));

  return [...orderedCampaignFields, ...extraFields];
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-muted-foreground text-xs font-medium uppercase tracking-[0.08em]">
        {label}
      </dt>
      <dd className="text-foreground text-sm leading-relaxed">
        {displayValue(value)}
      </dd>
    </div>
  );
}

export function AdminLeadDetail({ leadId }: AdminLeadDetailProps) {
  const { campaigns, leads, modules } = useAdminData();
  const lead = leads.find((item) => item.id === leadId);
  const campaign = lead
    ? campaigns.find((item) => item.id === lead.campaignId)
    : undefined;

  if (!lead) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/admin/leads" />}
          >
            Voltar para leads
          </Button>
        </div>
      </div>
    );
  }

  const fields = fieldEntries(lead, campaign);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-end">
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/admin/leads" />}
        >
          Voltar para leads
        </Button>
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Contato</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4">
              <InfoItem label="Nome" value={lead.name} />
              <InfoItem label="E-mail" value={lead.email} />
              <InfoItem label="Telefone/WhatsApp" value={lead.phone} />
              <InfoItem label="Cargo" value={lead.role} />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Empresa</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4">
              <InfoItem label="Empresa" value={lead.companyName} />
              <InfoItem label="Tamanho" value={lead.companySize} />
              <InfoItem label="Objetivo" value={lead.objective} />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aquisição</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4">
              <InfoItem
                label="Módulo"
                value={moduleName(lead.moduleId, modules)}
              />
              <InfoItem label="Campanha" value={lead.campaignName} />
              <InfoItem label="Origem" value={lead.source} />
              <InfoItem
                label="Criado em"
                value={formatDateTime(lead.createdAt)}
              />
            </dl>
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-foreground text-base font-semibold">
            Informações do formulário
          </h2>
          <p className="text-muted-foreground text-sm">
            Campos preenchidos no link de aquisição, incluindo campos
            customizados.
          </p>
        </div>

        <div className="overflow-hidden rounded-lg border">
          <dl className="divide-y">
            {fields.map((field) => (
              <div
                key={field.id}
                className="grid gap-1 px-3 py-3 sm:grid-cols-[16rem_1fr] sm:gap-4"
              >
                <dt className="text-muted-foreground text-sm font-medium">
                  {field.label}
                </dt>
                <dd className="text-foreground text-sm leading-relaxed">
                  {field.value}
                </dd>
              </div>
            ))}

            {fields.length === 0 && (
              <div className="px-3 py-10 text-center text-sm text-muted-foreground">
                Nenhum campo de formulário registrado para este lead.
              </div>
            )}
          </dl>
        </div>
      </section>
    </div>
  );
}

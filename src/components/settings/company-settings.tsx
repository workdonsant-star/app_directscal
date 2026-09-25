"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { AppTopbarActionsPortal } from "@/components/app-topbar-actions-portal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  profileCompanySizeOptions,
  profileRevenueOptions,
} from "@/lib/contracts";
import type { ProfileSettingsData } from "@/lib/types";
import { cn } from "@/lib/utils";

type CompanySettingsProps = {
  profile: ProfileSettingsData;
};

type CompanyDraft = {
  companySize: string;
  industry: string;
  instagram: string;
  lastQuarterRevenue: string;
  socialName: string;
  website: string;
};

type Notice = {
  message: string;
  tone: "error" | "success";
};

const companySizeItems = profileCompanySizeOptions.map((value) => ({
  value,
  label: value,
}));
const revenueItems = profileRevenueOptions.map((value) => ({
  value,
  label: value,
}));

function formatCnpj(value: string | null) {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 14) return value;

  return digits.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5",
  );
}

function formatRegistryDate(value: string | null) {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
}

function ReadOnlyCompanyField({
  className,
  id,
  label,
  multiline = false,
  value,
}: {
  className?: string;
  id: string;
  label: string;
  multiline?: boolean;
  value: string | null;
}) {
  const displayValue = value ?? "Não informado";

  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {multiline ? (
        <textarea
          id={id}
          value={displayValue}
          disabled
          rows={3}
          className="border-input bg-input/50 text-foreground min-h-20 w-full cursor-not-allowed resize-none rounded-lg border px-3 py-2 text-sm opacity-50 outline-none disabled:pointer-events-none dark:bg-input/80"
        />
      ) : (
        <Input id={id} value={displayValue} disabled />
      )}
    </div>
  );
}

export function CompanySettings({ profile }: CompanySettingsProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<CompanyDraft>({
    companySize: profile.companyDetails.companySize ?? "",
    industry: profile.companyDetails.industry ?? "",
    instagram: profile.companyDetails.instagram ?? "",
    lastQuarterRevenue: profile.companyDetails.lastQuarterRevenue ?? "",
    socialName: profile.companyDetails.socialName ?? "",
    website: profile.companyDetails.website ?? "",
  });
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function updateField(field: keyof CompanyDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    setNotice(null);
  }

  async function handleSave() {
    const commercialData = {
      companySize: draft.companySize || null,
      industry: draft.industry.trim() || null,
      instagram: draft.instagram.trim() || null,
      lastQuarterRevenue: draft.lastQuarterRevenue || null,
      position: profile.companyDetails.position,
      socialName: draft.socialName.trim() || null,
      website: draft.website.trim() || null,
    };
    const hasChanges = Object.entries(commercialData).some(
      ([key, value]) =>
        value !==
        (profile.companyDetails[
          key as keyof typeof commercialData
        ] ?? null),
    );

    if (!hasChanges) {
      setNotice({ message: "Nenhuma alteração para salvar.", tone: "success" });
      return;
    }

    setIsSaving(true);
    setNotice(null);

    const response = await fetch("/api/profile", {
      body: JSON.stringify(commercialData),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    }).catch(() => null);
    const responseBody = response
      ? ((await response.json().catch(() => null)) as {
          message?: string;
        } | null)
      : null;

    if (!response?.ok) {
      setIsSaving(false);
      setNotice({
        message:
          responseBody?.message ??
          "Não foi possível salvar as informações da empresa.",
        tone: "error",
      });
      return;
    }

    setIsSaving(false);
    setNotice({ message: "Informações da empresa salvas.", tone: "success" });
    router.refresh();
  }

  return (
    <>
      <AppTopbarActionsPortal>
        <Button type="button" disabled={isSaving} onClick={handleSave}>
          {isSaving ? "Salvando" : "Salvar alterações"}
        </Button>
      </AppTopbarActionsPortal>

      <Card className="min-w-0">
        <CardContent className="grid min-w-0 gap-8">
        <section className="grid min-w-0 gap-5">
          <div className="min-w-0">
            <h2 className="text-base font-semibold">Empresa</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Dados oficiais do CNPJ e informações fornecidas no onboarding.
            </p>
          </div>

          <div className="grid min-w-0 gap-4 md:grid-cols-2">
            <div className="grid min-w-0 gap-1.5">
              <label
                htmlFor="settings-company-social-name"
                className="text-sm font-medium"
              >
                Nome social (nome fantasia)
              </label>
              <Input
                id="settings-company-social-name"
                value={draft.socialName}
                onChange={(event) => {
                  updateField("socialName", event.target.value);
                }}
              />
            </div>
            <ReadOnlyCompanyField
              id="settings-company-official-name"
              label="Nome oficial (razão social)"
              value={profile.companyDetails.officialName}
            />
            <ReadOnlyCompanyField
              id="settings-company-cnpj"
              label="CNPJ"
              value={formatCnpj(profile.companyDetails.cnpj)}
            />
            <ReadOnlyCompanyField
              id="settings-company-registration-status"
              label="Situação cadastral"
              value={profile.companyDetails.registrationStatus}
            />
            <ReadOnlyCompanyField
              id="settings-company-activity-started-at"
              label="Início da atividade"
              value={formatRegistryDate(
                profile.companyDetails.activityStartedAt,
              )}
            />
            <ReadOnlyCompanyField
              id="settings-company-registry-size"
              label="Porte cadastral"
              value={profile.companyDetails.registrySize}
            />
            <ReadOnlyCompanyField
              id="settings-company-cnae"
              label="CNAE principal"
              value={
                [
                  profile.companyDetails.cnaeCode,
                  profile.companyDetails.cnaeDescription,
                ]
                  .filter(Boolean)
                  .join(" · ") || null
              }
            />
            <ReadOnlyCompanyField
              id="settings-company-legal-nature"
              label="Natureza jurídica"
              value={profile.companyDetails.legalNature}
            />
            <ReadOnlyCompanyField
              id="settings-company-address"
              label="Endereço cadastrado"
              value={profile.companyDetails.registeredAddress}
              className="md:col-span-2"
            />
            <ReadOnlyCompanyField
              id="settings-company-city"
              label="Município"
              value={profile.companyDetails.city}
            />
            <ReadOnlyCompanyField
              id="settings-company-state"
              label="UF"
              value={profile.companyDetails.state}
            />
          </div>
        </section>

        <section className="grid min-w-0 gap-5 border-t pt-6">
          <div className="min-w-0">
            <h2 className="text-base font-semibold">Informações comerciais</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Dados informados durante o cadastro da empresa.
            </p>
          </div>

          <div className="grid min-w-0 gap-4 md:grid-cols-2">
            <div className="flex min-w-0 flex-col gap-2">
              <label
                htmlFor="settings-company-industry"
                className="text-sm font-medium"
              >
                Nicho de atuação
              </label>
              <Input
                id="settings-company-industry"
                value={draft.industry}
                onChange={(event) =>
                  updateField("industry", event.target.value)
                }
              />
            </div>

            <div className="flex min-w-0 flex-col gap-2">
              <label
                htmlFor="settings-company-instagram"
                className="text-sm font-medium"
              >
                Instagram da empresa
              </label>
              <Input
                id="settings-company-instagram"
                value={draft.instagram}
                onChange={(event) =>
                  updateField("instagram", event.target.value)
                }
              />
            </div>

            <div className="flex min-w-0 flex-col gap-2">
              <label
                htmlFor="settings-company-website"
                className="text-sm font-medium"
              >
                Website
              </label>
              <Input
                id="settings-company-website"
                value={draft.website}
                onChange={(event) =>
                  updateField("website", event.target.value)
                }
              />
            </div>

            <div className="flex min-w-0 flex-col gap-2">
              <label
                htmlFor="settings-company-size"
                className="text-sm font-medium"
              >
                Tamanho da empresa
              </label>
              <Select
                value={draft.companySize}
                items={companySizeItems}
                onValueChange={(value) => {
                  if (typeof value === "string") {
                    updateField("companySize", value);
                  }
                }}
              >
                <SelectTrigger id="settings-company-size">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {profileCompanySizeOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex min-w-0 flex-col gap-2">
              <label
                htmlFor="settings-company-revenue"
                className="text-sm font-medium"
              >
                Faturamento do último trimestre
              </label>
              <Select
                value={draft.lastQuarterRevenue}
                items={revenueItems}
                onValueChange={(value) => {
                  if (typeof value === "string") {
                    updateField("lastQuarterRevenue", value);
                  }
                }}
              >
                <SelectTrigger id="settings-company-revenue">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {profileRevenueOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ReadOnlyCompanyField
              id="settings-company-challenges"
              label="Desafios informados"
              value={profile.companyDetails.challenges}
              multiline
              className="md:col-span-2"
            />
          </div>
        </section>

        {notice ? (
          <div className="border-t pt-6">
            <p
              aria-live="polite"
              className={
                notice.tone === "error"
                  ? "text-sm text-destructive"
                  : "text-sm text-foreground"
              }
            >
              {notice.message}
            </p>
          </div>
        ) : null}
        </CardContent>
      </Card>
    </>
  );
}

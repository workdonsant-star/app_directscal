"use client";

import { useState, useSyncExternalStore, type ChangeEvent } from "react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  getProfileOverridesServerSnapshot,
  getProfileOverridesSnapshot,
  saveProfileOverrides,
  subscribeProfileOverrides,
} from "@/lib/profile-storage";
import type { UserProfile } from "@/lib/types";

type ProfileSettingsProps = {
  profile: UserProfile;
};

type Notice = {
  message: string;
};

type PasswordErrors = Partial<
  Record<"currentPassword" | "newPassword" | "confirmPassword", string>
>;

type ProfileDraft = {
  avatarUrl?: string | null;
  employeeCount?: string;
  name?: string;
};

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "DS";
}

export function ProfileSettings({ profile }: ProfileSettingsProps) {
  const storedOverrides = useSyncExternalStore(
    (callback) => subscribeProfileOverrides(profile.id, callback),
    () => getProfileOverridesSnapshot(profile.id),
    getProfileOverridesServerSnapshot,
  );
  const [draft, setDraft] = useState<ProfileDraft>({});
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [employeeCountError, setEmployeeCountError] = useState<string | null>(
    null,
  );
  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({});
  const [notice, setNotice] = useState<Notice | null>(null);

  const name = draft.name ?? storedOverrides?.name ?? profile.name;
  const employeeCount =
    draft.employeeCount ??
    String(storedOverrides?.employeeCount ?? profile.employeeCount);
  const avatarPreviewUrl =
    draft.avatarUrl !== undefined
      ? draft.avatarUrl
      : (storedOverrides?.avatarUrl ?? profile.avatarUrl);

  function validatePassword() {
    const nextErrors: PasswordErrors = {};
    const shouldValidatePassword = Boolean(
      currentPassword || newPassword || confirmPassword,
    );

    if (!shouldValidatePassword) return nextErrors;

    if (!currentPassword) {
      nextErrors.currentPassword = "Informe a senha atual.";
    }

    if (!newPassword) {
      nextErrors.newPassword = "Informe a nova senha.";
    } else if (newPassword.length < 8) {
      nextErrors.newPassword = "Use pelo menos 8 caracteres.";
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = "Confirme a nova senha.";
    } else if (confirmPassword !== newPassword) {
      nextErrors.confirmPassword = "As senhas não conferem.";
    }

    return nextErrors;
  }

  function handleSaveAll() {
    const trimmedName = name.trim();
    const employeeCountValue = Number(employeeCount);
    const nextPasswordErrors = validatePassword();
    let hasErrors = false;

    if (!trimmedName) {
      setNameError("Informe seu nome.");
      hasErrors = true;
    } else {
      setNameError(null);
    }

    if (!Number.isInteger(employeeCountValue) || employeeCountValue < 1) {
      setEmployeeCountError("Informe uma quantidade válida.");
      hasErrors = true;
    } else {
      setEmployeeCountError(null);
    }

    setPasswordErrors(nextPasswordErrors);

    if (Object.keys(nextPasswordErrors).length > 0) {
      hasErrors = true;
    }

    if (hasErrors) {
      setNotice(null);
      return;
    }

    if (currentPassword || newPassword || confirmPassword) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }

    saveProfileOverrides(profile.id, {
      avatarUrl: avatarPreviewUrl ?? null,
      employeeCount: employeeCountValue,
      name: trimmedName,
    });
    setDraft({});
    setNotice({ message: "Alterações salvas nesta sessão." });
  }

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.addEventListener("load", () => {
      if (typeof reader.result !== "string") return;

      setDraft((current) => ({
        ...current,
        avatarUrl: reader.result as string,
      }));
      setNotice(null);
    });

    reader.readAsDataURL(file);
  }

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Informações de perfil</CardTitle>
        <CardDescription>
          Atualize dados pessoais, segurança e informações básicas da empresa.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid min-w-0 gap-8">
        <section className="grid min-w-0 gap-5">
          <div className="min-w-0">
            <h2 className="text-base font-semibold">Dados pessoais</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Atualize os dados básicos exibidos na sua conta.
            </p>
          </div>

          <div className="flex min-w-0 flex-col gap-4 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <Avatar className="size-20 rounded-lg">
                {avatarPreviewUrl && (
                  <AvatarImage src={avatarPreviewUrl} alt={name} />
                )}
                <AvatarFallback className="rounded-lg text-lg">
                  {getInitials(name || profile.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-medium">Foto de perfil</p>
                <p className="mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">
                  Envie uma imagem em JPG, PNG ou WebP. Nesta fase, a foto fica
                  salva apenas nesta sessão mockada.
                </p>
              </div>
            </div>

            <div>
              <label
                htmlFor="profile-avatar"
                className="inline-flex h-8 cursor-pointer items-center justify-center rounded-lg border border-input bg-background px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-within:ring-3 focus-within:ring-ring/50"
              >
                Enviar foto
              </label>
              <Input
                id="profile-avatar"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={handleAvatarChange}
              />
            </div>
          </div>

          <div className="grid min-w-0 gap-4 md:grid-cols-2">
            <div className="flex min-w-0 flex-col gap-2">
              <label htmlFor="profile-name" className="text-sm font-medium">
                Nome
              </label>
              <Input
                id="profile-name"
                value={name}
                aria-invalid={Boolean(nameError)}
                onChange={(event) => {
                  setDraft((current) => ({
                    ...current,
                    name: event.target.value,
                  }));
                  setNameError(null);
                  setNotice(null);
                }}
              />
              {nameError && (
                <p className="text-destructive text-xs">{nameError}</p>
              )}
            </div>

            <div className="flex min-w-0 flex-col gap-2">
              <label htmlFor="profile-email" className="text-sm font-medium">
                E-mail
              </label>
              <Input id="profile-email" value={profile.email} disabled />
              <p className="text-muted-foreground text-xs">
                O e-mail não pode ser alterado nesta etapa.
              </p>
            </div>
          </div>
        </section>

        <section className="grid min-w-0 gap-5 border-t pt-6">
          <div className="min-w-0">
            <h2 className="text-base font-semibold">Segurança</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Simule a alteração de senha desta conta.
            </p>
          </div>

          <div className="grid min-w-0 gap-4 md:grid-cols-3">
            <div className="flex min-w-0 flex-col gap-2">
              <label
                htmlFor="current-password"
                className="text-sm font-medium"
              >
                Senha atual
              </label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                aria-invalid={Boolean(passwordErrors.currentPassword)}
                onChange={(event) => {
                  setCurrentPassword(event.target.value);
                  setPasswordErrors((current) => ({
                    ...current,
                    currentPassword: undefined,
                  }));
                }}
              />
              {passwordErrors.currentPassword && (
                <p className="text-destructive text-xs">
                  {passwordErrors.currentPassword}
                </p>
              )}
            </div>

            <div className="flex min-w-0 flex-col gap-2">
              <label htmlFor="new-password" className="text-sm font-medium">
                Nova senha
              </label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                aria-invalid={Boolean(passwordErrors.newPassword)}
                onChange={(event) => {
                  setNewPassword(event.target.value);
                  setPasswordErrors((current) => ({
                    ...current,
                    newPassword: undefined,
                  }));
                }}
              />
              {passwordErrors.newPassword && (
                <p className="text-destructive text-xs">
                  {passwordErrors.newPassword}
                </p>
              )}
            </div>

            <div className="flex min-w-0 flex-col gap-2">
              <label
                htmlFor="confirm-password"
                className="text-sm font-medium"
              >
                Confirmar nova senha
              </label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                aria-invalid={Boolean(passwordErrors.confirmPassword)}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  setPasswordErrors((current) => ({
                    ...current,
                    confirmPassword: undefined,
                  }));
                }}
              />
              {passwordErrors.confirmPassword && (
                <p className="text-destructive text-xs">
                  {passwordErrors.confirmPassword}
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="grid min-w-0 gap-5 border-t pt-6">
          <div className="min-w-0">
            <h2 className="text-base font-semibold">Empresa</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ajuste informações básicas usadas no contexto dos diagnósticos.
            </p>
          </div>

          <div className="grid min-w-0 gap-4 md:grid-cols-2">
            <div className="flex min-w-0 flex-col gap-2">
              <label htmlFor="profile-company" className="text-sm font-medium">
                Empresa
              </label>
              <Input id="profile-company" value={profile.company} disabled />
            </div>

            <div className="flex min-w-0 flex-col gap-2">
              <label
                htmlFor="employee-count"
                className="text-sm font-medium"
              >
                Quantidade de funcionários
              </label>
              <Input
                id="employee-count"
                type="number"
                min={1}
                value={employeeCount}
                aria-invalid={Boolean(employeeCountError)}
                onChange={(event) => {
                  setDraft((current) => ({
                    ...current,
                    employeeCount: event.target.value,
                  }));
                  setEmployeeCountError(null);
                  setNotice(null);
                }}
              />
              {employeeCountError && (
                <p className="text-destructive text-xs">
                  {employeeCountError}
                </p>
              )}
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
          {notice ? (
            <p className="text-sm text-foreground">{notice.message}</p>
          ) : (
            <span />
          )}
          <Button onClick={handleSaveAll}>Salvar alterações</Button>
        </div>
      </CardContent>
    </Card>
  );
}

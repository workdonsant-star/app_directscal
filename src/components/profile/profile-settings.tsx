"use client";

import {
  useCallback,
  useState,
  useSyncExternalStore,
  type ChangeEvent,
} from "react";
import { useRouter } from "next/navigation";

import { AppTopbarActionsPortal } from "@/components/app-topbar-actions-portal";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AvatarCropDialog } from "@/components/profile/avatar-crop-dialog";
import {
  profilePositionOptions,
} from "@/lib/contracts";
import {
  getProfileOverridesServerSnapshot,
  getProfileOverridesSnapshot,
  saveProfileOverrides,
  subscribeProfileOverrides,
} from "@/lib/profile-storage";
import type { ProfileSettingsData } from "@/lib/types";

type ProfileSettingsProps = {
  profile: ProfileSettingsData;
};

type Notice = {
  message: string;
  tone: "error" | "success";
};

type PasswordErrors = Partial<
  Record<"currentPassword" | "newPassword" | "confirmPassword", string>
>;

type ProfileDraft = {
  avatarUrl?: string | null;
  name?: string;
};

const acceptedAvatarTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxAvatarFileSize = 15 * 1024 * 1024;
const positionItems = profilePositionOptions.map((value) => ({ value, label: value }));
function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("invalid-file-result"));
      }
    });
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(file);
  });
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "DS";
}

export function ProfileSettings({ profile }: ProfileSettingsProps) {
  const router = useRouter();
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
  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({});
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [position, setPosition] = useState(
    profile.companyDetails.position ?? "",
  );
  const [avatarEditorSource, setAvatarEditorSource] = useState<string | null>(
    null,
  );

  const name = draft.name ?? storedOverrides?.name ?? profile.name;
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

  async function handleSaveAll() {
    const trimmedName = name.trim();
    const nextPasswordErrors = validatePassword();
    let hasErrors = false;

    if (!trimmedName) {
      setNameError("Informe seu nome.");
      hasErrors = true;
    } else {
      setNameError(null);
    }

    setPasswordErrors(nextPasswordErrors);

    if (Object.keys(nextPasswordErrors).length > 0) {
      hasErrors = true;
    }

    if (hasErrors) {
      setNotice(null);
      return;
    }

    const hasPositionChange =
      (position || null) !== profile.companyDetails.position;

    setIsSaving(true);

    if (hasPositionChange) {
      const commercialData = {
        companySize: profile.companyDetails.companySize,
        industry: profile.companyDetails.industry,
        instagram: profile.companyDetails.instagram,
        lastQuarterRevenue: profile.companyDetails.lastQuarterRevenue,
        position: position || null,
        socialName: profile.companyDetails.socialName,
        website: profile.companyDetails.website,
      };
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
            "Não foi possível salvar as informações comerciais.",
          tone: "error",
        });
        return;
      }
    }

    const didSave = saveProfileOverrides(profile.id, {
      avatarUrl: avatarPreviewUrl ?? null,
      name: trimmedName,
    });

    if (!didSave) {
      setIsSaving(false);
      setNotice({
        message:
          "Não foi possível salvar as alterações neste navegador. Libere espaço e tente novamente.",
        tone: "error",
      });
      return;
    }

    if (currentPassword || newPassword || confirmPassword) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }

    setDraft({});
    setIsSaving(false);
    setNotice({ message: "Alterações salvas.", tone: "success" });
    router.refresh();
  }

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = event.target.files?.[0];

    if (!file) return;

    if (!acceptedAvatarTypes.has(file.type)) {
      setNotice({
        message: "Selecione uma imagem em JPG, PNG ou WebP.",
        tone: "error",
      });
      input.value = "";
      return;
    }

    if (file.size > maxAvatarFileSize) {
      setNotice({
        message: "A imagem deve ter no máximo 15 MB.",
        tone: "error",
      });
      input.value = "";
      return;
    }

    try {
      const source = await readFileAsDataUrl(file);
      setAvatarEditorSource(source);
      setNotice(null);
    } catch {
      setNotice({
        message: "Não foi possível processar esta imagem. Tente outro arquivo.",
        tone: "error",
      });
    } finally {
      input.value = "";
    }
  }

  const handleAvatarEditorError = useCallback(() => {
    setAvatarEditorSource(null);
    setNotice({
      message: "Não foi possível processar esta imagem. Tente outro arquivo.",
      tone: "error",
    });
  }, []);

  return (
    <>
      <AppTopbarActionsPortal>
        <Button type="button" disabled={isSaving} onClick={handleSaveAll}>
          {isSaving ? "Salvando" : "Salvar alterações"}
        </Button>
      </AppTopbarActionsPortal>

      {avatarEditorSource && (
        <AvatarCropDialog
          source={avatarEditorSource}
          onApply={(avatarUrl) => {
            setDraft((current) => ({
              ...current,
              avatarUrl,
            }));
            setAvatarEditorSource(null);
            setNotice(null);
          }}
          onCancel={() => setAvatarEditorSource(null)}
          onError={handleAvatarEditorError}
        />
      )}

      <Card className="min-w-0">
      <CardContent className="grid min-w-0 gap-8">
        <section className="grid min-w-0 gap-5">
          <div className="flex min-w-0 flex-col gap-4 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <Avatar className="size-20">
                {avatarPreviewUrl && (
                  <AvatarImage src={avatarPreviewUrl} alt={name} />
                )}
                <AvatarFallback className="text-lg">
                  {getInitials(name || profile.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-medium">Foto de perfil</p>
                <p className="mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">
                  Envie uma imagem em JPG, PNG ou WebP de até 15 MB. A foto será
                  recortada, otimizada e salva neste navegador.
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
            </div>

            <div className="flex min-w-0 flex-col gap-2">
              <label
                htmlFor="profile-company-position"
                className="text-sm font-medium"
              >
                Posição na empresa
              </label>
              <Select
                value={position}
                items={positionItems}
                onValueChange={(value) => {
                  if (typeof value === "string") {
                    setPosition(value);
                    setNotice(null);
                  }
                }}
              >
                <SelectTrigger id="profile-company-position">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {profilePositionOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

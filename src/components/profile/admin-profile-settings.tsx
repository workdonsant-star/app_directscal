"use client";

import { useCallback, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";

import { AppTopbarActionsPortal } from "@/components/app-topbar-actions-portal";
import { AvatarCropDialog } from "@/components/profile/avatar-crop-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type AdminProfile = { name: string; email: string; avatarUrl: string | null };
type Notice = { message: string; tone: "error" | "success" };

const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Leitura inválida")));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(file);
  });
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

export function AdminProfileSettings({ profile, saveProfile }: { profile: AdminProfile; saveProfile?: (profile: Pick<AdminProfile, "name" | "avatarUrl">) => Promise<void> | void }) {
  const router = useRouter();
  const [name, setName] = useState(profile.name);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [cropSource, setCropSource] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleCropError = useCallback(() => {
    setCropSource(null);
    setNotice({ message: "Não foi possível processar esta imagem. Tente outro arquivo.", tone: "error" });
  }, []);

  async function choosePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!acceptedTypes.has(file.type)) {
      setNotice({ message: "Selecione uma imagem em JPG, PNG ou WebP.", tone: "error" });
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setNotice({ message: "A imagem deve ter no máximo 15 MB.", tone: "error" });
      return;
    }
    try {
      setCropSource(await readFile(file));
      setNotice(null);
    } catch {
      setNotice({ message: "Não foi possível processar esta imagem. Tente outro arquivo.", tone: "error" });
    }
  }

  async function save() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError("Informe seu nome.");
      return;
    }
    setSaving(true);
    setNotice(null);
    try {
      if (saveProfile) {
        await saveProfile({ name: trimmedName, avatarUrl });
        setName(trimmedName);
        setNotice({ message: "Alterações salvas.", tone: "success" });
        return;
      }
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName, avatarUrl }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        setNotice({ message: result?.message ?? "Não foi possível salvar o perfil.", tone: "error" });
        return;
      }
      setName(trimmedName);
      setNotice({ message: "Alterações salvas.", tone: "success" });
      router.refresh();
    } catch {
      setNotice({ message: "Não foi possível salvar o perfil.", tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AppTopbarActionsPortal>
        <Button type="button" onClick={save} disabled={saving}>{saving ? "Salvando" : "Salvar alterações"}</Button>
      </AppTopbarActionsPortal>
      {cropSource && <AvatarCropDialog
        source={cropSource}
        onApply={(value) => { setAvatarUrl(value); setCropSource(null); setNotice(null); }}
        onCancel={() => setCropSource(null)}
        onError={handleCropError}
      />}
      <Card className="min-w-0 w-full">
        <CardContent className="grid min-w-0 gap-5">
          <div className="flex min-w-0 flex-col gap-4 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <Avatar className="size-20">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
                <AvatarFallback className="text-lg">{initials(name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-medium">Foto de perfil</p>
                <p className="mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">Envie uma imagem em JPG, PNG ou WebP de até 15 MB. A foto será recortada, otimizada e salva no seu perfil.</p>
              </div>
            </div>
            <label htmlFor="admin-profile-avatar" className="inline-flex h-8 cursor-pointer items-center justify-center rounded-[5px] bg-action-neutral px-3 text-sm font-medium transition-colors hover:bg-action-neutral-hover focus-within:ring-3 focus-within:ring-ring/50">
              Enviar foto
              <Input id="admin-profile-avatar" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={choosePhoto} disabled={saving} />
            </label>
          </div>
          <div className="grid min-w-0 gap-4 md:grid-cols-2">
            <div className="flex min-w-0 flex-col gap-2">
              <label htmlFor="admin-profile-name" className="text-sm font-medium">Nome</label>
              <Input id="admin-profile-name" value={name} disabled={saving} aria-invalid={Boolean(nameError)} onChange={(event) => { setName(event.target.value); setNameError(null); setNotice(null); }} />
              {nameError && <p className="text-xs text-destructive">{nameError}</p>}
            </div>
            <div className="flex min-w-0 flex-col gap-2">
              <label htmlFor="admin-profile-email" className="text-sm font-medium">E-mail</label>
              <Input id="admin-profile-email" value={profile.email} disabled />
            </div>
          </div>
          {notice && <p role="status" className={notice.tone === "error" ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>{notice.message}</p>}
        </CardContent>
      </Card>
    </>
  );
}

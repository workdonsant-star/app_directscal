"use client";

import { Check } from "lucide-react";
import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { AssigneeAvatar } from "./action-point-badges";

export type SlackUser = {
  userId: string;
  name: string;
  avatarUrl: string | null;
};

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; users: SlackUser[] };

// Lista as pessoas do workspace do Slack da empresa, buscada ao abrir.
export function SlackUserPicker({
  selectedUserId,
  onSelect,
}: {
  selectedUserId: string | null;
  onSelect: (user: SlackUser) => void;
}) {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [query, setQuery] = useState("");

  useEffect(() => {
    let active = true;

    fetch("/api/action-points/slack-users")
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as {
          users?: SlackUser[];
          message?: string;
        } | null;

        if (!active) return;
        if (!response.ok || !payload?.users) {
          setState({
            status: "error",
            message:
              payload?.message ?? "Não foi possível listar as pessoas do Slack.",
          });
          return;
        }
        setState({ status: "ready", users: payload.users });
      })
      .catch(() => {
        if (active) {
          setState({
            status: "error",
            message: "Não foi possível listar as pessoas do Slack.",
          });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  if (state.status === "loading") {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        Carregando pessoas do Slack
      </p>
    );
  }

  if (state.status === "error") {
    return <p className="text-sm text-destructive">{state.message}</p>;
  }

  const term = query.trim().toLocaleLowerCase("pt-BR");
  const visible = state.users.filter((user) =>
    user.name.toLocaleLowerCase("pt-BR").includes(term),
  );

  return (
    <div className="space-y-2">
      <Input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Buscar pessoa"
        aria-label="Buscar pessoa do Slack"
      />
      <ul
        aria-label="Pessoas do Slack"
        className="max-h-56 overflow-y-auto rounded-md border"
      >
        {visible.map((user) => {
          const selected = user.userId === selectedUserId;

          return (
            <li key={user.userId}>
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => onSelect(user)}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-3 px-3 py-2 text-left text-sm outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                  selected && "bg-muted font-medium",
                )}
              >
                <AssigneeAvatar assignee={user} />
                <span className="min-w-0 flex-1 truncate">{user.name}</span>
                {selected && <Check className="size-4 shrink-0" aria-hidden="true" />}
              </button>
            </li>
          );
        })}
        {visible.length === 0 && (
          <li className="px-3 py-3 text-sm text-muted-foreground">
            Nenhuma pessoa encontrada.
          </li>
        )}
      </ul>
    </div>
  );
}

"use client";

import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { FileText, SendHorizontal, ThumbsDown, ThumbsUp } from "lucide-react";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { AssetQuestionAnswer, AssetQuestionCitation } from "@/lib/contracts";
import {
  getProfileOverridesServerSnapshot,
  getProfileOverridesSnapshot,
  subscribeProfileOverrides,
} from "@/lib/profile-storage";
import { cn } from "@/lib/utils";

type Feedback = "util" | "nao_util";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
  status?: AssetQuestionAnswer["status"];
  citations?: AssetQuestionCitation[];
  auditId?: string | null;
  feedback?: Feedback | null;
  pending?: boolean;
};

const introMessage: ChatMessage = {
  id: "assistant-intro",
  role: "assistant",
  content:
    "Pergunte sobre os SOPs, playbooks e documentos de governança publicados para a empresa. Cada resposta indica o ativo, a seção e a versão usados. Quando não houver regra publicada, eu aviso em vez de supor.",
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function Citations({ citations }: { citations: AssetQuestionCitation[] }) {
  return (
    <div className="mt-3 border-t pt-3">
      <p className="text-xs font-medium text-muted-foreground">Fontes</p>
      <ul className="mt-1.5 space-y-1">
        {citations.map((citation) => (
          <li key={citation.chunkId} className="text-xs leading-5">
            <Link
              href={citation.href}
              className="inline-flex items-start gap-1.5 rounded-sm text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
            >
              <FileText aria-hidden="true" className="mt-0.5 size-3 shrink-0" />
              <span>
                {citation.title} — {citation.section}
                <span className="text-muted-foreground tabular-nums">
                  {" "}
                  · versão {citation.versionNumber}, atualizada em{" "}
                  {dateFormatter.format(new Date(citation.publishedAt))}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FeedbackControls({
  message,
  onFeedback,
}: {
  message: ChatMessage;
  onFeedback: (message: ChatMessage, value: Feedback) => void;
}) {
  if (!message.auditId || message.status === "error") return null;

  return (
    <div className="mt-2 flex items-center gap-1">
      <span className="mr-1 text-xs text-muted-foreground">
        {message.feedback ? "Obrigado pela avaliação." : "Esta resposta ajudou?"}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label="Resposta útil"
        aria-pressed={message.feedback === "util"}
        className={cn(message.feedback === "util" && "bg-muted text-foreground")}
        onClick={() => onFeedback(message, "util")}
      >
        <ThumbsUp />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label="Resposta não útil"
        aria-pressed={message.feedback === "nao_util"}
        className={cn(message.feedback === "nao_util" && "bg-muted text-foreground")}
        onClick={() => onFeedback(message, "nao_util")}
      >
        <ThumbsDown />
      </Button>
    </div>
  );
}

function ChatBubble({
  message,
  user,
  onFeedback,
}: {
  message: ChatMessage;
  user: {
    avatar?: string;
    initials: string;
    name: string;
  };
  onFeedback: (message: ChatMessage, value: Feedback) => void;
}) {
  const isUser = message.role === "user";

  return (
    <article
      aria-busy={message.pending || undefined}
      className={cn(
        "flex items-end gap-3",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "max-w-[82%] rounded-xl px-4 py-3 text-sm leading-6",
          isUser
            ? "bg-sidebar text-foreground dark:bg-sidebar-accent sm:max-w-[72%]"
            : "text-foreground sm:max-w-[560px]",
        )}
      >
        <p
          className={cn(
            "whitespace-pre-line",
            message.pending && "text-muted-foreground",
          )}
        >
          {message.content}
        </p>
        {message.citations && message.citations.length > 0 ? (
          <Citations citations={message.citations} />
        ) : null}
        {!isUser ? <FeedbackControls message={message} onFeedback={onFeedback} /> : null}
      </div>

      {isUser ? (
        <Avatar size="sm" className="mb-0.5">
          <AvatarImage src={user.avatar} alt={user.name} />
          <AvatarFallback>{user.initials}</AvatarFallback>
        </Avatar>
      ) : null}
    </article>
  );
}

export function AiChatWorkspace({
  user,
}: {
  user: {
    avatar?: string;
    id: string;
    name: string;
  };
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([introMessage]);
  const [draft, setDraft] = useState("");
  const [asking, setAsking] = useState(false);
  const conversationRef = useRef<HTMLDivElement>(null);
  const previousMessageCountRef = useRef(messages.length);
  const storedOverrides = useSyncExternalStore(
    (callback) => subscribeProfileOverrides(user.id, callback),
    () => getProfileOverridesSnapshot(user.id),
    getProfileOverridesServerSnapshot,
  );
  const displayName = storedOverrides?.name ?? user.name;
  const displayAvatar = storedOverrides?.avatarUrl ?? user.avatar;
  const displayInitials = getInitials(displayName) || "DS";

  useEffect(() => {
    if (messages.length <= previousMessageCountRef.current) {
      return;
    }

    previousMessageCountRef.current = messages.length;
    const conversation = conversationRef.current;

    if (conversation) {
      conversation.scrollTop = conversation.scrollHeight;
    }
  }, [messages]);

  const submitMessage = async () => {
    const question = draft.trim();

    if (!question || asking) {
      return;
    }

    const messageId = Date.now().toString();
    const pendingId = `assistant-${messageId}`;
    // Turnos anteriores dão contexto a perguntas de continuação; a mensagem de
    // abertura e as falhas técnicas ficam de fora.
    const history = messages
      .filter(
        (message) =>
          message.id !== introMessage.id && !message.pending && message.status !== "error",
      )
      .slice(-6)
      .map((message) => ({ role: message.role, text: message.content }));

    setAsking(true);
    setDraft("");
    setMessages((current) => [
      ...current,
      { id: `user-${messageId}`, role: "user", content: question },
      {
        id: pendingId,
        role: "assistant",
        content: "Consultando os ativos publicados.",
        pending: true,
      },
    ]);

    let reply: ChatMessage;

    try {
      const response = await fetch("/api/assistant/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, history }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        answer?: AssetQuestionAnswer;
        message?: string;
      };

      if (!response.ok || !data.answer) {
        throw new Error(data.message ?? "Não consegui responder agora.");
      }

      reply = {
        id: pendingId,
        role: "assistant",
        content: data.answer.answer,
        status: data.answer.status,
        citations: data.answer.citations,
        auditId: data.answer.auditId,
        feedback: null,
      };
    } catch (error) {
      reply = {
        id: pendingId,
        role: "assistant",
        status: "error",
        content:
          error instanceof Error
            ? error.message
            : "Não consegui responder agora. Tente novamente em alguns instantes.",
      };
    }

    setMessages((current) =>
      current.map((message) => (message.id === pendingId ? reply : message)),
    );
    setAsking(false);
  };

  const sendFeedback = async (message: ChatMessage, value: Feedback) => {
    if (!message.auditId) return;

    const previous = message.feedback ?? null;
    setMessages((current) =>
      current.map((item) => (item.id === message.id ? { ...item, feedback: value } : item)),
    );

    const response = await fetch("/api/assistant/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ auditId: message.auditId, value }),
    }).catch(() => null);

    if (!response?.ok) {
      setMessages((current) =>
        current.map((item) =>
          item.id === message.id ? { ...item, feedback: previous } : item,
        ),
      );
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submitMessage();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submitMessage();
    }
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-background">
      <div
        ref={conversationRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        <div
          className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-8"
          aria-live="polite"
          aria-label="Conversa com o Assistente Directscal"
        >
          {messages.map((message) => (
            <ChatBubble
              key={message.id}
              message={message}
              user={{
                avatar: displayAvatar ?? undefined,
                initials: displayInitials,
                name: displayName,
              }}
              onFeedback={sendFeedback}
            />
          ))}
        </div>
      </div>

      <footer className="bg-background px-6 py-4">
        <form className="mx-auto w-full max-w-3xl" onSubmit={handleSubmit}>
          <div className="flex items-center gap-2 rounded-lg border bg-background p-2 transition-colors focus-within:border-foreground/40">
            <label className="sr-only" htmlFor="assistant-message">
              Mensagem para o assistente
            </label>
            <textarea
              id="assistant-message"
              rows={1}
              value={draft}
              maxLength={2000}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pergunte sobre um processo, uma alçada ou um responsável"
              className="max-h-36 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-5 outline-none placeholder:text-muted-foreground"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!draft.trim() || asking}
              aria-label="Enviar mensagem"
              className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <SendHorizontal />
            </Button>
          </div>
          <p className="mt-2 text-center text-[10px] leading-[13px] text-muted-foreground">
            As respostas usam apenas ativos publicados. Valide decisões críticas com o responsável.
          </p>
        </form>
      </footer>
    </section>
  );
}

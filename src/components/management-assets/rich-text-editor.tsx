"use client";

import { Blockquote } from "@tiptap/extension-blockquote";
import { ListItem } from "@tiptap/extension-list";
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import { Placeholder } from "@tiptap/extensions";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Columns3,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Pilcrow,
  Quote,
  Redo2,
  Rows3,
  Table2,
  Trash2,
  Undo2,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { RichTextDocument } from "@/lib/contracts";
import { cn } from "@/lib/utils";

// Vocabulário restrito: H2/H3, parágrafo, negrito, itálico, listas, destaque,
// link e tabela simples. Conteúdo colado fora disso é descartado pelo schema.
const extensions = [
  StarterKit.configure({
    heading: { levels: [2, 3] },
    blockquote: false,
    listItem: false,
    code: false,
    codeBlock: false,
    horizontalRule: false,
    strike: false,
    underline: false,
    link: {
      openOnClick: false,
      autolink: true,
      defaultProtocol: "https",
      protocols: ["http", "https", "mailto"],
    },
  }),
  ListItem.extend({ content: "paragraph (paragraph | bulletList | orderedList)*" }),
  Blockquote.extend({ content: "(paragraph | bulletList | orderedList)+" }),
  Table.configure({ resizable: false }),
  TableRow,
  TableHeader.extend({ content: "paragraph+" }),
  TableCell.extend({ content: "paragraph+" }),
  Placeholder.configure({
    placeholder: "Escreva o conteúdo. Use Título de seção para organizar o sumário.",
  }),
];

const contentClassName = cn(
  "min-h-[480px] px-6 py-6 text-[15px] leading-[25px] text-foreground outline-none sm:px-10",
  "[&>*+*]:mt-4",
  "[&_h2]:mt-8 [&_h2]:font-heading [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:leading-8 [&_h2]:tracking-[-0.4px] [&>h2:first-child]:mt-0",
  "[&_h3]:mt-6 [&_h3]:font-heading [&_h3]:text-lg [&_h3]:font-semibold",
  "[&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mt-1.5 [&_li>p]:m-0",
  "[&_blockquote]:rounded-lg [&_blockquote]:border [&_blockquote]:bg-muted/40 [&_blockquote]:px-4 [&_blockquote]:py-3",
  "[&_a]:font-medium [&_a]:underline [&_a]:underline-offset-4",
  "[&_table]:w-full [&_table]:border-collapse [&_table]:text-sm",
  "[&_td]:border [&_td]:px-3 [&_td]:py-2 [&_td]:align-top [&_th]:border [&_th]:bg-muted/40 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-medium",
  "[&_.selectedCell]:bg-primary/10",
  "[&_p.is-editor-empty:first-child]:before:pointer-events-none [&_p.is-editor-empty:first-child]:before:float-left [&_p.is-editor-empty:first-child]:before:h-0 [&_p.is-editor-empty:first-child]:before:text-muted-foreground [&_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]",
);

function ToolbarButton({
  label,
  active = false,
  disabled = false,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      title={label}
      aria-pressed={active}
      disabled={disabled}
      className={cn(active && "bg-muted text-foreground")}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function ToolbarDivider() {
  return <span aria-hidden="true" className="mx-1 h-5 w-px bg-border" />;
}

function useToolbarState(editor: Editor | null) {
  return useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      paragraph: current?.isActive("paragraph") ?? false,
      h2: current?.isActive("heading", { level: 2 }) ?? false,
      h3: current?.isActive("heading", { level: 3 }) ?? false,
      bold: current?.isActive("bold") ?? false,
      italic: current?.isActive("italic") ?? false,
      bulletList: current?.isActive("bulletList") ?? false,
      orderedList: current?.isActive("orderedList") ?? false,
      blockquote: current?.isActive("blockquote") ?? false,
      link: current?.isActive("link") ?? false,
      table: current?.isActive("table") ?? false,
      canUndo: current?.can().undo() ?? false,
      canRedo: current?.can().redo() ?? false,
    }),
  });
}

export function RichTextEditor({
  initialContent,
  editable,
  ariaLabel,
  onChange,
}: {
  initialContent: RichTextDocument;
  editable: boolean;
  ariaLabel: string;
  onChange: (content: RichTextDocument) => void;
}) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkValue, setLinkValue] = useState("");
  const editor = useEditor({
    extensions,
    content: initialContent,
    editable,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: contentClassName,
        "aria-label": ariaLabel,
        "aria-multiline": "true",
        role: "textbox",
      },
    },
    onUpdate: ({ editor: current }) => {
      onChange(current.getJSON() as RichTextDocument);
    },
  });
  const state = useToolbarState(editor);

  useEffect(() => {
    editor?.setEditable(editable);
  }, [editor, editable]);

  function openLinkEditor() {
    if (!editor) return;
    setLinkValue((editor.getAttributes("link").href as string | undefined) ?? "");
    setLinkOpen(true);
  }

  function applyLink() {
    if (!editor) return;

    const href = linkValue.trim();

    if (!href) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      const normalized = /^(https?:\/\/|mailto:)/i.test(href) ? href : `https://${href}`;
      editor.chain().focus().extendMarkRange("link").setLink({ href: normalized }).run();
    }

    setLinkOpen(false);
  }

  if (!editor || !state) {
    return (
      <div
        aria-busy="true"
        className="min-h-[540px] rounded-lg border bg-card"
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      {editable ? (
        <div className="sticky top-0 z-10 border-b bg-card">
          <div
            role="toolbar"
            aria-label="Formatação do conteúdo"
            className="flex flex-wrap items-center gap-0.5 px-2 py-1.5"
          >
            <ToolbarButton
              label="Texto"
              active={state.paragraph && !state.bulletList && !state.orderedList}
              onClick={() => editor.chain().focus().setParagraph().run()}
            >
              <Pilcrow />
            </ToolbarButton>
            <ToolbarButton
              label="Título de seção"
              active={state.h2}
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            >
              <Heading2 />
            </ToolbarButton>
            <ToolbarButton
              label="Subtítulo"
              active={state.h3}
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            >
              <Heading3 />
            </ToolbarButton>
            <ToolbarDivider />
            <ToolbarButton
              label="Negrito"
              active={state.bold}
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              <Bold />
            </ToolbarButton>
            <ToolbarButton
              label="Itálico"
              active={state.italic}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <Italic />
            </ToolbarButton>
            <ToolbarButton label="Link" active={state.link} onClick={openLinkEditor}>
              <Link2 />
            </ToolbarButton>
            <ToolbarDivider />
            <ToolbarButton
              label="Lista com marcadores"
              active={state.bulletList}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
              <List />
            </ToolbarButton>
            <ToolbarButton
              label="Lista numerada"
              active={state.orderedList}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            >
              <ListOrdered />
            </ToolbarButton>
            <ToolbarButton
              label="Destaque"
              active={state.blockquote}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
            >
              <Quote />
            </ToolbarButton>
            <ToolbarDivider />
            <ToolbarButton
              label="Inserir tabela"
              disabled={state.table}
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                  .run()
              }
            >
              <Table2 />
            </ToolbarButton>
            {state.table ? (
              <>
                <ToolbarButton
                  label="Adicionar linha abaixo"
                  onClick={() => editor.chain().focus().addRowAfter().run()}
                >
                  <Rows3 />
                </ToolbarButton>
                <ToolbarButton
                  label="Adicionar coluna à direita"
                  onClick={() => editor.chain().focus().addColumnAfter().run()}
                >
                  <Columns3 />
                </ToolbarButton>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => editor.chain().focus().deleteRow().run()}
                >
                  Remover linha
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => editor.chain().focus().deleteColumn().run()}
                >
                  Remover coluna
                </Button>
                <ToolbarButton
                  label="Remover tabela"
                  onClick={() => editor.chain().focus().deleteTable().run()}
                >
                  <Trash2 />
                </ToolbarButton>
              </>
            ) : null}
            <span className="ml-auto flex items-center gap-0.5">
              <ToolbarButton
                label="Desfazer"
                disabled={!state.canUndo}
                onClick={() => editor.chain().focus().undo().run()}
              >
                <Undo2 />
              </ToolbarButton>
              <ToolbarButton
                label="Refazer"
                disabled={!state.canRedo}
                onClick={() => editor.chain().focus().redo().run()}
              >
                <Redo2 />
              </ToolbarButton>
            </span>
          </div>

          {linkOpen ? (
            <div className="flex flex-wrap items-center gap-2 border-t px-3 py-2">
              <label htmlFor="rich-text-link" className="sr-only">
                Endereço do link
              </label>
              <Input
                id="rich-text-link"
                autoFocus
                value={linkValue}
                placeholder="https://"
                className="h-7 max-w-md flex-1"
                onChange={(event) => setLinkValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    applyLink();
                  }
                  if (event.key === "Escape") setLinkOpen(false);
                }}
              />
              <Button type="button" size="sm" onClick={applyLink}>
                Aplicar
              </Button>
              {state.link ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    editor.chain().focus().extendMarkRange("link").unsetLink().run();
                    setLinkOpen(false);
                  }}
                >
                  Remover link
                </Button>
              ) : null}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setLinkOpen(false)}
              >
                Cancelar
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      <EditorContent editor={editor} />
    </div>
  );
}

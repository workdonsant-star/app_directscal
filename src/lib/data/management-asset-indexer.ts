import type { RichTextDocument } from "@/lib/contracts";
import {
  blockToPlainText,
  splitRichTextSections,
} from "@/lib/data/rich-text";

const DEFAULT_CHUNK_SIZE = 1400;
const DEFAULT_CHUNK_OVERLAP = 180;

export type ManagementAssetChunkInput = {
  ordinal: number;
  headingPath: string;
  content: string;
  tokenCount: number;
};

function normalizeWhitespace(value: string) {
  return value
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function estimateTokenCount(value: string) {
  return value.split(/\s+/).filter(Boolean).length;
}

function splitText(value: string, chunkSize: number, overlap: number) {
  const normalized = normalizeWhitespace(value);
  if (normalized.length <= chunkSize) return normalized ? [normalized] : [];

  const chunks: string[] = [];
  let start = 0;

  while (start < normalized.length) {
    const end = Math.min(start + chunkSize, normalized.length);
    const boundary =
      end === normalized.length
        ? end
        : Math.max(
            normalized.lastIndexOf("\n", end),
            normalized.lastIndexOf(". ", end) + 1,
            normalized.lastIndexOf(" ", end),
          );
    const stop = boundary > start + Math.floor(chunkSize * 0.6) ? boundary : end;
    const chunk = normalized.slice(start, stop).trim();

    if (chunk) chunks.push(chunk);
    if (stop >= normalized.length) break;

    start = Math.max(stop - overlap, start + 1);
  }

  return chunks;
}

// Trechos determinísticos por seção (H2 e H3). Cada trecho carrega o caminho
// de títulos que a resposta do agente cita como fonte.
export function buildManagementAssetChunks(
  asset: { title: string; content: RichTextDocument },
  options: { chunkSize?: number; overlap?: number } = {},
) {
  const chunkSize = options.chunkSize ?? DEFAULT_CHUNK_SIZE;
  const overlap = options.overlap ?? DEFAULT_CHUNK_OVERLAP;
  const chunks: ManagementAssetChunkInput[] = [];

  for (const section of splitRichTextSections(asset.content, asset.title)) {
    const sectionText = section.blocks
      .map(blockToPlainText)
      .filter(Boolean)
      .join("\n\n");

    for (const content of splitText(sectionText, chunkSize, overlap)) {
      chunks.push({
        ordinal: chunks.length,
        headingPath: section.headingPath,
        content,
        tokenCount: estimateTokenCount(content),
      });
    }
  }

  return chunks;
}

// Texto enviado ao modelo de embeddings: título e seção ajudam a pergunta
// "quem aprova desconto" a encontrar o trecho certo mesmo sem os termos exatos.
export function getChunkEmbeddingText(
  assetTitle: string,
  chunk: Pick<ManagementAssetChunkInput, "headingPath" | "content">,
) {
  return `${assetTitle} — ${chunk.headingPath}\n${chunk.content}`;
}

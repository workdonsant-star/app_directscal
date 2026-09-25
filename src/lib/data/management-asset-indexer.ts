import type {
  ManagementSopContentBlock,
  ManagementSopDocument,
} from "@/lib/types";

const DEFAULT_CHUNK_SIZE = 1400;
const DEFAULT_CHUNK_OVERLAP = 180;

export type ManagementAssetChunkInput = {
  ordinal: number;
  headingPath: string;
  content: string;
  tokenCount: number;
};

export type ManagementAssetIndexPayload = {
  asset: {
    organizationId: string;
    type: ManagementSopDocument["type"];
    title: string;
    description: string;
    ownerLabel: string;
    status: "publicado";
  };
  version: {
    versionNumber: string;
    contentFormat: "json";
    content: ManagementSopDocument["document"];
    summary: string;
    indexStatus: "pronto";
  };
  chunks: ManagementAssetChunkInput[];
};

function blockToText(block: ManagementSopContentBlock) {
  if (block.type === "paragraph") return block.text;

  if (block.type === "list") {
    return block.items
      .map((item, index) => (block.ordered ? `${index + 1}. ${item}` : `• ${item}`))
      .join("\n");
  }

  const header = block.columns.join(" | ");
  const rows = block.rows.map((row) => row.join(" | "));
  return [header, ...rows].join("\n");
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function estimateTokenCount(value: string) {
  return value.split(/\s+/).filter(Boolean).length;
}

function splitText(value: string, chunkSize: number, overlap: number) {
  const normalized = normalizeWhitespace(value);
  if (normalized.length <= chunkSize) return [normalized];

  const chunks: string[] = [];
  let start = 0;

  while (start < normalized.length) {
    const end = Math.min(start + chunkSize, normalized.length);
    const boundary =
      end === normalized.length
        ? end
        : Math.max(
            normalized.lastIndexOf(" ", end),
            normalized.lastIndexOf(".", end),
          );
    const stop = boundary > start + Math.floor(chunkSize * 0.6) ? boundary : end;
    const chunk = normalized.slice(start, stop).trim();

    if (chunk) chunks.push(chunk);
    if (stop >= normalized.length) break;

    start = Math.max(stop - overlap, start + 1);
  }

  return chunks;
}

export function buildManagementAssetChunks(
  sop: ManagementSopDocument,
  options: { chunkSize?: number; overlap?: number } = {},
) {
  const chunkSize = options.chunkSize ?? DEFAULT_CHUNK_SIZE;
  const overlap = options.overlap ?? DEFAULT_CHUNK_OVERLAP;
  const chunks: ManagementAssetChunkInput[] = [];

  for (const section of sop.document.sections) {
    const sectionText = section.blocks.map(blockToText).join("\n\n");
    const sectionChunks = splitText(sectionText, chunkSize, overlap);

    for (const content of sectionChunks) {
      chunks.push({
        ordinal: chunks.length,
        headingPath: section.title,
        content,
        tokenCount: estimateTokenCount(content),
      });
    }
  }

  return chunks;
}

export function buildManagementAssetIndexPayload(
  sop: ManagementSopDocument,
  options?: { chunkSize?: number; overlap?: number },
): ManagementAssetIndexPayload {
  return {
    asset: {
      organizationId: sop.organizationId,
      type: sop.type,
      title: sop.title,
      description: sop.summary,
      ownerLabel: sop.author.name,
      status: "publicado",
    },
    version: {
      versionNumber: sop.document.version,
      contentFormat: "json",
      content: sop.document,
      summary: sop.summary,
      indexStatus: "pronto",
    },
    chunks: buildManagementAssetChunks(sop, options),
  };
}

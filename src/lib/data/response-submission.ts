type SubmissionStorage = Pick<Storage, "getItem" | "setItem">;

/** Uma tentativa por link: nenhuma identidade ou chave comum entre coletas. */
export function getResponseSubmissionId(token: string, storage: SubmissionStorage | null, createId: () => string = () => crypto.randomUUID()) {
  const key = `directscal:omdx-submission:${token}`;
  try {
    const existing = storage?.getItem(key);
    if (existing && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(existing)) return existing;
  } catch { /* Navegadores que restringem armazenamento usam a tentativa da aba. */ }
  const id = createId();
  try { storage?.setItem(key, id); } catch { /* A referência da aba preserva a repetição. */ }
  return id;
}

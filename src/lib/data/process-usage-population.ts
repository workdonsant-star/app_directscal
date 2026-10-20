export type UsagePerson = { key: string; appUserId?: string | null; email?: string | null; slackIdentity?: string | null };
export type VerifiedUsageIdentity = { appUserId: string; slackIdentity: string };

/** Somente referências verificadas conciliam canais; nomes nunca decidem identidade. */
export function buildUsagePopulation(people: UsagePerson[], verified: VerifiedUsageIdentity[] = []) {
  const parent = new Map<string, string>();
  const root = (key: string): string => {
    const next = parent.get(key);
    if (!next) { parent.set(key, key); return key; }
    if (next === key) return key;
    const result = root(next); parent.set(key, result); return result;
  };
  const merge = (first: string, second: string) => { parent.set(root(second), root(first)); };
  for (const person of people) {
    root(person.key);
    if (person.appUserId) merge(person.key, `app:${person.appUserId}`);
    if (person.email?.trim()) merge(person.key, `email:${person.email.trim().toLowerCase()}`);
    if (person.slackIdentity) merge(person.key, `slack:${person.slackIdentity}`);
  }
  for (const identity of verified) {
    const app = `app:${identity.appUserId}`; const slack = `slack:${identity.slackIdentity}`;
    if (parent.has(app) || parent.has(slack)) merge(app, slack);
  }
  const roots = new Set(people.map(person => root(person.key)));
  const slackRoots = new Set(people.filter(person => person.slackIdentity).map(person => root(person.key)));
  const appRoots = new Set(people.filter(person => !person.slackIdentity).map(person => root(person.key)));
  const unresolved = slackRoots.size > 0 && [...appRoots].some(key => !slackRoots.has(key));
  return {
    size: unresolved ? null : roots.size,
    unresolved,
    recordCount: people.length,
    resolveAsker: (appUserId: string | null, externalUserId: string | null) => {
      const key = appUserId ? `app:${appUserId}` : externalUserId ? `slack:${externalUserId}` : null;
      if (!key || !parent.has(key)) return null;
      const result = root(key);
      return roots.has(result) ? result : null;
    },
  };
}

export async function readAllUsageRows<T>(read: (start: number, end: number) => PromiseLike<{ data: T[] | null; error: unknown }>, pageSize = 1000) {
  const rows: T[] = [];
  for (let start = 0; ; start += pageSize) {
    const result = await read(start, start + pageSize - 1);
    if (result.error) throw result.error;
    if (!result.data) throw new Error("Não foi possível ler a base completa de uso.");
    rows.push(...result.data);
    if (result.data.length < pageSize) return rows;
  }
}

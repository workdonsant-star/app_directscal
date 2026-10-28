const aliases: Record<string, string> = {
  "/omdx": "/demo", "/omdx/diagnosticos": "/demo/pesquisas", "/relatorios": "/demo/relatorios",
  "/action-points": "/demo/action-points", "/assistente": "/demo/agente", "/configuracoes": "/demo/configuracoes",
  "/ativos-de-gestao": "/demo/ativos", "/admin/operacao": "/demo/operacao", "/perfil": "/demo/perfil",
};

export function demoHref(href: string) {
  if (!href.startsWith("/") || href.startsWith("/demo")) return href;
  const url = new URL(href, "https://demo.invalid");
  const download = url.pathname.match(/^\/omdx\/([^/]+)\/(relatorio|action-points)$/);
  if (download) {
    url.searchParams.set("diagnostico", download[1]);
    return `/demo/${download[2] === "relatorio" ? "relatorio" : "action-points"}/download${url.search}`;
  }
  const assetDownload = url.pathname.match(/^\/ativos-de-gestao\/download\/[^/]+\/([^/]+)$/);
  if (assetDownload) return `/demo/ativos/download/${assetDownload[1]}`;
  const route = aliases[url.pathname] ?? `/demo${url.pathname}`;
  return route + url.search + url.hash;
}

export function demoPathname(pathname: string) {
  const alias = Object.entries(aliases).find(([, demo]) => pathname === demo);
  if (alias) return alias[0];
  return pathname.startsWith("/demo/") ? pathname.slice(5) : pathname;
}

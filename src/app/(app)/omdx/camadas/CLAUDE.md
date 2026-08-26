# `/omdx/camadas` — Redirect legado

## Propósito

Compatibilidade para links antigos da página Camadas, agora promovida para a raiz `/omdx`.

## Convenções locais

- Redirecionar no servidor para `/omdx` com `redirect()` de `next/navigation`.
- Preservar o query param `diagnostico` quando ele for uma string válida.
- Não renderizar dashboard, loading próprio, topbar ou breadcrumb nesta rota.
- A implementação e as convenções visuais do dashboard vivem na raiz `/omdx` e no `CLAUDE.md` da pasta pai.

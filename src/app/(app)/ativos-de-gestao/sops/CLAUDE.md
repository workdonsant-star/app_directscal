# `/ativos-de-gestao/sops` — Biblioteca de SOPs

Antes de editar, releia o **AGENTS.md**, `src/app/CLAUDE.md` e `src/app/(app)/ativos-de-gestao/CLAUDE.md`.

## Propósito

Rota autenticada que lista os SOPs publicados para a empresa.

## Convenções locais

- Usa `ManagementAssetsPage` com o tipo `sop`.
- Exibe busca e filtro por categoria.
- Não reutiliza `SopsWorkspace` nem `sops-data-source.ts`; ambos pertencem ao protótipo legado.
- Cada card abre `/ativos-de-gestao/sops/[id]` para leitura do documento publicado.
- A rota `[id]` resolve o SOP na fonte de dados da organização e usa `notFound()` para identificadores indisponíveis.

# `/ativos-de-gestao/sops/[id]` — Leitura de SOP

Antes de editar, releia o **AGENTS.md**, `src/app/CLAUDE.md`, `src/app/(app)/ativos-de-gestao/CLAUDE.md` e `src/components/management-assets/CLAUDE.md`.

## Propósito

Rota autenticada para consultar um SOP publicado para a empresa do cliente.

## Convenções locais

- Resolve o documento por `getSopDocumentById()` e responde com `notFound()` quando o identificador não pertence a um SOP disponível para a organização.
- A página permanece server-side; a navegação interna do documento é feita por âncoras.
- O breadcrumb usa `Ativos de gestão / SOPs / Nome do SOP`.
- O conteúdo é estruturado em blocos tipados. Não renderize HTML livre vindo da fonte de dados.

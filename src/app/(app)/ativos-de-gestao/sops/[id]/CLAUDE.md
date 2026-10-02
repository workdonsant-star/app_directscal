# `/ativos-de-gestao/sops/[id]` — Leitura de SOP

Antes de editar, releia o **AGENTS.md**, `src/app/CLAUDE.md`, `src/app/(app)/ativos-de-gestao/CLAUDE.md` e `src/components/management-assets/CLAUDE.md`.

## Propósito

Rota autenticada para consultar um SOP publicado para a empresa do cliente. Playbooks e Governança usam a mesma estrutura em `/ativos-de-gestao/playbooks/[id]` e `/ativos-de-gestao/governanca/[id]`.

## Convenções locais

- Resolve o documento por `getManagementAssetDocument()` e responde com `notFound()` quando o identificador não pertence a um ativo publicado da organização.
- A página permanece server-side; a navegação interna do documento é feita por âncoras.
- O breadcrumb usa `SOPs / Nome do SOP`.
- O conteúdo é o documento do editor validado por `richTextDocumentSchema` e renderizado por `RichTextView`. Não renderize HTML livre.

# `src/components/sops` — Legado inativo de SOPs

Antes de editar, releia o **AGENTS.md**, `src/components/CLAUDE.md` e `src/lib/CLAUDE.md`.

## Propósito

Esta pasta reúne componentes legados da antiga experiência de SOPs dentro de Ativos de gestão. A funcionalidade não é exibida na navegação e as rotas antigas redirecionam para `/omdx`; mantenha estes componentes sem entrada ativa até nova decisão explícita.

## Convenções locais

- A lista de SOPs e o editor vivem na mesma superfície para evitar navegação excessiva.
- Não importar estes componentes em páginas ativas sem reabrir a decisão de produto de Ativos de gestão.
- O editor aceita formatação simples: títulos, parágrafos, negrito, itálico e listas.
- Conteúdo rico é representado como `contentHtml` no contrato `SopDocument`; qualquer persistência real deve sanitizar HTML no servidor antes de salvar.
- A versão atual usa seed server-side e persistência local no navegador como protótipo de produto. Não introduza Supabase ou route handlers sem decisão explícita.
- Use tokens do sistema e primitives existentes. Não adicione dependência de editor rico sem necessidade clara.

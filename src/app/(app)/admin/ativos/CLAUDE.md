# `/admin/ativos` — Ativos de gestão (operação Directscal)

Antes de editar, releia o **AGENTS.md**, `src/app/(app)/admin/CLAUDE.md` e `docs/ativos-de-gestao-e-agente-de-consulta.md`.

## Rotas

- `/admin/ativos`: listagem de todos os ativos, com abas por estado (Rascunho e Em revisão olham para a versão em andamento, inclusive a nova versão de um ativo já publicado), filtro por empresa e drawer `Criar ativo`.
- `/admin/ativos/[id]`: workspace editorial com editor de texto, prévia do cliente, versão publicada, dados do ativo, estado do índice e histórico de versões.
- `/admin/ativos/perguntas`: perguntas feitas ao agente no app e no Slack, com foco em lacunas (sem evidência, erro ou avaliação negativa).

## Convenções

- A criação replica o fluxo de Diagnósticos: drawer em três etapas (Informações → Responsáveis e ponto de partida → Revisão). O conteúdo é escrito na página do ativo, não no drawer.
- Ciclo: rascunho → em revisão → pronto para publicar → publicado. O conteúdo fica bloqueado fora do rascunho; `Devolver para rascunho` reabre a edição.
- Um CTA primário por tela na topbar, que muda conforme o estado (`Enviar para revisão`, `Aprovar revisão`, `Publicar versão N`, `Abrir nova versão`, `Restaurar ativo`).
- Título, resumo, categoria e responsáveis não são versionados e valem imediatamente; o conteúdo só muda para o cliente na publicação.
- Especialistas ainda vêm do catálogo local de `admin-operations-data-source.ts`, como nas entregas.
- Matriz RACI não é criada aqui: ela terá componente tabular próprio.

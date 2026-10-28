# `/admin/empresas/[id]` — Detalhe operacional da empresa

Página dedicada para visualizar contexto da empresa, especialista principal, entregas e acessos.

## Convenções locais

- A empresa possui um especialista principal nesta primeira versão.
- A atribuição persiste pelo PATCH administrativo com versão esperada. O especialista principal sugere novas entregas sem reatribuir publicações antigas.
- Diagnósticos encerrados aparecem como entregas e levam ao workspace de análise.
- O controle de acesso a módulos pertence ao detalhe da empresa, não à navegação principal do admin.

C2: Entregas no Slack usa SlackDeliveriesPanel com a API por empresa. Falha confirmada pode ser recuperada após confirmação; Incerto exige revisão humana sem reenvio. Guia de operação abre /admin/guia.

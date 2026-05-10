# `/admin/leads/[id]` — Detalhe do lead

Página dedicada para leitura completa de um lead capturado por link de aquisição.

## Convenções locais

- Renderizar dentro da shell autenticada e do container `mx-auto w-full max-w-6xl`.
- O detalhe consome `useAdminData`, porque leads criados pelo formulário público ficam em `localStorage`.
- Mostrar dados em modo leitura: contato, empresa, origem de aquisição e todos os campos preenchidos no formulário.
- Leads não abrem modal ou drawer; a navegação parte da tabela em `/admin/leads` para esta página.
- Usar cards apenas para blocos de informação do detalhe. Tabelas de listagem continuam livres, sem card externo.

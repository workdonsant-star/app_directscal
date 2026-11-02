# `/admin/leads` — Leads

Lista de leads capturados pelos links de aquisição dos módulos Directscal.

## Convenções locais

- Mostrar apenas dados persistidos vindos do snapshot autorizado do servidor.
- Nesta fase, "usuários" significa leads capturados, não usuários autenticados do sistema.
- Cada lead tem página própria em `/admin/leads/[id]`; a tabela deve navegar para esse detalhe, sem modal ou drawer lateral.
- O detalhe exibe todos os campos preenchidos no formulário de aquisição, inclusive campos customizados por campanha.
- Não adicionar ações de qualificação, CRM ou gestão de conta sem nova decisão.

O snapshot inicial é real e autorizado no servidor por getAdminPageSnapshot. Lista vazia só significa consulta concluída sem leads; a espera usa o loading compartilhado do app.

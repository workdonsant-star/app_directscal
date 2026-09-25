# `/admin/operacao` — Central de operação

Página inicial do superadmin para acompanhar o fluxo entre diagnóstico encerrado, análise especializada e publicação ao cliente.

## Convenções locais

- A fila representa entregas, não diagnósticos ainda em coleta.
- Cada entrega reúne relatório e action points sob um único estado operacional.
- Métricas resumem atenção e capacidade; a tabela livre é a superfície principal.
- A fila lê diagnósticos encerrados e relatórios consolidáveis do Supabase por uma fonte administrativa server-side.
- `Criar relatório` seleciona um cliente e um diagnóstico encerrado já existente e abre o workspace da entrega.
- Especialista, edição textual, action points e publicação ainda permanecem locais até receberem persistência própria.

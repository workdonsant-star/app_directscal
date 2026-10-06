# `/admin/operacao` — Central de operação

Página inicial do superadmin para acompanhar o fluxo entre diagnóstico encerrado, análise especializada e publicação ao cliente.

## Convenções locais

- A fila representa entregas, não diagnósticos ainda em coleta.
- Cada entrega reúne relatório e action points sob um único estado operacional.
- Métricas resumem atenção e capacidade; a tabela livre é a superfície principal.
- A fila lê diagnósticos encerrados e relatórios consolidáveis do Supabase por uma fonte administrativa server-side.
- `Criar relatório` seleciona um cliente e um diagnóstico encerrado já existente e abre o workspace da entrega.
- Especialista, edição textual, action points e publicação ainda permanecem locais até receberem persistência própria.

## Produção dos ativos de gestão

- A navegação local alterna entre Entregas e Criação dos ativos.
- `/admin/operacao/criacao-dos-ativos` é apenas a seleção de empresa.
- A produção fica dentro da instância `/admin/empresas/[id]/criacao-dos-ativos`, com empresa fixa, lista, criação, editor, revisão, publicação e perguntas restritas à organização.
- Os IDs antigos em `/admin/ativos` e `/admin/operacao/criacao-dos-ativos` redirecionam para a instância da empresa proprietária.

- A instância operacional `/admin/entregas/[id]` contém a aba Criação dos ativos no próprio menu da empresa, junto de Dados, Relatório, Action points e Publicação. Listagem, editor e perguntas usam o escopo dessa organização.

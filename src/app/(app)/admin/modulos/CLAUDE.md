# `/admin/modulos` — Módulos

Rota legada do superadmin para consultar o catálogo e o controle histórico de acesso aos aplicativos Directscal.

## Convenções locais

- O MVP mostra apenas o módulo Maturidade ativo.
- A tabela de campanhas fica em `/admin/campanhas`.
- Manter esta página focada no catálogo e nas métricas agregadas dos módulos.
- A rota não aparece mais na navegação principal. O contexto operacional começa em `/admin/operacao` e o acesso de cada cliente migra visualmente para `/admin/empresas/[id]`.

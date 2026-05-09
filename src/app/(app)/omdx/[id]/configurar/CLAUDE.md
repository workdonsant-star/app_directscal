# `/omdx/[id]/configurar` — Rota temporária/deprecated

## Propósito

Esta rota não é mais o fluxo principal de configuração de rascunho.

A decisão atual é editar rascunhos dentro de `/omdx/diagnosticos`, em um drawer lateral aberto pela ação `Continuar configuração`.

## Convenções locais

- Não evoluir esta rota como superfície de produto.
- Quando o fluxo novo for implementado, esta rota deve redirecionar para `/omdx/diagnosticos` ou ser removida.
- Não adicionar breadcrumb ou lógica nova aqui.
- `DiagnosticForm` deve ser reaproveitado pelo drawer da área de diagnósticos, não por uma página dedicada.

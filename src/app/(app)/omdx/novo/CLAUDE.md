# `/omdx/novo` — Rota temporária/deprecated

## Propósito

Esta rota não é mais o fluxo principal de criação de Maturidade.

A decisão atual é criar e configurar diagnósticos dentro de `/omdx/diagnosticos`, em um drawer lateral, mantendo o usuário no contexto da lista operacional.

## Convenções locais

- Não evoluir esta rota como superfície de produto.
- Quando o fluxo novo for implementado, esta rota deve redirecionar para `/omdx/diagnosticos` ou ser removida.
- Não adicionar breadcrumb ou lógica nova aqui.
- O formulário de criação/configuração deve viver no drawer de `/omdx/diagnosticos`.

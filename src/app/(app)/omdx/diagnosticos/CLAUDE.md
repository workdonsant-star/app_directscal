# `/omdx/diagnosticos` — Área operacional

## Propósito

Página autenticada para listar, filtrar, criar e configurar diagnósticos OMDx.

## Convenções locais

- Usar breadcrumb `Overview / Diagnósticos`.
- Manter criação e configuração em drawer lateral, sem página dedicada.
- Usar `DiagnosticsWorkspace` como componente client para controlar filtros, ações e drawer.
- Persistir criação, configuração, ativação e exclusão via Route Handlers OMDx e Supabase.
- Links por grupo permanecem separados: fundador, liderança e operação.

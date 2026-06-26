# `src/app/(app)/pessoas/fechamento` — Fechamento mensal

Rotina mensal simples do módulo Pessoas.

## Regras

- A página consome `getPeopleMonthlyClosingWorkspace()`.
- Exportação CSV aparece como ação desabilitada até haver API/persistência.
- Fechamentos aprovados devem ser tratados como rastreáveis e reabertos apenas por fluxo explícito em fase futura.

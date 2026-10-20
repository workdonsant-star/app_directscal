# Exemplo de Analytics

`/exemplos/analytics` renderiza a aderência dos ativos com oito semanas preenchidas e seis processos fictícios, usando `buildProcessUsageExample` e `ProcessUsageSection`. Herda autenticação e onboarding do shell, não depende da habilitação do módulo real e não consulta métricas de clientes. Documentos fictícios não possuem links. Suporta temas claro e escuro existentes.

A página agora mostra o Analytics completo via AnalyticsExampleDashboard, com filtro funcional entre dois diagnósticos fictícios ou consolidação de todos. Inclui todos os KPIs e gráficos do dashboard normal, com dados derivados pelas mesmas regras de domínio.

Desde 18/10/2026 usa `AnalyticsOverview`, a mesma composição em seis níveis de `/omdx`, sobre os relatórios e a aderência fictícios.

O query param `progresso` simula os estados do progresso no veredito: `sem-uso` zera a adoção dos ativos e `sem-base` remove a medição de adoção.

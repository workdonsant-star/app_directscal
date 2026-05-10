# `src/lib/data` — Fonte de dados mockada

Esta pasta é a fronteira entre UI e dados. Enquanto não existe backend, ela lê `src/lib/mock-data.ts` e expõe funções estáveis para páginas e componentes.

## Regras

- Páginas e componentes devem importar dados daqui, não de `mock-data.ts`.
- Esta camada pode continuar síncrona na fase mockada.
- Quando Supabase entrar, as assinaturas públicas devem ser preservadas sempre que possível.
- Cálculos agregados e helpers de domínio ficam aqui ou em contratos/mappers, não nos componentes.
- `admin-data-source.ts` expõe o snapshot mockado do superadmin, mesclando seeds com campanhas e leads salvos em `localStorage`.

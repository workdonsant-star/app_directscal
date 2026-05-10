# `src/app/a` — Aquisição pública

## Propósito

Rotas públicas para captura de leads por links de aquisição. Não usam sidebar, topbar, autenticação ou navegação do app autenticado.

## Convenções locais

- Resolver campanha pelo token da URL.
- Renderizar formulário configurável pela campanha.
- Salvar envio em `localStorage` enquanto não há backend.
- Após envio, mostrar preview controlado do módulo; não criar conta real.

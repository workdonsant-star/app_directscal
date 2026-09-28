# `src/hooks` — Hooks compartilhados do cliente

Antes de editar, releia o **AGENTS.md** da raiz.

## Propósito

Esta pasta concentra hooks de infraestrutura visual que dependem de APIs do navegador e são compartilhados pelo shell autenticado.

## Responsividade do shell

- `useIsMobile()` representa a largura móvel real, abaixo de `768px`.
- `useIsSidebarCompact()` controla quando a sidebar desktop inicia na variante existente de ícones.
- O breakpoint compacto é `1920px`: abaixo dele, o grid de três charts preserva a largura de leitura usando a rail de `48px` em vez da sidebar expandida de `256px`.
- Ambos os hooks usam `useSyncExternalStore` com `matchMedia`; não duplique listeners de `resize` em componentes consumidores.
- A sidebar compacta inicia recolhida. O trigger existente pode expandi-la, e uma navegação a recolhe novamente nessas larguras.

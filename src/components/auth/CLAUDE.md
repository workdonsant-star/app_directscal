# `src/components/auth` — Fluxo público de autenticação

## Propósito

Componentes das telas `/entrar`, `/criar-conta` e `/recuperar-senha`. A tela de entrada oferece formulário de e-mail/senha quando o login real estiver habilitado para superadmin/contas de aquisição ou quando o fallback de desenvolvimento estiver ativo; Google OAuth segue como opção corporativa.

## Convenções

- Componentes de formulário podem usar `"use client"`.
- Copy em pt-BR, direta, sem ponto de exclamação e sem emoji.
- Use `Input`, `Button` e tokens do design system; não criar hero de marketing.
- Links entre telas de autenticação usam `next/link`.
- Não reimplementar regra de domínio/e-mail no client; essa decisão é server-side em `src/lib/auth/access-control.ts`.
- A tela `/entrar` mantém o botão Google primeiro, divisor "ou", depois e-mail/senha quando houver login por senha habilitado.
- `AuthPageShell` mantém o vídeo líquido como padrão, mas aceita `visualVariant="app"` para o login com formulário à esquerda e painel visual lateral à direita. Essa variante usa o mesh gradient Bloom Field via `AuthGradientVisual`, com blobs White `#FFFFFF`, Matcha `#ADE316`, Violet `#7D1AFF` e Lapis `#1A48EF` declarados em `globals.css`; o movimento contínuo usa `requestAnimationFrame`, mantém o primeiro frame idêntico ao fallback CSS e é desativado por `prefers-reduced-motion`.
- Fluxos públicos longos podem usar `contentAlignment="start"` para preservar o mesmo shell sem sobrepor o formulário ao logo; o padrão continua centralizado para o login e etapas curtas.
- Assets locais `auth-figma-*` podem ser usados quando forem parte da identidade ou de provedores externos, mas não devem impor fonte, cor ou proporção fora do design system.
- No modo real, o formulário usa Auth.js Credentials com `flow: "app"`; o servidor resolve superadmin primeiro e depois credenciais de contas de aquisição. No fallback dev, continua usando `/api/auth/login`.

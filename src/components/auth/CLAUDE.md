# `src/components/auth` — Fluxo público de autenticação

## Propósito

Componentes das telas `/entrar`, `/criar-conta` e `/recuperar-senha`. A tela de entrada oferece formulário de e-mail/senha quando o login real de superadmin estiver habilitado ou quando o fallback de desenvolvimento estiver ativo; Google OAuth segue como opção corporativa.

## Convenções

- Componentes de formulário podem usar `"use client"`.
- Copy em pt-BR, direta, sem ponto de exclamação e sem emoji.
- Use `Input`, `Button` e tokens do design system; não criar hero de marketing.
- Links entre telas de autenticação usam `next/link`.
- Não reimplementar regra de domínio/e-mail no client; essa decisão é server-side em `src/lib/auth/access-control.ts`.
- A tela `/entrar` deve mostrar e-mail/senha primeiro quando houver login por senha, depois divisor "Ou faça login com" e botão "Google" com ícone.
- No modo superadmin real, o formulário usa Auth.js Credentials com `flow: "app"`; no fallback dev, continua usando `/api/auth/login`.

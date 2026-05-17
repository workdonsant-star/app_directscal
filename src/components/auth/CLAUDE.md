# `src/components/auth` — Fluxo público de autenticação

## Propósito

Componentes das telas `/entrar`, `/criar-conta` e `/recuperar-senha`. A tela de entrada oferece formulário de e-mail/senha apenas quando o fallback de desenvolvimento está ativo e Google OAuth via Auth.js como opção corporativa.

## Convenções

- Componentes de formulário podem usar `"use client"`.
- Copy em pt-BR, direta, sem ponto de exclamação e sem emoji.
- Use `Input`, `Button` e tokens do design system; não criar hero de marketing.
- Links entre telas de autenticação usam `next/link`.
- Não reimplementar regra de domínio/e-mail no client; essa decisão é server-side em `src/lib/auth/access-control.ts`.
- A tela `/entrar` deve mostrar e-mail/senha primeiro, depois divisor "Ou faça login com" e botão "Google" com ícone.

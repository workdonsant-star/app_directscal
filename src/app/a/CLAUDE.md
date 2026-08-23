# `src/app/a` — Aquisição pública

## Propósito

Rotas públicas para captura de leads por links de aquisição. Não usam sidebar, topbar, autenticação ou navegação do app autenticado.

## Convenções locais

- Resolver campanha pela slug da URL.
- Renderizar formulário configurável pela campanha.
- Persistir lead, organização e membership `cliente` no Supabase por Route Handlers server-side.
- Começar por uma tela de escolha de método. Google cria um intent httpOnly e completa empresa em `/a/[slug]/completar`; e-mail renderiza a etapa com dados da campanha e senha.
- Todas as etapas e estados públicos reutilizam o shell visual de `/entrar`, inclusive Bloom Field, painel lateral e tratamento mobile; formulários longos permanecem alinhados ao topo dentro desse shell.
- A rota pública fica disponível quando `FEATURE_ACQUISITION=true`; com o flag desligado, retorna `notFound()`.

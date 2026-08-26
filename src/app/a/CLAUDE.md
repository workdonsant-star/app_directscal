# `src/app/a` — Aquisição pública

## Propósito

Rotas públicas para captura de leads por links de aquisição. Não usam sidebar, topbar, autenticação ou navegação do app autenticado.

## Convenções locais

- Resolver campanha pela slug da URL.
- Renderizar formulário configurável pela campanha.
- Persistir lead, organização e membership `cliente` no Supabase por Route Handlers server-side.
- Começar por uma tela de escolha de método. Google cria um intent httpOnly e completa empresa em `/a/[slug]/completar`; e-mail renderiza a etapa com dados da campanha e senha.
- Todas as etapas e estados públicos reutilizam o shell visual de `/entrar`, inclusive Bloom Field, painel lateral e tratamento mobile. O cadastro distribui até três campos de campanha por bloco e avança automaticamente somente quando o bloco inteiro fica válido, mantendo a coluna na mesma altura e evitando uma página longa.
- As opções de cadastro e a conclusão do acesso exibem o aviso compartilhado de concordância com as políticas de Privacidade e de Uso da Directscal.
- A rota pública fica disponível quando `FEATURE_ACQUISITION=true`; com o flag desligado, retorna `notFound()`.

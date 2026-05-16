# `src/app/(auth)` — Rotas públicas de autenticação

## Propósito

Route group sem segmento de URL para telas públicas de autenticação. As páginas aqui não usam sidebar nem topbar e redirecionam usuários autenticados para `/omdx`.

## Convenções

- URLs públicas: `/entrar`, `/criar-conta`, `/recuperar-senha`.
- Renderizar componentes de `src/components/auth`.
- Validar sessão no servidor com o cookie de `src/lib/auth`.
- Não misturar estas páginas com o shell autenticado de `src/app/(app)`.

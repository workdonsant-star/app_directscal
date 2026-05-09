# `src/components` — Padrões visuais por domínio

Antes de editar, releia o **AGENTS.md** da raiz e este documento.

## Propósito

Esta pasta concentra **todos os componentes de UI do app**, organizados por domínio. Componentes específicos de uma feature ficam em uma subpasta nomeada pelo domínio (ex.: `omdx/`). Componentes que servem a aplicação inteira ficam direto na raiz de `components/`.

## Estrutura

```
src/components/
├── ui/                    ← primitives shadcn/ui (button, card, sidebar, …)
├── omdx/                  ← componentes específicos do módulo OMDx
├── profile/               ← componentes da página de perfil
├── app-sidebar.tsx        ← sidebar global do app autenticado
├── app-topbar.tsx         ← topbar limpa com trigger + breadcrumb
├── document-table-of-contents.tsx ← sumário documental com âncoras suaves e item ativo
├── nav-main.tsx           ← navegação principal da sidebar
├── nav-projects.tsx       ← navegação secundária/recursos da sidebar
├── nav-user.tsx           ← menu do usuário na sidebar
├── app-switcher.tsx       ← marca Directscal; futuro seletor de apps
├── theme-provider.tsx     ← wrapper de next-themes
└── theme-toggle.tsx       ← botão sol/lua
```

Cada subpasta de domínio tem seu próprio `CLAUDE.md`. Crie um quando adicionar um novo domínio.

## Dados e contratos

- Componentes devem receber dados por props ou usar funções de leitura de `src/lib/data/` quando forem componentes client específicos do domínio.
- Não importe arrays de `src/lib/mock-data.ts` em componentes.
- Tipos públicos vêm de `src/lib/types.ts`, que reexporta os contratos Zod de `src/lib/contracts/`.
- Componentes não devem conhecer formatos `Db*` de Supabase; conversões ficam em `src/lib/contracts/mappers.ts` e `src/lib/data/`.

## Convenções

- **Server Components por padrão.** `"use client"` somente quando o componente precisar (`useState`, `usePathname`, eventos, etc.).
- O shell autenticado usa o bloco **shadcn `sidebar-07`** como base visual, adaptado para Directscal.
- A sidebar tem `Módulos` (`OMDx`, `Diagnósticos`) e `Insights` com as seis dimensões; não reintroduza `Empresas` ou `Relatórios` sem nova decisão.
- A visão atual é de cliente com acesso a um único módulo; o header da sidebar deve mostrar o logo Directscal (`public/directscal-logo.svg` no light e `public/directscal-logo-dark.svg` no dark), não um seletor de workspace. O componente `AppSwitcher` poderá virar seletor de apps quando houver clientes com múltiplos apps.
- O controle manual de claro/escuro fica no dropdown do usuário em `NavUser`; o padrão global continua `system`.
- A topbar do app autenticado deve ser limpa: `SidebarTrigger`, separador, breadcrumb e ações contextuais de página. Filtros globais de página devem ficar na topbar via `actions`, não dentro do conteúdo principal. Não adicionar busca/notificações sem decisão explícita.
- **Exports nomeados.** Default exports apenas onde o framework exige (página, layout).
- **Composição com `render` prop**, não `asChild`. A versão atual do shadcn usa base-ui — vide `src/components/ui/CLAUDE.md`.
- **Seletores usam o primitive `Select` do sistema**, não `<select>` nativo. Isso evita a interface do navegador e mantém popup, foco e estados consistentes.
- **Cursor de interação:** todo elemento clicável ou interativo deve mostrar `cursor-pointer`; use `cursor-default` apenas em elementos visualmente parecidos com controle, mas sem ação real.
- **Use tokens, nunca hex literal.** `bg-card`, `text-muted-foreground`, `border`, `text-primary`, etc.
- **Use `cn()` de `@/lib/utils`** para compor classes condicionalmente.
- **Ícones:** sempre Lucide, tamanho `size-4` (16px) por padrão, `size-3` em chips/badges, `size-5` raramente. Stroke padrão 1.5 (definido pela biblioteca).
- **Tabular numerals** em qualquer número alinhável (`tabular-nums`).
- **Tipografia da marca:** Inter para sans, Instrument Serif (itálico) para emphasis raro, JetBrains Mono para código/labels técnicos. Não use serif para body.

## Hierarquia de decisão

Ao precisar de um componente novo, siga esta ordem:

1. **Existe primitive em `ui/`?** Use.
2. **Existe componente de domínio em `<dominio>/`?** Use.
3. **É algo cross-domain mas estrutural** (header, sidebar, breadcrumb)? Crie em `components/` na raiz.
4. **É específico de um domínio?** Crie em `components/<dominio>/` (e adicione ao `CLAUDE.md` da pasta).
5. **É um primitive faltando?** Adicione via `npx shadcn@latest add <nome>` em vez de escrever do zero.

## Anti-padrões

- Replicar componente shadcn dentro de `omdx/` ou outro domínio. Se precisar de variação, faça wrapper que delega para o primitive.
- Usar Tailwind direto com hex: `text-[#185EFF]` → use `text-primary`.
- Component "god": muitas props, muitas responsabilidades. Quebre em peças menores.
- Componente cliente desnecessariamente. Server Components renderizam mais rápido e enviam menos JS.
- Animações com bounce, spring, scale-in flourish ou durações > 280ms — não combinam com a marca.

## Estados visuais

Componentes que representam dados devem cobrir os estados:
- **Vazio** — mensagem clara, sem CTA agressivo.
- **Carregando** — skeleton com mesma forma do conteúdo final.
- **Erro** — mensagem com opção de tentar novamente.
- **Conteúdo** — o caso normal.

Não use spinners centrais. Skeletons localizados são mais informativos.

## Acessibilidade

- **Semântica HTML** primeiro. `<button>` para ações, `<a>` para navegação, `<table>` para dados tabulares.
- **Foco visível** (ring brand de 2px) — herdado do shadcn.
- **`aria-label`** em ações sem texto visível (ícones isolados).
- **Contraste WCAG AA** em todos os textos. Tokens `--muted-foreground` e abaixo já estão calibrados.

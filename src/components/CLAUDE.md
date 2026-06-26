# `src/components` — Padrões visuais por domínio

Antes de editar, releia o **AGENTS.md** da raiz e este documento.

## Propósito

Esta pasta concentra **todos os componentes de UI do app**, organizados por domínio. Componentes específicos de uma feature ficam em uma subpasta nomeada pelo domínio (ex.: `omdx/`). Componentes que servem a aplicação inteira ficam direto na raiz de `components/`.

## Estrutura

```
src/components/
├── ui/                    ← primitives shadcn/ui (button, card, sidebar, …)
├── admin/                 ← componentes do superadmin e aquisição pública
├── auth/                  ← telas e formulários públicos de autenticação
├── gantt/                 ← componentes do Cronograma
├── omdx/                  ← componentes específicos do módulo Maturidade
├── profile/               ← componentes da página de perfil
├── pessoas/               ← componentes do módulo Pessoas
├── role-matrix/           ← legado inativo da antiga matriz de papéis
├── sops/                  ← legado inativo da antiga experiência de SOPs
├── app-sidebar.tsx        ← sidebar global do app autenticado
├── app-topbar.tsx         ← topbar limpa com trigger + breadcrumb
├── document-table-of-contents.tsx ← sumário documental com âncoras suaves e item ativo
├── nav-main.tsx           ← navegação principal da sidebar
├── nav-modules.tsx        ← navegação expansível por módulo do sistema
├── nav-projects.tsx       ← navegação secundária/recursos da sidebar
├── nav-user.tsx           ← selector/menu do usuário na sidebar
├── app-switcher.tsx       ← selector de apps legado, fora da sidebar principal
├── kpi-card.tsx           ← card compartilhado de KPI
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
- A sidebar do app cliente lista módulos do sistema em `Módulos`; cada módulo abre um dropdown com suas funcionalidades. `Maturidade` agrupa `Overview`, `Diagnósticos`, `Cronograma` e as seis dimensões de insights. `Pessoas` agrupa Overview, Diretório, Fechamento e Configurações. O link público de cadastro de pessoas é copiado a partir do Diretório.
- `Ativos de gestão` foi removido da navegação e do catálogo de módulos. Não reintroduza SOPs, matriz de papéis ou `module_management_assets` sem nova decisão explícita.
- `Cronograma` fica visível dentro de `Maturidade` e aponta para `/gantt`; não promova a funcionalidade para um módulo próprio sem nova decisão explícita.
- `Pessoas` é módulo próprio na sidebar, com Overview, Diretório, Fechamento e Configurações. Não use linguagem genérica de RH; preserve o foco em vínculo, custo, pendência e fechamento mensal.
- Não reintroduza `Empresas` ou `Relatórios` na navegação principal do cliente sem nova decisão.
- Em `/admin`, a sidebar troca para `Administração` (`Módulos`, `Campanhas`, `Leads`, `Empresas`).
- Componentes em `auth/` conversam com `/api/auth/*`; não leem nem escrevem cookies diretamente.
- O header da sidebar mostra o selector de usuário (`NavUser`) com perfil, tema e saída. O switcher de módulos (`AppSwitcher`) não fica visível na sidebar principal.
- O controle manual de claro/escuro fica no dropdown do usuário em `NavUser`; o padrão global continua `system`.
- A topbar do app autenticado deve ser limpa e branca no tema claro (`bg-background`): `SidebarTrigger`, separador, breadcrumb e ações contextuais de página. Filtros globais de página devem ficar na topbar via `actions`, não dentro do conteúdo principal. Não adicionar busca/notificações sem decisão explícita.
- **Exports nomeados.** Default exports apenas onde o framework exige (página, layout).
- **Composição com `render` prop**, não `asChild`. A versão atual do shadcn usa base-ui — vide `src/components/ui/CLAUDE.md`.
- **Seletores usam o primitive `Select` do sistema**, não `<select>` nativo. Isso evita a interface do navegador e mantém popup, foco e estados consistentes.
- **Cursor de interação:** todo elemento clicável ou interativo deve mostrar `cursor-pointer`; use `cursor-default` apenas em elementos visualmente parecidos com controle, mas sem ação real.
- **Use tokens, nunca hex literal.** `bg-card`, `text-muted-foreground`, `border`, `text-primary`, etc.
- **Use `cn()` de `@/lib/utils`** para compor classes condicionalmente.
- **Ícones:** sempre Lucide, tamanho `size-4` (16px) por padrão, `size-3` em chips/badges, `size-5` raramente. Stroke padrão 1.5 (definido pela biblioteca).
- **Tabular numerals** em qualquer número alinhável (`tabular-nums`).
- **Tabelas operacionais não ficam dentro de `Card`.** Para continuidade de interface, use o padrão de `DiagnosticsWorkspace`: cabeçalho da seção e ações livres no fluxo da página, seguido por um wrapper direto de tabela com `overflow-hidden rounded-lg border`.
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
- Envolver tabelas principais de listagem em cards/boxes. Cards são para KPIs, itens repetidos, modais e ferramentas claramente enquadradas; listagens operacionais devem respirar como parte da página.
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

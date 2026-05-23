# `src/app` — Rotas, layouts e App Router

Antes de editar arquivos aqui, releia o **AGENTS.md** da raiz e este documento.

## Propósito

`src/app` contém **rotas, layouts, metadata e o globals.css** do projeto, no formato do **App Router** do Next.js 16. Não há páginas legadas, não há Pages Router.

## Estrutura atual

```
src/app/
├── (auth)/  
\                ← telas públicas de autenticação
│   ├── entrar/page.tsx      ← login com Google OAuth + fallback mockado opcional
│   ├── criar-conta/page.tsx ← cadastro de sessão mockada quando fallback estiver ativo
│   └── recuperar-senha/page.tsx ← recuperação mockada de senha
├── (app)/                    ← route group autenticado (cliente administrador)
│   ├── layout.tsx            ← gate de sessão + shell autenticado com sidebar
│   ├── admin/                ← visão de superadmin
│   └── omdx/
│       ├── page.tsx          ← Overview executivo do módulo OMDx
│       ├── diagnosticos/     ← área operacional (lista + drawer)
│       └── [id]/
│           ├── compartilhar/page.tsx ← central de coleta com links Supabase
│           ├── action-points/route.ts ← download direto de PDF RACI
<<<<<<< Updated upstream
│           └── relatorio/route.ts ← download direto de PDF
=======
│           ├── respostas/route.ts ← download direto de CSV anônimo
│           └── relatorio/route.ts ← download direto de relatório PDF ou CSV consolidado
>>>>>>> Stashed changes
│   └── insights/
│       ├── page.tsx          ← redirect para /insights/cultura
│       └── [dimensao]/page.tsx ← dashboard compacto por dimensão
│   └── docs/
│       └── page.tsx          ← manual prático de uso do módulo OMDx
│   └── perfil/
│       └── page.tsx          ← perfil iniciado pela sessão, com edição local
├── r/
│   └── [token]/
│       ├── page.tsx          ← formulário público do respondente por token real
│       └── obrigado/page.tsx ← confirmação após resposta registrada
├── a/
│   └── [slug]/
│       ├── page.tsx          ← início público de aquisição por campanha
│       └── completar/page.tsx ← conclusão Google da campanha
├── api/
│   └── auth/                 ← Auth.js Google OAuth + fallback mockado
├── globals.css               ← tokens da Directscal mapeados para shadcn
├── layout.tsx                ← root: <html> <body>, ThemeProvider, fontes
└── page.tsx                  ← redirect("/omdx")
```

## Dados e contratos

- Páginas devem consumir dados por `src/lib/data/`, não por arrays de `src/lib/mock-data.ts`.
- O OMDx core usa Supabase via `src/lib/data/omdx-data-source.ts`; aquisição/admin usam `src/lib/data/acquisition-data-source.ts` via Route Handlers; `mock-data.ts` permanece para seeds e superfícies ainda não migradas.
- Contratos de API/banco ficam em `src/lib/contracts/` com schemas Zod.
- A autenticação usa Auth.js/NextAuth com Google OAuth, Credentials para superadmin, Credentials para cadastro de campanha e allowlist corporativa por env; o fallback demo por e-mail/senha usa cookie mockado `httpOnly` apenas quando `AUTH_ENABLE_DEV_PASSWORD_LOGIN=true`.

## Convenções

- **Server Components por padrão.** `"use client"` somente quando houver estado, efeito, browser API ou interação real. O Overview atual é Server Component; os filhos interativos (tabela com filtro, theme toggle) é que são `"use client"`.
- **Route groups com parênteses** (`(auth)`, `(app)`) **não criam segmento de URL** — servem para agrupar rotas que compartilham layout ou responsabilidade.
- **Redirects no servidor** com `redirect()` de `next/navigation` (vide `src/app/page.tsx`).
- **Metadata** vem de `export const metadata` em `layout.tsx` e `page.tsx`.
- O favicon atual é `public/favicon.svg.svg`, registrado no metadata global.
- **Fontes** declaradas no root `layout.tsx` via `next/font/google` e expostas como variáveis CSS (`--font-inter`, `--font-instrument-serif`, `--font-jetbrains-mono`).
- **Dark mode** controlado por `next-themes` (atributo `class` em `<html>`). Default: `system`, com `enableSystem`; o usuário pode alternar manualmente claro/escuro pelo dropdown do usuário.

## globals.css — regras

`globals.css` é a **única** fonte de tokens do app. Não duplique cores ou raios em outro lugar.

- Usa Tailwind v4: tokens declarados em `@theme inline { ... }` com `var(--*)`.
- Tokens da marca em `:root` (light) e `.dark` (dark mode).
- Sempre que adicionar um token novo (ex.: nova cor de chart), declare em `@theme inline` **e** nos dois temas.
- Não use unidades diferentes do design system: spacing 4px-base, raios 0/4/6/10/14/20/999px, durations 120/180/280ms.
- O app desativa o overscroll elástico do macOS com `overscroll-behavior: none` no viewport e em containers internos de scroll.
- O shell autenticado bloqueia scroll horizontal no wrapper da sidebar e no `SidebarInset`; páginas internas não devem depender de overflow horizontal do documento.
- Elementos clicáveis/interativos devem exibir cursor de mão. A regra global cobre tags semânticas e `data-slot` dos primitives; novos primitives devem respeitar esse padrão e só usar `cursor-default` quando o elemento não tiver ação real.

## Rotas atuais e planejadas

Quando criar essas rotas, abra um `CLAUDE.md` na nova pasta:

| Rota | Pasta | Propósito |
| --- | --- | --- |
| `/entrar` | `(auth)/entrar/` | Tela pública de entrada com Google OAuth, redireciona conforme role quando já existe sessão. |
| `/criar-conta` | `(auth)/criar-conta/` | Cadastro mockado que cria uma sessão local apenas no fallback de desenvolvimento. |
| `/recuperar-senha` | `(auth)/recuperar-senha/` | Recuperação mockada de senha. |
| `/omdx` | `(app)/omdx/` | Overview executivo do módulo; não deve conter a lista operacional completa. |
| `/omdx/diagnosticos` | `(app)/omdx/diagnosticos/` | Área operacional acessada pela sidebar, com lista, filtros, criação e configuração em drawer lateral. |
| `/omdx/[id]/compartilhar` | `(app)/omdx/[id]/compartilhar/` | Central de coleta persistida com links por grupo, copy sugerida e resumo compacto. |
| `/omdx/[id]/action-points` | `(app)/omdx/[id]/action-points/` | Route Handler Node autenticado para download direto do plano de ação RACI. |
<<<<<<< Updated upstream
| `/omdx/[id]/relatorio` | `(app)/omdx/[id]/relatorio/` | Route Handler Node autenticado para download direto do PDF consolidado. |
=======
| `/omdx/[id]/respostas` | `(app)/omdx/[id]/respostas/` | Route Handler Node autenticado para download direto do CSV anônimo de respostas brutas. |
| `/omdx/[id]/relatorio` | `(app)/omdx/[id]/relatorio/` | Route Handler Node autenticado para download direto do relatório consolidado em PDF ou CSV. |
>>>>>>> Stashed changes
| `/omdx/[id]/acompanhamento` | `(app)/omdx/[id]/acompanhamento/` | Coleta em andamento |
| `/omdx/[id]/resultado` | `(app)/omdx/[id]/resultado/` | Visão executiva |
| `/omdx/[id]/resultado/[dimensao]` | `(app)/omdx/[id]/resultado/[dimensao]/` | Detalhe por dimensão |
| `/insights` | `(app)/insights/` | Redireciona para `/insights/cultura`. |
| `/insights/[dimensao]` | `(app)/insights/[dimensao]/` | Dashboard agregado por dimensão, com filtro por diagnóstico. |
| `/docs` | `(app)/docs/` | Documentação prática em página única para uso do módulo pelo cliente administrador. |
| `/perfil` | `(app)/perfil/` | Perfil iniciado pela sessão autenticada: e-mail e empresa bloqueados, edição local de nome, senha simulada e dados básicos da empresa. |
| `/r/[token]` | `r/[token]/` | Formulário público do respondente por token real — **fora** do route group `(app)`, sem sidebar/topbar |
| `/r/[token]/obrigado` | `r/[token]/obrigado/` | Página pública de agradecimento após resposta registrada ou navegador já marcado. |
| `/admin` | `(app)/admin/` | Redireciona para `/admin/modulos`. |
| `/admin/modulos` | `(app)/admin/modulos/` | Superadmin: módulos disponíveis. |
| `/admin/campanhas` | `(app)/admin/campanhas/` | Superadmin: campanhas, links e campos de aquisição. |
| `/admin/leads` | `(app)/admin/leads/` | Superadmin: leads capturados pelos links. |
| `/admin/leads/[id]` | `(app)/admin/leads/[id]/` | Superadmin: detalhe completo do lead capturado. |
| `/admin/empresas` | `(app)/admin/empresas/` | Superadmin: empresas derivadas dos leads. |
| `/a/[slug]` | `a/[slug]/` | Fluxo público de aquisição por campanha — **fora** do route group `(app)`, sem sidebar/topbar |
| `/a/[slug]/completar` | `a/[slug]/completar/` | Completa dados de empresa após Google e cria lead/membership `cliente`. |

## Navegação e breadcrumb

- O shell autenticado usa o bloco shadcn `sidebar-07` como base visual, adaptado para Directscal.
- O route group `(app)` valida o cookie de sessão no layout antes de renderizar sidebar/topbar.
- As rotas de autenticação em `(auth)` ficam fora do shell e redirecionam usuários autenticados conforme role.
- A sidebar colapsa para ícones e mantém `Overview` e `Diagnósticos` como itens separados.
- A sidebar tem uma seção `Insights` com as seis dimensões do OMDx.
- Quando o pathname começa com `/admin`, a sidebar muda para `Administração`, com `Módulos`, `Campanhas`, `Leads` e `Empresas`.
- `Empresas` e `Relatórios` não fazem parte da navegação principal nesta fase.
- A topbar é limpa: trigger da sidebar, separador e breadcrumb quando houver camada.
- `/omdx` é a raiz do módulo e não usa breadcrumb na topbar.
- Páginas abaixo de `/omdx` usam breadcrumb para mostrar a camada atual.
- `/omdx/diagnosticos` usa `Overview / Diagnósticos`.
- `/omdx/[id]/compartilhar` usa `Overview / Diagnósticos / Compartilhar`.
- `/omdx/[id]/action-points` não renderiza página nem breadcrumb; retorna PDF como attachment.
<<<<<<< Updated upstream
- `/omdx/[id]/relatorio` não renderiza página nem breadcrumb; retorna PDF como attachment.
=======
- `/omdx/[id]/respostas` não renderiza página nem breadcrumb; retorna CSV anônimo como attachment.
- `/omdx/[id]/relatorio` não renderiza página nem breadcrumb; retorna PDF como attachment por padrão e CSV consolidado quando recebe `?formato=csv`.
>>>>>>> Stashed changes
- `/insights/[dimensao]` usa `Insights / Nome da dimensão`.
- `/docs` usa `Documentação`.
- `/perfil` usa `Perfil`.
- `/admin/modulos` usa `Admin / Módulos`.
- `/admin/campanhas` usa `Admin / Campanhas`.
- `/admin/leads` usa `Admin / Leads`.
- `/admin/leads/[id]` usa `Admin / Leads / Detalhe`.
- `/admin/empresas` usa `Admin / Empresas`.
- Futuras rotas de acompanhamento e resultado usam `Overview / Diagnósticos / ...`.
- Criação e configuração não devem abrir páginas próprias; acontecem em drawer dentro de `/omdx/diagnosticos`.
- `Diagnósticos` deve ser item da sidebar; não use CTA no Overview para acessar essa área.
- As rotas temporárias `/omdx/novo` e `/omdx/[id]/configurar`, enquanto existirem, devem redirecionar para `/omdx/diagnosticos` ou indicar depreciação.

## Largura de página

- Páginas autenticadas com conteúdo principal, formulários, tabelas ou dashboards devem usar um container consistente com a densidade do app; a base documental usa `mx-auto w-full max-w-6xl`.
- O padding externo recomendado é `px-6 py-8 lg:px-10`.
- Páginas documentais com sumário lateral mantêm o grid `max-w-6xl` com coluna de conteúdo em torno de `760px`.
- Estados centralizados, páginas públicas e drawers podem ter larguras próprias quando a experiência exigir.

## Estados a prever em cada página

Ao construir qualquer página, lembre dos estados levantados no plano original do OMDx:

1. Sem dado / empty state
2. Carregando (skeleton)
3. Conteúdo
4. Erro ao carregar
5. Estados específicos do domínio (rascunho, ativo, encerrado, link inválido, link expirado, já respondeu, base de Fundador pendente)

Estados ainda não estão todos implementados — quando construir, prefira **componentes de estado dedicados** dentro do domínio (`src/components/omdx/`) em vez de espalhar `if/else` na página.

## Fluxo do respondente

A pasta `src/app/r/[token]/` será **um layout próprio**, não dentro de `(app)`:
- Sem sidebar e sem topbar do produto.
- Logo Directscal discreto, max-width estreito.
- Sem auth, completamente público.
- O grupo (sócios / liderança / time) vem do **token da URL**, não do respondente.
- `/r/[token]` resolve token real, valida disponibilidade da coleta e renderiza o formulário Likert completo sem coletar identificação pessoal.
- O envio passa por `/api/omdx/responses`, que valida token, status, trava por navegador e conjunto completo de perguntas antes de gravar.
- Depois de uma resposta registrada, o fluxo redireciona para `/r/[token]/obrigado`; se o cookie de resposta já existir, o servidor também redireciona direto para essa página.

## Anti-padrões

- Importar `mock-data.ts` em páginas, layouts ou componentes. Use `src/lib/data/`.
- Espalhar `"use client"` no topo da página inteira só porque um filho precisa — extraia o filho interativo.
- Adicionar metadata específica de página no `layout.tsx` global.
- Criar nova rota sem documentar o estado dela aqui.

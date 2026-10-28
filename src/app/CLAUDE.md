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
│   └── recuperar-senha/page.tsx ← recuperação real de credencial existente
├── (app)/                    ← route group autenticado (cliente administrador)
│   ├── layout.tsx            ← gate de sessão + shell autenticado com sidebar
│   ├── admin/                ← visão de superadmin
│   └── omdx/
│       ├── page.tsx          ← dashboard principal de pontuação por camada
│       ├── camadas/          ← redirect legado para /omdx
│       ├── diagnosticos/     ← área operacional (lista + drawer)
│       └── [id]/
│           ├── compartilhar/page.tsx ← redirect legado para Pesquisas
│           ├── action-points/route.ts ← download direto de PDF RACI
│           └── relatorio/route.ts ← download direto de relatório PDF ou CSV consolidado
│   └── insights/
│       ├── page.tsx          ← redirect para /insights/cultura
│       └── [dimensao]/page.tsx ← dashboard compacto por dimensão
│   └── docs/
│       └── page.tsx          ← manual prático de uso do módulo Maturidade
│   └── action-points/
│       └── page.tsx          ← Action Points em lista gerencial agrupada, com painel de detalhes (`/gantt` redireciona)
│   └── assistente/
│       └── page.tsx          ← chat IA frontend-only com mensagens demonstrativas
│   └── configuracoes/
│       └── page.tsx          ← dados empresariais e comerciais da conta
│   └── perfil/
│       └── page.tsx          ← dados pessoais e segurança da sessão
│   └── ativos-de-gestao/
│       ├── page.tsx          ← redirect para a biblioteca de SOPs
│       ├── sops/
│       │   ├── page.tsx      ← biblioteca de SOPs por categoria
│       │   └── [id]/page.tsx ← leitura individual do SOP publicado
│       ├── playbooks/page.tsx ← biblioteca de Playbooks por categoria
│       ├── governanca/page.tsx ← biblioteca de Governança por categoria
│       └── matriz-raci/page.tsx ← biblioteca de matrizes RACI
│   └── sops/
│       └── page.tsx          ← redirect legado para /omdx
├── r/
│   └── [token]/
│       ├── page.tsx          ← formulário público do respondente por token real
│       └── obrigado/page.tsx ← confirmação após resposta registrada
├── (auth)/convites/lideranca/[token]/page.tsx ← revisão pública do convite de liderança
├── a/
│   └── [slug]/
│       ├── page.tsx          ← início público de aquisição por campanha
│       └── completar/page.tsx ← conclusão Google da campanha
├── aula-executiva/
│   └── page.tsx              ← landing pública da aula sobre estrutura de gestão
├── api/
│   ├── auth/                 ← Auth.js Google OAuth + fallback mockado
│   └── profile/              ← atualização autenticada das informações comerciais
├── globals.css               ← tokens da Directscal mapeados para shadcn
├── layout.tsx                ← root: <html> <body>, ThemeProvider, fontes
└── page.tsx                  ← redirect("/omdx")
```

## Dados e contratos

- Páginas devem consumir dados por `src/lib/data/`, não por arrays de `src/lib/mock-data.ts`.
- O core de Maturidade usa Supabase via `src/lib/data/omdx-data-source.ts`; aquisição/admin usam `src/lib/data/acquisition-data-source.ts` via Route Handlers; `mock-data.ts` permanece para seeds e superfícies ainda não migradas.
- Contratos de API/banco ficam em `src/lib/contracts/` com schemas Zod.
- A autenticação usa Auth.js/NextAuth com Google OAuth, Credentials para superadmin, Credentials para cadastro de campanha e allowlist corporativa por env; o fallback demo por e-mail/senha usa cookie mockado `httpOnly` apenas quando `AUTH_ENABLE_DEV_PASSWORD_LOGIN=true`.

## Convenções

- `/demo` é uma rota pública aditiva com o shell compartilhado do produto e fixtures isoladas, sem sessão ou serviços reais. `scripts/demo/prepare.mjs` distribui somente essa rota em projeto dedicado. Ver `demo/CLAUDE.md` e `docs/ambiente-demo.md`.

- **Server Components por padrão.** `"use client"` somente quando houver estado, efeito, browser API ou interação real. O Overview atual é Server Component; os filhos interativos (tabela com filtro, theme toggle) é que são `"use client"`.
- **Route groups com parênteses** (`(auth)`, `(app)`) **não criam segmento de URL** — servem para agrupar rotas que compartilham layout ou responsabilidade.
- **Redirects no servidor** com `redirect()` de `next/navigation` (vide `src/app/page.tsx`).
- **Metadata** vem de `export const metadata` em `layout.tsx` e `page.tsx`.
- O favicon atual é `public/favicon.png`, registrado no metadata global.
- **Fontes** declaradas no root `layout.tsx` via `next/font/google` e expostas como variáveis CSS (`--font-funnel-sans`, `--font-plus-jakarta-sans`, `--font-jetbrains-mono`). Títulos semânticos usam Plus Jakarta Sans; corpo e UI usam Funnel Sans. Tamanhos usam os tokens `ui-*` e `doc-*` de `docs/tokens-de-tipografia.md`.
- **Dark mode** controlado por `next-themes` (atributo `class` em `<html>`). Default: `system`, com `enableSystem`; o usuário pode alternar manualmente claro/escuro pelo dropdown do usuário.

## globals.css — regras

`globals.css` é a **única** fonte de tokens do app. Não duplique cores ou raios em outro lugar.

- Usa Tailwind v4: tokens declarados em `@theme inline { ... }` com `var(--*)`.
- Tokens da marca em `:root` (light) e `.dark` (dark mode).
- Sempre que adicionar um token novo (ex.: nova cor de chart), declare em `@theme inline` **e** nos dois temas.
- As variáveis semânticas de cor do Figma (`surface/*`, `content/*`, `brand/*` e `border/default`) são espelhadas em CSS com nomes sem a categoria `color/`; os aliases shadcn (`background`, `foreground`, `muted`, `primary`, `sidebar`, etc.) devem resolver para esses tokens, não duplicar valores.
- Não use unidades diferentes do design system: spacing 4px-base, raios 0/4/6/10/14/20/999px, durations 120/180/280ms.
- O app desativa o overscroll elástico do macOS com `overscroll-behavior: none` no viewport e em containers internos de scroll.
- O shell autenticado bloqueia scroll horizontal no wrapper da sidebar e no `SidebarInset`; páginas internas não devem depender de overflow horizontal do documento.
- Elementos clicáveis/interativos devem exibir cursor de mão. A regra global cobre tags semânticas e `data-slot` dos primitives; novos primitives devem respeitar esse padrão e só usar `cursor-default` quando o elemento não tiver ação real.

## Rotas atuais e planejadas

Quando criar essas rotas, abra um `CLAUDE.md` na nova pasta:

| Rota | Pasta | Propósito |
| --- | --- | --- |
| `/entrar` | `(auth)/entrar/` | Tela pública de entrada com Google OAuth, redireciona conforme role quando já existe sessão. |
| `/aula-executiva` | `aula-executiva/` | Landing pública da aula executiva sobre dependência do fundador, com CTA configurável por ambiente. |
| `/criar-conta` | `(auth)/criar-conta/` | Cadastro mockado que cria uma sessão local apenas no fallback de desenvolvimento. |
| `/recuperar-senha` | `(auth)/recuperar-senha/` | Recuperação mockada de senha. |
| `/omdx` | `(app)/omdx/` | Dashboard autenticado que compara Fundador, Liderança e Time em escala de 1 a 5. |
| `/omdx/camadas` | `(app)/omdx/camadas/` | Redirect legado para `/omdx`, preservando o filtro de diagnóstico. |
| `/omdx/diagnosticos` | `(app)/omdx/diagnosticos/` | Área operacional acessada pela sidebar, com lista, filtros, criação e configuração em drawer lateral. |
| `/action-points` | `(app)/action-points/` | Action Points em lista gerencial agrupada por dimensão, responsável ou prazo, com painel de detalhes. Item independente da sidebar. |
| `/assistente` | `(app)/assistente/` | Interface frontend-only do WorkFlow, com conversa demonstrativa e foto do perfil autenticado nas mensagens da pessoa. |
| `/omdx/[id]/compartilhar` | `(app)/omdx/[id]/compartilhar/` | Redirect legado para `/omdx/diagnosticos`; compartilhamento e encerramento ficam na tabela. |
| `/omdx/[id]/action-points` | `(app)/omdx/[id]/action-points/` | Route Handler Node autenticado para download direto do plano de ação RACI. |
| `/omdx/[id]/relatorio` | `(app)/omdx/[id]/relatorio/` | Route Handler Node autenticado para download direto do relatório consolidado em PDF ou CSV. |
| `/omdx/[id]/acompanhamento` | `(app)/omdx/[id]/acompanhamento/` | Coleta em andamento |
| `/omdx/[id]/resultado` | `(app)/omdx/[id]/resultado/` | Visão executiva |
| `/omdx/[id]/resultado/[dimensao]` | `(app)/omdx/[id]/resultado/[dimensao]/` | Detalhe por dimensão |
| `/insights` | `(app)/insights/` | Redireciona para `/insights/cultura`. |
| `/insights/[dimensao]` | `(app)/insights/[dimensao]/` | Dashboard agregado por dimensão, com filtro por diagnóstico. |
| `/docs` | `(app)/docs/` | Documentação prática em página única para uso do módulo pelo cliente administrador. |
| `/configuracoes` | `(app)/configuracoes/` | Configurações empresariais reais derivadas do onboarding e do CNPJ. |
| `/perfil` | `(app)/perfil/` | Perfil iniciado pela sessão autenticada: nome/foto persistidos, posição na empresa e senha simulada. |
| `/api/profile` | `api/profile/` | Atualiza os campos comerciais permitidos do lead autenticado e preserva dados cadastrais e desafios. |
| `/omdx/membros-da-operacao` | `(app)/omdx/membros-da-operacao/` | Redirect legado para `/omdx/diagnosticos`. |
| `/ativos-de-gestao` | `(app)/ativos-de-gestao/` | Redireciona para `/ativos-de-gestao/sops`. |
| `/ativos-de-gestao/sops` | `(app)/ativos-de-gestao/sops/` | Biblioteca de SOPs com busca e filtro por categoria. |
| `/ativos-de-gestao/sops/[id]` | `(app)/ativos-de-gestao/sops/[id]/` | Leitura autenticada de um SOP publicado, com metadados e sumário lateral. |
| `/ativos-de-gestao/playbooks` | `(app)/ativos-de-gestao/playbooks/` | Biblioteca de Playbooks com busca e filtro por categoria. |
| `/ativos-de-gestao/governanca` | `(app)/ativos-de-gestao/governanca/` | Biblioteca de Governança com busca e filtro por categoria. |
| `/ativos-de-gestao/matriz-raci` | `(app)/ativos-de-gestao/matriz-raci/` | Biblioteca de matrizes RACI com busca. |
| `/sops` | `(app)/sops/` | Redirect legado para `/omdx`. |
| `/r/[token]` | `r/[token]/` | Formulário público do respondente por token real — **fora** do route group `(app)`, sem sidebar/topbar |
| `/r/[token]/obrigado` | `r/[token]/obrigado/` | Página pública de agradecimento após resposta registrada ou navegador já marcado. |
| `/admin` | `(app)/admin/` | Redireciona para `/admin/operacao`. |
| `/admin/operacao` | `(app)/admin/operacao/` | Superadmin: indicadores e fila de entregas. |
| `/admin/especialistas` | `(app)/admin/especialistas/` | Superadmin: equipe interna e cadastro persistido. |
| `/admin/modulos` | `(app)/admin/modulos/` | Rota legada do catálogo de módulos. |
| `/admin/campanhas` | `(app)/admin/campanhas/` | Superadmin: campanhas, links e campos de aquisição. |
| `/admin/leads` | `(app)/admin/leads/` | Superadmin: leads capturados pelos links. |
| `/admin/leads/[id]` | `(app)/admin/leads/[id]/` | Superadmin: detalhe completo do lead capturado. |
| `/admin/empresas` | `(app)/admin/empresas/` | Superadmin: empresas derivadas dos leads. |
| `/admin/empresas/[id]` | `(app)/admin/empresas/[id]/` | Superadmin: especialista, entregas e acessos da empresa. |
| `/admin/entregas/[id]` | `(app)/admin/entregas/[id]/` | Superadmin: workspace de análise e publicação. |
| `/a/[slug]` | `a/[slug]/` | Fluxo público de aquisição por campanha — **fora** do route group `(app)`, sem sidebar/topbar |
| `/a/[slug]/completar` | `a/[slug]/completar/` | Completa dados de empresa após Google e cria lead/membership `cliente`. |

## Navegação e breadcrumb

- O shell autenticado usa o bloco shadcn `sidebar-07` como base visual, adaptado para Directscal. O subtítulo do usuário na sidebar vem do nome fantasia resolvido por `getProfileSettingsData()`, com fallback para o nome oficial.
- O route group `(app)` valida o cookie de sessão no layout antes de renderizar sidebar/topbar.
- As rotas de autenticação em `(auth)` ficam fora do shell e redirecionam usuários autenticados conforme role.
- A sidebar colapsa para ícones e mantém a navegação principal do cliente plana. `Analytics`, `Pesquisas`, `Action Points` e `Agente` aparecem no grupo principal; `Pesquisas` preserva a rota `/omdx/diagnosticos`. `Pessoas` permanece fora da navegação.
- `Action Points` aponta para `/action-points` (`/gantt` é redirect legado); a rota usa o plano de ação mais recente quando houver diagnóstico consolidável e mostra estado vazio quando não houver.
- A sidebar tem uma seção `Maturidade` com as seis dimensões analíticas.
- A sidebar tem uma seção `Ativos de gestão` com links ativos para `SOPs`, `Playbooks`, `Governança` e `Matriz RACI`.
- A sidebar tem uma seção `Documentos` com `Contratos` e `Relatórios` desabilitados como placeholders, sem rotas nesta fase. `Contratos` não aparece para `admin` da empresa.
- `Configurações` fica fixado no rodapé da sidebar do Superadmin da empresa (`cliente`) e aponta para `/configuracoes`; não aparece para `admin` da empresa nem para o `superadmin` global.
- Quando o pathname começa com `/admin`, a sidebar muda para `Administração`, com `Operação`, `Especialistas`, `Empresas`, `Leads` e `Campanhas`.
- Usuários `superadmin` ficam restritos à superfície `/admin/*`. Tentativas de abrir `/omdx`, `/insights`, `/action-points`, `/assistente`, `/docs`, `/configuracoes` ou `/perfil` redirecionam para `/admin/operacao`; APIs internas de cliente respondem `403`.
- Usuários `admin` da empresa acessam toda a superfície cliente, exceto Configurações e Contratos. A rota `/configuracoes` redireciona para `/omdx` e as APIs `/api/settings/*` respondem `403`.
- `Empresas` não faz parte da navegação principal nesta fase.
- A topbar é limpa: trigger da sidebar, separador e breadcrumb quando houver camada.
- Ações primárias de página, incluindo `Salvar alterações` em Perfil e Configurações, ficam antes do sino na topbar; não se repetem no rodapé dos cards.
- Páginas raiz abertas diretamente pela sidebar ou pelo menu do usuário não usam breadcrumb na topbar.
- O breadcrumb começa apenas em uma página aberta a partir da raiz e parte da raiz imediata, sem repetir a seção superior da sidebar.
- `/omdx/camadas` redireciona para `/omdx` e não renderiza breadcrumb próprio.
- `/omdx`, `/omdx/diagnosticos`, `/action-points`, `/assistente`, `/insights/[dimensao]`, `/docs`, `/relatorios`, `/perfil`, `/configuracoes` e as categorias de Ativos de gestão são raízes sem breadcrumb.
- `/omdx/[id]/compartilhar` somente redireciona para Pesquisas; não renderiza tela ou breadcrumb.
- `/omdx/[id]/action-points` não renderiza página nem breadcrumb; retorna PDF como attachment.
- `/omdx/[id]/relatorio` não renderiza página nem breadcrumb; retorna PDF como attachment por padrão e CSV consolidado quando recebe `?formato=csv`.
- `/configuracoes` mantém apenas as ações da página na topbar.
- `/ativos-de-gestao` mostra as pastas por categoria.
- `/ativos-de-gestao/sops/[id]` usa `SOPs / Nome do SOP`.
- `/ativos-de-gestao/matriz-de-papeis` redireciona para `/ativos-de-gestao/matriz-raci`; `/sops` continua como redirect legado para `/omdx`.
- `/omdx/membros-da-operacao` redireciona para `/omdx/diagnosticos` e não renderiza breadcrumb.
- `/admin/operacao`, `/admin/especialistas`, `/admin/modulos`, `/admin/campanhas`, `/admin/leads` e `/admin/empresas` são raízes sem breadcrumb.
- `/admin/leads/[id]` usa `Leads / Detalhe`.
- `/admin/empresas/[id]` usa `Empresas / Detalhe`.
- `/admin/entregas/[id]` usa `Operação / Empresa`.
- Futuras rotas de acompanhamento e resultado começam o breadcrumb pela raiz imediata `Pesquisas`.
- Criação e configuração não devem abrir páginas próprias; acontecem em drawer dentro de `/omdx/diagnosticos`.
- `Pesquisas` deve ser item da sidebar e apontar para `/omdx/diagnosticos`; não use CTA no Overview para acessar essa área.
- As rotas temporárias `/omdx/novo` e `/omdx/[id]/configurar`, enquanto existirem, devem redirecionar para `/omdx/diagnosticos` ou indicar depreciação.

## Largura de página

- Páginas autenticadas com conteúdo principal, formulários, tabelas ou dashboards usam `AppPage`, com o mesmo recuo horizontal de Dimensões: `px-6 py-8 lg:px-10`, conteúdo em largura total e sem centralização ou `max-width` adicional.
- A base documental é uma exceção e usa `mx-auto w-full max-w-6xl` dentro de `AppPage`.
- Páginas documentais com sumário lateral mantêm o grid `max-w-6xl` com coluna de conteúdo em torno de `760px`.
- Estados centralizados, páginas públicas e drawers podem ter larguras próprias quando a experiência exigir.

## Estados a prever em cada página

Ao construir qualquer página, lembre dos estados levantados no plano original de Maturidade:

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

## Interface Symbach

A referência local é `Symbach Os`, portada para a branch `symbach`. O shell usa `app-shell` e `bg-shell`, topbar de 56px, sidebar de 256px expandida a partir de 1280px e conteúdo com raio de 20px.

A navegação cliente agrupa Iniciativas, Ativos de gestão por categoria, Análises e relatórios. Essa organização substitui as antigas seções Maturidade e Documentos da sidebar. Analytics, Pesquisas, Agente e Action Points preservam as rotas existentes.

`/iniciativas` oferece lista e criação local por usuário/empresa. `/iniciativas/[id]` abre o workspace de projeto da opção 2, com atenção do gestor, tarefas de demonstração, atividade, ativos relacionados e edição dos metadados locais. As tarefas não têm persistência nem integração; ver `iniciativas/[id]/CLAUDE.md` e `docs/experiencia-agentica-projetos-e-action-points.md`. `/ativos-de-gestao/gestao-de-pessoas`, `/ativos-de-gestao/area-governanca`, `/ativos-de-gestao/cultura` e `/ativos-de-gestao/comunicacao` agrupam conteúdo publicado por área. Autenticação e Supabase mantêm os contratos anteriores. Ver `docs/shell-e-iniciativas.md`.

A sidebar concentra os ativos em Ativos de gestão, sem Bibliotecas por tipo. `/ativos-de-gestao/categorias/[categoria]` abre categorias adicionais; Sem categoria preserva ativos não classificados. `/ativos-de-gestao/matriz-raci/[id]` permite leitura do documento publicado. O breadcrumb de cada ativo retorna à sua categoria.

## Configuração inicial do cliente

`/onboarding` é uma rota autenticada fora do shell `(app)`. Donos cuja empresa não possui conclusão inicial nem instalação Slack ativa passam pela preparação antes da navegação normal. `/api/settings/onboarding` revalida dados reais e grava conclusão idempotente por empresa. OAuth Slack volta ao onboarding enquanto pendente, e a Configurações depois de concluído. O cadastro anterior do Herbert será capturado sem alterar sua conta.

Na configuração inicial, novas lideranças vêm da listagem ao vivo do Slack. `/api/settings/slack-users` é exclusivo do dono; `/api/settings/sectors` recebe setor, ID Slack e cargo opcional. Não envia convites nem concede acesso ao painel. A conexão OAuth continua separada e depende da Redirect URL cadastrada no Slack.

A decisão de entrada usa `requiresOnboarding`, derivada no servidor: conclusão persistida ou instalação Slack ativa da própria empresa dispensam o onboarding inteiro. Sem ambos, a preparação é obrigatória. Conexão de outra empresa não libera acesso. A conclusão explícita continua revalidando setores e lideranças; dispensar a tela não grava conclusão nem transfere workspace.

Superfícies seguem uma escala única nos dois temas, documentada em `docs/tokens-de-cor.md`: shell, canvas, card, control e popover opacos; field e selected translúcidos. O escuro mantém o frame Figma `272:2` (canvas `#0B0B0B`, cards `#181818`, shell `#161616`). Cards usam apenas `bg-card`, sem `dark:` e sem borda.

`/exemplos/analytics` é uma visualização autenticada para capturas com dados fictícios de aderência, sem habilitar módulos nem acessar métricas reais. Reutiliza componentes e temas do produto e fica fora da sidebar.

A superfície autenticada rola internamente abaixo da topbar: app-shell tem altura de 100svh, SidebarInset recorta overflow e o main usa min-height: 0 e overflow-y: auto. Assim os cantos de 20px permanecem visíveis durante a rolagem em ambos os temas.

- Estados de hover usam cores neutras, sem azul; ações primárias preservam azul somente no repouso.

- Âncoras documentais rolam somente o main/app-content interno, respeitando scroll-margin-top e movimento reduzido. SidebarInset usa overflow: clip para impedir que links com hash desloquem o shell em 56px; o item ativo acompanha a posição das seções nessa mesma área interna.

- Callouts documentais usam tokens `document-info` e `document-attention`, com foreground próprio. No escuro, azul profundo e âmbar profundo substituem fundos pastel; negrito e links herdam a cor do callout para preservar contraste.


- PATCH /api/management-assets/[id] permite atualização versionada de ativos publicados pelo dono da empresa, com validação Tiptap, isolamento por membership e controle de conflito. A leitura mantém sua URL e oferece edição inline.

- Action Points usa a mesma régua de status da Maturidade (`--omdx-status-*`, ver `src/components/omdx/CHART_COLOR_SYSTEM.md`) em bolinhas, barras, ícones e anéis. Percentuais e textos de status ficam em texto neutro, no mesmo tamanho do rótulo. Os tokens `ap-positive`, `ap-attention` e `ap-negative` continuam definidos, mas a tela de aderência não os usa mais.


Fechamento de 19/10/2026: Action Points liga a seleção publicada real à visão por pessoa (inclusive v2), com filtro ?diagnostico e estado vazio. Downloads de ações recusam rascunhos e usam a mesma seleção; PDF de relatório inclui editorial aprovado. Revisões são privadas até publicar.

A15: POST /api/internal/slack-deliveries é consumidor limitado a uma entrega, com segredo dedicado obrigatório (mínimo 32 caracteres), sem sessão/browser ou empresa enviada no payload. Não existe scheduler externo configurado pela implementação; o acionamento periódico deve ser homologado na implantação.

Relatórios reais e demo usam ReportWorkspace com as mesmas seções, índice, contato e ações. Estados públicos de coleta e agradecimento ficam nos componentes omdx compartilhados, preservando o fluxo /r autorizado.

Downloads de diagnóstico oferecem relatório editorial por padrão, PDF de dados em `conteudo=dados` e CSV em `formato=csv`. As rotas de exemplo/demo reutilizam o renderer com fontes locais; o tracing em next.config.ts inclui os assets PDF.

C2: /docs é o guia do cliente com nomes atuais; /admin/guia é o guia da operação sob o layout administrativo. O leitor de ativos oferece acesso ao agente e /assistente oferece Guia de uso. Sem novo acesso a dados ou conexão externa.


`GET /api/auth/site-profile` devolve somente nome/foto da sessão definitiva ao Website, com CORS restrito aos dois domínios oficiais e sem cache. Não compartilha tokens. Ver `api/auth/site-profile/CLAUDE.md`.

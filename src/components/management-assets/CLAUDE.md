# `src/components/management-assets` — Biblioteca de ativos de gestão

Antes de editar, releia o **AGENTS.md**, `src/components/CLAUDE.md` e `src/lib/CLAUDE.md`.

## Propósito

Esta pasta implementa as listagens de SOPs, Playbooks, Governança e Matriz RACI publicadas para a empresa do cliente, a leitura individual dos ativos textuais e o editor de texto usado pela operação Directscal.

## Convenções locais

- As listagens por categoria e os acessos legados por tipo compartilham `ManagementAssetsLibrary` e seguem o frame Figma `217:2` como padrão visual: filtros na topbar, cabeçalho livre no fluxo da página e grid responsivo de cards.
- As categorias são páginas raiz abertas pela sidebar e não exibem breadcrumb; o breadcrumb começa no detalhe de um ativo.
- Cada card apresenta título, resumo, autoria e data de atualização.
- A autoria mostra a foto recebida em `author.avatarUrl`; sem imagem ou em falha de carregamento, o Avatar preserva as iniciais, sem alterar o layout do card.
- As pastas misturam tipos conforme a categoria cadastrada. Em pastas, `showType` identifica o tipo no card; os acessos legados por tipo mantêm seu filtro.
- Todos os tipos, incluindo Matriz RACI, apontam para leitura individual (`getManagementAssetHref`). A RACI reutiliza a leitura RichText existente, incluindo tabelas.
- A busca e o filtro são client-side sobre dados recebidos da página server-side.
- O filtro de categoria precede a busca na topbar; As pastas mantêm apenas a busca, pois a categoria já está definida.
- `ManagementAssetDocumentView` renderiza a leitura com sumário por âncoras (títulos H2) e `RichTextView`, sem HTML livre.
- `ManagementAssetDocumentView` oferece Baixar MD abaixo do sumário lateral, com 24px de intervalo e `Button variant="secondary"` (cinza). Em larguras sem sumário lateral, o botão aparece acima do artigo. O link nativo `/ativos-de-gestao/download/<tipo>/<id>` exporta em Markdown (.md, UTF-8) a versão publicada acessível à sessão, para todos os tipos.
- `RichTextView` transforma o documento do editor (`RichTextDocument`) em elementos React com tokens do sistema. É server-compatible e também alimenta a prévia do admin.
- Na leitura e nas prévias de SOPs, parágrafos iniciados por `Informação:` (com ou sem o símbolo introdutório) usam fundo azul sutil, enquanto `Atenção:` usa fundo amarelo sutil. Ambos têm 20px de respiro e raio de 10px; outros tipos de ativo preservam a renderização textual padrão.
- `RichTextEditor` (client) usa Tiptap com vocabulário restrito: Título de seção (H2), Subtítulo (H3), parágrafo, negrito, itálico, link (http, https, mailto), listas, destaque e tabela simples sem mescla visual. Listas, destaques e células aceitam só parágrafos e listas; conteúdo colado fora disso é descartado. Não adicione marcas de cor, tamanho ou alinhamento.
- O JSON do editor é validado por `richTextDocumentSchema` no servidor. `tests/unit/fixtures/tiptap-editor-output.json` guarda uma saída real do editor; atualize o fixture se mudar extensões.
- O detalhe do ativo segue o frame `191:3421`: índice lateral de 220px, 40px de distância até o artigo de 768px, cabeçalho com categoria, metadados em cinco colunas no desktop amplo (líder responsável, versão, revisão, atualizado em e editado por), três em larguras intermediárias e duas no mobile e seções com divisórias sutis.
- Use apenas tokens do sistema e primitives existentes; não introduza cores próprias para categorias.
- O estado vazio inicial é diferente do estado sem resultados causado pelos filtros.

`ManagementAssetCategoryPage` resolve categorias principais e adicionais, filtra por categoria normalizada e conserva a autorização cliente. O breadcrumb do leitor volta à pasta da categoria, não à listagem por tipo. `Bibliotecas` não aparece na sidebar.

- Todas as tabelas visíveis usam o padrão das Dimensões de 06/10/2026 via `Table`: cabeçalho neutro de 44px com raio de 5px, padding horizontal de 16px, linhas de pelo menos 55px e divisórias de 0,5px entre linhas, sem borda externa nem fundo no hover. Conteúdo documental pode ampliar a altura; o editor preserva a indicação de células selecionadas.

Os cards das bibliotecas preservam `bg-sidebar` no claro e usam `dark:bg-card` no escuro, acompanhando as superfícies do sistema no Figma `272:2`.

- Hovers usam cores neutras, nunca azul: texto `foreground` e superfícies `action-neutral-hover` com texto `action-neutral-foreground`. O sumário documental também mantém o item ativo em `foreground`, branco no escuro e escuro no claro.

- Sumário lateral alinhado ao topo da coluna documental, sem padding superior; sticky usa `top-8` (32px), acompanhando o recuo do conteúdo no scroll interno do shell.

- `last_edited_by_user_id` registra o ator autenticado ao criar/salvar rascunho de ativo. A leitura mostra `lastEditedBy` da versão publicada, resolvido pelo perfil da conta, em Editado por na barra de metadados. Histórico sem registro fica Não registrado; criador, especialista e publicador não são usados para inferir a última edição.

- Callouts documentais usam tokens `document-info` e `document-attention`, com foreground próprio. No escuro, azul profundo e âmbar profundo substituem fundos pastel; negrito e links herdam a cor do callout para preservar contraste.


- ManagementAssetNavigation oferece três pontos nas categorias ao dono cliente: catálogo Lucide e restaurar ícone. Preferências compartilhadas por empresa no banco; admin lê a mesma ordem/ícones sem editar. Layout resolve organização e preferências, PUT revalida dono e organização. Falhas mantêm o estado anterior e exibem erro. LocalStorage não governa essa navegação. Criação e renomeação seguem o registro persistido descrito abaixo.

- Seletor de ícone usa catálogo completo da versão instalada lucide-react (1.14.0, 1952 entradas), em grade sem nomes visíveis; aria-label preserva identificação. Busca por nome Lucide e carregamento incremental automático de 120 itens ao se aproximar do fim da rolagem, sem botão Carregar mais. JSONs lucide-icon-catalog/names são gerados das exportações __iconNode de dist/esm/dynamicIconImports.mjs (licença ISC do Lucide); regenerar ao atualizar a dependência. Contrato valida nomes canônicos e preserva aliases dos 15 ícones legados.

- Categorias são reordenadas por arraste no próprio item, sem alça visual, com Pointer Events (mouse/touch), limiar de 5px, prévia neutra, captura do ponteiro e salvamento compartilhado ao soltar. Cancelamento não salva. O link aceita Alt + setas para reordenar pelo teclado; clique sem movimento continua navegando. Menu não mostra mais Mover para cima/baixo. Falha restaura a ordem persistida.

- Seletor Lucide usa Popover Base UI não modal, com 320px, ancorado nos três pontos da categoria. Sem backdrop/blur ou bloqueio da página; busca com foco neutro visível e grade de oito colunas com rolagem interna. Posicionamento considera os limites da viewport, Escape e clique fora fecham.

- A reordenação é otimista: ao soltar, a ordem local assume imediatamente a nova posição enquanto o PUT salva. Eventos posteriores de liberação da captura não restauram a ordem antiga. Falha do servidor reverte para as preferências anteriores e mostra erro.


- O leitor oferece Editar ativo na topbar para cliente (dono). Reutiliza RichTextEditor para os quatro tipos, incluindo RACI. Título, resumo e conteúdo são publicados como nova versão ao salvar; cancelar com alterações pede confirmação. Falhas mantêm o texto no editor e beforeunload avisa sobre alterações. Não altera categoria, autor ou responsável.

- As bibliotecas oferecem Quadro (padrão) e Tabela pelo `TabsList variant="selector"` na topbar, antes do filtro de categoria e da busca, via `AppTopbarActionsPortal`. A tabela usa `Table variant="operational"`, com ativo, tipo, autoria e atualização; títulos abrem o mesmo leitor dos cards. Busca e categoria são compartilhadas e preservadas na alternância, inclusive sem resultados. Seleção de visualização é estado da página, sem persistência. Tabela permite rolagem horizontal em telas estreitas.

- Dono cliente com sessão definitiva pode selecionar ativos individualmente ou todos os resultados filtrados somente na Tabela. Quadro não apresenta checkboxes nem ações em lote. Seleção e campos de alteração são limpos ao alternar modos ou mudar busca/categoria. Barra contextual acima da tabela, no fluxo da página para não cobrir linhas após mover o seletor à topbar, oferece Manter tipo/categoria e Aplicar alterações. Categorias vêm de todas as pastas publicadas da sidebar, incluindo padrões vazios, nunca de lista livre. PATCH /api/management-assets/bulk persiste atomicamente; falha preserva seleção. Sucesso atualiza shell/lista e abre a pasta de destino quando há mudança de categoria, evitando página inexistente ao esvaziar uma categoria adicional. Sem edição para admin/superadmin/intents temporários. Limite de 1.000 ativos por lote.

- Checkboxes aparecem no hover da linha/cabeçalho ou no foco por teclado; os marcados e o estado parcial permanecem visíveis. Em dispositivos de ponteiro coarse ficam visíveis para permitir toque. Selecionar todos fica apenas no cabeçalho da tabela, sem controle duplicado. Erros e prévia da categoria ficam dentro da barra flutuante.

- Seletores ocupam uma margem visual de 32px à esquerda, fora da superfície da tabela: sem fundo de cabeçalho nem divisórias nessa coluna. Ativo começa no alinhamento normal da página, com cantos esquerdos do cabeçalho preservados. A margem acompanha a altura real de cada linha e fica dentro do mesmo scroll horizontal.

- Ativos de gestão exibe + no hover/foco do cabeçalho (sempre acessível por toque) ao dono. Popover não modal pede nome e cria categoria vazia persistida, abre sua pasta e conserva a chave estável. Menu da categoria oferece Renomear categoria, Alterar ícone, Restaurar ícone padrão e Excluir categoria. Rename preserva URL, posição e ícone; ativos de todos os estados recebem o novo nome na mesma transação. Falha mantém formulário/texto e mostra erro.

- Excluir categoria no menu abre popover com contagem server-side de todos os documentos, inclusive rascunhos/arquivados. Confirmar fica desabilitado até consultar a contagem e, havendo documentos, escolher outra pasta ou Criar nova categoria com nome válido. Transferência e exclusão são atômicas, sem apagar documentos. Falha preserva formulário e reconsulta contagem. Categoria vazia não exige destino. Sucesso abre destino ou raiz.

- Ícone da pasta integra o link de navegação para todos os papéis. O dono abre Alterar ícone pelos três pontinhos; o popover é ancorado no botão desse menu. Restaurar ícone padrão também fica no menu. O clique direto no ícone navega para a pasta.

- O + do cabeçalho usa right-1 e área de 20px, igual ao SidebarMenuAction dos três pontinhos; os centros permanecem na mesma coluna.

- Leitor (`rich-text-view.tsx`) e editor (`rich-text-editor.tsx`) usam os mesmos tokens de documento: `font-doc`/`font-doc-heading`, `text-doc-h2`, `text-doc-h3`, `text-doc-body` (16/28) em `muted-foreground`, `strong` em 700 e `text-doc-table`. O cabeçalho do ativo usa `text-doc-title` e `font-label text-doc-label` (mono, sem caixa alta). Ver `docs/tokens-de-tipografia.md`.

Apresentação isolada: os mesmos componentes são reutilizados em /demo via AppRuntimeProvider. Links e requisições usam useAppRuntime; o default mantém as URLs/fetch do produto. A fonte local recusa operações desconhecidas, sem encaminhar para serviços reais. Não inserir condições visuais específicas de demo nestes componentes.

C2: o leitor oferece Consultar agente na topbar enquanto está em leitura, inclusive para admin da empresa. O link usa AppRuntime e não envia pergunta automaticamente, nem presume acesso fora da sessão. Durante edição, apenas as ações do editor ficam visíveis.

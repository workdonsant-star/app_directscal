# `/omdx/diagnosticos` — Área operacional

## Propósito

Página autenticada para listar, filtrar, criar e configurar diagnósticos Maturidade.

## Convenções locais

- Usar breadcrumb `Overview / Diagnósticos`.
- Manter o seletor de status e a ação `Criar diagnóstico` na `AppTopbar`, antes do sino; o corpo da página começa diretamente pela mensagem de retorno ou pela tabela.
- Usar o mesmo recuo horizontal das páginas de Dimensões (`px-6 lg:px-10`), com conteúdo em largura total e sem `max-width` ou centralização adicional.
- A tabela segue o mesmo tratamento visual da tabela de perguntas em Dimensões: raio de 5 px, contorno `ring-foreground/10`, cabeçalho `bg-muted/30`, células `px-4 py-4` e ausência de sombra. Preserve overflow horizontal para as dez colunas operacionais.
- Linhas e nomes não navegam para uma tela de compartilhamento. Links por grupo são copiados diretamente da tabela.
- Criação e configuração usam modal centralizada de tela única, campos empilhados e dropdown de seleção múltipla de lideranças. Empresa e template não aparecem; valores continuam definidos pelo servidor.
- Sem salvar rascunho, revisão ou tela de links no pós-criação. Rascunhos anteriores continuam configuráveis.
- Menu oferece Encerrar coleta para pesquisas ativas gerenciáveis, usando POST /api/omdx/diagnostics/[id]/close. Falhas aparecem na lista; ações são bloqueadas durante envio.
- A lista mostra o criador e os setores envolvidos. O Superadmin da empresa vê todos os diagnósticos; um Admin vê os que criou e aqueles aos quais foi atribuído.
- A ativação cria um link de Fundador, um link geral de Liderança e um link de Time por setor selecionado. O link de Fundador é exclusivo do Superadmin da empresa.

- Pesquisas não exibe coluna Prazo. Status, filtros, contadores e ações usam getEffectiveDiagnosticStatus: ativo com prazo vencido em São Paulo ou coleta encerrada manualmente aparece Encerrado; rascunhos permanecem configuráveis. Não altera status no banco ao ler. A tela reavalia a cada minuto e ao recuperar foco.

- loading.tsx reutiliza AppTopbar/AppPage e Table operacional: 12 colunas na mesma ordem/largura da lista, cinco linhas com nome/data, avatar/criador, três links, status, total e volumes por nível, score e ações. Sem título extra, card externo ou coluna Setores/Prazo. Skeleton respeita movimento reduzido e anuncia Carregando pesquisas.

- Os filtros de status na topbar usam `TabsList variant="selector"` compacto (intervalo de 4px, sem container nem pílula no contador), no mesmo padrão visual dos filtros de Action Points. A contagem aparece como número simples em `text-muted-foreground`.

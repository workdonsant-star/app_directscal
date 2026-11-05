# `/omdx/diagnosticos` — Área operacional

## Propósito

Página autenticada para listar, filtrar, criar e configurar diagnósticos Maturidade.

## Convenções locais

- Usar breadcrumb `Overview / Diagnósticos`.
- Manter o seletor de status e a ação `Criar diagnóstico` na `AppTopbar`, antes do sino; o corpo da página começa diretamente pela mensagem de retorno ou pela tabela.
- Usar o mesmo recuo horizontal das páginas de Dimensões (`px-6 lg:px-10`), com conteúdo em largura total e sem `max-width` ou centralização adicional.
- A tabela segue o mesmo tratamento visual da tabela de perguntas em Dimensões: raio de 5 px, contorno `ring-foreground/10`, cabeçalho `bg-muted/30`, células `px-4 py-4` e ausência de sombra. Preserve overflow horizontal para as dez colunas operacionais.
- Linhas e nomes não navegam para uma tela de compartilhamento. Links por grupo são copiados diretamente da tabela.
- Criação e configuração usam modal centralizada de tela única apenas com nome, prazo e descrição. Empresa e template não aparecem; valores continuam definidos pelo servidor. As lideranças ativas cadastradas são associadas automaticamente pela API.
- Sem salvar rascunho, revisão ou tela de links no pós-criação. Rascunhos anteriores continuam configuráveis.
- Menu oferece Encerrar coleta para pesquisas ativas gerenciáveis, usando POST /api/omdx/diagnostics/[id]/close. Falhas aparecem na lista; ações são bloqueadas durante envio.
- A lista mostra o criador e os setores envolvidos. O Superadmin da empresa vê todos os diagnósticos; um Admin vê os que criou e aqueles aos quais foi atribuído.
- A ativação cria um link de Fundador, um link geral de Liderança e um link de Time por setor com liderança ativa. Sem setores configurados, cria um link geral de Time. O link de Fundador é exclusivo do Superadmin da empresa.

- Pesquisas não exibe coluna Prazo. Status, filtros, contadores e ações usam getEffectiveDiagnosticStatus: ativo com prazo vencido em São Paulo ou coleta encerrada manualmente aparece Encerrado; rascunhos permanecem configuráveis. Não altera status no banco ao ler. A tela reavalia a cada minuto e ao recuperar foco.

- `loading.tsx` usa skeletons dos filtros e da tabela de Pesquisas dentro do shell.

- A coluna Dados CSV baixa as respostas concluídas de cada pesquisa via `/omdx/[id]/respostas`, mesmo antes de publicar o relatório. Sem respostas, o botão fica desativado. Na demo, fica desativado porque as contagens são agregadas fictícias.

- Os filtros de status na topbar usam `TabsList variant="selector"` compacto (intervalo de 4px, sem container nem pílula no contador), no mesmo padrão visual dos filtros de Action Points. A contagem aparece como número simples em `text-muted-foreground`.
